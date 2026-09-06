import assert from "node:assert/strict";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const loaderPath = join(repoRoot, "scripts/load-root-env.mjs");
const envPath = join(repoRoot, ".env");

describe("load-root-env", () => {
  it("loads repository root .env without overriding existing variables", () => {
    const marker = `DCE_LOAD_ROOT_ENV_TEST_${Date.now()}`;
    const hadEnv = existsSync(envPath);
    const previous = hadEnv ? readFileSync(envPath, "utf8") : null;

    try {
      writeFileSync(envPath, `${marker}=from-file\n`, {
        flag: hadEnv ? "a" : "w",
      });

      const result = spawnSync(
        process.execPath,
        [
          "--import",
          loaderPath,
          "--input-type=module",
          "-e",
          `
            if (process.env.EXISTING_VAR !== "from-shell") process.exit(2);
            if (process.env.${marker} !== "from-file") process.exit(3);
          `,
        ],
        {
          cwd: repoRoot,
          env: {
            PATH: process.env.PATH,
            EXISTING_VAR: "from-shell",
          },
        },
      );

      assert.equal(result.status, 0, result.stderr.toString() || result.stdout.toString());
    } finally {
      if (hadEnv) {
        writeFileSync(envPath, previous ?? "");
      } else {
        unlinkSync(envPath);
      }
    }
  });

  it("documents db scripts with root env loader", () => {
    const pkg = JSON.parse(readFileSync(join(repoRoot, "packages/db/package.json"), "utf8"));

    assert.match(pkg.scripts.migrate, /load-root-env/);
    assert.match(pkg.scripts["owner:bootstrap"], /load-root-env/);
  });
});
