import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { before, describe, it } from "node:test";

import { roleDatabaseUrl } from "../index.js";
import {
  inTransaction,
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

  it("inserts dispatch records only for scoped runs", async () => {
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
