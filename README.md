# Etalon

Reference project template for marketplace/classified-ads apps.

**Stack:** Expo (web + iOS + Android) + Express + Prisma + PostgreSQL + NativeWind (Tailwind CSS) + MinIO

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL database
- MinIO instance (optional, for file uploads)

### Setup
```bash
# Clone
git clone https://github.com/serter2069/etalon.git
cd etalon

# Frontend
npm install

# Backend
cd api && npm install && cd ..

# Environment
cp api/.env.example api/.env
# Edit api/.env — set DATABASE_URL at minimum

# Database
cd api && npx prisma migrate dev && cd ..
```

### Run
```bash
# Terminal 1 — Frontend
npx expo start --web          # http://localhost:8081

# Terminal 2 — Backend  
cd api && npm run dev          # http://localhost:3000
```

### Verify
```bash
npx tsc --noEmit               # Frontend: 0 errors
cd api && npx tsc --noEmit     # Backend: 0 errors
curl http://localhost:3000/api/health   # {"status":"ok"}
```

---

## Architecture

```
etalon/
  app/                    # Expo Router — file-based routing
    _layout.tsx           # Root layout (AuthProvider wrapper)
    (auth)/               # Auth flow (public)
      email.tsx           # Email input + privacy checkbox
      otp.tsx             # 6-digit OTP verification
    (tabs)/               # Main app (tab navigator)
      _layout.tsx         # Tab config + responsive Header
      index.tsx           # Home feed — categories + listings grid
      search.tsx          # Search with filters + recent + popular
      create.tsx          # Create listing wizard (photos step)
      messages.tsx        # Conversations list
      profile.tsx         # User profile + menu
    listing/[id].tsx      # Listing detail
    settings.tsx          # App settings
    notifications.tsx     # Notifications list
    legal/
      privacy.tsx         # Privacy Policy
      terms.tsx           # Terms of Service
  components/
    Header.tsx            # Responsive header (mobile burger / desktop nav)
    MobileMenu.tsx        # Slide-in drawer menu
  contexts/
    AuthContext.tsx        # Auth state + token persistence + refresh
  api/
    src/
      index.ts            # Express server entry
      routes/
        auth.ts           # OTP auth: request-otp, verify-otp, refresh, me
        upload.ts         # File upload to MinIO
        messages.ts       # Conversations + messages CRUD
      middleware/
        auth.ts           # JWT verification middleware
      lib/
        jwt.ts            # Token generation utilities
        prisma.ts         # Prisma client singleton
    prisma/
      schema.prisma       # DB schema: User, OtpCode, RefreshToken, Conversation, Message
```

---

## For AI Code Terminals

**This section is the source of truth for any AI assistant (Claude Code, Cursor, Windsurf, Aider, Copilot, OpenHands, etc.) working on projects based on this template.**

### ABSOLUTE RULES — violating any of these = broken project

| # | Rule | Why |
|---|------|-----|
| 1 | **NativeWind `className` ONLY** | Zero `StyleSheet.create`. All styling via Tailwind classes. Mixing systems = style conflicts + doubled rendering on web. |
| 2 | **`tsc --noEmit` must pass** | Both frontend AND `api/`. Run before EVERY commit. Zero tolerance for TS errors. |
| 3 | **OTP auth, no passwords** | Email -> 6-digit code -> JWT. Dev mode: code `000000` always works. No registration forms, no password fields. |
| 4 | **ONE codebase, responsive** | Mobile (<640px) uses bottom tabs + burger menu. Desktop (>=640px) uses header nav, no bottom tabs. `useWindowDimensions` for breakpoints. Never create separate mobile/desktop versions. |
| 5 | **Expo Router file-based** | Routes = files in `app/`. No manual route registration. Follow Expo Router v3 conventions. |
| 6 | **Express + Prisma backend** | All DB access through Prisma. All routes in `api/src/routes/`. Register in `api/src/index.ts`. |
| 7 | **MinIO for files** | All file uploads go to MinIO via `api/src/routes/upload.ts`. Never store files locally or in DB. |
| 8 | **No unused code** | No dead imports, no commented-out code, no "TODO" placeholders. If it's not used — delete it. |

### Adding a New Screen

```bash
# 1. Create the file
touch app/my-new-screen.tsx

# 2. Register in app/_layout.tsx (add Stack.Screen)

# 3. Use this template:
```

```tsx
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MyNewScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerClassName="pb-8">
        <View className="px-4 pt-2 pb-3">
          <Text className="text-2xl font-bold text-gray-900">Title</Text>
        </View>
        {/* Content here */}
      </ScrollView>
    </SafeAreaView>
  );
}
```

### Adding a New API Endpoint

```bash
# 1. Create route file
touch api/src/routes/my-route.ts

# 2. Register in api/src/index.ts:
#    import myRoutes from "./routes/my-route";
#    app.use("/api/my-route", myRoutes);

# 3. Use this template:
```

```typescript
import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// GET /api/my-route
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    // Your logic here
    res.json({ data: [] });
  } catch (error) {
    console.error("my-route error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
```

### Adding a Database Model

1. Edit `api/prisma/schema.prisma` — add model
2. Run `cd api && npx prisma migrate dev --name add-my-model`
3. Prisma client regenerates automatically

### Common Pitfalls That Break Everything

| Problem | Cause | Fix |
|---------|-------|-----|
| **Doubled inputs on web** | `TextInput` wrapped in `Pressable`, or NativeWind class on hidden input | Never nest `TextInput` in `Pressable`. For hidden inputs use inline `style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}` |
| **Styles not applying** | Using `style` prop instead of `className` | All styling via `className`. Only exception: dynamic values that can't be expressed in Tailwind (like `backgroundColor: dynamicColor`) |
| **White screen on web** | Import from wrong package, or missing polyfill | Check Expo compatibility. Use `react-native-web` compatible APIs only. |
| **Auth not persisting** | Forgot AsyncStorage, or token key mismatch | Tokens stored via `@react-native-async-storage/async-storage`. Keys: `etalon_access_token`, `etalon_refresh_token` |
| **API 401 errors** | Token expired, no refresh logic | AuthContext has auto-refresh every 12 min. On 401, call `refreshAuth()` before retrying. |
| **Navigation not working** | Wrong route path format | Expo Router routes = file paths. `/(tabs)` prefix for tab screens. Use `router.push()` with the file path. |

### Responsive Design Rules

```tsx
import { useWindowDimensions } from "react-native";

// In component:
const { width } = useWindowDimensions();
const isMobile = width < 640;
const isTablet = width >= 640 && width < 1024;
const isDesktop = width >= 1024;
```

- Mobile-first: design for 375px, then adapt up
- Never use `maxWidth: 430` or any fixed px on root containers
- Use `flex-1` for full-width layouts
- Grid: `numColumns={isMobile ? 2 : isTablet ? 3 : 4}` for listing grids

### Verification Checklist (after ANY change)

```bash
# Must ALL pass before commit:
npx tsc --noEmit                    # Frontend TypeScript
cd api && npx tsc --noEmit          # Backend TypeScript
npx expo start --web                # Must open without errors
curl localhost:3000/api/health      # Must return ok
```

### Git Workflow

- Work in branches, never commit to `main` directly
- PR required for all changes
- CI runs `tsc` + ESLint on every PR
- Branch naming: `feat/description`, `fix/description`, `refactor/description`

---

## Auth Flow

```
User opens app
  |
  +-- Has stored token? 
       |
       +-- YES: GET /api/auth/me
       |    +-- 200: Show tabs (authenticated)
       |    +-- 401: Try refresh token
       |         +-- Success: Show tabs
       |         +-- Fail: Show email screen
       |
       +-- NO: Show email screen
            |
            User enters email + checks privacy checkbox
            -> POST /api/auth/request-otp { email }
            -> Navigate to OTP screen
            |
            User enters 6-digit code (dev: 000000)
            -> POST /api/auth/verify-otp { email, code }
            -> Store tokens + user data
            -> Navigate to tabs
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/request-otp` | No | Send OTP to email |
| POST | `/api/auth/verify-otp` | No | Verify OTP, get tokens |
| POST | `/api/auth/refresh` | No | Refresh access token |
| GET | `/api/auth/me` | Yes | Get current user |
| POST | `/api/upload` | Yes | Upload file to MinIO |
| GET | `/api/files/:key` | No | Get signed URL for file |
| GET | `/api/messages` | Yes | List conversations |
| GET | `/api/messages/:id` | Yes | Get messages in conversation |
| POST | `/api/messages/:id` | Yes | Send message |
| GET | `/api/health` | No | Health check |

## Environment Variables

See `api/.env.example` for all required variables.

## License

MIT
