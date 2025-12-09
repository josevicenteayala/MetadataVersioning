# Data Model: Warm Coffeehouse UI Theme

**Feature**: 003-warm-ui-theme  
**Date**: 2025-12-09  
**Status**: Complete

## Overview

This document defines the design token schema for the Warm Coffeehouse UI Theme. Since this is a frontend styling feature, the "data model" represents CSS custom properties (design tokens) and TypeScript type definitions for theme configuration.

## Design Token Schema

### Color Tokens

```typescript
interface WarmColorTokens {
  // Primary palette
  'header-bg': '#1E3932';      // Dark green - header/navigation background
  'content-bg': '#F2F0EB';     // Warm cream - main content background
  'card-bg': '#FFFFFF';        // White - card backgrounds
  
  // Accent colors
  'accent-primary': '#00704A'; // Green - primary buttons, highlights
  'accent-hover': '#005C3B';   // Darker green - hover states
  'accent-active': '#004D32';  // Darkest green - active/pressed states
  
  // Text colors
  'text-primary': '#1E1E1E';   // Dark charcoal - main text
  'text-secondary': '#6B6B6B'; // Medium gray - secondary text
  'text-inverse': '#FFFFFF';   // White - text on dark backgrounds
  'text-accent': '#00704A';    // Green - links, highlighted text
  
  // Semantic colors
  'success': '#00704A';        // Green - success states
  'error': '#D62828';          // Warm red - error states
  'warning': '#F4A100';        // Amber/gold - warning states
  'info': '#1E3932';           // Dark green - info states
  
  // Border colors
  'border-light': 'rgba(30, 57, 50, 0.12)';  // Subtle green tint
  'border-medium': 'rgba(30, 57, 50, 0.24)'; // Medium green tint
}
```

### Typography Tokens

```typescript
interface WarmTypographyTokens {
  // Font families
  'font-headline': '"Lora", "Georgia", serif';
  'font-body': '"Inter", "Segoe UI", system-ui, sans-serif';
  'font-mono': '"JetBrains Mono", "Consolas", monospace';
  
  // Font sizes (rem)
  'text-xs': '0.75rem';    // 12px
  'text-sm': '0.875rem';   // 14px
  'text-base': '1rem';     // 16px
  'text-lg': '1.125rem';   // 18px
  'text-xl': '1.25rem';    // 20px
  'text-2xl': '1.5rem';    // 24px
  'text-3xl': '1.875rem';  // 30px
  'text-4xl': '2.25rem';   // 36px
  
  // Font weights
  'font-normal': 400;
  'font-medium': 500;
  'font-semibold': 600;
  'font-bold': 700;
  
  // Line heights
  'leading-tight': 1.25;
  'leading-normal': 1.5;
  'leading-relaxed': 1.75;
}
```

### Spacing Tokens

```typescript
interface WarmSpacingTokens {
  // Base unit: 8px
  'space-1': '0.25rem';   // 4px
  'space-2': '0.5rem';    // 8px
  'space-3': '0.75rem';   // 12px
  'space-4': '1rem';      // 16px
  'space-5': '1.25rem';   // 20px
  'space-6': '1.5rem';    // 24px
  'space-8': '2rem';      // 32px
  'space-10': '2.5rem';   // 40px
  'space-12': '3rem';     // 48px
  'space-16': '4rem';     // 64px
}
```

### Border & Shadow Tokens

```typescript
interface WarmBorderTokens {
  // Border radius
  'radius-sm': '4px';
  'radius-md': '8px';     // Buttons
  'radius-lg': '12px';    // Cards
  'radius-xl': '16px';
  'radius-full': '9999px'; // Pills
  
  // Box shadows
  'shadow-sm': '0 1px 2px rgba(30, 57, 50, 0.05)';
  'shadow-md': '0 4px 6px rgba(30, 57, 50, 0.07)';
  'shadow-lg': '0 10px 25px rgba(30, 57, 50, 0.08)';
  'shadow-xl': '0 20px 40px rgba(30, 57, 50, 0.12)';
}
```

## Component Token Mapping

### Button Component

| Variant | Background | Text | Border | Hover BG |
|---------|------------|------|--------|----------|
| Primary | `accent-primary` | `text-inverse` | none | `accent-hover` |
| Secondary | transparent | `accent-primary` | `accent-primary` | `rgba(0,112,74,0.08)` |
| Ghost | transparent | `text-primary` | none | `rgba(30,30,30,0.05)` |
| Danger | `error` | `text-inverse` | none | `#B82020` |

### Card Component

| Property | Token |
|----------|-------|
| Background | `card-bg` |
| Border | `border-light` |
| Border Radius | `radius-lg` (12px) |
| Shadow | `shadow-lg` |
| Padding | `space-6` (24px) |

### Header Component

| Property | Token |
|----------|-------|
| Background | `header-bg` |
| Text | `text-inverse` |
| Height | `space-16` (64px) |
| Logo Font | `font-headline` |
| Nav Font | `font-body` |

### Step Indicator Component

```typescript
interface StepIndicatorTokens {
  // Circle dimensions
  circleSize: '2rem';          // 32px
  circleBorder: '2px solid';
  
  // Colors by state
  upcoming: {
    circleBg: 'transparent';
    circleBorder: 'border-medium';
    numberColor: 'text-secondary';
    labelColor: 'text-secondary';
  };
  current: {
    circleBg: 'accent-primary';
    circleBorder: 'accent-primary';
    numberColor: 'text-inverse';
    labelColor: 'text-primary';
  };
  complete: {
    circleBg: 'accent-primary';
    circleBorder: 'accent-primary';
    numberColor: 'text-inverse';  // or checkmark icon
    labelColor: 'text-primary';
  };
  
  // Connector line
  lineHeight: '2px';
  lineColor: 'border-medium';
  lineCompleteColor: 'accent-primary';
}
```

## CSS Custom Properties (tokens.css)

```css
:root {
  /* Colors - Primary */
  --warm-header-bg: #1E3932;
  --warm-content-bg: #F2F0EB;
  --warm-card-bg: #FFFFFF;
  
  /* Colors - Accent */
  --warm-accent: #00704A;
  --warm-accent-hover: #005C3B;
  --warm-accent-active: #004D32;
  
  /* Colors - Text */
  --warm-text-primary: #1E1E1E;
  --warm-text-secondary: #6B6B6B;
  --warm-text-inverse: #FFFFFF;
  
  /* Colors - Semantic */
  --warm-success: #00704A;
  --warm-error: #D62828;
  --warm-warning: #F4A100;
  --warm-info: #1E3932;
  
  /* Typography */
  --warm-font-headline: 'Lora', 'Georgia', serif;
  --warm-font-body: 'Inter', 'Segoe UI', system-ui, sans-serif;
  
  /* Borders */
  --warm-radius-button: 8px;
  --warm-radius-card: 12px;
  --warm-border-light: rgba(30, 57, 50, 0.12);
  
  /* Shadows */
  --warm-shadow-card: 0 10px 25px rgba(30, 57, 50, 0.08);
}
```

## Tailwind Config Extension

```typescript
// tailwind.config.ts
const warmPalette = {
  header: '#1E3932',
  content: '#F2F0EB',
  card: '#FFFFFF',
  accent: {
    DEFAULT: '#00704A',
    hover: '#005C3B',
    active: '#004D32',
  },
  text: {
    primary: '#1E1E1E',
    secondary: '#6B6B6B',
    inverse: '#FFFFFF',
  },
  success: '#00704A',
  error: '#D62828',
  warning: '#F4A100',
  info: '#1E3932',
}
```

## State Transitions

### Button States

```
idle → hover → active → idle
  ↓
disabled (grayed, 50% opacity)
```

### Step Indicator States

```
upcoming → current → complete
```

Each step progresses linearly. No backward transitions in UI (though data model supports viewing any state).

## Validation Rules

1. **Color contrast**: All text/background combinations must meet WCAG 2.1 AA (4.5:1 ratio)
2. **Token naming**: Use semantic names (e.g., `accent-primary`) not visual names (e.g., `green-500`)
3. **Spacing consistency**: All spacing values must be multiples of 4px (using 8px base)
4. **Font loading**: Serif font (Lora) required for headlines; fallback to Georgia if load fails

## Entity Relationships

```
Theme Configuration
├── Color Tokens (1:many)
├── Typography Tokens (1:many)
├── Spacing Tokens (1:many)
└── Component Variants (1:many)
    ├── Button (1:4 variants)
    ├── Card (1:1 default)
    ├── Header (1:1 default)
    └── StepIndicator (1:3 states)
```

No database entities - all configuration lives in CSS/TypeScript files.
