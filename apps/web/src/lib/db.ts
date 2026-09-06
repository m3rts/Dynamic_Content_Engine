import { Pool } from "pg";

let webPool: Pool | undefined;

export function getWebPool(): Pool {
  if (!webPool) {
    const connectionString = process.env.WEB_DATABASE_URL;
    if (!connectionString) {
      throw new Error("WEB_DATABASE_URL is required");
    }

    webPool = new Pool({
      connectionString,
      max: 5,
    });
  }

  return webPool;
}

export async function closeWebPool(): Promise<void> {
  if (webPool) {
    await webPool.end();
    webPool = undefined;
  }
}
