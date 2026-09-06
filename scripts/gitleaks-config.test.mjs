#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const configPath = join(repoRoot, ".gitleaks.toml");
const allowedFixture = join(repoRoot, "apps/web/src/integration/client-context.test.ts");

function resolveGitleaksBin() {
  const candidate = process.env.GITLEAKS_BIN ?? "gitleaks";
  const result = spawnSync(candidate, ["version"], { encoding: "utf8" });
  if (result.status !== 0) {
    return null;
  }

  return candidate;
}

function requireGitleaksBin() {
  const bin = resolveGitleaksBin();
  if (bin) {
    return bin;
  }

  assert.fail(
    "gitleaks is required for config regression tests; install it with scripts/install-gitleaks.sh",
  );
}

function runDetect(gitleaksBin, gitleaksArgs, source) {
  const result = spawnSync(
    gitleaksBin,
    [
      "detect",
      "--no-banner",
      "--no-git",
      "--config",
      configPath,
      "--source",
      source,
      ...gitleaksArgs,
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
    },
  );

  return {
    status: result.status ?? 1,
    output: `${result.stdout}\n${result.stderr}`,
  };
}

function buildSyntheticApiKey() {
  const chunks = ["8e4f73c6", "79b6", "4500", "aa26", "55bbf2188fb4"];
  return chunks.join("-");
}

function writeSyntheticSecretFile(filePath, bindingName) {
  writeFileSync(filePath, `export const ${bindingName} = "${buildSyntheticApiKey()}";\n`);
}

function writeIntegrationLeakFixture(rootDir) {
  const integrationDir = join(rootDir, "apps/web/src/integration");
  mkdirSync(integrationDir, { recursive: true });
  const fixturePath = join(integrationDir, "should-flag.test.ts");
  writeSyntheticSecretFile(fixturePath, "leakedApiKey");
  return fixturePath;
}

test("gitleaks config extends default rules without broad integration exclusions", () => {
  const config = readFileSync(configPath, "utf8");
  assert.match(config, /\[extend\]/);
  assert.match(config, /useDefault\s*=\s*true/);
  assert.doesNotMatch(config, /^\[\[allowlists\]\]/m);
  assert.doesNotMatch(config, /apps\/web\/src\/integration\/\.\*\\\.test\\\.ts/);
});

test("detects synthetic secrets inside integration-test paths", () => {
  const gitleaksBin = requireGitleaksBin();
  const fixtureRoot = mkdtempSync(join(tmpdir(), "dce-gitleaks-fixture-"));
  writeIntegrationLeakFixture(fixtureRoot);

  const result = runDetect(gitleaksBin, ["--verbose"], fixtureRoot);
  assert.notEqual(result.status, 0, result.output);
  assert.match(result.output, /generic-api-key|leaks found/i);
  assert.match(result.output, /apps\/web\/src\/integration\/should-flag\.test\.ts/i);
});

test("allows the runtime-generated client-context auth secret assignment", () => {
  const gitleaksBin = requireGitleaksBin();
  const result = runDetect(gitleaksBin, ["--verbose"], allowedFixture);
  assert.equal(result.status, 0, result.output);
  assert.match(result.output, /no leaks found/i);
});

test("default rules remain active for non-allowlisted files", () => {
  const gitleaksBin = requireGitleaksBin();
  const fixtureRoot = mkdtempSync(join(tmpdir(), "dce-gitleaks-fixture-"));
  const fixturePath = join(fixtureRoot, "leak.ts");
  writeSyntheticSecretFile(fixturePath, "token");

  const result = runDetect(gitleaksBin, ["--verbose"], fixturePath);
  assert.notEqual(result.status, 0, result.output);
  assert.match(result.output, /generic-api-key|leaks found/i);
});
