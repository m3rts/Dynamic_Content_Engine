import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { before, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { roleDatabaseUrl } from "../index.js";
import {
  bootstrapDatabase,
  inTransaction,
  migratorDatabaseUrl,
  prepareQueueDatabase,
  seedTwoClientFixture,
  setScope,
  withClient,
  type TestFixture,
} from "../test-support.js";

const adminUrl = process.env.TEST_DATABASE_URL;

describe("database integration", { skip: adminUrl ? false : "TEST_DATABASE_URL not set" }, () => {
  let fixture: TestFixture;

  before(async () => {
    if (!adminUrl) {
      return;
    }

    await prepareQueueDatabase(adminUrl);
    fixture = await seedTwoClientFixture(adminUrl);
  });

  it("applies migrations under dce_migrator without admin grant repairs", async () => {
    const isolatedDbName = "dce_migrator_path_test";

    await withClient(adminUrl!, async (client) => {
      await client.query(`DROP DATABASE IF EXISTS ${isolatedDbName}`);
      await client.query(`CREATE DATABASE ${isolatedDbName}`);
    });

    const isolatedAdminUrl = new URL(adminUrl!);
    isolatedAdminUrl.pathname = `/${isolatedDbName}`;
    const isolatedAdmin = isolatedAdminUrl.toString();

    await bootstrapDatabase(isolatedAdmin);

    const migratorUrl = migratorDatabaseUrl(isolatedAdmin);

    await withClient(migratorUrl, async (client) => {
      const connected = await client.query<{ current_database: string }>(
        "SELECT current_database()",
      );
      assert.equal(connected.rows[0]?.current_database, isolatedDbName);

      await assert.rejects(
        () => client.query("SELECT 1 FROM app.schema_migration LIMIT 1"),
        /relation .* does not exist|permission denied/i,
      );
    });

    const { execFile } = await import("node:child_process");
    const { promisify } = await import("node:util");
    const execFileAsync = promisify(execFile);
    const repoRoot = fileURLToPath(new URL("../../../..", import.meta.url));

    await execFileAsync("pnpm", ["run", "db:migrate"], {
      env: {
        ...process.env,
        MIGRATOR_DATABASE_URL: migratorUrl,
      },
      cwd: repoRoot,
    });

    await withClient(migratorUrl, async (client) => {
      const migrations = await client.query<{ id: string }>(
        "SELECT id FROM app.schema_migration ORDER BY id",
      );
      assert.ok(migrations.rowCount >= 6);
      assert.ok(migrations.rows.some((row) => row.id === "0007_auth_and_identity.sql"));
    });

    await withClient(adminUrl!, async (client) => {
      await client.query(`DROP DATABASE ${isolatedDbName}`);
    });
  });

  it("denies cross-client reads under RLS", async () => {
    const webUrl = roleDatabaseUrl(adminUrl!, "dce_web", "dce_web");

    await withClient(webUrl, async (client) => {
      await inTransaction(client, async (tx) => {
        await setScope(tx, fixture.agencyA, fixture.clientA, fixture.userA);
        const scoped = await tx.query<{ id: string }>("SELECT id FROM app.workflow_run");
        assert.equal(scoped.rowCount, 1);
        assert.equal(scoped.rows[0]?.id, fixture.runA);
      });

      await inTransaction(client, async (tx) => {
        await setScope(tx, fixture.agencyB, fixture.clientB, fixture.userB);
        const scoped = await tx.query<{ id: string }>("SELECT id FROM app.workflow_run");
        assert.equal(scoped.rowCount, 1);
        assert.equal(scoped.rows[0]?.id, fixture.runB);
      });
    });
  });

  it("denies runtime roles from modifying migration history", async () => {
    const webUrl = roleDatabaseUrl(adminUrl!, "dce_web", "dce_web");
    const workerUrl = roleDatabaseUrl(adminUrl!, "dce_worker_app", "dce_worker_app");

    for (const connectionString of [webUrl, workerUrl]) {
      await withClient(connectionString, async (client) => {
        await assert.rejects(
          () => client.query("INSERT INTO app.schema_migration (id) VALUES ('forged.sql')"),
          /permission denied|insufficient privilege/i,
        );
        await assert.rejects(
          () =>
            client.query(
              "UPDATE app.schema_migration SET id = 'tampered.sql' WHERE id IS NOT NULL",
            ),
          /permission denied|insufficient privilege/i,
        );
        await assert.rejects(
          () => client.query("DELETE FROM app.schema_migration"),
          /permission denied|insufficient privilege/i,
        );
      });
    }
  });

  it("inserts dispatch records only for scoped runs with authorized actors", async () => {
    const webUrl = roleDatabaseUrl(adminUrl!, "dce_web", "dce_web");
    const dispatchId = randomUUID();
    const attemptId = randomUUID();

    await withClient(webUrl, async (client) => {
      await inTransaction(client, async (tx) => {
        await setScope(tx, fixture.agencyA, fixture.clientA, fixture.userA);
        const inserted = await tx.query<{ insert_dispatch_record: string }>(
          `
          SELECT control.insert_dispatch_record(
            $1, $2, $3, $4, $5, $6, $7, $8, $9
          ) AS insert_dispatch_record
        `,
          [
            dispatchId,
            fixture.runA,
            attemptId,
            fixture.agencyA,
            fixture.clientA,
            fixture.userA,
            "hash-a",
            "trace_fixture",
            "foundation.test",
          ],
        );
        assert.equal(inserted.rows[0]?.insert_dispatch_record, dispatchId);
      });
    });

    await withClient(webUrl, async (client) => {
      await assert.rejects(async () => {
        await inTransaction(client, async (tx) => {
          await setScope(tx, fixture.agencyA, fixture.clientA, fixture.userA);
          await tx.query(
            `
            SELECT control.insert_dispatch_record(
              $1, $2, $3, $4, $5, $6, $7, $8, $9
            )
          `,
            [
              randomUUID(),
              fixture.runB,
              randomUUID(),
              fixture.agencyA,
              fixture.clientA,
              fixture.userA,
              "hash-b",
              "trace_fixture",
              "foundation.test",
            ],
          );
        });
      }, /run not found in scope/);
    });
  });

  it("rejects dispatch for disabled and unrelated actors", async () => {
    const webUrl = roleDatabaseUrl(adminUrl!, "dce_web", "dce_web");
    const unrelatedUserId = "99999999-9999-4999-8999-999999999999";

    await withClient(adminUrl!, async (client) => {
      await client.query(
        `
        INSERT INTO app.app_user (id, agency_id, display_name)
        VALUES ($1, $2, 'Unrelated User')
      `,
        [unrelatedUserId, fixture.agencyA],
      );
      await client.query(
        `
        UPDATE app.client_membership
        SET status = 'disabled'
        WHERE agency_id = $1 AND client_id = $2 AND user_id = $3
      `,
        [fixture.agencyA, fixture.clientA, fixture.userA],
      );
    });

    await withClient(webUrl, async (client) => {
      await assert.rejects(async () => {
        await inTransaction(client, async (tx) => {
          await setScope(tx, fixture.agencyA, fixture.clientA, fixture.userA);
          await tx.query(
            `
            SELECT control.insert_dispatch_record(
              $1, $2, $3, $4, $5, $6, $7, $8, $9
            )
          `,
            [
              randomUUID(),
              fixture.runA,
              randomUUID(),
              fixture.agencyA,
              fixture.clientA,
              fixture.userA,
              "hash-a",
              "trace_disabled_actor",
              "foundation.test",
            ],
          );
        });
      }, /actor not authorized to dispatch/);

      await assert.rejects(async () => {
        await inTransaction(client, async (tx) => {
          await setScope(tx, fixture.agencyA, fixture.clientA, unrelatedUserId);
          await tx.query(
            `
            SELECT control.insert_dispatch_record(
              $1, $2, $3, $4, $5, $6, $7, $8, $9
            )
          `,
            [
              randomUUID(),
              fixture.runA,
              randomUUID(),
              fixture.agencyA,
              fixture.clientA,
              unrelatedUserId,
              "hash-a",
              "trace_unrelated_actor",
              "foundation.test",
            ],
          );
        });
      }, /actor not authorized to dispatch/);
    });
  });

  it("lets queue claim dispatch metadata without app table access", async () => {
    const queueUrl = roleDatabaseUrl(adminUrl!, "dce_queue", "dce_queue");

    await withClient(queueUrl, async (client) => {
      await assert.rejects(
        () => client.query("SELECT 1 FROM app.workflow_run LIMIT 1"),
        /permission denied|insufficient privilege/i,
      );

      const claimed = await client.query<{
        dispatch_id: string;
        run_id: string;
        job_kind: string;
      }>("SELECT * FROM control.claim_pending_dispatch_records(10)");
      assert.ok(claimed.rowCount >= 1);
    });
  });
});
