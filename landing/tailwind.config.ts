import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#1e3a8a',
          accent: '#b45309',
          bg: '#F8FAFC',
          surface: '#FFFFFF',
          text: '#0f172a',
          'text-secondary': '#64748B',
        },
      },
    },
  },
  plugins: [],
}

export default config
