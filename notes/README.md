# PayOnce notes

Informal docs and runbooks (complement [docs/](../docs/README.md)).

## Environment variables

| Note | Description |
|------|-------------|
| [env/README.md](./env/README.md) | **All env files** — `.env`, `.env.local`, `.env.production`, variables, profiles |

## Render (production)

| Note | Description |
|------|-------------|
| [how-latest-code-is-deployed.md](./render/how-latest-code-is-deployed.md) | **How Render deploys the latest code** — CI → GHCR → Deploy Hook |
| [split-stack.md](./render/split-stack.md) | Render + Neon + Upstash setup |

## GitHub Actions

| Note | Description |
|------|-------------|
| [ci.yml.md](./github-actions/ci.yml.md) | CI workflow |
| [deploy.yml.md](./github-actions/deploy.yml.md) | CD workflow (GHCR + Render hook) |

## Other

| Note | Description |
|------|-------------|
| [api-keys/README.md](./api-keys/README.md) | API key notes |
