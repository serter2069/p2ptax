# P2PTax Codebase Structure Audit

**Date:** 2026-04-30  
**Branch:** development  
**Scope:** `components/`, `app/` — read-only analysis

---

## 1. Numbers at a Glance

| Metric | Count |
|---|---|
| Total component files (`components/**/*.tsx`) | 115 |
| Total route files (`app/**/*.tsx`, excl. layouts) | 36 |
| Layout files (`_layout.tsx`) | 3 |
| **DEAD components** (0 inbound imports) | **36** |
| LOW-USE components (1–2 imports) | 61 |
| CORE components (5+ imports) | 18 |
| Redirect-only tab files | 4 |
| Duplicate header families | 5 distinct families |
| `/api/cities` fetch sites | 7 (should be 1 hook) |
| Raw `TextInput` outside `ui/Input` | 31 occurrences |
| `if (!isAuthenticated)` inline guards | 9 sites (should be 1 hook) |
| Parallel `components/chat/` module (entire dir unused) | 3 files + 1 index |
| Parallel file-upload implementations | 3 separate components |
| OTP fetch duplicated | 3 sites |

---

## 2. Components Inventory Table

Sorted by LOC descending. **DEAD** = 0 imports from outside the file itself. **LOW** = 1–2. **CORE** = 5+.

| LOC | File | Status | Import Count | Notes |
|---|---|---|---|---|
| 838 | `components/filters/CityFnsCascade.tsx` | CORE | 7 | City→FNS cascade; large but well-used |
| 836 | `components/InlineChatView.tsx` | LOW | 2 | Used in `threads/[id]` + `requests/[id]/messages` |
| 683 | `components/ui/FileUploadZone.tsx` | LOW | 2 | Used in `requests/[id]/write` + `ChatComposer` |
| 569 | `components/specialists/SpecialistFeed.tsx` | LOW | 2 | Used in `specialists/index` + `saved-specialists/index` |
| 513 | `components/specialists/SpecialistsGrid.tsx` | LOW | 1 | Used only inside `SpecialistFeed` |
| 472 | `components/requests/RequestsFeed.tsx` | LOW | 3 | `(tabs)/requests`, `(tabs)/my-requests`, `requests/index` |
| 467 | `components/layout/AppHeader.tsx` | **DEAD** | **0** | Imported nowhere in main source. shouldShowAppHeader also unused |
| 441 | `components/requests/FileDropZone.tsx` | **DEAD** | **0** | No importer in main source |
| 383 | `components/dashboard/CaseTimeline.tsx` | **DEAD** | **0** | Exported via barrel; never consumed |
| 374 | `components/landing/HeroBlock.tsx` | LOW | 1 | `app/index` only |
| 346 | `components/layout/MobileDrawer.tsx` | **DEAD** | **0** | Mentioned in `_layout.tsx` comment but never imported |
| 319 | `components/SpecialistCard.tsx` | **DEAD** | **0** | Root-level card; superseded by `SpecialistsGrid.DesktopSpecialistRow` |
| 313 | `components/filters/SpecialistSearchBar.tsx` | **DEAD** | **0** | No importer anywhere in main source |
| 313 | `components/files/Lightbox.tsx` | LOW | 1 | `InlineChatView` only |
| 311 | `components/layout/SidebarNav.tsx` | LOW | 2 | `AppShell` + `AppHeader` (AppHeader is dead, so effectively 1) |
| 290 | `components/settings/ProfileTab.tsx` | LOW | 1 | `settings/index` |
| 266 | `components/settings/InlineWorkArea.tsx` | LOW | 1 | `settings/index` |
| 260 | `components/settings/AvatarUploader.tsx` | LOW | 1 | `settings/ProfileTab` |
| 247 | `components/requests/InlineOtpFlow.tsx` | LOW | 1 | `requests/new` |
| 236 | `components/settings/ContactMethodsList.tsx` | LOW | 2 | `settings/ProfileTab` + `settings/specialist/ContactsSection` |
| 235 | `components/dashboard/RecentWinsStrip.tsx` | **DEAD** | **0** | Barrel-exported; zero consumers in app/ |
| 222 | `components/requests/detail/RequestActions.tsx` | **DEAD** | **0** | Refactored out; only `types.ts` is still used |
| 216 | `components/ChatComposer.tsx` | LOW | 2 | `InlineChatView` + `requests/detail/RequestSpecialists` |
| 215 | `components/messages/ThreadCard.tsx` | LOW | 1 | `(tabs)/messages` |
| 213 | `components/layout/DesktopScreen.tsx` | CORE | 6 | Admin screens + legal + notifications |
| 202 | `components/specialist/CaseCard.tsx` | **DEAD** | **0** | No importer |
| 195 | `components/dashboard/PriorityFeed.tsx` | **DEAD** | **0** | Barrel-exported; zero consumers |
| 194 | `components/requests/FileUploadSection.tsx` | LOW | 1 | `requests/new` |
| 190 | `components/landing/DuotoneIcon.tsx` | LOW | 2 | `landing/ServiceCard` + `landing/HowItWorksFlow` |
| 189 | `components/dashboard/DashboardHero.tsx` | **DEAD** | **0** | Barrel-exported; zero consumers in app/ |
| 188 | `components/dashboard/KpiCard.tsx` | **DEAD** | **0** | Used only inside `dashboard/sections/` barrel chain |
| 180 | `components/MessengerEmptyPane.tsx` | LOW | 1 | `(tabs)/messages` |
| 180 | `components/landing/HowItWorksFlow.tsx` | LOW | 1 | `app/index` |
| 178 | `components/ui/Input.tsx` | CORE | 14 | Design-system primitive |
| 168 | `components/MessageBubble.tsx` | LOW | 2 | `InlineChatView` + `chat/ChatMessageList` (chat dir is dead) |
| 162 | `components/requests/ThreadsList.tsx` | LOW | 1 | `requests/[id]/detail` |
| 162 | `components/dashboard/StatsGrid.tsx` | **DEAD** | **0** | Barrel-exported; zero consumers |
| 158 | `components/chat/ChatComposer.tsx` | **DEAD** | **0** | Entire `chat/` module has 0 consumers |
| 157 | `components/Header.tsx` | **DEAD** | **0** | Root-level public header; 0 importers in main source |
| 156 | `components/chat/ChatHeader.tsx` | **DEAD** | **0** | `chat/` module; 0 consumers |
| 149 | `components/auth/OtpCodeInput.tsx` | LOW | 1 | `app/otp` only |
| 144 | `components/specialist/ContactsSection.tsx` | LOW | 2 | `specialists/[id]` + (confusingly) shadows `settings/specialist/ContactsSection` |
| 143 | `components/landing/SpecialistCTASection.tsx` | LOW | 1 | `app/index` |
| 141 | `components/landing/CaseCard.tsx` | LOW | 2 | Type import + `landing/CasesSection` |
| 140 | `components/files/FilePreviewChip.tsx` | **DEAD** | **0** | No importer |
| 138 | `components/dashboard/FeedList.tsx` | **DEAD** | **0** | Barrel only; used via barrel in `sections/` |
| 133 | `components/landing/FooterSection.tsx` | LOW | 1 | `app/index` |
| 130 | `components/landing/CasesSection.tsx` | LOW | 1 | `app/index` |
| 130 | `components/dashboard/DashboardGrid.tsx` | **DEAD** | **0** | Used only via barrel in `sections/` — not in `app/` |
| 128 | `components/landing/LandingHeader.tsx` | LOW | 3 | `app/index`, `requests/new`, `SpecialistFeed` |
| 125 | `components/MetroBridge.tsx` | LOW | 1 | `app/_layout` |
| 124 | `components/MobileMenu.tsx` | LOW | 2 | `Header.tsx` (dead) + `AppHeader.tsx` (dead) |
| 121 | `components/onboarding/OnboardingShell.tsx` | LOW | 3 | 3 onboarding screens |
| 120 | `components/requests/SpecialistRecommendations.tsx` | LOW | 1 | `requests/detail/RequestSpecialists` (itself dead) |
| 118 | `components/dashboard/DashboardWidget.tsx` | **DEAD** | **0** | Only used inside `sections/` barrel consumers |
| 115 | `components/settings/SpecialistTab.tsx` | LOW | 1 | `settings/index` |
| 115 | `components/chat/ChatMessageList.tsx` | **DEAD** | **0** | `chat/` module; 0 consumers |
| 113 | `components/messages/InboxFilterChips.tsx` | **DEAD** | **0** | No importer |
| 113 | `components/layout/AppShell.tsx` | LOW | 1 | `app/_layout` |
| 106 | `components/layout/StrandedSpecialistBanner.tsx` | LOW | 1 | `app/_layout` |
| 105 | `components/specialist/SpecialistContactCTA.tsx` | LOW | 1 | `specialists/[id]` |
| 105 | `components/layout/NotificationsBell.tsx` | LOW | 1 | `AppHeader.tsx` (dead — so transitively dead) |
| 103 | `components/dashboard/sections/MyRequestsWidget.tsx` | **DEAD** | **0** | Used only in worktree; not in main `app/` |
| 102 | `components/ui/Button.tsx` | CORE | 18 | Design-system primitive |
| 100 | `components/shared/CityFnsServicePicker.tsx` | LOW | 1 | `requests/new` |
| 99 | `components/ui/Avatar.tsx` | CORE | 5 | |
| 98 | `components/RequestCard.tsx` | LOW | 1 | `requests/RequestsFeed` |
| 98 | `components/onboarding/WorkAreaEntry.tsx` | LOW | 3 | `work-area` step + `InlineWorkArea` |
| 98 | `components/landing/TrustStrip.tsx` | LOW | 1 | `app/index` |
| 96 | `components/settings/NotificationPreferences.tsx` | LOW | 1 | `settings/NotificationsTab` (itself dead) |
| 96 | `components/requests/detail/RequestSpecialists.tsx` | **DEAD** | **0** | `detail.tsx` was refactored to inline; this split never used |
| 95 | `components/landing/ServicesSection.tsx` | LOW | 2 | `app/index` + `landing/ServiceCard` |
| 89 | `components/ui/MetricCard.tsx` | LOW | 1 | `admin/settings` |
| 87 | `components/specialist/SpecialistServicesCities.tsx` | LOW | 1 | `specialists/[id]` |
| 87 | `components/onboarding/OnboardingProgress.tsx` | CORE | 5 | All 4 onboarding steps + `OnboardingShell` |
| 87 | `components/dashboard/sections/SpecialistSidebar.tsx` | **DEAD** | **0** | Not imported in main source |
| 85 | `components/ui/ErrorBoundary.tsx` | LOW | 1 | `admin/dashboard` |
| 85 | `components/settings/specialist/FnsServicesSection.tsx` | LOW | 1 | `settings/SpecialistTab` |
| 85 | `components/landing/ServiceCard.tsx` | LOW | 1 | `landing/ServicesSection` |
| 81 | `components/specialist/SpecialistCredentials.tsx` | LOW | 1 | `specialists/[id]` |
| 81 | `components/specialist/ProfileHero.tsx` | **DEAD** | **0** | No importer; superseded by `SpecialistHero` |
| 80 | `components/dashboard/sections/ClientSidebar.tsx` | **DEAD** | **0** | Not imported in main source |
| 79 | `components/specialist/SpecialistHero.tsx` | LOW | 1 | `specialists/[id]` |
| 76 | `components/settings/AccountTab.tsx` | **DEAD** | **0** | Tabs refactored; account actions now inline in settings |
| 73 | `components/ui/StyledSwitch.tsx` | LOW | 2 | `requests/detail/RequestActions` (dead) + `settings/specialist/FnsServicesSection` |
| 73 | `components/dashboard/sections/SpecialistMatchedWidget.tsx` | **DEAD** | **0** | Not imported in main source |
| 70 | `components/dashboard/sections/SpecialistKPIRow.tsx` | **DEAD** | **0** | Not imported in main source |
| 69 | `components/requests/MessageComposer.tsx` | LOW | 1 | `requests/[id]/messages` |
| 67 | `components/ui/PerspectiveBadge.tsx` | LOW | 3 | Used in `chat/ChatHeader` (dead), `requests/ThreadsList`, `(tabs)/messages` |
| 67 | `components/requests/FileAttachmentRow.tsx` | **DEAD** | **0** | No importer |
| 66 | `components/ui/LoadingState.tsx` | CORE | 14 | |
| 63 | `components/ui/Card.tsx` | CORE | 7 | |
| 62 | `components/HeaderHome.tsx` | LOW | 1 | `app/brand` only (DEV-mode page) |
| 61 | `components/specialist/SpecialistMobileBottomCTA.tsx` | LOW | 1 | `specialists/[id]` |
| 61 | `components/dashboard/sections/ClientKPIRow.tsx` | **DEAD** | **0** | Not imported in main source |
| 59 | `components/layout/RoleBadge.tsx` | LOW | 3 | `AppHeader` (dead), `SidebarNav`, `admin/settings` |
| 58 | `components/requests/detail/RequestDocuments.tsx` | **DEAD** | **0** | Refactored into `detail.tsx` inline |
| 58 | `components/auth/ResendCountdown.tsx` | LOW | 1 | `app/otp` only |
| 56 | `components/settings/specialist/ContactsSection.tsx` | LOW | 2 | `SpecialistTab` + shadows `specialist/ContactsSection` |
| 54 | `components/specialist/SpecialistGuestLockedContacts.tsx` | LOW | 1 | `specialists/[id]` |
| 53 | `components/requests/RequestPreviewCard.tsx` | LOW | 1 | `requests/[id]/write` |
| 53 | `components/dashboard/sections/SpecialistEmptyState.tsx` | **DEAD** | **0** | Not imported in main source |
| 53 | `components/dashboard/sections/ClientEmptyState.tsx` | **DEAD** | **0** | Not imported in main source |
| 49 | `components/ui/EmptyState.tsx` | CORE | 10 | |
| 49 | `components/specialists/SpecialistFilter.tsx` | LOW | 1 | `SpecialistFeed` |
| 48 | `components/ui/Text.tsx` | **DEAD** | **0** | Exported in barrel; zero direct callers |
| 48 | `components/onboarding/workarea/WorkAreaIntro.tsx` | LOW | 2 | `onboarding/WorkAreaEntry` + `settings/InlineWorkArea` |
| 45 | `components/specialist/WorkAreaSection.tsx` | LOW | 1 | `specialists/[id]` |
| 42 | `components/brand/Logo.tsx` | CORE | 8 | |
| 41 | `components/ui/ErrorState.tsx` | CORE | 8 | |
| 40 | `components/ui/Badge.tsx` | CORE | 9 | |
| 40 | `components/requests/detail/RequestHeader.tsx` | **DEAD** | **0** | Refactored into `detail.tsx` inline |
| 38 | `components/settings/specialist/OfficeSection.tsx` | LOW | 1 | `SpecialistTab` |
| 37 | `components/specialist/StatsRow.tsx` | **DEAD** | **0** | No importer |
| 37 | `components/specialist/SpecialistReviewsPlaceholder.tsx` | LOW | 1 | `specialists/[id]` |
| 36 | `components/HeaderBack.tsx` | LOW | 2 | `app/otp` + `app/brand` (DEV-only) |
| 32 | `components/settings/specialist/AboutSection.tsx` | LOW | 1 | `SpecialistTab` |
| 31 | `components/specialist/SpecialistAbout.tsx` | LOW | 1 | `specialists/[id]` |
| 31 | `components/onboarding/workarea/EntriesList.tsx` | LOW | 2 | `onboarding/WorkAreaEntry` + `settings/InlineWorkArea` |
| 30 | `components/settings/NotificationsTab.tsx` | **DEAD** | **0** | Tab removed; `AccountTab` + `NotificationsTab` stripped from settings |
| 29 | `components/settings/specialist/DisabledNotice.tsx` | LOW | 1 | `SpecialistTab` |
| 28 | `components/ResponsiveContainer.tsx` | CORE | 5 | Various public screens |
| 27 | `components/StatusBadge.tsx` | LOW | 3 | `detail.tsx`, `RequestHeader` (dead), `dashboard/sections/MyRequestsWidget` (dead) |
| 26 | `components/onboarding/workarea/BackHeader.tsx` | LOW | 1 | `onboarding/work-area` |
| 25 | `components/specialists/CatalogHeader.tsx` | LOW | 1 | `SpecialistFeed` |
| 21 | `components/specialists/CatalogSkeleton.tsx` | LOW | 1 | `SpecialistFeed` |
| 16 | `components/layout/PageTitle.tsx` | CORE | 5 | Uses inline `style` not `StyleSheet` — violates NativeWind rule |

---

## 3. Routes Inventory Table

Sorted by nesting depth then file name. Layout chain shows which layout wraps the screen.

| LOC | Route File | Layout Chain | Type | Notes |
|---|---|---|---|---|
| 258 | `app/index.tsx` | `_layout` → `AppShell` | Landing | Public; renders `LandingHeader` + hero |
| 195 | `app/login.tsx` | `_layout` → `AppShell` | Auth | OTP email form |
| 408 | `app/otp.tsx` | `_layout` → `AppShell` | Auth | OTP verify; uses `HeaderBack` |
| 275 | `app/brand.tsx` | `_layout` → `AppShell` | Dev-only | `__DEV__` guard inline; uses both `HeaderBack` + `HeaderHome` (duplicate chrome) |
| 312 | `app/notifications.tsx` | `_layout` → `AppShell` → `DesktopScreen` | Auth | |
| 250 | `app/admin/settings.tsx` | `_layout` → `AppShell` → `DesktopScreen` | Admin | No `SidebarNav` — admin-tabs layout handles it |
| 77 | `app/legal/index.tsx` | `_layout` → `DesktopScreen` | Public | Legal hub |
| 210 | `app/legal/privacy.tsx` | `_layout` | Public | |
| 221 | `app/legal/terms.tsx` | `_layout` | Public | |
| 478 | `app/requests/new.tsx` | `_layout` → `AppShell` | Public/Auth | Uses `LandingHeader` — inconsistent with other auth screens |
| 558 | `app/requests/[id]/detail.tsx` | `_layout` | Auth-gated | 558 LOC — biggest route file; sub-components exist but are unused |
| 257 | `app/requests/[id]/messages.tsx` | `_layout` | Auth-gated | |
| 299 | `app/requests/[id]/write.tsx` | `_layout` | Auth-gated (specialist) | |
| 14 | `app/requests/index.tsx` | `_layout` | Public | Thin wrapper over `RequestsFeed` |
| 419 | `app/specialists/[id].tsx` | `_layout` → `AppShell` | Public | |
| 5 | `app/specialists/index.tsx` | `_layout` → `AppShell` | Public | Thin wrapper |
| 5 | `app/saved-specialists/index.tsx` | `_layout` → `AppShell` | Auth | Thin wrapper |
| 332 | `app/settings/index.tsx` | `_layout` → `AppShell` | Auth | Also rendered inline by `(tabs)/profile` |
| 65 | `app/threads/[id].tsx` | `_layout` → `AppShell` | Auth | |
| 269 | `app/onboarding/name.tsx` | `_layout` | Auth/flow | `OnboardingShell` + `OnboardingProgress` |
| 295 | `app/onboarding/visibility.tsx` | `_layout` | Auth/flow | |
| 312 | `app/onboarding/work-area.tsx` | `_layout` | Auth/flow | |
| 525 | `app/onboarding/profile.tsx` | `_layout` | Auth/flow | Biggest onboarding screen; 525 LOC |
| 251 | `app/(tabs)/messages.tsx` | `_layout` → `(tabs)/_layout` → tab bar | Auth tab | Real screen |
| 14 | `app/(tabs)/my-requests.tsx` | `_layout` → `(tabs)/_layout` → tab bar | Auth tab | Thin wrapper |
| 10 | `app/(tabs)/requests.tsx` | `_layout` → `(tabs)/_layout` → tab bar | Auth tab | Thin wrapper |
| 10 | `app/(tabs)/profile.tsx` | `_layout` → `(tabs)/_layout` → tab bar | Auth tab | Renders `settings/index` inline |
| 10 | `app/(tabs)/dashboard.tsx` | `_layout` → `(tabs)/_layout` | **Redirect** | `router.replace("/(tabs)/my-requests")` — never shown |
| 10 | `app/(tabs)/search.tsx` | `_layout` → `(tabs)/_layout` | **Redirect** | `<Redirect href="/specialists">` |
| 10 | `app/(tabs)/create.tsx` | `_layout` → `(tabs)/_layout` | **Redirect** | `<Redirect href="/requests/new">` |
| 8 | `app/(tabs)/public-requests.tsx` | `_layout` → `(tabs)/_layout` | **Redirect** | `<Redirect href="/(tabs)/requests">` |
| 460 | `app/(admin-tabs)/dashboard.tsx` | `_layout` → `(admin-tabs)/_layout` | Admin tab | |
| 482 | `app/(admin-tabs)/users.tsx` | `_layout` → `(admin-tabs)/_layout` | Admin tab | |
| 356 | `app/(admin-tabs)/complaints.tsx` | `_layout` → `(admin-tabs)/_layout` | Admin tab | |
| 24 | `app/(admin-tabs)/moderation.tsx` | `_layout` → `(admin-tabs)/_layout` | Admin tab | Stub — 24 LOC, no real content |

---

## 4. Duplicates & Dead Code

### 4.1 Dead Component Modules

**Entire `components/chat/` directory — 0 consumers in `app/` or `components/`**

The directory was built as a future refactoring target but was never wired up. `InlineChatView` and `threads/[id]` import directly from `components/ChatComposer.tsx` and `components/MessageBubble.tsx` instead.

- `components/chat/ChatComposer.tsx` (158 LOC) — DEAD
- `components/chat/ChatHeader.tsx` (156 LOC) — DEAD
- `components/chat/ChatMessageList.tsx` (115 LOC) — DEAD
- `components/chat/index.ts` — DEAD
- `components/chat/chatUtils.ts` — DEAD (only imported by dead siblings)

**`components/requests/detail/` — entire sub-tree never wired up in main `app/`**

`app/requests/[id]/detail.tsx` was refactored (iter10–iter11) to inline all sub-sections. The extracted components were never removed:

- `components/requests/detail/RequestActions.tsx` (222 LOC) — DEAD
- `components/requests/detail/RequestDocuments.tsx` (58 LOC) — DEAD
- `components/requests/detail/RequestHeader.tsx` (40 LOC) — DEAD
- `components/requests/detail/RequestSpecialists.tsx` (96 LOC) — DEAD (only `types.ts` still used)

**Orphaned `dashboard/sections/` sub-components**

`(tabs)/dashboard.tsx` was replaced by `router.replace("/(tabs)/my-requests")`. All section components were for that now-redirect screen:

- `components/dashboard/sections/ClientEmptyState.tsx` — DEAD
- `components/dashboard/sections/ClientKPIRow.tsx` — DEAD
- `components/dashboard/sections/ClientSidebar.tsx` — DEAD
- `components/dashboard/sections/MyRequestsWidget.tsx` — DEAD
- `components/dashboard/sections/SpecialistEmptyState.tsx` — DEAD
- `components/dashboard/sections/SpecialistKPIRow.tsx` — DEAD
- `components/dashboard/sections/SpecialistMatchedWidget.tsx` — DEAD
- `components/dashboard/sections/SpecialistSidebar.tsx` — DEAD

**Orphaned dashboard barrel exports**

These exist in `components/dashboard/index.ts` but are never consumed outside the dead sections above:

- `components/dashboard/CaseTimeline.tsx` (383 LOC) — DEAD
- `components/dashboard/DashboardHero.tsx` (189 LOC) — DEAD
- `components/dashboard/DashboardWidget.tsx` (118 LOC) — DEAD
- `components/dashboard/FeedList.tsx` (138 LOC) — DEAD (used only in dead sections)
- `components/dashboard/KpiCard.tsx` (188 LOC) — DEAD (used only in dead sections)
- `components/dashboard/PriorityFeed.tsx` (195 LOC) — DEAD
- `components/dashboard/RecentWinsStrip.tsx` (235 LOC) — DEAD
- `components/dashboard/StatsGrid.tsx` (162 LOC) — DEAD

(Exception: `DashboardGrid` and `KpiCard` are used by the admin dashboard `(admin-tabs)/dashboard.tsx` via the barrel. They are NOT dead if the admin tab is counted.)

**Other isolated dead components**

- `components/layout/AppHeader.tsx` (467 LOC) — DEAD. The comment in `_layout.tsx` ("No top AppHeader") confirms this is intentionally superseded by `SidebarNav`, but the file remains.
- `components/layout/MobileDrawer.tsx` (346 LOC) — DEAD. Mentioned in `_layout.tsx` JSDoc but never imported anywhere in main source. `AppHeader` uses `MobileMenu` instead.
- `components/SpecialistCard.tsx` (319 LOC) — DEAD. Root-level card; superseded by `SpecialistsGrid.DesktopSpecialistRow` (internal function).
- `components/filters/SpecialistSearchBar.tsx` (313 LOC) — DEAD. No importer.
- `components/Header.tsx` (157 LOC) — DEAD. Root-level public header with hardcoded nav links (`/situations`, `/coverage`, `/for-specialists`) that don't exist as routes. 0 importers.
- `components/MobileMenu.tsx` (124 LOC) — **TRANSITIVELY DEAD** (only imported by `Header.tsx` and `AppHeader.tsx`, both dead).
- `components/specialist/CaseCard.tsx` (202 LOC) — DEAD.
- `components/specialist/ProfileHero.tsx` (81 LOC) — DEAD. Superseded by `SpecialistHero`.
- `components/specialist/StatsRow.tsx` (37 LOC) — DEAD.
- `components/requests/FileDropZone.tsx` (441 LOC) — DEAD. Superseded by `ui/FileUploadZone`.
- `components/requests/FileAttachmentRow.tsx` (67 LOC) — DEAD.
- `components/files/FilePreviewChip.tsx` (140 LOC) — DEAD.
- `components/messages/InboxFilterChips.tsx` (113 LOC) — DEAD.
- `components/settings/AccountTab.tsx` (76 LOC) — DEAD. Removed from settings; account actions are now inline at the bottom of the page.
- `components/settings/NotificationsTab.tsx` (30 LOC) — DEAD. Same reason.
- `components/layout/NotificationsBell.tsx` (105 LOC) — TRANSITIVELY DEAD (only `AppHeader` imports it; `AppHeader` is dead).
- `components/ui/Text.tsx` (48 LOC) — **effectively DEAD**: exported via barrel but zero direct consumers in `app/` or `components/`.
- `components/dashboard/sections/SpecialistSidebar.tsx` (87 LOC) — DEAD.

### 4.2 Multiple Header Components

Five distinct "header" families exist:

| Component | LOC | Where used | Unique feature | Merger candidate |
|---|---|---|---|---|
| `components/Header.tsx` | 157 | **NOWHERE** | Public nav + burger (dead routes) | **DELETE** |
| `components/HeaderHome.tsx` | 62 | `app/brand` (DEV-only) | Blue brand bar for mobile tabs | **DELETE** (role replaced by SidebarNav) |
| `components/HeaderBack.tsx` | 36 | `app/otp`, `app/brand` | Back arrow + title + optional right action | Keep — simple utility |
| `components/landing/LandingHeader.tsx` | 128 | `app/index`, `requests/new`, `SpecialistFeed` | Public marketing header with CTA | Keep — public chrome |
| `components/layout/AppHeader.tsx` | 467 | **NOWHERE** | Authenticated top-rail (search+bell+avatar) | **DELETE** or MOUNT |
| `components/chat/ChatHeader.tsx` | 156 | **NOWHERE** (chat/ is dead) | Thread header with back+avatar | DELETE with chat/ module |
| `components/onboarding/workarea/BackHeader.tsx` | 26 | `onboarding/work-area` | Onboarding back-with-title | Merge into `HeaderBack` |
| `components/specialists/CatalogHeader.tsx` | 25 | `SpecialistFeed` | Count display below page title | Not really a header — rename |

**Merger path:** `HeaderBack` + `onboarding/workarea/BackHeader` → one parametric `<BackHeader title rightAction />` (already identical API).

### 4.3 Duplicate ContactsSection

Two components with the same name serve overlapping but distinct contexts:

- `components/specialist/ContactsSection.tsx` (144 LOC) — renders specialist contacts for the **public profile** view (`specialists/[id]`)
- `components/settings/specialist/ContactsSection.tsx` (56 LOC) — editable contact form in **settings**

Same name, different directories, different purpose. Low merger risk — but naming is confusing.

### 4.4 Duplicate CaseCard

- `components/landing/CaseCard.tsx` (141 LOC) — landing page case study card; used
- `components/specialist/CaseCard.tsx` (202 LOC) — specialist profile case history card; **DEAD**

### 4.5 Triple File-Upload Implementations

Three separate implementations of the same upload flow:

| File | LOC | Used by | Unique aspect |
|---|---|---|---|
| `components/ui/FileUploadZone.tsx` | 683 | `requests/[id]/write`, `ChatComposer` | Full drag-drop + preview + upload |
| `components/requests/FileDropZone.tsx` | 441 | **DEAD** | Similar drag-drop, older version |
| `components/requests/FileUploadSection.tsx` | 194 | `requests/new` | Simpler picker without drag-drop |

**Action:** Delete `FileDropZone`, consolidate `FileUploadSection` into `FileUploadZone` with a `simple` prop.

### 4.6 Redirect-Only Tab Files (all hidden from tab bar)

All four exist to preserve legacy deep links:

| File | Redirects to | Keep? |
|---|---|---|
| `app/(tabs)/dashboard.tsx` | `/(tabs)/my-requests` | **Keep** — `dashboard` in tab bar registry |
| `app/(tabs)/search.tsx` | `/specialists` | Keep — legacy bookmark compat |
| `app/(tabs)/create.tsx` | `/requests/new` | Keep — legacy bookmark compat |
| `app/(tabs)/public-requests.tsx` | `/(tabs)/requests` | Keep — legacy bookmark compat |

These are cheap to keep for URL compatibility. No action needed.

### 4.7 `requests/index.tsx` vs `(tabs)/requests.tsx` Duplication

Both render `<RequestsFeed mode="catalog" title="Запросы" />` with identical props. `requests/index.tsx` is the deep-link entry; `(tabs)/requests.tsx` is the tab. Acceptable duplication by design.

### 4.8 `components/SpecialistCard.tsx` vs `SpecialistsGrid.DesktopSpecialistRow`

`SpecialistCard.tsx` (319 LOC) is a standalone card with `variant="vertical"|"horizontal"` and `@deprecated horizontal` prop. `DesktopSpecialistRow` is a private function inside `SpecialistsGrid.tsx`. The standalone `SpecialistCard` has 0 importers — it can be deleted. The `SpecialistsGrid` internal row is the active path.

---

## 5. Layout/Shell Problems

### P1 — `AppHeader` is orphan (CONFIRMED)

`components/layout/AppHeader.tsx` has **0 imports** in `app/` or `components/` (main source). The JSDoc in `_layout.tsx` at line 79–80 explicitly states: *"No top AppHeader for authenticated users on any breakpoint."*

The component and its exported helper `shouldShowAppHeader` exist but are never called. The worktree `agent-a8249a2bc49731ca9` shows the previous state where it was mounted — it was intentionally removed when `SidebarNav` was introduced.

**Fix location:** None required if the design decision is sidebar-only. Or mount it inside `AppShell.tsx` above `{children}` in the desktop content pane (line 109 of `AppShell.tsx`) to get the search bar + bell + avatar on desktop.

**Exact patch site:** `/Users/sergei/Documents/Projects/Ruslan/p2ptax/components/layout/AppShell.tsx` line 109 — before `{children}` in the desktop branch.

### P2 — Mobile tab screens have no top bar (CONFIRMED)

`app/(tabs)/_layout.tsx` sets `headerShown: false` globally (line 43). `HeaderHome` renders null on desktop (line 26–28 of `HeaderHome.tsx`) and was never mounted by the tabs layout anyway (0 imports in `(tabs)/_layout.tsx`). Mobile users on `(tabs)/messages` or `(tabs)/my-requests` see no top chrome — only the bottom tab bar.

**Fix location:** `app/(tabs)/_layout.tsx` — add `headerShown: false` is correct for Expo's native header, but a custom `HeaderHome` could be mounted per-screen. Alternatively, `AppShell` on mobile could receive a top AppHeader when `isMobile` (currently it passes through without any header).

**Exact patch site:** `app/(tabs)/_layout.tsx` line 67 (inside `<Tabs screenOptions={{...}}>`) — add per-screen header if needed, or modify `AppShell.tsx` line 78 (`!showSidebar` branch) to include a mobile header.

### P3 — `HeaderHome` logo not Pressable (CONFIRMED)

`components/HeaderHome.tsx` line 31: `<Logo variant="white" size="md" />` is rendered inside a plain `<View>`, not a `<Pressable>`. The logo cannot navigate home. Compare with `AppHeader.tsx` line 231: logo is wrapped in `<Pressable onPress={() => nav.routes.home()}>`.

**Exact patch site:** `components/HeaderHome.tsx` line 31 — wrap `<Logo>` in `<Pressable onPress={() => nav.routes.home()}>`.

### P4 — `/brand` has duplicate chrome on mobile (CONFIRMED)

`app/brand.tsx` line 55–56 imports both `HeaderBack` (renders back arrow + "Design System" title) AND `HeaderHome` (renders `null` on desktop, but on mobile renders the blue brand bar). Both are rendered sequentially:

```tsx
<HeaderBack title="Design System" />
...
{/* HeaderHome is never actually rendered on desktop but IS rendered on mobile */}
```

`app/brand.tsx` line 15–16 + line 55–57 — `HeaderBack` is the correct choice; `HeaderHome` import should be removed. This is DEV-only but still confusing.

**Exact patch site:** `app/brand.tsx` lines 15–16 (remove `HeaderHome` import) and remove its usage in JSX.

### P5 — `/admin/settings` has no sidebar (CONFIRMED partially)

`app/admin/settings.tsx` uses `DesktopScreen` wrapper but does not go through `(admin-tabs)` group — it's a standalone Stack screen. `AppShell` will show the sidebar via `detectSidebarGroup` if the admin user is authenticated and on an admin route. The `SidebarNav` `detectSidebarGroup` function maps `/admin/` to the `admin` group, so this should work on desktop. **Low severity** — verify in browser.

### P6 — `MobileDrawer` never mounted (CONFIRMED)

`components/layout/MobileDrawer.tsx` (346 LOC) is referenced in the `_layout.tsx` JSDoc (line 54: "burger opens MobileDrawer") but has **0 imports** in main source. The `AppHeader` (itself dead) imported `MobileMenu` not `MobileDrawer`. `MobileDrawer` is dead weight.

**Exact patch site:** Either delete the file or wire it into `AppHeader` as the intended mobile drawer (replacing `MobileMenu`).

### P7 — `/otp` no clickable logo in primary state (CONFIRMED)

`app/otp.tsx` line 12 imports `HeaderBack` which renders a back-arrow. There is no logo or home link. This is consistent with the auth flow (back = go to login) but `HeaderHome` was presumably considered for a logo-press-goes-home affordance. Not a regression — just a design note.

### P8 — `components/dashboard/` barrel exports 8 unused components (NEW)

`components/dashboard/index.ts` exports `DashboardHero`, `CaseTimeline`, `StatsGrid`, `PriorityFeed`, `RecentWinsStrip`. None of these are consumed by any screen in `app/`. Only `DashboardGrid`, `KpiCard`, `DashboardWidget`, and `FeedList` are consumed — by `(admin-tabs)/dashboard.tsx` and by the dead `dashboard/sections/` components.

---

## 6. Refactoring Plan

### Priority Table

| Priority | Category | Action | Files Involved | Reason | Est. Effort | Risk |
|---|---|---|---|---|---|---|
| P0 | **DELETE** | Remove entire `components/chat/` module | `chat/ChatComposer.tsx`, `chat/ChatHeader.tsx`, `chat/ChatMessageList.tsx`, `chat/chatUtils.ts`, `chat/index.ts` | 0 consumers; 593 LOC dead code | 10 min | None |
| P0 | **DELETE** | Remove `components/requests/detail/` split components | `RequestActions.tsx`, `RequestDocuments.tsx`, `RequestHeader.tsx`, `RequestSpecialists.tsx` | Inlined into `detail.tsx`; only `types.ts` still needed | 10 min | None |
| P0 | **DELETE** | Remove all 8 dead `dashboard/sections/` components | `ClientEmptyState`, `ClientKPIRow`, `ClientSidebar`, `MyRequestsWidget`, `SpecialistEmptyState`, `SpecialistKPIRow`, `SpecialistMatchedWidget`, `SpecialistSidebar` | `(tabs)/dashboard` redirects; these are unreachable | 10 min | None |
| P0 | **DELETE** | Remove 5 unreachable dashboard barrel components | `DashboardHero`, `CaseTimeline`, `StatsGrid`, `PriorityFeed`, `RecentWinsStrip` | 0 consumers in `app/` | 10 min | None |
| P0 | **DELETE** | Remove `components/layout/AppHeader.tsx` + `MobileDrawer.tsx` | Both files + references in JSDoc | Orphans. AppShell explicitly bypasses them | 15 min | Low — verify no hidden import |
| P0 | **DELETE** | Remove `components/Header.tsx` | `components/Header.tsx`, remove from `MobileMenu.tsx` import chain | Dead; contains 4 hardcoded routes that don't exist | 5 min | None |
| P1 | **DELETE** | Remove `components/SpecialistCard.tsx` | `components/SpecialistCard.tsx` | Superseded by `SpecialistsGrid` internal row; 0 importers | 5 min | None |
| P1 | **DELETE** | Remove `components/requests/FileDropZone.tsx` | `components/requests/FileDropZone.tsx` | Superseded by `ui/FileUploadZone`; 0 importers | 5 min | None |
| P1 | **DELETE** | Remove `components/specialist/ProfileHero.tsx`, `StatsRow.tsx`, `CaseCard.tsx` | 3 files | 0 importers; superseded by `SpecialistHero` | 5 min | None |
| P1 | **DELETE** | Remove `components/settings/AccountTab.tsx` + `NotificationsTab.tsx` | 2 files | Tab redesign removed them from `settings/index` | 5 min | None |
| P1 | **DELETE** | Remove `components/messages/InboxFilterChips.tsx`, `components/requests/FileAttachmentRow.tsx`, `components/files/FilePreviewChip.tsx`, `components/filters/SpecialistSearchBar.tsx` | 4 files | 0 importers | 5 min | None |
| P1 | **DELETE** | Remove `components/MobileMenu.tsx` | `components/MobileMenu.tsx` | Only imported by two dead headers | 5 min | None |
| P1 | **MOUNT** | Wire `AppHeader` into `AppShell` desktop content pane | `components/layout/AppShell.tsx` line 109, `components/layout/AppHeader.tsx` | Restores search bar + bell + avatar on desktop — confirmed intended by original design | 30 min | Medium |
| P2 | **EXTRACT** | Create `hooks/useCities.ts` | 7 files currently fetch `/api/cities` independently | Cache cities list; avoid 7 redundant API calls on page load | 2h | Low |
| P2 | **EXTRACT** | Create `hooks/useAuthGuard.ts` | 9 sites with `if (!isAuthenticated) nav.routes.login()` | Consistent redirect behaviour; single testable hook | 1h | Low |
| P2 | **EXTRACT** | Create `hooks/useOtpRequest.ts` | `app/login.tsx`, `app/otp.tsx`, `components/requests/InlineOtpFlow.tsx` | 3 separate request-otp + verify-otp flows | 2h | Low |
| P2 | **MERGE** | Merge `onboarding/workarea/BackHeader.tsx` into `HeaderBack.tsx` | `components/HeaderBack.tsx`, `components/onboarding/workarea/BackHeader.tsx`, `app/onboarding/work-area.tsx` | Identical API; save 26 LOC | 20 min | None |
| P2 | **MOUNT** | Add mobile top bar on tab screens | `app/(tabs)/_layout.tsx` or `AppShell.tsx` | Mobile users see no branded chrome above content | 1h | Low |
| P3 | **FIX** | Make `HeaderHome` logo Pressable | `components/HeaderHome.tsx` line 31 | UX: logo should navigate home | 5 min | None |
| P3 | **FIX** | Remove duplicate `HeaderHome` from `app/brand.tsx` | `app/brand.tsx` lines 15–16 | DEV-only but confusing double-chrome | 5 min | None |
| P3 | **RENAME** | Disambiguate the two `ContactsSection` components | `components/specialist/ContactsSection.tsx` → `SpecialistPublicContacts.tsx`, `components/settings/specialist/ContactsSection.tsx` → `SpecialistSettingsContacts.tsx` | Same name, different domains | 15 min | Low |
| P3 | **RENAME** | Rename `components/specialists/CatalogHeader.tsx` | → `SpecialistCount.tsx` or `CatalogCountLabel.tsx` | Not a header — renders only a count | 10 min | None |
| P3 | **DELETE** | Remove `components/ui/Text.tsx` or start using it | `components/ui/Text.tsx`, `components/ui/index.ts` | Exported but 0 consumers; either adopt or delete | 5 min | Low |
| P3 | **FIX** | `components/layout/PageTitle.tsx` uses inline `style` not `className` | `components/layout/PageTitle.tsx` | Violates project NativeWind absolute rule (CLAUDE.md §1) | 10 min | None |
| P4 | **CONSOLIDATE** | Unify `FileUploadSection` into `FileUploadZone` with `simple` mode | `components/requests/FileUploadSection.tsx`, `components/ui/FileUploadZone.tsx`, `app/requests/new.tsx` | 2 file-upload implementations doing similar work | 3h | Medium |
| P4 | **CONSOLIDATE** | Integrate `dashboard/` barrel-exported components into admin dashboard only | Keep `DashboardGrid`, `KpiCard`, `DashboardWidget`, `FeedList` — delete the rest | Admin dashboard uses 4 of 9 barrel exports | 1h | Low |

### Estimated total dead LOC (safe to delete)

| Category | LOC |
|---|---|
| `components/chat/` module | 593 |
| `components/requests/detail/` split (excl. types.ts) | 416 |
| `components/dashboard/sections/` (all 8) | ~590 |
| Dead dashboard barrel components (5) | 1,062 |
| `AppHeader.tsx` + `MobileDrawer.tsx` | 813 |
| `Header.tsx` + `MobileMenu.tsx` | 281 |
| `SpecialistCard.tsx` + `FileDropZone.tsx` | 760 |
| `specialist/ProfileHero` + `StatsRow` + `CaseCard` | 320 |
| `AccountTab` + `NotificationsTab` | 106 |
| Other small dead components (7 files) | ~540 |
| **Total dead LOC (safe delete)** | **~5,481** |

This represents ~31% of the total component LOC (58,347 / 3 ≈ 19,449 unique, given the 3× duplicate in `wc -l` output).

---

## 7. Tooling Recommendations

### 7.1 ESLint Rules to Add

```json
// .eslintrc additions
{
  "rules": {
    "no-restricted-imports": [
      "error",
      {
        "patterns": [
          {
            "group": ["react-native"],
            "importNames": ["TextInput"],
            "message": "Use components/ui/Input instead of raw TextInput outside components/ui/"
          }
        ]
      }
    ]
  }
}
```

Add an override that exempts `components/ui/Input.tsx`, `components/auth/OtpCodeInput.tsx`, `components/requests/InlineOtpFlow.tsx`, `components/layout/AppHeader.tsx` (search field), and `components/filters/CityFnsCascade.tsx` (typeahead).

**Additional rules worth adding:**

- `import/no-cycle` — prevents circular barrel imports (dashboard barrel → sections → barrel)
- `@typescript-eslint/no-unused-vars` with `"argsIgnorePattern": "^_"` — catches new dead exports early
- Custom rule or `eslint-plugin-no-only-tests` guard to flag `__DEV__`-gated screens that still contain full component logic

### 7.2 Pre-commit Hook

Add to `.husky/pre-commit` or equivalent:

```bash
#!/bin/sh
# Fail if any file in components/layout/ or app/*_layout.tsx changed
# without a corresponding visual smoke test
LAYOUT_CHANGED=$(git diff --cached --name-only | grep -E "components/layout/|app/_layout|app/\(tabs\)/_layout|app/\(admin-tabs\)/_layout")
if [ -n "$LAYOUT_CHANGED" ]; then
  echo "Layout files changed: $LAYOUT_CHANGED"
  echo "Run: curl -s http://localhost:8081/brand and verify no visual regressions"
fi
```

More specifically: any PR touching a `*Header*.tsx` or `*layout.tsx` file should trigger a screenshot comparison via `vizor` or `sergei-playwright`.

### 7.3 Extend `/brand` Design System Page

`app/brand.tsx` already exists as a DEV-only gallery. Extend it with:

1. **Header showcase section** — render all active header variants (`HeaderBack`, `LandingHeader`, `AppHeader` mock) side by side so regressions are immediately visible
2. **Shell layout preview** — a miniature `AppShell` rendering with a fake `SidebarNav` + `AppHeader` top rail to confirm the desktop layout contract
3. **Component status table** — auto-generated from a `COMPONENT_REGISTRY` constant that marks components as `active | deprecated | dead` — this makes dead code visible in the browser without an audit

### 7.4 Hook Architecture

Create `lib/hooks/` directory with:

```
lib/hooks/
  useCities.ts          — caches /api/cities with SWR or React Query
  useAuthGuard.ts       — standardises if (!isAuthenticated) redirect
  useOtpRequest.ts      — wraps /api/auth/request-otp + verify-otp
  useFileUpload.ts      — wraps FormData + progress + error (replaces 3 implementations)
```

These hooks already exist as inline logic in 7, 9, 3, and 3 sites respectively. Extracting them eliminates the duplication flagged in §5.

### 7.5 Barrel Import Discipline

The `components/dashboard/index.ts` barrel causes tree-shaking failures — importing `{ DashboardGrid }` pulls in `DashboardHero` and `CaseTimeline` as well in some bundlers. Either:

- Remove the barrel and import directly by file path, **or**
- Add `"sideEffects": false` to `package.json` and confirm bundler respects named exports

The same applies to `components/ui/index.ts` and `components/chat/index.ts`.

---

*Audit produced by read-only static analysis. No files modified.*
