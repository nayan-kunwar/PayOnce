# Phase 7: Payment Lifecycle

## What changed

- Extended `Payment` model with `createdAt`, `updatedAt`, and status enum:
  - `pending | completed | failed | cancelled`
- Added allowed transition map in `src/types/payment.ts`.
- Added `PATCH /api/v1/payments/:id/status` endpoint.
- Invalid transitions return `400` with code `INVALID_STATUS_TRANSITION`.

## Allowed transitions

| From | To |
|------|-----|
| `pending` | `completed`, `failed`, `cancelled` |
| `completed` | (none) |
| `failed` | (none) |
| `cancelled` | (none) |

## How to verify

```bash
# Create payment, then update status
PAYMENT_ID=$(curl -s -X POST http://localhost:3000/api/v1/payments \
  -H "Authorization: Bearer dev-api-key" \
  -H "Idempotency-Key: lifecycle-1" \
  -H "Content-Type: application/json" \
  -d '{"amount":500,"customerId":"cust_life"}' | jq -r '.payment.id')

curl -X PATCH "http://localhost:3000/api/v1/payments/$PAYMENT_ID/status" \
  -H "Authorization: Bearer dev-api-key" \
  -H "Content-Type: application/json" \
  -d '{"status":"completed"}'
```
