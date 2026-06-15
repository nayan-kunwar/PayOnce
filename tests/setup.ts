/**
 * Test preload — always runs before integration tests (see bunfig.toml).
 * Overrides .env cloud URLs so tests never truncate Neon/Upstash data.
 */

const LOCAL_TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5433/payonce";

const LOCAL_TEST_REDIS_URL =
  process.env.TEST_REDIS_URL ?? "redis://localhost:6379";

process.env.NODE_ENV = "test";
process.env.PORT = "3001";
process.env.DATABASE_URL = LOCAL_TEST_DATABASE_URL;
process.env.REDIS_URL = LOCAL_TEST_REDIS_URL;
process.env.API_KEYS ??= "test-api-key";
process.env.DEMO_ENABLED ??= "true";
process.env.SIGNUP_ENABLED ??= "true";
process.env.SESSION_COOKIE_NAME ??= "payonce_session";
process.env.SESSION_TTL_HOURS ??= "168";
process.env.IDEMPOTENCY_TTL_SECONDS ??= "86400";
process.env.CORS_ORIGINS ??= "http://localhost:3000";
