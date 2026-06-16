# Render split stack (free tier)

**Stack:** Render (API) + Neon (Postgres) + Upstash (Redis)

> **How production gets the latest code:** see [how-latest-code-is-deployed.md](./how-latest-code-is-deployed.md) (GHCR + Deploy Hook — recommended for this repo).

## Architecture (recommended: GHCR + Deploy Hook)

```text
merge to main → CI passes → CD pushes ghcr.io/<owner>/payonce:latest → Render deploy hook → live app
```

Render service uses **Existing Image** (`:latest`), not a rebuild on Render for every push.

## Architecture (alternative: Render builds from GitHub)

```text
Git push to main → Render auto-builds from Dockerfile (GitHub-connected web service)
```

## One-time setup

### 1. Neon (Postgres)

1. [neon.tech](https://neon.tech) → create project.
2. Copy **pooled** connection string (`?sslmode=require`).

### 2. Upstash (Redis)

1. [upstash.com](https://upstash.com) → create Redis DB.
2. Copy **Redis URL** (`rediss://...`).

### 3. Render (API)

1. **+ New** → **Web Service** (not a separate “Docker” menu item).
2. Connect GitHub repo → Render detects `Dockerfile`.
3. Free instance, health check path: `/ready`.
4. Environment variables:

```env
DATABASE_URL=...
REDIS_URL=...
API_KEYS=your-production-api-key
IDEMPOTENCY_TTL_SECONDS=86400
CORS_ORIGINS=https://payonce-uppq.onrender.com
NODE_ENV=production
```

5. Create → live at `https://<name>.onrender.com`.

## Verify

```bash
curl https://payonce-uppq.onrender.com/health
curl https://payonce-uppq.onrender.com/ready
```

## Free tier notes

- No credit card on Render, Neon, or Upstash free tiers.
- Render sleeps after ~15 min idle; wake-up can take 30–50+ seconds.
- Render injects `PORT` (e.g. `10000`) — app uses `env.PORT`.

## Not needed for Render

| File / secret | Needed? |
|---------------|---------|
| `fly.toml` | **No** — removed; Render ignores it |
| `FLY_API_TOKEN` | **No** |
| Fly CLI | **No** |

## Notes

_Add your own notes below — Render dashboard, env vars, API testing, etc._
