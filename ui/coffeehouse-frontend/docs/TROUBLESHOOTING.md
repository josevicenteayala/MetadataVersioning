# Troubleshooting Guide

## Table of Contents

- [Common Issues](#common-issues)
  - [Build and Development](#build-and-development)
  - [Authentication](#authentication)
  - [Version Activation](#version-activation)
  - [API Integration](#api-integration)
  - [Testing](#testing)
- [Debug Tools](#debug-tools)
- [Known Issues](#known-issues)
- [Getting Help](#getting-help)

## Common Issues

### Build and Development

#### Error: `Cannot find module '@services/...'`

**Cause**: TypeScript path aliases not resolved or generated API client missing.

**Solution**:

```bash
# Regenerate API client
pnpm generate:api

# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Restart dev server
pnpm dev
```

#### Error: `Port 5173 is already in use`

**Cause**: Another Vite instance is running.

**Solution**:

```bash
# Kill the process using port 5173
lsof -ti:5173 | xargs kill -9

# Or use a different port
pnpm dev --port 5174
```

#### Error: TypeScript errors after pulling latest changes

**Cause**: API client out of sync with backend changes.

**Solution**:

```bash
# Ensure backend is running
cd ../../
mvn spring-boot:run

# Wait for backend to start, then regenerate client
cd ui/coffeehouse-frontend
pnpm generate:api
```

### Authentication

#### Issue: Credentials not persisting between page refreshes

**Expected Behavior**: This is intentional. Credentials are stored in memory only and cleared on:

- Browser close
- Page refresh
- 401 response from API
- Manual logout

**Solution**: Re-enter credentials via Settings page.

#### Error: `401 Unauthorized` on all API requests

**Cause 1**: Credentials not entered or invalid.

**Solution**:

```bash
1. Navigate to Settings (/settings)
2. Enter username: admin, password: password
3. Click "Test Connection"
4. If successful, click "Save Credentials"
```

**Cause 2**: Backend not running or CORS misconfigured.

**Solution**:

```bash
# Check backend health
curl http://localhost:8080/actuator/health

# Check CORS headers
curl -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Authorization" \
     -X OPTIONS http://localhost:8080/api/v1/metadata -v
```

#### Issue: Credentials cleared unexpectedly

**Possible Causes**:

1. API returned 401 (token expired or invalid)
2. Browser tab reloaded
3. Navigation cleared session

**Debug**:

Open browser DevTools Console and check for:

```javascript
// Session cleared message
"Session credentials cleared due to 401 response"

// Correlation ID from failed request
"X-Correlation-ID: abc-123-def"
```

### Version Activation

#### Issue: "Activate Version" button does nothing when clicked

**Cause 1**: Missing confirmation modal component.

**Solution**: Ensure `ActivationControls` component is properly imported and used:

```tsx
// ✅ Correct
import ActivationControls from './ActivationControls'

<ActivationControls version={version} onActivated={onClose} />

// ❌ Incorrect - custom implementation without modal
<button onClick={handleActivate}>Activate Version</button>
```

**Cause 2**: API URL construction error.

**Solution**: Check browser Network tab for the API call:

```bash
# Expected URL format:
POST /api/v1/metadata/{type}/{name}/versions/{versionNumber}/activate

# Example:
POST /api/v1/metadata/config/app-settings/versions/2/activate
```

If you see a different format, the `documentId` splitting logic may be broken.

**Cause 3**: User lacks admin role.

**Solution**: Check that the session has admin role:

```javascript
// In browser console
sessionStore.getState().role
// Should return: "admin"
```

#### Issue: Confirmation modal doesn't appear

**Cause**: Component state not updating.

**Debug**:

```tsx
// Add logging to ActivationControls.tsx
const handleActivateClick = () => {
  console.log('Activate button clicked')
  setShowConfirmation(true)
  console.log('Modal should be visible')
}
```

**Solution**: Check React DevTools to verify:

1. `showConfirmation` state changes to `true`
2. `ConfirmationModal` component is rendered
3. Modal has `isOpen={true}` prop

#### Issue: Activation succeeds but UI doesn't update

**Cause**: Cache not invalidated after mutation.

**Solution**: Verify mutation includes cache invalidation:

```typescript
onSuccess: (data, variables) => {
  // Must invalidate affected queries
  queryClient.invalidateQueries({
    queryKey: versionHistoryKeys.byDocument(variables.documentId),
  })
  queryClient.invalidateQueries({
    queryKey: ['documents'],
  })
}
```

### API Integration

#### Error: `Network Error` or `ECONNREFUSED`

**Cause**: Backend not running or wrong API base URL.

**Solution**:

```bash
# Check backend status
curl http://localhost:8080/actuator/health

# Verify environment variable
cat .env
# Should contain: VITE_API_BASE_URL=http://localhost:8080

# Check Vite config
cat vite.config.ts | grep proxy
```

#### Error: `CORS policy: No 'Access-Control-Allow-Origin' header`

**Cause**: Backend CORS configuration missing frontend origin.

**Solution**: Update backend `application.yaml`:

```yaml
spring:
  web:
    cors:
      allowed-origins:
        - "http://localhost:5173"
        - "http://127.0.0.1:5173"
      allowed-methods: ["GET", "POST", "PUT", "DELETE"]
      allowed-headers: ["*"]
      expose-headers: ["X-Correlation-ID"]
```

#### Issue: API responses missing data

**Cause**: Backend returns data but with different field names than expected.

**Debug**:

```javascript
// In browser DevTools Network tab
1. Find the failed request
2. Click "Response" tab
3. Compare field names with TypeScript interface

// Example mismatch:
// Backend returns: { versionNumber: 2 }
// Frontend expects: { version_number: 2 }
```

**Solution**: Regenerate API client to sync with backend changes:

```bash
pnpm generate:api
```

### Testing

#### Error: Tests fail with `Cannot find module 'msw'`

**Cause**: Dev dependencies not installed.

**Solution**:

```bash
pnpm install --dev
```

#### Error: Playwright tests timeout

**Cause**: Backend not running or tests waiting for elements that don't appear.

**Solution**:

```bash
# Start backend first
mvn spring-boot:run

# Run tests with debug mode
pnpm test:e2e --debug

# Or with headed browser
pnpm test:e2e --headed
```

#### Error: `ReferenceError: vi is not defined`

**Cause**: Vitest globals not configured.

**Solution**: Verify `vite.config.ts` includes:

```typescript
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: ['./tests/setup.ts'],
}
```

## Debug Tools

### React DevTools

Install: [React DevTools](https://react.dev/learn/react-developer-tools)

**Usage**:

1. Open browser DevTools
2. Navigate to "Components" tab
3. Inspect component props, state, hooks

### TanStack Query DevTools

Already included in development mode.

**Access**: Look for the TanStack logo in bottom-right corner of browser.

**Features**:

- View all cached queries
- See query status (loading, success, error)
- Manually invalidate queries
- Inspect query data

### Network Tab

**Check API requests**:

1. Open DevTools → Network tab
2. Filter by "XHR" or "Fetch"
3. Look for:
   - Request headers (Authorization)
   - Response headers (X-Correlation-ID)
   - Status codes
   - Response payloads

### Console Logging

**Enable verbose logging**:

```typescript
// Add to src/services/api/httpClient.ts
httpClient.interceptors.request.use((config) => {
  console.log('🔵 REQUEST:', config.method?.toUpperCase(), config.url)
  return config
})

httpClient.interceptors.response.use(
  (response) => {
    console.log('✅ RESPONSE:', response.status, response.config.url)
    return response
  },
  (error) => {
    console.error('❌ ERROR:', error.response?.status, error.config.url)
    return Promise.reject(error)
  }
)
```

### Performance Profiling

**React Profiler**:

1. Open React DevTools
2. Navigate to "Profiler" tab
3. Click record button
4. Perform actions
5. Stop recording
6. Analyze component render times

**Lighthouse Audit**:

1. Open DevTools → Lighthouse tab
2. Select "Performance" category
3. Click "Generate report"
4. Review metrics (FCP, LCP, TTI)

## Known Issues

### Issue: Text selection in JSON editor triggers page scroll

**Status**: Known limitation of Monaco editor in drawer context.

**Workaround**: Use arrow keys instead of mouse dragging for large selections.

### Issue: Diff view shows incorrect highlights for array reordering

**Status**: jsondiffpatch limitation with unkeyed arrays.

**Workaround**: Use object keys instead of arrays for order-sensitive data.

### Issue: Toast notifications stack on top of modals

**Status**: Z-index conflict between toast container and modal backdrop.

**Workaround**: Toasts will auto-dismiss after timeout, or manually dismiss before opening modals.

## Getting Help

### Before Asking for Help

1. **Check this guide** for your specific issue
2. **Search existing issues** in GitHub
3. **Check browser console** for error messages
4. **Collect correlation IDs** from failed API requests
5. **Note your environment**:
   - Node version: `node --version`
   - pnpm version: `pnpm --version`
   - Browser and version
   - OS

### Reporting Bugs

Create a GitHub issue with:

```markdown
## Bug Description

[Clear description of the problem]

## Steps to Reproduce

1. [First step]
2. [Second step]
3. [And so on...]

## Expected Behavior

[What should happen]

## Actual Behavior

[What actually happens]

## Environment

- Node version: [e.g., 20.10.0]
- pnpm version: [e.g., 9.0.0]
- Browser: [e.g., Chrome 120]
- OS: [e.g., macOS 14]

## Correlation IDs

[If applicable, include X-Correlation-ID from failed requests]

## Screenshots

[If applicable, add screenshots]

## Console Logs

\```
[Paste relevant console output]
\```
```

### Getting Support

- **GitHub Issues**: Bug reports and feature requests
- **Documentation**: Check `/docs` folder for guides
- **Stack Overflow**: Tag questions with `metadata-versioning`

### Contributing Fixes

1. Fork the repository
2. Create feature branch: `git checkout -b fix/issue-description`
3. Write tests for the fix
4. Implement the fix
5. Verify tests pass: `pnpm test && pnpm test:e2e`
6. Submit pull request

## Additional Resources

- [Architecture Documentation](./ARCHITECTURE.md)
- [Accessibility Guide](./accessibility.md)
- [Telemetry Documentation](./telemetry.md)
- [API Reference](../../docs/API_REFERENCE.md)
