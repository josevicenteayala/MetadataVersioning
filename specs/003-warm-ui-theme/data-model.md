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
  headerBg: '#1E3932';      // Dark green - header/navigation background
  contentBg: '#F2F0EB';     // Warm cream - main content background
  cardBg: '#FFFFFF';        // White - card backgrounds
  
  // Accent colors
  accentPrimary: '#00704A'; // Green - primary buttons, highlights
  accentHover: '#005C3B';   // Darker green - hover states
  accentActive: '#004D32';  // Darkest green - active/pressed states
  
  // Text colors
  textPrimary: '#1E1E1E';   // Dark charcoal - main text
  textSecondary: '#6B6B6B'; // Medium gray - secondary text
  textInverse: '#FFFFFF';   // White - text on dark backgrounds
  textAccent: '#00704A';    // Green - links, highlighted text
  
  // Semantic colors
  success: '#00704A';       // Green - success states
  error: '#D62828';         // Warm red - error states
  warning: '#F4A100';       // Amber/gold - warning states
  info: '#1E3932';          // Dark green - info states
  
  // Border colors
  borderLight: 'rgba(30, 57, 50, 0.12)';  // Subtle green tint
  borderMedium: 'rgba(30, 57, 50, 0.24)'; // Medium green tint
}
```

### Typography Tokens

```typescript
interface WarmTypographyTokens {
  // Font families
  fontHeadline: '"Lora", "Georgia", serif';
  fontBody: '"Inter", "Segoe UI", system-ui, sans-serif';
  fontMono: '"JetBrains Mono", "Consolas", monospace';
  
  // Font sizes (rem)
  textXs: '0.75rem';    // 12px
  textSm: '0.875rem';   // 14px
  textBase: '1rem';     // 16px
  textLg: '1.125rem';   // 18px
  textXl: '1.25rem';    // 20px
  text2xl: '1.5rem';    // 24px
  text3xl: '1.875rem';  // 30px
  text4xl: '2.25rem';   // 36px
  
  // Font weights
  fontNormal: 400;
  fontMedium: 500;
  fontSemibold: 600;
  fontBold: 700;
  
  // Line heights
  leadingTight: 1.25;
  leadingNormal: 1.5;
  leadingRelaxed: 1.75;
}
```

### Spacing Tokens

```typescript
interface WarmSpacingTokens {
  // Base unit: 8px
  space1: '0.25rem';   // 4px
  space2: '0.5rem';    // 8px
  space3: '0.75rem';   // 12px
  space4: '1rem';      // 16px
  space5: '1.25rem';   // 20px
  space6: '1.5rem';    // 24px
  space8: '2rem';      // 32px
  space10: '2.5rem';   // 40px
  space12: '3rem';     // 48px
  space16: '4rem';     // 64px
}
```

### Border & Shadow Tokens

```typescript
interface WarmBorderTokens {
  // Border radius
  radiusSm: '4px';
  radiusMd: '8px';     // Buttons
  radiusLg: '12px';    // Cards
  radiusXl: '16px';
  radiusFull: '9999px'; // Pills
  
  // Box shadows
  shadowSm: '0 1px 2px rgba(30, 57, 50, 0.05)';
  shadowMd: '0 4px 6px rgba(30, 57, 50, 0.07)';
  shadowLg: '0 10px 25px rgba(30, 57, 50, 0.08)';
  shadowXl: '0 20px 40px rgba(30, 57, 50, 0.12)';
}
```

## Component Token Mapping

### Button Component

| Variant | Background | Text | Border | Hover BG |
|---------|------------|------|--------|----------|
| Primary | `accentPrimary` | `textInverse` | none | `accentHover` |
| Secondary | transparent | `accentPrimary` | `accentPrimary` | `rgba(0,112,74,0.08)` |
| Ghost | transparent | `textPrimary` | none | `rgba(30,30,30,0.05)` |
| Danger | `error` | `textInverse` | none | `#B82020` |

### Card Component

| Property | Token |
|----------|-------|
| Background | `cardBg` |
| Border | `borderLight` |
| Border Radius | `radiusLg` (12px) |
| Shadow | `shadowLg` |
| Padding | `space6` (24px) |

### Header Component

| Property | Token |
|----------|-------|
| Background | `headerBg` |
| Text | `textInverse` |
| Height | `space16` (64px) |
| Logo Font | `fontHeadline` |
| Nav Font | `fontBody` |

### Step Indicator Component

```typescript
interface StepIndicatorTokens {
  // Circle dimensions
  circleSize: '2rem';          // 32px
  circleBorder: '2px solid';
  
  // Colors by state
  upcoming: {
    circleBg: 'transparent';
    circleBorder: 'borderMedium';
    numberColor: 'textSecondary';
    labelColor: 'textSecondary';
  };
  current: {
    circleBg: 'accentPrimary';
    circleBorder: 'accentPrimary';
    numberColor: 'textInverse';
    labelColor: 'textPrimary';
  };
  complete: {
    circleBg: 'accentPrimary';
    circleBorder: 'accentPrimary';
    numberColor: 'textInverse';  // or checkmark icon
    labelColor: 'textPrimary';
  };
  
  // Connector line
  lineHeight: '2px';
  lineColor: 'borderMedium';
  lineCompleteColor: 'accentPrimary';
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
