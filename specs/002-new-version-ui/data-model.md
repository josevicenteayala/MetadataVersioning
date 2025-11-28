# Data Model: New Version UI

**Feature**: 002-new-version-ui  
**Date**: November 27, 2025

## Overview

This feature involves UI state management and component integration rather than new data entities. The data model focuses on component props, local state, and integration contracts.

## Component Models

### CreateVersionModal (New)

**Purpose**: Modal wrapper that presents NewVersionForm in a dialog overlay.

**Props Interface**:
```typescript
interface CreateVersionModalProps {
  isOpen: boolean
  onClose: () => void
  documentId: string
  initialPayload?: Record<string, unknown>
}
```

**State**: None (stateless presentation component)

**Behavior**:
- Renders browser `<dialog>` element via React Portal
- Shows/hides based on `isOpen` prop
- Calls `onClose` when form succeeds or user cancels
- Passes `documentId` and optional `initialPayload` to NewVersionForm

### NewVersionForm (Existing - Reference)

**Purpose**: Captures JSON payload and change summary inputs with validation.

**Props Interface**:
```typescript
interface NewVersionFormProps {
  documentId: string
  onSuccess?: (version: CreateVersionResponse) => void
  onCancel?: () => void
  initialPayload?: Record<string, unknown>  // P3 feature
}
```

**Internal State**:
```typescript
{
  payload: string              // JSON text entered by user
  changeSummary: string        // Description of changes
  errors: {
    payload?: string           // Validation error for payload field
    changeSummary?: string     // Validation error for summary field
  }
  submitError: string | null   // API error message
}
```

**Validation Rules**:
- Payload: Must be valid JSON, must be object (not array/primitive), required
- Change Summary: Required, max 500 characters

### DocumentRoute (Modified)

**New State**:
```typescript
{
  isCreateModalOpen: boolean  // Controls CreateVersionModal visibility
}
```

**New Handlers**:
```typescript
handleOpenCreateModal: () => void
handleCloseCreateModal: () => void
```

## API Data Models (Reference Only - No Changes)

### CreateVersionRequest

**Structure**:
```typescript
interface CreateVersionRequest {
  documentId: string                  // Format: "{type}/{name}"
  payload: Record<string, unknown>    // JSON object (not array/primitive)
  changeSummary: string               // Max 500 characters
}
```

**Example**:
```json
{
  "documentId": "loyalty-program/spring-bonus",
  "payload": {
    "programId": "LP2025-SPRING",
    "maxReward": 100,
    "tiers": ["silver", "gold", "platinum"]
  },
  "changeSummary": "Increased max reward from 50 to 100"
}
```

### CreateVersionResponse

**Structure**:
```typescript
interface CreateVersionResponse extends MetadataVersion {
  correlationId?: string
}

interface MetadataVersion {
  type: string
  name: string
  versionNumber: number
  content: Record<string, unknown>
  author: string
  createdAt: string
  changeSummary: string
  publishingState: 'DRAFT' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED'
  isActive: boolean
}
```

**Example**:
```json
{
  "type": "loyalty-program",
  "name": "spring-bonus",
  "versionNumber": 4,
  "content": {
    "programId": "LP2025-SPRING",
    "maxReward": 100,
    "tiers": ["silver", "gold", "platinum"]
  },
  "author": "user@example.com",
  "createdAt": "2025-11-27T20:30:00Z",
  "changeSummary": "Increased max reward from 50 to 100",
  "publishingState": "DRAFT",
  "isActive": false,
  "correlationId": "corr-abc123"
}
```

## State Flow

### Happy Path Flow

1. **User Action**: Click "Create New Version" button
   - `DocumentRoute` sets `isCreateModalOpen = true`

2. **Modal Opens**:
   - `CreateVersionModal` receives `isOpen={true}`
   - Dialog renders via Portal
   - `NewVersionForm` initializes with empty state (or pre-populated if P3)

3. **User Input**:
   - User types JSON in payload textarea
   - User types description in change summary input
   - Validation runs on blur

4. **Form Submit**:
   - `NewVersionForm` calls `validateJsonPayload()` and `validateSummary()`
   - If valid, calls `useCreateVersion.mutateAsync()`
   - Submit button disabled (loading state)

5. **API Success**:
   - Backend returns `CreateVersionResponse`
   - `useCreateVersion` invalidates version history cache
   - Toast notification shows success message
   - `onSuccess` callback fires → `onClose()` called
   - Modal closes (`isCreateModalOpen = false`)

6. **Auto-Refresh**:
   - React Query refetches version history (invalidation triggered)
   - Version history table updates with new version at top
   - User sees new version immediately

### Error Path Flow

1. **Validation Error** (before API call):
   - `NewVersionForm` shows inline error message
   - Submit button stays enabled
   - User can correct input and retry

2. **API Error** (400/500):
   - `useCreateVersion.onError` fires
   - Error toast notification appears
   - Modal stays open
   - User can correct and retry or cancel

## Cache Invalidation

### Queries Invalidated on Success

```typescript
// Triggered by useCreateVersion hook
queryClient.invalidateQueries({
  queryKey: versionHistoryKeys.byDocument(documentId)
})

queryClient.invalidateQueries({
  queryKey: ['document', documentId]
})
```

### Impact
- Version history table refetches automatically (query is active)
- Document metadata refetches (if used elsewhere)
- UI updates within 1 second (per SC-003)

## Validation Details

### JSON Payload Validation

**Client-Side** (in NewVersionForm):
```typescript
function validateJsonPayload(value: string): Result {
  if (!value.trim()) {
    return { valid: false, error: 'Payload is required' }
  }
  
  try {
    const parsed = JSON.parse(value)
    
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { valid: false, error: 'Payload must be a JSON object' }
    }
    
    return { valid: true, data: parsed }
  } catch {
    return { valid: false, error: 'Invalid JSON syntax' }
  }
}
```

**Server-Side** (reference - already implemented):
- Schema validation if schema defined for document type
- JSON size limits (<10MB)
- Structure validation (max depth, key naming rules)

### Change Summary Validation

**Client-Side**:
```typescript
function validateSummary(value: string): string | undefined {
  if (!value.trim()) {
    return 'Summary is required'
  }
  if (value.length > 500) {
    return 'Summary must be 500 characters or less'
  }
  return undefined
}
```

## Component Relationships

```
DocumentRoute
  ├── [Header Section]
  │     └── <button onClick={handleOpenCreateModal}>
  │           Create New Version
  │         </button>
  │
  └── <CreateVersionModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        documentId={documentId}
      >
        └── <dialog> (React Portal to document.body)
              └── <NewVersionForm
                    documentId={documentId}
                    onSuccess={handleCloseCreateModal}
                    onCancel={handleCloseCreateModal}
                  />
```

## Data Persistence

**No New Persistence**: This feature only manages UI state in memory.

- Form data cleared when modal closes (ephemeral)
- No localStorage/sessionStorage for draft versions
- No autosave functionality
- User must complete submission in one session

**Rationale**: Version creation is quick (<30s per SC-001). Autosave adds complexity without clear user benefit.

## Type Safety

All components use explicit TypeScript interfaces:
- No `any` types
- Strict null checks enabled
- Props validated at compile time
- API responses typed via generated client or manual types

Example:
```typescript
// ✅ Good: Explicit types
const [isModalOpen, setIsModalOpen] = useState<boolean>(false)

// ❌ Bad: Inferred any
const [modalState, setModalState] = useState({})
```

## Summary

This feature is primarily UI integration work with minimal new data modeling:

- **New Components**: 1 (CreateVersionModal)
- **Modified Components**: 1 (DocumentRoute)
- **Existing Components Reused**: 1 (NewVersionForm)
- **New API Calls**: 0 (POST endpoint already exists)
- **New Database Tables**: 0
- **New State Management**: 1 boolean flag (isCreateModalOpen)

The data model focuses on component contracts (props, state) rather than domain entities because this is a frontend UI feature building on existing backend infrastructure.
