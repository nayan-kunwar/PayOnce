/**
 * Test preload — always runs before integration tests (see bunfig.toml).
 * Overrides cloud .env URLs so tests never truncate Neon/Upstash data.
 * Keeps local URLs (e.g. CI on localhost:5432) unchanged.
 */

import {
  resolveTestDatabaseUrl,
  resolveTestRedisUrl,
} from "./testEnv.js";

process.env.NODE_ENV = "test";
process.env.PORT = "3001";
process.env.DATABASE_URL = resolveTestDatabaseUrl();
process.env.REDIS_URL = resolveTestRedisUrl();
process.env.API_KEYS ??= "test-api-key";
process.env.DEMO_ENABLED ??= "true";
process.env.SIGNUP_ENABLED ??= "true";
process.env.SESSION_COOKIE_NAME ??= "payonce_session";
process.env.SESSION_TTL_HOURS ??= "168";
process.env.IDEMPOTENCY_TTL_SECONDS ??= "86400";
process.env.CORS_ORIGINS ??= "http://localhost:3000";
