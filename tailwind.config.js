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
        bgPrimary: '#0f0f1a',
        bgSecondary: '#1a1a2e',
        bgSurface: '#16213e',
        bgCard: '#1e1e35',
        textPrimary: '#e2e8f0',
        textSecondary: '#94a3b8',
        textMuted: '#64748b',
        textAccent: '#a78bfa',
        brandPrimary: '#6366f1',
        brandSecondary: '#8b5cf6',
        statusSuccess: '#4CAF50',
        statusWarning: '#f59e0b',
        statusError: '#ef4444',
        statusInfo: '#3b82f6',
      },
    },
  },
  plugins: [],
};
