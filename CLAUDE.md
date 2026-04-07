# P2PTax

Налоговый информационный арбитраж. Поиск исполнителей (юристов, налоговых консультантов) в любом городе.

## Local Development

Secrets: **Doppler** (workspace: Sergei MSP, project: `p2ptax`, config: `dev`)

```bash
doppler login      # один раз на машину
doppler setup --project p2ptax --config dev --no-interactive

# API (терминал 1)
cd api && doppler run -- npm run dev

# Frontend (терминал 2) — ОБЯЗАТЕЛЬНО через doppler run
doppler run -- npx expo start --web
```

> ВАЖНО: Frontend запускать только через `doppler run` — иначе EXPO_PUBLIC_API_URL не подхватится
> и все запросы к API будут уходить на продакшн-сервер.

Управление секретами:
```bash
doppler secrets --project p2ptax --config dev
doppler secrets set KEY=value --project p2ptax --config dev
```

## Stack
- Frontend: Expo (React Native web-first) with expo-router
- Backend: Express.js API in /api/
- ORM: Prisma
- DB: PostgreSQL (REMOTE ONLY on 91.98.205.156)

## URLs
- Staging: https://p2ptax.smartlaunchhub.com
- API: https://p2ptax.smartlaunchhub.com/api
- Local ports → see `~/.claude/guides/projects.md`

## Development
```bash
cd api && doppler run -- npm run dev
doppler run -- npx expo start --web
```

## Database
No local DB. Remote PostgreSQL on 91.98.205.156.
DATABASE_URL=postgresql://p2ptax_user:PASSWORD@91.98.205.156:5432/p2ptax_db
