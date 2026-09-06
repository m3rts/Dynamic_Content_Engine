import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { before, describe, it } from "node:test";

import { roleDatabaseUrl } from "../index.js";
import {
  prepareQueueDatabase,
  seedTwoClientFixture,
  withClient,
  type TestFixture,
} from "../test-support.js";

const adminUrl = process.env.TEST_DATABASE_URL;

describe(
  "identity table privileges",
  { skip: adminUrl ? false : "TEST_DATABASE_URL not set" },
  () => {
    let fixture: TestFixture;

    before(async () => {
      if (!adminUrl) {
        return;
      }

      await prepareQueueDatabase(adminUrl);
      fixture = await seedTwoClientFixture(adminUrl);
    });

    for (const role of ["dce_web", "dce_worker_app"] as const) {
      it(`denies ${role} from writing linked_identity`, async () => {
        const runtimeUrl = roleDatabaseUrl(adminUrl!, role, role);

        await withClient(runtimeUrl, async (client) => {
          await assert.rejects(
            () =>
              client.query(
                `
                INSERT INTO app.linked_identity (issuer, external_subject_id, user_id)
                VALUES ('better-auth', $1, $2)
              `,
                [randomUUID(), fixture.userA],
              ),
            /permission denied|insufficient privilege/i,
          );

          await assert.rejects(
            () =>
              client.query(
                `
                UPDATE app.linked_identity
                SET user_id = $1
                WHERE issuer = 'better-auth'
              `,
                [fixture.userB],
              ),
            /permission denied|insufficient privilege/i,
          );

          await assert.rejects(
            () =>
              client.query(
                `
                DELETE FROM app.linked_identity
                WHERE issuer = 'better-auth'
              `,
              ),
            /permission denied|insufficient privilege/i,
          );
        });
      });

      it(`denies ${role} from reading or writing system_bootstrap`, async () => {
        const runtimeUrl = roleDatabaseUrl(adminUrl!, role, role);

        await withClient(runtimeUrl, async (client) => {
          await assert.rejects(
            () => client.query("SELECT owner_user_id FROM app.system_bootstrap"),
            /permission denied|insufficient privilege/i,
          );

          await assert.rejects(
            () =>
              client.query(
                `
                INSERT INTO app.system_bootstrap (id, owner_user_id)
                VALUES (true, $1)
              `,
                [fixture.userA],
              ),
            /permission denied|insufficient privilege/i,
          );

          await assert.rejects(
            () =>
              client.query(
                `
                UPDATE app.system_bootstrap
                SET owner_user_id = $1
              `,
                [fixture.userB],
              ),
            /permission denied|insufficient privilege/i,
          );

          await assert.rejects(
            () => client.query("DELETE FROM app.system_bootstrap"),
            /permission denied|insufficient privilege/i,
          );
        });
      });
    }
  },
);
