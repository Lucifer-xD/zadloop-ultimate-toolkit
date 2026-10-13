import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import { zipSync, strToU8 } from "fflate";
import { importTransferArchive, inspectZipLimits, orderSessionLogs, parseSessionLog } from "../lib/index.js";

const root = new URL("../", import.meta.url);

function sessionText(id = "session-transfer-test") {
  return [
    JSON.stringify({ type: "session", version: 4, id, createdAt: 1, cwd: "C:\\work", isSeeded: false, delegationDepth: 0, agentPreset: "delegate" }),
    JSON.stringify({ seq: 0, time: 1, type: "session/title", data: { title: "Transferred chat", messageSeqs: [], source: "user" } }),
    JSON.stringify({ seq: 1, time: 2, type: "model/selection", data: { provider: "test", model: "model", reasoningEffort: "high" } }),
    "",
  ].join("\n");
}

test("package declares a managed ZadLoop bundle", async () => {
  const manifest = JSON.parse(await readFile(new URL("package.json", root), "utf8"));
  assert.equal(manifest.name, "dsh-zadloop-session-transfer");
  assert.equal(manifest.version, "1.1.0");
  assert.equal(manifest.dsh.bundle.patch, "./cordis.patch.yml");
  assert.ok(manifest.dsh.client.inject.includes("@deepseek-ai/dsh-api-session-controller"));
});

test("archive parser preserves raw session metadata and events", () => {
  const parsed = parseSessionLog("session.v4.jsonl", strToU8(sessionText()));
  assert.equal(parsed.header.id, "session-transfer-test");
  assert.equal(parsed.header.agentPreset, "delegate");
  assert.equal(parsed.title, "Transferred chat");
  assert.equal(parsed.events.length, 2);
  assert.equal(orderSessionLogs([parsed])[0], parsed);
});

test("ZIP preflight rejects unsafe paths", () => {
  const archive = zipSync({ "../outside": strToU8("no") });
  assert.throws(() => inspectZipLimits(archive), /unsafe entry path/);
});

test("import writes attachments and the exact session log", async () => {
  const digest = "a".repeat(64);
  const archive = zipSync({
    "session.v4.jsonl": strToU8(sessionText()),
    "media/sha256:test.png": new Uint8Array([1, 2, 3]),
    [`files/aa/${digest}/notes.txt`]: strToU8("hello"),
  });
  const appended = [];
  const calls = [];
  const ctx = {
    attachments: {
      async saveImage() { calls.push("image"); return { attachmentId: "sha256:test" }; },
      async saveFile() { calls.push("file"); return { attachmentId: `sha256:${digest}` }; },
    },
    sessionPersistence: {
      async stat() { return undefined; },
      async create(header) {
        calls.push(`create:${header.id}`);
        return {
          async append(events) { appended.push(...events); },
          async flush() { calls.push("flush"); },
          async close() { calls.push("close"); },
        };
      },
      async delete() {},
    },
  };
  const result = await importTransferArchive(ctx, archive);
  assert.deepEqual(result, {
    ok: true,
    sessionId: "session-transfer-test",
    title: "Transferred chat",
    sessions: 1,
    createdSessions: 1,
    updatedSessions: 0,
    unchangedSessions: 0,
    attachments: 2,
    events: 2,
    eventsAdded: 2,
  });
  assert.deepEqual(calls.slice(0, 3), ["image", "file", "create:session-transfer-test"]);
  assert.equal(appended[1].type, "model/selection");
});

test("import fast-forwards an existing cold session when local history is an exact prefix", async () => {
  const remoteText = `${sessionText().trimEnd()}\n${JSON.stringify({ seq: 2, time: 3, type: "model/selection", data: { provider: "test", model: "new-model", reasoningEffort: "high" } })}\n`;
  const archive = zipSync({ "session.v4.jsonl": strToU8(remoteText) });
  const local = parseSessionLog("session.v4.jsonl", strToU8(sessionText()));
  const persisted = [...local.events];
  const calls = [];
  const ctx = {
    attachments: {},
    sessions: { get() { return undefined; } },
    sessionPersistence: {
      async stat() { return { header: local.header, eventCount: persisted.length }; },
      async open(_id, access) {
        calls.push(`open:${access}`);
        return {
          header: local.header,
          async read() { return { events: [...persisted] }; },
          async append(events) { persisted.push(...events); calls.push(`append:${events.length}`); },
          async flush() { calls.push("flush"); },
          async close() { calls.push("close"); },
        };
      },
    },
  };
  const result = await importTransferArchive(ctx, archive);
  assert.equal(result.updatedSessions, 1);
  assert.equal(result.eventsAdded, 1);
  assert.equal(persisted.length, 3);
  assert.deepEqual(calls, ["open:read", "close", "open:write", "append:1", "flush", "close"]);
});

test("import updates a currently live session and treats regenerated timestamps as equivalent", async () => {
  const next = { seq: 2, time: 3, type: "model/selection", data: { provider: "test", model: "new-model", reasoningEffort: "high" } };
  const remoteText = `${sessionText().trimEnd()}\n${JSON.stringify(next)}\n`;
  const archive = zipSync({ "session.v4.jsonl": strToU8(remoteText) });
  const local = parseSessionLog("session.v4.jsonl", strToU8(sessionText()));
  const liveEvents = [...local.events];
  const live = {
    id: local.header.id,
    header: local.header,
    get seq() { return liveEvents.length; },
    snapshotEvents() { return [...liveEvents]; },
    append(type, data, surface) { liveEvents.push({ seq: liveEvents.length, time: 999, type, data, ...(surface || {}) }); },
  };
  let flushes = 0;
  const ctx = {
    attachments: {},
    sessions: { get() { return live; }, async flush() { flushes += 1; } },
    sessionPersistence: { async stat() { return { header: local.header }; } },
  };
  const first = await importTransferArchive(ctx, archive);
  const second = await importTransferArchive(ctx, archive);
  assert.equal(first.eventsAdded, 1);
  assert.equal(second.eventsAdded, 0);
  assert.equal(second.unchangedSessions, 1);
  assert.equal(flushes, 1);
  assert.equal(liveEvents[2].time, 999);
});

test("import refuses independently diverged histories before storing attachments", async () => {
  const archive = zipSync({ "session.v4.jsonl": strToU8(sessionText()) });
  const local = parseSessionLog("session.v4.jsonl", strToU8(sessionText()));
  local.events[1] = { ...local.events[1], data: { ...local.events[1].data, model: "different-local-model" } };
  let attachmentWrites = 0;
  const ctx = {
    attachments: { async saveImage() { attachmentWrites += 1; }, async saveFile() { attachmentWrites += 1; } },
    sessions: { get() { return undefined; } },
    sessionPersistence: {
      async stat() { return { header: local.header }; },
      async open() {
        return { header: local.header, async read() { return { events: local.events }; }, async close() {} };
      },
    },
  };
  await assert.rejects(() => importTransferArchive(ctx, archive), /different history at event 1/);
  assert.equal(attachmentWrites, 0);
});

test("client registers one Transfer dock control and robust JSON handling", async () => {
  const source = await readFile(new URL("lib/client.js", root), "utf8");
  let definition;
  const elements = new Map();
  const document = {
    head: { appendChild(element) { elements.set(element.id, element); } },
    getElementById(id) { return elements.get(id) || null; },
    createElement() { return {}; },
  };
  vm.runInNewContext(source, { window: { __ModuleLoader__: { load(value) { definition = value; } } }, document });
  assert.equal(definition.id, "dsh-zadloop-session-transfer");
  assert.match(source, /api\/session\.export/);
  assert.match(source, /api\/zadloop-session-transfer\/import/);
  assert.match(source, /ctx\.sessions\.refresh\(\)/);
  assert.match(source, /reasoning, tool calls, subagents, attached files, and images/);
  assert.match(source, /only its missing newer events are added safely/);
  assert.match(source, /project\/workspace files are not inside the session ZIP/);
  assert.match(source, /STYLE_OWNER/);
  assert.match(source, /height:22px!important/);
  assert.match(source, /h\("rect"/);
  assert.doesNotMatch(source, /startSession|createSession/);
  const React = { createElement() {}, Fragment: Symbol("Fragment") };
  const plugin = definition.factory((name) => name === "react" ? React : { createPortal() {} });
  let slot;
  plugin.apply({
    slots: { inject(_name, callback) { callback(); }, register(config) { slot = config; } },
    effect() {},
  });
  assert.equal(slot.id, "zadloop-session-transfer");
});

test("the Transfer stylesheet survives all profile bundle disposal", async () => {
  const source = await readFile(new URL("lib/client.js", root), "utf8");
  const elements = new Map();
  const document = {
    head: { appendChild(element) { elements.set(element.id, element); } },
    getElementById(id) { return elements.get(id) || null; },
    createElement() {
      return {
        remove() {
          if (elements.get(this.id) === this) elements.delete(this.id);
        },
      };
    },
  };
  const React = { createElement() {}, Fragment: Symbol("Fragment") };
  const ReactDOM = { createPortal() {} };
  const loadDefinition = () => {
    let definition;
    vm.runInNewContext(source, { window: { __ModuleLoader__: { load(value) { definition = value; } } }, document });
    return definition;
  };
  const activate = (definition) => {
    let dispose;
    definition.factory((name) => name === "react" ? React : ReactDOM).apply({
      slots: { inject(_name, callback) { callback(); }, register() { return () => {}; } },
      effect(register) { dispose = register(); },
    });
    return dispose;
  };

  const disposeOld = activate(loadDefinition());
  const style = document.getElementById("zadloop-session-transfer-css");
  const disposeCurrent = activate(loadDefinition());
  assert.equal(document.getElementById("zadloop-session-transfer-css"), style);

  disposeOld();
  assert.equal(document.getElementById("zadloop-session-transfer-css"), style);

  disposeCurrent();
  assert.equal(document.getElementById("zadloop-session-transfer-css"), style);
});
