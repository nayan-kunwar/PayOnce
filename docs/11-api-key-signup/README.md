# Phase 11: API key signup

## What changed

- Added public self-service signup endpoint: `POST /api/keys`.
- API keys are now stored as **SHA-256 hashes** in Postgres (`api_keys` table).
- The full key is returned only once at creation time.
- Existing static keys from `API_KEYS` env still work.
- Added optional account-based key management at `/login` and `/dashboard` (see [Phase 12](../12-accounts-dashboard-and-analytics/README.md)).
- Added `SIGNUP_ENABLED` env flag (default `true`) to enable/disable signup.
- Added signup rate limiting: **5 requests/hour** per IP.
- Landing page now includes a "Get your API key" form with copy support.

## Why

Public demos are easier to adopt when developers can get a key immediately. Hashing keys in storage prevents plaintext credential exposure if a database snapshot is leaked.

## Data model

`api_keys` columns:

- `id` (`key_<uuid>`)
- `key_hash` (unique)
- `key_prefix` (display-safe prefix)
- `owner_email`
- `label` (optional)
- `created_at`
- `last_used_at`
- `revoked_at` (future use)

## API

### Create API key

`POST /api/keys`

Body:

```json
{
  "email": "dev@example.com",
  "label": "My app"
}
```

Response (`201`):

```json
{
  "success": true,
  "apiKey": "pk_live_...",
  "keyPrefix": "pk_live_...",
  "message": "Save this key now — it will not be shown again."
}
```

### Use generated key

```bash
curl http://localhost:3000/api/v1/payments \
  -H "Authorization: Bearer pk_live_..."
```

## Security notes

- Store only hashes, never plaintext keys.
- Redact `authorization` and `x-api-key` headers from request logs.
- Keep signup endpoint rate-limited.
- Keep static `API_KEYS` for admin/CI fallback.

## Environment

```env
API_KEYS=dev-api-key,another-dev-key
SIGNUP_ENABLED=true
```

When `SIGNUP_ENABLED=false`, `POST /api/keys` returns `404`.

## How to verify

```bash
bun run migrate
bun test tests/integration/apiKeys.test.ts
```
