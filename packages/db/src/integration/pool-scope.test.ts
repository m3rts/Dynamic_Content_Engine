import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import { roleDatabaseUrl } from "../index.js";
import {
  inTransaction,
  prepareFoundationDatabase,
  seedTwoClientFixture,
  setScope,
  withClient,
  type TestFixture,
} from "../test-support.js";

const adminUrl = process.env.TEST_DATABASE_URL;

describe("pool scope isolation", { skip: adminUrl ? false : "TEST_DATABASE_URL not set" }, () => {
  let fixture: TestFixture;

  before(async () => {
    if (!adminUrl) {
      return;
    }

    await prepareFoundationDatabase(adminUrl);
    fixture = await seedTwoClientFixture(adminUrl);
  });

  it("does not leak transaction-local scope across pooled connections", async () => {
    const webUrl = roleDatabaseUrl(adminUrl!, "dce_web", "dce_web");

    await withClient(webUrl, async (client) => {
      await inTransaction(client, async (tx) => {
        await setScope(tx, fixture.agencyA, fixture.clientA, fixture.userA);
        const scoped = await tx.query<{ id: string }>("SELECT id FROM app.client");
        assert.equal(scoped.rowCount, 1);
        assert.equal(scoped.rows[0]?.id, fixture.clientA);
      });

      await inTransaction(client, async (tx) => {
        await setScope(tx, fixture.agencyB, fixture.clientB, fixture.userB);
        const scoped = await tx.query<{ id: string }>("SELECT id FROM app.client");
        assert.equal(scoped.rowCount, 1);
        assert.equal(scoped.rows[0]?.id, fixture.clientB);
      });

      await assert.rejects(async () => {
        await inTransaction(client, async (tx) => {
          await tx.query("SELECT id FROM app.client");
        });
      }, /permission denied|insufficient privilege/i);
    });
  });

  it("clears scope after rollback on a reused connection", async () => {
    const webUrl = roleDatabaseUrl(adminUrl!, "dce_web", "dce_web");

    await withClient(webUrl, async (client) => {
      await client.query("BEGIN");
      await setScope(client, fixture.agencyA, fixture.clientA, fixture.userA);
      await client.query("ROLLBACK");

      await assert.rejects(async () => {
        await inTransaction(client, async (tx) => {
          await tx.query("SELECT id FROM app.client");
        });
      }, /permission denied|insufficient privilege/i);
    });
  });
});
