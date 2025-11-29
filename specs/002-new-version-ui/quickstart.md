# Quickstart Guide: New Version UI Feature

**Feature**: 002-new-version-ui  
**Last Updated**: November 27, 2025

## Overview

This guide helps developers set up, implement, test, and verify the "Create New Version" UI feature. Follow this guide if you're implementing the feature for the first time or onboarding to the codebase.

## Prerequisites

**Required**:
- Node.js 20+ installed
- pnpm 8+ installed (`npm install -g pnpm`)
- Git installed
- Backend API running on `http://localhost:8080` (or configured via env)

**Optional**:
- VS Code with recommended extensions (ESLint, Prettier, Playwright)
- Docker (if running backend via docker-compose)

## Setup Steps

### 1. Clone and Install

```bash
# Clone repository
git clone <repository-url>
cd MetadataVersioning

# Checkout feature branch
git checkout 002-new-version-ui

# Install frontend dependencies
cd ui/coffeehouse-frontend
pnpm install
```

### 2. Start Backend (if not running)

**Option A: Docker Compose** (recommended):
```bash
# From repository root
docker-compose up -d postgres backend

# Verify backend is running
curl http://localhost:8080/actuator/health
```

**Option B: Local Java**:
```bash
# From repository root
./mvnw spring-boot:run

# Verify backend is running
curl http://localhost:8080/actuator/health
```

### 3. Start Frontend Dev Server

```bash
# From ui/coffeehouse-frontend
pnpm dev

# Frontend will be available at http://localhost:5173
```

### 4. Verify Setup

Open browser to `http://localhost:5173` and verify:
- ✅ Application loads without errors
- ✅ Navigation works (click "Documents" link)
- ✅ Document list appears (may be empty if database is fresh)

**Seed Test Data** (if database is empty):
```bash
# Run seed script (if available)
pnpm seed

# OR manually create test document via backend API
curl -X POST http://localhost:8080/api/v1/metadata/loyalty-program/test-doc \
  -H "Content-Type: application/json" \
  -d '{
    "content": {"programId": "TEST-001", "maxReward": 50},
    "changeSummary": "Initial version"
  }'
```

## Implementation Guide

### Phase 1: Create CreateVersionModal Component

**File**: `ui/coffeehouse-frontend/src/features/versions/components/CreateVersionModal.tsx`

**Steps**:
1. Create component file:
   ```bash
   mkdir -p src/features/versions/components
   touch src/features/versions/components/CreateVersionModal.tsx
   ```

2. Implement modal with dialog element and React Portal (see `data-model.md` for props)

3. Import and render `NewVersionForm` inside modal

4. Handle `onClose` callback for cancel and success flows

**Acceptance Criteria**:
- Modal opens when `isOpen={true}`
- Modal uses `<dialog>` element via React Portal
- Modal closes on Escape key, cancel button, and successful submission
- Modal renders `NewVersionForm` with correct props

### Phase 2: Integrate into DocumentRoute

**File**: `ui/coffeehouse-frontend/src/app/routes/DocumentRoute.tsx`

**Steps**:
1. Add state: `const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)`

2. Add handlers:
   ```tsx
   const handleOpenCreateModal = useCallback(() => {
     setIsCreateModalOpen(true)
   }, [])

   const handleCloseCreateModal = useCallback(() => {
     setIsCreateModalOpen(false)
   }, [])
   ```

3. Add button in header section:
   ```tsx
   <button
     onClick={handleOpenCreateModal}
     className="btn-primary"
   >
     Create New Version
   </button>
   ```

4. Render modal at end of component:
   ```tsx
   <CreateVersionModal
     isOpen={isCreateModalOpen}
     onClose={handleCloseCreateModal}
     documentId={documentId}
   />
   ```

**Acceptance Criteria**:
- Button appears in document header
- Button click opens modal
- Modal closes after successful submission
- Version table updates automatically after creation

### Phase 3: Write Tests

**Unit Tests** (`CreateVersionModal.test.tsx`):
```bash
touch src/features/versions/components/CreateVersionModal.test.tsx
```

Test cases:
- Renders when `isOpen={true}`
- Does not render when `isOpen={false}`
- Calls `onClose` on Escape key
- Calls `onClose` on cancel button
- Passes `documentId` to `NewVersionForm`

**Integration Tests** (`create-version.spec.ts`):
```bash
touch e2e/create-version.spec.ts
```

Test cases:
- User can open modal via button
- User can submit valid version
- User sees validation errors for invalid JSON
- Modal closes after successful creation
- Version appears in table after creation

### Phase 4: Verify Implementation

**Manual Testing Checklist**:
- [ ] Navigate to document detail page
- [ ] Click "Create New Version" button
- [ ] Modal opens within 100ms (feels instant)
- [ ] Enter invalid JSON → See error message
- [ ] Correct JSON → Error clears
- [ ] Enter change summary (required field)
- [ ] Click "Create Version" → Loading state shows
- [ ] Success toast appears
- [ ] Modal closes automatically
- [ ] New version appears at top of table within 1s
- [ ] Cancel button closes modal without creating version
- [ ] Escape key closes modal

**Automated Test Verification**:
```bash
# Run unit tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Run type checking
pnpm typecheck

# Run linting
pnpm lint
```

## Testing Workflows

### Unit Testing (TDD Workflow)

1. **Red**: Write failing test
   ```bash
   pnpm test CreateVersionModal.test.tsx --watch
   ```

2. **Green**: Implement minimal code to pass test

3. **Refactor**: Improve code quality while tests pass

4. **Repeat**: For each requirement (FR-001 to FR-020)

### E2E Testing

**Run All E2E Tests**:
```bash
pnpm test:e2e
```

**Run Specific Test**:
```bash
pnpm test:e2e create-version.spec.ts
```

**Debug E2E Test** (headed mode):
```bash
pnpm test:e2e --headed --debug
```

**Generate E2E Test Report**:
```bash
pnpm test:e2e --reporter=html
```

### Performance Testing

**Measure Modal Open Time**:
```typescript
// In E2E test
const startTime = performance.now()
await page.click('button:has-text("Create New Version")')
await page.waitForSelector('dialog[open]')
const duration = performance.now() - startTime
expect(duration).toBeLessThan(100) // <100ms target
```

**Measure Validation Time**:
```typescript
// In E2E test
const startTime = performance.now()
await page.fill('textarea[name="payload"]', 'invalid json')
await page.blur('textarea[name="payload"]')
await page.waitForSelector('text=Invalid JSON syntax')
const duration = performance.now() - startTime
expect(duration).toBeLessThan(50) // <50ms target
```

## Troubleshooting

### Modal Not Opening

**Symptom**: Click button, nothing happens

**Debug Steps**:
1. Check browser console for errors
2. Verify `isCreateModalOpen` state changes:
   ```tsx
   console.log('Modal state:', isCreateModalOpen)
   ```
3. Verify `CreateVersionModal` component renders:
   ```tsx
   console.log('Rendering modal, isOpen:', isOpen)
   ```
4. Check React DevTools for component tree

**Common Causes**:
- Button `onClick` not wired correctly
- Modal component not imported
- Dialog element not rendering (check Portal)

### Validation Not Working

**Symptom**: Invalid JSON accepted or no error shown

**Debug Steps**:
1. Check `NewVersionForm` validation logic:
   ```tsx
   console.log('Validation result:', validateJsonPayload(value))
   ```
2. Verify error state updates:
   ```tsx
   console.log('Error state:', errors)
   ```
3. Check error message rendering in DOM

**Common Causes**:
- Validation function not called on blur
- Error state not passed to input component
- CSS hiding error message

### Version Not Appearing After Creation

**Symptom**: Success toast shows, modal closes, but table unchanged

**Debug Steps**:
1. Check React Query DevTools for cache invalidation
2. Verify version history query refetches:
   ```tsx
   console.log('Query status:', versionHistoryQuery.status)
   ```
3. Check backend response (Network tab in browser DevTools)
4. Verify API endpoint matches backend (should be `/api/v1/metadata/...`)

**Common Causes**:
- Cache invalidation not triggered (check `useCreateVersion` hook)
- Query key mismatch between `useCreateVersion` and `useVersionHistory`
- Backend returned error (check status code)
- Frontend not polling for updates (should auto-refetch)

### Backend Connection Errors

**Symptom**: API calls fail with network errors

**Debug Steps**:
1. Verify backend is running:
   ```bash
   curl http://localhost:8080/actuator/health
   ```
2. Check backend logs for errors
3. Verify CORS configuration (if frontend on different port)
4. Check API base URL in frontend config

**Common Causes**:
- Backend not started
- Backend crashed (check logs)
- CORS not configured for `http://localhost:5173`
- Incorrect API base URL in `.env` file

## Development Tips

### Use React Query DevTools

```tsx
// In App.tsx, add during development
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

<ReactQueryDevtools initialIsOpen={false} />
```

**Benefits**:
- Inspect query cache
- See when queries refetch
- Manually invalidate queries
- View mutation status

### Use React DevTools

Install browser extension: [React DevTools](https://react.dev/learn/react-developer-tools)

**Benefits**:
- Inspect component props and state
- View component tree
- Profile performance

### Hot Reload Tips

**Vite auto-reloads on file changes**, but sometimes you need to:
- Hard refresh: Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)
- Clear cache and reload: Open DevTools → Right-click reload button → "Empty Cache and Hard Reload"

### TypeScript Strict Mode

**All code must pass `pnpm typecheck`**:
```bash
# Check types
pnpm typecheck

# Watch mode (auto-recheck on save)
pnpm typecheck --watch
```

**Common TypeScript Errors**:
- `Property 'X' does not exist`: Check interface definitions in `data-model.md`
- `Argument of type 'X' is not assignable`: Check prop types match expected interface
- `Object is possibly 'null'`: Add null check or use optional chaining (`?.`)

## Code Quality Gates

### Before Committing

**Run all checks**:
```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint

# Unit tests
pnpm test

# Build (ensures no build errors)
pnpm build
```

**All checks must pass** before pushing code.

### Before Creating PR

**Additional checks**:
```bash
# E2E tests
pnpm test:e2e

# Coverage report (aim for 85%+)
pnpm test:coverage
```

**Review**:
- Read `specs/002-new-version-ui/checklist.md`
- Verify all functional requirements (FR-001 to FR-020) implemented
- Verify all success criteria (SC-001 to SC-006) met
- Check performance targets (modal <100ms, validation <50ms, API <500ms)

## Performance Benchmarking

### Local Benchmarks

**Modal Open Time**:
```typescript
// In E2E test
const measurements = []
for (let i = 0; i < 10; i++) {
  const start = performance.now()
  await page.click('button:has-text("Create New Version")')
  await page.waitForSelector('dialog[open]')
  measurements.push(performance.now() - start)
  await page.keyboard.press('Escape') // Close modal
}
const avg = measurements.reduce((a, b) => a + b) / measurements.length
console.log(`Average modal open time: ${avg}ms`)
expect(avg).toBeLessThan(100)
```

**Expected Results**:
- Modal open: 20-60ms (target <100ms)
- Validation: 5-20ms (target <50ms)
- API call: 100-400ms (target <500ms p95)
- UI update: 200-800ms (target <1000ms)

### CI Benchmarks

**GitHub Actions runs performance tests** on every PR. Check workflow results for:
- Modal performance test: PASS/FAIL
- Validation performance test: PASS/FAIL
- E2E performance test: PASS/FAIL

## Documentation References

- **Feature Spec**: `specs/002-new-version-ui/spec.md` (user stories, requirements, success criteria)
- **Implementation Plan**: `specs/002-new-version-ui/plan.md` (technical approach, phases)
- **Research**: `specs/002-new-version-ui/research.md` (design decisions, rationale)
- **Data Model**: `specs/002-new-version-ui/data-model.md` (component props, state)
- **Integration Contract**: `specs/002-new-version-ui/contracts/integration-contract.md` (component interactions, API)

## Next Steps

After completing this feature:

1. **Review PR Checklist**: `specs/002-new-version-ui/checklist.md`
2. **Run Full Test Suite**: All unit, integration, and E2E tests passing
3. **Performance Validation**: All targets met (<100ms modal, <500ms API)
4. **Accessibility Check**: Keyboard navigation, screen reader support
5. **Create Pull Request**: Reference spec in PR description
6. **Request Review**: Tag frontend team members

## Support

**Questions or Issues?**
- Check `docs/` folder for architecture and API reference
- Review existing similar features (e.g., version comparison flow)
- Ask in team chat or create GitHub issue

**Feature Roadmap**:
- P1: Create version from detail page (CURRENT)
- P2: JSON validation (CURRENT)
- P3: Pre-populate with active version (NEXT)
