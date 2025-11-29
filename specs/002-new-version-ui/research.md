# Research: New Version UI

**Feature**: 002-new-version-ui  
**Date**: November 27, 2025  
**Purpose**: Research findings for integrating NewVersionForm into DocumentRoute

## R1: Modal Component Pattern

### Decision
Use React Portal-based modal with dialog element for CreateVersionModal wrapper.

### Rationale
- **Existing Pattern Found**: Examined activation button feature - no shared modal component exists yet
- **Browser Native Dialog**: Modern browsers support `<dialog>` element with built-in:
  - Focus trapping
  - ESC key handling
  - Backdrop styling
  - Accessibility (ARIA roles automatic)
- **React Portal**: Renders modal at document root (outside DOM hierarchy) prevents z-index issues
- **Lightweight**: ~50 lines for modal wrapper vs 200+ for custom implementation

### Implementation Approach
```typescript
// CreateVersionModal.tsx
export const CreateVersionModal = ({ isOpen, onClose, documentId }: Props) => {
  const dialogRef = useRef<HTMLDialogElement>(null)
  
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    
    if (isOpen) {
      dialog.showModal()  // Native focus trap + backdrop
    } else {
      dialog.close()
    }
  }, [isOpen])
  
  return createPortal(
    <dialog ref={dialogRef} onClose={onClose}>
      <NewVersionForm 
        documentId={documentId}
        onSuccess={onClose}
        onCancel={onClose}
      />
    </dialog>,
    document.body
  )
}
```

### Alternatives Considered
- **React Modal Library** (react-modal, @headlessui/react): Adds 50KB+ dependency, overkill for simple use case
- **CSS-only Modal**: Requires manual focus management, accessibility harder to get right
- **Inline Modal** (no portal): Can cause z-index conflicts with version history table

### Evidence
- Scanned `ui/coffeehouse-frontend/src` - no existing Modal.tsx or Dialog.tsx component
- Checked DocumentRoute.tsx - activation uses inline confirmation, not modal (different UX pattern)
- Browser support: `<dialog>` supported in Chrome 37+, Firefox 98+, Safari 15.4+ (aligns with target platforms)

---

## R2: Form State Management Strategy

### Decision
NewVersionForm manages its own state; CreateVersionModal only controls visibility (isOpen/onClose).

### Rationale
- **Existing Component Design**: NewVersionForm already self-contained with:
  - Internal state for payload, changeSummary, errors
  - Validation logic (validateJsonPayload, validateSummary)
  - Submit handling via useCreateVersion hook
  - Success/error callbacks as props
- **Single Responsibility**: Modal handles presentation, Form handles data
- **Reduced Coupling**: Parent (DocumentRoute) doesn't need to know about form internals
- **Testability**: Can test NewVersionForm in isolation without modal wrapper

### Implementation
```typescript
// DocumentRoute - only tracks modal visibility
const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

// CreateVersionModal - passes through callbacks
<NewVersionForm
  documentId={documentId}
  onSuccess={(version) => {
    onClose()  // Modal closes itself
    // Toast already shown by useCreateVersion
  }}
  onCancel={onClose}
/>
```

### Alternatives Considered
- **Lifted State**: Parent controls payload/summary via props
  - Rejected: Increases DocumentRoute complexity, duplicates validation logic
  - Only useful if multiple components need same state (not the case)
- **Form Context**: Shared context for form state
  - Rejected: Overkill for single form, adds unnecessary indirection
- **Controlled Component**: Parent controls every field value
  - Rejected: Breaks encapsulation, makes testing harder

### Trade-offs
- ✅ Pro: Simple, follows React best practices (encapsulation)
- ✅ Pro: Easy to test - NewVersionForm unit tests already exist
- ⚠️ Con: Parent can't programmatically set initial values (needed for P3 pre-population)
  - Mitigation: Add optional `initialPayload` prop to NewVersionForm

---

## R3: Cache Invalidation Scope

### Decision
Rely on useCreateVersion's existing invalidation; verify in E2E test. No additional refetch needed.

### Rationale
- **Existing Implementation**: `useCreateVersion` already invalidates:
  ```typescript
  void queryClient.invalidateQueries({
    queryKey: versionHistoryKeys.byDocument(variables.documentId)
  })
  void queryClient.invalidateQueries({
    queryKey: ['document', variables.documentId]
  })
  ```
- **React Query Behavior**: Invalidation triggers immediate background refetch for active queries
- **DocumentRoute Context**: Already renders version history via `useVersionHistory` hook
  - Query is active (component mounted)
  - Invalidation triggers auto-refetch
  - UI updates automatically when data arrives

### Verification Plan
E2E test will assert:
1. Open create version modal
2. Submit valid payload
3. Wait for success toast
4. Assert version history table shows new version (without manual refresh)
5. Assert new version appears at top (most recent)

### Fallback
If E2E test shows history doesn't update:
- Add explicit refetch in CreateVersionModal onSuccess:
  ```typescript
  const { refetch } = useVersionHistory(documentId)
  
  const handleSuccess = (version) => {
    refetch()  // Force immediate update
    onClose()
  }
  ```

### Alternatives Considered
- **Optimistic Updates**: Add new version to cache before API confirms
  - Rejected: Requires knowing versionNumber beforehand (generated by backend)
  - Risk: Cache becomes inconsistent if API fails
- **Manual Refresh Button**: User clicks to reload history
  - Rejected: Poor UX, breaks SC-003 (auto-update within 1s)
- **Polling**: Refetch version history every N seconds
  - Rejected: Wasteful, defeats purpose of React Query

### Evidence
- Reviewed `useCreateVersion.ts` lines 48-54 - invalidation already implemented
- Reviewed `useVersionHistory.ts` - returns React Query result (auto-refetches on invalidation)
- Pattern used successfully in activation button feature (same invalidation strategy)

---

## R4: Pre-population Data Source (P3 Feature)

### Decision
Filter useVersionHistory results for `isActive: true` version, pass content as initialPayload prop.

### Rationale
- **Data Already Available**: DocumentRoute renders version history table
  - Already fetched via `useVersionHistory(documentId)`
  - Contains all versions with isActive flag
  - No additional API call needed
- **Simple Filter**: `versions.find(v => v.isActive)`
- **Prop-based**: Pass `initialPayload={activeVersion?.content}` to NewVersionForm
- **Form Enhancement**: NewVersionForm uses initialPayload as textarea default value

### Implementation (P3 - Deferred After P1)
```typescript
// DocumentRoute.tsx
const { data: versionHistory } = useVersionHistory(documentId)
const activeVersion = versionHistory?.find(v => v.isActive)

<CreateVersionModal
  isOpen={isCreateModalOpen}
  onClose={handleCloseModal}
  documentId={documentId}
  initialPayload={activeVersion?.content}  // P3 feature
/>

// NewVersionForm.tsx (modify existing component)
const [payload, setPayload] = useState(
  initialPayload ? JSON.stringify(initialPayload, null, 2) : ''
)
```

### Alternatives Considered
- **Separate useActiveVersion Hook**: Dedicated API call for active version
  - Rejected: Redundant - data already in version history cache
  - Would add 1 extra network request
- **useDocument Hook**: Fetch document metadata (includes active version reference)
  - Rejected: Still requires separate call to get version content
  - More complex than filtering existing data
- **Copy-Paste from History Table**: User manually copies JSON from table
  - Rejected: Poor UX, error-prone, defeats purpose of P3 feature

### Deferred to P3
- P1: Basic create version (empty payload)
- P2: Validation improvements
- P3: Add pre-population
  - Requires modifying NewVersionForm to accept initialPayload prop
  - Low risk - optional prop, doesn't affect P1 functionality

---

## Best Practices Summary

### BP1: React Query Integration ✅
Applied throughout existing codebase:
- useCreateVersion uses useMutation
- Invalidation handled automatically
- Loading/error states exposed to UI
- Retry built into TanStack Query config

### BP2: Form Validation ✅
NewVersionForm already implements:
- Validate on blur (handlePayloadBlur, handleSummaryBlur)
- Clear errors onChange
- Focus first error field on submit (payloadRef.current?.focus())
- Semantic validation (JSON.parse, payload type check)

### BP3: E2E Testing Strategy
Will implement in create-version-flow.spec.ts:
1. Happy path: valid JSON → success toast → history refresh
2. Validation: empty payload, invalid JSON, non-object
3. Error recovery: network failure, 500 error
4. Use data-testid for stable selectors

### BP4: Accessibility
CreateVersionModal will implement:
- Focus trap: `<dialog>` element provides automatic
- ESC key: dialog.close() via onClose handler
- Focus return: dialog manages focus automatically
- aria-describedby: Error messages linked to form fields
- aria-busy: Submit button state during loading

---

## Open Questions

### Q1: Should DocumentHeader be a separate component?
**Status**: RESOLVED - Keep inline
**Reason**: Estimated <15 lines (button + click handler). Premature extraction adds complexity.
**Decision**: Extract only if header grows >30 lines during implementation.

### Q2: Should modal have max-width constraint?
**Status**: RESOLVED - Yes, 600px max-width
**Reason**: JSON payload can be long; constrain for readability. Matches existing form widths.

### Q3: Should we show loading spinner while version history refetches?
**Status**: RESOLVED - No
**Reason**: Refetch is background operation (<1s). Success toast provides feedback. Spinner would flicker annoyingly.

---

## Technology Stack Validation

All required technologies already present:
- ✅ React 19.2 (JSX, hooks, portals)
- ✅ TypeScript 5.4 (strict mode, type inference)
- ✅ TanStack Query 5.90 (mutations, cache invalidation)
- ✅ Vite 5 (fast dev server, HMR)
- ✅ Vitest + Playwright (unit + E2E testing)
- ✅ React Testing Library (component testing)

No new dependencies required.

---

## Performance Validation

Estimated performance for success criteria:

| Metric | Target | Estimate | Rationale |
|--------|--------|----------|-----------|
| Modal open | <100ms | ~20ms | React Portal render, minimal DOM |
| JSON validation | <50ms | ~5ms | Client-side JSON.parse |
| API call | <500ms | ~150ms | Network RTT + backend processing |
| History refresh | <1s | ~200ms | Cache invalidation + refetch |
| Total flow | <30s | ~10s | User typing + submit + refresh |

All targets comfortably met with existing infrastructure.

---

## Risks & Mitigation

### Risk 1: Modal doesn't trap focus correctly
**Likelihood**: Low (browser dialog handles it)
**Impact**: Medium (accessibility failure)
**Mitigation**: Manual testing + E2E tests for Tab behavior

### Risk 2: Version history doesn't auto-update
**Likelihood**: Very Low (same pattern as activation)
**Impact**: High (breaks SC-003)
**Mitigation**: E2E test catches this; fallback is manual refetch

### Risk 3: NewVersionForm needs modifications for initialPayload
**Likelihood**: Medium (P3 feature requires prop)
**Impact**: Low (optional feature)
**Mitigation**: Implement P3 separately after P1 stable

---

## Conclusion

All research tasks resolved. Implementation can proceed with high confidence:
- ✅ Modal pattern decided (dialog + portal)
- ✅ State management strategy confirmed (self-contained form)
- ✅ Cache invalidation validated (existing hook sufficient)
- ✅ Pre-population approach defined (deferred to P3)

No blockers. Ready for Phase 1 (data model & contracts). ✅
