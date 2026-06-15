import Redis from "ioredis";

import { env } from "../config/env.js";

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 1,
  lazyConnect: true,
});

export async function checkRedisConnection(): Promise<boolean> {
  try {
    const result = await redis.ping();
    return result === "PONG";
  } catch {
    return false;
  }
}

export async function closeRedisConnection(): Promise<void> {
  await redis.quit();
}

export function buildIdempotencyCacheKey(
  customerId: string,
  idempotencyKey: string,
): string {
  return `idempotency:${customerId}:${idempotencyKey}`;
}
