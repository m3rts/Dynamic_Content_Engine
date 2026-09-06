import "../../../scripts/load-root-env.mjs";
import { createInterface } from "node:readline/promises";
import process from "node:process";

import { bootstrapOwner, type BootstrapInput } from "./owner-bootstrap.js";

async function readBootstrapInput(): Promise<BootstrapInput> {
  if (
    process.env.BOOTSTRAP_EMAIL &&
    process.env.BOOTSTRAP_PASSWORD &&
    process.env.BOOTSTRAP_AGENCY_NAME &&
    process.env.BOOTSTRAP_CLIENT_NAME &&
    process.env.BOOTSTRAP_DISPLAY_NAME
  ) {
    return {
      email: process.env.BOOTSTRAP_EMAIL,
      password: process.env.BOOTSTRAP_PASSWORD,
      agencyName: process.env.BOOTSTRAP_AGENCY_NAME,
      clientName: process.env.BOOTSTRAP_CLIENT_NAME,
      displayName: process.env.BOOTSTRAP_DISPLAY_NAME,
    };
  }

  const rl = createInterface({ input: process.stdin, output: process.stderr });
  try {
    const email = (await rl.question("Owner email: ")).trim();
    const password = await rl.question("Owner password (min 12 chars): ");
    const agencyName = (await rl.question("Agency name: ")).trim();
    const clientName = (await rl.question("Initial client name: ")).trim();
    const displayName = (await rl.question("Owner display name: ")).trim();
    return { email, password, agencyName, clientName, displayName };
  } finally {
    rl.close();
  }
}

const adminUrl = process.env.ADMIN_DATABASE_URL ?? process.env.TEST_DATABASE_URL;

if (!adminUrl) {
  console.error("ADMIN_DATABASE_URL or TEST_DATABASE_URL is required");
  process.exitCode = 1;
} else {
  const input = await readBootstrapInput();
  await bootstrapOwner(adminUrl, input);
}
