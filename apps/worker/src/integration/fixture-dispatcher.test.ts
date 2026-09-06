import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { roleDatabaseUrl } from "@dce/db";
import { prepareQueueDatabase, seedTwoClientFixture } from "@dce/db/test-support";
import pg from "pg";

import { runFixtureDispatcherCycle } from "../dispatcher.js";

const adminUrl = process.env.TEST_DATABASE_URL;

test("queue role claims and marks fixture dispatches delivered", async (t) => {
  if (!adminUrl) {
    t.skip("TEST_DATABASE_URL is required");
    return;
  }

  process.env.DCE_FIXTURE_MODE = "strict";
  await prepareQueueDatabase(adminUrl);
  const fixture = await seedTwoClientFixture(adminUrl);

  const webUrl = roleDatabaseUrl(adminUrl, "dce_web", "dce_web");
  const webClient = new pg.Client({ connectionString: webUrl });
  await webClient.connect();

  try {
    await webClient.query("BEGIN");
    await webClient.query("SELECT app.set_request_scope($1, $2, $3)", [
      fixture.agencyA,
      fixture.clientA,
      fixture.userA,
    ]);
    await webClient.query("SELECT app.set_actor_id($1)", [fixture.userA]);

    const dispatchId = randomUUID();
    const inserted = await webClient.query<{ insert_dispatch_record: string }>(
      `
      SELECT control.insert_dispatch_record(
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      ) AS insert_dispatch_record
    `,
      [
        dispatchId,
        fixture.runA,
        randomUUID(),
        fixture.agencyA,
        fixture.clientA,
        fixture.userA,
        "hash-a",
        "trace_worker_test",
        "fixture.dispatch",
      ],
    );
    await webClient.query("COMMIT");

    assert.equal(inserted.rows[0]?.insert_dispatch_record, dispatchId);

    const queueUrl = roleDatabaseUrl(adminUrl, "dce_queue", "dce_queue");
    const queuePool = new pg.Pool({
      connectionString: queueUrl,
      options: "-c search_path=control",
      max: 1,
    });
    const queueClient = await queuePool.connect();

    try {
      const processed = await runFixtureDispatcherCycle(queueClient);
      assert.ok(processed >= 1);
    } finally {
      queueClient.release();
      await queuePool.end();
    }

    const metadataClient = new pg.Client({ connectionString: queueUrl });
    await metadataClient.connect();
    try {
      const metadata = await metadataClient.query<{ state: string }>(
        "SELECT state FROM control.get_dispatch_metadata($1)",
        [dispatchId],
      );
      assert.equal(metadata.rows[0]?.state, "delivered");
    } finally {
      await metadataClient.end();
    }
  } finally {
    await webClient.end();
  }
});
