import { spawn } from "node:child_process";
import { request } from "node:http";
import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function probeReady(port) {
  return new Promise((resolveReady) => {
    const req = request({ hostname: "127.0.0.1", port, path: "/ready", method: "GET", timeout: 2_000, agent: false }, (res) => { res.resume(); resolveReady(res.statusCode === 200); });
    req.on("timeout", () => req.destroy());
    req.on("error", () => resolveReady(false));
    req.end();
  });
}

/** Own cloudflared in a child process and stop it when ZadLoop's IPC disappears. */
export function createTunnelSupervisor(settings, dependencies = {}) {
  const spawnChild = dependencies.spawnChild ?? spawn;
  const probe = dependencies.probe ?? probeReady;
  const send = dependencies.send ?? (() => {});
  const removeDirectory = dependencies.removeDirectory ?? (() => settings.directory ? rm(settings.directory, { recursive: true, force: true }) : Promise.resolve());
  const healthInterval = dependencies.healthInterval ?? 3_000;
  const restartBase = dependencies.restartBase ?? 1_000;
  const forceAfter = dependencies.forceAfter ?? 3_000;
  let child;
  let restartTimer;
  let healthTimer;
  let stopped = false;
  let stopPromise;
  let state;
  let failures = 0;
  let probing = false;
  let outputBuffer = "";
  const setState = (next) => { if (state !== next) { state = next; send({ type: "state", state: next }); } };

  async function checkHealth(owned) {
    if (stopped || child !== owned || probing || !settings.metricsPort) return;
    probing = true;
    try { const ready = await probe(settings.metricsPort); if (stopped || child !== owned) return; if (ready) failures = 0; setState(ready ? "ready" : "reconnecting"); }
    catch { if (!stopped && child === owned) setState("reconnecting"); }
    finally { probing = false; }
  }

  function scheduleRestart() {
    if (stopped) return;
    setState("reconnecting");
    const delay = Math.min(30_000, restartBase * 2 ** Math.min(failures++, 5));
    restartTimer = setTimeout(launch, delay);
  }

  function inspectOutput(chunk) {
    outputBuffer += String(chunk);
    const lines = outputBuffer.split(/\r?\n/u);
    outputBuffer = lines.pop() ?? "";
    for (const line of lines) {
      const match = /https:\/\/[a-z0-9-]+\.trycloudflare\.com\/?/iu.exec(line);
      if (match) send({ type: "url", url: match[0] });
      if (/registered tunnel connection/iu.test(line)) { failures = 0; setState("ready"); }
      if (/\b(?:ERR|error|failed|unable)\b/iu.test(line)) send({ type: "diagnostic", message: line.replace(/\s+/gu, " ").trim().slice(-500) });
    }
  }

  function launch() {
    if (stopped) return;
    setState("starting");
    let owned;
    try { owned = spawnChild(settings.binary, settings.args, { windowsHide: true, stdio: ["ignore", "pipe", "pipe"], env: settings.environment ?? process.env }); }
    catch { scheduleRestart(); return; }
    child = owned;
    owned.stdout?.on("data", inspectOutput);
    owned.stderr?.on("data", inspectOutput);
    owned.once("spawn", () => {
      if (stopped || child !== owned) { try { owned.kill("SIGTERM"); } catch {} return; }
      send({ type: "child", pid: owned.pid }); send({ type: "launched", pid: owned.pid });
      if (settings.metricsPort) { void checkHealth(owned); healthTimer = setInterval(() => void checkHealth(owned), healthInterval); }
    });
    owned.on("error", () => { if (!stopped) setState("reconnecting"); });
    owned.once("close", () => { if (child !== owned) return; child = undefined; send({ type: "child", pid: null }); clearInterval(healthTimer); scheduleRestart(); });
  }

  launch();
  return {
    status: () => state,
    stop() {
      if (stopPromise) return stopPromise;
      stopped = true; clearTimeout(restartTimer); clearInterval(healthTimer); setState("stopped");
      stopPromise = (async () => {
        const owned = child;
        if (owned) await new Promise((resolveStop) => { const timer = setTimeout(() => { try { owned.kill("SIGKILL"); } catch {} }, forceAfter); owned.once("close", () => { clearTimeout(timer); resolveStop(); }); try { owned.kill("SIGTERM"); } catch { clearTimeout(timer); resolveStop(); } });
        await removeDirectory();
      })();
      return stopPromise;
    },
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let supervisor;
  let stopping = false;
  const send = (message) => { if (process.connected) try { process.send(message, () => {}); } catch {} };
  async function stop() { if (stopping) return; stopping = true; try { await supervisor?.stop(); } finally { process.exit(0); } }
  process.on("message", (message) => {
    if (message?.type === "stop") { void stop(); return; }
    if (message?.type === "start" && !supervisor && !stopping) supervisor = createTunnelSupervisor(message, { send });
  });
  process.on("disconnect", () => void stop());
  process.on("SIGTERM", () => void stop());
  process.on("SIGINT", () => void stop());
  if (!process.connected) void stop();
}
