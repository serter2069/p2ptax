export const Colors = {
  // Backgrounds
  bgPrimary: '#F4FBFC',
  bgSecondary: '#EBF3FB',
  bgSurface: '#EBF3FB',
  bgCard: '#FFFFFF',

  // Text
  textPrimary: '#0F2447',
  textSecondary: '#4A6B88',
  textMuted: '#4A6B88',
  textAccent: '#1A5BA8',

  // Brand
  brandPrimary: '#1A5BA8',
  brandSecondary: '#1E3A6E',

  // Status
  statusSuccess: '#1A7848',
  statusWarning: '#f59e0b',
  statusError: '#B91C1C',
  statusInfo: '#1A5BA8',

  // Status background tints (for badges)
  statusBg: {
    success: '#e6f4ed',
    warning: '#fef3cd',
    error: '#fde8e8',
    info: '#e0ecf8',
    accent: '#dce8f5',
    familiar: '#dce8f5',
  },

  // Extended text
  textFamiliar: '#2E74CC',

  // Borders
  border: '#C0D0EA',
  borderLight: '#C0D0EA',
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
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

export const Typography = {
  fontFamily: {
    regular: undefined, // system default
    medium: undefined,
    bold: undefined,
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
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const Breakpoints = {
  tablet: 768,
  desktop: 1024,
} as const;
