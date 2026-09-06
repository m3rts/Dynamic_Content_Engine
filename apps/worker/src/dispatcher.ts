import type pg from "pg";

export type ClaimedDispatch = {
  dispatch_id: string;
  run_id: string;
  attempt_id: string;
  agency_id: string;
  client_id: string;
  actor_id: string;
  input_hash: string;
  trace_id: string;
  job_kind: string;
};

export function assertFixtureMode(): void {
  if (process.env.DCE_FIXTURE_MODE !== "strict") {
    throw new Error("Worker requires DCE_FIXTURE_MODE=strict");
  }
}

export async function runFixtureDispatcherCycle(client: pg.PoolClient): Promise<number> {
  await client.query("BEGIN");

  try {
    const claimed = await client.query<ClaimedDispatch>(
      "SELECT * FROM control.claim_pending_dispatch_records(10)",
    );

    for (const row of claimed.rows) {
      console.log(
        JSON.stringify({
          event: "fixture_dispatch",
          dispatchId: row.dispatch_id,
          runId: row.run_id,
          jobKind: row.job_kind,
          traceId: row.trace_id,
        }),
      );
      await client.query("SELECT control.mark_dispatch_delivered($1)", [row.dispatch_id]);
    }

    await client.query("COMMIT");
    return claimed.rowCount ?? 0;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}
