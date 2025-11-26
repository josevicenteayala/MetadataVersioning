# Tasks: Coffeehouse-Inspired Metadata Frontend

**Input**: Design documents from `/specs/001-coffeehouse-frontend/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Constitution mandates TDD, so each user story includes explicit test tasks executed before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the frontend workspace and baseline tooling.

- [X] T001 Scaffold Vite React+TS workspace under `ui/coffeehouse-frontend/` with pnpm workspace entry and base `package.json`.
- [X] T002 Configure `ui/coffeehouse-frontend/tsconfig.json` with strict compiler options and path aliases from plan.md.
- [X] T003 [P] Add linting/formatting config (`ui/coffeehouse-frontend/.eslintrc.cjs`, `.prettierrc`, Husky pre-push hook).
- [X] T004 [P] Setup Tailwind + PostCSS pipeline in `ui/coffeehouse-frontend/tailwind.config.ts` with coffeehouse tokens placeholder file.
- [X] T005 [P] Create environment scaffolding (`ui/coffeehouse-frontend/.env.example`) documenting `VITE_API_BASE_URL` and timeout variables referenced in quickstart.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared infrastructure that all user stories depend on.

- [X] T006 Create OpenAPI generation script `ui/coffeehouse-frontend/scripts/generate-client.ts` wired to `specs/001-metadata-version-api/contracts/openapi.yaml`.
- [X] T007 [P] Add `generate:client` + build/test scripts to `ui/coffeehouse-frontend/package.json` and document in quickstart.
- [X] T008 [P] Implement axios client wrapper with Basic Auth header + correlation logging in `ui/coffeehouse-frontend/src/services/api/httpClient.ts`.
- [X] T009 [P] Configure TanStack Query provider + hydration utilities in `ui/coffeehouse-frontend/src/app/queryClient.tsx` and register in `src/main.tsx`.
- [X] T010 [P] Implement Zustand session credential store in `ui/coffeehouse-frontend/src/services/auth/sessionStore.ts` with auto-clear on 401.
- [X] T011 Build global theme files (`ui/coffeehouse-frontend/src/styles/tokens.css`, `ui/coffeehouse-frontend/src/styles/theme.css`) and wire fonts/animations per plan.
- [X] T012 Add toast + correlation ID notification service in `ui/coffeehouse-frontend/src/services/feedback/toastBus.ts` consumed by layout shell.

**Checkpoint**: Once Phase 2 completes, user stories can run in parallel.

---

## Phase 3: User Story 1 – Discover documents at a glance (Priority: P1) 🎯 MVP

**Goal**: Present dashboard stats and paginated document list with filters and branded visuals.
**Independent Test**: Using mocked API responses, verify users can load dashboard metrics, search/filter the list, and paginate without other flows.

### Tests (write first)
- [X] T013 [P] [US1] Create Vitest spec `ui/coffeehouse-frontend/tests/unit/dashboard/dashboardSummary.test.tsx` covering hero metrics rendering and empty states.
- [X] T014 [P] [US1] Add Playwright journey `ui/coffeehouse-frontend/tests/e2e/dashboard-list.spec.ts` that searches documents and verifies status chips + pagination.

### Implementation
- [X] T015 [P] [US1] Build stats query + mapper in `ui/coffeehouse-frontend/src/features/dashboard/api/useDashboardStats.ts` consuming generated client.
- [X] T016 [P] [US1] Implement paginated documents hook with filters in `ui/coffeehouse-frontend/src/features/documents/api/useDocumentsPage.ts`.
- [X] T017 [US1] Create dashboard hero + KPI cards in `ui/coffeehouse-frontend/src/features/dashboard/components/DashboardHero.tsx` using coffeehouse tokens.
- [X] T018 [US1] Implement searchable document list with status chips and active badge in `ui/coffeehouse-frontend/src/features/documents/components/DocumentsTable.tsx`.
- [X] T019 [US1] Wire dashboard route + layout animations in `ui/coffeehouse-frontend/src/app/routes/DashboardRoute.tsx` including TanStack Query prefetch.
- [X] T051 [US1] Implement responsive breakpoints and stacked layouts across `ui/coffeehouse-frontend/src/features/dashboard/components/DashboardHero.tsx`, `.../DocumentsTable.tsx`, and `ui/coffeehouse-frontend/src/styles/tokens.css` to satisfy FR-012.
- [X] T052 [P] [US1] Add Playwright viewport regression suite `ui/coffeehouse-frontend/tests/e2e/dashboard-responsive.spec.ts` validating mobile/tablet stacking and action accessibility.

**Checkpoint**: Dashboard + list independently demoable (MVP scope).

---

## Phase 4: User Story 2 – Inspect version history (Priority: P1)

**Goal**: Provide document detail view with complete version history and activation metadata.
**Independent Test**: Deep-link to document detail and verify history table + detail drawer render without other stories.

### Tests (write first)
- [X] T020 [P] [US2] Add Vitest spec `ui/coffeehouse-frontend/tests/unit/versions/versionHistoryTable.test.tsx` validating sorting, status chips, and empty rows.
- [X] T021 [P] [US2] Extend Playwright journey `ui/coffeehouse-frontend/tests/e2e/document-history.spec.ts` to open detail, verify correlation ID display.

### Implementation
- [X] T022 [P] [US2] Implement history query hook `ui/coffeehouse-frontend/src/features/versions/api/useVersionHistory.ts` with cached responses per document.
- [X] T023 [US2] Build version history table component `ui/coffeehouse-frontend/src/features/versions/components/VersionHistoryTable.tsx` with sticky headers + tags.
- [X] T024 [US2] Implement version detail drawer `ui/coffeehouse-frontend/src/features/versions/components/VersionDetailDrawer.tsx` showing eligibility + payload preview.
- [X] T025 [US2] Add document detail route `ui/coffeehouse-frontend/src/app/routes/DocumentRoute.tsx` handling deep links and query prefetch.

---

## Phase 5: User Story 3 – Manage version lifecycle (Priority: P2)

**Goal**: Allow contributors to create drafts and admins to activate versions with confirmations.
**Independent Test**: Submit new version form and activate a draft using mocked APIs while previous stories remain unaffected.

### Tests (write first)
- [X] T026 [P] [US3] Write Vitest spec `ui/coffeehouse-frontend/tests/unit/versions/versionForm.test.tsx` covering JSON validation + toast errors.
- [X] T027 [P] [US3] Add Playwright scenario `ui/coffeehouse-frontend/tests/e2e/version-activation.spec.ts` for create → activate flow including role guard.

### Implementation
- [X] T028 [P] [US3] Implement create-version mutation + optimistic cache update in `ui/coffeehouse-frontend/src/features/versions/api/useCreateVersion.ts`.
- [X] T029 [US3] Build JSON payload editor + summary form `ui/coffeehouse-frontend/src/features/versions/forms/NewVersionForm.tsx` with client-side validation.
- [X] T030 [US3] Implement activation mutation/service `ui/coffeehouse-frontend/src/features/versions/api/useActivateVersion.ts` enforcing admin role.
- [X] T031 [US3] Add activation confirmation modal + progress indicator `ui/coffeehouse-frontend/src/features/versions/components/ActivationControls.tsx`.
- [X] T032 [US3] Refresh dashboard + history caches after mutations via shared `ui/coffeehouse-frontend/src/features/versions/utils/cacheInvalidation.ts`.
- [X] T055 [US3] Instrument lifecycle flow metrics in `ui/coffeehouse-frontend/src/features/versions/telemetry/versionLifecycleMetrics.ts` to record step counts and duration for SC-002 reporting.

---

## Phase 6: User Story 4 – Compare two versions (Priority: P2)

**Goal**: Provide diff visualization (split/inline) with metadata for any two versions.
**Independent Test**: Select two versions and ensure diff loads under 3 seconds with accessible highlighting.

### Tests (write first)
- [X] T033 [P] [US4] Author Vitest spec `ui/coffeehouse-frontend/tests/unit/compare/diffRenderer.test.tsx` ensuring color tokens + inline/split toggles behave.
- [X] T034 [P] [US4] Add Playwright spec `ui/coffeehouse-frontend/tests/e2e/version-compare.spec.ts` selecting versions and verifying summary metadata.
- [X] T056 [P] [US4] Create Vitest spec `ui/coffeehouse-frontend/tests/unit/compare/diffErrorStates.test.tsx` covering mismatched JSON structures and error fallbacks.
- [X] T057 [P] [US4] Add Playwright spec `ui/coffeehouse-frontend/tests/e2e/version-compare-errors.spec.ts` asserting error toasts + guidance when backend returns incompatible payloads.

### Implementation
- [X] T035 [P] [US4] Implement diff API hook `ui/coffeehouse-frontend/src/features/compare/api/useVersionDiff.ts` with TanStack Query caching and 200 KB guardrails.
- [X] T036 [US4] Integrate jsondiffpatch + diff component in `ui/coffeehouse-frontend/src/features/compare/components/VersionDiffViewer.tsx`.
- [X] T037 [US4] Build compare selector UI `ui/coffeehouse-frontend/src/features/compare/components/VersionComparePanel.tsx` enabling inline/split toggle + metadata badges.
- [X] T038 [US4] Add compare route or modal `ui/coffeehouse-frontend/src/features/compare/routes/CompareRoute.tsx` (or nested route) linking from history table.
- [X] T039 [US4] Surface diff-breaking-change warnings via toast bus `ui/coffeehouse-frontend/src/services/feedback/toastBus.ts`.
- [X] T058 [US4] Implement diff latency instrumentation + Performance API markers inside `ui/coffeehouse-frontend/src/features/compare/telemetry/diffLatencyMetrics.ts` and stream metrics to telemetry store for SC-003.
- [X] T059 [US4] Create error boundary / fallback component `ui/coffeehouse-frontend/src/features/compare/components/DiffErrorState.tsx` to present guidance when mismatched JSON payloads occur.

---

## Phase 7: User Story 5 – Manage Basic Auth credentials (Priority: P3)

**Goal**: Provide Settings/Auth page for entering credentials, testing connection, and managing session scope.
**Independent Test**: Enter credentials, run test connection, and confirm credentials persist in-memory plus auto-clear on 401.

### Tests (write first)
- [ ] T040 [P] [US5] Create Vitest spec `ui/coffeehouse-frontend/tests/unit/settings/authSettingsPanel.test.tsx` covering validation + auto-clear.
- [ ] T041 [P] [US5] Add Playwright spec `ui/coffeehouse-frontend/tests/e2e/auth-settings.spec.ts` verifying credential entry and API failure handling.
- [ ] T060 [P] [US5] Write Vitest spec `ui/coffeehouse-frontend/tests/unit/settings/sessionStoreGuards.test.ts` ensuring invalid credentials never persist after failed `/auth/check` responses.

### Implementation
- [ ] T042 [P] [US5] Implement `/auth/check` hook `ui/coffeehouse-frontend/src/features/settings/api/useAuthCheck.ts` using generated client + toast bus.
- [ ] T043 [US5] Build Settings/Auth panel `ui/coffeehouse-frontend/src/features/settings/components/AuthSettingsPanel.tsx` with test button + guidance copy.
- [ ] T044 [US5] Wire session store actions + context provider `ui/coffeehouse-frontend/src/app/providers/AuthProvider.tsx` to share credentials globally.
- [ ] T045 [US5] Add automatic credential prompts on 401 in `ui/coffeehouse-frontend/src/services/api/httpClient.ts` using Zustand store callbacks.
- [ ] T061 [US5] Enforce invalid credential guard + toast guidance inside `ui/coffeehouse-frontend/src/services/auth/sessionStore.ts`, clearing secrets immediately when `/auth/check` fails.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Finish documentation, accessibility, and performance hardening.

- [ ] T046 [P] Audit accessibility (color contrast, focus order) across `src/features/*` and document fixes in `docs/accessibility.md`.
- [ ] T047 [P] Finalize README snippet + quickstart updates referencing scripts in `ui/coffeehouse-frontend/README.md`.
- [ ] T048 Run Lighthouse/Performance tests and tune lazy loading + code splitting in `ui/coffeehouse-frontend/vite.config.ts`.
- [ ] T049 Harden error boundary + fallback UI in `ui/coffeehouse-frontend/src/app/App.tsx` ensuring correlation IDs display on failures.
- [ ] T050 Execute `pnpm lint && pnpm test:ci && pnpm test:e2e` plus `pnpm build` to validate release checklist.
- [ ] T062 Wire SC-004 supportability telemetry by streaming lifecycle + diff metrics into `ui/coffeehouse-frontend/src/services/analytics/supportInsights.ts` and documenting alert wiring.

---

## Dependencies & Execution Order

1. **Phase 1 → Phase 2**: Setup must finish before foundational infra.
2. **Phase 2 → Stories**: All user stories depend on API client, auth store, toast bus, and query provider.
3. **User Story sequencing**: Stories can begin once Phase 2 completes but should prioritize P1 (US1, US2) before P2 (US3, US4) and P3 (US5).
4. **Polish** runs after desired stories land; can start once MVP (US1) stabilizes if team capacity allows.

### Story Dependency Graph
- US1 (dashboard/list) → unblock shared data caches for others.
- US2 depends on Document detail route from US1 but remains independently testable once route shell exists.
- US3 needs US2 history data to display new draft immediately; rely on shared cache utilities.
- US4 requires US2 (version selections) but not US3.
- US5 independent aside from foundational auth store.

### Parallel Opportunities
- Tasks marked [P] can run concurrently (distinct files) such as lint setup vs Tailwind config.
- After Phase 2, different developers can own US1/US2 in parallel, then US3/US4 once respective data hooks exist.
- Test authoring tasks (Vitest/Playwright) can execute alongside component work once fixtures are ready.

## Implementation Strategy

1. **MVP First**: Deliver Phase 1 → Phase 2 → US1 to unblock demos of dashboard and list. Validate via T013–T019 tests.
2. **Incremental Delivery**: Layer US2 (history) next for compliance traceability, then US3/US4 to unlock lifecycle + diff flows, finishing with US5 settings.
3. **Parallel Team Plan**: Post-foundation, assign owners per story (e.g., Developer A: US1, Developer B: US2). Use [P] tasks to coordinate without merge conflicts.
4. **Quality Gates**: Every story includes failing tests before implementation plus final lint/test/build sweep (T050).

## Summary
- Total tasks: 60
- Task counts per story: US1 (9), US2 (6), US3 (8), US4 (11), US5 (8) — remaining tasks cover setup, foundation, and polish.
- Parallel opportunities: 32 tasks marked [P] across setup, foundation, tests, and story implementations.
- Independent Test Criteria: Each story lists explicit validation scenarios ensuring standalone verification.
- Suggested MVP Scope: Complete through Phase 3 (US1). Subsequent phases extend functionality without blocking prior flows.
