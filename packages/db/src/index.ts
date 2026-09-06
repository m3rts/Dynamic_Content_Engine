import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function getSqlDir(): string {
  return path.join(packageRoot, "sql");
}

export async function listMigrationFiles(): Promise<string[]> {
  const entries = await readdir(getSqlDir());
  return entries.filter((name) => name.endsWith(".sql")).sort();
}

export async function readMigration(fileName: string): Promise<string> {
  return readFile(path.join(getSqlDir(), fileName), "utf8");
}

export async function applyMigrations(
  connectionString: string,
  options: { through?: string } = {},
): Promise<string[]> {
  const client = new pg.Client({ connectionString });
  await client.connect();

  const applied: string[] = [];

  try {
    await client.query("BEGIN");
    await client.query(`
      CREATE TABLE IF NOT EXISTS app.schema_migration (
        id text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const { rows: existingRows } = await client.query<{ id: string }>(
      "SELECT id FROM app.schema_migration ORDER BY id",
    );
    const existing = new Set(existingRows.map((row) => row.id));

    for (const fileName of await listMigrationFiles()) {
      if (options.through && fileName > options.through) {
        break;
      }

      if (existing.has(fileName)) {
        continue;
      }

      const sql = await readMigration(fileName);
      await client.query(sql);
      await client.query("INSERT INTO app.schema_migration (id) VALUES ($1)", [fileName]);
      applied.push(fileName);
    }

    await client.query("COMMIT");
    return applied;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

export function roleDatabaseUrl(baseUrl: string, role: string, password: string): string {
  const url = new URL(baseUrl);
  url.username = role;
  url.password = password;
  return url.toString();
}
