# SCREEN MAP: P2PTax

## Global Layout Rules (ALL screens)

### Responsive
- Mobile (<640px): content full width, `px-4` (16px padding)
- Desktop (>=640px): content `style={{ maxWidth: 520, width: "100%", alignSelf: "center" }}`
- FORBIDDEN: fixed px widths that break on any viewport

### Auth screens (login, OTP, onboarding)
- Header: back button left + title center (if there's a screen to go back to)
- Content position: upper third (paddingTop: 12-15%), NOT vertical center
- Logo/brand mark above the form
- Single column

### Tab screens (main tabs — feed, search, favorites, chats, profile)
- Header: Home header (logo + icons)
- Content: full width, ScrollView
- Footer: TabBar on mobile (<640px), hidden on desktop
- Desktop: content area expands, grid columns increase (2→3→4)

### Detail screens (listing detail, chat dialog, settings, etc.)
- Header: Back header (chevron-left + title)
- Content: full width, ScrollView
- No TabBar

### Admin screens
- Sidebar navigation on desktop, burger menu on mobile
- Content: full width with table layouts

### Definition of Done — EVERY screen, NO exceptions

| # | Criterion | How to verify |
|---|-----------|--------------|
| 1 | tsc --noEmit = 0 errors | Run from project root |
| 2 | Desktop screenshot (>640px) | maxWidth respected, layout per category above |
| 3 | Mobile screenshot (375px) | Nothing overflows, touch targets >= 44px |
| 4 | Header matches Layout spec | Back button if spec says so, title correct |
| 5 | ALL UI Elements from spec implemented | Cross-check against screen's UI Elements table |
| 6 | Interactive elements work | Input/delete/submit via comet |
| 7 | States implemented | Loading, Error, Empty where spec requires |
| 8 | Colors ONLY from brand (6+3) | grep hex in file — all match palette |
| 9 | TextInput = inline style only | Zero className on any TextInput (NativeWind web bug) |
| 10 | Russian text, no typos | Read all visible strings on screenshot |

Agent CANNOT self-verify. Orchestrator checks via comet screenshots + UX test.

---

## Design System

### Colors (9 tokens — Navy + Gold)
| Token | Tailwind | Hex | Usage |
|-------|----------|-----|-------|
| primary | blue-900 | #1e3a8a | Buttons, links, active tabs, headers |
| primary-dark | slate-900 | #0f172a | Button pressed state |
| accent | amber-700 | #b45309 | CTA actions (write to specialist), highlights |
| background | white | #ffffff | Page background |
| surface | slate-50 | #f8fafc | Card background, input background |
| text-primary | slate-900 | #0f172a | Headlines, body text |
| error | red-600 | #dc2626 | Validation errors, destructive actions, ban badge |
| success | emerald-600 | #059669 | Active status, available badge |
| warning | amber-500 | #f59e0b | Closing soon badge |

Derivative (from base tokens, not counted):
- text-secondary: slate-400 (captions, placeholders)
- border: slate-200 (input borders, dividers)
- muted: slate-300 (disabled state, "not your region")

### Typography
| Style | Size | Weight | Tailwind | Usage |
|-------|------|--------|----------|-------|
| h1 | 24px | 700 | text-2xl font-bold | Screen titles |
| h2 | 20px | 600 | text-xl font-semibold | Section headers |
| h3 | 18px | 600 | text-lg font-semibold | Card titles, specialist name |
| body | 16px | 400 | text-base | Main text, descriptions |
| caption | 14px | 400 | text-sm | Secondary info, timestamps |
| small | 12px | 400 | text-xs | Badges, hints, counters |

Font family: system default

### Spacing
| Token | Value | Tailwind |
|-------|-------|----------|
| xs | 4px | p-1 / gap-1 |
| sm | 8px | p-2 / gap-2 |
| md | 16px | p-4 / gap-4 |
| lg | 24px | p-6 / gap-6 |
| xl | 32px | p-8 / gap-8 |

### Shared Components

**Button (primary):** bg-blue-900, text white, h-12, rounded-xl, full-width mobile, loading spinner, active:bg-slate-900
**Button (accent):** bg-amber-700, text white, same dimensions, active:bg-amber-800
**Button (secondary):** bg-slate-100, text slate-900, same dimensions, active:bg-slate-200
**Button (danger):** border red-600, text red-600, transparent bg, active:bg-red-50
**Input:** bg-slate-50, border slate-200, h-12, rounded-xl, px-4. Focus: border-2 blue-900. Error: border red-600 bg-red-50 + helper text
**Textarea:** same as Input but multiline, char counter bottom-right (caption)
**Card:** bg white, border slate-200, rounded-xl, p-4, shadow-sm
**Avatar:** round, sizes: sm(32), md(48), lg(72), fallback: initials on blue-100 bg with blue-900 text
**Badge:** min-w-[22px] h-[22px] rounded-full, font small. Variants: error(red-600), success(emerald-600), warning(amber-500)
**Chip:** bg-slate-100, rounded-lg, px-2.5 py-1, text caption. Active: bg-blue-900 text-white
**Empty State:** centered, icon 44px slate-300, title body font-semibold slate-400, subtitle sm slate-400, CTA button primary
**Loading State:** skeleton shimmer (slate-200/slate-100 alternating)
**Error State:** icon red-600, message body, Button "Retry"
**Toast:** bottom center, auto-dismiss 3s, success(emerald)/error(red)

### Header Patterns

**Header-Back:** left arrow, center title font-semibold, h-14, bg white, border-b slate-200, rounded-xl
**Header-Home:** left "P2PTax" bold blue-900, right icon buttons (bell with badge), h-14, bg-blue-900 text-white
**Header-Search:** search icon + full-width input, h-14, bg white, border slate-200

### TabBar

Client tabs: Dashboard | My Requests | Messages
Specialist tabs: Dashboard | Public Requests | My Threads
Admin tabs: Dashboard | Users | Moderation
Active: blue-900, inactive: slate-400, height 60 + safe area

---

## Roles & Access

| Role | Description | Assigned |
|------|-------------|----------|
| guest | Not logged in | Default |
| client | Creates requests, receives messages from specialists | First login without specialist onboarding |
| specialist | Browses requests, writes to clients | After completing 3-step onboarding |
| admin | Full control, stats, moderation | Manually via DB |

---

## Screens

Statuses: `TODO` | `IN PROGRESS` | `DONE`

### PUBLIC

---
**Screen: LandingScreen**
Status: TODO
Route: /
Access: public (guest, client, specialist, admin)

Description: Main landing page with featured specialists and quick request form

Layout:
  - Header: Header-Home (logo left, "Sign In" button right)
  - Body: scroll
  - Footer: none

UI elements:
  - Hero section: title "Find a tax specialist", subtitle
  - Quick request form: city (select), service (select), description (textarea), Button "Submit"
    - If not authenticated: inline OTP flow after submit
  - Featured specialists: horizontal scroll cards (avatar md, name, services chips)
    - Card tap → SpecialistPublicProfile
  - Navigation links: "All Requests" → PublicRequestsFeed, "All Specialists" → SpecialistsCatalog
  - Button "Sign In" → AuthEmail

Acceptance Criteria:
  - [ ] Guest opens "/" → hero section, quick request form, featured specialists visible
  - [ ] Guest fills form (city, service, description) and clicks "Submit" → inline OTP flow appears
  - [ ] Guest taps specialist card → navigates to /specialists/[id]
  - [ ] Guest clicks "Sign In" → navigates to /auth/email

States:
  - Loading: skeleton for featured specialists + form
  - Populated: specialists rendered, form active
  - Error: error message + Retry

Data:
  - GET /api/specialists/featured
  - GET /api/cities
  - POST /api/requests/public (quick form)
  - POST /api/auth/request-otp (inline OTP)

Dependencies: none (entry point)

---
**Screen: PublicRequestsFeed**
Status: TODO
Route: /requests
Access: public (guest, client, specialist, admin)

Description: Feed of all active public requests

Layout:
  - Header: Header-Home, title "Requests"
  - Body: filter bar + vertical scrollable list
  - Footer: TabBar (specialist: tab 1) or none (guest)

UI elements:
  - Filter bar: city (select), service (select — one of 3)
  - Request card: title (h3), city+FNS (chips caption), service (chip), description truncated (body 2 lines), counter "X specialists responded" (caption)
  - Card tap → PublicRequestDetail
  - Infinite scroll (20 per page)
  - Empty state (no results): "No requests found" + reset filters link
  - Pull-to-refresh

Acceptance Criteria:
  - [ ] User opens /requests → list of active requests loads with cards
  - [ ] User selects city filter → list filters by city
  - [ ] User selects service filter → list filters by service
  - [ ] User scrolls to bottom → next page loads (infinite scroll)
  - [ ] User taps request card → navigates to /requests/[id]
  - [ ] No results → "No requests found" empty state with reset link

States:
  - Loading: skeleton cards
  - Empty: "No requests" illustration + text
  - Populated: list with pagination
  - Error: error + Retry

Data: GET /api/requests/public?city_id=X&service_id=Y&page=1&limit=20
Response: {items: [{id, title, city, fns, service, description, threadsCount, createdAt}], total, hasMore}

Dependencies: none

---
**Screen: PublicRequestDetail**
Status: TODO
Route: /requests/[id]
Access: public (guest, client, specialist, admin)

Description: Full details of a public request

Layout:
  - Header: Header-Back, title "Request"
  - Body: scroll
  - Footer: sticky Button "Write to Client" (specialist) / "Sign in to respond" (guest)

UI elements:
  - Title (h1)
  - City + FNS (chips), Service (chip)
  - Status badge: active (success) / closing_soon (warning) / closed (muted)
  - Description (body, full text)
  - Counter: "X specialists responded" (caption)
  - [guest] Footer button → AuthEmail
  - [specialist] Footer button "Write" → SpecialistConfirmWrite (if no existing thread)
  - [specialist] Footer button "Open Chat" → ChatThread (if thread already exists)
  - [specialist] Badge "Not your region" (muted) if request city not in specialist's cities
  - Section "Similar requests" (same city or service)

Acceptance Criteria:
  - [ ] User opens /requests/[id] → full request details (title, city, FNS, service, description, status badge) visible
  - [ ] Guest sees "Sign in to respond" footer button → tap navigates to /auth/email
  - [ ] Specialist sees "Write to Client" button → tap navigates to /requests/[id]/write
  - [ ] Specialist with existing thread sees "Open Chat" → tap navigates to /threads/[threadId]
  - [ ] Request status badge matches: active=green, closing_soon=amber, closed=gray

States:
  - Loading: full skeleton
  - Loaded: all data rendered
  - Error: "Request not found" / general error + Retry
  - Auth-required: button redirects to auth

Data: GET /api/requests/:id/public
Response: {id, title, city, fns, service, description, status, threadsCount, createdAt, hasExistingThread, existingThreadId}

Dependencies: PublicRequestsFeed, LandingScreen

---
**Screen: SpecialistsCatalog**
Status: TODO
Route: /specialists
Access: public (guest, client, specialist, admin)

Description: Directory of available specialists

Layout:
  - Header: Header-Home, title "Specialists"
  - Body: filter bar + vertical list
  - Footer: none

UI elements:
  - Filter: city (select) → FNS (cascade select, disabled until city chosen)
  - Filter: services (3 checkboxes, multiselect): Inspection, Audit, Operational Control
  - Specialist card: avatar (md), firstName + lastName (h3), services (chips caption), city (caption)
  - Card tap → SpecialistPublicProfile
  - Infinite scroll
  - Only specialists with is_available=true shown
  - Empty state: "No specialists found" + reset filters

Acceptance Criteria:
  - [ ] User opens /specialists → list of available specialists loads
  - [ ] User selects city → FNS dropdown becomes enabled with that city's offices
  - [ ] User checks service checkboxes → list filters by services
  - [ ] User taps specialist card → navigates to /specialists/[id]
  - [ ] No results → "No specialists found" empty state with reset link

States:
  - Loading: skeleton cards
  - Empty: illustration + text
  - Populated: list with pagination
  - Error: error + Retry

Data: GET /api/specialists?city_id=X&fns_id=Y&services=1&services=2&page=1&limit=20

Dependencies: none

---
**Screen: SpecialistPublicProfile**
Status: TODO
Route: /specialists/[id]
Access: public (guest, client, specialist, admin)

Description: Public profile of a specialist

Layout:
  - Header: Header-Back, right: "Edit" (own profile only)
  - Body: scroll
  - Footer: none

UI elements:
  - Avatar (lg, centered)
  - Name: firstName + " " + lastName (h1, centered)
  - Description (body)
  - Toggle is_available (visible only to own specialist): "Accepting requests" / "Not accepting"
  - FNS & Services section: chips grouped by city
    - Format: "Moscow: IFNS #1 [Inspection][Audit], IFNS #5 [Audit]"
    - If >10 chips → "Show all" collapse button
  - Contacts section (PUBLIC — visible to everyone including guests):
    - Phone: "Call" button (tel: link)
    - Telegram: t.me/username link
    - WhatsApp: wa.me/number link
    - Office address (if filled)
    - Working hours (if filled)
  - "Similar specialists" section: horizontal scroll from same city
  - No ratings/reviews in MVP (stub only)

Acceptance Criteria:
  - [ ] User opens /specialists/[id] → avatar, name, description, FNS+services chips, contacts visible
  - [ ] Contacts section visible to everyone (including guests): phone, telegram, whatsapp, address, hours
  - [ ] Own profile shows "Edit" button in header and is_available toggle
  - [ ] Phone shows "Call" button (tel: link), Telegram shows t.me link, WhatsApp shows wa.me link

States:
  - Loading: skeleton avatar + text
  - Loaded: full profile rendered
  - Error: "Specialist not found" / error + Retry

Data: GET /api/specialists/:id
Response: {id, firstName, lastName, avatar, description, isAvailable, phone, telegram, whatsapp, officeAddress, workingHours, fnsServices: [{city, fns, services[]}], createdAt}

Dependencies: SpecialistsCatalog, LandingScreen

---

### AUTH

---
**Screen: AuthEmail**
Status: TODO
Route: /auth/email
Access: public (guest only, auth users redirect to their dashboard)

Description: Email entry for login/registration (single flow)

Layout:
  - Header: Header-Back (back to Landing)
  - Body: centered vertically, padded horizontal xl
  - Footer: none

UI elements:
  - App logo (centered, 80px, margin-bottom xl)
  - Title "Sign In" (h1, centered)
  - Subtitle "Enter your email to continue" (caption, centered)
  - Input email (keyboard: email, autocapitalize: none)
  - Button primary "Continue" (margin-top lg)
  - Text link "Terms of Use" (caption, centered) → TermsScreen

Acceptance Criteria:
  - [ ] Guest opens /auth/email → email input and "Continue" button visible
  - [ ] Guest enters valid email, clicks "Continue" → spinner shows, then navigates to /auth/otp
  - [ ] Guest enters invalid email → "Invalid email" error on input
  - [ ] Already authenticated user visits /auth/email → redirected to their dashboard

States:
  - Idle: form ready
  - Submitting: button spinner
  - Error: input border error + "Invalid email" / network error toast

Data: POST /api/auth/request-otp {email}
Response: {success: true}

Business rules:
  - Dev mode: OTP always 000000
  - Email creates user if not exists
  - OTP valid for 15 minutes

Dependencies: none (entry point from any unauth trigger)

---
**Screen: AuthOTP**
Status: TODO
Route: /auth/otp
Access: public (guest only)

Description: Enter 6-digit OTP code

Layout:
  - Header: Header-Back, title "Verification"
  - Body: centered, padded horizontal xl
  - Footer: none

UI elements:
  - Text "Code sent to {email}" (body, centered)
  - 6 separate digit inputs (48x48, gap sm, auto-focus next, auto-submit on 6th digit)
  - Button primary "Verify" (margin-top lg)
  - Text link "Resend code" (caption, disabled 60s, shows countdown)

Acceptance Criteria:
  - [ ] User sees "Code sent to {email}" with correct email displayed
  - [ ] User enters 6 digits → auto-submits on 6th digit
  - [ ] Wrong code → all inputs turn error red + "Wrong code" message
  - [ ] "Resend code" link disabled for 60s with countdown timer
  - [ ] Existing client → navigates to ClientDashboard
  - [ ] Existing specialist → navigates to SpecialistDashboard
  - [ ] New user → sees role choice: "I need help" / "I'm a specialist"

States:
  - Idle: waiting for input
  - Verifying: button spinner
  - Error: all inputs border error + "Wrong code"
  - Resending: "Resend in 45s" countdown

Post-verify routing (by role):
  - Existing client → ClientDashboard
  - Existing specialist → SpecialistDashboard
  - New user (no role) → can choose path:
    - "I need help" → becomes client → MyRequestsNew
    - "I'm a specialist" → OnboardingName (step 1/3)

Data: POST /api/auth/verify-otp {email, code}
Response: {accessToken, refreshToken, user: {id, email, role, firstName, lastName}}

Dependencies: AuthEmail (passes email param)

---

### ONBOARDING (specialist, 3 steps)

---
**Screen: OnboardingName**
Status: TODO
Route: /onboarding/name
Access: specialist (new, step 1/3)

Description: Enter first and last name

Layout:
  - Header: none (step indicator 1/3 at top)
  - Body: centered, padded horizontal xl
  - Footer: none

UI elements:
  - Step indicator: "Step 1 of 3" (caption)
  - Title "Your Name" (h1)
  - Input "First name" (required, 2-50 chars)
  - Input "Last name" (required, 2-50 chars)
  - Checkbox "I accept Terms of Use" with link → TermsScreen (required, disables Next if unchecked)
  - Button primary "Next" (disabled until valid + checkbox checked)

Acceptance Criteria:
  - [ ] Step indicator shows "Step 1 of 3"
  - [ ] "Next" button disabled until first name (2+ chars), last name (2+ chars), and checkbox checked
  - [ ] User fills valid data + checks checkbox → "Next" navigates to /onboarding/work-area
  - [ ] Terms link opens TermsScreen

States:
  - Idle: form ready
  - Submitting: button spinner
  - Error: inline validation on fields / server error toast

Data: PUT /api/onboarding/name {firstName, lastName}

Dependencies: AuthOTP

---
**Screen: OnboardingWorkArea**
Status: TODO
Route: /onboarding/work-area
Access: specialist (new, step 2/3)

Description: Select cities, FNS offices, and services

Layout:
  - Header: Header-Back (to step 1), step indicator 2/3
  - Body: scroll
  - Footer: sticky Button primary "Next" (disabled until min 1 FNS + 1 service)

UI elements:
  - Title "Work Area" (h1)
  - "+ Add City" button → dropdown of cities
  - For each selected city → expandable section with FNS offices (multiselect)
  - For each selected FNS → 3 checkboxes (min 1 required):
    - Inspection
    - Audit
    - Operational Control
  - Selected FNS shown as chips, grouped by city
  - If >10 chips → "Show all" collapse
  - "x" on chip removes FNS

Acceptance Criteria:
  - [ ] Step indicator shows "Step 2 of 3"
  - [ ] User clicks "+ Add City" → city dropdown appears
  - [ ] After city selected → FNS offices load for that city
  - [ ] User selects FNS → 3 service checkboxes appear (must select min 1)
  - [ ] "Next" disabled until at least 1 FNS + 1 service selected
  - [ ] Selected FNS shown as chips, "x" removes them

States:
  - Idle: form with city selector
  - Loading: cities/FNS loading from API
  - Error: server error toast

Cascade logic:
  - City not selected → FNS disabled
  - City selected → load GET /api/fns?city_id=X → fill FNS list
  - City changed → reset selected FNS for that city

Data:
  - GET /api/cities
  - GET /api/fns?city_id=X
  - PUT /api/onboarding/work-area {fnsServices: [{fnsId, serviceIds: [1,2]}]}

Dependencies: OnboardingName

---
**Screen: OnboardingProfile**
Status: TODO
Route: /onboarding/profile
Access: specialist (new, step 3/3)

Description: Optional profile info (avatar, contacts, description)

Layout:
  - Header: Header-Back (to step 2), step indicator 3/3
  - Body: scroll form
  - Footer: sticky Button primary "Complete"

UI elements:
  - Avatar upload area (tap → image picker, preview circle lg)
  - Textarea "About me" (optional, max 1000 chars, counter)
  - Input "Phone" (optional, mask +7XXXXXXXXXX)
  - Input "Telegram" (optional, @username)
  - Input "WhatsApp" (optional, +7XXXXXXXXXX)
  - Input "Office address" (optional, max 200 chars)
  - Input "Working hours" (optional, max 100 chars, e.g. "Mon-Fri 9:00-18:00")
  - Note: all contacts are PUBLIC
  - Button primary "Complete" (always enabled — all fields optional)

Acceptance Criteria:
  - [ ] Step indicator shows "Step 3 of 3"
  - [ ] All fields optional — "Complete" button always enabled
  - [ ] User taps avatar area → image picker opens
  - [ ] User clicks "Complete" → navigates to SpecialistDashboard
  - [ ] Phone input has +7 mask

States:
  - Idle: form ready
  - Uploading: avatar upload progress
  - Error: upload error / server error toast

Data:
  - POST /api/uploads/avatar (multipart) → {url}
  - PUT /api/onboarding/profile {avatar, description, phone, telegram, whatsapp, officeAddress, workingHours}

Business rules:
  - All fields optional — skip doesn't block onboarding
  - Avatar: server resizes to 400x400
  - After submit → specialist is active → SpecialistDashboard

Dependencies: OnboardingWorkArea

---

### CLIENT TABS

---
**Screen: ClientDashboard**
Status: TODO
Route: /(client-tabs)/dashboard
Access: auth required, role: client

Description: Client home — stats + recent requests

Layout:
  - Header: Header-Home (app name left, settings gear right → ClientSettings)
  - Body: scroll
  - Footer: TabBar (Dashboard active)

UI elements:
  - Stats card: "X of 5 requests used" (progress indicator)
  - Button "Create Request" (primary, disabled at limit) → MyRequestsNew
  - Section "My Requests" (last 3): cards with title, status badge, date
    - Card tap → MyRequestDetail
  - Link "View all requests" → MyRequests tab
  - Section "New messages": count badge if unread threads exist

Acceptance Criteria:
  - [ ] Client sees "X of 5 requests used" with progress indicator
  - [ ] "Create Request" button navigates to /requests/new
  - [ ] At limit (5/5) → "Create Request" button disabled + "Request limit reached"
  - [ ] Last 3 requests displayed as cards, tap → MyRequestDetail
  - [ ] Unread messages count badge visible if unread > 0

States:
  - Loading: skeleton stats + cards
  - Empty: "Create your first request" CTA
  - Populated: stats + request list
  - Error: error + Retry

Data:
  - GET /api/dashboard/stats → {requestsUsed, requestsLimit, unreadMessages}
  - GET /api/requests?limit=3 → [{id, title, status, threadsCount, createdAt}]

Dependencies: none

---
**Screen: MyRequests**
Status: TODO
Route: /(client-tabs)/requests
Access: auth required, role: client

Description: All client's requests

Layout:
  - Header: Header-Home, title "My Requests"
  - Body: vertical list
  - Footer: TabBar (Requests active)

UI elements:
  - Request card: title (h3), status badge (active/closing_soon/closed), city+FNS (caption), date (caption)
  - Card tap → MyRequestDetail
  - Swipe left on active/closing_soon → "Close" button (red) → confirm → PATCH status:closed
  - After close: card animates out + toast "Request closed"
  - Button "Create Request" (floating or header) → MyRequestsNew
  - Sort: newest first (default)
  - Empty state: "No requests yet" CTA → MyRequestsNew
  - Pull-to-refresh

Acceptance Criteria:
  - [ ] Client sees all their requests sorted newest first
  - [ ] Request card shows title, status badge, city+FNS, date
  - [ ] Tap card → navigates to /requests/[id]/detail
  - [ ] Swipe left on active request → "Close" button appears → confirm → request closed + toast
  - [ ] Empty state shows "No requests yet" with CTA to create
  - [ ] Pull-to-refresh reloads list

States:
  - Loading: skeleton cards
  - Empty: illustration + CTA
  - Populated: list
  - Error: error + Retry

Data: GET /api/requests
Response: [{id, title, status, city, fns, service, threadsCount, createdAt}]

Dependencies: none

---
**Screen: MyRequestsNew**
Status: TODO
Route: /requests/new
Access: auth required, role: client

Description: Create a new request

Layout:
  - Header: Header-Back, title "New Request"
  - Body: scroll form
  - Footer: sticky Button primary "Publish"

UI elements:
  - Input "Title" (required, 3-100 chars)
  - Select "City" (required, from /api/cities)
  - Select "FNS" (required, cascade from city, disabled until city chosen)
  - Textarea "Description" (required, 10-2000 chars, counter)
  - File upload area: "+" button, thumbnails grid (max 5 files, pdf/jpg/png, max 10MB each)
  - Button primary "Publish" (sticky bottom)

Acceptance Criteria:
  - [ ] Form shows: title, city select, FNS select (disabled until city), description, file upload
  - [ ] FNS enables after city selected; resets when city changes
  - [ ] "Publish" disabled until all required fields valid (title 3+, description 10+, city, FNS)
  - [ ] File upload accepts pdf/jpg/png up to 10MB, max 5 files, shows thumbnails
  - [ ] Submit → navigates to MyRequestDetail + "Published!" toast
  - [ ] At request limit → "Publish" disabled + "Request limit reached" message

States:
  - Idle: empty form
  - Saving: button spinner, form disabled
  - Error: inline field errors + form data preserved
  - Success: navigate to MyRequestDetail + toast "Published!"

Cascade: city not selected → FNS disabled. City selected → load FNS. City changed → reset FNS.

Data:
  - GET /api/cities, GET /api/fns?city_id=X
  - POST /api/uploads/documents (multipart) → [{url}]
  - POST /api/requests {title, cityId, fnsId, description, files[]}
Response: {id, ...request}

Business rules:
  - Limit: 5 requests lifetime per client (configurable by admin)
  - At limit → button disabled + "Request limit reached" message
  - No moderation — published immediately

Dependencies: ClientDashboard, MyRequests

---
**Screen: MyRequestDetail**
Status: TODO
Route: /requests/[id]/detail
Access: auth required, role: client (owner)

Description: Client's own request details

Layout:
  - Header: Header-Back, title = request title, right: delete icon (trash)
  - Body: scroll
  - Footer: none

UI elements:
  - Status badge: active (success) / closing_soon (warning) / closed (muted)
  - City + FNS (chips), Service (chip)
  - Description (body, full text)
  - Attached files: list with filename + size, tap to download
  - Counter: "X specialists wrote to you" → tap → MessagesGrouped
  - Button "Messages (X)" (primary) → MessagesGrouped
  - [closing_soon] Button "Extend" → POST /api/requests/:id/extend (max 3 extensions)
  - Section "Recommended specialists": matching city/fns/service, is_available=true
    - Specialist card tap → SpecialistPublicProfile
  - Delete: tap trash → confirm → DELETE /api/requests/:id → navigate back

Acceptance Criteria:
  - [ ] Client sees full request: status badge, city+FNS, description, attached files
  - [ ] "Messages (X)" button navigates to /requests/[id]/messages
  - [ ] Trash icon → confirm dialog → request deleted → navigates back
  - [ ] Closing_soon status shows "Extend" button (max 3 extensions)
  - [ ] Recommended specialists section shows matching specialists
  - [ ] File tap → file downloads

States:
  - Loading: skeleton
  - Loaded: all data
  - Error: "Request not found" / error + back

Data:
  - GET /api/requests/:id → {id, title, status, city, fns, service, description, files[], threadsCount, extensionsCount, createdAt}
  - GET /api/threads?request_id=:id (count)

Dependencies: MyRequests, ClientDashboard

---
**Screen: MessagesGrouped**
Status: TODO
Route: /requests/[id]/messages
Access: auth required, role: client

Description: Client's threads for a specific request, grouped

Layout:
  - Header: Header-Back, title "Messages"
  - Body: vertical list
  - Footer: none

UI elements:
  - Section header per request (if opened from Messages tab — grouped by request)
  - Thread preview card:
    - Avatar (sm) of specialist
    - Specialist name (h3)
    - Last message preview (caption, truncated 60 chars)
    - Unread badge (if client_last_read_at < last_message_at)
    - Timestamp (caption, "15 min ago" / "yesterday" / "01.04")
  - Card tap → ChatThread
  - Empty state: "No messages from specialists yet"
  - Pull-to-refresh

Acceptance Criteria:
  - [ ] Client sees list of threads for this request
  - [ ] Thread card shows specialist avatar, name, last message preview, timestamp
  - [ ] Unread badge visible if unread messages exist
  - [ ] Tap thread → navigates to /threads/[id]
  - [ ] Empty state: "No messages from specialists yet"

States:
  - Loading: skeleton rows
  - Empty: illustration + text
  - Populated: grouped thread list
  - Error: error + Retry

Data: GET /api/threads?request_id=:id (or GET /api/threads?grouped_by=request for all)
Response: [{threadId, specialist: {id, name, avatar}, lastMessage, unreadCount, lastMessageAt}]

Dependencies: MyRequestDetail

---
**Screen: ClientMessages**
Status: TODO
Route: /(client-tabs)/messages
Access: auth required, role: client

Description: All client's threads (across all requests)

Layout:
  - Header: Header-Home, title "Messages"
  - Body: vertical list
  - Footer: TabBar (Messages active)

UI elements:
  - Thread row: avatar (sm), specialist name (h3), last message preview (caption 1-line truncate), time (caption right)
  - Unread: badge on avatar, name bold, message bold
  - Card tap → ChatThread
  - Sort: by last_message_at (newest first)
  - Empty state: "No messages yet"
  - Pull-to-refresh

Acceptance Criteria:
  - [ ] Client sees all threads across all requests
  - [ ] Sorted by last message time (newest first)
  - [ ] Unread threads show bold name + message + badge on avatar
  - [ ] Tap thread → navigates to /threads/[id]
  - [ ] Empty state: "No messages yet" with CTA "Browse specialists"

States:
  - Loading: skeleton rows
  - Empty: illustration + CTA "Browse specialists"
  - Populated: thread list
  - Error: error + Retry

Data: GET /api/threads
Response: [{id, specialist: {id, name, avatar}, request: {id, title}, lastMessage, unreadCount, lastMessageAt}]

Business rules:
  - Thread appears instantly when specialist sends first message (no accept step)

Dependencies: none

---
**Screen: ClientSettings**
Status: TODO
Route: /settings/client
Access: auth required, role: client

Description: Client profile settings

Layout:
  - Header: Header-Back, title "Settings"
  - Body: scroll form
  - Footer: none

UI elements:
  - Avatar (lg, centered, tap → ImagePicker)
  - Input "First name" (editable)
  - Input "Last name" (editable)
  - Email (displayed, readonly)
  - Role badge "Client" (readonly)
  - Button primary "Save"
  - Divider
  - Section "Notifications": toggle "New messages" (email), toggle "Auto-close warnings" (always on)
  - Divider
  - Link "Terms of Use" → TermsScreen
  - Button danger "Sign Out" → confirm → clear tokens → LandingScreen
  - App version (small, bottom)

Acceptance Criteria:
  - [ ] Form prefilled with current data (avatar, first/last name, email readonly)
  - [ ] "Save" updates profile → toast "Saved"
  - [ ] Notification toggles save on change
  - [ ] "Sign Out" → confirm → clears tokens → navigates to Landing
  - [ ] App version visible at bottom

States:
  - Loaded: form prefilled
  - Saving: button spinner
  - Error: inline errors / toast

Data:
  - GET /api/user/me (prefill)
  - PATCH /api/user/profile {firstName, lastName, avatar}
  - PATCH /api/user/notification-settings {new_messages: bool}
  - POST /api/auth/logout

Dependencies: ClientDashboard

---

### SPECIALIST TABS

---
**Screen: SpecialistDashboard**
Status: TODO
Route: /(specialist-tabs)/dashboard
Access: auth required, role: specialist

Description: Specialist home — matching requests feed

Layout:
  - Header: Header-Home (app name left, settings gear right → SpecialistSettings)
  - Body: scroll
  - Footer: TabBar (Dashboard active)

UI elements:
  - [is_available=false] Banner: "You're in standby mode" (warning bg, link to toggle in settings)
  - Stats: total threads count, new messages count
  - Request cards (matching specialist's city/fns/services):
    - Title (h3), city+FNS (chips), service (chip), description truncated
    - Button "Write" → SpecialistConfirmWrite
    - Badge "You already wrote" if thread exists → button changes to "Open Chat" → ChatThread
    - Badge "Not your region" (muted) for cross-city requests
  - CLOSED requests not shown
  - Link "My Threads" → SpecialistMyThreads
  - Pull-to-refresh

Acceptance Criteria:
  - [ ] Shows matching requests (specialist's city/fns/services)
  - [ ] is_available=false → warning banner "You're in standby mode"
  - [ ] Request card with "Write" button → navigates to /requests/[id]/write
  - [ ] Request with existing thread shows "Open Chat" instead → navigates to /threads/[id]
  - [ ] Closed requests not shown
  - [ ] Stats visible: total threads, new messages

States:
  - Loading: skeleton stats + cards
  - Empty: "No matching requests yet" + CTA "Expand your work area"
  - Populated: stats + request list
  - Error: error + Retry

Data:
  - GET /api/specialist/stats → {threadsTotal, newMessages}
  - GET /api/specialist/requests → [{id, title, city, fns, service, description, hasThread, threadId}]

Dependencies: none

---
**Screen: SpecialistConfirmWrite**
Status: TODO
Route: /requests/[id]/write (modal)
Access: auth required, role: specialist

Description: Confirm modal before starting a thread with client

Layout:
  - Header: Header-Back, title "Write to Client"
  - Body: scroll
  - Footer: sticky Button primary "Send"

UI elements:
  - Request summary (read-only): title, city+FNS (chips), service (chip), description (2-3 lines truncated)
  - Textarea "Your message" (required, 10-1000 chars, counter, placeholder "Hello! I can help with...")
  - Button primary "Send" (disabled until 10+ chars)
  - Button secondary "Cancel" (back)

**NOT in UI:** no price field, no deadline/DatePicker, no separate comment, no Accept/Reject

Acceptance Criteria:
  - [ ] Request summary (title, city, FNS, service, description) visible read-only
  - [ ] "Send" disabled until message has 10+ characters
  - [ ] Submit → thread created → navigates to ChatThread
  - [ ] 409 (thread exists) → redirects to existing thread
  - [ ] 429 (rate limit) → "Limit 20 messages per day" error

States:
  - Loading: skeleton request summary
  - Idle: form ready
  - Submitting: button spinner
  - Error:
    - 409 (request closed): "Request closed" + back
    - 409 (thread exists): redirect to existing thread
    - 429 (rate limit 20/day): "Limit 20 messages per day. Try tomorrow." + back
    - 500: general error + retry

Data:
  - GET /api/requests/:id (summary)
  - POST /api/threads {requestId, firstMessage}
Response: {threadId}
Then redirect → ChatThread

Business rules:
  - One thread per pair (request_id, specialist_id) — UNIQUE
  - Repeat click "Write" on same request → redirects to existing thread (modal doesn't open)
  - Rate limit: 20 new threads per day per specialist

Dependencies: SpecialistDashboard, PublicRequestsFeed

---
**Screen: SpecialistMyThreads**
Status: TODO
Route: /(specialist-tabs)/threads
Access: auth required, role: specialist

Description: All specialist's threads

Layout:
  - Header: Header-Home, title "My Threads"
  - Body: filter chips + vertical list
  - Footer: TabBar (My Threads active)

UI elements:
  - Filter chips: All | Unread
  - Thread card:
    - Request title (truncated, tappable)
    - Client firstName (or "Client")
    - Last message preview (60 chars)
    - Unread badge (if specialist_last_read_at < last_message_at)
    - Timestamp last_message_at
    - Badge "Request closed" if request.status=closed
  - Card tap → ChatThread
  - Empty state: "You haven't written to any clients yet" + CTA → PublicRequestsFeed
  - Pull-to-refresh

Acceptance Criteria:
  - [ ] All specialist's threads listed
  - [ ] Filter chips: All | Unread
  - [ ] Thread card: request title, client name, last message, timestamp, unread badge
  - [ ] Closed request → "Request closed" badge on thread
  - [ ] Tap thread → navigates to /threads/[id]
  - [ ] Empty state with CTA → PublicRequestsFeed

States:
  - Loading: skeleton rows
  - Empty: illustration + CTA
  - Populated: filtered list
  - Error: error + Retry

Data: GET /api/threads
Response: [{id, request: {id, title, status}, client: {firstName}, lastMessage, unreadCount, lastMessageAt}]

Business rules:
  - Cannot "deactivate" thread — just stop writing
  - Closed request → thread is read-only

Dependencies: none

---
**Screen: SpecialistSettings**
Status: TODO
Route: /settings/specialist
Access: auth required, role: specialist

Description: Specialist profile editing

Layout:
  - Header: Header-Back, title "Settings"
  - Body: scroll form
  - Footer: none

UI elements:
  - Avatar (lg, tap → ImagePicker, upload immediately)
  - Input "First name" (required, 2-50 chars)
  - Input "Last name" (required, 2-50 chars)
  - FNS multiselect (chips, search by name, max 210)
  - Services multiselect (3 checkboxes per FNS, min 1 each)
  - Input "Phone" (+7 mask)
  - Input "Telegram" (@username)
  - Input "WhatsApp" (+7 mask)
  - Input "Office address"
  - Input "Working hours"
  - Toggle "Available for requests" (is_available) — instant PATCH, no Save needed
  - Button primary "Save"
  - Divider
  - Section "Notifications": toggles email preferences
  - Divider
  - Button danger "Sign Out" → confirm → clear tokens → LandingScreen

Acceptance Criteria:
  - [ ] Form prefilled with current profile data
  - [ ] is_available toggle saves instantly (no Save button needed)
  - [ ] FNS multiselect with service checkboxes per FNS
  - [ ] "Save" updates profile → toast
  - [ ] "Sign Out" → confirm → clear tokens → Landing

States:
  - Loaded: form prefilled from profile
  - Saving: button spinner
  - Error: inline errors / toast

Data:
  - GET /api/specialist/profile (prefill)
  - PATCH /api/specialist/profile {firstName, lastName, fnsServices, phone, telegram, whatsapp, officeAddress, workingHours}
  - PATCH /api/specialist/profile {isAvailable: bool} (instant toggle)
  - POST /api/uploads/avatar → {url}
  - POST /api/auth/logout

Dependencies: SpecialistPublicProfile (own profile), SpecialistDashboard

---

### SHARED

---
**Screen: ChatThread**
Status: TODO
Route: /threads/[id]
Access: auth required, role: client + specialist (thread participants only)

Description: Chat between client and specialist about a request

Layout:
  - Header: Header-Back, title = other participant's name
  - Body: messages list (scroll, newest at bottom)
  - Footer: message input bar (text input + attach button + send button)

UI elements:
  - Message bubbles: own (right, primary bg) / other (left, surface bg)
  - Each bubble: text (body), time (small), read receipts (sent/delivered/read checkmarks)
  - Images: inline thumbnail (200x200), tap → fullscreen viewer (zoom, swipe, download)
  - Files: icon + filename + size, tap → download
  - Typing indicator: "typing..." with dots animation (via WebSocket)
  - Online status: green dot on avatar in header
  - Input bar: text input, "+" for attachments (max 3 per message, pdf/jpg/png, 10MB), send button
  - [request closed] Input disabled, banner: "Request closed. Chat is read-only."
  - Auto-scroll to latest message on open
  - Mark as read on open: PATCH /api/threads/:id/read

Acceptance Criteria:
  - [ ] Messages display: own messages right (primary bg), other's left (surface bg)
  - [ ] User types message + taps send → message appears in thread
  - [ ] Attach files (max 3, pdf/jpg/png, 10MB) → send with message
  - [ ] Image attachments show inline thumbnail → tap opens fullscreen viewer
  - [ ] Auto-scroll to newest message on open
  - [ ] Request closed → input disabled + "Chat is read-only" banner
  - [ ] Typing indicator shows when other participant is typing

States:
  - Loading: skeleton bubbles
  - Populated: messages rendered, input active
  - Error: error + Retry

Data:
  - GET /api/threads/:id/messages → [{id, senderId, text, files[], createdAt, readAt}]
  - POST /api/threads/:id/messages {text, files[]}
  - PATCH /api/threads/:id/read
  - WebSocket: typing events, new message events, presence

Business rules:
  - Thread created atomically on first POST /api/threads (with first message)
  - Participants: client (request owner) + specialist. UNIQUE(request_id, specialist_id)
  - Request CLOSED → input blocked, POST /messages → 422

Notifications triggered:
  - NEW_MESSAGE → email to other participant

Dependencies: ClientMessages, MessagesGrouped, SpecialistMyThreads

---
**Screen: TermsScreen**
Status: TODO
Route: /terms (modal)
Access: public

Description: Terms of use (static content)

Layout:
  - Header: Header-Back, title "Terms of Use", close button (x)
  - Body: WebView / scroll with rendered content
  - Footer: none

Acceptance Criteria:
  - [ ] Opens as modal with close button (x)
  - [ ] Static content scrollable
  - [ ] Back/close returns to previous screen

UI elements:
  - Static content (HTML/markdown)
  - Scroll

Data: GET /api/content/terms (or static file)

Dependencies: AuthEmail, OnboardingName, ClientSettings, SpecialistSettings

---

### ADMIN

---
**Screen: AdminDashboard**
Status: TODO
Route: /(admin-tabs)/dashboard
Access: auth required, role: admin

Description: Admin overview with stats

Layout:
  - Header: Header-Home, title "Admin", right: settings gear → AdminSettings
  - Body: scroll
  - Footer: TabBar (Dashboard active)

UI elements:
  - Stats grid:
    - Active requests (number, tap → AdminModeration)
    - New users this week/month
    - Threads this week/month
    - Registrations chart (line graph)
    - Geography (top cities)
    - Conversion: request → thread
    - Top specialists by threads
  - Each metric tappable → relevant section

Acceptance Criteria:
  - [ ] Stats grid: active requests, new users, threads, registrations chart, geography, conversion, top specialists
  - [ ] Each stat tappable → navigates to relevant section
  - [ ] Settings gear → navigates to /admin/settings

States:
  - Loading: skeleton stats
  - Populated: all metrics rendered
  - Error: error + Retry

Data: GET /api/admin/stats

Dependencies: none (admin root)

---
**Screen: AdminUsers**
Status: TODO
Route: /(admin-tabs)/users
Access: auth required, role: admin

Description: User management — search, view, ban

Layout:
  - Header: Header-Search (search bar)
  - Body: filter chips + vertical list (infinite scroll)
  - Footer: TabBar (Users active)

UI elements:
  - Search bar: by email/name, debounce 300ms
  - Filter chips: All | Clients | Specialists | Banned
  - User row: avatar (sm), firstName+lastName + email (truncated), role badge, status badge, registration date
  - Row tap → expand inline details:
    - Full info
    - Button "Ban" / "Unban" → confirm alert
    - Button "Edit" → inline edit fields
    - Button "Force close all requests" (for clients)
  - Pagination: 20/page infinite scroll

Acceptance Criteria:
  - [ ] Search by email/name with debounce
  - [ ] Filter chips: All | Clients | Specialists | Banned
  - [ ] Tap user row → expands with details + Ban/Unban/Edit buttons
  - [ ] Ban user → confirm → user marked banned
  - [ ] Infinite scroll (20/page)

States:
  - Loading: skeleton rows
  - Populated: user list
  - Error: error + Retry

Data:
  - GET /api/admin/users?q=X&role=Y&page=1&limit=20
  - PATCH /api/admin/users/:id {isBanned: true/false}
  - PATCH /api/admin/users/:id {firstName, lastName, ...}
  - POST /api/admin/users/:id/close-all-requests

Business rules:
  - Banned user cannot login, sees "Account blocked"
  - Admin can edit any user's data
  - Admin can force-close any request

Dependencies: AdminDashboard

---
**Screen: AdminModeration**
Status: TODO
Route: /(admin-tabs)/moderation
Access: auth required, role: admin

Description: Content moderation queue (reserved for future, empty in MVP)

Layout:
  - Header: Header-Home, title "Moderation"
  - Body: list
  - Footer: TabBar (Moderation active)

Acceptance Criteria:
  - [ ] MVP: always shows "All clear" empty state
  - [ ] Queue structure ready for future items with Approve/Reject buttons

UI elements:
  - Queue items with Approve/Reject buttons
  - Empty state: "All clear" (MVP: always empty, no moderation)

States:
  - Loading: skeleton
  - Empty: "All clear"
  - Populated: queue items
  - Error: error + Retry

Data: GET /api/admin/moderation/queue

Business rules:
  - MVP: no moderation, instant publish. Screen reserved for future.

Dependencies: AdminDashboard

---
**Screen: AdminSettings**
Status: TODO
Route: /admin/settings
Access: auth required, role: admin

Description: System-wide settings

Layout:
  - Header: Header-Back, title "Settings"
  - Body: scroll form
  - Footer: none

UI elements:
  - Input "Max requests per client" (number, default 5)
  - Input "Max threads per request" (number, default 10)
  - Input "Auto-close days" (number, default 30)
  - Input "Max extensions" (number, default 3)
  - Input "Close warning days" (number, default 3)
  - Input "Max file size MB" (number, default 10)
  - Input "Max files per message" (number, default 5)
  - Each with label + current value from DB
  - Button primary "Save" → toast "Saved"

Acceptance Criteria:
  - [ ] All configurable values shown with current DB values
  - [ ] Edit values + "Save" → toast "Saved"
  - [ ] Fields: max requests/client, max threads/request, auto-close days, max extensions, close warning days, max file size, max files/message

States:
  - Loaded: values from DB
  - Saving: button spinner
  - Error: validation / server error

Data:
  - GET /api/admin/settings
  - PATCH /api/admin/settings {key: value, ...}

Business rules:
  - Changes apply immediately to new requests
  - Existing requests NOT recalculated

Dependencies: AdminDashboard

---

## Navigation Map

```
GUEST:
  Landing → AuthEmail → AuthOTP → [role routing]
  Landing → PublicRequestsFeed → PublicRequestDetail
  Landing → SpecialistsCatalog → SpecialistPublicProfile

CLIENT (after auth):
  TabBar: Dashboard | My Requests | Messages

  ClientDashboard → MyRequestsNew → MyRequestDetail
  ClientDashboard → ClientSettings
  MyRequests → MyRequestDetail → MessagesGrouped → ChatThread
  ClientMessages → ChatThread
  MyRequestDetail → SpecialistPublicProfile

SPECIALIST (after onboarding):
  TabBar: Dashboard | Public Requests | My Threads

  SpecialistDashboard → SpecialistConfirmWrite → ChatThread
  SpecialistDashboard → SpecialistSettings
  PublicRequestsFeed → PublicRequestDetail → SpecialistConfirmWrite → ChatThread
  SpecialistMyThreads → ChatThread
  SpecialistPublicProfile → SpecialistSettings

ADMIN:
  TabBar: Dashboard | Users | Moderation

  AdminDashboard → AdminSettings
  AdminDashboard → AdminUsers
  AdminDashboard → AdminModeration
```

## Access Matrix

| Screen | guest | client | specialist | admin |
|--------|-------|--------|------------|-------|
| Landing | yes | yes | yes | yes |
| PublicRequestsFeed | yes | yes | yes | yes |
| PublicRequestDetail | yes | yes | yes | yes |
| SpecialistsCatalog | yes | yes | yes | yes |
| SpecialistPublicProfile | yes | yes | yes | yes |
| TermsScreen | yes | yes | yes | yes |
| AuthEmail | yes | redirect | redirect | redirect |
| AuthOTP | yes | redirect | redirect | redirect |
| OnboardingName | - | - | new only | - |
| OnboardingWorkArea | - | - | new only | - |
| OnboardingProfile | - | - | new only | - |
| ClientDashboard | - | yes | - | - |
| MyRequests | - | yes | - | - |
| MyRequestsNew | - | yes | - | - |
| MyRequestDetail | - | owner | - | - |
| MessagesGrouped | - | owner | - | - |
| ClientMessages | - | yes | - | - |
| ClientSettings | - | yes | - | - |
| SpecialistDashboard | - | - | yes | - |
| SpecialistConfirmWrite | - | - | yes | - |
| SpecialistMyThreads | - | - | yes | - |
| SpecialistSettings | - | - | yes | - |
| ChatThread | - | participant | participant | - |
| AdminDashboard | - | - | - | yes |
| AdminUsers | - | - | - | yes |
| AdminModeration | - | - | - | yes |
| AdminSettings | - | - | - | yes |

## Data Model (from SA)

| Table | Key fields |
|-------|-----------|
| users | id, email, role, first_name, last_name, is_available, is_banned |
| specialist_profiles | user_id, description, avatar_url, phone, telegram, whatsapp, office_address, working_hours |
| specialist_fns | specialist_id, fns_id (many-to-many) |
| specialist_services | specialist_id, fns_id, service_id |
| cities | id, name (seeded) |
| fns_offices | id, city_id, name, code (seeded) |
| services | id, name (3 rows: Inspection, Audit, Operational Control) |
| requests | id, user_id, title, city_id, fns_id, description, status (active/closing_soon/closed), last_activity_at, extensions_count |
| threads | id, request_id, client_id, specialist_id, last_message_at, client_last_read_at, specialist_last_read_at |
| messages | id, thread_id, sender_id, text, created_at |
| files | id, entity_type, entity_id, url, filename, size, mime_type |
| settings | key, value (admin-configurable limits) |

Unique indexes: specialist_fns(specialist_id, fns_id), threads(request_id, specialist_id)

## Business Rules Summary

- **Monetization:** MVP is 100% FREE. No payments, no subscriptions, no commissions.
- **Request lifecycle:** active → closing_soon (<=3 days) → closed (auto 30 days no activity or manual). Max 3 extensions. Reopening impossible, but "Create similar" copies data.
- **Thread = first message:** No Response entity. Specialist writes first message → thread created atomically. No Accept/Reject step.
- **Rate limits:** 5 requests lifetime per client, 20 new threads per day per specialist (configurable by admin).
- **Notifications:** MVP email only (no push). Events: new thread, new message, closing warning (3 days), request closed.
- **Files:** MinIO storage. Avatar 5MB jpg/png/webp → resize 400x400. Documents 10MB pdf/jpg/png max 5. Chat attachments 10MB max 3 per message.
- **Contacts:** Specialist contacts (phone, telegram, whatsapp, address, hours) are PUBLIC — visible to everyone including guests.
