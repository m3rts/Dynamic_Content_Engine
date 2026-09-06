#!/usr/bin/env node

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { findViolations } from "./lib/boundary-checker.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function collectSourceFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  /** @type {string[]} */
  const files = [];

  for (const entry of entries) {
    if (
      entry.name === "node_modules" ||
      entry.name === "dist" ||
      entry.name.startsWith(".") ||
      entry.name === "__boundary-fixtures__"
    ) {
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

  /** @type {import("./lib/boundary-checker.mjs").BoundaryViolation[]} */
  const violations = [];

  for (const filePath of sourceFiles) {
    const relativePath = relativePosix(filePath);
    const source = await readFile(filePath, "utf8");
    violations.push(...findViolations(relativePath, source, repoRoot));
  }

  if (violations.length > 0) {
    console.error("Dependency boundary violations:");
    for (const violation of violations) {
      const resolved = violation.resolvedPath ? ` -> ${violation.resolvedPath}` : "";
      console.error(
        `- ${violation.file}:${violation.line} [${violation.ruleId}] ${violation.kind} "${violation.specifier}"${resolved}`,
      );
    }
    process.exitCode = 1;
    return;
  }

  console.log(`Dependency boundaries OK (${sourceFiles.length} source files scanned).`);
}

await main();
