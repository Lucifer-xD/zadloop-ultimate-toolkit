import assert from "node:assert/strict";
import { createServer, request } from "node:http";
import { EventEmitter } from "node:events";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { generateAccessCode, installCloudflared, RemoteController, validateConfiguration } from "../lib/index.js";
import { createRemoteProxy, hashPassphrase, verifyPassphrase } from "../lib/proxy.js";
import { childEnvironment, renderTunnelConfig, validateNamedTunnel } from "../lib/tunnel.js";

const upstreamSecret = "dsh-auth-test=private";

function call(origin, path = "/", options = {}) {
  return new Promise((resolve, reject) => {
    const outgoing = request(`${origin}${path}`, { method: options.method ?? "GET", headers: options.headers, agent: false }, (incoming) => {
      const chunks = [];
      incoming.on("data", (chunk) => chunks.push(chunk));
      incoming.on("error", reject);
      incoming.on("end", () => resolve({ status: incoming.statusCode, headers: incoming.headers, body: Buffer.concat(chunks).toString("utf8") }));
    });
    outgoing.on("error", reject);
    outgoing.end(options.body);
  });
}

async function fixture(t, proxyOptions = {}) {
  const upstream = createServer((req, res) => {
    if (req.headers.cookie !== upstreamSecret) { res.writeHead(401); res.end("denied"); return; }
    res.setHeader("set-cookie", upstreamSecret);
    res.setHeader("content-type", "application/json");
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => res.end(JSON.stringify({ method: req.method, url: req.url, body: Buffer.concat(chunks).toString("utf8"), cookie: req.headers.cookie })));
  });
  await new Promise((resolve, reject) => { upstream.once("error", reject); upstream.listen(0, "127.0.0.1", resolve); });
  const proxy = createRemoteProxy({ upstream: `http://127.0.0.1:${upstream.address().port}`, getCookie: () => upstreamSecret, ...proxyOptions });
  await proxy.listen(0, "127.0.0.1");
  const origin = `http://127.0.0.1:${proxy.server.address().port}`;
  t.after(async () => { await proxy.close(); await new Promise((resolve) => { upstream.close(resolve); upstream.closeAllConnections(); }); });
  return { proxy, origin };
}

test("passphrases are salted, slow-hashed, and timing-safe verified", async () => {
  const first = await hashPassphrase("a correct horse battery staple");
  const second = await hashPassphrase("a correct horse battery staple");
  assert.notEqual(first.salt, second.salt);
  assert.notEqual(first.hash, second.hash);
  assert.equal(await verifyPassphrase("a correct horse battery staple", first), true);
  assert.equal(await verifyPassphrase("wrong password", first), false);
  await assert.rejects(hashPassphrase("too short"), /12/);
});

test("one-click access codes are strong, readable, and never contain ambiguous punctuation", () => {
  const values = new Set(Array.from({ length: 20 }, () => generateAccessCode()));
  assert.equal(values.size, 20);
  for (const value of values) assert.match(value, /^[A-Za-z0-9_-]{4}(?:-[A-Za-z0-9_-]{4}){3}$/u);
});

test("automatic cloudflared installation uses one fixed winget package and silent consent flags", async () => {
  let lookup = 0;
  let invoked;
  const result = await installCloudflared({
    allowNonWindows: true,
    environment: { PATH: "C:\\Windows", LOCALAPPDATA: "C:\\Missing" },
    async findImpl() { lookup += 1; if (lookup === 1) throw new Error("missing"); return "C:\\Tools\\cloudflared.exe"; },
    spawnImpl(executable, args, options) {
      invoked = { executable, args, options };
      const child = new EventEmitter();
      child.stdout = new EventEmitter();
      child.stderr = new EventEmitter();
      child.kill = () => {};
      queueMicrotask(() => child.emit("exit", 0));
      return child;
    },
  });
  assert.equal(result, "C:\\Tools\\cloudflared.exe");
  assert.equal(invoked.executable, "winget.exe");
  assert.deepEqual(invoked.args, ["install", "--id", "Cloudflare.cloudflared", "--exact", "--silent", "--accept-package-agreements", "--accept-source-agreements", "--disable-interactivity"]);
  assert.equal(invoked.options.windowsHide, true);
});

test("one-click controller stores only a hash and returns the generated code once", async (t) => {
  const temporary = await mkdtemp(join(tmpdir(), "zrc-one-click-"));
  const reservation = createServer();
  await new Promise((resolve) => reservation.listen(0, "127.0.0.1", resolve));
  const port = reservation.address().port;
  await new Promise((resolve) => reservation.close(resolve));
  const tunnel = { status: () => "ready", publicUrl: () => "https://example.trycloudflare.com/", stop: async () => {} };
  const controller = new RemoteController({
    webServer: { port: 34567 },
    connection: {
      authenticatedUrl(url) { return `${url}?token=private`; },
      authorizeIndex(_req, res) { res.writeHead(303, { "set-cookie": "dsh-auth-test=v1.private; Max-Age=60; HttpOnly" }); res.end(); return false; },
    },
    configPath: join(temporary, "config.json"),
    installCloudflaredImpl: async () => "C:\\Tools\\cloudflared.exe",
    startQuickTunnelImpl: async () => tunnel,
  });
  controller.config.port = port;
  t.after(async () => { await controller.dispose(); await rm(temporary, { recursive: true, force: true }); });
  const state = await controller.quickStart();
  assert.match(state.accessCode, /^[A-Za-z0-9_-]{4}(?:-[A-Za-z0-9_-]{4}){3}$/u);
  assert.equal(state.running, true);
  assert.deepEqual(state.urls, ["https://example.trycloudflare.com/"]);
  const saved = JSON.parse(await readFile(join(temporary, "config.json"), "utf8"));
  assert.equal(saved.password.algorithm, "scrypt");
  assert.equal(JSON.stringify(saved).includes(state.accessCode), false);
  assert.equal(saved.cloudflare.binary, "C:\\Tools\\cloudflared.exe");
});

test("passwordless loopback proxy forwards the full app without leaking upstream credentials", async (t) => {
  const { origin } = await fixture(t, { passwordless: true });
  const response = await call(origin, "/api/example?token=visitor", { method: "POST", body: "hello" });
  assert.equal(response.status, 200);
  assert.equal(response.headers["set-cookie"], undefined);
  const value = JSON.parse(response.body);
  assert.equal(value.url, "/api/example?token=visitor");
  assert.equal(value.body, "hello");
  assert.equal(value.cookie, upstreamSecret);
  assert.equal(response.body.includes("zrc_session"), false);
});

test("network proxy requires login, establishes an expiring session, and revokes it", async (t) => {
  const passwordRecord = await hashPassphrase("this is a remote passphrase");
  const { proxy, origin } = await fixture(t, { passwordRecord, sessionHours: 1 });
  const anonymous = await call(origin, "/api/private");
  assert.equal(anonymous.status, 303);
  assert.match(anonymous.headers.location, /^\/__zadloop_remote__\/login/);
  const loginPage = await call(origin, anonymous.headers.location);
  assert.equal(loginPage.status, 200);
  assert.match(loginPage.body, /backdrop-filter:blur\(38px\) saturate\(1\.6\)/);
  assert.match(loginPage.body, /@media\(prefers-color-scheme:light\)/);
  const bad = await call(origin, "/__zadloop_remote__/login", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: "password=wrong&next=%2Fapi%2Fprivate" });
  assert.equal(bad.status, 401);
  const login = await call(origin, "/__zadloop_remote__/login", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: "password=this+is+a+remote+passphrase&next=%2Fapi%2Fprivate" });
  assert.equal(login.status, 303);
  assert.equal(login.headers.location, "/api/private");
  const cookie = login.headers["set-cookie"][0].split(";", 1)[0];
  assert.match(cookie, /^zrc_session=/);
  assert.equal(cookie.includes(upstreamSecret), false);
  const privateResponse = await call(origin, "/api/private", { headers: { cookie } });
  assert.equal(privateResponse.status, 200);
  assert.equal(proxy.sessions.count(), 1);
  proxy.revokeAll();
  assert.equal(proxy.sessions.count(), 0);
  assert.equal((await call(origin, "/api/private", { headers: { cookie } })).status, 303);
});

test("cross-site requests and unauthenticated websocket upgrades are rejected", async (t) => {
  const passwordRecord = await hashPassphrase("this is a remote passphrase");
  const { origin } = await fixture(t, { passwordRecord });
  const crossSite = await call(origin, "/", { headers: { origin: "https://attacker.invalid", "sec-fetch-site": "cross-site" } });
  assert.equal(crossSite.status, 403);
  const upgrade = await call(origin, "/api/remote.mux", { headers: { connection: "Upgrade", upgrade: "websocket", "sec-websocket-key": "dGhlIHNhbXBsZSBub25jZQ==", "sec-websocket-version": "13" } });
  assert.equal(upgrade.status, 401);
});

test("cross-site link clicks may reach login but unsafe cross-site requests remain blocked", async (t) => {
  const passwordRecord = await hashPassphrase("this is a remote passphrase");
  const { origin } = await fixture(t, { passwordRecord });
  const navigation = await call(origin, "/", { headers: { "sec-fetch-site": "cross-site", "sec-fetch-mode": "navigate", "sec-fetch-dest": "document" } });
  assert.equal(navigation.status, 303);
  assert.match(navigation.headers.location, /^\/__zadloop_remote__\/login/);
  const navigationWithOrigin = await call(origin, "/", { headers: { origin: "https://launcher.invalid", "sec-fetch-site": "cross-site", "sec-fetch-mode": "navigate", "sec-fetch-dest": "document" } });
  assert.equal(navigationWithOrigin.status, 303);
  assert.match(navigationWithOrigin.headers.location, /^\/__zadloop_remote__\/login/);
  const strippedCloudflareRefresh = await call(origin, "/__zadloop_remote__/login", { headers: { origin: "https://launcher.invalid", "sec-fetch-site": "cross-site" } });
  assert.equal(strippedCloudflareRefresh.status, 200);
  assert.match(strippedCloudflareRefresh.body, /ZadLoop Remote/);
  const strippedCloudflarePost = await call(origin, "/__zadloop_remote__/login", { method: "POST", headers: { origin: "https://launcher.invalid", "sec-fetch-site": "cross-site", "content-type": "application\/x-www-form-urlencoded" }, body: "password=blocked" });
  assert.equal(strippedCloudflarePost.status, 403);
  const unsafe = await call(origin, "/api/private", { method: "POST", headers: { "sec-fetch-site": "cross-site", "sec-fetch-mode": "cors", "sec-fetch-dest": "empty" }, body: "blocked" });
  assert.equal(unsafe.status, 403);
  const unsafeWithOrigin = await call(origin, "/api/private", { method: "POST", headers: { origin: "https://launcher.invalid", "sec-fetch-site": "cross-site", "sec-fetch-mode": "cors", "sec-fetch-dest": "empty" }, body: "blocked" });
  assert.equal(unsafeWithOrigin.status, 403);
  const forged = await call(origin, "/", { headers: { origin: "https://attacker.invalid", "sec-fetch-site": "same-origin" } });
  assert.equal(forged.status, 403);
});

test("configuration rejects unsafe passwordless network states and invalid values", () => {
  assert.equal(validateConfiguration({ mode: "local", port: 48911, sessionHours: 8 }).mode, "local");
  assert.equal(validateConfiguration({ mode: "lan", port: 48912, sessionHours: 24 }).port, 48912);
  assert.throws(() => validateConfiguration({ mode: "public", port: 80 }), /Mode/);
  assert.throws(() => validateConfiguration({ mode: "local", port: 80 }), /Port/);
  assert.throws(() => validateConfiguration({ mode: "local", port: 48911, sessionHours: 2 }), /lifetime/);
});

test("named tunnel config is strict and child environment omits account secrets", async () => {
  const id = "11111111-2222-4333-8444-555555555555";
  validateNamedTunnel({ id, hostname: "zadloop.example.com", credentialsFile: "C:\\Users\\Example\\.cloudflared\\tunnel.json" });
  const yaml = renderTunnelConfig({ id, hostname: "zadloop.example.com", credentialsFile: "C:\\Users\\Example\\.cloudflared\\tunnel.json", port: 48911, metricsPort: 49000, logFile: "C:\\Temp\\remote.log" });
  assert.match(yaml, /127\.0\.0\.1:48911/);
  assert.match(yaml, /zadloop\.example\.com/);
  const env = childEnvironment({ PATH: "safe", CLOUDFLARE_API_TOKEN: "secret", GITHUB_TOKEN: "secret", USERPROFILE: "C:\\Users\\Example" });
  assert.equal(env.PATH, "safe");
  assert.equal(env.CLOUDFLARE_API_TOKEN, undefined);
  assert.equal(env.GITHUB_TOKEN, undefined);
});

test("manifest exposes a managed client bundle and stores no credentials", async () => {
  const manifest = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(manifest.name, "dsh-zadloop-remote-control");
  assert.equal(manifest.version, "2.2.3");
  assert.equal(manifest.dsh.client.platform, "web");
  const temporary = await mkdtemp(join(tmpdir(), "zrc-test-"));
  await rm(temporary, { recursive: true, force: true });
});
