#!/usr/bin/env node

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** @typedef {{ id: string, from: string, forbidden: RegExp[], allowed?: RegExp[] }} BoundaryRule */

/** @type {BoundaryRule[]} */
const rules = [
  {
    id: "shared-packages",
    from: "packages/(contracts|domain|policy|observability|db|storage|evals)",
    forbidden: [
      /^apps\//,
      /^@dce\/providers/,
      /^next(?:\/|$)/,
      /^react(?:\/|$)/,
      /^pg-boss(?:\/|$)/,
      /^@aws-sdk\//,
      /^openai(?:\/|$)/,
      /^@anthropic-ai\//,
    ],
  },
  {
    id: "apps-web",
    from: "apps/web",
    forbidden: [/^@dce\/providers/, /^pg-boss(?:\/|$)/, /^openai(?:\/|$)/, /^@anthropic-ai\//],
  },
  {
    id: "apps-worker",
    from: "apps/worker",
    forbidden: [/^next(?:\/|$)/, /^react(?:\/|$)/],
  },
];

const importPattern =
  /(?:import\s+(?:type\s+)?[^'";]+from\s+|import\s*\(|require\s*\()\s*['"]([^'"]+)['"]/g;

async function collectSourceFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  /** @type {string[]} */
  const files = [];

  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === "dist" || entry.name.startsWith(".")) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(fullPath)));
      continue;
    }

    if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
      files.push(fullPath);
    }
  }

  return files;
}

function relativePosix(filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join("/");
}

function ruleMatchesFile(rule, relativePath) {
  return new RegExp(`^${rule.from}(?:/|$)`).test(relativePath);
}

function findViolations(relativePath, source) {
  /** @type {{ ruleId: string, specifier: string, line: number }[]} */
  const violations = [];
  const applicableRules = rules.filter((rule) => ruleMatchesFile(rule, relativePath));

  if (applicableRules.length === 0) {
    return violations;
  }

  const lines = source.split("\n");
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    importPattern.lastIndex = 0;
    let match = importPattern.exec(line);

    while (match) {
      const specifier = match[1];
      for (const rule of applicableRules) {
        if (rule.forbidden.some((pattern) => pattern.test(specifier))) {
          violations.push({
            ruleId: rule.id,
            specifier,
            line: lineIndex + 1,
          });
        }
      }

      match = importPattern.exec(line);
    }
  }

  return violations;
}

async function main() {
  const scanRoots = ["packages", "apps"].map((segment) => path.join(repoRoot, segment));
  /** @type {string[]} */
  const sourceFiles = [];

  for (const scanRoot of scanRoots) {
    try {
      sourceFiles.push(...(await collectSourceFiles(scanRoot)));
    } catch (error) {
      if (/** @type {NodeJS.ErrnoException} */ (error).code !== "ENOENT") {
        throw error;
      }
    }
  }

  /** @type {{ file: string, ruleId: string, specifier: string, line: number }[]} */
  const violations = [];

  for (const filePath of sourceFiles) {
    const relativePath = relativePosix(filePath);
    const source = await readFile(filePath, "utf8");
    for (const violation of findViolations(relativePath, source)) {
      violations.push({ file: relativePath, ...violation });
    }
  }

  if (violations.length > 0) {
    console.error("Dependency boundary violations:");
    for (const violation of violations) {
      console.error(
        `- ${violation.file}:${violation.line} [${violation.ruleId}] imports forbidden module "${violation.specifier}"`,
      );
    }
    process.exitCode = 1;
    return;
  }

  console.log(`Dependency boundaries OK (${sourceFiles.length} source files scanned).`);
}

await main();
