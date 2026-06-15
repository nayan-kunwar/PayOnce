import pg from "pg";

import { redis } from "../../src/db/redis.js";
import {
  BLOCKED_DATABASE_HOSTS,
  BLOCKED_REDIS_HOSTS,
} from "../testEnv.js";

function assertSafeTestDatabase(): void {
  const databaseUrl = process.env.DATABASE_URL ?? "";

  for (const host of BLOCKED_DATABASE_HOSTS) {
    if (databaseUrl.includes(host)) {
      throw new Error(
        `Refusing to truncate remote DATABASE_URL during tests (matched "${host}"). ` +
          "Integration tests must use local Docker Postgres — see tests/setup.ts.",
      );
    }
  }

  if (process.env.NODE_ENV !== "test") {
    throw new Error(
      'Refusing to reset test data when NODE_ENV is not "test".',
    );
  }
}

function assertSafeTestRedis(): void {
  const redisUrl = process.env.REDIS_URL ?? "";

  for (const host of BLOCKED_REDIS_HOSTS) {
    if (redisUrl.includes(host)) {
      throw new Error(
        `Refusing to flush remote REDIS_URL during tests (matched "${host}"). ` +
          "Integration tests must use local Docker Redis — see tests/setup.ts.",
      );
    }
  }
}

export async function resetTestData(): Promise<void> {
  assertSafeTestDatabase();
  assertSafeTestRedis();

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });

  await pool.query(
    "TRUNCATE TABLE api_usage_events, user_sessions, api_keys, idempotency_records, payments, users RESTART IDENTITY CASCADE",
  );
  await pool.end();

  if (redis.status !== "ready") {
    await redis.connect();
  }

  await redis.flushdb();
}

export const testApiKey = process.env.API_KEYS?.split(",")[0] ?? "test-api-key";
