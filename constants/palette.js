// Single source of truth for color palette.
// Consumed by:
//   - constants/Colors.ts (re-exported with `as const` literal types)
//   - tailwind.config.js (spread into theme.extend.colors)
//
// Keep this file free of TS syntax so tailwind (Node, no ts-loader) can require it.
// Adding / removing a color here updates BOTH the JS runtime and the Tailwind palette.

module.exports = {
  // Backgrounds
  bgPrimary: '#FFFFFF',
  bgSecondary: '#F0F9FF',
  bgSurface: '#F0F9FF',
  bgCard: '#FFFFFF',

  // Text
  textPrimary: '#0C1A2E',
  textSecondary: '#475569',
  textMuted: '#94A3B8',

  // Brand (canonical)
  brandPrimary: '#0284C7',
  brandPrimaryHover: '#0369A1',
  brandSecondary: '#0369A1',

  // Status
  statusSuccess: '#15803D',
  statusWarning: '#D97706',
  statusError: '#DC2626',
  statusErrorHover: '#B91C1C',
  statusNeutral: '#6B7280',

  // Ratings / alerts
  amber: '#F59E0B',
  warning: '#F59E0B',
  successBg: '#DCFCE7',

  // Utilities
  white: '#FFFFFF',

  // Status background tints (flat — Tailwind cannot consume nested objects directly
  // without namespaced class names. Colors.ts re-groups these under statusBg.*)
  statusBgSuccess: '#DCFCE7',
  statusBgWarning: '#FEF9C3',
  statusBgError: '#FEE2E2',
  statusBgInfo: '#E0F2FE',
  statusBgNeutral: '#F3F4F6',

  // Borders
  border: '#BAE6FD',
  borderLight: '#E0F2FE',
};
