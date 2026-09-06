#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { findViolations } from "./lib/boundary-checker.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixturesDir = path.join(repoRoot, "scripts/fixtures/boundary-violations");
const simulatedDomainPath = "packages/domain/src/example.ts";

/** @type {Record<string, { forbidden: RegExp, kind?: string }>} */
const negativeCases = {
  "multiline-import.ts": { forbidden: /openai/, kind: "import" },
  "side-effect-import.ts": { forbidden: /pg-boss/, kind: "side-effect-import" },
  "reexport.ts": { forbidden: /@dce\/providers/, kind: "re-export" },
  "relative-provider.ts": { forbidden: /providers/, kind: "re-export" },
  "require-import.ts": { forbidden: /@anthropic-ai/, kind: "require" },
};

for (const [fixtureName, expectation] of Object.entries(negativeCases)) {
  test(`detects forbidden boundary in ${fixtureName}`, async () => {
    const fixturePath = path.join(fixturesDir, fixtureName);
    const source = await readFile(fixturePath, "utf8");
    const violations = findViolations(simulatedDomainPath, source, repoRoot);

    assert.ok(violations.length > 0, `expected violations for ${fixtureName}, got none`);

    const match = violations.find(
      (violation) =>
        expectation.forbidden.test(violation.specifier) ||
        (violation.resolvedPath && expectation.forbidden.test(violation.resolvedPath)),
    );

    assert.ok(match, `expected forbidden import in ${fixtureName}`);
    if (expectation.kind) {
      assert.equal(match.kind, expectation.kind);
    }
    assert.equal(match.ruleId, "shared-packages");
  });
}

test("passes for legitimate domain imports", async () => {
  const source = 'import type { RunState } from "@dce/contracts";\nexport const ok = true;\n';
  const violations = findViolations(simulatedDomainPath, source, repoRoot);
  assert.equal(violations.length, 0);
});
