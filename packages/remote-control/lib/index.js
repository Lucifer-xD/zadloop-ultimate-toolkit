import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { homedir, networkInterfaces } from "node:os";
import { dirname, join } from "node:path";

import { createRemoteProxy, hashPassphrase, mintUpstreamCookie } from "./proxy.js";
import { findCloudflared, startNamedTunnel, startQuickTunnel, validateNamedTunnel } from "./tunnel.js";

export const name = "zadloop-remote-control";
export const inject = ["webServer", "connection"];
export const API_PATH = "/api/zadloop-remote-control";
export const DEFAULT_CONFIG_PATH = join(homedir(), ".zadloop-remote-control", "config-v2.json");

const MODES = new Set(["local", "lan", "quick", "named"]);

function cleanString(value, max = 500) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
function portNumber(value) { const number = Number(value); if (!Number.isInteger(number) || number < 1024 || number > 65_535) throw new Error("Port must be an integer from 1024 to 65535."); return number; }
function sessionHours(value) { const number = Number(value); if (![1, 8, 24, 168].includes(number)) throw new Error("Session lifetime must be 1, 8, 24, or 168 hours."); return number; }

export function generateAccessCode() {
  return randomBytes(12).toString("base64url").match(/.{1,4}/gu).join("-");
}

function wingetExecutable(environment = process.env) {
  const explicit = environment.LOCALAPPDATA && join(environment.LOCALAPPDATA, "Microsoft", "WindowsApps", "winget.exe");
  return explicit && existsSync(explicit) ? explicit : "winget.exe";
}

export async function installCloudflared(dependencies = {}) {
  if (process.platform !== "win32" && !dependencies.allowNonWindows) throw new Error("Automatic cloudflared installation currently supports Windows only.");
  const environment = dependencies.environment ?? process.env;
  const spawnImpl = dependencies.spawnImpl ?? spawn;
  const findImpl = dependencies.findImpl ?? findCloudflared;
  try { return await findImpl(undefined, environment); } catch {}
  const args = ["install", "--id", "Cloudflare.cloudflared", "--exact", "--silent", "--accept-package-agreements", "--accept-source-agreements", "--disable-interactivity"];
  await new Promise((resolve, reject) => {
    const child = spawnImpl(wingetExecutable(environment), args, { windowsHide: true, stdio: ["ignore", "pipe", "pipe"], env: environment });
    let output = "";
    const collect = (chunk) => { if (output.length < 16_000) output += String(chunk); };
    child.stdout?.on("data", collect);
    child.stderr?.on("data", collect);
    const timer = setTimeout(() => { child.kill(); reject(new Error("Cloudflare installation timed out after five minutes.")); }, 5 * 60_000);
    timer.unref?.();
    child.once("error", (error) => { clearTimeout(timer); reject(new Error(`Unable to start Windows Package Manager: ${error.message}`)); });
    child.once("exit", (code) => { clearTimeout(timer); if (code === 0) resolve(); else reject(new Error(`Windows Package Manager could not install cloudflared (${code}). ${output.trim().slice(-800)}`)); });
  });
  try { return await findImpl(undefined, environment); }
  catch { throw new Error("cloudflared finished installing but was not found. Restart ZadLoop once, then click Create secure remote link again."); }
}

export function validateConfiguration(value, previous = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Configuration must be an object.");
  const mode = cleanString(value.mode || previous.mode || "local", 20);
  if (!MODES.has(mode)) throw new Error("Mode must be local, lan, quick, or named.");
  const result = {
    version: 2,
    mode,
    port: portNumber(value.port ?? previous.port ?? 48911),
    sessionHours: sessionHours(value.sessionHours ?? previous.sessionHours ?? 8),
    enabled: value.enabled === true,
    password: previous.password,
    cloudflare: {
      binary: cleanString(value.cloudflare?.binary ?? previous.cloudflare?.binary, 1_000),
      id: cleanString(value.cloudflare?.id ?? previous.cloudflare?.id, 100),
      hostname: cleanString(value.cloudflare?.hostname ?? previous.cloudflare?.hostname, 253).toLowerCase(),
      credentialsFile: cleanString(value.cloudflare?.credentialsFile ?? previous.cloudflare?.credentialsFile, 1_000),
    },
  };
  if (mode === "named") validateNamedTunnel(result.cloudflare);
  return result;
}

function lanAddresses(port) {
  const urls = [];
  for (const entries of Object.values(networkInterfaces())) for (const entry of entries ?? []) if (entry.family === "IPv4" && !entry.internal) urls.push(`http://${entry.address}:${port}/`);
  return [...new Set(urls)];
}

async function atomicJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  await rename(temporary, path);
}

export class RemoteController {
  constructor({ webServer, connection, logger, configPath = DEFAULT_CONFIG_PATH, installCloudflaredImpl = installCloudflared, startQuickTunnelImpl = startQuickTunnel, startNamedTunnelImpl = startNamedTunnel }) {
    this.webServer = webServer;
    this.connection = connection;
    this.logger = logger;
    this.configPath = configPath;
    this.installCloudflaredImpl = installCloudflaredImpl;
    this.startQuickTunnelImpl = startQuickTunnelImpl;
    this.startNamedTunnelImpl = startNamedTunnelImpl;
    this.config = validateConfiguration({ mode: "local", port: 48911, sessionHours: 8, enabled: false });
    this.proxy = undefined;
    this.tunnel = undefined;
    this.startedAt = undefined;
    this.error = "";
    this.busy = false;
  }

  async initialize() {
    try {
      const stored = JSON.parse(await readFile(this.configPath, "utf8"));
      this.config = validateConfiguration(stored, stored);
      if (stored.password?.algorithm === "scrypt") this.config.password = stored.password;
    } catch (error) {
      if (error?.code !== "ENOENT") this.error = "Saved Remote Control settings were invalid and were not activated.";
    }
    if (this.config.enabled) {
      try { await this.start({ persist: false }); }
      catch (error) { this.error = error instanceof Error ? error.message : String(error); this.config.enabled = false; await this.save(); }
    }
  }

  publicConfig() {
    return {
      mode: this.config.mode,
      port: this.config.port,
      sessionHours: this.config.sessionHours,
      hasPassword: Boolean(this.config.password),
      cloudflare: { binary: this.config.cloudflare.binary, id: this.config.cloudflare.id, hostname: this.config.cloudflare.hostname, credentialsFile: this.config.cloudflare.credentialsFile },
    };
  }

  snapshot() {
    const running = Boolean(this.proxy);
    const urls = [];
    if (running) {
      if (this.config.mode === "local") urls.push(`http://127.0.0.1:${this.config.port}/`);
      if (this.config.mode === "lan") urls.push(...lanAddresses(this.config.port));
      const publicUrl = this.tunnel?.publicUrl();
      if (publicUrl) urls.push(publicUrl);
    }
    return {
      ok: true,
      running,
      busy: this.busy,
      mode: this.config.mode,
      urls,
      tunnelState: this.tunnel?.status() ?? (running && ["quick", "named"].includes(this.config.mode) ? "starting" : "disabled"),
      tunnelMessage: this.tunnel?.diagnostic?.() ?? "",
      sessions: this.proxy?.sessions.count() ?? 0,
      startedAt: this.startedAt,
      error: this.error,
      config: this.publicConfig(),
      security: { passwordRequired: this.config.mode !== "local", passwordConfigured: Boolean(this.config.password), access: "Full ZadLoop operator interface", loginLimit: "5 attempts per 15 minutes" },
    };
  }

  async save() { await atomicJson(this.configPath, this.config); }

  async configure(input) {
    const shouldStart = input.start === true;
    await this.stop({ persist: false });
    const next = validateConfiguration({ ...input, enabled: false }, this.config);
    if (typeof input.passphrase === "string" && input.passphrase.length > 0) next.password = await hashPassphrase(input.passphrase);
    else next.password = this.config.password;
    if (input.clearPassword === true) {
      if (next.mode !== "local") throw new Error("A passphrase is required outside Local browser mode.");
      next.password = undefined;
    }
    if (next.mode !== "local" && !next.password) throw new Error("Set a passphrase before enabling LAN or Cloudflare access.");
    this.config = next;
    this.error = "";
    await this.save();
    if (shouldStart) await this.start();
    return this.snapshot();
  }

  async quickStart() {
    await this.stop({ persist: false });
    const accessCode = generateAccessCode();
    const binary = await this.installCloudflaredImpl();
    const next = validateConfiguration({ mode: "quick", port: this.config.port || 48911, sessionHours: this.config.sessionHours || 8, enabled: false, cloudflare: { ...this.config.cloudflare, binary } }, this.config);
    next.password = await hashPassphrase(accessCode);
    this.config = next;
    this.error = "";
    await this.save();
    const state = await this.start();
    return { ...state, accessCode };
  }

  async start({ persist = true } = {}) {
    if (this.proxy) return this.snapshot();
    if (this.busy) throw new Error("Remote Control is already changing state.");
    this.busy = true;
    this.error = "";
    try {
      if (this.config.mode !== "local" && !this.config.password) throw new Error("A passphrase is required for network remote access.");
      const upstreamPort = this.webServer.port;
      if (!Number.isInteger(upstreamPort) || upstreamPort < 1) throw new Error("ZadLoop's web server is not ready.");
      if (this.config.port === upstreamPort) throw new Error("Remote Control port conflicts with ZadLoop's internal web server.");
      const upstream = `http://127.0.0.1:${upstreamPort}`;
      let credential;
      const getCookie = () => { if (!credential || Date.now() >= credential.refreshAt) credential = mintUpstreamCookie(this.connection, upstream); return credential.cookie; };
      getCookie();
      const proxy = createRemoteProxy({
        upstream, getCookie, passwordRecord: this.config.password, passwordless: this.config.mode === "local" && !this.config.password,
        sessionHours: this.config.sessionHours,
        status: () => ({ running: true, mode: this.config.mode, startedAt: this.startedAt, sessions: this.proxy?.sessions.count() ?? 0 }),
      });
      const host = this.config.mode === "lan" ? "0.0.0.0" : "127.0.0.1";
      try {
        await proxy.listen(this.config.port, host);
        this.proxy = proxy;
        if (this.config.mode === "quick") this.tunnel = await this.startQuickTunnelImpl(this.config.cloudflare, this.config.port);
        if (this.config.mode === "named") this.tunnel = await this.startNamedTunnelImpl(this.config.cloudflare, this.config.port);
      } catch (error) { await proxy.close(); this.proxy = undefined; await this.tunnel?.stop(); this.tunnel = undefined; if (error?.code === "EADDRINUSE") throw new Error(`Port ${this.config.port} is already in use.`); throw error; }
      this.startedAt = Date.now();
      this.config.enabled = true;
      if (persist) await this.save();
      this.logger?.info?.(`Remote Control started in ${this.config.mode} mode on port ${this.config.port}.`);
      return this.snapshot();
    } catch (error) { this.error = error instanceof Error ? error.message : String(error); throw error; }
    finally { this.busy = false; }
  }

  async stop({ persist = true } = {}) {
    if (this.busy) throw new Error("Remote Control is already changing state.");
    this.busy = true;
    try {
      const proxy = this.proxy; const tunnel = this.tunnel;
      this.proxy = undefined; this.tunnel = undefined; this.startedAt = undefined;
      try { await proxy?.close(); } finally { await tunnel?.stop(); }
      this.config.enabled = false;
      if (persist) await this.save();
      return this.snapshot();
    } finally { this.busy = false; }
  }

  revoke() { this.proxy?.revokeAll(); return this.snapshot(); }
  async detectCloudflared() { return findCloudflared(this.config.cloudflare.binary || undefined); }
  async dispose() { try { await this.stop({ persist: false }); } catch {} }
}

function apiRoute(controller) {
  return {
    path: API_PATH,
    methods: ["GET", "POST"],
    requestBody: "buffered",
    fetch: async (request) => {
      if (request.method === "GET") return Response.json(controller.snapshot());
      let body;
      try { body = await request.json(); } catch { return Response.json({ ok: false, message: "Invalid JSON body." }, { status: 400 }); }
      try {
        if (body?.operation === "configure") return Response.json(await controller.configure(body));
        if (body?.operation === "quick_start") return Response.json(await controller.quickStart());
        if (body?.operation === "start") return Response.json(await controller.start());
        if (body?.operation === "stop") return Response.json(await controller.stop());
        if (body?.operation === "revoke") return Response.json(controller.revoke());
        if (body?.operation === "detect_cloudflared") return Response.json({ ok: true, path: await controller.detectCloudflared() });
        return Response.json({ ok: false, message: "Unknown Remote Control operation." }, { status: 400 });
      } catch (error) { return Response.json({ ok: false, message: error instanceof Error ? error.message : String(error), state: controller.snapshot() }, { status: 400 }); }
    },
  };
}

export function apply(ctx) {
  const controller = new RemoteController({ webServer: ctx.webServer, connection: ctx.connection, logger: ctx.logger });
  ctx.effect(() => ctx.connection.fetch.register(apiRoute(controller)), "zadloop-remote-control: settings API");
  ctx.effect(async () => { await controller.initialize(); return () => controller.dispose(); }, "zadloop-remote-control: runtime");
}
