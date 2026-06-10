import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'cafe-bg': '#0d0805',
        'cafe-accent': '#c8922a',
        'cafe-light': '#f5d07a',
        'cafe-muted': '#7a5c3a',
        'cafe-dark': '#2a1a0d',
        'cafe-green': '#4a7c59',
      },
    },
  },
  plugins: [],
}

export default config
