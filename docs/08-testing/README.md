# Phase 8: Testing

## What changed

- Added Bun test configuration in `bunfig.toml` with `tests/setup.ts` preload.
- Unit tests:
  - `tests/unit/requestHash.test.ts`
  - `tests/unit/payment.schema.test.ts`
- Integration tests in `tests/integration/payments.test.ts` using `supertest`.
- Test helpers in `tests/helpers/testUtils.ts` for DB/Redis reset.
- `tests/setup.ts` forces local `DATABASE_URL` / `REDIS_URL` during tests so `.env` cloud credentials are never truncated.
- `resetTestData()` refuses remote hosts (Neon, Upstash, etc.) as a second safety net.

## Coverage

- API key rejection
- Idempotency cache hit on duplicate key
- Customer-scoped idempotency (same key, different customers)
- 409 on body mismatch with same key
- Concurrent duplicate requests create exactly one payment
- Payment status update
- Health and readiness endpoints

## How to verify

```bash
docker compose up -d postgres redis
bun run migrate
bun run test          # unit tests
bun run test:integration
bun run test:all      # all tests
```
