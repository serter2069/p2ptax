export const colors = {
  // Brand — navy authority + amber accent
  primary: '#1e3a8a',      // blue-900 — deep navy
  accent: '#b45309',       // amber-700 — warm accent CTA
  background: '#F8FAFC',   // slate-50 — soft warm white
  surface: '#FFFFFF',       // pure white cards
  text: '#0f172a',          // slate-900 — dark text
  textSecondary: '#64748B', // slate-500 — muted secondary
  // Semantic
  error: '#DC2626',         // red-600
  success: '#059669',       // emerald-600
  warning: '#D97706',       // amber-600
} as const

export const tw = {
  primary: 'bg-blue-900',
  primaryText: 'text-blue-900',
  accent: 'bg-amber-700',
  accentText: 'text-amber-700',
  background: 'bg-slate-50',
  surface: 'bg-white',
  text: 'text-slate-900',
  textSecondary: 'text-slate-500',
  error: 'text-red-600',
  errorBg: 'bg-red-600',
  success: 'text-emerald-600',
  successBg: 'bg-emerald-600',
  warning: 'text-amber-600',
  warningBg: 'bg-amber-600',
} as const

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const

export const typography = {
  h1: 'text-3xl font-extrabold',
  h2: 'text-2xl font-bold',
  h3: 'text-lg font-semibold',
  body: 'text-base',
  caption: 'text-sm text-slate-500',
  small: 'text-xs text-slate-400',
} as const

export const radius = {
  sm: 'rounded-lg',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
  full: 'rounded-full',
} as const
