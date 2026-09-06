import pg from "pg";

import { hashPassword } from "better-auth/crypto";

import { closeAuthPool, getAuth } from "../src/lib/auth.ts";

const TEST_PASSWORD = "TestSignIn123!";
const BASE_URL = process.env.BETTER_AUTH_URL ?? "http://127.0.0.1:3000";
const adminUrl = process.env.ADMIN_DATABASE_URL;

if (!adminUrl) {
  throw new Error("ADMIN_DATABASE_URL is required");
}

const client = new pg.Client({ connectionString: adminUrl });
await client.connect();
const owner = (
  await client.query<{
    email: string;
    auth_user_id: string;
    provider_id: string;
    account_account_id: string;
  }>(`
  SELECT u.email, u.id AS auth_user_id, a."providerId" AS provider_id, a."accountId" AS account_account_id
  FROM app.system_bootstrap b
  JOIN app.linked_identity li ON li.user_id = b.owner_user_id
  JOIN auth."user" u ON u.id = li.external_subject_id
  JOIN auth.account a ON a."userId" = u.id
`)
).rows[0];

if (!owner) {
  throw new Error("No bootstrapped owner found");
}

await client.end();

console.log("owner:", owner.email);

const hash = await hashPassword(TEST_PASSWORD);
const pwClient = new pg.Client({ connectionString: adminUrl });
await pwClient.connect();
await pwClient.query(
  `UPDATE auth.account SET password = $1, "updatedAt" = now() WHERE "userId" = $2 AND "providerId" = 'credential'`,
  [hash, owner.auth_user_id],
);
await pwClient.end();

const api = await getAuth().api.signInEmail({
  body: { email: owner.email, password: TEST_PASSWORD },
  asResponse: true,
});
console.log("API status:", api.status, (await api.text()).slice(0, 120));

const http = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: BASE_URL },
  body: JSON.stringify({ email: owner.email, password: TEST_PASSWORD }),
});
const httpBody = await http.text();
console.log("HTTP status:", http.status);
console.log("HTTP cookie:", (http.headers.get("set-cookie") ?? "").includes("dce.session_token"));
console.log("HTTP body:", httpBody.slice(0, 200));

await closeAuthPool();

if (api.status === 200 && http.status === 200) {
  console.log("\nPASS — use password:", TEST_PASSWORD);
} else {
  process.exitCode = 1;
}
