import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const name = "zadloop-computer-use";
export const inject = ["tools", "systemPrompt", "connection"];

export const STATE_PATH = "/api/zadloop-computer-use/state";
const ACTIONS = new Set(["screenshot", "cursor", "move", "click", "double_click", "right_click", "drag", "scroll", "type", "keypress", "wait"]);
const SCRIPT_PATH = join(dirname(fileURLToPath(import.meta.url)), "..", "scripts", "computer-use.ps1");
const MAX_CAPTURE_WIDTH = 1920;
const MAX_CAPTURE_HEIGHT = 1200;

function finiteInteger(value, label, { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${label} must be an integer from ${min} to ${max}.`);
  }
  return value;
}

function coordinate(value, label) {
  return finiteInteger(value, label, { min: 0, max: 100_000 });
}

function requireText(value, label, maxLength) {
  if (typeof value !== "string" || value.length === 0) throw new Error(`${label} must be a non-empty string.`);
  if (value.length > maxLength) throw new Error(`${label} must contain at most ${maxLength} characters.`);
  return value;
}

export function validateComputerAction(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) throw new Error("computer action must be an object.");
  const action = input.action;
  if (typeof action !== "string" || !ACTIONS.has(action)) throw new Error(`unsupported action: ${JSON.stringify(action)}.`);
  const result = { action };

  if (["move", "click", "double_click", "right_click", "drag"].includes(action)) {
    result.x = coordinate(input.x, "x");
    result.y = coordinate(input.y, "y");
  }
  if (action === "drag") {
    result.x2 = coordinate(input.x2, "x2");
    result.y2 = coordinate(input.y2, "y2");
    if (input.durationMs !== undefined) result.durationMs = finiteInteger(input.durationMs, "durationMs", { min: 100, max: 10_000 });
  }
  if (action === "scroll") {
    if (input.x !== undefined) result.x = coordinate(input.x, "x");
    if (input.y !== undefined) result.y = coordinate(input.y, "y");
    if ((input.x === undefined) !== (input.y === undefined)) throw new Error("scroll x and y must be provided together.");
    result.deltaX = input.deltaX === undefined ? 0 : finiteInteger(input.deltaX, "deltaX", { min: -100_000, max: 100_000 });
    result.deltaY = input.deltaY === undefined ? 0 : finiteInteger(input.deltaY, "deltaY", { min: -100_000, max: 100_000 });
    if (result.deltaX === 0 && result.deltaY === 0) throw new Error("scroll requires a non-zero deltaX or deltaY.");
  }
  if (action === "type") result.text = requireText(input.text, "text", 20_000);
  if (action === "keypress") result.keys = requireText(input.keys, "keys", 120);
  if (action === "wait") result.durationMs = finiteInteger(input.durationMs, "durationMs", { min: 50, max: 30_000 });
  if (input.settleMs !== undefined && !["screenshot", "cursor", "wait"].includes(action)) {
    result.settleMs = finiteInteger(input.settleMs, "settleMs", { min: 0, max: 5_000 });
  }
  return result;
}

export class ArmController {
  constructor(now = Date.now) {
    this.now = now;
    this.armedUntil = 0;
    this.generation = 0;
    this.aborters = new Set();
  }

  normalize() {
    if (this.armedUntil !== 0 && this.now() >= this.armedUntil) this.disable();
  }

  snapshot() {
    this.normalize();
    const now = this.now();
    return {
      ok: true,
      enabled: this.armedUntil > now,
      armedUntil: this.armedUntil || null,
      remainingMs: Math.max(0, this.armedUntil - now),
      platform: process.platform,
      capabilities: ["screenshot", "cursor", "move", "click", "double_click", "right_click", "drag", "scroll", "type", "keypress", "wait"],
    };
  }

  enable(minutes) {
    const duration = finiteInteger(minutes, "minutes", { min: 5, max: 120 });
    this.armedUntil = this.now() + duration * 60_000;
    this.generation += 1;
    return this.snapshot();
  }

  disable() {
    this.armedUntil = 0;
    this.generation += 1;
    for (const abort of this.aborters) abort();
    this.aborters.clear();
    return this.snapshot();
  }

  assertEnabled() {
    const state = this.snapshot();
    if (!state.enabled) throw new Error("Computer use is paused. Open Computer in the ZadLoop toolbar and arm it before retrying.");
    return this.generation;
  }

  track(abort) {
    this.aborters.add(abort);
    return () => this.aborters.delete(abort);
  }
}

function powershellPath() {
  const windows = process.env.SystemRoot || "C:\\Windows";
  return join(windows, "System32", "WindowsPowerShell", "v1.0", "powershell.exe");
}

function abortError() {
  const error = new Error("computer action aborted");
  error.name = "AbortError";
  return error;
}

async function runWorker(action, controller, signal) {
  const generation = controller.assertEnabled();
  const outputPath = join(tmpdir(), `zadloop-computer-${randomUUID()}.png`);
  const encoded = Buffer.from(JSON.stringify(action), "utf8").toString("base64");
  let child;
  let stderr = "";
  let stdout = "";
  let aborted = false;

  try {
    const result = await new Promise((resolve, reject) => {
      child = spawn(powershellPath(), [
        "-NoLogo",
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy", "Bypass",
        "-File", SCRIPT_PATH,
        "-RequestBase64", encoded,
        "-OutputPath", outputPath,
        "-MaxWidth", String(MAX_CAPTURE_WIDTH),
        "-MaxHeight", String(MAX_CAPTURE_HEIGHT),
      ], { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });

      const stop = () => {
        aborted = true;
        child?.kill();
      };
      const untrack = controller.track(stop);
      const onAbort = () => stop();
      signal?.addEventListener("abort", onAbort, { once: true });
      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");
      child.stdout.on("data", (chunk) => { stdout += chunk; });
      child.stderr.on("data", (chunk) => { stderr += chunk; });
      child.once("error", (error) => {
        untrack();
        signal?.removeEventListener("abort", onAbort);
        reject(error);
      });
      child.once("exit", (code) => {
        untrack();
        signal?.removeEventListener("abort", onAbort);
        if (aborted || signal?.aborted || controller.generation !== generation) reject(abortError());
        else if (code !== 0) reject(new Error(`computer worker failed (${code}): ${stderr.trim() || stdout.trim() || "unknown error"}`));
        else resolve(stdout);
      });
    });

    const line = result.split(/\r?\n/u).map((entry) => entry.trim()).filter(Boolean).at(-1);
    if (!line) throw new Error("computer worker returned no metadata.");
    const metadata = JSON.parse(line);
    const data = await readFile(outputPath);
    return { metadata, data };
  } finally {
    await unlink(outputPath).catch(() => {});
  }
}

function imageValue(ref) {
  return {
    attachmentId: ref.attachmentId,
    mediaType: ref.mediaType,
    bytes: ref.bytes,
    width: ref.width,
    height: ref.height,
    ...(ref.name === undefined ? {} : { name: ref.name }),
    ...(ref.originalDimensions === undefined ? {} : { originalDimensions: { ...ref.originalDimensions } }),
  };
}

function imageBlock(image) {
  return {
    type: "image",
    attachment: {
      attachmentId: image.attachmentId,
      mediaType: image.mediaType,
      bytes: image.bytes,
      width: image.width,
      height: image.height,
      ...(image.name === undefined ? {} : { name: image.name }),
      ...(image.originalDimensions === undefined ? {} : { originalDimensions: { ...image.originalDimensions } }),
    },
  };
}

function actionSummary(args) {
  if (["click", "double_click", "right_click", "move"].includes(args.action)) return `${args.action} at (${args.x}, ${args.y})`;
  if (args.action === "drag") return `drag (${args.x}, ${args.y}) to (${args.x2}, ${args.y2})`;
  if (args.action === "scroll") return `scroll (${args.deltaX ?? 0}, ${args.deltaY ?? 0})`;
  if (args.action === "keypress") return `press ${args.keys}`;
  if (args.action === "type") return `type ${args.text.length} character${args.text.length === 1 ? "" : "s"}`;
  if (args.action === "wait") return `wait ${args.durationMs} ms`;
  return args.action;
}

const IMAGE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["attachmentId", "mediaType", "bytes", "width", "height"],
  properties: {
    attachmentId: { type: "string" },
    mediaType: { type: "string" },
    bytes: { type: "integer" },
    width: { type: "integer" },
    height: { type: "integer" },
    name: { type: "string" },
    originalDimensions: {
      type: "object",
      additionalProperties: false,
      required: ["width", "height"],
      properties: {
        width: { type: "integer" },
        height: { type: "integer" },
      },
    },
  },
};

function createComputerTool(ctx, controller) {
  return {
    name: "computer",
    description: "Control the visible Windows desktop and receive a fresh screenshot after every action. Coordinates always refer to the most recent returned screenshot, including multi-monitor desktops. Use screenshot before the first interaction, inspect the result after every action, and never guess coordinates. Computer control must be armed by the user from the ZadLoop toolbar.",
    parameters: {
      type: "object",
      additionalProperties: false,
      required: ["action"],
      properties: {
        action: {
          type: "string",
          enum: [...ACTIONS],
          description: "Desktop action to perform.",
        },
        x: { type: "integer", description: "Screenshot-relative x coordinate." },
        y: { type: "integer", description: "Screenshot-relative y coordinate." },
        x2: { type: "integer", description: "Screenshot-relative drag destination x coordinate." },
        y2: { type: "integer", description: "Screenshot-relative drag destination y coordinate." },
        deltaX: { type: "integer", description: "Horizontal scroll amount. Negative scrolls left; positive scrolls right." },
        deltaY: { type: "integer", description: "Vertical scroll amount. Negative scrolls down; positive scrolls up." },
        text: { type: "string", description: "Unicode text to type into the focused control." },
        keys: { type: "string", description: "Key or chord such as ENTER, CTRL+L, ALT+TAB, WIN+R, or CTRL+SHIFT+P." },
        durationMs: { type: "integer", description: "Wait duration, or optional drag duration." },
        settleMs: { type: "integer", description: "Delay after an interaction before taking the screenshot (default 250 ms)." },
      },
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["action", "summary", "screen", "cursor", "image"],
        properties: {
          action: { type: "string" },
          summary: { type: "string" },
          screen: {
            type: "object",
            additionalProperties: false,
            required: ["originX", "originY", "desktopWidth", "desktopHeight", "screenshotWidth", "screenshotHeight", "scaleX", "scaleY"],
            properties: {
              originX: { type: "integer" },
              originY: { type: "integer" },
              desktopWidth: { type: "integer" },
              desktopHeight: { type: "integer" },
              screenshotWidth: { type: "integer" },
              screenshotHeight: { type: "integer" },
              scaleX: { type: "number" },
              scaleY: { type: "number" },
            },
          },
          cursor: {
            type: "object",
            additionalProperties: false,
            required: ["x", "y"],
            properties: {
              x: { type: "integer" },
              y: { type: "integer" },
            },
          },
          image: IMAGE_SCHEMA,
        },
      },
      render: (_args, value) => [{
        type: "text",
        text: `${value.summary}. Screenshot ${value.screen.screenshotWidth}x${value.screen.screenshotHeight}; cursor (${value.cursor.x}, ${value.cursor.y}).`,
      }, imageBlock(value.image)],
      presentationMeta: (_args, value) => ({ width: value.screen.screenshotWidth, height: value.screen.screenshotHeight }),
    },
    timeoutMs: 45_000,
    async execute(rawArgs, exec) {
      if (process.platform !== "win32") throw new Error("ZadLoop Computer Use currently supports Windows only.");
      const args = validateComputerAction(rawArgs);
      const { metadata, data } = await runWorker(args, controller, exec.signal);
      const ref = await ctx.attachments.saveImage({ data, mediaType: "image/png", name: `computer-${args.action}.png` });
      return {
        action: args.action,
        summary: actionSummary(args),
        screen: metadata.screen,
        cursor: metadata.cursor,
        image: imageValue(ref),
      };
    },
    presentCall: (rawArgs) => {
      try {
        const args = validateComputerAction(rawArgs);
        return {
          card: "generic",
          title: "Computer",
          kind: "execute",
          content: [{ type: "text", text: actionSummary(args) }],
        };
      } catch {
        return undefined;
      }
    },
    presentResult: (_args, result) => {
      const value = result.value;
      if (!value || result.isError) return undefined;
      return { card: "generic", content: [{ type: "text", text: `${value.summary} · ${value.screen.screenshotWidth}×${value.screen.screenshotHeight}` }] };
    },
  };
}

function stateRoute(controller) {
  return {
    path: STATE_PATH,
    methods: ["GET", "POST"],
    requestBody: "buffered",
    fetch: async (request) => {
      if (request.method === "GET") return Response.json(controller.snapshot());
      let body;
      try {
        body = await request.json();
      } catch {
        return Response.json({ ok: false, message: "Invalid JSON body." }, { status: 400 });
      }
      try {
        if (body?.enabled === true) return Response.json(controller.enable(body.minutes ?? 30));
        if (body?.enabled === false) return Response.json(controller.disable());
        return Response.json({ ok: false, message: "enabled must be true or false." }, { status: 400 });
      } catch (error) {
        return Response.json({ ok: false, message: error instanceof Error ? error.message : String(error) }, { status: 400 });
      }
    },
  };
}

export function apply(ctx) {
  const controller = new ArmController();
  ctx.effect(() => ctx.connection.fetch.register(stateRoute(controller)), "zadloop-computer-use: arm state route");
  ctx.effect(() => () => controller.disable(), "zadloop-computer-use: stop actions on dispose");
  ctx.systemPrompt.section({
    name: "tool:computer",
    order: ctx.systemPrompt.getSectionOrder?.("TOOL_COMPUTER") ?? 5_000,
    text: "The computer tool controls the user's visible Windows desktop. It is paused until the user explicitly arms it in the Computer toolbar panel. Start with screenshot, use only coordinates from the latest screenshot, inspect every returned screenshot, and stop before consequential or sensitive actions unless the user clearly requested them.",
  });
  ctx.inject(["attachments"], (imageCtx) => imageCtx.tools.register(createComputerTool(imageCtx, controller)));
}
