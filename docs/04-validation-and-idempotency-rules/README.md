# Phase 4: Validation and Idempotency Rules

## What changed

- Added Zod schemas in `src/validators/payment.schema.ts`.
- Added middleware:
  - `validateCreatePayment.ts` — body validation
  - `validateUpdatePaymentStatus.ts` — status body validation
  - `requireIdempotencyKey.ts` — header validation (max 255 chars)
  - `errorHandler.ts` — centralized error responses
  - `requestId.ts` — `X-Request-Id` header
- **Customer-scoped idempotency**: keys are scoped to `(customerId, idempotencyKey)`.
- **Request fingerprint**: SHA-256 hash of `{ amount, customerId }` stored per record.
- **409 Conflict** when the same key is reused with a different body (`IdempotencyConflictError`).

## Why

Global idempotency keys allow two customers to collide on the same header value (Scenario 4 from project notes). Request fingerprints prevent silent mismatches when clients reuse a key with different payloads.

## How to verify

```bash
# Same key, different customers — both succeed with different payment IDs
curl -X POST http://localhost:3000/api/v1/payments \
  -H "Authorization: Bearer dev-api-key" \
  -H "Idempotency-Key: shared-key" \
  -H "Content-Type: application/json" \
  -d '{"amount":1000,"customerId":"cust_a"}'

curl -X POST http://localhost:3000/api/v1/payments \
  -H "Authorization: Bearer dev-api-key" \
  -H "Idempotency-Key: shared-key" \
  -H "Content-Type: application/json" \
  -d '{"amount":1000,"customerId":"cust_b"}'

# Same key + same customer + different amount — 409 Conflict
```

Run tests: `bun test tests/integration/payments.test.ts`
