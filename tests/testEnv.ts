export const BLOCKED_DATABASE_HOSTS = [
  "neon.tech",
  "upstash.io",
  "supabase.co",
  "railway.app",
  "render.com",
] as const;

export const BLOCKED_REDIS_HOSTS = ["upstash.io", "rediss://"] as const;

export const DEFAULT_LOCAL_DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5433/payonce";

export const DEFAULT_LOCAL_REDIS_URL = "redis://localhost:6379";

export function isRemoteDatabaseUrl(url: string): boolean {
  return BLOCKED_DATABASE_HOSTS.some((host) => url.includes(host));
}

export function isRemoteRedisUrl(url: string): boolean {
  return BLOCKED_REDIS_HOSTS.some((host) => url.includes(host));
}

export function resolveTestDatabaseUrl(
  databaseUrl = process.env.DATABASE_URL ?? "",
): string {
  if (process.env.TEST_DATABASE_URL) {
    return process.env.TEST_DATABASE_URL;
  }

  if (isRemoteDatabaseUrl(databaseUrl)) {
    return DEFAULT_LOCAL_DATABASE_URL;
  }

  return databaseUrl || DEFAULT_LOCAL_DATABASE_URL;
}

export function resolveTestRedisUrl(redisUrl = process.env.REDIS_URL ?? ""): string {
  if (process.env.TEST_REDIS_URL) {
    return process.env.TEST_REDIS_URL;
  }

  if (isRemoteRedisUrl(redisUrl)) {
    return DEFAULT_LOCAL_REDIS_URL;
  }

  return redisUrl || DEFAULT_LOCAL_REDIS_URL;
}
