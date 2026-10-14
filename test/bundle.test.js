import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("declares one installable managed ZadLoop bundle", async () => {
  const manifest = JSON.parse(await readFile(new URL("package.json", root), "utf8"));
  assert.equal(manifest.name, "dsh-zadloop-ultimate-toolkit");
  assert.equal(manifest.version, "1.9.1");
  assert.equal(manifest.dsh.bundle.patch, "./cordis.patch.yml");
  assert.equal(manifest.bundledDependencies.length, 8);
});

test("activates every promised feature package exactly once", async () => {
  const patch = await readFile(new URL("cordis.patch.yml", root), "utf8");
  for (const name of [
    "@wasd258/dsh-context-surgery",
    "dsh-zadloop-undo",
    "dsh-zadloop-mode-switcher",
    "dsh-zadloop-computer-use",
    "dsh-zadloop-remote-control-v224",
    "dsh-zadloop-theme-studio-v530",
    "dsh-zadloop-session-transfer",
  ]) {
    assert.equal(patch.split(name).length - 1, 1, `${name} should appear once`);
  }
});

test("all offline vendor archives are present", async () => {
  for (const file of [
    "wasd258-dsh-context-surgery-0.1.2-zadloop-fixed-v4.tgz",
    "dsh-zadloop-undo-1.5.1.tgz",
    "dsh-zadloop-mode-switcher-2.0.3.tgz",
    "dsh-zadloop-computer-use-1.1.1.tgz",
    "dsh-zadloop-remote-control-v224-2.2.4.tgz",
    "dsh-zadloop-theme-studio-v530-5.3.0.tgz",
    "dsh-zadloop-session-transfer-1.2.0.tgz",
    "fflate-0.8.3.tgz",
  ]) {
    await access(new URL(`vendor/${file}`, root));
  }
});

test("Computer Use source matches the bundled component version", async () => {
  const toolkit = JSON.parse(await readFile(new URL("package.json", root), "utf8"));
  const computer = JSON.parse(await readFile(new URL("packages/computer-use/package.json", root), "utf8"));
  assert.equal(computer.name, "dsh-zadloop-computer-use");
  assert.equal(computer.version, "1.1.1");
  assert.equal(toolkit.dependencies[computer.name], `file:vendor/${computer.name}-${computer.version}.tgz`);
});

test("Remote Control source matches the bundled component version", async () => {
  const toolkit = JSON.parse(await readFile(new URL("package.json", root), "utf8"));
  const remote = JSON.parse(await readFile(new URL("packages/remote-control/package.json", root), "utf8"));
  assert.equal(remote.name, "dsh-zadloop-remote-control");
  assert.equal(remote.version, "2.2.4");
  assert.equal(toolkit.dependencies["dsh-zadloop-remote-control-v224"], `file:vendor/dsh-zadloop-remote-control-v224-${remote.version}.tgz`);
});

test("Session Transfer source matches the bundled component version", async () => {
  const toolkit = JSON.parse(await readFile(new URL("package.json", root), "utf8"));
  const transfer = JSON.parse(await readFile(new URL("packages/session-transfer/package.json", root), "utf8"));
  assert.equal(transfer.name, "dsh-zadloop-session-transfer");
  assert.equal(transfer.version, "1.2.0");
  assert.equal(toolkit.dependencies[transfer.name], `file:vendor/${transfer.name}-${transfer.version}.tgz`);
});
