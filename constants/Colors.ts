import palette from './palette.js';

const p = palette as Record<string, string>;

export const Colors = {
  // Backgrounds
  bgPrimary: p.bgPrimary,
  bgSecondary: p.bgSecondary,
  bgSurface: p.bgSurface,
  bgCard: p.bgCard,

  // Text
  textPrimary: p.textPrimary,
  textSecondary: p.textSecondary,
  textMuted: p.textMuted,

  // Brand (canonical)
  brandPrimary: p.brandPrimary,
  brandPrimaryHover: p.brandPrimaryHover,
  brandSecondary: p.brandSecondary,

  // Status
  statusSuccess: p.statusSuccess,
  statusWarning: p.statusWarning,
  statusError: p.statusError,
  statusErrorHover: p.statusErrorHover,
  statusNeutral: p.statusNeutral,

  // Ratings / alerts
  amber: p.amber,
  warning: p.warning,
  successBg: p.successBg,

  // Utilities
  white: p.white,

  // Status background tints (for badges) — grouped view of the flat palette keys
  statusBg: {
    success: p.statusBgSuccess,
    warning: p.statusBgWarning,
    error: p.statusBgError,
    info: p.statusBgInfo,
    neutral: p.statusBgNeutral,
  },

  // Borders
  border: p.border,
  borderLight: p.borderLight,
} as const;

export const Spacing = {
  xxs: 3,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
} as const;

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

export const Typography = {
  fontFamily: {
    regular: 'Nunito_400Regular',
    medium: 'Nunito_500Medium',
    semibold: 'Nunito_600SemiBold',
    bold: 'Nunito_700Bold',
    extrabold: 'Nunito_800ExtraBold',
  },
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    title: 22,
    display: 36,
    jumbo: 48,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const BorderRadius = {
  sm: 3,
  md: 6,
  lg: 10,
  xl: 16,
  xxl: 24,
  full: 9999,
  btn: 12,
  card: 14,
  input: 10,
} as const;

export const Breakpoints = {
  tablet: 768,
  desktop: 1024,
} as const;
