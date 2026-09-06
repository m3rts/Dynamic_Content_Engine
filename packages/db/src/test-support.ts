import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PgBoss } from "pg-boss";
import pg from "pg";

import { applyMigrations, readMigration, roleDatabaseUrl } from "./index.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

export type TestFixture = {
  agencyA: string;
  agencyB: string;
  clientA: string;
  clientB: string;
  userA: string;
  userB: string;
  runA: string;
  runB: string;
};

export function migratorDatabaseUrl(baseUrl: string): string {
  const target = new URL(baseUrl);
  const source = process.env.MIGRATOR_DATABASE_URL
    ? new URL(process.env.MIGRATOR_DATABASE_URL)
    : target;

  const migratorUrl = new URL(source.toString());
  migratorUrl.pathname = target.pathname;

  if (!process.env.MIGRATOR_DATABASE_URL) {
    migratorUrl.username = "dce_migrator";
    migratorUrl.password = "dce_migrator";
  }

  return migratorUrl.toString();
}

export async function bootstrapDatabase(adminUrl: string): Promise<void> {
  const initSql = await readFile(path.join(repoRoot, "infra/postgres/init/01-roles.sql"), "utf8");
  const client = new pg.Client({ connectionString: adminUrl });
  await client.connect();
  try {
    await client.query(initSql);
  } finally {
    await client.end();
  }
}

export async function prepareFoundationDatabase(adminUrl: string): Promise<void> {
  await bootstrapDatabase(adminUrl);
  await applyMigrations(migratorDatabaseUrl(adminUrl), { through: "0005_rls_and_grants.sql" });
}

export async function prepareQueueDatabase(adminUrl: string): Promise<void> {
  await prepareFoundationDatabase(adminUrl);
  const bossMigratorUrl = roleDatabaseUrl(adminUrl, "dce_boss_migrator", "dce_boss_migrator");
  const grantSql = await readMigration("0006_boss_queue_grants.sql");

  const boss = new PgBoss({
    connectionString: bossMigratorUrl,
    schema: "boss",
    supervise: false,
    migrate: true,
  });
  await boss.start();
  await boss.stop();

  const client = new pg.Client({ connectionString: bossMigratorUrl });
  await client.connect();
  try {
    await client.query(grantSql);
  } finally {
    await client.end();
  }
}

export async function seedTwoClientFixture(adminUrl: string): Promise<TestFixture> {
  const fixture: TestFixture = {
    agencyA: "11111111-1111-4111-8111-111111111111",
    agencyB: "22222222-2222-4222-8222-222222222222",
    clientA: "33333333-3333-4333-8333-333333333333",
    clientB: "44444444-4444-4444-8444-444444444444",
    userA: "55555555-5555-4555-8555-555555555555",
    userB: "66666666-6666-4666-8666-666666666666",
    runA: "77777777-7777-4777-8777-777777777777",
    runB: "88888888-8888-4888-8888-888888888888",
  };

  const client = new pg.Client({ connectionString: adminUrl });
  await client.connect();
  try {
    await client.query(
      `
      INSERT INTO app.agency (id, name) VALUES
        ($1, 'Agency A'),
        ($2, 'Agency B')
    `,
      [fixture.agencyA, fixture.agencyB],
    );
    await client.query(
      `
      INSERT INTO app.client (id, agency_id, name) VALUES
        ($1, $3, 'Client A'),
        ($2, $4, 'Client B')
    `,
      [fixture.clientA, fixture.clientB, fixture.agencyA, fixture.agencyB],
    );
    await client.query(
      `
      INSERT INTO app.app_user (id, agency_id, display_name) VALUES
        ($1, $3, 'User A'),
        ($2, $4, 'User B')
    `,
      [fixture.userA, fixture.userB, fixture.agencyA, fixture.agencyB],
    );
    await client.query(
      `
      INSERT INTO app.client_membership (agency_id, client_id, user_id, role) VALUES
        ($1, $3, $5, 'operator'),
        ($2, $4, $6, 'operator')
    `,
      [
        fixture.agencyA,
        fixture.agencyB,
        fixture.clientA,
        fixture.clientB,
        fixture.userA,
        fixture.userB,
      ],
    );
    await client.query(
      `
      INSERT INTO app.workflow_run (id, agency_id, client_id, state, input_hash, created_by) VALUES
        ($1, $3, $5, 'queued', 'hash-a', $7),
        ($2, $4, $6, 'queued', 'hash-b', $8)
    `,
      [
        fixture.runA,
        fixture.runB,
        fixture.agencyA,
        fixture.agencyB,
        fixture.clientA,
        fixture.clientB,
        fixture.userA,
        fixture.userB,
      ],
    );
  } finally {
    await client.end();
  }

  return fixture;
}

export async function withClient<T>(
  connectionString: string,
  fn: (client: pg.Client) => Promise<T>,
): Promise<T> {
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

export async function inTransaction<T>(
  client: pg.Client,
  fn: (client: pg.Client) => Promise<T>,
): Promise<T> {
  await client.query("BEGIN");
  try {
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

export async function setScope(
  client: pg.Client,
  agencyId: string,
  clientId: string,
  actorId: string,
): Promise<void> {
  await client.query("SELECT app.set_request_scope($1, $2, $3)", [agencyId, clientId, actorId]);
}
