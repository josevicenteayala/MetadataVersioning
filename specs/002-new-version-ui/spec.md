# Feature Specification: New Version UI

**Feature Branch**: `002-new-version-ui`  
**Created**: November 27, 2025  
**Updated**: November 28, 2025 (Gap Analysis Update)  
**Status**: Draft  
**Input**: User description: "Having an existing document, implement a feature that allows to create new versions of the same Document changing the PAYLOAD only"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create New Document Version from Detail Page (Priority: P1)

A business user viewing a specific document detail page needs to create a new version with updated payload data. They click "Create New Version" button, enter the new JSON payload and a change summary, then submit to create a draft version. The version history automatically updates to show the new version.

**Why this priority**: This is the core user interaction - enabling users to create new versions from the document detail view without navigating away. This represents the minimum viable feature that delivers immediate value.

**Independent Test**: Can be fully tested by navigating to a document detail page, clicking the "Create New Version" button, entering valid JSON payload and summary, submitting the form, and verifying that a new version appears in the version history list.

**Acceptance Scenarios**:

1. **Given** user is viewing document detail page with existing versions, **When** user clicks "Create New Version" button, **Then** modal/form appears with JSON payload editor and change summary input fields
2. **Given** new version form is open, **When** user enters valid JSON payload and change summary and submits, **Then** system creates new draft version and displays success notification
3. **Given** new version was just created successfully, **When** form closes, **Then** version history table refreshes automatically to show the newly created version at the top
4. **Given** user is in new version form, **When** user enters invalid JSON syntax, **Then** system displays inline validation error before allowing submission
5. **Given** new version form is open, **When** user clicks cancel, **Then** form closes without creating a version and no data is lost from document

---

### User Story 2 - Validate JSON Payload Before Submission (Priority: P2)

A business user entering JSON payload data needs immediate feedback on syntax errors and formatting issues. They type JSON in the payload editor, and the system provides real-time validation highlighting syntax errors, missing braces, or invalid structure. Users can also format messy JSON with one click.

**Why this priority**: Prevents submission errors and reduces frustration. While not strictly required for MVP (P1 allows submission with basic validation), this significantly improves user experience by catching errors earlier.

**Independent Test**: Can be tested by opening the new version form, typing invalid JSON, and verifying that validation errors appear inline before submission. Test auto-formatting by pasting unformatted JSON and clicking "Format" button.

**Acceptance Scenarios**:

1. **Given** user is typing in payload editor, **When** JSON syntax becomes invalid, **Then** editor displays specific error message below field (e.g., "Unexpected token at line 3, column 5")
2. **Given** user has entered valid but poorly formatted JSON, **When** user clicks "Format JSON" button, **Then** JSON is auto-formatted with 2-space indentation and sorted keys
3. **Given** payload field is empty, **When** user attempts to submit, **Then** system displays "Payload is required" validation error
4. **Given** user enters non-object JSON (array or primitive), **When** user attempts to submit, **Then** system displays "Payload must be a JSON object" error

---

### User Story 3 - Pre-populate with Current Active Version (Priority: P3)

A business user creating a new version often wants to start with the current active version's payload and make incremental changes rather than typing from scratch. When they open the new version form, the JSON payload editor is pre-populated with the current active version's content, allowing them to modify only what needs to change.

**Why this priority**: Nice-to-have enhancement that reduces typing and errors when making incremental changes. Not critical for MVP since users can copy-paste from version history if needed.

**Independent Test**: Can be tested by opening the new version form from a document with an active version, verifying that the payload editor contains the active version's JSON, making a small modification, and successfully creating the new version.

**Acceptance Scenarios**:

1. **Given** document has an active version, **When** user opens new version form, **Then** payload editor is pre-filled with active version's JSON content (pretty-printed with 2-space indentation)
2. **Given** payload is pre-populated, **When** user modifies the JSON and submits, **Then** new version contains the modified payload only
3. **Given** document has no active version (only draft versions), **When** user opens new version form, **Then** payload editor is empty with placeholder text "Enter JSON payload..."

---

### Edge Cases

#### Concurrent Operations

- **EC-001**: When user attempts to create version while another version creation is in progress → Disable submit button, show loading spinner with "Creating version..." text
- **EC-002**: When multiple users create versions for same document concurrently → Backend handles conflict; if HTTP 409 returned, display "Another version was just created. Please refresh and try again."

#### Network & Server Errors

- **EC-003**: When backend returns HTTP 400 Bad Request → Display backend validation errors inline (e.g., schema validation failures)
- **EC-004**: When backend returns HTTP 401 Unauthorized (session expired) → Display "Session expired. Please log in again." and redirect to login after 3 seconds
- **EC-005**: When backend returns HTTP 403 Forbidden → Display "You don't have permission to create versions for this document."
- **EC-006**: When backend returns HTTP 404 Not Found (document deleted) → Display "This document no longer exists." and close modal
- **EC-007**: When backend returns HTTP 409 Conflict → Display "A conflicting change occurred. Please refresh and try again."
- **EC-008**: When backend returns HTTP 413 Payload Too Large → Display "Payload exceeds maximum size of 1MB."
- **EC-009**: When backend returns HTTP 429 Rate Limited → Display "Too many requests. Please wait {retry-after} seconds."
- **EC-010**: When backend returns HTTP 500/502/503 → Display "Server error. Please try again." with "Retry" button
- **EC-011**: When network timeout occurs (>30 seconds) → Display "Request timed out. Please check your connection and try again."
- **EC-012**: When network is lost during submission → Display "Network connection lost. Your changes are preserved. Reconnect and try again."
- **EC-013**: When partial network failure (request sent, no response) → After 30s timeout, display "Unable to confirm if version was created. Please check version history."

#### Input Validation Edge Cases

- **EC-014**: When payload is exactly at maximum size (1MB) → Accept and submit
- **EC-015**: When change summary is exactly 500 characters → Accept and submit; show character count "500/500"
- **EC-016**: When JSON has deeply nested objects (>100 levels) → Display "JSON nesting exceeds maximum depth of 100 levels."
- **EC-017**: When JSON contains duplicate keys → Accept last value per RFC 8259; no error displayed
- **EC-018**: When JSON contains numbers exceeding JavaScript precision (>Number.MAX_SAFE_INTEGER) → Accept as-is; backend handles precision
- **EC-019**: When JSON contains escaped Unicode sequences → Parse correctly per RFC 8259
- **EC-020**: When JSON contains null values → Accept as valid; null is a valid JSON value
- **EC-021**: When user pastes rich text with formatting → Strip formatting, keep plain text only
- **EC-022**: When user pastes JSON with comments (non-standard) → Display "Invalid JSON: Comments are not allowed in JSON."
- **EC-023**: When payload is empty object `{}` → Accept as valid; empty object is a valid payload

#### User Interaction Edge Cases

- **EC-024**: When user double-clicks submit button → Ignore second click; button disabled on first click
- **EC-025**: When user presses browser back button while modal is open → Close modal, stay on document page
- **EC-026**: When user refreshes page while modal is open → Show browser's native "unsaved changes" warning
- **EC-027**: When user presses Escape key → Close modal (same as Cancel)
- **EC-028**: When user presses Ctrl+Enter / Cmd+Enter → Submit form (keyboard shortcut)
- **EC-029**: When screen is resized while modal is open → Modal remains centered and responsive
- **EC-030**: When user switches browser tabs and returns → Modal state preserved; no data loss

#### State Transition Edge Cases

- **EC-031**: When user closes modal during active API request → Cancel request if possible; if response arrives after close, ignore silently
- **EC-032**: When API success response arrives after modal closed → Refresh version history silently; no toast (user already left)
- **EC-033**: When user rapidly opens/closes modal → Debounce; ensure clean state on each open
- **EC-034**: When document is deleted while form is open → On submit, handle 404 as per EC-006

## Requirements *(mandatory)*

### Functional Requirements

#### Core Functionality (FR-001 to FR-020)

- **FR-001**: System MUST display a "Create New Version" button on the document detail page header
- **FR-002**: System MUST open a modal/form when user clicks "Create New Version" button
- **FR-003**: New version form MUST include JSON payload editor (textarea or code editor)
- **FR-004**: New version form MUST include change summary text input field (max 500 characters)
- **FR-005**: System MUST validate JSON payload syntax per RFC 8259 before allowing submission
- **FR-006**: System MUST validate that payload is a JSON object (not array or primitive); empty object `{}` is valid
- **FR-007**: System MUST validate that change summary is not empty (whitespace-only is considered empty) and under 500 characters
- **FR-008**: System MUST call POST `/api/v1/metadata/{type}/{name}/versions` endpoint to create version
- **FR-009**: System MUST send JSON payload as `content` field and summary as `changeSummary` field in request body (UI uses "payload" terminology, API uses "content")
- **FR-010**: System MUST display success toast notification (duration: 5 seconds, position: top-right) when version is created successfully
- **FR-011**: System MUST invalidate and refresh version history query cache after successful creation
- **FR-012**: System MUST close the form modal after successful version creation
- **FR-013**: System MUST display inline validation error (red text, below field, with error icon) if JSON payload validation fails
- **FR-014**: System MUST display user-friendly error message with correlation ID if backend API call fails (e.g., "Failed to create version. Error ID: {correlationId}")
- **FR-015**: System MUST disable submit button while API request is pending (loading state with spinner)
- **FR-016**: Form MUST include "Cancel" button to close without creating version (always enabled, even during loading)
- **FR-017**: Form MUST include "Format JSON" button to auto-format payload with 2-space indentation
- **FR-018**: System MUST focus on first error field when validation fails (payload field takes priority over summary field)
- **FR-019**: System MUST clear field-level errors when user starts typing in that field
- **FR-020**: System MUST pre-populate payload editor with active version content (pretty-printed with 2-space indentation) when available (P3 feature)

#### Accessibility Requirements (FR-021 to FR-030)

- **FR-021**: Modal MUST set initial focus to payload editor when opened
- **FR-022**: Modal MUST return focus to "Create New Version" button when closed
- **FR-023**: Modal MUST be closable via Escape key (same behavior as Cancel button)
- **FR-024**: Modal MUST trap focus within dialog (Tab cycles through modal elements only)
- **FR-025**: Modal MUST have `role="dialog"` and `aria-modal="true"` attributes
- **FR-026**: Modal MUST have `aria-labelledby` pointing to modal title
- **FR-027**: Form fields MUST have associated `<label>` elements or `aria-label` attributes
- **FR-028**: Validation errors MUST be announced to screen readers via `aria-live="polite"` region
- **FR-029**: Success/error toasts MUST be announced to screen readers via `aria-live="assertive"`
- **FR-030**: All interactive elements MUST be keyboard accessible with visible focus indicators

#### Error Handling Requirements (FR-031 to FR-040)

- **FR-031**: System MUST display specific error messages for each HTTP error code (see Edge Cases EC-003 to EC-013)
- **FR-032**: Error messages MUST include correlation ID when available from backend response
- **FR-033**: System MUST provide "Retry" button for recoverable errors (500, 502, 503, network errors)
- **FR-034**: System MUST preserve form data when displaying errors (no data loss on error)
- **FR-035**: System MUST handle session expiration (401) by redirecting to login
- **FR-036**: System MUST validate payload size client-side before submission (max 1MB)
- **FR-037**: System MUST validate JSON nesting depth client-side (max 100 levels)
- **FR-038**: System MUST show character count for change summary field (format: "X/500")
- **FR-039**: System MUST debounce JSON validation to avoid excessive re-validation during typing (300ms delay)
- **FR-040**: System MUST cancel pending API requests when modal is closed

### Key Entities

- **NewVersionForm**: UI component that captures payload and change summary inputs
  - Attributes: documentId (to identify which document), payload (JSON object), changeSummary (string)
  - Validates inputs before submission
  - Communicates with backend via useCreateVersion hook
  
- **CreateVersionRequest**: API request payload
  - Fields: documentId (derived from type/name), payload (Record<string, unknown>), changeSummary (string)
  
- **CreateVersionResponse**: API response containing created version metadata
  - Fields: versionId, versionNumber, publishingState (DRAFT), author, createdAt, correlationId (optional)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a new document version in under 30 seconds measured from modal opening (visible) to success toast appearing
- **SC-002**: 95% of version creation attempts with valid JSON succeed on first try - Measured over 100+ test submissions across 3+ user cohorts during acceptance testing; excludes intentional error scenario testing; baseline established during first sprint
- **SC-003**: Version history table updates within 1 second after success toast appears - Measured via automated E2E test timing assertions
- **SC-004**: Users can format messy JSON payload with one button click - "Format JSON" button produces valid, 2-space indented JSON
- **SC-005**: Inline validation catches JSON syntax errors before submission - Measured by counting validation errors vs API 400 errors; target 80% reduction from baseline (baseline = API errors before validation feature)
- **SC-006**: Form provides clear error messages - Measured via user comprehension survey (>80% users understand error without help) OR all error messages follow pattern: "{What happened}. {What to do next}."

### Performance Targets

- **PT-001**: Modal opens in <100ms from button click to visible
- **PT-002**: JSON validation feedback appears in <50ms after user stops typing (after 300ms debounce)
- **PT-003**: API request completes in <500ms under normal conditions (P95)
- **PT-004**: JSON formatting completes in <100ms for payloads up to 100KB

## Assumptions *(mandatory)*

- **A-001**: Backend API endpoint POST `/api/v1/metadata/{type}/{name}/versions` already exists and is functional
- **A-002**: useCreateVersion React hook is already implemented and tested (verified via existing unit tests)
- **A-003**: NewVersionForm component exists and is functional (verified at ui/coffeehouse-frontend/src/features/versions/forms/NewVersionForm.tsx)
- **A-004**: Users have necessary authentication credentials to create versions
- **A-005**: Document detail page (DocumentRoute) already displays document metadata and version history
- **A-006**: useVersionHistory query hook handles cache invalidation correctly (verified via TanStack Query invalidateQueries)
- **A-007**: Toast notification system is already set up and working (uses existing toastBus service)
- **A-008**: Users are familiar with JSON syntax or have access to documentation
- **A-009**: Modal/dialog component system is available for use (using native HTML dialog element with React Portal)
- **A-010**: Form follows existing design system patterns and styles (Tailwind CSS tokens)

## Non-Functional Requirements *(mandatory)*

### Accessibility (WCAG 2.1 AA Compliance)

- **NFR-001**: Modal MUST meet WCAG 2.1 AA accessibility guidelines
- **NFR-002**: Color contrast for error states MUST be at least 4.5:1 for normal text
- **NFR-003**: Focus indicators MUST be visible with at least 3:1 contrast ratio
- **NFR-004**: All form controls MUST be operable via keyboard only
- **NFR-005**: Screen reader users MUST be able to complete the full workflow

### Performance

- **NFR-006**: Modal render time MUST be <100ms on Chrome 90+ with 4x CPU throttling
- **NFR-007**: JSON parsing MUST complete in <500ms for 1MB payload
- **NFR-008**: Memory usage MUST not exceed 50MB additional heap for 1MB payload editing

### Browser Compatibility

- **NFR-009**: Feature MUST work on Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **NFR-010**: Feature MUST work on screen widths from 768px to 2560px (tablet to 4K)
- **NFR-011**: Mobile devices (<768px) are explicitly out of scope for this feature

### Internationalization (Deferred)

- **NFR-012**: Error messages are in English only for this release
- **NFR-013**: i18n support for error messages is deferred to future release

## Dependencies *(mandatory)*

- **D-001**: Backend API must be running and accessible at the correct endpoint
- **D-002**: User must be authenticated with valid session credentials
- **D-003**: Document must exist in the system before versions can be created
- **D-004**: Data caching and synchronization system must be configured for cache management
- **D-005**: Toast notification service must be initialized and functional

## Out of Scope *(mandatory)*

- **OS-001**: Editing existing versions (versions are immutable)
- **OS-002**: Deleting versions (not part of this feature)
- **OS-003**: Activating versions immediately upon creation (stays as draft)
- **OS-004**: Schema validation UI (backend handles schema validation)
- **OS-005**: Bulk version creation or batch operations
- **OS-006**: Version comparison or diff visualization in this form
- **OS-007**: File upload for JSON payload (manual entry only)
- **OS-008**: Version templates or saved payload snippets
- **OS-009**: Collaborative editing or real-time multi-user support
- **OS-010**: Advanced JSON editor features (syntax highlighting, autocomplete) - using basic textarea
- **OS-011**: Customizing which fields from payload to display in form
- **OS-012**: Version branching or parallel version streams
