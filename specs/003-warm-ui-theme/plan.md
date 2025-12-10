# Implementation Plan: Warm Coffeehouse UI Theme

**Branch**: `003-warm-ui-theme` | **Date**: 2025-12-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-warm-ui-theme/spec.md`

**Note**: This plan covers a visual theme refresh for the existing React frontend. No backend changes required.

## Summary

Transform the existing coffeehouse-themed frontend into a warmer, more inviting design inspired by premium coffeehouse aesthetics. The update replaces the current brown/tan palette with a dark green header, cream backgrounds, and green accent buttons while maintaining the existing component structure and Tailwind CSS architecture. Key additions include numbered step indicators for workflows and enhanced card-based layouts.

## Technical Context

**Language/Version**: TypeScript 5.4 (strict mode)  
**Primary Dependencies**: React 19.2, Tailwind CSS, Vite 5, TanStack Query 5.90  
**Storage**: N/A (frontend-only, no storage changes)  
**Testing**: Vitest + React Testing Library (unit), Playwright (E2E)  
**Target Platform**: Web browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
**Project Type**: Web application (frontend module only)  
**Performance Goals**: LCP < 2.5s, bundle size impact < 50KB  
**Constraints**: No backend changes, maintain existing component structure, WCAG 2.1 AA compliance  
**Scale/Scope**: ~15 component files to update, 3 style files to modify

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality & Architecture | ✅ PASS | Frontend-only changes maintain hexagonal boundaries; no domain/adapter violations |
| I. Type Safety | ✅ PASS | TypeScript strict mode maintained; design tokens typed |
| II. Testing Standards | ✅ PASS | Visual regression tests via Playwright; unit tests for new components |
| III. UX Consistency | ✅ PASS | Theme enhances UX with better visual hierarchy; dual interface unaffected |
| III. Terminology | ✅ PASS | Uses existing terminology; no new terms introduced |
| IV. Performance | ✅ PASS | Font loading optimized; CSS changes minimal bundle impact |
| IV. Observability | N/A | No backend instrumentation changes |

**Gate Result**: ✅ PASSED - Proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/003-warm-ui-theme/
├── plan.md              # This file
├── research.md          # Phase 0: Font selection, color accessibility research
├── data-model.md        # Phase 1: Design token schema
├── quickstart.md        # Phase 1: Theme application guide
├── contracts/           # Phase 1: N/A (no API contracts - frontend only)
└── tasks.md             # Phase 2: Implementation tasks
```

### Source Code (repository root)

```text
ui/coffeehouse-frontend/
├── src/
│   ├── styles/
│   │   ├── tokens.css           # UPDATE: New color/typography tokens
│   │   └── theme.css            # UPDATE: Component styling overrides
│   ├── app/
│   │   └── components/          # UPDATE: Header, navigation theming
│   ├── features/
│   │   ├── dashboard/           # UPDATE: Card layouts, hero section
│   │   ├── versions/            # UPDATE: Version badges, step indicators
│   │   └── shared/              # NEW: StepIndicator component
│   └── index.css                # UPDATE: Font imports
├── tailwind.config.ts           # UPDATE: New color palette, typography
└── tests/
    ├── unit/                    # ADD: Component style tests
    └── e2e/                     # ADD: Visual regression tests
```

**Structure Decision**: Extend existing frontend structure. No new directories needed except for shared components (StepIndicator). All changes are modifications to existing files or additions within established patterns.

## Complexity Tracking

> **No violations to justify** - All changes align with constitution principles.

| Aspect | Complexity | Rationale |
|--------|------------|-----------|
| Color palette swap | Low | Direct token replacement in existing structure |
| Typography change | Low | Font import + Tailwind config update |
| Step indicators | Medium | New shared component, but follows existing patterns |
| Card layouts | Low | CSS class updates only |
| Accessibility testing | Low | Automated contrast checking tools |
