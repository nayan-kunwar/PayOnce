# Environment variables

PayOnce reads configuration from `process.env`, validated in [`src/config/env.ts`](../../src/config/env.ts) with Zod.

Bun loads dotenv files automatically when you run `bun run dev` or `bun run start`.

## Files in this repo

| File | Committed? | Purpose |
|------|------------|---------|
| [`.env.example`](../../.env.example) | Yes | Template for new developers — **local Docker** Postgres + Redis |
| [`.env.test`](../../.env.test) | Yes | Reference values for tests (overridden by [`tests/setup.ts`](../../tests/setup.ts)) |
| `.env` | No | **Active local config** — what `bun run dev` uses on your machine |
| `.env.local` | No | Optional personal dev file (e.g. Neon + Upstash while app runs on localhost) |
| `.env.production` | No | Private checklist of **Render production** values — paste into Render Dashboard, do not deploy as a file |

Never commit `.env`, `.env.local`, or `.env.production` — they contain secrets.

## Which file should I use?

| Scenario | What to do |
|----------|------------|
| First clone | `cp .env.example .env` then `docker compose up -d postgres redis` and `bun run migrate` |
| Local dev with Docker only | Keep `.env.example` values in `.env` |
| Local dev with cloud DB (Neon/Upstash) | Put Neon/Upstash URLs in `.env` or `.env.local` |
| Production on Render | Set variables in **Render → Environment** (use `.env.production` as your private checklist) |
| Integration tests | Safe even if `.env` points at Neon — [`tests/setup.ts`](../../tests/setup.ts) redirects cloud URLs to local Docker |

## Variable reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | HTTP port. Render sets this automatically (e.g. `10000`). |
| `NODE_ENV` | No | `development` | `development`, `production`, or `test` |
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string |
| `REDIS_URL` | No | `redis://localhost:6379` | Redis or Upstash URL (`redis://` or `rediss://`) |
| `API_KEYS` | No | `dev-api-key` | Comma-separated server API keys (see below) |
| `DEMO_ENABLED` | No | `true` | Set `false` to disable `/demo/api` |
| `SESSION_COOKIE_NAME` | No | `payonce_session` | HttpOnly session cookie for `/auth` and `/dashboard` |
| `SESSION_TTL_HOURS` | No | `168` | Session lifetime in hours (7 days) |
| `IDEMPOTENCY_TTL_SECONDS` | No | `86400` | How long idempotency records are kept (24 hours) |
| `CORS_ORIGINS` | No | (empty) | Comma-separated browser origins. Empty = allow all in dev; restrict in production |

Optional overrides used only during tests:

| Variable | Purpose |
|----------|---------|
| `TEST_DATABASE_URL` | Force a specific Postgres URL for integration tests |
| `TEST_REDIS_URL` | Force a specific Redis URL for integration tests |

## Environment profiles

### Profile A — Local Docker (`.env.example`)

Best for offline dev and matching CI/local test defaults.

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/payonce
REDIS_URL=redis://localhost:6379
API_KEYS=dev-api-key,another-dev-key
DEMO_ENABLED=true
SESSION_COOKIE_NAME=payonce_session
SESSION_TTL_HOURS=168
IDEMPOTENCY_TTL_SECONDS=86400
CORS_ORIGINS=http://localhost:3000
```

Requires:

```bash
docker compose up -d postgres redis
bun run migrate
bun run dev
```

Postgres is on host port **5433** (not 5432) to avoid clashing with a local Postgres install.

### Profile B — Local app + cloud data (`.env.local` pattern)

Run the app on `http://localhost:3000` but store data in Neon and Upstash:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://USER:PASSWORD@HOST.neon.tech/neondb?sslmode=require
REDIS_URL=rediss://default:TOKEN@HOST.upstash.io:6379
API_KEYS=dev-api-key,another-dev-key
DEMO_ENABLED=true
SESSION_COOKIE_NAME=payonce_session
SESSION_TTL_HOURS=168
IDEMPOTENCY_TTL_SECONDS=86400
CORS_ORIGINS=http://localhost:3000
```

Use Neon’s **pooled** connection string. Wrap `REDIS_URL` in quotes if the value contains special characters.

### Profile C — Production Render (`.env.production` checklist)

Set these in **Render Dashboard → Environment**, not as a file on the server:

```env
NODE_ENV=production
DATABASE_URL=postgresql://...@....neon.tech/neondb?sslmode=require
REDIS_URL=rediss://...@....upstash.io:6379
API_KEYS=your-strong-production-key
DEMO_ENABLED=true
SESSION_COOKIE_NAME=payonce_session
SESSION_TTL_HOURS=168
IDEMPOTENCY_TTL_SECONDS=86400
CORS_ORIGINS=https://your-app.onrender.com
```

Replace `CORS_ORIGINS` with your real Render URL (and any other front-end origins you allow).

`PORT` is injected by Render — do not hardcode it unless debugging.

## Two kinds of API keys

| Type | Stored in | Used for |
|------|-----------|----------|
| **Env keys** | `API_KEYS` variable | Server-configured keys; work without dashboard signup |
| **Personal keys** | Neon `api_keys` table | Created at `/dashboard`; format `pk_live_…` |

Both authenticate `/api/v1` via `Authorization: Bearer <key>`.

Env keys survive database resets. Personal keys are lost if the `api_keys` table is truncated (e.g. accidental test run against cloud DB before the test safety guards).

For Scalar `/docs` Try It, env keys like `pk_live_dev_payonce_scalar01` work without creating a dashboard key.

## GitHub secret (not app env)

| Secret | Where | Purpose |
|--------|-------|---------|
| `RENDER_DEPLOY_HOOK` | GitHub → Settings → Secrets → Actions | CD workflow POSTs here after pushing `:latest` to GHCR |

See [../render/how-latest-code-is-deployed.md](../render/how-latest-code-is-deployed.md).

## How Bun loads env files

Typical load order (later overrides earlier):

1. `.env`
2. `.env.local`
3. `.env.[NODE_ENV]` (e.g. `.env.development`)
4. `.env.[NODE_ENV].local`

Keep one active source of truth (usually `.env`) to avoid confusion.

## Integration tests and your `.env`

[`tests/setup.ts`](../../tests/setup.ts) runs before integration tests:

- If `DATABASE_URL` or `REDIS_URL` points at a **cloud host** (Neon, Upstash, etc.), tests switch to **local Docker** URLs.
- If URLs are already local (e.g. CI on `localhost:5432`), they are kept unchanged.

[`tests/helpers/testUtils.ts`](../../tests/helpers/testUtils.ts) refuses to `TRUNCATE` or `flushdb` remote URLs as a second safety net.

Never disable these guards when pointing at production data.

## Common mistakes

| Mistake | Result |
|---------|--------|
| Committing `.env.local` / `.env.production` | Leaked database and Redis credentials |
| Wrong `CORS_ORIGINS` in production | Browser blocks API calls from your site |
| Using only the key **prefix** from the dashboard table | 401 — full secret is shown once at creation |
| Pinning Render GHCR image to an old SHA | Production never updates when CD publishes `:latest` |

## Related docs

- [`.env.example`](../../.env.example) — committed template
- [`.env.test`](../../.env.test) — test reference
- [docs/09-deployment-and-devops](../../docs/09-deployment-and-devops/README.md) — Render env setup
- [docs/08-testing](../../docs/08-testing/README.md) — test env overrides
- [../api-keys/README.md](../api-keys/README.md) — API key types
