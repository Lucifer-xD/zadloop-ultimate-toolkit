import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const client = await readFile(new URL("../lib/client.js", import.meta.url), "utf8");

test("registers a compact usage control in the composer dock", () => {
  assert.match(client, /conversation\.composer\.dock/);
  assert.match(client, /oauth-subs-auth/);
  assert.match(client, /Today:/);
});

test("icon fixes are scoped to the toolkit controls", () => {
  assert.match(client, /\.zms-icon svg,\.zst-icon svg/);
  assert.doesNotMatch(client, /(^|[,{\s])button svg\s*\{/m);
});

test("loads through ZadLoop's module loader and registers the dock slot", () => {
  let definition;
  const appended = [];
  const sandbox = {
    window: { __ModuleLoader__: { load(value) { definition = value; } } },
    document: {
      getElementById() { return null; },
      createElement() { return {}; },
      head: { appendChild(value) { appended.push(value); } },
    },
  };
  vm.runInNewContext(client, sandbox, { filename: "client.js" });
  assert.equal(definition.id, "dsh-zadloop-toolkit-ui");
  const React = {
    createElement() {},
    useEffect() {},
    useState(initial) { return [typeof initial === "function" ? initial() : initial, () => {}]; },
  };
  const plugin = definition.factory((id) => {
    assert.equal(id, "react");
    return React;
  });
  let registration;
  const ctx = {
    get() { return { rpc: {} }; },
    slots: {
      inject(name, callback) {
        assert.equal(name, "conversation.composer.dock");
        callback();
      },
      register(spec, component) {
        registration = { spec, component };
      },
    },
  };
  plugin.apply(ctx);
  assert.equal(appended.length, 1);
  assert.equal(registration.spec.id, "zadloop-toolkit-usage");
  assert.equal(typeof registration.component, "function");
});
