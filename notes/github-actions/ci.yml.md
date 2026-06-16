# ci.yml

**Path in repo:** `.github/workflows/ci.yml`  
**Tech:** GitHub Actions

## What it is

GitHub Actions workflow that runs automated checks on every push to `main`/`master` and on every pull request.

## Role in this project

Acts as the **CI quality gate** — code must pass before it is safe to merge.

## What it runs

1. **Service containers** — Postgres 16 and Redis 7 (with health checks) so integration tests have real dependencies.
2. **Install** — `bun install --frozen-lockfile`
3. **Typecheck** — `bun run typecheck` (`tsc --noEmit`)
4. **Migrations** — `bun run migrate`
5. **Unit tests** — `bun run test` (`tests/unit`)
6. **Integration tests** — `bun run test:integration` (`tests/integration`)

## Environment (test job)

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `test` |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/payonce` |
| `REDIS_URL` | `redis://localhost:6379` |
| `API_KEYS` | `test-api-key` |
| `IDEMPOTENCY_TTL_SECONDS` | `86400` |

## CI vs CD

| Workflow | When | Purpose |
|----------|------|---------|
| `ci.yml` | Every PR + push to main | Test and typecheck |
| `deploy.yml` | After CI passes on main | Build and publish Docker image |

See also: `notes/github-actions/deploy.yml.md`

## Notes

_Add your own notes below — concepts, gotchas, things you learned, links, etc._
