# Phase 11: API key signup

> **Note:** Public email-only signup (`POST /api/keys`) and the home-page "Get your API key" form were removed. Personal API keys are created from the dashboard after account signup (Phase 12).

## What changed (historical)

- Added public self-service signup endpoint: `POST /api/keys` *(removed)*.
- API keys are stored as **SHA-256 hashes** in Postgres (`api_keys` table).
- The full key is returned only once at creation time.
- Existing static keys from `API_KEYS` env still work.
- Added account-based key management at `/login` and `/dashboard` (see [Phase 12](../12-accounts-dashboard-and-analytics/README.md)).

## Why

Hashing keys in storage prevents plaintext credential exposure if a database snapshot is leaked. Dashboard-based key creation replaced public email-only signup.

## Data model

`api_keys` columns:

- `id` (`key_<uuid>`)
- `key_hash` (unique)
- `key_prefix` (display-safe prefix)
- `owner_email`
- `label` (optional)
- `user_id` (nullable; set for dashboard-created keys)
- `created_at`
- `last_used_at`
- `revoked_at`

## Create API keys today

Sign up at `/login`, then create keys from the dashboard:

`POST /dashboard/api/keys` (session cookie required)

```json
{
  "label": "My app"
}
```

### Use a generated key

```bash
curl http://localhost:3000/api/v1/payments \
  -H "Authorization: Bearer pk_live_..."
```

## Security notes

- Store only hashes, never plaintext keys.
- Redact `authorization` and `x-api-key` headers from request logs.
- Keep static `API_KEYS` for admin/CI fallback.

## Environment

```env
API_KEYS=dev-api-key,another-dev-key
```

## How to verify

```bash
bun run migrate
bun test tests/integration/apiKeys.test.ts
bun test tests/integration/dashboard.test.ts
```
