import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { before, describe, it } from "node:test";

import { bootstrapOwner } from "../owner-bootstrap.js";
import { roleDatabaseUrl } from "../index.js";
import { bootstrapDatabase, migratorDatabaseUrl, withClient } from "../test-support.js";
import { applyMigrations } from "../index.js";

const adminUrl = process.env.TEST_DATABASE_URL;

describe("owner bootstrap", { skip: adminUrl ? false : "TEST_DATABASE_URL not set" }, () => {
  it("creates the first owner once and rejects a second bootstrap", async () => {
    const isolatedDbName = `dce_bootstrap_${randomUUID().replace(/-/g, "").slice(0, 12)}`;

    await withClient(adminUrl!, async (client) => {
      await client.query(`DROP DATABASE IF EXISTS ${isolatedDbName}`);
      await client.query(`CREATE DATABASE ${isolatedDbName}`);
    });

    const isolatedAdminUrl = new URL(adminUrl!);
    isolatedAdminUrl.pathname = `/${isolatedDbName}`;
    const isolatedAdmin = isolatedAdminUrl.toString();

    await bootstrapDatabase(isolatedAdmin);
    await applyMigrations(migratorDatabaseUrl(isolatedAdmin), {
      through: "0007_auth_and_identity.sql",
    });

    const suffix = randomUUID().slice(0, 8);

    await bootstrapOwner(isolatedAdmin, {
      email: `owner-${suffix}@example.test`,
      password: "correcthorsebattery",
      agencyName: "Bootstrap Agency",
      clientName: "Bootstrap Client",
      displayName: "Bootstrap Owner",
    });

    await assert.rejects(
      () =>
        bootstrapOwner(isolatedAdmin, {
          email: `other-${suffix}@example.test`,
          password: "anotherpassword1",
          agencyName: "Other Agency",
          clientName: "Other Client",
          displayName: "Other Owner",
        }),
      /Bootstrap already completed/,
    );

    const webUrl = roleDatabaseUrl(isolatedAdmin, "dce_web", "dce_web");
    await withClient(webUrl, async (client) => {
      const linked = await client.query<{ user_id: string }>(
        "SELECT user_id FROM app.linked_identity WHERE issuer = 'better-auth'",
      );
      assert.equal(linked.rowCount, 1);
    });

    await withClient(adminUrl!, async (client) => {
      await client.query(`DROP DATABASE ${isolatedDbName}`);
    });
  });
});
