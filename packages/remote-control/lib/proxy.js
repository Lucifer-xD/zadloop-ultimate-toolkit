import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { createServer, request } from "node:http";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const HOP_HEADERS = new Set(["connection", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailer", "transfer-encoding", "upgrade"]);
const COOKIE_NAME = "zrc_session";

function filteredHeaders(headers) {
  const blocked = new Set(HOP_HEADERS);
  for (const item of String(headers.connection ?? "").split(",")) blocked.add(item.trim().toLowerCase());
  return Object.fromEntries(Object.entries(headers).filter(([key]) => !blocked.has(key.toLowerCase())));
}

export async function hashPassphrase(passphrase, salt = randomBytes(16).toString("base64url")) {
  if (typeof passphrase !== "string" || passphrase.length < 12 || passphrase.length > 256) throw new Error("Passphrase must contain 12 to 256 characters.");
  const derived = await scrypt(passphrase, salt, 32, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return { algorithm: "scrypt", salt, hash: Buffer.from(derived).toString("base64url"), N: 32768, r: 8, p: 1 };
}

export async function verifyPassphrase(passphrase, record) {
  if (!record || record.algorithm !== "scrypt" || typeof record.salt !== "string" || typeof record.hash !== "string") return false;
  if (typeof passphrase !== "string" || passphrase.length > 256) return false;
  const expected = Buffer.from(record.hash, "base64url");
  const actual = Buffer.from(await scrypt(passphrase, record.salt, expected.length, { N: record.N ?? 32768, r: record.r ?? 8, p: record.p ?? 1, maxmem: 64 * 1024 * 1024 }));
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Use ZadLoop's browser-auth exchange in memory without exposing it remotely. */
export function mintUpstreamCookie(connection, upstream) {
  if (typeof connection.authenticatedUrl !== "function" || typeof connection.authorizeIndex !== "function") throw new Error("This ZadLoop version does not provide the required browser-auth API.");
  const launch = new URL(connection.authenticatedUrl(`${upstream}/`));
  let status;
  let headers;
  const allowed = connection.authorizeIndex(
    { method: "GET", url: `${launch.pathname}${launch.search}`, headers: { host: launch.host } },
    { writeHead(code, values) { status = code; headers = values; }, end() {} },
  );
  const value = headers?.["set-cookie"];
  if (allowed !== false || status !== 303 || typeof value !== "string") throw new Error("Unable to obtain a private upstream browser session. Remote access was not opened.");
  const cookie = value.split(";", 1)[0];
  if (!cookie.startsWith("dsh-auth-") || /[\r\n]/u.test(cookie)) throw new Error("Unexpected upstream session cookie format.");
  const maxAge = /(?:^|;)\s*Max-Age=(\d+)/iu.exec(value);
  const lifetime = maxAge ? Number(maxAge[1]) * 1000 : 60_000;
  return { cookie, refreshAt: Date.now() + Math.min(300_000, Math.max(1, lifetime / 2)) };
}

function parseCookies(value) {
  const result = {};
  for (const part of String(value ?? "").split(";")) {
    const at = part.indexOf("=");
    if (at > 0) result[part.slice(0, at).trim()] = part.slice(at + 1).trim();
  }
  return result;
}

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function loginPage(message = "", next = "/") {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ZadLoop Remote</title><style>:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at 20% 0%,#1d3151 0,transparent 42%),#101318;color:#f2f5fa;font-family:Inter,system-ui,sans-serif}.card{width:min(410px,100%);padding:28px;border:1px solid #303744;border-radius:20px;background:rgba(26,30,38,.94);box-shadow:0 28px 90px #0008}.mark{display:grid;place-items:center;width:42px;height:42px;border-radius:13px;background:#7398ff22;color:#91adff;font-size:23px}.eyebrow{margin:18px 0 6px;color:#91adff;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase}h1{margin:0 0 8px;font-size:25px}p{margin:0 0 22px;color:#a9b0bd;line-height:1.55}.error{margin:-8px 0 16px;padding:10px 12px;border:1px solid #ef6b7666;border-radius:10px;background:#ef6b7612;color:#ff9ca4;font-size:13px}label{display:block;margin-bottom:7px;color:#cbd1dc;font-size:12px;font-weight:650}input{width:100%;height:44px;padding:0 13px;border:1px solid #3a4352;border-radius:11px;outline:0;background:#12161d;color:#fff;font:inherit}input:focus{border-color:#7398ff;box-shadow:0 0 0 3px #7398ff22}button{width:100%;height:44px;margin-top:13px;border:0;border-radius:11px;background:#6f93f5;color:#08101f;font:700 14px system-ui;cursor:pointer}.foot{margin-top:18px;color:#717989;font-size:11px;text-align:center}</style></head><body><main class="card"><div class="mark">Z</div><div class="eyebrow">Secure remote access</div><h1>Open ZadLoop</h1><p>Enter the passphrase configured on the host computer.</p>${message ? `<div class="error">${escapeHtml(message)}</div>` : ""}<form method="post" action="/__zadloop_remote__/login"><input type="hidden" name="next" value="${escapeHtml(next)}"><label for="password">Passphrase</label><input id="password" name="password" type="password" maxlength="256" autocomplete="current-password" autofocus required><button type="submit">Continue securely</button></form><div class="foot">Sessions expire automatically and can be revoked from the desktop app.</div></main></body></html>`;
}

function bodyBuffer(req, limit = 8192) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) { reject(new Error("Request body is too large.")); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function safeNext(value) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !/[\r\n]/u.test(value) ? value : "/";
}

export class SessionStore {
  constructor({ ttlMs = 8 * 60 * 60_000, now = Date.now } = {}) {
    this.ttlMs = ttlMs;
    this.now = now;
    this.sessions = new Map();
  }
  create(remoteAddress = "") {
    const token = randomBytes(32).toString("base64url");
    this.sessions.set(createHash("sha256").update(token).digest("base64url"), { expiresAt: this.now() + this.ttlMs, remoteAddress });
    return token;
  }
  valid(token) {
    if (!token) return false;
    const key = createHash("sha256").update(token).digest("base64url");
    const session = this.sessions.get(key);
    if (!session || session.expiresAt <= this.now()) { this.sessions.delete(key); return false; }
    return true;
  }
  revoke(token) { if (token) this.sessions.delete(createHash("sha256").update(token).digest("base64url")); }
  revokeAll() { this.sessions.clear(); }
  count() { for (const [key, value] of this.sessions) if (value.expiresAt <= this.now()) this.sessions.delete(key); return this.sessions.size; }
}

/** Fixed-target HTTP/WebSocket proxy with an isolated remote login session. */
export function createRemoteProxy({ upstream, getCookie, passwordRecord, passwordless = false, sessionHours = 8, status, verify = verifyPassphrase }) {
  const target = new URL(upstream);
  if (target.protocol !== "http:" || target.hostname !== "127.0.0.1" || !target.port) throw new Error("The upstream must be a fixed loopback HTTP server with an explicit port.");
  if (!passwordless && !passwordRecord) throw new Error("A passphrase is required for network remote access.");
  const sessions = new SessionStore({ ttlMs: Math.max(1, Math.min(168, sessionHours)) * 60 * 60_000 });
  const attempts = new Map();
  const sockets = new Set();
  const requests = new Set();
  let closed = false;

  function remoteIp(req) { return String(req.socket.remoteAddress ?? "unknown"); }
  function isLimited(req) {
    const key = remoteIp(req);
    const now = Date.now();
    const item = attempts.get(key);
    if (!item || now - item.startedAt > 15 * 60_000) { attempts.set(key, { startedAt: now, count: 0 }); return false; }
    return item.count >= 5;
  }
  function failedAttempt(req) { const item = attempts.get(remoteIp(req)) ?? { startedAt: Date.now(), count: 0 }; item.count += 1; attempts.set(remoteIp(req), item); }
  function authenticated(req) { return passwordless || sessions.valid(parseCookies(req.headers.cookie)[COOKIE_NAME]); }
  function secureRequest(req) { return req.socket.encrypted === true || String(req.headers["x-forwarded-proto"] ?? "").split(",", 1)[0].trim() === "https"; }
  function cookie(token, req, maxAge) { return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secureRequest(req) ? "; Secure" : ""}`; }
  function securityHeaders(extra = {}) { return { "cache-control": "no-store", "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'", "referrer-policy": "no-referrer", "x-content-type-options": "nosniff", "x-frame-options": "DENY", ...extra }; }
  function send(res, code, body, headers = {}) { if (res.destroyed) return; res.writeHead(code, securityHeaders({ "content-type": "text/html; charset=utf-8", ...headers })); res.end(body); }

  function upstreamPath(raw) {
    if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//") || /[\r\n]/u.test(raw)) throw new Error("Only origin-form requests are accepted.");
    const url = new URL(raw, target);
    if (url.pathname === "/") url.searchParams.delete("token");
    return `${url.pathname}${url.search}`;
  }
  function isSameOrigin(req) {
    if (req.headers["sec-fetch-site"] === "cross-site") return false;
    if (!req.headers.origin) return true;
    try { const origin = new URL(req.headers.origin); return ["http:", "https:"].includes(origin.protocol) && origin.host === new URL(`http://${req.headers.host}`).host; } catch { return false; }
  }
  function upstreamHeaders(req, upgrade = false) {
    const headers = filteredHeaders(req.headers);
    for (const key of Object.keys(headers)) if (key === "forwarded" || key.startsWith("x-forwarded-") || key === "authorization" || key === "cookie" || key.startsWith("sec-fetch-")) delete headers[key];
    headers.host = target.host;
    headers.origin = target.origin;
    headers.cookie = getCookie();
    headers["sec-fetch-site"] = "same-origin";
    if (upgrade) { headers.connection = "Upgrade"; headers.upgrade = "websocket"; }
    return headers;
  }
  function responseHeaders(headers, upgrade = false) {
    const result = filteredHeaders(headers);
    delete result["set-cookie"];
    delete result["set-cookie2"];
    result["cache-control"] = "no-store";
    result["referrer-policy"] = "no-referrer";
    if (typeof result.location === "string") {
      try { const location = new URL(result.location, target); if (location.origin === target.origin) { location.searchParams.delete("token"); result.location = `${location.pathname}${location.search}${location.hash}`; } } catch { delete result.location; }
    }
    if (upgrade) { result.connection = "Upgrade"; result.upgrade = "websocket"; }
    return result;
  }
  function trackSocket(socket) { sockets.add(socket); socket.on("error", () => socket.destroy()); socket.once("close", () => sockets.delete(socket)); }
  function openRequest(req, upgrade = false) {
    if (closed) throw new Error("Proxy is stopped.");
    const outgoing = request({ hostname: target.hostname, port: Number(target.port), method: req.method, path: upstreamPath(req.url), headers: upstreamHeaders(req, upgrade), agent: false });
    requests.add(outgoing);
    outgoing.once("close", () => requests.delete(outgoing));
    outgoing.on("socket", (socket) => { trackSocket(socket); const timer = setTimeout(() => outgoing.destroy(new Error("Upstream connect timeout.")), 10_000); timer.unref(); socket.once("connect", () => clearTimeout(timer)); socket.once("close", () => clearTimeout(timer)); });
    return outgoing;
  }

  const server = createServer(async (req, res) => {
    const pathname = req.url?.split("?", 1)[0] ?? "/";
    if (!isSameOrigin(req)) { send(res, 403, "Cross-site requests are not allowed."); return; }
    if (pathname === "/__zadloop_remote__/login") {
      if (req.method === "GET") { const next = safeNext(new URL(req.url, "http://local").searchParams.get("next")); send(res, 200, loginPage("", next)); return; }
      if (req.method !== "POST") { send(res, 405, "Method not allowed."); return; }
      if (isLimited(req)) { send(res, 429, loginPage("Too many attempts. Try again in 15 minutes.")); return; }
      try {
        const form = new URLSearchParams((await bodyBuffer(req)).toString("utf8"));
        if (!(await verify(form.get("password") ?? "", passwordRecord))) { failedAttempt(req); send(res, 401, loginPage("Incorrect passphrase.", safeNext(form.get("next")))); return; }
        attempts.delete(remoteIp(req));
        const token = sessions.create(remoteIp(req));
        const maxAge = Math.max(1, Math.min(168, sessionHours)) * 60 * 60;
        res.writeHead(303, securityHeaders({ location: safeNext(form.get("next")), "set-cookie": cookie(token, req, maxAge) })); res.end();
      } catch { send(res, 400, loginPage("Invalid login request.")); }
      return;
    }
    if (!authenticated(req)) { const next = safeNext(req.url); res.writeHead(303, securityHeaders({ location: `/__zadloop_remote__/login?next=${encodeURIComponent(next)}` })); res.end(); return; }
    if (pathname === "/__zadloop_remote__/logout") { sessions.revoke(parseCookies(req.headers.cookie)[COOKIE_NAME]); res.writeHead(303, securityHeaders({ location: "/__zadloop_remote__/login", "set-cookie": cookie("", req, 0) })); res.end(); return; }
    if (pathname === "/__zadloop_remote__/status") { if (!["GET", "HEAD"].includes(req.method)) { send(res, 405, "Method not allowed."); return; } res.writeHead(200, securityHeaders({ "content-type": "application/json" })); res.end(req.method === "HEAD" ? undefined : JSON.stringify(status?.() ?? { ok: true })); return; }
    let outgoing;
    try { outgoing = openRequest(req); } catch { send(res, 400, "Invalid remote-control request."); return; }
    outgoing.on("response", (incoming) => { res.writeHead(incoming.statusCode ?? 502, responseHeaders(incoming.headers)); incoming.on("error", () => res.destroy()); incoming.pipe(res); });
    outgoing.on("error", () => { if (!res.headersSent) send(res, 502, "ZadLoop is unavailable. Keep the desktop app running."); else res.destroy(); });
    req.on("aborted", () => outgoing.destroy()); req.on("error", () => outgoing.destroy()); res.once("close", () => { if (!res.writableEnded) outgoing.destroy(); }); req.pipe(outgoing);
  });
  server.on("connection", trackSocket);
  server.on("connect", (_req, socket) => socket.end("HTTP/1.1 405 Method Not Allowed\r\nConnection: close\r\n\r\n"));
  server.on("clientError", (_error, socket) => socket.end("HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n"));
  server.on("upgrade", (req, socket, head) => {
    if (!isSameOrigin(req) || !authenticated(req)) { socket.end("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n"); return; }
    if (String(req.headers.upgrade).toLowerCase() !== "websocket") { socket.end("HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n"); return; }
    let outgoing;
    try { outgoing = openRequest(req, true); } catch { socket.end("HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n"); return; }
    let upgraded = false;
    outgoing.on("upgrade", (incoming, upstreamSocket, upstreamHead) => {
      upgraded = true; trackSocket(upstreamSocket); const values = responseHeaders(incoming.headers, true); const lines = [`HTTP/1.1 ${incoming.statusCode} ${incoming.statusMessage}`];
      for (const [key, value] of Object.entries(values)) for (const item of Array.isArray(value) ? value : [value]) if (item !== undefined) lines.push(`${key}: ${item}`);
      socket.write(`${lines.join("\r\n")}\r\n\r\n`); if (upstreamHead.length) socket.write(upstreamHead); if (head.length) upstreamSocket.write(head); socket.pipe(upstreamSocket); upstreamSocket.pipe(socket); socket.once("close", () => upstreamSocket.destroy()); upstreamSocket.once("close", () => socket.destroy()); if (socket.destroyed) upstreamSocket.destroy();
    });
    outgoing.on("response", (incoming) => { const code = incoming.statusCode ?? 502; incoming.resume(); socket.end(`HTTP/1.1 ${code} ${incoming.statusMessage ?? "Upstream Rejected Upgrade"}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`); });
    outgoing.on("error", () => { if (upgraded) socket.destroy(); else socket.end("HTTP/1.1 502 Bad Gateway\r\nConnection: close\r\nContent-Length: 0\r\n\r\n"); }); socket.once("close", () => outgoing.destroy()); outgoing.end();
  });

  return {
    server, sessions,
    async listen(port, host) { if (closed) throw new Error("Proxy is stopped."); await new Promise((resolve, reject) => { server.once("error", reject); server.listen(port, host, () => { server.off("error", reject); resolve(); }); }); server.on("error", () => { void this.close(); }); return server.address(); },
    revokeAll() { sessions.revokeAll(); for (const socket of sockets) socket.destroy(); },
    async close() { if (closed) return; closed = true; sessions.revokeAll(); const stopped = new Promise((resolve) => server.close(resolve)); for (const outgoing of requests) outgoing.destroy(); server.closeAllConnections(); for (const socket of sockets) socket.destroy(); await stopped; },
  };
}
