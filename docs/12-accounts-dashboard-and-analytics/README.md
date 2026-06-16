# Phase 12: Accounts, dashboard, and analytics

## What changed

- Added account auth endpoints with session cookies:
  - `POST /auth/signup`
  - `POST /auth/login`
  - `GET /auth/me`
  - `POST /auth/logout`
- Added `users` and `user_sessions` tables.
- Added dashboard API routes under `GET/POST/DELETE /dashboard/api/keys`.
- Added usage tracking middleware for authenticated `/api/v1/*` calls.
- Added usage analytics routes:
  - `GET /dashboard/api/usage/summary`
  - `GET /dashboard/api/usage/recent`
  - `GET /dashboard/api/usage/by-key`
- Added static dashboard pages:
  - `/login` (`public/auth.html`)
  - `/dashboard` (`public/dashboard.html`)

## Why

This turns PayOnce from a single-key demo API into a minimal developer platform where each user can own and manage personal keys and monitor usage.

## Data model

New/updated tables:

- `users`
- `user_sessions`
- `api_usage_events`
- `api_keys` now supports nullable `user_id` ownership

Personal API keys are created from the dashboard (`POST /dashboard/api/keys`).

## Security notes

- Session cookie is HttpOnly with `SameSite=Lax` (`Secure` in production).
- Session tokens are stored hashed (`token_hash`) in DB.
- Passwords use Bun Argon2id hashing.
- API keys remain hashed and are shown only once at creation.

## Environment

```env
SESSION_COOKIE_NAME=payonce_session
SESSION_TTL_HOURS=168
```

## How to verify

```bash
bun run migrate
bun run typecheck
bun test tests/integration/auth.test.ts
bun test tests/integration/dashboard.test.ts
bun test tests/integration/usage.test.ts
```
