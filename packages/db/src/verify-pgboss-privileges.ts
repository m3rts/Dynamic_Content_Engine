import { PgBoss } from "pg-boss";

import { roleDatabaseUrl } from "./index.js";
import { prepareQueueDatabase, withClient } from "./test-support.js";

const adminUrl =
  process.env.ADMIN_DATABASE_URL ?? process.env.TEST_DATABASE_URL;

if (!adminUrl) {
  console.error("ADMIN_DATABASE_URL or TEST_DATABASE_URL is required");
  process.exitCode = 1;
} else {
  await prepareQueueDatabase(adminUrl);

  const queueUrl = roleDatabaseUrl(adminUrl, "dce_queue", "dce_queue");
  const boss = new PgBoss({
    connectionString: queueUrl,
    schema: "boss",
    supervise: false,
    migrate: false,
  });

  await boss.start();
  await boss.createQueue("foundation-privilege-check");
  const jobId = await boss.send("foundation-privilege-check", { ok: true });
  if (!jobId) {
    throw new Error("pg-boss send failed under dce_queue");
  }
  await boss.stop();

  let appReadDenied = false;
  try {
    await withClient(queueUrl, async (client) => {
      await client.query("SELECT 1 FROM app.workflow_run LIMIT 1");
    });
  } catch (error) {
    appReadDenied =
      error instanceof Error && /permission denied|insufficient privilege/i.test(error.message);
  }

  if (!appReadDenied) {
    throw new Error("dce_queue unexpectedly read app.workflow_run");
  }

  console.log("pg-boss runtime privileges verified for dce_queue");
}
