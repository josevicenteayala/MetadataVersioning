# Coffeehouse Frontend Architecture

## Overview

The Coffeehouse Frontend is a modern React single-page application (SPA) built with TypeScript, following a feature-based architecture that mirrors the backend's Hexagonal (Ports & Adapters) pattern.

## Architecture Principles

### 1. Feature-First Organization

Each feature is self-contained with its own:
- UI components
- API hooks (TanStack Query)
- Types and interfaces
- Business logic
- Tests

```
features/
├── dashboard/           # Overview & metrics
├── documents/           # Document list & search
├── versions/            # Version history & lifecycle
├── compare/             # Version diff visualization
└── settings/            # Auth & preferences
```

### 2. Hexagonal Architecture Alignment

The frontend respects Hexagonal principles:

**Domain Layer** (Pure business logic)
- `types.ts` - Domain entities and business rules
- `utils/` - Pure functions, calculations
- No framework dependencies

**Application Layer** (Use cases)
- `api/*.ts` - Query/mutation hooks
- `hooks/*.ts` - Custom React hooks
- Orchestrates domain with UI

**Adapter Layer** (Infrastructure)
- `services/api/` - HTTP client
- `services/auth/` - Session storage
- `services/feedback/` - Toast notifications
- `services/generated/` - OpenAPI client

### 3. State Management Strategy

**Server State**: TanStack Query
- API data caching
- Background refetching
- Optimistic updates
- Automatic retries

**Session State**: Zustand
- Auth credentials (in-memory only)
- User role
- Correlation IDs

**UI State**: React hooks
- Form state (local)
- Modal visibility
- Sort/filter preferences

**No Persistent Storage**
- No localStorage/sessionStorage for credentials
- Credentials cleared on 401 responses
- All session data cleared on browser close

## Key Design Patterns

### 1. Query Keys Organization

```typescript
// Hierarchical query keys for cache invalidation
export const versionHistoryKeys = {
  all: ['versions'] as const,
  lists: () => [...versionHistoryKeys.all, 'list'] as const,
  list: (filters: string) => [...versionHistoryKeys.lists(), { filters }] as const,
  byDocument: (documentId: string) => [...versionHistoryKeys.all, documentId] as const,
  details: () => [...versionHistoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...versionHistoryKeys.details(), id] as const,
}
```

### 2. API Client Pattern

```typescript
// Generated client wrapper with interceptors
export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: import.meta.env.VITE_API_TIMEOUT_MS,
})

// Auto-inject Basic Auth headers
httpClient.interceptors.request.use((config) => {
  const credentials = sessionStore.getState().credentials
  if (credentials) {
    config.headers.Authorization = `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`
  }
  return config
})

// Handle 401 responses
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStore.getState().clearCredentials()
      // Redirect to login
    }
    return Promise.reject(error)
  }
)
```

### 3. Confirmation Modal Pattern

For destructive actions (activate, archive), use the confirmation component:

```typescript
// ActivationControls.tsx
const ActivationControls = ({ version, onActivated }) => {
  const [showConfirmation, setShowConfirmation] = useState(false)
  const { mutateAsync } = useActivateVersion()

  const handleConfirm = async () => {
    await mutateAsync({ documentId, versionId })
    onActivated?.()
  }

  return (
    <>
      <button onClick={() => setShowConfirmation(true)}>
        Activate Version
      </button>
      <ConfirmationModal
        isOpen={showConfirmation}
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirmation(false)}
      />
    </>
  )
}
```

### 4. Correlation ID Tracking

All API responses include correlation IDs for support escalation:

```typescript
// Extract from response headers
const correlationId = response.headers['x-correlation-id']

// Display in error toasts
emitToast({
  intent: 'error',
  title: 'Operation Failed',
  message: error.message,
  correlationId,
})
```

## Data Flow

### Read Operations (Queries)

```
User Action
  ↓
Component renders with useQuery hook
  ↓
TanStack Query checks cache
  ↓
If stale/missing → HTTP request via httpClient
  ↓
Interceptor adds auth headers
  ↓
API responds with data + X-Correlation-ID
  ↓
Data cached in TanStack Query
  ↓
Component re-renders with data
```

### Write Operations (Mutations)

```
User Action (e.g., activate version)
  ↓
Confirmation modal opens
  ↓
User confirms
  ↓
useMutation hook called
  ↓
HTTP POST/PUT via httpClient
  ↓
Success response received
  ↓
Cache invalidation via queryClient
  ↓
Affected queries refetch automatically
  ↓
Success toast displayed
  ↓
Component state updates
```

## Component Structure

### Feature Component Hierarchy

```
Feature/
├── components/          # UI components
│   ├── FeatureTable.tsx       # List view
│   ├── FeatureDetail.tsx      # Detail view
│   ├── FeatureForm.tsx        # Create/edit form
│   └── FeatureControls.tsx    # Action buttons
├── api/                 # Data layer
│   ├── useFeatureList.ts      # Query hook
│   ├── useFeatureDetail.ts    # Query hook
│   ├── useCreateFeature.ts    # Mutation hook
│   └── index.ts               # Exports
├── types.ts             # TypeScript interfaces
└── utils/               # Pure functions
```

### Component Best Practices

**1. Single Responsibility**
- Each component does one thing well
- Extract reusable logic to hooks
- Keep components < 300 lines

**2. Props Interface**
```typescript
export interface ComponentProps {
  // Required props first
  value: string
  onChange: (value: string) => void
  
  // Optional props second
  disabled?: boolean
  className?: string
  
  // Callbacks last
  onBlur?: () => void
  onFocus?: () => void
}
```

**3. Accessibility**
```typescript
<button
  type="button"
  onClick={handleClick}
  disabled={isDisabled}
  aria-label="Descriptive action"
  aria-busy={isPending}
>
  {label}
</button>
```

## Performance Optimization

### 1. Code Splitting

```typescript
// Lazy load routes
const DashboardRoute = lazy(() => import('./routes/DashboardRoute'))
const DocumentRoute = lazy(() => import('./routes/DocumentRoute'))

// Use Suspense boundary
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/" element={<DashboardRoute />} />
    <Route path="/documents/:id" element={<DocumentRoute />} />
  </Routes>
</Suspense>
```

### 2. Query Prefetching

```typescript
// Prefetch on route navigation
const navigate = useNavigate()
const queryClient = useQueryClient()

const handleRowClick = (documentId: string) => {
  // Start loading before navigation
  queryClient.prefetchQuery({
    queryKey: versionHistoryKeys.byDocument(documentId),
    queryFn: () => fetchVersionHistory(documentId),
  })
  
  navigate(`/documents/${documentId}`)
}
```

### 3. Optimistic Updates

```typescript
const { mutate } = useActivateVersion({
  onMutate: async (variables) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ 
      queryKey: versionHistoryKeys.byDocument(variables.documentId) 
    })
    
    // Snapshot current value
    const previous = queryClient.getQueryData(
      versionHistoryKeys.byDocument(variables.documentId)
    )
    
    // Optimistically update
    queryClient.setQueryData(
      versionHistoryKeys.byDocument(variables.documentId),
      (old) => updateVersionStatus(old, variables.versionId, 'active')
    )
    
    return { previous }
  },
  
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(
      versionHistoryKeys.byDocument(variables.documentId),
      context.previous
    )
  },
})
```

## Security Considerations

### 1. Credential Management

**✅ DO:**
- Store credentials in memory only (Zustand)
- Clear credentials on 401 responses
- Clear credentials on browser close
- Validate credentials server-side

**❌ DON'T:**
- Store credentials in localStorage
- Store credentials in sessionStorage
- Log credentials to console
- Send credentials in query params

### 2. XSS Prevention

- All user input sanitized
- Use React's built-in XSS protection
- Avoid dangerouslySetInnerHTML
- Validate JSON payloads

### 3. CORS Configuration

Handled by backend:
```yaml
# application.yaml
spring:
  web:
    cors:
      allowed-origins: "http://localhost:5173"
      allowed-methods: ["GET", "POST", "PUT", "DELETE"]
      allowed-headers: ["Authorization", "Content-Type"]
      expose-headers: ["X-Correlation-ID"]
```

## Testing Strategy

### Unit Tests (Vitest + RTL)

Test individual components and hooks:

```typescript
describe('VersionDetailDrawer', () => {
  it('displays version metadata correctly', () => {
    const version = mockVersion()
    render(<VersionDetailDrawer version={version} isOpen={true} />)
    
    expect(screen.getByText(`v${version.versionNumber}`)).toBeInTheDocument()
    expect(screen.getByText(version.createdBy)).toBeInTheDocument()
  })
})
```

### Integration Tests (MSW)

Mock API responses:

```typescript
const server = setupServer(
  http.post('/api/v1/metadata/:type/:name/versions/:id/activate', () => {
    return HttpResponse.json({ success: true })
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

### E2E Tests (Playwright)

Test complete user flows:

```typescript
test('user can activate version', async ({ page }) => {
  await page.goto('/documents/config/app-settings')
  await page.click('[data-testid="version-row"]')
  await page.click('button:has-text("Activate Version")')
  await page.click('button:has-text("Confirm")')
  
  await expect(page.getByRole('status')).toContainText('Version activated')
})
```

## Deployment

### Build Configuration

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'diff-vendor': ['jsondiffpatch'],
        },
      },
    },
  },
})
```

### Environment Variables

```bash
# Production
VITE_API_BASE_URL=https://api.production.com
VITE_API_TIMEOUT_MS=15000

# Staging
VITE_API_BASE_URL=https://api.staging.com
VITE_API_TIMEOUT_MS=10000

# Development
VITE_API_BASE_URL=http://localhost:8080
VITE_API_TIMEOUT_MS=5000
```

### Static Hosting

Compatible with:
- Azure Static Web Apps
- Netlify
- Vercel
- AWS S3 + CloudFront
- GitHub Pages

Configure reverse proxy for API requests:
```nginx
location /api {
    proxy_pass http://backend:8080;
    proxy_set_header Authorization $http_authorization;
    proxy_set_header X-Correlation-ID $request_id;
}
```

## Troubleshooting

### Common Issues

**1. API requests fail with 401**
- Check credentials in Settings
- Verify backend is running
- Check CORS configuration

**2. Version activation doesn't work**
- Ensure user has admin role
- Check API endpoint URL construction
- Verify confirmation modal appears

**3. Diff visualization shows errors**
- Check JSON payload format
- Verify both versions exist
- Check browser console for errors

**4. Tests fail with "Cannot find module"**
- Run `pnpm generate:api` first
- Clear node_modules and reinstall
- Check tsconfig path aliases

## Future Improvements

### Planned Enhancements

1. **OAuth 2.0 Support**
   - Replace Basic Auth with OAuth
   - Implement token refresh
   - Support SSO providers

2. **Offline Support**
   - Service Worker caching
   - Background sync
   - Optimistic UI

3. **Real-time Updates**
   - WebSocket connection
   - Live version updates
   - Collaborative editing

4. **Advanced Features**
   - Bulk operations
   - Version branching
   - Custom metadata fields

## Resources

- [React Documentation](https://react.dev/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Vite Guide](https://vitejs.dev/guide/)
- [Playwright Testing](https://playwright.dev/)
- [Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
