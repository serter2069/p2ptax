# P2PTax

Tax consultant marketplace — clients find specialists, specialists get clients.

## Tech Stack

- **Frontend:** Expo + React Native + NativeWind (Tailwind) + TypeScript
- **Backend:** NestJS + Prisma + PostgreSQL
- **Deployment:** PM2 + Nginx on self-hosted runner

## Getting Started

```bash
# Install dependencies
npm install
cd api && npm install && cd ..

# Run frontend (web)
npm run web

# Run API (requires Doppler)
cd api && npm run dev
```

## Branch Strategy

| Branch | Environment | Purpose |
|--------|------------|---------|
| `main` | Production | Stable releases |
| `development` | Staging | Active development |
| `feat/*` | — | Feature branches |
| `fix/*` | — | Bug fix branches |

## CI/CD

Push to `development` triggers:
1. **Lint** — ESLint check
2. **Type check** — TypeScript strict mode
3. **Build** — Expo web export + API build
4. **Deploy** — Staging at https://p2ptax.smartlaunchhub.com

Push to `main` triggers production deploy.

## Scripts

```bash
npm run lint          # ESLint check
npm run lint:fix      # ESLint auto-fix
npm run format        # Prettier format
npm run format:check  # Prettier check
npm run build:web     # Expo web export
npm run typecheck     # TypeScript check (API)
```

## Environment

Secrets managed via Doppler. See `.env.example` for required variables.

## Staging

- URL: https://p2ptax.smartlaunchhub.com
- Version: https://p2ptax.smartlaunchhub.com/version.json
- Health: https://p2ptax.smartlaunchhub.com/api/health
