# Quickstart: Warm Coffeehouse UI Theme

**Feature**: 003-warm-ui-theme  
**Date**: 2025-12-09

## Prerequisites

- Node.js 20+
- pnpm 9+
- Running backend (for full app testing)

## Quick Setup

### 1. Install Dependencies

```bash
cd ui/coffeehouse-frontend
pnpm install
```

### 2. Start Development Server

```bash
pnpm dev
```

Open http://localhost:5173 to see the application.

## Theme Files Overview

| File | Purpose |
|------|---------|
| `tailwind.config.ts` | Color palette, typography, spacing tokens |
| `src/styles/tokens.css` | CSS custom properties (design tokens) |
| `src/styles/theme.css` | Global styles and component classes |
| `src/index.css` | Font imports and base styles |

## Key Design Tokens

### Colors

```css
/* Header & Navigation */
--warm-header-bg: #1E3932;     /* Dark green */
--warm-text-inverse: #FFFFFF;  /* White text on dark */

/* Content Area */
--warm-content-bg: #F2F0EB;    /* Warm cream */
--warm-card-bg: #FFFFFF;       /* White cards */

/* Accent (Buttons, Links) */
--warm-accent: #00704A;        /* Green */
--warm-accent-hover: #005C3B;  /* Darker green */
```

### Typography

```css
/* Headlines - Serif */
font-family: var(--warm-font-headline);  /* Lora */

/* Body - Sans-serif */
font-family: var(--warm-font-body);      /* Inter */
```

## Using Theme Classes

### Buttons

```tsx
// Primary button (solid green)
<button className="btn-primary">Save Changes</button>

// Secondary button (outlined)
<button className="btn-secondary">Cancel</button>
```

### Cards

```tsx
<div className="warm-card">
  <h2 className="warm-card-title">Card Title</h2>
  <p className="warm-card-body">Card content here.</p>
</div>
```

### Step Indicators

```tsx
import { StepIndicator } from '@/features/shared/StepIndicator';

<StepIndicator current={2} total={4}>
  <StepIndicator.Step number={1} label="Select" status="complete" />
  <StepIndicator.Step number={2} label="Edit" status="current" />
  <StepIndicator.Step number={3} label="Review" status="upcoming" />
  <StepIndicator.Step number={4} label="Publish" status="upcoming" />
</StepIndicator>
```

## Running Tests

### Unit Tests

```bash
pnpm test
```

### Visual Regression Tests

```bash
pnpm test:e2e
```

### Accessibility Check

```bash
pnpm test:a11y
```

## Verifying Theme Application

After making changes, verify:

1. **Header**: Dark green (#1E3932) background with white text
2. **Background**: Warm cream (#F2F0EB) main content area
3. **Buttons**: Green (#00704A) primary buttons with white text
4. **Cards**: White background with 12px radius and subtle shadow
5. **Typography**: Lora for headlines, Inter for body text

## Contrast Checker

Use browser DevTools or online tools to verify contrast:

| Combination | Expected Ratio |
|-------------|----------------|
| White on dark green header | 11.8:1 ✅ |
| Dark text on cream background | 14.4:1 ✅ |
| White on green buttons | 5.1:1 ✅ |

## Troubleshooting

### Fonts Not Loading

1. Check network tab for font requests
2. Verify `src/index.css` has correct `@font-face` declarations
3. Ensure fonts are in `public/fonts/` directory

### Colors Not Updating

1. Hard refresh the page (Cmd+Shift+R)
2. Check if `tokens.css` is imported in `index.css`
3. Verify Tailwind config has new palette

### Step Indicators Not Styled

1. Ensure StepIndicator component is imported from correct path
2. Check that warm theme classes are applied
3. Verify component state props are correct

## Next Steps

After theme implementation:

1. Run full test suite: `pnpm test:ci`
2. Run E2E tests: `pnpm test:e2e`
3. Perform accessibility audit
4. Create PR for review
