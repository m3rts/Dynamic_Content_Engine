import "../../../scripts/load-root-env.mjs";
import process from "node:process";

import { prepareQueueDatabase } from "./test-support.js";

const adminUrl =
  process.env.ADMIN_DATABASE_URL ??
  process.env.TEST_DATABASE_URL ??
  process.env.DATABASE_URL;

if (!adminUrl) {
  console.error("ADMIN_DATABASE_URL, TEST_DATABASE_URL, or DATABASE_URL is required");
  process.exitCode = 1;
} else {
  await prepareQueueDatabase(adminUrl);
  console.log("Queue schema and boss runtime grants are ready.");
}
