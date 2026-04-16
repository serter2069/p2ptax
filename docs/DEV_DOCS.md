# P2PTax — Developer Docs

Short reference for running and deploying the project. For domain-level
context see `PROJECT_OVERVIEW.md`; for nginx see `docs/nginx.conf`.

## Stack

- Frontend: Expo (React Native web-first) + `expo-router`
- Backend: NestJS (`api/`) + Prisma
- DB: remote PostgreSQL on `91.98.205.156` (no local DB)
- Secrets: Doppler
- Deploy: GitHub Actions → staging (`.github/workflows/deploy.yml`)

## Ports (see `~/.claude/projects.yaml` for the canonical list)

- Frontend: `8081`
- API: `3812`

## Doppler configs

- `p2ptax/dev` — local development
- `p2ptax/stg` — staging (`DEV_AUTH=true`)

First clone, once per machine:

```bash
doppler login
doppler setup --project p2ptax --config dev --no-interactive
```

## Run locally

Two terminals:

```bash
# terminal 1 — API (port 3812)
cd api && doppler run -- npm run dev

# terminal 2 — Frontend (port 8081)
doppler run -- npx expo start --web
```

The frontend MUST be launched under `doppler run` — otherwise
`EXPO_PUBLIC_API_URL` falls back and requests go to production.

## Auth (email OTP)

- `POST /api/auth/request-otp { email }` → sends 6-digit code
- `POST /api/auth/verify-otp { email, code }` → returns JWT + refresh token
- When Doppler `DEV_AUTH=true` (set for `dev` and `stg`), the OTP is always
  `000000` and no real email is sent.
- When `DEV_AUTH=false`, real SMTP via Brevo is used.
- Quick test login: type any valid-looking email, enter `000000`.

## Staging

- URL: https://p2ptax.smartlaunchhub.com
- API: https://p2ptax.smartlaunchhub.com/api
- Server: `95.217.84.161`
- PM2 process: `p2ptax-api`
- Nginx web root: `/var/www/p2ptax/dist`
- DEV_AUTH: `true` (OTP `000000` accepted on staging)

## Deploy

Push to `development` → `.github/workflows/deploy.yml` builds web bundle,
deploys it to `/var/www/p2ptax/dist`, and restarts the `p2ptax-api` PM2
process. No manual rsync/scp.

```bash
gh run list --limit 3       # watch CI
curl -s https://p2ptax.smartlaunchhub.com/version.json | jq .
```

## Typecheck

```bash
# root (Expo)
npx tsc --noEmit

# api
cd api && npx tsc --noEmit
```

Both must pass before pushing.

## Database

No local DB. `DATABASE_URL` points at the remote PostgreSQL in Doppler.
Schema: `api/prisma/schema.prisma`. Migrations applied with
`npm run prisma:migrate` (inside `api/`).
