#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const configPath = join(repoRoot, ".gitleaks.toml");
const violationFixture = join(
  repoRoot,
  "scripts/fixtures/gitleaks-violations/apps/web/src/integration/should-flag.test.ts",
);
const allowedFixture = join(repoRoot, "apps/web/src/integration/client-context.test.ts");

function gitleaksCommand() {
  const installed = spawnSync("gitleaks", ["version"], { encoding: "utf8" });
  if (installed.status === 0) {
    return ["gitleaks"];
  }

  try {
    execFileSync("bash", [join(repoRoot, "scripts/install-gitleaks.sh"), join(repoRoot, ".bin")], {
      stdio: "pipe",
    });
    return [join(repoRoot, ".bin/gitleaks")];
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

test("gitleaks config extends default rules without broad integration exclusions", () => {
  const config = readFileSync(configPath, "utf8");
  assert.match(config, /\[extend\]/);
  assert.match(config, /useDefault\s*=\s*true/);
  assert.doesNotMatch(config, /^\[\[allowlists\]\]/m);
  assert.doesNotMatch(config, /apps\/web\/src\/integration\/\.\*\\\.test\\\.ts/);
});

test("detects synthetic secrets inside integration-test paths", () => {
  const result = runDetect(["--verbose"], violationFixture);
  if (result.skipped) {
    return;
  }

  assert.notEqual(result.status, 0, result.output);
  assert.match(result.output, /generic-api-key|leaks found/i);
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
  const result = runDetect(["--verbose"], join(repoRoot, "scripts/fixtures/gitleaks-violations"));
  if (result.skipped) {
    return;
  }

  assert.notEqual(result.status, 0, result.output);
  assert.match(result.output, /8e4f73c6-79b6-4500-aa26-55bbf2188fb4|generic-api-key|leaks found/i);
});
