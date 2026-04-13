# P2PTax

Tax consultant marketplace. Clients find specialists, specialists get clients.

## Tech Stack

- **Frontend:** Expo + React Native + NativeWind (Tailwind) + TypeScript
- **Backend:** Express.js + Prisma + PostgreSQL
- **CI/CD:** GitHub Actions → self-hosted runner
- **Secrets:** Doppler

## URLs

| Environment | URL |
|-------------|-----|
| Production  | https://p2ptax.smartlaunchhub.com |
| Staging     | https://p2ptax.smartlaunchhub.com (development branch) |
| API         | https://p2ptax.smartlaunchhub.com/api |

## Local Development

### Prerequisites
- Node.js 20+
- Doppler CLI (`doppler login` once per machine)

### Setup
```bash
doppler setup --project p2ptax --config dev --no-interactive

# API (terminal 1)
cd api && npm install && doppler run -- npm run dev

# Frontend (terminal 2)
npm install
doppler run -- npx expo start --web
```

> **Important:** Always run frontend via `doppler run` so `EXPO_PUBLIC_API_URL` is set correctly.

## Scripts

```bash
npm run lint          # ESLint check
npm run lint:fix      # ESLint auto-fix
npm run format        # Prettier format
npm run format:check  # Prettier check
npm run build:web     # Expo web export
npm run typecheck     # TypeScript type check
```

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production — deployed automatically |
| `development` | Staging — main working branch |
| `feat/*` | Feature branches |
| `fix/*` | Bug fix branches |

## CI/CD Pipeline

On push to `development`:
1. **Lint** — ESLint + Prettier check
2. **Typecheck** — TypeScript strict mode
3. **Build** — Expo web export + API build
4. **Deploy** — rsync to staging server, PM2 restart

On push to `main`:
1. **Build** — Frontend + API
2. **Deploy** — Production server

## Project Structure

```
├── app/              # Expo Router pages
├── api/              # Express.js backend
│   ├── src/          # API source code
│   └── prisma/       # Prisma schema & migrations
├── components/       # React components
├── constants/        # App constants, page registry
├── stores/           # State management
├── public/           # Static assets
├── .github/workflows # CI/CD pipelines
└── docs/             # Documentation
```

## Database

Remote PostgreSQL on production server. No local DB required.
Connection managed via Doppler secrets.
