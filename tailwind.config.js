/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './screens/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bgPrimary: '#FFFFFF',
        bgSecondary: '#F0F9FF',
        bgSurface: '#F0F9FF',
        bgCard: '#FFFFFF',
        textPrimary: '#0C1A2E',
        textSecondary: '#475569',
        textMuted: '#94A3B8',
        textAccent: '#0284C7',
        brandPrimary: '#0284C7',
        brandSecondary: '#0369A1',
        statusSuccess: '#15803D',
        statusWarning: '#D97706',
        statusError: '#DC2626',
        statusInfo: '#0284C7',
      },
    },
  },
  plugins: [],
};
