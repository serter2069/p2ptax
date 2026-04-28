/**
 * Unified primary blue — #2256c2 (landing tone).
 *
 * Issue GH-1288: historically the app drifted between multiple shades of
 * blue (#2e5bff, #2256c2, #3b5bdb, #1e40af). The landing marketing site
 * is already in market with #2256c2, so it's the single source of truth.
 * NEVER hardcode a different blue hex in app/ or components/ — always
 * import `colors.primary` (or the Tailwind `accent` token) from here.
 */
const PRIMARY_BLUE = '#2256c2' as const

export const colors = {
  // Brand — staging palette
  primary: PRIMARY_BLUE,     // accent/primary (single source of truth)
  accent: PRIMARY_BLUE,      // accent (same as primary)
  accentSoft: '#e8eefb',     // accent-soft
  accentSoftInk: '#1b3d8a',  // accent-soft-ink
  // Landing hero tints (iter12 phase-b) — pale brand washes
  accentTintBg: '#f6f9ff',     // hero section background (near-white blue tint)
  accentTintShape: '#dce6fa',  // decorative shape on hero (slightly stronger blue tint)
  // Raw neutrals (iter12 phase-b) — kept explicit so shared components stop
  // minting fresh #fff / #000 literals; use these instead.
  white: '#ffffff',
  black: '#000000',
  background: '#ffffff',     // bg (alias of white)
  surface: '#ffffff',        // pure white cards (alias of white)
  surface2: '#fafbfc',       // surface-2
  text: '#0b1424',           // text
  textSecondary: '#525a6b',  // text-mute
  textMuted: '#6b7385',      // text-dim (4.63:1 on white — WCAG AA)
  // Borders
  border: '#e8ebf0',         // border token
  borderLight: '#e8ebf0',    // alias for border
  borderStrong: '#c7ccd4',   // border-strong
  // Inputs
  placeholder: '#6b7385',    // text-dim (4.63:1 on white — WCAG AA)
  // Semantic
  danger: '#c6365a',         // danger
  error: '#c6365a',          // alias for danger
  errorBg: '#fef2f2',
  success: '#1f8a5e',
  warning: '#d97706',
  dangerSoft: '#fef2f2',
  // Semantic "ink" tones — saturated text on soft-tinted chips
  warningInk: '#b45309',        // amber-700 on yellowSoft chip
  warningInkStrong: '#92400e',  // amber-800 on yellowSoft (higher emphasis)
  dangerInk: '#b91c1c',         // red-700 on dangerSoftAlt chip
  // Extra soft backgrounds (iter12 phase-b consolidation)
  dangerSoftAlt: '#fee2e2',   // red-100 (FearTimeline "red" step)
  warningTintBg: '#fffbf2',   // warm amber section bg (FearTimeline wrapper)
  successSoft: '#d1fae5',     // green-100 (same hue as roleAccent.specialist.soft)
  successBgTint: '#ecfdf5',   // emerald-50 (inline "онлайн" chip bg)
  // Soft backgrounds for status/category chips
  indigoSoft: '#e0e7ff',
  pinkSoft: '#fce7f3',
  greenSoft: '#dcfce7',
  yellowSoft: '#fef3c7',
  cyanSoft: '#f0fdfa',
  limeSoft: '#f0fdf4',
  // Extended
  blue300: '#93c5fd',
  blue500: '#3b82f6',
} as const

/**
 * Gray scale — Tailwind-compatible neutrals used for disabled states,
 * muted chrome, separators. Issue GH-1290: disabled buttons must use
 * `gray.200` bg + `gray.400` text for sufficient contrast against the
 * active primary (so the eye can still tell "can press" vs "can't").
 */
export const gray = {
  50:  '#f9fafb',
  100: '#f3f4f6',
  200: '#e5e7eb',
  300: '#d1d5db',
  400: '#9ca3af',
  500: '#6b7280',
  600: '#4b5563',
  700: '#374151',
  800: '#1f2937',
  900: '#111827',
} as const

/**
 * Role-signalling accents (issue GH-1289). Every authenticated user belongs
 * to exactly one role tier; the header + key chrome tinted accordingly so
 * three portals stop looking like a single template with swapped H1.
 *
 *   client      blue (inherits primary) — default, safest choice
 *   specialist  emerald — "active professional" signal
 *   admin       amber — "internal ops, handle with care"
 */
export const roleAccent = {
  client:     { strong: PRIMARY_BLUE, soft: '#e8eefb', ink: '#ffffff', label: 'Клиент' },
  specialist: { strong: PRIMARY_BLUE, soft: '#e8eefb', ink: '#ffffff', label: 'Специалист' },
  admin:      { strong: '#d97706',    soft: '#fef3c7', ink: '#ffffff', label: 'Админ' },
} as const

export type RoleAccentKey = keyof typeof roleAccent

export const tw = {
  primary: 'bg-accent',
  primaryText: 'text-accent',
  accent: 'bg-accent',
  accentText: 'text-accent',
  background: 'bg-white',
  surface: 'bg-white',
  text: 'text-text-base',
  textSecondary: 'text-text-mute',
  error: 'text-danger',
  errorBg: 'bg-danger',
  success: 'text-success',
  successBg: 'bg-success',
  warning: 'text-amber-600',
  warningBg: 'bg-amber-600',
} as const

/**
 * Spacing scale — single source of truth for padding / margin / gap.
 *
 * Use these tokens instead of hardcoded numbers to keep rhythm consistent
 * across desktop and mobile (Gemini critique flagged spacing rhythm 4/10).
 *
 *   xs    4   hairline gaps, icon offsets
 *   sm    8   chip padding, compact rows
 *   md   12   tight vertical stacks, list-item padding
 *   base 16   default content padding, section gaps
 *   lg   24   card padding, column gaps
 *   xl   32   section padding on desktop
 *   xxl  48   page top/bottom margins on desktop
 *   xxxl 64   hero sections, wide separators
 *
 * NOTE: `md` was historically 16. To avoid breaking existing screens that
 * rely on that, we keep `md` as an alias; `base` is the canonical 16. Use
 * `base` in new code.
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16, // legacy alias (canonical is `base`) — migrate over time
  base: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const

export const typography = {
  h1: 'text-3xl font-extrabold',
  h2: 'text-2xl font-bold',
  h3: 'text-lg font-semibold',
  body: 'text-base',
  caption: 'text-sm text-text-mute',
  small: 'text-xs text-text-dim',
} as const

/**
 * Numeric typography scale — single source of truth for font-size /
 * line-height / weight / letter-spacing.
 *
 * Pro Flash critique 20260423 flagged "typography scale 2/10". This
 * formalises h1..caption so headings stop drifting between screens.
 *
 * Usage (inline):
 *   import { textStyle } from "@/lib/theme"
 *   <Text style={textStyle.h1}>Заголовок</Text>
 *
 * Usage (shared Text component):
 *   import { Text } from "@/components/ui"
 *   <Text variant="h1">Заголовок</Text>
 */
export const textStyle = {
  h1: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700' as const,
    letterSpacing: -0.25,
  },
  h3: { fontSize: 22, lineHeight: 30, fontWeight: '600' as const },
  h4: { fontSize: 18, lineHeight: 26, fontWeight: '600' as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodyBold: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const },
  small: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
} as const

export type TextVariant = keyof typeof textStyle

export const radius = {
  sm: 'rounded',
  md: 'rounded-lg',
  lg: 'rounded-2xl',
  full: 'rounded-full',
} as const

export const radiusValue = {
  sm: 6,
  md: 10,    // inputs, buttons
  lg: 16,    // cards
  xl: 24,
  full: 9999, // pills, badges
} as const

// Cyclic palette for generated avatars — use index % AVATAR_COLORS.length
export const AVATAR_COLORS = [
  '#3b82f6', // blue
  '#ec4899', // pink
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
] as const

// Font size scale — numeric values for inline style={{ fontSize }}
export const fontSizeValue = {
  xs: 10,    // micro labels, decorative bullets
  sm: 11,    // compact chips, secondary captions
  tabBar: 12, // tab bar labels
  md: 15,    // search inputs, secondary body
  base: 16,  // primary inputs, body text
  xl: 24,    // OTP digits, display numbers
} as const

// Shadow color tokens
export const shadowColor = {
  dark: '#000000',   // standard card/modal shadow
  accent: 'rgba(34,86,194,0.1)', // accent glow
  heroDeep: '#1a2b4a', // deep navy — landing hero card lift shadow
} as const

// Semantic overlay tokens — for rgba on colored backgrounds.
// NOTE: white-on-#2256c2 hits WCAG AA only at >=92% opacity. Hero subcopy
// uses white90 (passes) instead of the older white75 (4.48:1, fails).
// Unified responsive breakpoint — desktop ≥ 768px, mobile < 768px.
// Use this constant everywhere; do NOT hardcode 640 or other values.
export const BREAKPOINT = 768;

export const overlay = {
  white10: 'rgba(255,255,255,0.1)',
  white15: 'rgba(255,255,255,0.15)',
  white30: 'rgba(255,255,255,0.3)',
  white50: 'rgba(255,255,255,0.5)',
  white70: 'rgba(255,255,255,0.7)',
  white75: 'rgba(255,255,255,0.75)',
  white80: 'rgba(255,255,255,0.8)',
  white85: 'rgba(255,255,255,0.85)',
  white90: 'rgba(255,255,255,0.92)',  // WCAG AA on accent (>=4.5:1)
  white20: 'rgba(255,255,255,0.2)',
  accent10: 'rgba(34,86,194,0.1)',
  accent20: 'rgba(34,86,194,0.2)',  // focus-ring tint (web)
  dark15: 'rgba(0,0,0,0.15)',  // image placeholder icon tint
} as const
