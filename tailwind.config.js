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
        bgPrimary: '#F4FBFC',
        bgSecondary: '#EBF3FB',
        bgSurface: '#EBF3FB',
        bgCard: '#FFFFFF',
        textPrimary: '#0F2447',
        textSecondary: '#4A6B88',
        textMuted: '#4A6B88',
        textAccent: '#1A5BA8',
        brandPrimary: '#1A5BA8',
        brandSecondary: '#1E3A6E',
        statusSuccess: '#1A7848',
        statusWarning: '#f59e0b',
        statusError: '#B91C1C',
        statusInfo: '#1A5BA8',
      },
    },
  },
  plugins: [],
};
