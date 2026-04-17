# SCREEN MAP: Etalon

## Design System

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| primary | #2563EB | Buttons, links, active tabs |
| primary-dark | #1D4ED8 | Button pressed state |
| secondary | #F3F4F6 | Secondary buttons, card backgrounds |
| background | #FFFFFF | Page background |
| surface | #F9FAFB | Card background, input background |
| text-primary | #111827 | Headlines, body text |
| text-secondary | #6B7280 | Captions, placeholders, hints |
| text-inverse | #FFFFFF | Text on primary buttons |
| border | #E5E7EB | Input borders, dividers |
| error | #EF4444 | Validation errors, destructive actions |
| success | #10B981 | Success messages, confirmations |
| warning | #F59E0B | Warning badges |

### Typography
| Style | Size | Weight | Usage |
|-------|------|--------|-------|
| h1 | 28px | 700 (bold) | Screen titles |
| h2 | 22px | 600 (semibold) | Section headers |
| h3 | 18px | 600 | Card titles |
| body | 16px | 400 (regular) | Main text |
| caption | 14px | 400 | Secondary info, timestamps |
| small | 12px | 400 | Badges, hints |

Font family: system default (San Francisco on iOS, Roboto on Android, system-ui on web)

### Spacing
| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon padding, badge padding |
| sm | 8px | Between icon and text |
| md | 16px | Standard padding, gap between elements |
| lg | 24px | Section spacing |
| xl | 32px | Screen padding top/bottom |

### Components (shared across all screens)

**Button (primary)**
- Background: primary, text: text-inverse
- Height: 48px, border-radius: 12px
- Full width on mobile
- Loading state: spinner replacing text
- Disabled state: opacity 0.5

**Button (secondary)**
- Background: secondary, text: text-primary
- Same dimensions as primary

**Input**
- Background: surface, border: border (1px)
- Height: 48px, border-radius: 10px, padding horizontal: md
- Focus: border becomes primary
- Error: border becomes error, helper text below in error color

**Card**
- Background: background, border: border (1px)
- Border-radius: 12px, padding: md
- Shadow: 0 1px 3px rgba(0,0,0,0.1)

**Avatar**
- Round, border-radius: 50%
- Sizes: sm (32px), md (48px), lg (72px)
- Fallback: initials on primary background

**Badge**
- Background: error, text: text-inverse
- Min-width: 20px, height: 20px, border-radius: 50%
- Font: small

**Empty State**
- Centered vertically
- Icon (64px, text-secondary), title (h3), subtitle (caption)

**Loading State**
- Skeleton shimmer blocks matching content layout

**Error State**
- Icon, message (body), button "Retry"

### Header patterns

**Header-Back**
- Left: "←" back button
- Center: title (h2)
- Height: 56px

**Header-Home**
- Left: logo or app name (h2)
- Right: icon buttons (notifications, etc.)
- Height: 56px

**Header-Search**
- Full-width search input
- Height: 56px

### TabBar
- 5 tabs, icons + labels (small)
- Active: primary color, inactive: text-secondary
- Height: 60px (+ safe area bottom)

---

## Screens

Statuses: `TODO` — not started | `IN PROGRESS` — being built | `DONE` — implemented, tsc passes, visually verified

### AUTH

---
**Screen: EmailScreen**
Status: DONE
Route: /(auth)/email
Access: public

Description: Email entry for login/registration (single flow, no separate register)

Layout:
  - Header: none
  - Body: centered vertically, padded horizontal xl
  - Footer: none

UI elements:
  - App logo (centered, 80px, margin-bottom xl)
  - Title "Sign In" (h1, centered)
  - Subtitle "Enter your email to continue" (caption, centered, margin-bottom lg)
  - Input email (keyboard type: email, autocapitalize: none)
  - Button primary "Continue" (margin-top lg)
  - Text link "Privacy Policy" / "Terms" (caption, centered, margin-top xl) → PrivacyScreen / TermsScreen

States:
  - Loading: button shows spinner after tap
  - Error: input border red + "Invalid email" below
  - Network error: toast "Connection error, try again"

Data: POST /api/auth/request-otp {email}
Response: {success: true}

Dependencies: none (entry point)

---
**Screen: OtpScreen**
Status: DONE
Route: /(auth)/otp
Access: public (but requires email from previous screen)

Description: Enter 6-digit OTP code sent to email

Layout:
  - Header: Header-Back, title "Verification"
  - Body: centered, padded horizontal xl
  - Footer: none

UI elements:
  - Text "Code sent to {email}" (body, centered)
  - 6 separate digit inputs (48x48 each, gap sm, auto-focus next)
  - Button primary "Verify" (margin-top lg)
  - Text link "Resend code" (caption, disabled for 60 sec, shows countdown)

States:
  - Loading: button spinner on verify
  - Error: all 6 inputs border red + "Wrong code" below
  - Resend: "Resend code" disabled, shows "Resend in 45s"
  - Success: navigate to HomeScreen

Data: POST /api/auth/verify-otp {email, code}
Response: {accessToken, refreshToken, user: {id, email, name}}

Dependencies: EmailScreen (passes email param)

---

### TABS

---
**Screen: HomeScreen**
Status: DONE
Route: /(tabs)/index
Access: auth required, roles: [USER, ADMIN]

Description: Main feed — list of listings/cards

Layout:
  - Header: Header-Home (logo left, notifications icon right with badge)
  - Body: vertical scrollable list
  - Footer: TabBar (Home active)

UI elements:
  - Card per listing: photo (aspect 16:9 top), title (h3), price bold (body), city (caption)
  - Card tap → ListingDetail
  - Pull-to-refresh
  - Infinite scroll (load 20 more on bottom)
  - Empty state: "No listings yet"
  - Loading state: 3 skeleton cards

Data: GET /api/listings?page=1&limit=20
Response: {items: [{id, title, price, photo, city}], total, hasMore}

Dependencies: none

---
**Screen: SearchScreen**
Status: DONE
Route: /(tabs)/search
Access: auth required, roles: [USER, ADMIN]

Description: Search listings by text query

Layout:
  - Header: Header-Search (input with magnifier icon, clear button)
  - Body: vertical scrollable list (same cards as Home)
  - Footer: TabBar (Search active)

UI elements:
  - Search input: placeholder "Search listings...", debounce 300ms
  - Results: same Card component as HomeScreen
  - Empty state (no query): "Start typing to search"
  - Empty state (no results): "Nothing found for '{query}'"
  - Loading state: skeleton cards

Data: GET /api/listings?q={query}&page=1&limit=20
Response: same as HomeScreen

Dependencies: none

---
**Screen: CreateScreen**
Status: DONE
Route: /(tabs)/create
Access: auth required, roles: [USER, ADMIN]

Description: Create a new listing

Layout:
  - Header: Header-Back, title "New Listing"
  - Body: scroll form
  - Footer: sticky Button primary "Publish" (over safe area)

UI elements:
  - Photo upload area: "+" button, grid of thumbnails (max 5), tap to remove
  - Input "Title" (required, max 100 chars)
  - Input "Price" (required, numeric keyboard, currency symbol)
  - Input "City" (required)
  - Textarea "Description" (optional, max 1000 chars, shows counter)
  - Button primary "Publish" (sticky bottom)

States:
  - Validation: required fields highlighted on submit attempt
  - Uploading photos: progress bar per photo
  - Publishing: button spinner
  - Success: navigate to HomeScreen + toast "Published!"
  - Error: toast "Failed to publish, try again"

Data:
  - Upload: POST /api/upload (multipart/form-data) → {url}
  - Create: POST /api/listings {title, price, city, description, photos[]}
Response: {id, ...listing}

Dependencies: none

---
**Screen: MessagesScreen**
Status: DONE
Route: /(tabs)/messages
Access: auth required, roles: [USER, ADMIN]

Description: List of conversations

Layout:
  - Header: Header-Home, title "Messages"
  - Body: vertical list of conversations
  - Footer: TabBar (Messages active)

UI elements:
  - Conversation row: avatar (sm), name (h3), last message preview (caption, 1 line truncate), time (caption, right-aligned)
  - Unread: badge on avatar, name bold, message bold
  - Tap → ChatDetail (not in etalon yet, placeholder screen)
  - Empty state: "No messages yet"
  - Loading state: skeleton rows

Data: GET /api/conversations
Response: [{id, participant: {id, name, avatar}, lastMessage: {content, createdAt}, unreadCount}]

Dependencies: none

---
**Screen: ProfileScreen**
Status: DONE
Route: /(tabs)/profile
Access: auth required, roles: [USER, ADMIN]

Description: Current user profile

Layout:
  - Header: none (profile info IS the header)
  - Body: scroll
  - Footer: TabBar (Profile active)

UI elements:
  - Avatar (lg, centered, margin-top xl)
  - Name (h1, centered)
  - Email (caption, centered, margin-bottom lg)
  - Menu list (full-width rows, icon left, chevron right):
    - "Settings" → SettingsScreen
    - "Notifications" → NotificationsScreen
    - "Privacy Policy" → PrivacyScreen
    - "Terms of Use" → TermsScreen
  - Button secondary "Sign Out" (margin-top lg) → clears tokens → EmailScreen

Data: GET /api/users/me
Response: {id, name, email, avatar, role, createdAt}

Dependencies: none

---

### DETAIL / MODALS

---
**Screen: ListingDetail**
Status: DONE
Route: /listing/[id]
Access: public (viewable without auth)

Description: Full listing details

Layout:
  - Header: Header-Back, title "Listing"
  - Body: scroll
  - Footer: sticky Button primary "Message Author"

UI elements:
  - Photo gallery: horizontal swipe, dot indicators, aspect 4:3
  - Title (h1, margin-top md)
  - Price (h2, primary color)
  - City (caption, icon pin left)
  - Divider
  - Description (body, margin-top md)
  - Divider
  - Author block: avatar (md) + name (h3) + "Member since {date}" (caption)
  - Button primary "Message Author" (sticky bottom)
    - If not authenticated → redirect to EmailScreen
    - If authenticated → POST /api/conversations {participantId} → navigate to chat

States:
  - Loading: full-screen skeleton
  - Error: Error State with retry
  - Own listing: button changes to "Edit" → CreateScreen prefilled

Data: GET /api/listings/:id
Response: {id, title, price, photos[], description, city, author: {id, name, avatar, createdAt}}

Dependencies: HomeScreen, SearchScreen (navigation source)

---
**Screen: SettingsScreen**
Status: DONE
Route: /settings
Access: auth required, roles: [USER, ADMIN]

Description: Edit profile settings

Layout:
  - Header: Header-Back, title "Settings"
  - Body: scroll form
  - Footer: none

UI elements:
  - Avatar (lg, centered) with "Change Photo" text link below
  - Input "Name" (prefilled with current name)
  - Input "Email" (disabled/readonly, shows current email)
  - Button primary "Save" (margin-top lg)
  - Divider (margin-top xl)
  - Danger zone: Button text/link "Delete Account" (error color)

States:
  - Save loading: button spinner
  - Save success: toast "Saved!" + navigate back
  - No changes: button disabled

Data:
  - Read: GET /api/users/me (prefill)
  - Update: PATCH /api/users/me {name, avatar}
Response: {id, name, email, avatar}

Dependencies: ProfileScreen

---
**Screen: NotificationsScreen**
Status: DONE
Route: /notifications
Access: auth required, roles: [USER, ADMIN]

Description: List of notifications

Layout:
  - Header: Header-Back, title "Notifications"
  - Body: vertical list
  - Footer: none

UI elements:
  - Notification row: icon (by type), text (body), time (caption)
  - Unread: background surface, left border primary (3px)
  - Tap: mark as read + navigate to relevant screen
  - Empty state: "No notifications"
  - "Mark all read" text link in header right

Data: GET /api/notifications
Response: [{id, type, text, read, createdAt, targetRoute}]

Dependencies: ProfileScreen, HomeScreen (header badge)

---

### LEGAL

---
**Screen: PrivacyScreen**
Status: DONE
Route: /legal/privacy
Access: public

Description: Privacy policy (static content)

Layout:
  - Header: Header-Back, title "Privacy Policy"
  - Body: scroll, padded horizontal md
  - Footer: none

UI elements:
  - Static markdown/text content
  - Sections with h2 headers

Data: none (static)

Dependencies: SettingsScreen, EmailScreen

---
**Screen: TermsScreen**
Status: DONE
Route: /legal/terms
Access: public

Description: Terms of use (static content)

Layout:
  - Header: Header-Back, title "Terms of Use"
  - Body: scroll, padded horizontal md
  - Footer: none

UI elements:
  - Static markdown/text content
  - Sections with h2 headers

Data: none (static)

Dependencies: SettingsScreen, EmailScreen

---

## Navigation Map

```
EmailScreen → OtpScreen → HomeScreen (tabs)

TabBar:
  Home | Search | Create | Messages | Profile

HomeScreen → ListingDetail
SearchScreen → ListingDetail
ListingDetail → EmailScreen (if not auth) / Chat (if auth)
ProfileScreen → SettingsScreen / NotificationsScreen / PrivacyScreen / TermsScreen
SettingsScreen → PrivacyScreen / TermsScreen
```

## Access Matrix

| Screen | Public | USER | ADMIN |
|--------|--------|------|-------|
| EmailScreen | yes | redirect to Home | redirect to Home |
| OtpScreen | yes | redirect to Home | redirect to Home |
| HomeScreen | no | yes | yes |
| SearchScreen | no | yes | yes |
| CreateScreen | no | yes | yes |
| MessagesScreen | no | yes | yes |
| ProfileScreen | no | yes | yes |
| ListingDetail | yes | yes | yes |
| SettingsScreen | no | yes | yes |
| NotificationsScreen | no | yes | yes |
| PrivacyScreen | yes | yes | yes |
| TermsScreen | yes | yes | yes |
