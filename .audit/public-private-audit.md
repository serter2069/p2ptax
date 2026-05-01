# Public vs Authenticated Routes — Analysis

_Generated: 2026-04-30 | Branch: development_

---

## Routes Classification

| Route | Auth | Guard | Anon redirect | Anon chrome | Auth chrome |
|---|---|---|---|---|---|
| `/` (index.tsx) | PUBLIC | none | (no redirect) | LandingHeader w/ Login/CTA buttons | LandingHeader w/ "Dashboard" button (isAuthenticated passed as prop) |
| `/login` | PUBLIC | redirects-if-authed | — | Centered form | Redirects to dashboard / returnTo |
| `/otp` | PUBLIC | none | Shows "session expired" state if no email param | Centered OTP form | Redirects on success |
| `/notifications` | AUTH-ONLY | `useRequireAuth` | → `/login?returnTo=/notifications` | Loading spinner (pending redirect) | Custom header + notification list |
| `/legal/index` | PUBLIC | none | — | PageTitle + DesktopScreen | Same |
| `/legal/privacy` | PUBLIC | none | — | Same as anon | Same |
| `/legal/terms` | PUBLIC | none | — | Same as anon | Same |
| `/onboarding/name` | AUTH-ONLY | `useRequireAuth` | → `/login?returnTo=/onboarding/name` | Loading shell | Onboarding step 1 |
| `/onboarding/visibility` | AUTH-ONLY | `useRequireAuth` | → `/login?returnTo=…` | Loading shell | Onboarding step |
| `/onboarding/profile` | AUTH-ONLY | `useRequireAuth` | → `/login?returnTo=…` | Loading shell | Onboarding step |
| `/onboarding/work-area` | AUTH-ONLY | `useRequireAuth` | → `/login?returnTo=…` | Loading shell | Onboarding step |
| `/specialists` | PUBLIC | none (SpecialistFeed mode='all') | (no redirect) | LandingHeader (anon) | SidebarNav / tab bar (auth) |
| `/specialists/[id]` | AUTH-OPT | none — content varies | (no redirect) | Profile + locked contacts section | Profile + full contacts |
| `/saved-specialists` | AUTH-ONLY | inline guard in SpecialistFeed (`mode='favorites'`) → `nav.replaceRoutes.login()` | → `/login` (no returnTo!) | Loading → redirect | Saved list |
| `/requests` (catalog tab) | PUBLIC | none | (no redirect) | Requests bourse | Same |
| `/requests/index` | PUBLIC | none | (no redirect) | Same | Same |
| `/requests/new` | AUTH-OPT | none — inline OTP if anon | (no redirect) | LandingHeader + "sign in at submit" banner | Auth-only header hidden, form shown |
| `/requests/[id]/detail` | AUTH-OPT | none — anon shows public fallback | (no redirect) | AnonymousView (truncated title+desc, login CTA) | OwnerView or SpecialistView |
| `/requests/[id]/messages` | AUTH-ONLY | `useRequireAuth` | → `/login?returnTo=…` | Loading spinner | Threads list |
| `/requests/[id]/write` | AUTH-ONLY | `useRequireAuth` + specialist check | → `/login?returnTo=…` | Loading | Compose form |
| `/threads/[id]` | AUTH-ONLY | `useRequireAuth` | → `/login?returnTo=…` | Loading spinner | Chat view |
| `/settings` | AUTH-ONLY | `useRequireAuth` | → `/login?returnTo=/settings` | Loading skeleton | Settings tabs |
| `/admin/settings` | AUTH-ONLY (soft) | **none — no useRequireAuth** | (no redirect — shows settings form) | Admin settings form visible until API 401 | Same form |
| `/(tabs)/dashboard` | AUTH-ONLY (via redirect) | redirect to `/my-requests` on mount | → depends on my-requests guard | n/a (transparent redirect) | n/a |
| `/(tabs)/messages` | AUTH-ONLY | `useRequireAuth` | → `/login?returnTo=…` | Loading spinner | Inbox |
| `/(tabs)/my-requests` | AUTH-ONLY (soft) | **no explicit guard** — relies on API 401 | (no redirect) | Empty state (no auth error shown) | Requests list |
| `/(tabs)/profile` | AUTH-ONLY | via `useRequireAuth` inside `UnifiedSettings` | → `/login?returnTo=…` | Loading | Settings |
| `/(tabs)/requests` | PUBLIC | none | (no redirect) | Public requests bourse | Same |
| `/(tabs)/public-requests` | PUBLIC | legacy redirect to `/(tabs)/requests` | — | — | — |
| `/(admin-tabs)/*` | ADMIN-ONLY | `(admin-tabs)/_layout.tsx` checks `isAdminUser` | → `/login` or `/(tabs)` | LoadingState | Admin panel |
| `/brand` | PUBLIC | none | — | Component showcase | Same |

---

## API ↔ Frontend Auth Mismatches

| Frontend route | API call | API auth | Frontend auth | Issue |
|---|---|---|---|---|
| `/saved-specialists` | `GET /api/specialists?savedOnly=true` | **optional auth** on the root endpoint; returns 401 only when `savedOnly=true` | `SpecialistFeed mode='favorites'` redirects to `/login` — but **without `returnTo`** | After login user lands on dashboard, not on saved-specialists. Broken deep-link. |
| `/(tabs)/my-requests` | `GET /api/requests/my` | `authMiddleware` (hard 401) | **No guard in RequestsFeed mode='mine'** — no `useRequireAuth`, no redirect | Anon hitting `/(tabs)/my-requests` sees a blank loading state, then an error ("Не удалось загрузить заявки") with no login prompt. Silent failure. |
| `/admin/settings` | `GET /api/admin/settings`, `PATCH /api/admin/settings` | `authMiddleware` + `roleGuard("ADMIN")` (returns 401/403) | **No `useRequireAuth`, no role check on the frontend screen** | The screen renders the full form shell. A non-admin authenticated user sees the form momentarily before the API returns 403 (loading spinner appears, then error state). An unauthenticated user sees the form shell before the fetch finishes. Data is never returned (403/401), but the UI structure is leaked. |
| `/(tabs)/_layout.tsx` (unread badge) | `GET /api/messages/unread-count` | `authMiddleware` | **Called unconditionally in `useEffect`** — no auth check, no `if (isAuthenticated)` | Anonymous users hitting any `/(tabs)` route trigger this request and get a 401. The error is silently swallowed (`.catch(() => {})`), so the badge just shows 0, but it generates a 401 on every 30-second interval. |
| `/requests/[id]/detail` (anon) | `GET /api/requests/:id/public` | **No `authMiddleware`** | Frontend intentionally calls this anon | Correct — public endpoint, anon flow works. |
| `/requests/[id]/detail` (auth) | `GET /api/requests/:id/detail` | `authMiddleware` | `useAuth` isAuthenticated check | `detail` endpoint returns OwnerView OR SpecialistView based on `userId === request.userId`. A random authenticated user who is not the owner and not a specialist gets a SpecialistView with a compose box but no actual specialist check (API just checks `isOwner`, not `isSpecialist`). Any logged-in non-specialist can technically compose a response CTA is shown to them. |
| `/requests/[id]/write` | `GET /api/requests/:id/public` + `POST /api/threads` | public + `authMiddleware` + specialist check in POST | `useRequireAuth` + `isSpecialistUser` frontend check | Mismatch: if `!isSpecialistUser`, frontend redirects to `/login`. But the user IS authenticated — they just aren't a specialist. Login page is wrong destination; should redirect to dashboard or show "you're not a specialist" error. |
| `/(admin-tabs)/dashboard` | `GET /api/admin/stats`, `GET /api/stats/admin-dashboard` | `authMiddleware + roleGuard("ADMIN")` | `(admin-tabs)/_layout.tsx` checks `isAdminUser` | Correct — layout guard fires before screens mount. |
| `/specialists/[id]` | `GET /api/specialists/:id` (noAuth) + `GET /api/specialists/:id/contacts` (noAuth) | **No auth on either endpoint** | Frontend reads `isAuthenticated` to show/hide contacts | Contacts (phone, telegram, whatsapp, office address) are returned from API **regardless of auth** via `/api/specialists/:id`. The frontend hides them behind `SpecialistGuestLockedContacts` for anon users, but the raw data is in the API response visible to anyone with DevTools or curl. |

---

## Chrome Inconsistencies

### `/specialists` — Public Catalog
- **Anon**: `LandingHeader` (logo + nav links + "Войти" + "Создать запрос" CTA). Full public catalog with filters.
- **Auth (mobile)**: `HeaderHome` (burger + notifications) + bottom tab bar. `LandingHeader` is NOT shown.
- **Auth (desktop)**: SidebarNav / desktop header from `(tabs)/_layout.tsx`. No `LandingHeader`.
- **Gap**: Anon and auth show different structural chrome on the same content page. Not a bug per se (intentional dual-chrome), but when an anon user logs in from the landing page header and is redirected to dashboard, they lose the catalog context entirely — no breadcrumb back to `/specialists`.

### `/requests/new` — Create Request
- **Anon**: `LandingHeader` shown at top (via explicit `{!isAuthenticated && <LandingHeader .../>}`). Blue "sign in at submit" banner. No file upload section.
- **Auth**: No `LandingHeader` (just back button). No banner. File upload section visible.
- **Gap**: On mobile desktop-breakpoint check for `LandingHeader` is `width >= 768`. On the anon side back-button is only shown for `width < 640`. Between 640–768 the anon user gets neither a back button nor a hamburger — navigation-dead zone on tablet portrait.

### `/requests/[id]/detail` — Request Detail
- **Anon**: Truncated card (`AnonymousView` — title + first 200 chars of description + login CTA). No city/FNS chips. No status badge. No file list.
- **Auth (owner)**: Full `OwnerView` — description, status, city, FNS, files, threads, extend/close actions.
- **Auth (non-owner specialist)**: `SpecialistView` — description, files, compose box.
- **Auth (non-owner non-specialist)**: `SpecialistView` shown — compose box + "Отправить" button displayed, but API will return 403 on `POST /api/threads` because the server checks `isSpecialist`. The button works visually but fails at submission. **This is the most confusing UX gap: a plain client user sees a specialist's compose interface on someone else's request.**

### `/saved-specialists` (favorites)
- **Anon**: Immediately redirects to `/login` — but **no `returnTo` param** is appended, so post-login the user lands on the dashboard rather than their saved list. The intent is lost.
- **Auth**: Saved specialists list with same filter chrome as the public catalog.

---

## Security Holes

### HIGH — Contacts data exposed without auth
**File**: `api/src/routes/specialists.ts`, line 472–598 (`GET /api/specialists/:id`)

The full specialist profile endpoint — including `profile.phone`, `profile.telegram`, `profile.whatsapp`, `profile.officeAddress` — is returned to **any caller, authenticated or not**. The frontend conditionally renders `SpecialistGuestLockedContacts` for anon users, but the data is in the JSON payload. Any unauthenticated actor with DevTools or a direct `curl` gets all contact details.

```
curl http://localhost:3812/api/specialists/<any-id>
# Returns: profile.phone, profile.telegram, profile.whatsapp
```

The API-side fix requires either: (a) stripping contact fields for unauthed callers in the same handler using the optional-auth pattern already used for `callerId` in `/:id/public`; or (b) moving contacts to a separate `/contacts` endpoint with `authMiddleware` (the endpoint already exists at `/api/specialists/:id/contacts`, but the detail endpoint duplicates the data inline).

### MEDIUM — `/(tabs)/my-requests` shows silent failure for anon users
**File**: `app/(tabs)/my-requests.tsx` → `components/requests/RequestsFeed.tsx`

`RequestsFeed mode='mine'` has no `useRequireAuth`. An unauthenticated user navigating to `/(tabs)/my-requests` (e.g., via bookmark or back-navigation) sees a loading spinner, gets a 401 from `/api/requests/my`, and the component shows `"Не удалось загрузить заявки"` with a generic error state — no login prompt, no explanation. The user is stuck with an unexplained error.

### MEDIUM — `/admin/settings` has no frontend auth guard
**File**: `app/admin/settings.tsx`

The screen uses `useAuth()` for the token but never calls `useRequireAuth()` or checks `isAdminUser`. An unauthenticated user hitting `/admin/settings` directly sees the form skeleton briefly before `fetchSettings()` fires and returns 401. A non-admin authenticated user sees the form and a 403 on fetch. The API is correctly guarded (401/403), but the UI reveals the admin settings structure (field labels, categories) before any error response arrives. Also: if `token` is null, `fetchSettings()` returns early without showing any error, leaving the screen in a permanent loading state.

### MEDIUM — Non-specialist authenticated users see compose UI on request detail
**File**: `app/requests/[id]/detail.tsx` (SpecialistView) + `api/src/routes/requests.ts` lines 577–618

`GET /api/requests/:id/detail` returns `viewType: "specialist"` for ANY authenticated user who is not the request owner — including plain clients. The API doesn't check `isSpecialist`. Frontend `SpecialistView` shows a full compose input and "Отправить" button. Submission hits `POST /api/threads` which DOES check `isSpecialist` (403). Result: the button is visible, enabled, and fails silently on press with "Only specialists can create threads."

### LOW — `/requests/[id]/write` wrong redirect for non-specialist auth users
**File**: `app/requests/[id]/write.tsx`, lines 83–88

```tsx
useEffect(() => {
  if (ready && !isSpecialistUser) {
    nav.replaceRoutes.login();  // ← sends to /login for authenticated non-specialists
  }
}, [ready, isSpecialistUser, nav]);
```

A logged-in client (not a specialist) who lands on `/requests/:id/write` gets redirected to `/login`, which shows the email entry form. They are already authenticated — the redirect destination is wrong. Should be `/dashboard` or show an inline "this section is for specialists" message.

### LOW — `GET /api/threads/sample` and `GET /api/requests/sample` are unauthenticated
**File**: `api/src/routes/threads.ts` line 76–87, `api/src/routes/requests.ts` lines 154–166

These dev-helper endpoints are registered **before** `router.use(authMiddleware)` and return the first thread/request ID from the database. They are intended for metromap URL resolution but are public on production. Low severity (only returns one ID, no PII), but should be removed or auth-gated before production.

### LOW — `(tabs)/_layout.tsx` unconditionally polls `/api/messages/unread-count`
**File**: `app/(tabs)/_layout.tsx`, lines 30–39

The 30-second polling interval fires for all users including unauthenticated ones. The 401 is silently swallowed. No data leak, but it generates unnecessary API traffic and pollutes server logs.

### INFO — `GET /api/specialists` with `savedOnly=true` is auth-gated at API level correctly
The `savedOnly` path correctly returns 401 without a Bearer token. The frontend guard in `SpecialistFeed mode='favorites'` redirects to `/login` but without `returnTo`, losing intent.

### INFO — Admin API correctly double-guarded
`api/src/routes/admin.ts` applies `authMiddleware` + `roleGuard("ADMIN")` at the router level — all sub-routes inherit both guards. Correct.

---

## Recommendations (prioritized)

### P0 — Fix contact data exposure in specialist detail API
Strip `profile.phone`, `profile.telegram`, `profile.whatsapp`, `profile.officeAddress` from `GET /api/specialists/:id` response when no valid Bearer token is present. Use the same `resolveCallerId()` pattern already in the file. Contacts endpoint (`/api/specialists/:id/contacts`) can remain auth-only.

### P0 — Add `useRequireAuth` to `/(tabs)/my-requests`
`RequestsFeed mode='mine'` must guard itself. Either add `useRequireAuth` inside the component when mode is `'mine'`, or add the guard in the `app/(tabs)/my-requests.tsx` wrapper. Currently anon users see a misleading error state with no login path.

### P1 — Add frontend auth guard to `/admin/settings`
Add `useRequireAuth()` and check `isAdminUser`. If not admin, redirect to `/(tabs)/my-requests`. This prevents the form skeleton flash and the permanent-loading-state when token is null.

### P1 — Fix `/requests/[id]/detail` SpecialistView guard
`GET /api/requests/:id/detail` should check `isSpecialist` before returning the specialist view. Non-specialist authenticated users who are not the owner should receive a 403, or the API should return a "public view" similar to the anonymous endpoint. Alternatively, the frontend should gate `SpecialistView` rendering on `isSpecialistUser`.

### P1 — Fix `/requests/[id]/write` wrong redirect for non-specialist auth users
Change `nav.replaceRoutes.login()` to `nav.replaceRoutes.dashboard()` (or equivalent). Sending an authenticated user to `/login` is a logic error.

### P2 — Fix `/saved-specialists` redirect to include `returnTo`
In `SpecialistFeed mode='favorites'`, pass `returnTo: '/saved-specialists'` when calling `nav.replaceRoutes.login()`:
```tsx
nav.replaceAny({ pathname: '/login', params: { returnTo: '/saved-specialists' } });
```

### P2 — Remove or auth-gate `/api/threads/sample` and `/api/requests/sample`
Move these registrations after `router.use(authMiddleware)`, or gate them with `process.env.NODE_ENV === 'development'` check.

### P3 — Guard unread-count polling in `(tabs)/_layout.tsx`
Wrap `fetchUnread` call in `if (isAuthenticated)` before the interval starts.

### P3 — Fix navigation dead zone on `/requests/new` for anon tablet users (640–768px)
The back button is only shown for `width < 640`. The `LandingHeader` is shown for `!isAuthenticated && width >= 768`. Between 640–767px anon users have no navigation escape. Add back button for the full range `width < 768` on the anon path.

### INFO — Document intended behavior: contacts lock is frontend-only
Until P0 is fixed, add a comment in `api/src/routes/specialists.ts` noting that contact data is returned publicly and the lock is UI-only. Prevents future developers from assuming the API enforces it.
