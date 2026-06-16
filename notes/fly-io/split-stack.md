# Fly.io split stack (free tier)

**Stack:** Fly.io (API) + Neon (Postgres) + Upstash (Redis)

## Architecture

```
GitHub Actions CD
  → build image → ghcr.io
  → flyctl deploy → Fly.io machine

Fly.io app
  → DATABASE_URL → Neon (free Postgres)
  → REDIS_URL    → Upstash (free Redis)
```

## One-time setup

### 1. Neon (Postgres)

1. Sign up at [neon.tech](https://neon.tech).
2. Create a project (e.g. `payonce`).
3. Copy the **pooled** connection string (`?sslmode=require`).
4. Keep it for Fly secrets — do not commit it.

### 2. Upstash (Redis)

1. Sign up at [upstash.com](https://upstash.com).
2. Create a Redis database (pick a region close to your Fly region).
3. Copy the **Redis URL** (`rediss://...` — TLS is fine; ioredis supports it).

### 3. Fly.io (API)

```bash
# Install: https://fly.io/docs/hands-on/install-flyctl/
fly auth login
fly apps create payonce   # skip if the name in fly.toml is taken — pick another and update fly.toml
fly secrets set \
  DATABASE_URL="postgresql://..." \
  REDIS_URL="rediss://..." \
  API_KEYS="your-production-api-key" \
  IDEMPOTENCY_TTL_SECONDS="86400" \
  CORS_ORIGINS="https://payonce.fly.dev"
```

Replace `payonce.fly.dev` with your real Fly hostname (`fly info`).

### 4. GitHub Container Registry

Fly must pull your image from GHCR:

- **Easiest:** GitHub → **Packages** → your container → **Package settings** → **Change visibility** → **Public**.

### 5. GitHub Actions secret

```bash
fly tokens create deploy -x 999999h
```

Add the token as repo secret: **`FLY_API_TOKEN`**.

### 6. First deploy

Push to `main` (or deploy manually once):

```bash
flyctl deploy --image ghcr.io/<owner>/<repo>:latest --remote-only
```

## Verify

```bash
fly status
curl https://payonce.fly.dev/health
curl https://payonce.fly.dev/ready
```

## Free tier notes

- Fly scales to zero when idle (`min_machines_running = 0`) — first request may be slow.
- Neon and Upstash free tiers have request/storage limits — fine for demos and low traffic.
- `fly.toml` uses `512mb` RAM; drop to `256mb` if you need to stay inside Fly’s free VM allowance.

## Files in this repo

| File | Role |
|------|------|
| `fly.toml` | Fly app config, health check on `/ready` |
| `.github/workflows/deploy.yml` | Publishes image + deploys to Fly |
| `Dockerfile` | Image Fly runs (migrate + start) |

## Notes

_Add your own notes below — regions, costs, rollbacks, custom domains, etc._
