export const Colors = {
  // Backgrounds
  bgPrimary: '#0f0f1a',
  bgSecondary: '#1a1a2e',
  bgSurface: '#16213e',
  bgCard: '#1e1e35',

  // Text
  textPrimary: '#e2e8f0',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  textAccent: '#a78bfa',

  // Brand
  brandPrimary: '#6366f1',
  brandSecondary: '#8b5cf6',

  // Status
  statusSuccess: '#4CAF50',
  statusWarning: '#f59e0b',
  statusError: '#ef4444',
  statusInfo: '#3b82f6',

  // Status background tints (for badges)
  statusBg: {
    success: '#1a3a1e',
    warning: '#3a2c10',
    error: '#3a1414',
    info: '#132240',
    accent: '#2a1f4a',
    familiar: '#2a2070',
  },

  // Extended text
  textFamiliar: '#a5b4fc',

  // Borders
  border: '#2d2d4a',
  borderLight: '#3d3d5c',
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
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;
