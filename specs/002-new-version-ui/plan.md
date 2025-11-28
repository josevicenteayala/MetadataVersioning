# Implementation Plan: New Version UI

**Branch**: `002-new-version-ui` | **Date**: November 28, 2025 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/002-new-version-ui/spec.md`

## Summary

Implement a "Create New Version" UI feature that allows business users to create new document versions from the document detail page. The feature uses a React Portal-based modal with native `<dialog>` element, integrating the existing `NewVersionForm` component. Key technical decisions:

- Native `<dialog>` for accessibility (focus trap, ESC key handling)
- Self-contained form state (modal only controls visibility)
- React Query cache invalidation for automatic history refresh
- Optional pre-population from active version (P3 feature)

## Technical Context

**Language/Version**: TypeScript 5.4 (strict mode enabled)  
**Primary Dependencies**: React 19.2, React Router 7.9, TanStack Query 5.90, Zustand 5.0, Vite 5  
**Storage**: Browser localStorage for session state only (no persistent form data)  
**Testing**: Vitest (unit), Playwright (E2E), React Testing Library (component)  
**Target Platform**: Web - Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ (screen widths 768px-2560px)  
**Project Type**: Web application (frontend SPA)  
**Performance Goals**: Modal <100ms open, JSON validation <50ms, API <500ms P95  
**Constraints**: Max 1MB payload, max 500 char summary, 100 level JSON nesting limit  
**Scale/Scope**: Single document detail page enhancement, ~500 lines new code

## Constitution Check

**GATE: ✅ PASSED** - All principles satisfied

| Principle | Status | Evidence |
|-----------|--------|----------|
| **I. Hexagonal Architecture** | ✅ PASS | Component boundaries maintain separation: CreateVersionModal (presentation adapter), NewVersionForm (form logic), useCreateVersion (API port) |
| **I. SOLID Principles** | ✅ PASS | SRP: Modal handles presentation, Form handles data; OCP: Optional props for extension; DIP: Components depend on props interfaces |
| **I. Type Safety** | ✅ PASS | TypeScript strict mode, explicit interfaces for all props (CreateVersionModalProps, NewVersionFormProps), no `any` types |
| **II. TDD** | ✅ PASS | Tasks structured Red-Green-Refactor: E2E tests written first (T010-T015), then implementation, then component tests |
| **II. Test Coverage** | ✅ PASS | Target 80%+ adapter coverage via 203 unit tests, E2E tests for critical paths |
| **II. Test Pyramid** | ✅ PASS | Unit (70%): NewVersionForm tests; Integration (20%): API hooks; E2E (10%): create-version flow |
| **III. UX Consistency** | ✅ PASS | Dual interface maintained (API + UI), inline validation with specific error messages, 2-space JSON formatting |
| **III. Validation Feedback** | ✅ PASS | FR-013, FR-014, FR-031-040: Specific errors with correlation IDs, field paths, actionable guidance |
| **III. Accessibility** | ✅ PASS | FR-021-030, NFR-001-005: WCAG 2.1 AA, focus management, ARIA attributes, keyboard navigation |
| **IV. Performance** | ✅ PASS | PT-001-004: Modal <100ms, validation <50ms, API <500ms, formatting <100ms |

## Project Structure

### Documentation (this feature)

```text
specs/002-new-version-ui/
├── plan.md              # This file
├── research.md          # Phase 0: Modal pattern, state management, cache strategy
├── data-model.md        # Phase 1: Component models, props interfaces, state flow
├── quickstart.md        # Phase 1: Step-by-step implementation guide
├── contracts/           # Phase 1: API contracts (OpenAPI reference)
├── tasks.md             # Phase 2: 97 tasks across 6 phases
├── checklists/          # Quality validation
│   └── comprehensive.md # 85-item checklist (all complete)
├── gap-analysis-remediation.md  # Edge case documentation
└── spec.md              # Feature specification (40 FRs, 34 edge cases, 13 NFRs)
```

### Source Code

```text
ui/coffeehouse-frontend/
├── src/
│   ├── app/
│   │   └── routes/
│   │       └── DocumentRoute.tsx      # Modified: Add Create New Version button + modal
│   ├── features/
│   │   └── versions/
│   │       ├── components/
│   │       │   └── CreateVersionModal.tsx  # New: Modal wrapper for form
│   │       ├── forms/
│   │       │   └── NewVersionForm.tsx      # Modified: Add initialPayload prop
│   │       └── hooks/
│   │           └── useCreateVersion.ts     # Existing: API mutation hook
│   └── shared/
│       └── services/
│           └── toastBus.ts                 # Existing: Toast notifications
└── tests/
    ├── unit/
    │   └── features/
    │       └── versions/
    │           └── CreateVersionModal.test.tsx  # Component tests
    └── e2e/
        └── versions/
            └── create-version.spec.ts           # E2E flow tests
```

**Structure Decision**: Web application structure with feature-based organization. Frontend follows hexagonal pattern adapted for React SPA:

- **Adapters (inbound)**: Route components (DocumentRoute)
- **Application**: Hooks (useCreateVersion, useVersionHistory)
- **Presentation**: Components (CreateVersionModal, NewVersionForm)

## Implementation Phases

### Phase 1: Setup (Tasks T001-T005)

Verify prerequisites: backend API, existing hooks, NewVersionForm component, toast service

### Phase 2: Foundational (Tasks T006-T009)

Create CreateVersionModal component skeleton, ErrorBoundary wrapper

### Phase 3: User Story 1 - Core Create (Tasks T010-T042)

E2E tests → Modal implementation → DocumentRoute integration → Success/error flows

### Phase 4: User Story 2 - Validation (Tasks T043-T060)

Enhanced inline validation, Format JSON button, character counter

### Phase 5: User Story 3 - Pre-population (Tasks T061-T078)

initialPayload prop, active version detection, P3 feature

### Phase 6: Polish (Tasks T079-T097)

Accessibility audit, performance optimization, documentation, PR

## Complexity Tracking

*No constitution violations requiring justification.*

| Decision | Rationale | Alternatives Rejected |
|----------|-----------|----------------------|
| Native `<dialog>` | Built-in focus trap, ESC handling, accessibility | react-modal (50KB+), custom modal (complexity) |
| Self-contained form state | Testability, encapsulation | Lifted state (couples DocumentRoute to form internals) |
| React Portal | Prevents z-index issues with version table | Inline modal (z-index conflicts) |

## Generated Artifacts

| Artifact | Status | Path |
|----------|--------|------|
| research.md | ✅ Complete | specs/002-new-version-ui/research.md |
| data-model.md | ✅ Complete | specs/002-new-version-ui/data-model.md |
| quickstart.md | ✅ Complete | specs/002-new-version-ui/quickstart.md |
| contracts/ | ✅ Complete | specs/002-new-version-ui/contracts/ |
| tasks.md | ✅ Complete | specs/002-new-version-ui/tasks.md |

## Next Steps

1. ✅ Phase 0: Research complete
2. ✅ Phase 1: Design complete
3. ✅ Phase 2-6: Implementation complete (83/97 tasks)
4. ⏳ Remaining: Manual testing tasks + T097 (Create PR)
