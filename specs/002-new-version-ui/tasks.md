# Tasks: New Version UI

**Input**: Design documents from `/specs/002-new-version-ui/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: E2E and component tests included as per TDD approach documented in plan.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

All paths relative to repository root `/Users/Jose_Ayala/Documents/GitHub/MetadataVersioning`:
- Frontend: `ui/coffeehouse-frontend/src/`
- Tests: `ui/coffeehouse-frontend/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify existing infrastructure and prepare for implementation

- [ ] T001 Verify TypeScript strict mode enabled in ui/coffeehouse-frontend/tsconfig.json
- [ ] T002 [P] Verify React 19.2, TanStack Query 5.90, Zustand 5.0 installed in ui/coffeehouse-frontend/package.json
- [ ] T003 [P] Verify existing NewVersionForm component at ui/coffeehouse-frontend/src/features/versions/forms/NewVersionForm.tsx
- [ ] T004 [P] Verify existing useCreateVersion hook at ui/coffeehouse-frontend/src/features/versions/api/useCreateVersion.ts
- [ ] T005 [P] Verify backend API running at http://localhost:8080 with POST /api/v1/metadata/{type}/{name}/versions endpoint

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 Create CreateVersionModal component skeleton at ui/coffeehouse-frontend/src/features/versions/components/CreateVersionModal.tsx
- [ ] T007 Implement dialog element with React Portal in CreateVersionModal.tsx
- [ ] T008 Add TypeScript interface CreateVersionModalProps in CreateVersionModal.tsx
- [ ] T009 Export CreateVersionModal from ui/coffeehouse-frontend/src/features/versions/index.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Create New Document Version from Detail Page (Priority: P1) 🎯 MVP

**Goal**: Enable business users to create new versions from document detail page with JSON payload editor, validation, and automatic version history refresh

**Independent Test**: Navigate to document detail page, click "Create New Version" button, enter valid JSON payload and summary, submit, and verify new version appears in version history

### E2E Tests for User Story 1 (Write FIRST)

- [ ] T010 [P] [US1] Create E2E test file at ui/coffeehouse-frontend/tests/e2e/create-version-flow.spec.ts
- [ ] T011 [P] [US1] Write E2E test: "should open modal when Create New Version button clicked" in create-version-flow.spec.ts
- [ ] T012 [P] [US1] Write E2E test: "should create version with valid JSON and display success" in create-version-flow.spec.ts
- [ ] T013 [P] [US1] Write E2E test: "should show validation error for invalid JSON syntax" in create-version-flow.spec.ts
- [ ] T014 [P] [US1] Write E2E test: "should close modal without creating version when cancel clicked" in create-version-flow.spec.ts
- [ ] T015 [P] [US1] Write E2E test: "should refresh version history within 1s after successful creation" in create-version-flow.spec.ts

### Implementation for User Story 1

- [ ] T016 [US1] Implement CreateVersionModal component props handling (isOpen, onClose, documentId) in CreateVersionModal.tsx
- [ ] T017 [US1] Implement dialog open/close logic with useEffect in CreateVersionModal.tsx
- [ ] T018 [US1] Render NewVersionForm inside dialog in CreateVersionModal.tsx
- [ ] T019 [US1] Wire onSuccess callback to close modal in CreateVersionModal.tsx
- [ ] T020 [US1] Wire onCancel callback to close modal in CreateVersionModal.tsx
- [ ] T021 [US1] Add "Create New Version" button to DocumentRoute header at ui/coffeehouse-frontend/src/app/routes/DocumentRoute.tsx
- [ ] T022 [US1] Add isCreateModalOpen state to DocumentRoute at ui/coffeehouse-frontend/src/app/routes/DocumentRoute.tsx
- [ ] T023 [US1] Add handleOpenCreateModal handler to DocumentRoute at ui/coffeehouse-frontend/src/app/routes/DocumentRoute.tsx
- [ ] T024 [US1] Add handleCloseCreateModal handler to DocumentRoute at ui/coffeehouse-frontend/src/app/routes/DocumentRoute.tsx
- [ ] T025 [US1] Render CreateVersionModal at end of DocumentRoute component at ui/coffeehouse-frontend/src/app/routes/DocumentRoute.tsx
- [ ] T026 [US1] Add aria-modal and aria-labelledby attributes to dialog in CreateVersionModal.tsx
- [ ] T027 [US1] Add Escape key handler to close modal in CreateVersionModal.tsx
- [ ] T028 [US1] Add close button (X) in top-right corner of modal in CreateVersionModal.tsx

### Component Tests for User Story 1

- [ ] T029 [P] [US1] Create component test file at ui/coffeehouse-frontend/tests/unit/features/versions/CreateVersionModal.test.tsx
- [ ] T030 [P] [US1] Write test: "should render dialog when isOpen is true" in CreateVersionModal.test.tsx
- [ ] T031 [P] [US1] Write test: "should not render dialog when isOpen is false" in CreateVersionModal.test.tsx
- [ ] T032 [P] [US1] Write test: "should call onClose when cancel button clicked" in CreateVersionModal.test.tsx
- [ ] T033 [P] [US1] Write test: "should call onClose when Escape key pressed" in CreateVersionModal.test.tsx
- [ ] T034 [P] [US1] Write test: "should pass documentId to NewVersionForm" in CreateVersionModal.test.tsx
- [ ] T035 [P] [US1] Write test: "should call onClose when form submission succeeds" in CreateVersionModal.test.tsx

### Validation for User Story 1

- [ ] T036 [US1] Run E2E tests and verify all passing: pnpm test:e2e create-version-flow.spec.ts
- [ ] T037 [US1] Run component tests and verify all passing: pnpm test CreateVersionModal.test.tsx
- [ ] T038 [US1] Manual test: Navigate to document detail page, create version, verify success
- [ ] T039 [US1] Manual test: Verify modal opens in <100ms (performance target)
- [ ] T040 [US1] Manual test: Verify version history updates within 1s after creation
- [ ] T041 [US1] Manual test: Verify validation error shown for invalid JSON
- [ ] T042 [US1] Manual test: Verify cancel button closes modal without API call
- [ ] T042a [US1] Manual test: Verify focus moves to first error field on validation failure per FR-018

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Validate JSON Payload Before Submission (Priority: P2)

**Goal**: Provide immediate feedback on JSON syntax errors, formatting issues, and auto-formatting capability to prevent submission errors

**Independent Test**: Open new version form, type invalid JSON, verify validation error appears inline before submission; paste unformatted JSON, click "Format JSON" button, verify proper indentation

### E2E Tests for User Story 2 (Write FIRST)

- [ ] T043 [P] [US2] Write E2E test: "should show inline error when JSON syntax invalid" in create-version-flow.spec.ts
- [ ] T044 [P] [US2] Write E2E test: "should auto-format JSON when Format button clicked" in create-version-flow.spec.ts
- [ ] T045 [P] [US2] Write E2E test: "should show error when payload is empty" in create-version-flow.spec.ts
- [ ] T046 [P] [US2] Write E2E test: "should show error when payload is array not object" in create-version-flow.spec.ts
- [ ] T047 [P] [US2] Write E2E test: "should clear error when user starts typing after validation error" in create-version-flow.spec.ts

### Implementation for User Story 2

- [ ] T048 [US2] Verify NewVersionForm implements validateJsonPayload function in ui/coffeehouse-frontend/src/features/versions/forms/NewVersionForm.tsx
- [ ] T049 [US2] Verify NewVersionForm implements validateSummary function in ui/coffeehouse-frontend/src/features/versions/forms/NewVersionForm.tsx
- [ ] T050 [US2] Verify NewVersionForm implements "Format JSON" button in ui/coffeehouse-frontend/src/features/versions/forms/NewVersionForm.tsx
- [ ] T051 [US2] Verify inline error messages display for payload field in NewVersionForm.tsx
- [ ] T052 [US2] Verify inline error messages display for changeSummary field in NewVersionForm.tsx
- [ ] T053 [US2] Verify error clears onChange in NewVersionForm.tsx
- [ ] T054 [US2] Add validation timing test: Verify validation completes in <50ms in create-version-flow.spec.ts

### Validation for User Story 2

- [ ] T055 [US2] Run E2E tests and verify validation tests passing: pnpm test:e2e create-version-flow.spec.ts
- [ ] T056 [US2] Manual test: Type invalid JSON, verify error appears on blur
- [ ] T057 [US2] Manual test: Click Format JSON with messy JSON, verify proper indentation
- [ ] T058 [US2] Manual test: Submit with empty payload, verify "Payload is required" error
- [ ] T059 [US2] Manual test: Submit with array payload, verify "Payload must be a JSON object" error
- [ ] T060 [US2] Manual test: Verify validation feedback appears in <50ms (performance target)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Pre-populate with Current Active Version (Priority: P3)

**Goal**: Enable users to start with current active version's payload and make incremental changes rather than typing from scratch

**Independent Test**: Open new version form from document with active version, verify payload editor contains active version's JSON, modify JSON, submit, verify new version created with modified payload

### E2E Tests for User Story 3 (Write FIRST)

- [ ] T061 [P] [US3] Write E2E test: "should pre-populate payload with active version when available" in create-version-flow.spec.ts
- [ ] T062 [P] [US3] Write E2E test: "should create new version with modified payload when pre-populated" in create-version-flow.spec.ts
- [ ] T063 [P] [US3] Write E2E test: "should show empty payload when no active version exists" in create-version-flow.spec.ts

### Implementation for User Story 3

- [ ] T064 [US3] Add initialPayload optional prop to CreateVersionModalProps in CreateVersionModal.tsx
- [ ] T065 [US3] Pass initialPayload prop to NewVersionForm in CreateVersionModal.tsx
- [ ] T066 [US3] Verify NewVersionForm accepts initialPayload prop in ui/coffeehouse-frontend/src/features/versions/forms/NewVersionForm.tsx
- [ ] T067 [US3] Verify NewVersionForm uses initialPayload as default textarea value in NewVersionForm.tsx
- [ ] T068 [US3] Add logic to DocumentRoute to fetch active version from useVersionHistory in ui/coffeehouse-frontend/src/app/routes/DocumentRoute.tsx
- [ ] T069 [US3] Filter version history for isActive=true in DocumentRoute.tsx
- [ ] T070 [US3] Pass active version payload to CreateVersionModal as initialPayload in DocumentRoute.tsx
- [ ] T071 [US3] Handle case where no active version exists (pass undefined) in DocumentRoute.tsx

### Component Tests for User Story 3

- [ ] T072 [P] [US3] Write test: "should pass initialPayload to NewVersionForm when provided" in CreateVersionModal.test.tsx
- [ ] T073 [P] [US3] Write test: "should not pass initialPayload when undefined" in CreateVersionModal.test.tsx

### Validation for User Story 3

- [ ] T074 [US3] Run E2E tests and verify pre-population tests passing: pnpm test:e2e create-version-flow.spec.ts
- [ ] T075 [US3] Manual test: Open modal with active version, verify payload pre-populated
- [ ] T076 [US3] Manual test: Modify pre-populated payload, submit, verify new version has changes
- [ ] T077 [US3] Manual test: Open modal with no active version, verify empty payload
- [ ] T078 [US3] Run component tests and verify pre-population tests passing: pnpm test CreateVersionModal.test.tsx

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories, final validation, and documentation

- [ ] T079 [P] Add CSS styling for modal backdrop and dialog positioning in CreateVersionModal.tsx
- [ ] T080 [P] Add Tailwind classes for button styles in DocumentRoute.tsx
- [ ] T081 [P] Add loading state indicator for submit button in NewVersionForm.tsx (verify existing)
- [ ] T082 [P] Add focus management: Focus first field when modal opens in CreateVersionModal.tsx
- [ ] T083 [P] Add focus management: Return focus to trigger button when modal closes in CreateVersionModal.tsx
- [ ] T084 [P] Add error boundary around CreateVersionModal in DocumentRoute.tsx
- [ ] T085 [P] Add data-testid attributes for E2E test selectors in CreateVersionModal.tsx
- [ ] T086 [P] Add data-testid attributes for E2E test selectors in DocumentRoute.tsx
- [ ] T087 Verify all functional requirements FR-001 to FR-020 implemented per specs/002-new-version-ui/spec.md
- [ ] T088 Verify all success criteria SC-001 to SC-006 met per specs/002-new-version-ui/spec.md
- [ ] T089 Run full test suite: pnpm test && pnpm test:e2e
- [ ] T090 Run type checking: pnpm typecheck
- [ ] T091 Run linting: pnpm lint
- [ ] T092 Run build to verify no build errors: pnpm build
- [ ] T093 Measure performance: Modal open time <100ms, validation <50ms, API <500ms
- [ ] T094 Test accessibility: Keyboard navigation, screen reader announcements, ARIA attributes
- [ ] T095 Follow quickstart.md validation steps in specs/002-new-version-ui/quickstart.md
- [ ] T096 Update CHANGELOG or release notes with new feature description
- [ ] T097 Create pull request with reference to specs/002-new-version-ui/spec.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed) after Phase 2
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Validates form inputs from US1 but independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Enhances US1 by pre-populating but independently testable

### Within Each User Story

- E2E tests MUST be written and FAIL before implementation
- Component tests can be written in parallel with implementation
- Implementation tasks follow order: Component skeleton → Logic → Integration → Styling
- Validation tasks run after all implementation complete

### Parallel Opportunities

**Phase 1 (Setup)**: All tasks T001-T005 can run in parallel (verification only)

**Phase 2 (Foundational)**: Tasks T006-T009 must run sequentially (each builds on previous)

**Phase 3 (User Story 1)**:
- E2E tests T010-T015 can all be written in parallel
- Implementation tasks T016-T020 (CreateVersionModal) can proceed while T021-T025 (DocumentRoute) proceed in parallel
- Component tests T029-T035 can all be written in parallel after implementation
- Validation tasks T036-T042 must run sequentially (depend on implementation)

**Phase 4 (User Story 2)**:
- E2E tests T043-T047 can all be written in parallel
- Implementation tasks T048-T054 mostly verification (can check in parallel)

**Phase 5 (User Story 3)**:
- E2E tests T061-T063 can all be written in parallel
- Implementation tasks T064-T071 must run sequentially (each builds on previous)
- Component tests T072-T073 can be written in parallel

**Phase 6 (Polish)**: Tasks T079-T086 can all run in parallel, then T087-T097 sequentially

---

## Parallel Example: User Story 1

**Developer A** (E2E Tests):
```bash
# Write all E2E tests in parallel
git checkout -b us1-e2e-tests
# T010-T015 in single session
pnpm test:e2e create-version-flow.spec.ts --headed  # Verify all fail (red phase)
git commit -m "Add E2E tests for US1 (failing)"
```

**Developer B** (CreateVersionModal):
```bash
# Implement modal component
git checkout -b us1-modal-component
# T016-T020, T026-T028 in single session
pnpm test  # Run existing tests
git commit -m "Implement CreateVersionModal component"
```

**Developer C** (DocumentRoute Integration):
```bash
# Integrate into DocumentRoute
git checkout -b us1-document-route
# T021-T025 in single session
pnpm test  # Run existing tests
git commit -m "Add Create New Version button to DocumentRoute"
```

**Developer D** (Component Tests):
```bash
# Write component tests (after B finishes T016-T020)
git checkout -b us1-component-tests
# T029-T035 in single session
pnpm test CreateVersionModal.test.tsx
git commit -m "Add component tests for CreateVersionModal"
```

**Integration** (after all parallel work complete):
```bash
# Merge all branches
git checkout 002-new-version-ui
git merge us1-e2e-tests
git merge us1-modal-component
git merge us1-document-route
git merge us1-component-tests

# Run full validation
pnpm test:e2e  # T036 - E2E tests should now pass (green phase)
pnpm test      # T037 - Component tests should pass
# T038-T042 - Manual testing
```

---

## MVP Scope

**Recommended MVP**: User Story 1 (Phase 3) only

**Rationale**:
- Delivers core value: Create versions from UI
- Fully testable and functional independently
- Users can manually format JSON and copy-paste if needed
- 42 tasks (T001-T042) vs 97 total tasks
- Estimated 2-3 days for single developer, 1 day with parallel team

**Phase 2 (Optional)**: Add validation enhancements (US2)
- Improves UX but not blocking
- 18 additional tasks (T043-T060)

**Phase 3 (Optional)**: Add pre-population (US3)
- Nice-to-have for incremental edits
- 18 additional tasks (T061-T078)

**Delivery Strategy**: Ship US1 as v1.0, gather feedback, then prioritize US2 vs US3 based on user needs

---

## Task Summary

- **Total Tasks**: 97
- **Setup Tasks**: 5 (Phase 1)
- **Foundational Tasks**: 4 (Phase 2)
- **User Story 1 Tasks**: 33 (Phase 3)
- **User Story 2 Tasks**: 18 (Phase 4)
- **User Story 3 Tasks**: 18 (Phase 5)
- **Polish Tasks**: 19 (Phase 6)

**Parallel Opportunities**: 45 tasks marked [P] can run in parallel within their phase

**Independent Test Criteria Met**: Each user story phase includes complete E2E tests, component tests, and validation tasks to ensure independent functionality

**Format Validation**: ✅ All tasks follow checklist format with checkbox, ID, labels [P]/[Story], and file paths
