#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const configPath = join(repoRoot, ".gitleaks.toml");
const allowedFixture = join(repoRoot, "apps/web/src/integration/client-context.test.ts");

function gitleaksCommand() {
  const installed = spawnSync("gitleaks", ["version"], { encoding: "utf8" });
  if (installed.status === 0) {
    return ["gitleaks"];
  }

  try {
    const installDir = mkdtempSync(join(tmpdir(), "dce-gitleaks-"));
    execFileSync("bash", [join(repoRoot, "scripts/install-gitleaks.sh"), installDir], {
      stdio: "pipe",
      cwd: installDir,
    });
    return [join(installDir, "gitleaks")];
  } catch {
    return null;
  }
}

function runDetect(gitleaksArgs, source) {
  const command = gitleaksCommand();
  if (!command) {
    return { skipped: true, status: 0, output: "gitleaks unavailable" };
  }

  const result = spawnSync(
    command[0],
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
    skipped: false,
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
  const fixtureRoot = mkdtempSync(join(tmpdir(), "dce-gitleaks-fixture-"));
  writeIntegrationLeakFixture(fixtureRoot);

  const result = runDetect(["--verbose"], fixtureRoot);
  if (result.skipped) {
    return;
  }

  assert.notEqual(result.status, 0, result.output);
  assert.match(result.output, /generic-api-key|leaks found/i);
  assert.match(result.output, /apps\/web\/src\/integration\/should-flag\.test\.ts/i);
});

test("allows the runtime-generated client-context auth secret assignment", () => {
  const result = runDetect(["--verbose"], allowedFixture);
  if (result.skipped) {
    return;
  }

  assert.equal(result.status, 0, result.output);
  assert.match(result.output, /no leaks found/i);
});

test("default rules remain active for non-allowlisted files", () => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), "dce-gitleaks-fixture-"));
  const fixturePath = join(fixtureRoot, "leak.ts");
  writeSyntheticSecretFile(fixturePath, "token");

  const result = runDetect(["--verbose"], fixturePath);
  if (result.skipped) {
    return;
  }

  assert.notEqual(result.status, 0, result.output);
  assert.match(result.output, /generic-api-key|leaks found/i);
});
