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

// Warm Coffeehouse Theme Palette (003-warm-ui-theme)
const warmPalette = {
  // Primary palette
  headerBg: '#1E3932', // Dark green - header/navigation background
  contentBg: '#F2F0EB', // Warm cream - main content background
  cardBg: '#FFFFFF', // White - card backgrounds

  // Accent colors
  accent: '#00704A', // Green - primary buttons, highlights
  accentHover: '#005C3B', // Darker green - hover states
  accentActive: '#004D32', // Darkest green - active/pressed states

  // Text colors
  textPrimary: '#1E1E1E', // Dark charcoal - main text
  textSecondary: '#6B6B6B', // Medium gray - secondary text
  textInverse: '#FFFFFF', // White - text on dark backgrounds

  // Semantic colors
  success: '#00704A', // Green - success states
  error: '#D62828', // Warm red - error states
  warning: '#F4A100', // Amber/gold - warning states
  info: '#1E3932', // Dark green - info states

  // Border colors
  borderLight: 'rgba(30, 57, 50, 0.12)',
  borderMedium: 'rgba(30, 57, 50, 0.24)',
}

const config = {
  content: ['./index.html', './src/**/*.{ts,tsx,css}'],
  theme: {
    extend: {
      colors: {
        coffee: coffeePalette,
        warm: warmPalette,
      },
      fontFamily: {
        brand: ['"Playfair Display"', 'serif'],
        sans: ['"Inter"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'monospace'],
        // Warm theme typography
        headline: ['"Lora"', '"Georgia"', 'serif'],
        body: ['"Inter"', '"Segoe UI"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 10px 25px rgba(42, 18, 10, 0.08)',
        // Warm theme shadows
        'warm-sm': '0 1px 2px rgba(30, 57, 50, 0.05)',
        'warm-md': '0 4px 6px rgba(30, 57, 50, 0.07)',
        'warm-lg': '0 10px 25px rgba(30, 57, 50, 0.08)',
        'warm-xl': '0 20px 40px rgba(30, 57, 50, 0.12)',
      },
      borderRadius: {
        brand: '1.25rem',
        // Warm theme radii
        'warm-sm': '4px',
        'warm-md': '8px',
        'warm-lg': '12px',
        'warm-xl': '16px',
      },
      spacing: {
        // Warm theme layout
        'warm-container': '1200px',
      },
      maxWidth: {
        'warm-container': '1200px',
      },
    },
  },
  plugins: [],
} satisfies Config

export default config
