process.env.NODE_ENV ??= "test";
process.env.PORT ??= "3001";
process.env.DATABASE_URL ??=
  "postgresql://postgres:postgres@localhost:5433/payonce";
process.env.REDIS_URL ??= "redis://localhost:6379";
process.env.API_KEYS ??= "test-api-key";
process.env.IDEMPOTENCY_TTL_SECONDS ??= "86400";
process.env.CORS_ORIGINS ??= "http://localhost:3000";
