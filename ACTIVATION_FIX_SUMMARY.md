# Activate Version Button Fix Summary

**Date**: November 27, 2025  
**Issue**: The "Activate Version" button in the version detail drawer was not activating versions.

## Root Causes Identified

### 1. Incorrect API URL Construction
**File**: `ui/coffeehouse-frontend/src/features/versions/api/useActivateVersion.ts`

**Problem**: The frontend was constructing the API endpoint URL incorrectly:
- **Before**: `/api/v1/metadata/${documentId}/versions/${versionId}/activate`
  - Where `documentId` = `"config/app-settings"` (composite string)
- **Expected by backend**: `/api/v1/metadata/${type}/${name}/versions/${versionNumber}/activate`
  - Where `type` = `"config"` and `name` = `"app-settings"` (separate path parameters)

**Fix**: Modified the `activateVersion` function to split the `documentId` into `type` and `name` components:

```typescript
const activateVersion = async (request: ActivateVersionRequest): Promise<ActivateVersionResponse> => {
  // Split documentId (e.g., "config/app-settings") into type and name
  const [type, name] = request.documentId.split('/')
  if (!type || !name) {
    throw new Error(`Invalid documentId format: ${request.documentId}. Expected format: type/name`)
  }

  const response = await httpClient.post<ActivateVersionResponse>(
    `/api/v1/metadata/${type}/${name}/versions/${request.versionId}/activate`,
  )
  // ... rest of implementation
}
```

### 2. Missing Confirmation Modal
**File**: `ui/coffeehouse-frontend/src/features/versions/components/VersionDetailDrawer.tsx`

**Problem**: The version detail drawer was implementing its own activation logic without using the `ActivationControls` component, which includes:
- Confirmation modal (required by spec and E2E tests)
- Proper role checking
- Loading states
- Error handling

**Fix**: 
1. Removed the custom activation logic from `VersionDetailDrawer`
2. Integrated the existing `ActivationControls` component in the drawer footer
3. Removed unused imports (`useActivateVersion`, `useCanActivate`)

**Before**:
```tsx
// Custom implementation in drawer
const { mutate: activate, isPending: isActivating } = useActivateVersion({
  onSuccess: () => onClose()
})

const handleActivate = () => {
  if (version) {
    activate({
      documentId: version.documentId,
      versionId: version.versionNumber.toString()
    })
  }
}

// In footer:
<button onClick={handleActivate} disabled={isActivating || !canActivate}>
  {isActivating ? 'Activating...' : 'Activate Version'}
</button>
```

**After**:
```tsx
// In footer:
<ActivationControls version={version} onActivated={onClose} />
```

### 3. Incorrect Dependency in useCallback
**File**: `ui/coffeehouse-frontend/src/features/versions/components/ActivationControls.tsx`

**Problem**: The dependency array in `handleConfirm` callback referenced `version.versionId` but the function body correctly used `version.versionNumber.toString()`.

**Fix**: Updated the dependency array to match the actual dependencies:

```typescript
const handleConfirm = useCallback(async () => {
  try {
    await mutateAsync({
      documentId: version.documentId,
      versionId: version.versionNumber.toString(),
    })
  } catch {
    // Error handled by mutation
  }
}, [mutateAsync, version.documentId, version.versionNumber]) // Fixed: was version.versionId
```

## Files Modified

1. `ui/coffeehouse-frontend/src/features/versions/api/useActivateVersion.ts`
   - Added URL path splitting logic for `type` and `name`
   - Added validation for documentId format

2. `ui/coffeehouse-frontend/src/features/versions/components/VersionDetailDrawer.tsx`
   - Removed custom activation logic
   - Integrated `ActivationControls` component
   - Removed unused imports

3. `ui/coffeehouse-frontend/src/features/versions/components/ActivationControls.tsx`
   - Fixed dependency array in `handleConfirm` callback

## Expected Behavior After Fix

1. **User clicks "Activate Version" button** in version detail drawer
2. **Confirmation modal appears** asking "Are you sure you want to activate vX?"
3. **User clicks "Confirm"** in the modal
4. **API request is sent** to `/api/v1/metadata/{type}/{name}/versions/{versionNumber}/activate`
5. **Success toast appears** with "Version activated" message
6. **Version status updates** to "Active" in the UI
7. **Previously active version** is demoted to "Published"
8. **Drawer closes** (via `onActivated` callback)

## Testing Recommendations

### Manual Testing
1. Start both backend (port 8080) and frontend (port 5173)
2. Navigate to any document with multiple versions
3. Click on a draft/published version in the history table
4. Click "Activate Version" in the detail drawer
5. Verify confirmation modal appears
6. Click "Confirm"
7. Verify success toast and status update

### E2E Test Coverage
The fix ensures these existing E2E tests will pass:
- `tests/e2e/version-activation.spec.ts`:
  - `activates version after confirmation`
  - `shows activate button for draft version`
  - `hides activate button for already active version`
  - `admin can activate versions`
  - `contributor cannot activate versions`

## Related Specifications

- **User Story 3** (Manage version lifecycle): FR-013, FR-014, FR-015
- **OpenAPI Contract**: `/metadata/{type}/{name}/versions/{versionNumber}/activate`
- **E2E Tests**: `tests/e2e/version-activation.spec.ts`

## Notes

- The backend endpoint and tests were already correct
- The issue was entirely in the frontend implementation
- No backend changes were required
- The `ActivationControls` component was already implemented correctly but wasn't being used
