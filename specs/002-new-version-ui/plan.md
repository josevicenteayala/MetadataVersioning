# Implementation Plan: New Version UI

**Branch**: `002-new-version-ui` | **Date**: November 27, 2025 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-new-version-ui/spec.md`

## Summary

Enable business users to create new versions of existing metadata documents through an integrated UI form on the document detail page. Users can enter JSON payload data with real-time validation, optional auto-formatting, and automatic version history refresh upon successful creation. The feature integrates the existing `NewVersionForm` component into `DocumentRoute` with proper modal presentation, error handling, and cache invalidation.

**Technical Approach**: Frontend-only integration leveraging existing backend API (`POST /api/v1/metadata/{type}/{name}/versions`), existing `useCreateVersion` hook, and existing `NewVersionForm` component. No new backend code required - this is a UI wiring task.

## Technical Context

**Language/Version**: TypeScript 5.4 (strict mode enabled)
**Primary Dependencies**: React 19.2, React Router 7.9, TanStack Query 5.90, Zustand 5.0, Vite 5
**Storage**: Browser localStorage for session state only (no persistent storage for form data)
**Testing**: Vitest (unit), Playwright (E2E), React Testing Library (component)
**Target Platform**: Modern web browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
**Project Type**: Single-page application (SPA) with React
**Performance Goals**: 
- Form modal opens in <100ms
- JSON validation provides feedback in <50ms
- Version creation API call completes in <500ms
- Version history refresh completes in <1s after successful creation
**Constraints**:
- Must work with existing `NewVersionForm` component (no rewrite)
- Must preserve existing modal/dialog patterns used elsewhere in app
- Must maintain consistency with activation button and version history UI
- JSON payload validation must happen client-side before API submission
**Scale/Scope**: 
- Single feature affecting 1 route component (DocumentRoute)
- ~3-5 new integration components (modal wrapper, trigger button, success handlers)
- Estimated 200-300 lines of new code
- Reuses 273-line `NewVersionForm` component

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Code Quality & Architecture ✅
- **Hexagonal Architecture**: ✅ **ADAPTED** - React SPA follows component-based architecture aligned with hexagonal principles:
  - Domain: Feature modules (versions, documents) contain business logic and validation
  - Application: React hooks abstract API calls (useCreateVersion, useVersionHistory)
  - Adapters: API clients (Axios), React Router, TanStack Query, Zustand stores
  - Note: Frontend uses React best practices; full hexagonal pattern with port/adapter interfaces applies primarily to backend Java application
- **SOLID Principles**: ✅ Will follow:
  - Single Responsibility: Form handles input, route handles integration, hook handles API
  - Open/Closed: Component composition for extensibility
  - Interface Segregation: Props interfaces define narrow contracts
  - Dependency Inversion: useCreateVersion hook abstracts API details
- **Type Safety**: ✅ TypeScript strict mode already enabled, all new code will have explicit types

### II. Testing Standards ✅
- **TDD**: ✅ Will write E2E test scenarios first (Playwright), then component tests (RTL), then implementation
- **Coverage Thresholds**: ✅ Targeting:
  - New components: 90%+ (integration code)
  - Form integration: 85%+ (UI flows)
  - E2E scenarios: Cover all P1 acceptance criteria
- **Test Pyramid**: ✅ Will maintain:
  - Unit: Form validation logic, utility functions
  - Integration: Component rendering, hook behavior, cache invalidation
  - E2E: Complete user flow from button click to version history refresh

### III. User Experience Consistency ✅
- **Dual Interfaces**: ✅ Backend API already supports POST endpoint; UI will provide guided experience
- **Validation Feedback**: ✅ Inline validation with clear error messages ("Payload must be a JSON object")
- **Terminology**: ✅ Uses "version", "payload", "activate" consistently with existing UI

### IV. Performance Requirements ✅
- **Response Times**: ✅ Targets align with constitution (<500ms CRUD, <1s list)
- **Scalability**: ✅ Stateless frontend; React Query handles caching and invalidation
- **Resource Efficiency**: ✅ Pagination already implemented in version history
- **Observability**: ✅ Correlation IDs already supported; telemetry hooks will track form metrics

**GATE STATUS**: ✅ **PASS** - All principles satisfied, no violations to justify

## Project Structure

### Documentation (this feature)

```text
specs/002-new-version-ui/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── create-version-integration.yaml
├── checklists/
│   └── requirements.md  # Already created
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
ui/coffeehouse-frontend/
├── src/
│   ├── app/
│   │   └── routes/
│   │       └── DocumentRoute.tsx          # MODIFY: Add "Create New Version" button + modal integration
│   ├── features/
│   │   ├── versions/
│   │   │   ├── api/
│   │   │   │   └── useCreateVersion.ts    # EXISTS: Already implemented
│   │   │   ├── components/
│   │   │   │   └── CreateVersionModal.tsx # NEW: Modal wrapper for NewVersionForm
│   │   │   ├── forms/
│   │   │   │   └── NewVersionForm.tsx     # EXISTS: Already implemented (273 lines)
│   │   │   └── index.ts                   # MODIFY: Export CreateVersionModal
│   │   └── documents/
│   │       └── components/
│   │           └── DocumentHeader.tsx     # NEW: Extract header with create button from DocumentRoute
│   └── services/
│       └── feedback/
│           └── toastBus.ts               # EXISTS: Already handles success/error toasts
├── tests/
│   ├── e2e/
│   │   └── create-version-flow.spec.ts   # NEW: E2E test for complete flow
│   └── unit/
│       └── features/
│           └── versions/
│               └── CreateVersionModal.test.tsx  # NEW: Component integration test
└── package.json
```

**Structure Decision**: Using existing `ui/coffeehouse-frontend` structure established by feature 001-coffeehouse-frontend. All new code follows established patterns: features organized by domain (versions, documents), components separated from API hooks, tests mirror source structure. No new directories needed beyond adding one component.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*No violations detected - gate passed cleanly.*

## Phase 0: Research & Design Decisions

### Research Tasks

**R1: Modal Component Pattern** ✅ RESOLVED
- **Decision**: Use existing dialog/modal pattern from activation button feature
- **Rationale**: DocumentRoute already uses modals for activation confirmation; maintain consistency
- **Implementation**: Check if shared Modal component exists, otherwise create lightweight wrapper using browser dialog element or React Portal
- **Evidence Required**: Scan codebase for existing modal implementations

**R2: Form State Management Strategy** ✅ RESOLVED
- **Decision**: Let NewVersionForm manage its own state (already does); parent only handles open/close
- **Rationale**: NewVersionForm is self-contained with validation, submit, error handling
- **Implementation**: CreateVersionModal passes documentId + callbacks, renders NewVersionForm
- **Trade-off**: Could lift state to parent for more control, but increases coupling

**R3: Cache Invalidation Scope** ✅ RESOLVED
- **Decision**: useCreateVersion already invalidates correct queries; verify in testing
- **Rationale**: Hook invalidates `versionHistoryKeys.byDocument(documentId)` and `['document', documentId]`
- **Verification**: Confirm version history table auto-updates after creation in E2E test
- **Fallback**: If auto-update fails, add explicit refetch in modal onSuccess callback

**R4: Pre-population Data Source (P3 Feature)** ✅ RESOLVED
- **Decision**: Fetch active version from useVersionHistory results or separate useActiveVersion hook
- **Rationale**: Document route already has access to version history; filter for `isActive: true`
- **Implementation**: Pass `initialPayload` prop to NewVersionForm; form uses it as textarea default value
- **Deferred**: Implement in separate subtask after P1 working; requires conditional prop handling

### Best Practices

**BP1: React Query Integration**
- Use mutation hooks for write operations (already done in useCreateVersion)
- Invalidate queries optimistically for better UX
- Handle loading, error, success states explicitly in UI
- Provide retry mechanism for failed requests

**BP2: Form Validation**
- Validate on blur for non-intrusive feedback
- Clear errors onChange to provide immediate positive feedback
- Focus first error field on submit for accessibility
- Use semantic HTML5 validation attributes where possible

**BP3: E2E Testing Strategy**
- Test happy path first (valid JSON → success toast → history refresh)
- Test validation errors second (empty payload, invalid JSON, non-object)
- Test error recovery (network failure → retry button)
- Use data-testid for stable selectors (not text content or classes)

**BP4: Accessibility**
- Modal must trap focus (Tab cycles within modal)
- ESC key closes modal
- Focus returns to trigger button on close
- Error messages associated with form fields via aria-describedby
- Submit button disabled during loading with aria-busy

## Phase 1: Data Model & Contracts

### Entities

**CreateVersionModal** (New Component)
- Purpose: Wraps NewVersionForm in modal presentation
- Props:
  - `isOpen: boolean` - Controls modal visibility
  - `onClose: () => void` - Callback to close modal
  - `documentId: string` - Format: "{type}/{name}"
  - `initialPayload?: Record<string, unknown>` - Pre-fill for P3 feature
- State: Manages open/close only; delegates form state to NewVersionForm
- Behavior:
  - Renders Modal container + NewVersionForm
  - Calls onClose when NewVersionForm succeeds or user cancels
  - Passes success/error callbacks to NewVersionForm

**DocumentHeader** (New Component - Optional Extraction)
- Purpose: Encapsulate document header with create button
- Props:
  - `documentType: string`
  - `documentName: string`
  - `onCreateVersion: () => void`
- Alternative: Keep inline in DocumentRoute if <20 lines

**Modified DocumentRoute**
- New State:
  - `isCreateModalOpen: boolean` - Controls CreateVersionModal visibility
- New Handlers:
  - `handleOpenCreateModal()` - Sets isCreateModalOpen = true
  - `handleCloseCreateModal()` - Sets isCreateModalOpen = false
  - `handleCreateSuccess(version)` - Shows toast, closes modal (already handled by useCreateVersion)
- New Render:
  - Add "Create New Version" button in header
  - Render <CreateVersionModal> conditionally

### API Contracts

**POST /api/v1/metadata/{type}/{name}/versions** (Existing - Reference Only)

Request:
```json
{
  "payload": {
    "key": "value"
  },
  "changeSummary": "Description of changes"
}
```

Response (201 Created):
```json
{
  "type": "loyalty-program",
  "name": "spring-bonus",
  "versionNumber": 3,
  "content": { "key": "value" },
  "author": "user@example.com",
  "createdAt": "2025-11-27T20:00:00Z",
  "changeSummary": "Description of changes",
  "publishingState": "DRAFT",
  "isActive": false
}
```

Error Response (400 Bad Request):
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid payload",
  "status": 400,
  "timestamp": "2025-11-27T20:00:00Z"
}
```

### Component Contracts

**NewVersionForm Interface** (Existing - Reference)
```typescript
interface NewVersionFormProps {
  documentId: string
  onSuccess?: (version: CreateVersionResponse) => void
  onCancel?: () => void
  initialPayload?: Record<string, unknown>  // P3 feature
}
```

**CreateVersionModal Interface** (New)
```typescript
interface CreateVersionModalProps {
  isOpen: boolean
  onClose: () => void
  documentId: string
  initialPayload?: Record<string, unknown>  // P3 feature
}
```

## Phase 2: Implementation Tasks

*Tasks will be generated by `/speckit.tasks` command - not part of this plan output*

Next steps:
1. ✅ Research complete (Phase 0)
2. ✅ Data model defined (Phase 1)
3. ✅ Contracts documented (Phase 1)
4. ⏭️ Run `/speckit.tasks` to generate detailed implementation tasks (Phase 2)
5. ⏭️ Execute tasks following TDD workflow (Phase 3)

## Success Criteria Validation

All success criteria from spec.md mapped to implementation:

- **SC-001** (< 30s to create version): Modal opens instantly, form validation is immediate, API call <500ms
- **SC-002** (95% success rate): Client-side validation catches errors before API submission
- **SC-003** (Version history updates <1s): React Query invalidation triggers immediate refetch
- **SC-004** (One-click format): NewVersionForm already implements "Format JSON" button
- **SC-005** (80% fewer failed API calls): Inline validation prevents bad requests
- **SC-006** (Clear error messages): NewVersionForm provides user-friendly error text

All acceptance criteria from spec.md will be covered by E2E tests in Phase 2.
