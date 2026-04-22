/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./contexts/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontSize: {
        xs: ['13px', { lineHeight: '18px' }],
      },
      colors: {
        accent: '#2256c2',
        'accent-soft': '#e8eefb',
        'accent-soft-ink': '#1b3d8a',
        'text-base': '#0b1424',
        'text-mute': '#525a6b',
        'text-dim': '#8a93a3',
        surface: '#ffffff',
        surface2: '#fafbfc',
        border: '#e8ebf0',
        'border-strong': '#c7ccd4',
        danger: '#c6365a',
        'danger-soft': '#fff0f3',
        success: '#1f8a5e',
        'success-soft': '#ecfdf5',
        warning: '#d97706',
        'warning-soft': '#fef3c7',
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '10px',
        lg: '16px',
      },
    },
  },
  plugins: [],
};
