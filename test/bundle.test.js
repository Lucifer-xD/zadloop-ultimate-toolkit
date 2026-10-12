import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("declares one installable managed ZadLoop bundle", async () => {
  const manifest = JSON.parse(await readFile(new URL("package.json", root), "utf8"));
  assert.equal(manifest.name, "dsh-zadloop-ultimate-toolkit");
  assert.equal(manifest.version, "1.1.1");
  assert.equal(manifest.dsh.bundle.patch, "./cordis.patch.yml");
  assert.equal(manifest.bundledDependencies.length, 7);
});

test("activates every promised feature package exactly once", async () => {
  const patch = await readFile(new URL("cordis.patch.yml", root), "utf8");
  for (const name of [
    "@wasd258/dsh-context-surgery",
    "dsh-zadloop-undo",
    "dsh-zadloop-mode-switcher",
    "dsh-zadloop-computer-use",
    "dsh-zadloop-theme-studio",
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
    "dsh-zadloop-computer-use-1.0.2.tgz",
    "dsh-zadloop-theme-studio-5.0.3.tgz",
    "dsh-zadloop-session-transfer-1.0.2.tgz",
    "fflate-0.8.3.tgz",
  ]) {
    await access(new URL(`vendor/${file}`, root));
  }
});

test("Computer Use source matches the bundled component version", async () => {
  const toolkit = JSON.parse(await readFile(new URL("package.json", root), "utf8"));
  const computer = JSON.parse(await readFile(new URL("packages/computer-use/package.json", root), "utf8"));
  assert.equal(computer.name, "dsh-zadloop-computer-use");
  assert.equal(computer.version, "1.0.2");
  assert.equal(toolkit.dependencies[computer.name], `file:vendor/${computer.name}-${computer.version}.tgz`);
});
