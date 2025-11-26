# Feature Specification: Coffeehouse-Inspired Metadata Frontend

**Feature Branch**: `001-coffeehouse-frontend`  
**Created**: 2025-11-25  
**Status**: Draft  
**Input**: User description: "Build a coffeehouse-inspired frontend that consumes the Metadata Versioning API, covering document lists, version history, version creation/activation, diffing, and Basic Auth flows."

## Clarifications

### Session 2025-11-25

- Q: Which user roles may create or activate versions? → A: Contributors can create drafts; only admins activate/deactivate versions.

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Discover documents at a glance (Priority: P1)

Metadata stewards land on the dashboard to review document stats and browse paginated metadata documents with coffeehouse-inspired visuals.

**Why this priority**: The list and dashboard are the daily entry point and must highlight active work plus campaign health before any deeper action.

**Independent Test**: Load the dashboard using sample data and confirm users can view stats, search, filter, and paginate without touching other flows.

**Acceptance Scenarios**:

1. **Given** stored Basic Auth credentials, **When** the user opens the dashboard, **Then** the hero section shows document counts, active version totals, and calls to action styled per brand palette.
2. **Given** 60+ metadata documents, **When** the user searches or pages through the list, **Then** only matching rows render with status chips, last-updated timestamps, and an active-version badge.

---

### User Story 2 - Inspect version history (Priority: P1)

Metadata owners open a document detail page to review every version, status, author, and change notes before taking action.

**Why this priority**: Compliance teams need traceability on every document before publishing, making history visibility core to business value.

**Independent Test**: Navigate directly to a document detail page via deep link and verify the version table renders all metadata and action buttons without relying on other stories.

**Acceptance Scenarios**:

1. **Given** a document with multiple versions, **When** the user scrolls the history table, **Then** they see chronological entries with status chips, created/activation dates, author, and summary.
2. **Given** the user selects a version row, **When** they open the detail drawer, **Then** the UI highlights whether it is active, provides activation controls, and displays correlation-id from the last API response when available.

---

### User Story 3 - Manage version lifecycle (Priority: P2)

Authorized users create new versions, provide change notes, and activate selected versions with confirmation toasts.

**Why this priority**: Publishing new metadata must be a controlled process with clear draft-to-active transitions that minimize errors.

**Independent Test**: Use mocked API responses to create a version, see it appear in history, and activate it, without invoking diff or settings features.

**Acceptance Scenarios**:

1. **Given** valid Basic Auth credentials, **When** the user submits the create-version form with JSON payload and summary, **Then** the UI shows a success toast, correlation-id, and the new version appears as Draft.
2. **Given** a Draft or Approved version, **When** the user selects "Activate" and confirms, **Then** the version status updates to Active, previous active version demotes, and the dashboard metrics refresh.

---

### User Story 4 - Compare two versions (Priority: P2)

Reviewers pick any two versions to view highlighted JSON differences side-by-side or inline to understand changes quickly.

**Why this priority**: Visual diffs unlock confident approvals and reduce back-and-forth with engineering.

**Independent Test**: Provide two mocked JSON payloads and verify the diff view renders with add/remove/change highlights and metadata without other stories.

**Acceptance Scenarios**:

1. **Given** at least two versions exist, **When** the user selects a "from" and "to" version, **Then** a diff view renders highlighting additions, removals, and modified fields with color cues matching the brand palette.
2. **Given** the diff is open, **When** the user toggles between inline and split view, **Then** the renderer switches layouts without re-fetching data and keeps scroll positions aligned.

---

### User Story 5 - Manage Basic Auth credentials (Priority: P3)

Users provide and test Basic Auth credentials once per session, ensuring all API calls reuse the stored token without reload.

**Why this priority**: API security requires authenticated calls, yet the UI must keep the experience approachable for business users.

**Independent Test**: Visit the settings/auth page, enter credentials, run test connection, and confirm persistence in memory without touching other stories.

**Acceptance Scenarios**:

1. **Given** no credentials are stored, **When** the user opens Settings, **Then** they see inputs for username/password, a test connection button, and contextual guidance.
2. **Given** credentials are saved, **When** the token expires or a call fails with 401, **Then** the UI prompts the user to re-authenticate and surfaces the latest correlation-id.

### Edge Cases

- Empty states when no documents exist or filters remove all rows should still render the layout with guidance cards.
- Pagination controls must disable next/previous buttons when users are on the respective boundaries.
- Network failures or 5xx responses should trigger branded error toasts that include the X-Correlation-ID if present.
- Invalid Basic Auth credentials must never be stored; prompt users with non-technical guidance before allowing retries.
- Diff view must handle mismatched JSON structures gracefully, calling out unsupported comparisons instead of failing silently.
- Mobile screens must collapse tables into cards without losing access to actions like Activate or Compare.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The dashboard MUST present total documents, active versions, and quick actions within a branded hero section every time a user logs in.
- **FR-002**: The documents list MUST support search, status filtering, and pagination with visible chips for draft/approved/published/archived states.
- **FR-003**: Each document detail view MUST display a chronological version table including status, author, created date, activation date, and change summary.
- **FR-004**: Users MUST be able to open a version detail drawer or panel that surfaces activation eligibility, payload preview, and correlation-id for the last operation.
- **FR-005**: The UI MUST provide a form to create a new version, including JSON payload input, validation, and change summary notes.
- **FR-006**: After successfully creating a version, the system MUST refresh the history list, highlight the new version, and display a confirmation toast referencing the correlation-id.
- **FR-007**: The system MUST allow activating an eligible version with confirmation, ensuring the previously active version downgrades to the correct status and the dashboard stats refresh.
- **FR-008**: Users MUST be able to select any two versions of the same document and view JSON differences with clear color-coded add/remove/change indicators plus metadata (author, timestamp).
- **FR-009**: The diff view MUST support at least two presentation modes (split and inline) and remember the last selection during the session.
- **FR-010**: The application MUST collect Basic Auth credentials via a dedicated Settings/Auth view, test them against the API, and store them in-memory for subsequent requests only after a successful test.
- **FR-011**: All API errors MUST produce contextual toasts or inline alerts that include human-readable text and correlation-id when provided by the backend.
- **FR-012**: Layouts MUST remain usable on mobile by stacking cards, collapsing tables, and retaining primary actions via menus or floating buttons.
- **FR-013**: Users MUST be able to configure the API base URL from a single configuration surface referenced by the README instructions.
- **FR-014**: Role permissions MUST ensure contributor-level users can create drafts while only admin-level users can activate or deactivate versions.

### Key Entities *(include if feature involves data)*

- **DocumentSummary**: Represents a metadata document with id, name, status, last updated timestamp, counts of versions, and active version reference used in dashboard/list views.
- **MetadataVersion**: Captures version id, document id, status, author, created timestamp, activation timestamp, change summary, and JSON payload reference used in history, activation, and diff features.
- **SessionCredentials**: Holds in-memory Basic Auth username/password plus last validation timestamp, scoped to the browser session and never persisted to storage.
- **DiffResult**: Describes the comparison between two versions including added/removed/changed paths, textual annotations, and metadata (compare timestamp, user who initiated compare).

### Assumptions & Constraints

- The existing Metadata Versioning API already enforces permissions; the frontend only needs to collect Basic Auth credentials and pass them through each call.
- Users primarily access the tool from modern evergreen browsers, allowing CSS animations and variable fonts compatible with the coffeehouse-inspired design language.
- Correlation-ids are provided via the `X-Correlation-ID` header on every backend response; when absent, the UI omits the reference.
- The coffeehouse-inspired palette and imagery are brand directions only; no licensed third-party assets are required or provided.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: 90% of users can locate a specific document and view its history within 2 minutes of landing on the dashboard during usability tests.
- **SC-002**: Creating and activating a new version requires no more than 3 user-facing steps post-authentication and completes successfully in 95% of monitored sessions.
- **SC-003**: Diff comparisons render within 3 seconds for payloads up to 200 KB while highlighting every changed path, as measured in staged environments.
- **SC-004**: Support inquiries related to “What changed between versions?” decrease by 50% within one quarter of launch, indicating adoption of the comparison experience.
- **SC-005**: At least 85% of surveyed users describe the look and feel as “on brand” or “delightful,” confirming the coffeehouse-inspired UI direction.
