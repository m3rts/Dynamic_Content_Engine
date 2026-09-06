#!/usr/bin/env node

import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const docsRoot = path.join(repoRoot, "docs");

const markdownLinkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
const skippedPrefixes = ["http://", "https://", "mailto:", "#"];

async function collectMarkdownFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  /** @type {string[]} */
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectMarkdownFiles(fullPath)));
      continue;
    }

    if (entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }

  return files;
}

function resolveLink(sourceFile, target) {
  const decoded = decodeURIComponent(target.split("#")[0] ?? target);
  if (decoded.length === 0) {
    return null;
  }

  if (path.isAbsolute(decoded)) {
    return path.join(repoRoot, decoded.replace(/^\//, ""));
  }

  return path.resolve(path.dirname(sourceFile), decoded);
}

async function pathExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const rootMarkdown = (await readdir(repoRoot))
    .filter((name) => name.endsWith(".md"))
    .map((name) => path.join(repoRoot, name));

  const markdownFiles = [...rootMarkdown, ...(await collectMarkdownFiles(docsRoot))];
  /** @type {{ file: string, link: string, line: number }[]} */
  const broken = [];

  for (const filePath of markdownFiles) {
    const content = await readFile(filePath, "utf8");
    const lines = content.split("\n");

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      const line = lines[lineIndex];
      markdownLinkPattern.lastIndex = 0;
      let match = markdownLinkPattern.exec(line);

      while (match) {
        const rawTarget = match[2]?.trim() ?? "";
        if (!skippedPrefixes.some((prefix) => rawTarget.startsWith(prefix))) {
          const resolved = resolveLink(filePath, rawTarget);
          if (resolved && !(await pathExists(resolved))) {
            broken.push({
              file: path.relative(repoRoot, filePath),
              link: rawTarget,
              line: lineIndex + 1,
            });
          }
        }

        match = markdownLinkPattern.exec(line);
      }
    }
  }

  if (broken.length > 0) {
    console.error("Broken documentation links:");
    for (const entry of broken) {
      console.error(`- ${entry.file}:${entry.line} -> ${entry.link}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`Documentation links OK (${markdownFiles.length} markdown files checked).`);
}

await main();
