import pg from "pg";

import { redis } from "../../src/db/redis.js";

export async function resetTestData(): Promise<void> {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });

  await pool.query(
    "TRUNCATE TABLE idempotency_records, payments RESTART IDENTITY CASCADE",
  );
  await pool.end();

  if (redis.status !== "ready") {
    await redis.connect();
  }

  await redis.flushdb();
}

export const testApiKey = process.env.API_KEYS?.split(",")[0] ?? "test-api-key";
