# P2PTax — Reference Patterns

Reference page: `app/(tabs)/index.tsx` (landing/home screen)

## Typography
- **Primary font**: Geist — used across all UI (169 nodes), sizes: 12–60px
- **Mono font**: JetBrains Mono — used for codes/numbers (121 nodes), sizes: 10–15px
- Max 2 font families throughout the app

## Color Palette
- **Background**: `#ffffff` (page), `#fafbfc` (card surfaces)
- **Primary text**: `#0b1424` (18.42:1 contrast)
- **Secondary text**: `#525a6b` (6.92:1 contrast)
- **Muted text**: `#8a93a3` (3.10:1 — avoid for body copy)
- **Primary CTA**: `#1f4cb0` bg / `#ffffff` text (7.72:1 contrast)
- **Secondary CTA**: `#2256c2` bg / `#ffffff` text (6.61:1 contrast)
- **Nav background**: `#ffffff`

## Layout Patterns
- Mobile-first, max-width 430px on mobile
- Desktop: 1440px wide, centered content
- Navigation: top navbar with logo + auth CTA
- Hero: search widget (city + service type + find button)
- Specialist cards: horizontal scroll on mobile, grid on desktop
- City chips: horizontal scroll list

## Interactive Components
- **Primary button**: blue `#1f4cb0` bg, white text, rounded
- **Outline/ghost**: white bg, dark text, border
- **Chip/filter**: `#fafbfc` bg, `#525a6b` text
- **Search inputs**: white bg with border, placeholder in muted

## Accessibility
- All primary buttons WCAG AA compliant
- `#8a93a3` on white = 3.10:1 — FAIL, avoid for interactive text
- Minimum touch targets on mobile: 44px

## Key Screens (27 total)
- Landing/Home: `app/(tabs)/index.tsx`
- Messages: `app/(tabs)/messages.tsx`
- Requests: `app/(tabs)/requests.tsx`
- Public requests: `app/(tabs)/public-requests.tsx`
- Auth flow: `app/auth/`
- Specialist profiles: `app/specialists/`
- Admin panel: `app/(admin-tabs)/`
