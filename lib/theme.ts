export const colors = {
  // Brand — staging palette
  primary: '#2256c2',        // accent/primary
  accent: '#2256c2',         // accent (same as primary)
  accentSoft: '#e8eefb',     // accent-soft
  accentSoftInk: '#1b3d8a',  // accent-soft-ink
  background: '#ffffff',     // bg
  surface: '#ffffff',        // pure white cards
  surface2: '#fafbfc',       // surface-2
  text: '#0b1424',           // text
  textSecondary: '#525a6b',  // text-mute
  textMuted: '#8a93a3',      // text-dim
  // Borders
  border: '#e8ebf0',         // border token
  borderLight: '#e8ebf0',    // alias for border
  borderStrong: '#c7ccd4',   // border-strong
  // Inputs
  placeholder: '#8a93a3',    // text-dim
  // Semantic
  danger: '#c6365a',         // danger
  error: '#c6365a',          // alias for danger
  errorBg: '#fef2f2',
  success: '#1f8a5e',
  warning: '#d97706',
} as const

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

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const

export const typography = {
  h1: 'text-3xl font-extrabold',
  h2: 'text-2xl font-bold',
  h3: 'text-lg font-semibold',
  body: 'text-base',
  caption: 'text-sm text-text-mute',
  small: 'text-xs text-text-dim',
} as const

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
