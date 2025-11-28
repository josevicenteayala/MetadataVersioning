# Feature Specification: New Version UI

**Feature Branch**: `002-new-version-ui`  
**Created**: November 27, 2025  
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

1. **Given** user is typing in payload editor, **When** JSON syntax becomes invalid, **Then** editor highlights the syntax error with specific error message
2. **Given** user has entered valid but poorly formatted JSON, **When** user clicks "Format JSON" button, **Then** JSON is auto-formatted with proper indentation
3. **Given** payload field is empty, **When** user attempts to submit, **Then** system displays "Payload is required" validation error
4. **Given** user enters non-object JSON (array or primitive), **When** user attempts to submit, **Then** system displays "Payload must be a JSON object" error

---

### User Story 3 - Pre-populate with Current Active Version (Priority: P3)

A business user creating a new version often wants to start with the current active version's payload and make incremental changes rather than typing from scratch. When they open the new version form, the JSON payload editor is pre-populated with the current active version's content, allowing them to modify only what needs to change.

**Why this priority**: Nice-to-have enhancement that reduces typing and errors when making incremental changes. Not critical for MVP since users can copy-paste from version history if needed.

**Independent Test**: Can be tested by opening the new version form from a document with an active version, verifying that the payload editor contains the active version's JSON, making a small modification, and successfully creating the new version.

**Acceptance Scenarios**:

1. **Given** document has an active version, **When** user opens new version form, **Then** payload editor is pre-filled with active version's JSON content
2. **Given** payload is pre-populated, **When** user modifies the JSON and submits, **Then** new version contains the modified payload only
3. **Given** document has no active version (only draft versions), **When** user opens new version form, **Then** payload editor is empty with placeholder text

---

### Edge Cases

- What happens when user attempts to create version while another version creation is in progress? (Disable submit button, show loading state)
- What happens when backend returns 500 error during version creation? (Display error toast with retry option)
- What happens when user enters extremely large JSON payload (>10MB)? (Show validation error "Payload exceeds maximum size")
- What happens when user navigates away while form has unsaved changes? (Show confirmation dialog "You have unsaved changes")
- What happens when payload contains special characters or Unicode? (JSON stringification should handle it correctly)
- What happens when user pastes formatted JSON with comments (non-standard JSON)? (Strip comments or show validation error)
- What happens when network is lost during submission? (Show offline error with retry button)
- What happens when user tries to create version for a document they don't have permission to modify? (Backend returns 403, show permission denied error)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a "Create New Version" button on the document detail page header
- **FR-002**: System MUST open a modal/form when user clicks "Create New Version" button
- **FR-003**: New version form MUST include JSON payload editor (textarea or code editor)
- **FR-004**: New version form MUST include change summary text input field (max 500 characters)
- **FR-005**: System MUST validate JSON payload syntax before allowing submission
- **FR-006**: System MUST validate that payload is a JSON object (not array or primitive)
- **FR-007**: System MUST validate that change summary is not empty and under 500 characters
- **FR-008**: System MUST call POST \`/api/v1/metadata/{type}/{name}/versions\` endpoint to create version
- **FR-009**: System MUST send payload as \`payload\` field and summary as \`changeSummary\` field in request body
- **FR-010**: System MUST display success toast notification when version is created successfully
- **FR-011**: System MUST invalidate and refresh version history query cache after successful creation
- **FR-012**: System MUST close the form modal after successful version creation
- **FR-013**: System MUST display error message if JSON payload validation fails
- **FR-014**: System MUST display error message if backend API call fails
- **FR-015**: System MUST disable submit button while API request is pending (loading state)
- **FR-016**: Form MUST include "Cancel" button to close without creating version
- **FR-017**: Form MUST include "Format JSON" button to auto-format payload with proper indentation
- **FR-018**: System MUST focus on first error field when validation fails
- **FR-019**: System MUST clear field-level errors when user starts typing in that field
- **FR-020**: System MUST pre-populate payload editor with active version content when available (P3 feature)

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

- **SC-001**: Users can create a new document version in under 30 seconds from opening the form to seeing success confirmation
- **SC-002**: 95% of version creation attempts with valid JSON succeed on first try (without validation errors)
- **SC-003**: Version history table updates within 1 second after successful version creation
- **SC-004**: Users can format messy JSON payload with one button click, reducing manual formatting time
- **SC-005**: Inline validation catches JSON syntax errors before submission, reducing failed API calls by 80%
- **SC-006**: Form provides clear error messages that users can understand without technical knowledge

## Assumptions *(mandatory)*

- **A-001**: Backend API endpoint POST \`/api/v1/metadata/{type}/{name}/versions\` already exists and is functional
- **A-002**: useCreateVersion React hook is already implemented and tested
- **A-003**: NewVersionForm component exists but needs to be integrated into DocumentRoute
- **A-004**: Users have necessary authentication credentials to create versions
- **A-005**: Document detail page (DocumentRoute) already displays document metadata and version history
- **A-006**: useVersionHistory query hook handles cache invalidation correctly
- **A-007**: Toast notification system is already set up and working
- **A-008**: Users are familiar with JSON syntax or have access to documentation
- **A-009**: Modal/dialog component system is available for use
- **A-010**: Form follows existing design system patterns and styles

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
