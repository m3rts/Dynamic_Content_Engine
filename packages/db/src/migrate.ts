import process from "node:process";

import { applyMigrations } from "./index.js";

const connectionString = process.env.MIGRATOR_DATABASE_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  console.error("MIGRATOR_DATABASE_URL or DATABASE_URL is required");
  process.exitCode = 1;
} else {
  const applied = await applyMigrations(connectionString, {
    through: "0007_auth_and_identity.sql",
  });
  if (applied.length === 0) {
    console.log("No pending migrations.");
  } else {
    console.log(`Applied migrations: ${applied.join(", ")}`);
  }
}
