# P2PTax

Налоговый информационный арбитраж. Поиск исполнителей (юристов, налоговых консультантов) в любом городе.

## Stack
- Frontend: Expo (React Native web-first) with expo-router
- Backend: Express.js API in /api/
- ORM: Prisma
- DB: PostgreSQL (REMOTE ONLY on 91.98.205.156)

## URLs
- Staging: https://p2ptax.smartlaunchhub.com
- API: https://p2ptax.smartlaunchhub.com/api
- Local frontend: http://localhost:8081
- Local API: http://localhost:3812

## Development
```bash
npx expo start --web
cd api && npm run dev
```

## Database
No local DB. Remote PostgreSQL on 91.98.205.156.
DATABASE_URL=postgresql://p2ptax_user:PASSWORD@91.98.205.156:5432/p2ptax_db
