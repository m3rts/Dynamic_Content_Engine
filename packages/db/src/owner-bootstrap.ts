import { randomUUID } from "node:crypto";

import { hashPassword } from "better-auth/crypto";
import pg from "pg";

const ISSUER = "better-auth";
const PROVIDER_ID = "credential";

export type BootstrapInput = {
  email: string;
  password: string;
  agencyName: string;
  clientName: string;
  displayName: string;
};

export function validateBootstrapInput(input: BootstrapInput): void {
  if (input.password.length < 12 || input.password.length > 128) {
    throw new Error("Password must be between 12 and 128 characters");
  }

  if (!input.email.includes("@")) {
    throw new Error("Owner email must be valid");
  }
}

export async function bootstrapOwner(adminUrl: string, input: BootstrapInput): Promise<void> {
  validateBootstrapInput(input);

  const client = new pg.Client({ connectionString: adminUrl });
  await client.connect();

  try {
    await client.query("BEGIN");

    const existing = await client.query("SELECT 1 FROM app.system_bootstrap WHERE id = true");
    if ((existing.rowCount ?? 0) > 0) {
      throw new Error("Bootstrap already completed");
    }

    const agencyId = randomUUID();
    const clientId = randomUUID();
    const appUserId = randomUUID();
    const authUserId = randomUUID();
    const accountId = randomUUID();

    await client.query("INSERT INTO app.agency (id, name) VALUES ($1, $2)", [
      agencyId,
      input.agencyName,
    ]);
    await client.query("INSERT INTO app.client (id, agency_id, name) VALUES ($1, $2, $3)", [
      clientId,
      agencyId,
      input.clientName,
    ]);
    await client.query(
      "INSERT INTO app.app_user (id, agency_id, display_name) VALUES ($1, $2, $3)",
      [appUserId, agencyId, input.displayName],
    );
    await client.query(
      `
      INSERT INTO app.client_membership (agency_id, client_id, user_id, role, status)
      VALUES ($1, $2, $3, 'owner', 'active')
    `,
      [agencyId, clientId, appUserId],
    );

    const normalizedEmail = input.email.trim().toLowerCase();
    await client.query(
      `
      INSERT INTO auth."user" (id, name, email, "emailVerified")
      VALUES ($1, $2, $3, true)
    `,
      [authUserId, input.displayName, normalizedEmail],
    );

    const passwordHash = await hashPassword(input.password);
    await client.query(
      `
      INSERT INTO auth.account (
        id, "accountId", "providerId", "userId", password
      ) VALUES ($1, $2, $3, $4, $5)
    `,
      [accountId, authUserId, PROVIDER_ID, authUserId, passwordHash],
    );

    await client.query(
      `
      INSERT INTO app.linked_identity (issuer, external_subject_id, user_id)
      VALUES ($1, $2, $3)
    `,
      [ISSUER, authUserId, appUserId],
    );

    await client.query(
      `
      INSERT INTO app.system_bootstrap (id, owner_user_id)
      VALUES (true, $1)
    `,
      [appUserId],
    );

    await client.query("COMMIT");
    console.log("Owner bootstrap completed.");
    console.log(`Agency ID: ${agencyId}`);
    console.log(`Client ID: ${clientId}`);
    console.log(`App user ID: ${appUserId}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}
