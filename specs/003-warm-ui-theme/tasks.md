# Tasks: Warm Coffeehouse UI Theme

**Feature**: 003-warm-ui-theme  
**Generated**: 2025-12-09  
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Summary

| Metric | Value |
|--------|-------|
| Total Tasks | 47 |
| Setup Phase | 5 tasks |
| Foundational Phase | 8 tasks |
| US1 (Dashboard & Theme) | 10 tasks |
| US2 (Visual Hierarchy) | 8 tasks |
| US3 (Step Indicators) | 6 tasks |
| US4 (Card Layouts) | 5 tasks |
| US5 (Accessibility) | 3 tasks |
| Polish Phase | 2 tasks |
| Parallel Opportunities | 18 tasks marked [P] |

---

## Phase 1: Setup

**Goal**: Prepare the project with new design tokens and font resources.

- [X] T001 Download and add Lora variable font to `ui/coffeehouse-frontend/public/fonts/Lora-Variable.woff2`
- [X] T002 [P] Add font preload hints to `ui/coffeehouse-frontend/index.html`
- [X] T003 [P] Add @font-face declarations for Lora in `ui/coffeehouse-frontend/src/index.css`
- [X] T004 [P] Create warm color palette object in `ui/coffeehouse-frontend/tailwind.config.ts`
- [X] T005 Add warm typography configuration to `ui/coffeehouse-frontend/tailwind.config.ts`

---

## Phase 2: Foundational (Design Tokens)

**Goal**: Establish the design token system that all components will use.  
**Blocking**: Must complete before user story implementation.

- [X] T006 Add warm color CSS custom properties to `ui/coffeehouse-frontend/src/styles/tokens.css`
- [X] T007 [P] Add warm typography CSS custom properties to `ui/coffeehouse-frontend/src/styles/tokens.css`
- [X] T008 [P] Add warm spacing CSS custom properties to `ui/coffeehouse-frontend/src/styles/tokens.css`
- [X] T009 [P] Add warm border-radius CSS custom properties to `ui/coffeehouse-frontend/src/styles/tokens.css`
- [X] T010 [P] Add warm shadow CSS custom properties to `ui/coffeehouse-frontend/src/styles/tokens.css`
- [X] T011 Update body background and base text color in `ui/coffeehouse-frontend/src/styles/theme.css`
- [X] T012 [P] Add utility classes for warm theme colors in `ui/coffeehouse-frontend/src/styles/theme.css`
- [X] T013 Export design token TypeScript types in `ui/coffeehouse-frontend/src/styles/tokens.ts`

---

## Phase 3: User Story 1 - Experience Warm, Inviting Dashboard (P1)

**Story Goal**: Business user sees dark green header, cream background, green buttons, serif headlines.

**Independent Test**: Load dashboard, verify header is #1E3932, background is #F2F0EB, primary buttons are #00704A, headlines use Lora font.

### Implementation Tasks

- [X] T014 [US1] Update header background to dark green (#1E3932) with fixed position (sticky on scroll) in `ui/coffeehouse-frontend/src/styles/theme.css` (.app-shell__header) [FR-018]
- [X] T015 [P] [US1] Update header text and navigation to white/cream in `ui/coffeehouse-frontend/src/styles/theme.css`
- [X] T016 [P] [US1] Update application title to use Lora serif font in `ui/coffeehouse-frontend/src/styles/theme.css`
- [X] T017 [US1] Update main content background to warm cream (#F2F0EB) in `ui/coffeehouse-frontend/src/styles/theme.css` (body, .app-shell)
- [X] T018 [P] [US1] Update primary button styles (.btn-primary) with green background (#00704A), white text, 8px radius in `ui/coffeehouse-frontend/src/styles/theme.css`
- [X] T019 [P] [US1] Add hover state (#005C3B) and active state (#004D32) for primary buttons in `ui/coffeehouse-frontend/src/styles/theme.css`
- [X] T020 [US1] Update DashboardHero component styling in `ui/coffeehouse-frontend/src/features/dashboard/components/DashboardHero.tsx`
- [X] T021 [P] [US1] Update headline typography to use Lora font across dashboard in `ui/coffeehouse-frontend/src/styles/theme.css`
- [X] T022 [P] [US1] Update body text typography to use Inter font in `ui/coffeehouse-frontend/src/styles/theme.css`
- [X] T023 [US1] Verify responsive breakpoints maintain warm aesthetic in `ui/coffeehouse-frontend/src/styles/theme.css`

---

## Phase 4: User Story 2 - Navigate with Clear Visual Hierarchy (P1)

**Story Goal**: Primary actions stand out, clear typography hierarchy, visual indicators for states.

**Independent Test**: Present task requiring button click, measure time to identify primary action (<2 seconds).

### Implementation Tasks

- [X] T024 [US2] Create secondary button variant (.btn-secondary) with green border, transparent background in `ui/coffeehouse-frontend/src/styles/theme.css`
- [X] T025 [P] [US2] Create ghost button variant (.btn-ghost) with subtle hover in `ui/coffeehouse-frontend/src/styles/theme.css`
- [X] T026 [P] [US2] Update section heading styles (h1, h2, h3) with clear size hierarchy in `ui/coffeehouse-frontend/src/styles/theme.css`
- [X] T027 [US2] Update navigation active state with visual indicator in `ui/coffeehouse-frontend/src/styles/theme.css`
- [X] T028 [P] [US2] Update badge styles for status indicators in `ui/coffeehouse-frontend/src/styles/theme.css` (.badge)
- [X] T029 [P] [US2] Update VersionHistoryTable row styling for clear state distinction in `ui/coffeehouse-frontend/src/features/versions/components/VersionHistoryTable.tsx`
- [X] T030 [P] [US2] Update DocumentsTable styling with warm theme in `ui/coffeehouse-frontend/src/features/documents/components/DocumentsTable.tsx`
- [X] T031 [US2] Update ActivationControls button hierarchy in `ui/coffeehouse-frontend/src/features/versions/components/ActivationControls.tsx`

---

## Phase 5: User Story 3 - View Document Details with Step Indicators (P2)

**Story Goal**: Multi-step workflows show numbered progress indicators with green styling.

**Independent Test**: Navigate version creation workflow, verify step indicators show current/complete/upcoming states correctly.

### Implementation Tasks

- [X] T032 [US3] Create StepIndicator component in `ui/coffeehouse-frontend/src/features/shared/components/StepIndicator.tsx`
- [X] T033 [P] [US3] Create StepIndicator.Step subcomponent with status prop (upcoming/current/complete) in `ui/coffeehouse-frontend/src/features/shared/components/StepIndicator.tsx`
- [X] T034 [P] [US3] Add StepIndicator CSS styles with green circles and connecting lines in `ui/coffeehouse-frontend/src/styles/theme.css`
- [X] T035 [US3] Export StepIndicator from `ui/coffeehouse-frontend/src/features/shared/components/index.ts`
- [X] T036 [US3] Integrate StepIndicator into CreateVersionModal in `ui/coffeehouse-frontend/src/features/versions/components/CreateVersionModal.tsx`
- [X] T037 [P] [US3] Style version number badges consistently with step indicator design in `ui/coffeehouse-frontend/src/styles/theme.css`

---

## Phase 6: User Story 4 - Experience Consistent Card-Based Layout (P2)

**Story Goal**: Documents and versions displayed in consistent cards with shadows and rounded corners.

**Independent Test**: View document list and version details, verify cards have 12px radius, shadow, 24px padding.

### Implementation Tasks

- [X] T038 [US4] Update .glass-card class with warm theme (white bg, 12px radius, warm shadow) in `ui/coffeehouse-frontend/src/styles/theme.css`
- [X] T039 [P] [US4] Create .warm-card utility class in `ui/coffeehouse-frontend/src/styles/theme.css`
- [X] T040 [P] [US4] Update dashboard metric cards with warm styling in `ui/coffeehouse-frontend/src/styles/theme.css` (.dashboard-hero__metric)
- [X] T041 [US4] Update VersionDetailDrawer card sections in `ui/coffeehouse-frontend/src/features/versions/components/VersionDetailDrawer.tsx`
- [X] T042 [P] [US4] Ensure consistent 32px vertical spacing between card sections and max-width 1200px for main content container in `ui/coffeehouse-frontend/src/styles/theme.css` [FR-016]

---

## Phase 7: User Story 5 - Interact with Accessible Color Scheme (P3)

**Story Goal**: All colors meet WCAG 2.1 AA contrast, states distinguishable without color alone.

**Independent Test**: Run automated accessibility audit, verify 0 contrast failures, all buttons have visible focus states.

### Implementation Tasks

- [X] T043 [US5] Add visible focus ring styles for all interactive elements in `ui/coffeehouse-frontend/src/styles/theme.css`
- [X] T044 [P] [US5] Update disabled button styles with sufficient contrast in `ui/coffeehouse-frontend/src/styles/theme.css`
- [X] T045 [US5] Add icon+text pairing for status badges (success, error, warning) in `ui/coffeehouse-frontend/src/styles/theme.css`

---

## Phase 8: Polish & Cross-Cutting

**Goal**: Final cleanup, documentation, and visual consistency verification.

- [ ] T046 Remove deprecated coffee palette variables from `ui/coffeehouse-frontend/src/styles/tokens.css` (after migration complete)
- [X] T047 Update component storybook/documentation with new theme examples in `ui/coffeehouse-frontend/README.md`

---

## Dependencies

```text
Phase 1 (Setup)
    ↓
Phase 2 (Foundational)
    ↓
┌───────────────────┬───────────────────┐
│                   │                   │
↓                   ↓                   │
Phase 3 (US1)  →  Phase 4 (US2)         │
    ↓                   ↓               │
    └─────────┬─────────┘               │
              ↓                         │
         Phase 5 (US3) ←────────────────┘
              ↓
         Phase 6 (US4)
              ↓
         Phase 7 (US5)
              ↓
         Phase 8 (Polish)
```

**Notes**:
- US1 and US2 can run in parallel after Foundational
- US3 depends on button styles from US2
- US4 can start after US1 (card backgrounds need theme)
- US5 runs last to audit all implemented styles

---

## Parallel Execution Opportunities

### Within Phase 2 (Foundational)
```text
T006 (colors) → T007, T008, T009, T010 can run in parallel
```

### Within Phase 3 (US1)
```text
T014 (header bg) → T015, T016, T018, T019, T021, T022 can run in parallel
T017 (content bg) → T020 (DashboardHero)
```

### Within Phase 4 (US2)
```text
T024 (secondary btn) → T025, T026, T28, T29, T30 can run in parallel
```

### Within Phase 5 (US3)
```text
T032 (StepIndicator) → T033, T034 can run in parallel
```

---

## Implementation Strategy

### MVP Scope (Recommended First Delivery)
**Phase 1 + Phase 2 + Phase 3 (US1)** = 23 tasks

Delivers:
- ✅ Dark green header
- ✅ Cream background
- ✅ Green primary buttons
- ✅ Serif headlines
- ✅ Sans-serif body text
- ✅ Dashboard fully themed

### Incremental Deliveries
1. **MVP**: US1 (warm dashboard experience) - 23 tasks
2. **+US2**: Clear visual hierarchy (buttons, navigation) - 8 tasks
3. **+US3**: Step indicators for workflows - 6 tasks
4. **+US4**: Enhanced card layouts - 5 tasks
5. **+US5**: Accessibility polish - 3 tasks
6. **+Polish**: Final cleanup - 2 tasks

---

## Validation Checklist

After each user story, verify:

- [ ] Header background is #1E3932
- [ ] Content background is #F2F0EB
- [ ] Primary buttons are #00704A with white text
- [ ] Headlines use Lora serif font
- [ ] Body text uses Inter sans-serif font
- [ ] Cards have 12px radius and subtle shadow
- [ ] All text passes WCAG 2.1 AA contrast (4.5:1 minimum)
- [ ] Focus states visible on all interactive elements
