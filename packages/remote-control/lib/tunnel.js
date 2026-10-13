import { spawn } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:net";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
const HOSTNAME = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/iu;

export function childEnvironment(environment = process.env) {
  const allowed = new Set(["path", "systemroot", "windir", "temp", "tmp", "localappdata", "appdata", "userprofile", "home", "programfiles", "programfiles(x86)", "programdata", "http_proxy", "https_proxy", "all_proxy", "no_proxy"]);
  return Object.fromEntries(Object.entries(environment).filter(([key]) => allowed.has(key.toLowerCase())));
}

export async function findCloudflared(explicit, environment = process.env) {
  const executable = process.platform === "win32" ? "cloudflared.exe" : "cloudflared";
  const candidates = explicit ? [explicit] : [
    environment["ProgramFiles(x86)"] && join(environment["ProgramFiles(x86)"], "cloudflared", executable),
    environment.ProgramFiles && join(environment.ProgramFiles, "cloudflared", executable),
    environment.LOCALAPPDATA && join(environment.LOCALAPPDATA, "Microsoft", "WinGet", "Links", executable),
    ...String(environment.PATH ?? environment.Path ?? "").split(process.platform === "win32" ? ";" : ":").filter(Boolean).map((folder) => join(folder, executable)),
  ].filter(Boolean);
  for (const binary of candidates) { if (!isAbsolute(binary)) continue; try { await access(binary, constants.F_OK); return binary; } catch {} }
  throw new Error("cloudflared was not found. Install it with winget install Cloudflare.cloudflared, then retry.");
}

export function validateNamedTunnel({ id, hostname, credentialsFile }) {
  if (!UUID.test(id ?? "")) throw new Error("Enter a valid Cloudflare Tunnel UUID.");
  if (!HOSTNAME.test(hostname ?? "")) throw new Error("Enter a valid custom-domain hostname.");
  if (credentialsFile !== undefined && !isAbsolute(credentialsFile)) throw new Error("The credentials path must be absolute.");
}

export function renderTunnelConfig({ id, hostname, credentialsFile, port, metricsPort, logFile }) {
  validateNamedTunnel({ id, hostname, credentialsFile });
  for (const number of [port, metricsPort]) if (!Number.isInteger(number) || number < 1 || number > 65_535) throw new Error("Invalid tunnel port.");
  return `tunnel: ${JSON.stringify(id)}\ncredentials-file: ${JSON.stringify(credentialsFile)}\nno-autoupdate: true\nmetrics: ${JSON.stringify(`127.0.0.1:${metricsPort}`)}\nlogfile: ${JSON.stringify(logFile)}\nloglevel: info\ngrace-period: 2s\ningress:\n  - hostname: ${JSON.stringify(hostname)}\n    service: ${JSON.stringify(`http://127.0.0.1:${port}`)}\n  - service: http_status:404\n`;
}

async function reservePort() { const server = createServer(); await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); }); const port = server.address().port; await new Promise((resolve) => server.close(resolve)); return port; }

async function launchSupervisor(settings, dependencies = {}) {
  const spawnSupervisor = dependencies.spawnSupervisor ?? spawn;
  let supervisor;
  let childPid;
  let stopped = false;
  let state = "starting";
  let publicUrl = settings.publicUrl ?? null;
  let diagnostic = "";
  let stopPromise;
  supervisor = spawnSupervisor(dependencies.nodeExecutable ?? process.execPath, [fileURLToPath(new URL("./supervisor.js", import.meta.url))], {
    windowsHide: true, stdio: ["ignore", "ignore", "ignore", "ipc"], env: { ...childEnvironment(dependencies.environment ?? process.env), ELECTRON_RUN_AS_NODE: "1" },
  });
  const killOwned = () => { if (!childPid) return; const pid = childPid; childPid = undefined; try { (dependencies.killProcess ?? process.kill)(pid, "SIGKILL"); } catch {} };
  const exited = new Promise((resolve) => { supervisor.once("exit", () => { killOwned(); resolve(); }); supervisor.once("error", () => { if (!supervisor.pid) resolve(); }); supervisor.once("close", () => { killOwned(); resolve(); }); });
  let failStartup;
  const started = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Cloudflare tunnel supervisor did not start.")), 10_000);
    const finish = (error) => { clearTimeout(timeout); error ? reject(error) : resolve(); };
    failStartup = () => finish(new Error("Unable to configure the tunnel supervisor."));
    supervisor.once("error", () => finish(new Error("Unable to launch the tunnel supervisor.")));
    supervisor.once("exit", () => finish(new Error("Tunnel supervisor exited during startup.")));
    supervisor.on("message", (message) => { if (message?.type === "launched") { childPid = message.pid; finish(); } if (message?.type === "child") childPid = message.pid; if (message?.type === "state" && !stopped) state = message.state; if (message?.type === "url") publicUrl = message.url; if (message?.type === "diagnostic") diagnostic = message.message; });
  });
  supervisor.on("error", () => {});
  supervisor.on("exit", () => { killOwned(); if (!stopped) state = "failed"; });
  const stop = () => {
    if (stopPromise) return stopPromise;
    stopped = true; state = "stopped";
    stopPromise = (async () => { if (supervisor.connected) try { supervisor.send({ type: "stop" }, () => {}); } catch {} const timer = setTimeout(() => { killOwned(); try { supervisor.kill("SIGKILL"); } catch {} }, 6_000); await exited; clearTimeout(timer); if (settings.directory) await rm(settings.directory, { recursive: true, force: true }); })();
    return stopPromise;
  };
  try { supervisor.send({ type: "start", ...settings }, (error) => { if (error) failStartup(); }); await started; }
  catch (error) { failStartup(); await started.catch(() => {}); await stop(); throw error; }
  return { stop, status: () => state, publicUrl: () => publicUrl, diagnostic: () => diagnostic };
}

export async function startQuickTunnel(config, port, dependencies = {}) {
  const binary = await findCloudflared(config.binary, dependencies.environment ?? process.env);
  const directory = await mkdtemp(join(dependencies.tempRoot ?? tmpdir(), "zadloop-quick-tunnel-"));
  const configPath = join(directory, "config.yml");
  try {
    // An existing ~/.cloudflared/config.yml can override Quick Tunnel routing
    // (commonly with a catch-all http_status:404 ingress). Always isolate the
    // one-click tunnel from account/named-tunnel configuration on the machine.
    await writeFile(configPath, "no-autoupdate: true\n", { mode: 0o600 });
    return await launchSupervisor({ binary, args: ["tunnel", "--config", configPath, "--no-autoupdate", "--protocol", "http2", "--url", `http://127.0.0.1:${port}`], environment: childEnvironment(dependencies.environment ?? process.env), directory }, dependencies);
  } catch (error) {
    await rm(directory, { recursive: true, force: true });
    throw error;
  }
}

export async function startNamedTunnel(config, port, dependencies = {}) {
  validateNamedTunnel(config);
  const home = dependencies.home ?? homedir();
  const binary = await findCloudflared(config.binary, dependencies.environment ?? process.env);
  const credentialsFile = config.credentialsFile || join(home, ".cloudflared", `${config.id}.json`);
  let credentials;
  try { credentials = JSON.parse(await readFile(credentialsFile, "utf8")); } catch { throw new Error("Cloudflare tunnel credentials are missing or invalid."); }
  if (credentials.TunnelID?.toLowerCase() !== config.id.toLowerCase() || typeof credentials.TunnelSecret !== "string" || typeof credentials.AccountTag !== "string") throw new Error("The credentials file does not belong to this tunnel.");
  credentials = undefined;
  const directory = await mkdtemp(join(dependencies.tempRoot ?? tmpdir(), "zadloop-remote-tunnel-"));
  const configPath = join(directory, "config.yml");
  const logFile = config.logFile || join(home, ".zadloop-remote-control", "cloudflared.log");
  try {
    await mkdir(dirname(logFile), { recursive: true });
    const metricsPort = await reservePort();
    await writeFile(configPath, renderTunnelConfig({ id: config.id, hostname: config.hostname, credentialsFile, port, metricsPort, logFile }), { mode: 0o600 });
    return await launchSupervisor({ binary, args: ["tunnel", "--config", configPath, "--no-autoupdate", "run", config.id], environment: childEnvironment(dependencies.environment ?? process.env), directory, metricsPort, publicUrl: `https://${config.hostname}/` }, dependencies);
  } catch (error) { await rm(directory, { recursive: true, force: true }); throw error; }
}
