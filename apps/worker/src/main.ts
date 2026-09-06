import process from "node:process";

import { Pool } from "pg";

import { assertFixtureMode, runFixtureDispatcherCycle } from "./dispatcher.js";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

const pollIntervalMs = 5_000;

assertFixtureMode();

const pool = new Pool({
  connectionString: requiredEnv("QUEUE_DATABASE_URL"),
  options: "-c search_path=control",
  max: 3,
});

let stopping = false;

process.on("SIGINT", () => {
  stopping = true;
});

process.on("SIGTERM", () => {
  stopping = true;
});

console.log(JSON.stringify({ event: "worker_started", mode: "fixture" }));

while (!stopping) {
  const client = await pool.connect();
  try {
    const processed = await runFixtureDispatcherCycle(client);
    if (processed > 0) {
      console.log(JSON.stringify({ event: "fixture_cycle_complete", processed }));
    }
  } catch (error) {
    console.error(JSON.stringify({ event: "fixture_cycle_failed", error: String(error) }));
  } finally {
    client.release();
  }

  await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
}

await pool.end();
console.log(JSON.stringify({ event: "worker_stopped" }));
