# Frontend Integration Contract: Create Version Modal

**Feature**: 002-new-version-ui  
**Contract Type**: Component Integration  
**Last Updated**: November 27, 2025

## Overview

This contract defines the integration between `DocumentRoute`, `CreateVersionModal`, and `NewVersionForm` for the new version creation flow. Since this is a frontend-only feature, there are no new API endpoints—the contract specifies component props, state management, and event flows.

## Component Contracts

### CreateVersionModal Component

**Location**: `ui/coffeehouse-frontend/src/features/versions/components/CreateVersionModal.tsx` (to be created)

**Purpose**: Modal wrapper that presents the version creation form in a dialog overlay.

#### Props

```typescript
interface CreateVersionModalProps {
  /** Controls modal visibility */
  isOpen: boolean
  
  /** Callback fired when modal should close (user cancel or success) */
  onClose: () => void
  
  /** Document identifier in format "{type}/{name}" */
  documentId: string
  
  /** Optional initial JSON payload to pre-populate form (P3 feature) */
  initialPayload?: Record<string, unknown>
}
```

#### Behavior Contract

**MUST**:
- Render a `<dialog>` element via React Portal to `document.body`
- Call `dialog.showModal()` when `isOpen` becomes `true`
- Call `dialog.close()` when `isOpen` becomes `false`
- Call `onClose()` when form submission succeeds
- Call `onClose()` when user clicks cancel or presses Escape key
- Prevent interaction with content behind modal (dialog element handles this)
- Center modal vertically and horizontally
- Include close button (X) in top-right corner
- Set `aria-modal="true"` and `aria-labelledby` for accessibility

**MUST NOT**:
- Persist any form data (all state lives in `NewVersionForm`)
- Make direct API calls (delegated to `useCreateVersion`)
- Block scrolling of document content (dialog element handles this)
- Allow interaction with modal when `isOpen={false}`

**Example Usage**:
```tsx
<CreateVersionModal
  isOpen={isCreateModalOpen}
  onClose={handleCloseCreateModal}
  documentId="loyalty-program/spring-bonus"
/>
```

### DocumentRoute Component (Modified)

**Location**: `ui/coffeehouse-frontend/src/app/routes/DocumentRoute.tsx` (existing, to be modified)

**New State**:
```typescript
const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
```

**New Handlers**:
```typescript
const handleOpenCreateModal = useCallback(() => {
  setIsCreateModalOpen(true)
}, [])

const handleCloseCreateModal = useCallback(() => {
  setIsCreateModalOpen(false)
}, [])
```

**New Button Placement**:
- Location: Document header section, to the right of document name
- Visual: Primary button style (blue background, white text)
- Label: "Create New Version"
- Disabled state: When document is not found or user lacks permission (future enhancement)

**Modal Integration**:
```tsx
{/* Existing document content */}
<CreateVersionModal
  isOpen={isCreateModalOpen}
  onClose={handleCloseCreateModal}
  documentId={documentId}
/>
```

## API Contract (Reference Only - Already Implemented)

### POST /api/v1/metadata/{type}/{name}/versions

**Backend Endpoint**: Already exists in Spring Boot backend.

**Request**:
```json
{
  "content": {
    "programId": "LP2025-SPRING",
    "maxReward": 100
  },
  "changeSummary": "Increased max reward from 50 to 100"
}
```

**Response (201 Created)**:
```json
{
  "type": "loyalty-program",
  "name": "spring-bonus",
  "versionNumber": 4,
  "content": {
    "programId": "LP2025-SPRING",
    "maxReward": 100
  },
  "author": "user@example.com",
  "createdAt": "2025-11-27T20:30:00Z",
  "changeSummary": "Increased max reward from 50 to 100",
  "publishingState": "DRAFT",
  "isActive": false,
  "correlationId": "corr-abc123"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid JSON payload or missing fields
- `404 Not Found`: Document {type}/{name} does not exist
- `500 Internal Server Error`: Server error

## Event Flow Contracts

### Happy Path Flow

```
User Click "Create New Version"
  → DocumentRoute.handleOpenCreateModal()
  → setIsCreateModalOpen(true)
  → CreateVersionModal renders with isOpen={true}
  → dialog.showModal() called
  → User sees modal with NewVersionForm
  → User types JSON payload
  → User types change summary
  → User clicks "Create Version"
  → NewVersionForm validates input (client-side)
  → NewVersionForm calls useCreateVersion.mutateAsync()
  → API POST /api/v1/metadata/{type}/{name}/versions
  → Backend returns 201 with new version
  → useCreateVersion invalidates queries
  → Toast success notification appears
  → NewVersionForm.onSuccess() fires
  → CreateVersionModal.onClose() fires
  → DocumentRoute.handleCloseCreateModal()
  → setIsCreateModalOpen(false)
  → dialog.close() called
  → Modal disappears
  → Version history refetches (React Query invalidation)
  → New version appears in table
```

### Error Path Flow

```
User clicks "Create Version" (invalid JSON)
  → NewVersionForm validates input
  → Validation fails (invalid JSON syntax)
  → Inline error message appears
  → Submit button stays enabled
  → User corrects JSON
  → User retries submission
```

```
User clicks "Create Version" (valid input, API error)
  → NewVersionForm validates input (passes)
  → useCreateVersion.mutateAsync() called
  → API POST returns 400 (e.g., schema violation)
  → useCreateVersion.onError fires
  → Toast error notification appears
  → Modal stays open
  → User can correct and retry or cancel
```

### Cancel Flow

```
User clicks "Cancel" button
  → NewVersionForm.onCancel() fires
  → CreateVersionModal.onClose() fires
  → DocumentRoute.handleCloseCreateModal()
  → setIsCreateModalOpen(false)
  → dialog.close() called
  → Modal disappears
  → Form state discarded (not persisted)
```

```
User presses Escape key
  → dialog element fires "cancel" event
  → CreateVersionModal.onClose() fires
  → (same flow as Cancel button)
```

## State Management Contract

### Component State Ownership

| State | Owner | Type | Lifetime |
|-------|-------|------|----------|
| `isCreateModalOpen` | `DocumentRoute` | `boolean` | Route lifecycle |
| Form inputs (payload, summary) | `NewVersionForm` | `string` | Modal open lifecycle |
| Validation errors | `NewVersionForm` | `{payload?: string, changeSummary?: string}` | Modal open lifecycle |
| Submit loading state | `useCreateVersion` | `boolean` | API call lifecycle |

### Cache Invalidation Contract

**Triggered On**: Successful version creation (201 response)

**Queries Invalidated**:
```typescript
// Version history query (table will refetch)
queryClient.invalidateQueries({
  queryKey: ['versionHistory', documentId]
})

// Document metadata query (if used)
queryClient.invalidateQueries({
  queryKey: ['document', documentId]
})
```

**Expected Result**:
- Version history table updates within 1 second (SC-003)
- New version appears at top of table (sorted by versionNumber DESC)
- Loading indicators appear briefly during refetch

## Validation Contracts

### Client-Side Validation (NewVersionForm)

**Payload Field**:
- Required: `true`
- Type: JSON object (not array/primitive)
- Validation timing: On blur, on submit
- Error message: "Payload is required" | "Invalid JSON syntax" | "Payload must be a JSON object"

**Change Summary Field**:
- Required: `true`
- Max length: 500 characters
- Validation timing: On blur, on submit
- Error message: "Summary is required" | "Summary must be 500 characters or less"

**Submit Button State**:
- Disabled when: Form is submitting (loading state)
- Enabled when: Form is idle OR validation errors exist (allow retry)

### Server-Side Validation (Reference)

**Backend Already Enforces**:
- JSON schema validation (if schema defined for document type)
- Payload size limits (<10MB)
- Required fields (content, changeSummary)
- Document existence check (404 if document not found)

## Accessibility Contracts

**Keyboard Navigation**:
- Tab order: Close button → Payload field → Summary field → Cancel button → Create button
- Escape key closes modal
- Enter key submits form (when focused in textarea, user must Ctrl+Enter)
- Focus trapped within modal when open

**Screen Reader Announcements**:
- Modal title announced when opened: "Create New Version for {document name}"
- Error messages announced immediately when validation fails
- Success announcement: "Version created successfully"
- Loading state: "Creating version..."

**ARIA Attributes**:
- `aria-modal="true"` on dialog element
- `aria-labelledby="modal-title"` on dialog element
- `aria-describedby="modal-description"` if description exists
- `aria-invalid="true"` on fields with validation errors
- `aria-live="polite"` on error message containers

## Performance Contracts

**Modal Open Time**: <100ms (per plan.md)
- Measure: Time from button click to modal visible
- Optimization: Dialog element already in DOM (hidden), React Portal minimal overhead

**Validation Time**: <50ms (per plan.md)
- Measure: Time from blur event to error message visible
- Optimization: JSON.parse is synchronous and fast for typical payloads (<100KB)

**API Call Time**: <500ms at p95 (per plan.md)
- Measure: Time from submit click to success/error notification
- Backend SLA: POST endpoint must respond within 500ms

**UI Update Time**: <1000ms (per SC-003)
- Measure: Time from API success response to new version visible in table
- Optimization: React Query invalidation triggers immediate refetch

## Testing Contracts

### Unit Tests (React Testing Library)

**CreateVersionModal.test.tsx**:
- Renders dialog when `isOpen={true}`
- Does not render when `isOpen={false}`
- Calls `onClose` when user clicks cancel
- Calls `onClose` when user presses Escape
- Renders NewVersionForm with correct props
- Passes `documentId` to NewVersionForm
- Traps focus within modal when open

**DocumentRoute.test.tsx** (new tests):
- Renders "Create New Version" button
- Opens modal when button clicked
- Closes modal when `handleCloseCreateModal` called
- Passes correct `documentId` to modal

### Integration Tests (Playwright)

**create-version-flow.spec.ts**:
- User can open modal via button
- User can enter JSON payload
- User can enter change summary
- User sees validation error for invalid JSON
- User sees success toast on successful creation
- Modal closes after successful creation
- Version appears in table after creation
- User can cancel and modal closes without creating version

### E2E Test Contract

**Prerequisites**:
- Backend running with test database
- User authenticated (if auth enabled)
- Document "loyalty-program/spring-bonus" exists with version 3

**Test Steps**:
1. Navigate to `/documents/loyalty-program/spring-bonus`
2. Click "Create New Version" button
3. Enter valid JSON in payload field: `{"programId": "LP2025-TEST", "maxReward": 150}`
4. Enter summary: "E2E test version"
5. Click "Create Version" button
6. Wait for success toast
7. Verify modal closed
8. Verify version 4 appears in table with summary "E2E test version"

**Expected Results**:
- ✅ Modal opens within 100ms
- ✅ JSON validation passes
- ✅ API returns 201 Created
- ✅ Success toast appears
- ✅ Modal closes automatically
- ✅ Version table updates within 1s
- ✅ New version at top of table

## Breaking Changes

**None**: This feature adds new UI components without modifying existing contracts.

**Backwards Compatibility**:
- Existing `NewVersionForm` unchanged (already supports optional `initialPayload` prop)
- Existing `useCreateVersion` hook unchanged
- Existing API endpoint unchanged
- Existing tests still pass

## Future Enhancements (Out of Scope for P1)

- P3: Pre-populate form with active version payload (requires `initialPayload` prop)
- Future: Permission checks (disable button if user lacks write access)
- Future: Autosave draft versions (requires localStorage or backend draft API)
- Future: Rich JSON editor with syntax highlighting (current: plain textarea)

## Summary

This contract defines:
- ✅ Component props and responsibilities
- ✅ State management ownership
- ✅ Event flows (happy path, errors, cancel)
- ✅ Validation rules (client and server)
- ✅ Accessibility requirements
- ✅ Performance targets
- ✅ Testing requirements

All contracts leverage existing infrastructure (NewVersionForm, useCreateVersion, backend API) to minimize risk and development time. No breaking changes introduced.
