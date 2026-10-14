import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const client = await readFile(new URL("../lib/client.js", import.meta.url), "utf8");

test("registers a compact plan-quota control in the composer dock", () => {
  assert.match(client, /conversation\.composer\.dock/);
  assert.match(client, /oauth-subs-auth/);
  assert.match(client, /callRpc\(rpc, "status", \{ revalidateQuota: true \}\)/);
  assert.match(client, /remainingPercent/);
  assert.match(client, /5-hour/);
  assert.match(client, /Weekly/);
  assert.match(client, /ztu-quota-pop/);
  assert.doesNotMatch(client, /openQuotaWorkbench|launcher\?\.click/);
});

test("icon fixes are scoped to the toolkit controls", () => {
  assert.match(client, /\.zms-icon svg,\.zst-icon svg/);
  assert.doesNotMatch(client, /(^|[,{\s])button svg\s*\{/m);
});

test("loads through ZadLoop's module loader, registers the dock slot, and renders remaining plan quota", () => {
  let definition;
  const appended = [];
  const cached = {
    accounts: {
      antigravity: {
        activeId: "account-1",
        accounts: [{
          id: "account-1",
          active: true,
          quota: {
            planType: "pro",
            rows: [
              { kind: "primary", windowMinutes: 300, remainingPercent: 72 },
              { kind: "weekly", usedPercent: 59 },
            ],
          },
        }],
      },
    },
  };
  const sandbox = {
    window: {
      __ModuleLoader__: { load(value) { definition = value; } },
      setTimeout() {},
      setInterval() { return 1; },
      clearInterval() {},
    },
    localStorage: {
      getItem(key) { return key === "dsh-plugin-oauth-subs.status" ? JSON.stringify(cached) : null; },
      setItem() {},
    },
    document: {
      body: {},
      getElementById() { return null; },
      createElement() { return {}; },
      head: { appendChild(value) { appended.push(value); } },
      querySelectorAll() { return []; },
    },
  };
  vm.runInNewContext(client, sandbox, { filename: "client.js" });
  assert.equal(definition.id, "dsh-zadloop-toolkit-ui");
  const React = {
    createElement(type, props, ...children) { return { type, props: props || {}, children }; },
    useEffect() {},
    useState(initial) {
      const value = typeof initial === "function" ? initial() : initial;
      return [value === false ? true : value, () => {}];
    },
  };
  const ReactDOM = {
    createPortal(node, target) {
      assert.equal(target, sandbox.document.body);
      return node;
    },
  };
  const plugin = definition.factory((id) => {
    if (id === "react") return React;
    if (id === "react-dom") return ReactDOM;
    assert.fail(`Unexpected module ${id}`);
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
  assert.equal(registration.spec.id, "zadloop-toolkit-quota");
  assert.equal(typeof registration.component, "function");
  const rendered = registration.component({ ctx });
  const text = (node) => typeof node === "string"
    ? node
    : Array.isArray(node)
      ? node.map(text).join(" ")
      : node?.children?.map(text).join(" ") || "";
  assert.match(text(rendered), /5h\s+72%/);
  assert.match(text(rendered), /Week\s+41%/);
  assert.match(text(rendered), /Plan remaining/);
  assert.match(text(rendered), /Antigravity/);
  const trigger = rendered.children[0];
  assert.match(trigger.props.title, /Plan remaining: 5-hour 72% · Weekly 41%/);
  assert.equal(trigger.props["aria-expanded"], true);
});
