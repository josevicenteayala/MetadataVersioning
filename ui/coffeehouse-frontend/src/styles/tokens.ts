/**
 * Warm Coffeehouse Theme Design Tokens
 * Feature: 003-warm-ui-theme
 *
 * TypeScript type definitions for design tokens.
 * These types mirror the CSS custom properties in tokens.css
 */

export interface WarmColorTokens {
  // Primary palette
  'header-bg': '#1E3932'
  'content-bg': '#F2F0EB'
  'card-bg': '#FFFFFF'

  // Accent colors
  'accent-primary': '#00704A'
  'accent-hover': '#005C3B'
  'accent-active': '#004D32'

  // Text colors
  'text-primary': '#1E1E1E'
  'text-secondary': '#6B6B6B'
  'text-inverse': '#FFFFFF'
  'text-accent': '#00704A'

  // Semantic colors
  success: '#00704A'
  error: '#D62828'
  warning: '#F4A100'
  info: '#1E3932'

  // Border colors
  'border-light': 'rgba(30, 57, 50, 0.12)'
  'border-medium': 'rgba(30, 57, 50, 0.24)'
}

export interface WarmTypographyTokens {
  // Font families
  'font-headline': '"Lora", "Georgia", serif'
  'font-body': '"Inter", "Segoe UI", system-ui, sans-serif'
  'font-mono': '"JetBrains Mono", "Consolas", monospace'

  // Font sizes
  'text-xs': '0.75rem'
  'text-sm': '0.875rem'
  'text-base': '1rem'
  'text-lg': '1.125rem'
  'text-xl': '1.25rem'
  'text-2xl': '1.5rem'
  'text-3xl': '1.875rem'
  'text-4xl': '2.25rem'

  // Font weights
  'font-normal': 400
  'font-medium': 500
  'font-semibold': 600
  'font-bold': 700

  // Line heights
  'leading-tight': 1.25
  'leading-normal': 1.5
  'leading-relaxed': 1.75
}

export interface WarmSpacingTokens {
  'space-1': '0.25rem'
  'space-2': '0.5rem'
  'space-3': '0.75rem'
  'space-4': '1rem'
  'space-5': '1.25rem'
  'space-6': '1.5rem'
  'space-8': '2rem'
  'space-10': '2.5rem'
  'space-12': '3rem'
  'space-16': '4rem'
}

export interface WarmBorderTokens {
  'radius-sm': '4px'
  'radius-md': '8px'
  'radius-lg': '12px'
  'radius-xl': '16px'
  'radius-full': '9999px'

  'shadow-sm': '0 1px 2px rgba(30, 57, 50, 0.05)'
  'shadow-md': '0 4px 6px rgba(30, 57, 50, 0.07)'
  'shadow-lg': '0 10px 25px rgba(30, 57, 50, 0.08)'
  'shadow-xl': '0 20px 40px rgba(30, 57, 50, 0.12)'
}

export interface WarmThemeTokens {
  colors: WarmColorTokens
  typography: WarmTypographyTokens
  spacing: WarmSpacingTokens
  borders: WarmBorderTokens
}

/**
 * CSS variable names for warm theme tokens
 * Use these for type-safe access to CSS custom properties
 */
export const warmTokenVars = {
  // Colors
  headerBg: '--warm-header-bg',
  contentBg: '--warm-content-bg',
  cardBg: '--warm-card-bg',
  accentPrimary: '--warm-accent-primary',
  accentHover: '--warm-accent-hover',
  accentActive: '--warm-accent-active',
  textPrimary: '--warm-text-primary',
  textSecondary: '--warm-text-secondary',
  textInverse: '--warm-text-inverse',
  textAccent: '--warm-text-accent',
  success: '--warm-success',
  error: '--warm-error',
  warning: '--warm-warning',
  info: '--warm-info',
  borderLight: '--warm-border-light',
  borderMedium: '--warm-border-medium',

  // Typography
  fontHeadline: '--warm-font-headline',
  fontBody: '--warm-font-body',
  fontMono: '--warm-font-mono',

  // Spacing
  space1: '--warm-space-1',
  space2: '--warm-space-2',
  space3: '--warm-space-3',
  space4: '--warm-space-4',
  space6: '--warm-space-6',
  space8: '--warm-space-8',

  // Borders & Shadows
  radiusSm: '--warm-radius-sm',
  radiusMd: '--warm-radius-md',
  radiusLg: '--warm-radius-lg',
  radiusFull: '--warm-radius-full',
  shadowSm: '--warm-shadow-sm',
  shadowMd: '--warm-shadow-md',
  shadowLg: '--warm-shadow-lg',
  shadowXl: '--warm-shadow-xl',
} as const

/**
 * Helper to get CSS variable value
 */
export function getCssVar(varName: keyof typeof warmTokenVars): string {
  return `var(${warmTokenVars[varName]})`
}
