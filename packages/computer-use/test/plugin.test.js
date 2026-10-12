import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { apply, ArmController, validateComputerAction } from "../lib/index.js";

test("arm grants expire and pause increments the generation", () => {
  let now = 1_000;
  const arm = new ArmController(() => now);
  assert.equal(arm.snapshot().enabled, false);
  arm.enable(15);
  assert.equal(arm.snapshot().enabled, true);
  now += 15 * 60_000 + 1;
  assert.equal(arm.snapshot().enabled, false);
  const before = arm.generation;
  arm.disable();
  assert.equal(arm.generation, before + 1);
});

test("action validation accepts complete operations and rejects missing fields", () => {
  assert.deepEqual(validateComputerAction({ action: "click", x: 10, y: 20 }), { action: "click", x: 10, y: 20 });
  assert.deepEqual(validateComputerAction({ action: "keypress", keys: "CTRL+SHIFT+P" }), { action: "keypress", keys: "CTRL+SHIFT+P" });
  assert.throws(() => validateComputerAction({ action: "drag", x: 1, y: 2 }), /x2/);
  assert.throws(() => validateComputerAction({ action: "type", text: "" }), /non-empty/);
  assert.throws(() => validateComputerAction({ action: "launch", text: "calc" }), /unsupported action/);
});

test("PowerShell worker contains no arbitrary command evaluation", async () => {
  const source = await readFile(new URL("../scripts/computer-use.ps1", import.meta.url), "utf8");
  for (const forbidden of ["Invoke-Expression", "iex ", "Start-Process", "cmd.exe", "-Command"]) {
    assert.equal(source.includes(forbidden), false, `worker must not contain ${forbidden}`);
  }
});

test("plugin registers its authenticated state route and one computer tool", () => {
  const routes = [];
  const tools = [];
  const ctx = {
    connection: { fetch: { register(route) { routes.push(route); return () => {}; } } },
    effect(factory) { factory(); },
    systemPrompt: { getSectionOrder() { return 5000; }, section() {} },
    tools: { register(tool) { tools.push(tool); return () => {}; } },
    inject(names, callback) {
      assert.deepEqual(names, ["attachments"]);
      callback({ ...this, attachments: { saveImage() { throw new Error("not executed"); } } });
    },
  };
  apply(ctx);
  assert.equal(routes.length, 1);
  assert.deepEqual(routes[0].methods, ["GET", "POST"]);
  assert.equal(tools.length, 1);
  assert.equal(tools[0].name, "computer");
  assert.deepEqual(tools[0].parameters.required, ["action"]);
  assert.equal(tools[0].parameters.properties.action.enum.includes("screenshot"), true);
  assert.equal(tools[0].output.schema.required.includes("image"), true);
});
