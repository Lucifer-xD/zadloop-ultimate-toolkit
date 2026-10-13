import { unzipSync } from "fflate";
import { isDeepStrictEqual } from "node:util";

export const name = "zadloop-session-transfer";
export const inject = ["connection", "sessionPersistence", "attachments", "sessions"];

export const IMPORT_PATH = "/api/zadloop-session-transfer/import";
export const MAX_ARCHIVE_BYTES = 384 * 1024 * 1024;
export const MAX_EXPANDED_BYTES = 768 * 1024 * 1024;
export const MAX_ARCHIVE_ENTRIES = 10_000;

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

function classifyExistingLog(log, localHeader, localEvents, live) {
  assertCompatibleHeader(localHeader, log.header);
  const shared = Math.min(localEvents.length, log.events.length);
  for (let index = 0; index < shared; index += 1) {
    if (!eventsEquivalent(localEvents[index], log.events[index])) {
      throw new ImportFailure(
        `Session ${log.header.id} has different history at event ${index}. Both computers changed this session, so it cannot be merged automatically without corrupting the conversation. Nothing was changed.`,
        409,
        "session-conflict",
      );
    }
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

async function planSessionChanges(ctx, logs) {
  const plans = [];
  for (const log of logs) {
    const snapshot = await ctx.sessionPersistence.stat(log.header.id);
    if (snapshot === undefined) {
      plans.push({ kind: "create", log });
      continue;
    }
    const stored = await readStoredLog(ctx, log.header.id);
    plans.push(classifyExistingLog(log, stored.header, stored.events, stored.live));
  }
  return plans;
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

export async function importTransferArchive(ctx, bytes) {
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
  const plans = await planSessionChanges(ctx, logs);
  const attachmentCount = await storeAttachments(ctx, entries);
  let eventsAdded = 0;
  for (const plan of plans) {
    if (plan.kind === "update") eventsAdded += await updateStoredSession(ctx, plan);
  }
  const createPlans = plans.filter((plan) => plan.kind === "create");
  await createStoredSessions(ctx, createPlans);
  eventsAdded += createPlans.reduce((sum, plan) => sum + plan.log.events.length, 0);
  return {
    ok: true,
    sessionId: root.header.id,
    title: root.title ?? "Imported session",
    sessions: logs.length,
    createdSessions: createPlans.length,
    updatedSessions: plans.filter((plan) => plan.kind === "update").length,
    unchangedSessions: plans.filter((plan) => plan.kind === "unchanged").length,
    attachments: attachmentCount,
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
        return Response.json(await importTransferArchive(ctx, await readBody(request)));
      } catch (error) {
        ctx.logger?.warn?.("zadloop-session-transfer: import refused", error);
        return jsonError(error);
      }
    },
  }), "zadloop-session-transfer: lossless import route");
}
