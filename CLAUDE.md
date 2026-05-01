# Etalon — Claude Code Instructions

## ABSOLUTE RULES

1. **NativeWind className ONLY** — zero `StyleSheet.create`. If you write `StyleSheet.create` anywhere, you broke the rule.
2. **`tsc --noEmit` = 0 errors** — both frontend (`/`) and backend (`/api`). Check before every commit.
3. **OTP auth** — no passwords. Email -> 6-digit code -> JWT. Dev: `000000`.
4. **Responsive** — one codebase. Mobile <640px (bottom tabs + burger). Desktop >=640px (header nav, no tabs).
5. **Never say "done" without running `tsc --noEmit` and `npx expo start --web`.**

## Stack

- Expo SDK 54 + Expo Router v3 (file-based routing in `app/`)
- NativeWind v4 (Tailwind CSS via `className`)
- Express + Prisma + PostgreSQL (in `api/`)
- MinIO for file uploads
- AsyncStorage for token persistence

## Key Files

- `app/_layout.tsx` — root layout, wraps everything in AuthProvider
- `app/(tabs)/_layout.tsx` — tab navigator + responsive Header component
- `components/Header.tsx` — responsive: burger on mobile, nav links on desktop
- `components/MobileMenu.tsx` — slide-in drawer, opened by burger icon
- `contexts/AuthContext.tsx` — auth state, token storage, auto-refresh
- `api/src/index.ts` — Express entry, route registration
- `api/prisma/schema.prisma` — database schema

## Adding Screens

1. Create file in `app/` (Expo Router convention)
2. Add `<Stack.Screen name="..." />` in `app/_layout.tsx`
3. Use `SafeAreaView` as root, `className` for all styling
4. Import Header only in tab layout, not in individual screens

## Adding API Routes

1. Create `api/src/routes/name.ts`
2. Register in `api/src/index.ts`: `app.use("/api/name", nameRoutes)`
3. Use `authMiddleware` for protected routes
4. Use `prisma` for all DB ops

## Known Gotchas

- **Doubled TextInput on web**: never put TextInput inside Pressable. For hidden inputs, use inline `style` not `className`
- **NativeWind on web**: some classes behave differently. Test on web after every UI change.
- **Dynamic styles**: if you need `backgroundColor: variable`, use inline `style` prop alongside `className` for static classes
- **Expo Router navigation**: paths match file structure. `/(tabs)` = tab group. Use `router.push("/path" as never)` for type safety workaround.

## Ports

- Frontend: 8081 (Expo default)
- Backend: 3000
- Override backend URL: set `EXPO_PUBLIC_API_URL` env var

## Verification (mandatory before every commit)

```bash
npx tsc --noEmit && cd api && npx tsc --noEmit && cd ..
```

Both must pass with 0 errors. No exceptions.

## Discipline (added 2026-04-30)

Before claiming "done" on any visual/chrome change:
1. Touch a file matching `*Header*.tsx` or `_layout.tsx`? Run `npm run audit:visual` and inspect `.audit/screenshots/`.
2. Add a logo? Use `<Logo>` from `@/components/brand/Logo`, NEVER raw `<Image source={require("@/assets/images/logo...")} />`.
3. Add an input? Use `<Input>` from `@/components/ui/Input`, NEVER raw `<TextInput>` (ESLint enforces).
4. Touch `app/_layout.tsx` or `(tabs)/_layout.tsx`? Re-verify mobile + desktop chrome rendering by manual visual check.
5. Logo placeholder forbidden: never `<View bg=primary><Text>P</Text></View>` style fake logos.
6. The full structure audit lives at `.audit/structure-audit.md` — re-run via the audit prompt template if it goes stale.

## Layout / Width House Rules (added 2026-05-01)

| Page type | maxWidth | paddingHorizontal |
|---|---|---|
| Content / list / catalog / detail | 960 | 24 |
| Forms (profile, requests/new, admin settings) | 720 | 24 |
| Two-pane (messages) outer | 960 | 0 |
| Legal prose | 720 | 24 |
| Auth (login/otp) | 400 | 24 |

Sidebar = 240px on ≥768px. Optimal viewport 1200px → 960px content.

### Forbidden
- New raw `bg-white border border-border rounded-{xl,2xl}` — use `<Card>` from `components/ui/Card.tsx`.
- Reusing `ResponsiveContainer` — deprecated, use explicit `maxWidth`.
- `rounded-xl` on card-level surfaces — `rounded-2xl` is the standard.
- Bespoke `maxWidth` outside this table without a comment justifying why.

### Card primitive
Always use `<Card>` from `components/ui/Card.tsx`. It owns `rounded-2xl`, `border-border`, white-ish surface, and shadow tier. If you need a tinted card, request an `<Card variant="accent">` extension rather than reverting to raw.
