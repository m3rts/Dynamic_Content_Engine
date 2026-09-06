import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, it } from "node:test";

import type { QueryResultRow } from "pg";
import { applyMigrations, bootstrapOwner, roleDatabaseUrl } from "@dce/db";
import { bootstrapDatabase, migratorDatabaseUrl } from "@dce/db/test-support";

import { closeAuthPool, getAuth } from "../lib/auth.js";
import {
  AuthorizationError,
  authorizeAndScope,
  withAuthorizedTransaction,
} from "../lib/authorize-and-scope.js";
import { closeWebPool } from "../lib/db.js";

const adminUrl = process.env.TEST_DATABASE_URL;

describe(
  "client context authorization flow",
  { skip: adminUrl ? false : "TEST_DATABASE_URL not set" },
  () => {
    const password = "correcthorsebattery";
    const email = `owner-${randomUUID().slice(0, 8)}@example.test`;
    let isolatedAdmin = "";
    let clientId = "";
    let otherClientId = randomUUID();
    let sessionCookie = "";

    before(async () => {
      if (!adminUrl) {
        return;
      }

      const isolatedDbName = `dce_client_ctx_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
      const adminClient = new (await import("pg")).default.Client({ connectionString: adminUrl });
      await adminClient.connect();
      try {
        await adminClient.query(`DROP DATABASE IF EXISTS ${isolatedDbName}`);
        await adminClient.query(`CREATE DATABASE ${isolatedDbName}`);
      } finally {
        await adminClient.end();
      }

      const isolatedAdminUrl = new URL(adminUrl);
      isolatedAdminUrl.pathname = `/${isolatedDbName}`;
      isolatedAdmin = isolatedAdminUrl.toString();

      process.env.ADMIN_DATABASE_URL = isolatedAdmin;
      process.env.AUTH_DATABASE_URL = roleDatabaseUrl(isolatedAdmin, "dce_auth", "dce_auth");
      process.env.WEB_DATABASE_URL = roleDatabaseUrl(isolatedAdmin, "dce_web", "dce_web");
      process.env.BETTER_AUTH_SECRET = randomUUID().replace(/-/g, "");
      process.env.BETTER_AUTH_URL = "http://127.0.0.1:3000";

      await bootstrapDatabase(isolatedAdmin);
      await applyMigrations(migratorDatabaseUrl(isolatedAdmin), {
        through: "0007_auth_and_identity.sql",
      });

      await bootstrapOwner(isolatedAdmin, {
        email,
        password,
        agencyName: "Flow Test Agency",
        clientName: "Flow Test Client",
        displayName: "Flow Test Owner",
      });

      const agencyRow = await adminClientQuery<{ id: string }>(
        isolatedAdmin,
        "SELECT id FROM app.agency LIMIT 1",
      );
      const agencyId = agencyRow.rows[0]?.id;
      assert.ok(agencyId);

      const clientRow = await adminClientQuery<{ id: string }>(
        isolatedAdmin,
        "SELECT id FROM app.client LIMIT 1",
      );
      clientId = clientRow.rows[0]?.id ?? "";
      assert.ok(clientId);

      await adminClientQuery(
        isolatedAdmin,
        "INSERT INTO app.client (id, agency_id, name) VALUES ($1, $2, 'Other Client')",
        [otherClientId, agencyId],
      );

      const signInResponse = await getAuth().api.signInEmail({
        body: { email, password },
        asResponse: true,
      });
      assert.equal(signInResponse.status, 200);
      sessionCookie = signInResponse.headers.getSetCookie().join("; ");
      assert.ok(sessionCookie.includes("dce.session_token"));
    });

    after(async () => {
      await closeAuthPool();
      await closeWebPool();
    });

    it("allows bootstrap owner sign-in and scoped client context reads", async () => {
      const session = await getAuth().api.getSession({
        headers: new Headers({ cookie: sessionCookie }),
      });
      assert.ok(session?.user?.id);

      const scope = await authorizeAndScope(session, clientId, "client.read");
      assert.equal(scope.clientId, clientId);

      const summary = await withAuthorizedTransaction(scope, async (client) => {
        const result = await client.query<{ id: string; name: string }>(
          "SELECT id, name FROM app.client",
        );
        return result.rows[0] ?? null;
      });

      assert.equal(summary?.id, clientId);
      assert.equal(summary?.name, "Flow Test Client");
    });

    it("denies access to an unauthorized client", async () => {
      const session = await getAuth().api.getSession({
        headers: new Headers({ cookie: sessionCookie }),
      });
      assert.ok(session?.user?.id);

      await assert.rejects(
        () => authorizeAndScope(session, otherClientId, "client.read"),
        (error: unknown) => {
          assert.ok(error instanceof AuthorizationError);
          assert.equal(error.status, 403);
          assert.match(error.message, /membership required/i);
          return true;
        },
      );
    });

    it("denies access when membership is disabled", async () => {
      const membership = await adminClientQuery<{ user_id: string }>(
        isolatedAdmin,
        `
        SELECT user_id
        FROM app.client_membership
        WHERE client_id = $1
        LIMIT 1
      `,
        [clientId],
      );
      const userId = membership.rows[0]?.user_id;
      assert.ok(userId);

      await adminClientQuery(
        isolatedAdmin,
        `
        UPDATE app.client_membership
        SET status = 'disabled'
        WHERE client_id = $1 AND user_id = $2
      `,
        [clientId, userId],
      );

      const session = await getAuth().api.getSession({
        headers: new Headers({ cookie: sessionCookie }),
      });
      assert.ok(session?.user?.id);

      await assert.rejects(
        () => authorizeAndScope(session, clientId, "client.read"),
        (error: unknown) => {
          assert.ok(error instanceof AuthorizationError);
          assert.equal(error.status, 403);
          assert.match(error.message, /Missing capability/i);
          return true;
        },
      );
    });
  },
);

async function adminClientQuery<T extends QueryResultRow>(
  connectionString: string,
  sql: string,
  values: unknown[] = [],
): Promise<{ rows: T[] }> {
  const pg = await import("pg");
  const client = new pg.default.Client({ connectionString });
  await client.connect();
  try {
    return await client.query<T>(sql, values);
  } finally {
    await client.end();
  }
}
