import { unzipSync } from "fflate";
import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

export const name = "zadloop-session-transfer";
export const inject = ["connection", "sessionPersistence", "attachments", "sessions"];

export const IMPORT_PATH = "/api/zadloop-session-transfer/import";
export const MAX_ARCHIVE_BYTES = 384 * 1024 * 1024;
export const MAX_EXPANDED_BYTES = 768 * 1024 * 1024;
export const MAX_ARCHIVE_ENTRIES = 10_000;

const MAX_RECOVERY_CONTEXT_CHARS = 160_000;
const RECOVERY_MARKER = "ZADLOOP_REMOTE_BRANCH:";

const LOG_PATH = /^(?:session(?:\.v\d+)?\.jsonl|subagents\/[^/]+\/session(?:\.v\d+)?\.jsonl)$/u;
const MEDIA_PATH = /^media\/([^/]+)\.(png|jpg|webp|gif)$/u;
const FILE_PATH = /^files\/[0-9a-fA-F]{2}\/([0-9a-fA-F]{64})\/(.+)$/u;
const MEDIA_TYPES = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

class ImportFailure extends Error {
  constructor(message, status = 400, code = "invalid-archive") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function safeEntryName(value) {
  return typeof value === "string"
    && value.length > 0
    && !value.includes("\\")
    && !value.startsWith("/")
    && !value.split("/").some((part) => part === "" || part === "." || part === "..");
}

function findEndOfCentralDirectory(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const minimum = Math.max(0, bytes.byteLength - 65_557);
  for (let offset = bytes.byteLength - 22; offset >= minimum; offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) return offset;
  }
  throw new ImportFailure("This file is not a valid ZadLoop session ZIP.");
}

export function inspectZipLimits(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const end = findEndOfCentralDirectory(bytes);
  const entries = view.getUint16(end + 10, true);
  const centralSize = view.getUint32(end + 12, true);
  const centralOffset = view.getUint32(end + 16, true);
  if (entries === 0xffff || centralSize === 0xffffffff || centralOffset === 0xffffffff) {
    throw new ImportFailure("ZIP64 transfer files are not supported.");
  }
  if (entries < 1 || entries > MAX_ARCHIVE_ENTRIES) {
    throw new ImportFailure(`The transfer contains an invalid number of entries (${entries}).`);
  }
  if (centralOffset + centralSize > bytes.byteLength) throw new ImportFailure("The ZIP directory is truncated.");
  let offset = centralOffset;
  let expanded = 0;
  const decoder = new TextDecoder();
  const names = [];
  for (let index = 0; index < entries; index += 1) {
    if (offset + 46 > bytes.byteLength || view.getUint32(offset, true) !== 0x02014b50) {
      throw new ImportFailure("The ZIP directory is corrupt.");
    }
    const flags = view.getUint16(offset + 8, true);
    const compressed = view.getUint32(offset + 20, true);
    const size = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    if ((flags & 1) !== 0) throw new ImportFailure("Encrypted ZIP files are not supported.");
    if (compressed === 0xffffffff || size === 0xffffffff) throw new ImportFailure("ZIP64 entries are not supported.");
    const next = offset + 46 + nameLength + extraLength + commentLength;
    if (next > bytes.byteLength) throw new ImportFailure("A ZIP entry is truncated.");
    const entryName = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
    if (!safeEntryName(entryName)) throw new ImportFailure("The ZIP contains an unsafe entry path.");
    expanded += size;
    if (expanded > MAX_EXPANDED_BYTES) throw new ImportFailure("The expanded transfer is larger than 768 MiB.", 413, "archive-too-large");
    names.push(entryName);
    offset = next;
  }
  return { entries, expanded, names };
}

async function readBody(request) {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_ARCHIVE_BYTES) {
    throw new ImportFailure("The transfer file is larger than 384 MiB.", 413, "archive-too-large");
  }
  if (request.body === null) throw new ImportFailure("No transfer file was uploaded.");
  const reader = request.body.getReader();
  const chunks = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_ARCHIVE_BYTES) throw new ImportFailure("The transfer file is larger than 384 MiB.", 413, "archive-too-large");
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  if (length === 0) throw new ImportFailure("The uploaded transfer file is empty.");
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

export function parseSessionLog(path, bytes) {
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new ImportFailure(`${path} is not valid UTF-8.`);
  }
  const lines = text.split(/\r?\n/u).filter((line) => line.length > 0);
  if (lines.length === 0) throw new ImportFailure(`${path} is empty.`);
  let headerLine;
  let events;
  try {
    headerLine = JSON.parse(lines[0]);
    events = lines.slice(1).map((line) => JSON.parse(line));
  } catch {
    throw new ImportFailure(`${path} contains invalid JSONL.`);
  }
  if (headerLine?.type !== "session" || typeof headerLine.id !== "string" || headerLine.id.length === 0) {
    throw new ImportFailure(`${path} has no valid Session header.`);
  }
  if (!Number.isSafeInteger(headerLine.createdAt) || headerLine.createdAt < 0 || !Number.isSafeInteger(headerLine.version)) {
    throw new ImportFailure(`${path} has invalid Session metadata.`);
  }
  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    if (event === null || typeof event !== "object" || event.seq !== index || typeof event.type !== "string") {
      throw new ImportFailure(`${path} has a non-contiguous or invalid event at sequence ${index}.`);
    }
  }
  const { type: _type, ...header } = headerLine;
  const inheritedMarker = events.findLastIndex((event) => event.type === "session/end-seed" && event.data?.inherited === true);
  if (header.isSeeded === true && inheritedMarker < 0) {
    throw new ImportFailure(`${path} is seeded but has no inherited boundary marker.`);
  }
  const inheritedEventCount = header.isSeeded === true ? inheritedMarker : 0;
  const title = events.findLast((event) => event.type === "session/title" && typeof event.data?.title === "string")?.data.title;
  return { path, header, events, inheritedEventCount, title };
}

export function orderSessionLogs(logs) {
  const ids = new Set(logs.map((log) => log.header.id));
  if (ids.size !== logs.length) throw new ImportFailure("The transfer contains duplicate Session IDs.");
  const pending = [...logs];
  const ordered = [];
  const ready = new Set();
  while (pending.length > 0) {
    const index = pending.findIndex((log) => log.header.parentSession === undefined || !ids.has(log.header.parentSession) || ready.has(log.header.parentSession));
    if (index < 0) throw new ImportFailure("The transfer contains a cyclic Session hierarchy.");
    const [next] = pending.splice(index, 1);
    ordered.push(next);
    ready.add(next.header.id);
  }
  return ordered;
}

async function storeAttachments(ctx, entries) {
  let attachments = 0;
  for (const [path, bytes] of entries) {
    const media = MEDIA_PATH.exec(path);
    if (media) {
      const expected = media[1];
      const ref = await ctx.attachments.saveImage({ data: bytes, mediaType: MEDIA_TYPES[media[2]] });
      if (String(ref.attachmentId) !== expected) throw new ImportFailure(`Image integrity check failed for ${path}.`);
      attachments += 1;
      continue;
    }
    const file = FILE_PATH.exec(path);
    if (file) {
      const expected = `sha256:${file[1].toLowerCase()}`;
      const displayName = file[2];
      const ref = await ctx.attachments.saveFile({ data: bytes, name: displayName });
      if (String(ref.attachmentId).toLowerCase() !== expected) throw new ImportFailure(`File integrity check failed for ${path}.`);
      attachments += 1;
    }
  }
  return attachments;
}

function eventsEquivalent(local, incoming) {
  if (local === incoming) return true;
  if (local === null || incoming === null || typeof local !== "object" || typeof incoming !== "object") return false;
  const { time: _localTime, ...localStable } = local;
  const { time: _incomingTime, ...incomingStable } = incoming;
  return isDeepStrictEqual(localStable, incomingStable);
}

function assertCompatibleHeader(local, incoming) {
  for (const field of ["version", "id", "parentSession", "isSeeded", "origin", "delegationDepth"]) {
    if (!isDeepStrictEqual(local[field], incoming[field])) {
      throw new ImportFailure(`Session ${incoming.id} has incompatible ${field} metadata on this computer. Nothing was changed.`, 409, "session-conflict");
    }
  }
}

function findDivergence(localEvents, incomingEvents) {
  const shared = Math.min(localEvents.length, incomingEvents.length);
  for (let index = 0; index < shared; index += 1) {
    if (!eventsEquivalent(localEvents[index], incomingEvents[index])) return index;
  }
  return -1;
}

function classifyExistingLog(log, localHeader, localEvents, live, preserveConflicts = false) {
  assertCompatibleHeader(localHeader, log.header);
  const divergence = findDivergence(localEvents, log.events);
  if (divergence >= 0) {
    if (preserveConflicts) return { kind: "conflict", log, live, localEvents, divergence };
    throw new ImportFailure(
      `Session ${log.header.id} has different history at event ${divergence}. Both computers changed this session, so it cannot be merged automatically without corrupting the conversation. Nothing was changed.`,
      409,
      "session-conflict",
    );
  }
  if (localEvents.length < log.events.length) {
    return { kind: "update", log, live, localEvents, appendFrom: localEvents.length };
  }
  return { kind: "unchanged", log, live, localEvents, appendFrom: log.events.length };
}

async function readStoredLog(ctx, id) {
  const live = ctx.sessions.get(id);
  if (live !== undefined) {
    return { header: live.header, events: live.snapshotEvents(), live };
  }
  const handle = await ctx.sessionPersistence.open(id, "read");
  try {
    const { events } = await handle.read(0);
    return { header: handle.header, events, live: undefined };
  } finally {
    await handle.close();
  }
}

async function planSessionChanges(ctx, logs, preserveConflicts = false) {
  const plans = [];
  for (const log of logs) {
    const snapshot = await ctx.sessionPersistence.stat(log.header.id);
    if (snapshot === undefined) {
      plans.push({ kind: "create", log });
      continue;
    }
    const stored = await readStoredLog(ctx, log.header.id);
    plans.push(classifyExistingLog(log, stored.header, stored.events, stored.live, preserveConflicts));
  }
  return plans;
}

function textFromContent(content) {
  if (!Array.isArray(content)) return "";
  return content
    .filter((block) => block?.type === "text" || block?.type === "reasoning")
    .map((block) => String(block.text ?? ""))
    .filter(Boolean)
    .join("\n");
}

function clip(value, maximum) {
  const text = String(value ?? "");
  return text.length <= maximum ? text : `${text.slice(0, maximum)}\n[truncated]`;
}

function recoveryTranscript(plan, fingerprint) {
  const lines = [
    `[${RECOVERY_MARKER}${fingerprint}]`,
    "Recovered conversation branch from another computer.",
    `Session: ${plan.log.header.id}`,
    `Common history: events 0-${plan.divergence - 1}`,
    `Remote-only branch: ${plan.log.events.length - plan.divergence} events`,
    "",
    "Treat the transcript below as work that happened on the remote computer after the shared history. Use it as context in future replies. The complete raw remote event branch is attached for lossless reference. Workspace files are not contained in a session transfer; verify or sync those separately.",
    "",
    "--- REMOTE BRANCH TRANSCRIPT ---",
  ];
  let length = lines.join("\n").length;
  for (const event of plan.log.events.slice(plan.divergence)) {
    let entry = "";
    if (event.type === "user/message") {
      entry = `USER:\n${textFromContent(event.data?.content)}`;
    } else if (event.type === "agent/inbox/spliced") {
      const messages = Array.isArray(event.data?.inserted) ? event.data.inserted : [];
      const value = messages.map((message) => textFromContent(message?.content)).filter(Boolean).join("\n");
      if (value) entry = `USER (queued/inbox):\n${value}`;
    } else if (event.type === "assistant/message") {
      entry = `ASSISTANT:\n${textFromContent(event.data?.message?.content)}`;
    } else if (event.type === "tool/call") {
      entry = `TOOL CALL ${event.data?.name ?? "unknown"}:\n${clip(event.data?.arguments, 2_000)}`;
    } else if (event.type === "tool/result") {
      entry = `TOOL RESULT:\n${clip(textFromContent(event.data?.message?.content), 3_000)}`;
    } else if (["agent-preset/selected", "model/selection", "sandbox/mode", "approval/policy", "permission/preset", "session/title", "goal/change", "todo/write"].includes(event.type)) {
      entry = `${event.type}: ${clip(JSON.stringify(event.data), 2_000)}`;
    }
    if (entry.trim().length === 0) continue;
    const block = `\n[remote event ${event.seq}]\n${entry}`;
    if (length + block.length > MAX_RECOVERY_CONTEXT_CHARS) {
      lines.push("\n[Transcript preview truncated. The attached JSONL contains every remote event.]\n");
      break;
    }
    lines.push(block);
    length += block.length;
  }
  return lines.join("\n");
}

function branchFingerprint(plan) {
  return createHash("sha256")
    .update(JSON.stringify({ id: plan.log.header.id, divergence: plan.divergence, events: plan.log.events.slice(plan.divergence) }))
    .digest("hex");
}

function hasRecoveryMarker(events, fingerprint) {
  const marker = `${RECOVERY_MARKER}${fingerprint}`;
  return events.some((event) => event.type === "agent/inbox/spliced"
    && event.data?.inserted?.some((message) => textFromContent(message?.content).includes(marker)));
}

function rawBranchBytes(plan, fingerprint) {
  const records = [
    { type: "zadloop-remote-branch", version: 1, sessionId: plan.log.header.id, commonEventCount: plan.divergence, fingerprint },
    ...plan.log.events.slice(plan.divergence),
  ];
  return new TextEncoder().encode(`${records.map((record) => JSON.stringify(record)).join("\n")}\n`);
}

async function prepareConflictRecovery(ctx, plan) {
  const fingerprint = branchFingerprint(plan);
  if (hasRecoveryMarker(plan.localEvents, fingerprint)) return { plan, fingerprint, duplicate: true };
  const bytes = rawBranchBytes(plan, fingerprint);
  const name = `zadloop-remote-branch-${plan.log.header.id}-${fingerprint.slice(0, 12)}.jsonl`;
  const attachment = await ctx.attachments.saveFile({ data: bytes, name });
  return { plan, fingerprint, duplicate: false, attachment };
}

function recoveryData(recovery) {
  return {
    target: "next-turn",
    start: 0,
    inserted: [{
      role: "user",
      id: `remote-branch-${recovery.fingerprint}`,
      source: { kind: "user" },
      content: [
        { type: "text", text: recoveryTranscript(recovery.plan, recovery.fingerprint) },
        { type: "file", attachment: recovery.attachment },
      ],
    }],
  };
}

async function recoverConflict(ctx, recovery) {
  if (recovery.duplicate) return { added: 0, preserved: 0, duplicate: true };
  const { plan } = recovery;
  if (plan.live !== undefined) {
    if (plan.live.seq !== plan.localEvents.length) {
      throw new ImportFailure(`Session ${plan.log.header.id} changed while it was being reconciled. Wait for the current response to finish, then import again.`, 409, "session-busy");
    }
    plan.live.append("agent/inbox/spliced", recoveryData(recovery));
    await ctx.sessions.flush(plan.live);
  } else {
    const handle = await ctx.sessionPersistence.open(plan.log.header.id, "write");
    try {
      const { events: current } = await handle.read(0);
      if (findDivergence(plan.localEvents, current) >= 0 || current.length !== plan.localEvents.length) {
        throw new ImportFailure(`Session ${plan.log.header.id} changed while it was being reconciled. Import again.`, 409, "session-busy");
      }
      await handle.append([{ seq: current.length, time: Date.now(), type: "agent/inbox/spliced", data: recoveryData(recovery) }]);
      await handle.flush();
    } finally {
      await handle.close();
    }
  }
  return { added: 1, preserved: plan.log.events.length - plan.divergence, duplicate: false };
}

function appendToLiveSession(session, events) {
  for (const event of events) {
    if (session.seq !== event.seq) {
      throw new ImportFailure(`Session ${session.id} changed while it was being synchronized. Wait for the current response to finish, then import again.`, 409, "session-busy");
    }
    const surface = {};
    if (Object.hasOwn(event, "surfaceOp")) surface.surfaceOp = event.surfaceOp;
    if (Object.hasOwn(event, "sourceEventSeqs")) surface.sourceEventSeqs = event.sourceEventSeqs;
    if (Object.keys(surface).length > 0) session.append(event.type, event.data, surface);
    else session.append(event.type, event.data);
  }
}

async function updateStoredSession(ctx, plan) {
  if (plan.live !== undefined) {
    if (plan.live.seq !== plan.localEvents.length) {
      throw new ImportFailure(`Session ${plan.log.header.id} changed while it was being synchronized. Wait for the current response to finish, then import again.`, 409, "session-busy");
    }
    const suffix = plan.log.events.slice(plan.appendFrom);
    appendToLiveSession(plan.live, suffix);
    await ctx.sessions.flush(plan.live);
    return suffix.length;
  }

  const handle = await ctx.sessionPersistence.open(plan.log.header.id, "write");
  try {
    const { events: current } = await handle.read(0);
    const refreshed = classifyExistingLog(plan.log, handle.header, current, undefined);
    if (refreshed.kind !== "update") return 0;
    const suffix = plan.log.events.slice(refreshed.appendFrom);
    for (let offset = 0; offset < suffix.length; offset += 1024) {
      await handle.append(suffix.slice(offset, offset + 1024));
    }
    await handle.flush();
    return suffix.length;
  } finally {
    await handle.close();
  }
}

async function createStoredSessions(ctx, plans) {
  const created = [];
  try {
    for (const { log } of plans) {
      const options = log.header.isSeeded === true ? { inheritedEventCount: log.inheritedEventCount } : undefined;
      const handle = await ctx.sessionPersistence.create(log.header, options);
      created.push(log.header.id);
      try {
        for (let offset = 0; offset < log.events.length; offset += 1024) {
          await handle.append(log.events.slice(offset, offset + 1024));
        }
        await handle.flush();
      } finally {
        await handle.close();
      }
    }
    return created;
  } catch (error) {
    for (const id of created.reverse()) {
      try { await ctx.sessionPersistence.delete(id); } catch {}
    }
    throw error;
  }
}

export async function importTransferArchive(ctx, bytes, options = {}) {
  inspectZipLimits(bytes);
  let files;
  try {
    files = unzipSync(bytes);
  } catch {
    throw new ImportFailure("The transfer ZIP could not be decompressed.");
  }
  const entries = Object.entries(files);
  const logs = orderSessionLogs(entries.filter(([path]) => LOG_PATH.test(path)).map(([path, data]) => parseSessionLog(path, data)));
  if (logs.length === 0) throw new ImportFailure("This ZIP contains no ZadLoop Session log.");
  const root = logs.find((log) => !log.path.includes("/"));
  if (root === undefined) throw new ImportFailure("This ZIP has no root ZadLoop Session log.");
  const preserveConflicts = options.onConflict === "preserve-context";
  const plans = await planSessionChanges(ctx, logs, preserveConflicts);
  const conflictPlans = plans.filter((plan) => plan.kind === "conflict");
  for (const plan of plans) {
    if (plan.live !== undefined && plan.live.seq !== plan.localEvents.length) {
      throw new ImportFailure(`Session ${plan.log.header.id} changed while it was being synchronized. Wait for the current response to finish, then import again.`, 409, "session-busy");
    }
  }
  const attachmentCount = await storeAttachments(ctx, entries);
  const recoveries = [];
  for (const plan of conflictPlans) recoveries.push(await prepareConflictRecovery(ctx, plan));
  let eventsAdded = 0;
  for (const plan of plans) {
    if (plan.kind === "update") eventsAdded += await updateStoredSession(ctx, plan);
  }
  const createPlans = plans.filter((plan) => plan.kind === "create");
  await createStoredSessions(ctx, createPlans);
  eventsAdded += createPlans.reduce((sum, plan) => sum + plan.log.events.length, 0);
  let remoteEventsPreserved = 0;
  let recoveredSessions = 0;
  let duplicateRecoveries = 0;
  for (const recovery of recoveries) {
    const result = await recoverConflict(ctx, recovery);
    eventsAdded += result.added;
    remoteEventsPreserved += result.preserved;
    if (result.duplicate) duplicateRecoveries += 1;
    else recoveredSessions += 1;
  }
  return {
    ok: true,
    sessionId: root.header.id,
    title: root.title ?? "Imported session",
    sessions: logs.length,
    createdSessions: createPlans.length,
    updatedSessions: plans.filter((plan) => plan.kind === "update").length,
    unchangedSessions: plans.filter((plan) => plan.kind === "unchanged").length + duplicateRecoveries,
    recoveredSessions,
    remoteEventsPreserved,
    conflicts: conflictPlans.map((plan) => ({ sessionId: plan.log.header.id, divergence: plan.divergence, localEvents: plan.localEvents.length, remoteEvents: plan.log.events.length })),
    attachments: attachmentCount + recoveredSessions,
    events: logs.reduce((sum, log) => sum + log.events.length, 0),
    eventsAdded,
  };
}

function jsonError(error) {
  const status = error instanceof ImportFailure ? error.status : 500;
  const code = error instanceof ImportFailure ? error.code : "import-failed";
  const message = error instanceof Error ? error.message : String(error);
  return Response.json({ ok: false, code, message }, { status });
}

export function apply(ctx) {
  ctx.effect(() => ctx.connection.fetch.register({
    path: IMPORT_PATH,
    methods: ["POST"],
    requestBody: "streaming",
    fetch: async (request) => {
      try {
        const url = new URL(request.url);
        return Response.json(await importTransferArchive(ctx, await readBody(request), { onConflict: url.searchParams.get("onConflict") }));
      } catch (error) {
        ctx.logger?.warn?.("zadloop-session-transfer: import refused", error);
        return jsonError(error);
      }
    },
  }), "zadloop-session-transfer: lossless import route");
}
