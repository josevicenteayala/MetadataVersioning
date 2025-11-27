import type { Config } from 'tailwindcss'

const coffeePalette = {
  foam: '#FEF9F4',
  crema: '#F0DFCE',
  latte: '#E2C4A8',
  espresso: '#402218',
  mocha: '#6F4F37',
  bean: '#2A120A',
  moss: '#4E6F52',
  matcha: '#7EA172',
  cherry: '#C04B3E',
  amber: '#D79F62',
}

const config = {
  content: ['./index.html', './src/**/*.{ts,tsx,css}'],
  theme: {
    extend: {
      colors: {
        coffee: coffeePalette,
      },
      fontFamily: {
        brand: ['"Playfair Display"', 'serif'],
        sans: ['"Inter"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 10px 25px rgba(42, 18, 10, 0.08)',
      },
      borderRadius: {
        brand: '1.25rem',
      },
    },
  },
  plugins: [],
} satisfies Config

export default config
