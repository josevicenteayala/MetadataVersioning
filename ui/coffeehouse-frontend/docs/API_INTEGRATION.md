# API Integration Guide

## Overview

This guide explains how the Coffeehouse Frontend integrates with the Metadata Versioning API, including authentication, request/response patterns, error handling, and best practices.

## Table of Contents

- [API Client Setup](#api-client-setup)
- [Authentication](#authentication)
- [Making API Requests](#making-api-requests)
- [Error Handling](#error-handling)
- [Query Management](#query-management)
- [Mutation Patterns](#mutation-patterns)
- [Testing API Integration](#testing-api-integration)

## API Client Setup

### HTTP Client Configuration

The base HTTP client is configured in `src/services/api/httpClient.ts`:

```typescript
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import { sessionStore } from '@/stores/sessionStore'

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - Add auth and correlation ID
httpClient.interceptors.request.use((config) => {
  const { username, password } = sessionStore.getState()

  if (username && password) {
    const credentials = btoa(`${username}:${password}`)
    config.headers.Authorization = `Basic ${credentials}`
  }

  config.headers['X-Correlation-ID'] = uuidv4()

  return config
})

// Response interceptor - Handle 401 and clear session
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStore.getState().clearCredentials()
    }
    return Promise.reject(error)
  },
)
```

### OpenAPI Generated Client

The API client is generated from the OpenAPI specification:

```bash
# Generate client from backend OpenAPI spec
pnpm generate:api
```

This creates TypeScript types and API methods in `src/services/api/generated/`:

```typescript
// Example generated types
export interface Version {
  versionId: string
  documentId: string
  versionNumber: number
  metadata: Record<string, unknown>
  isActive: boolean
  createdAt: string
  createdBy: string
}

export interface ActivateVersionRequest {
  documentId: string
  versionNumber: string
}

// Example generated API methods
export const MetadataApi = {
  getVersions: (type: string, name: string) =>
    httpClient.get<Version[]>(`/api/v1/metadata/${type}/${name}/versions`),

  activateVersion: (type: string, name: string, versionNumber: string) =>
    httpClient.post(`/api/v1/metadata/${type}/${name}/versions/${versionNumber}/activate`),
}
```

## Authentication

### Session Store

Credentials are stored in-memory using Zustand:

```typescript
// src/stores/sessionStore.ts
export const sessionStore = create<SessionStore>((set) => ({
  username: null,
  password: null,
  role: null,

  setCredentials: (username, password, role) => {
    set({ username, password, role })
  },

  clearCredentials: () => {
    set({ username: null, password: null, role: null })
  },
}))
```

### Setting Credentials

Credentials are entered via the Settings page:

```typescript
// features/settings/components/CredentialsForm.tsx
const handleSave = (credentials: Credentials) => {
  const { setCredentials } = sessionStore.getState()
  setCredentials(credentials.username, credentials.password, credentials.role)

  // Test connection
  testConnection().then((result) => {
    if (result.success) {
      toast.success('Credentials saved')
    } else {
      toast.error('Invalid credentials')
      setCredentials(null, null, null)
    }
  })
}
```

### Authorization Header

The HTTP client automatically adds the Authorization header:

```typescript
// Request interceptor adds Basic Auth header
const { username, password } = sessionStore.getState()

if (username && password) {
  const credentials = btoa(`${username}:${password}`)
  config.headers.Authorization = `Basic ${credentials}`
}
```

### Session Lifecycle

Credentials are cleared on:

- 401 response from API
- Browser close or page refresh
- Manual logout
- Navigation to login page

## Making API Requests

### Query Pattern (Read Operations)

Use TanStack Query for data fetching:

```typescript
// features/version-history/hooks/useVersionHistory.ts
export function useVersionHistory(documentId: string) {
  return useQuery({
    queryKey: versionHistoryKeys.byDocument(documentId),
    queryFn: async () => {
      const [type, name] = documentId.split('/')
      const response = await MetadataApi.getVersions(type, name)
      return response.data
    },
    enabled: !!documentId,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  })
}
```

### Mutation Pattern (Write Operations)

Use TanStack Query mutations for data modifications:

```typescript
// features/version-history/hooks/useActivateVersion.ts
export function useActivateVersion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: ActivateVersionRequest) => {
      const [type, name] = request.documentId.split('/')

      if (!type || !name) {
        throw new Error('Invalid documentId format. Expected "type/name".')
      }

      await MetadataApi.activateVersion(type, name, request.versionNumber)
    },

    onSuccess: (data, variables) => {
      // Invalidate affected queries
      queryClient.invalidateQueries({
        queryKey: versionHistoryKeys.byDocument(variables.documentId),
      })
      queryClient.invalidateQueries({
        queryKey: ['documents'],
      })
    },

    onError: (error) => {
      console.error('Failed to activate version:', error)
    },
  })
}
```

### Component Usage

```typescript
// features/version-history/components/VersionDetailDrawer.tsx
const VersionDetailDrawer = ({ documentId, versionNumber, isOpen, onClose }) => {
  // Query for version data
  const { data: version, isLoading, error } = useQuery({
    queryKey: ['version', documentId, versionNumber],
    queryFn: async () => {
      const [type, name] = documentId.split('/')
      const response = await MetadataApi.getVersion(type, name, versionNumber)
      return response.data
    },
    enabled: isOpen && !!documentId && !!versionNumber,
  })

  // Mutation for activation
  const activateMutation = useActivateVersion()

  const handleActivate = async () => {
    try {
      await activateMutation.mutateAsync({
        documentId,
        versionNumber: versionNumber.toString(),
      })
      toast.success('Version activated')
      onClose()
    } catch (error) {
      toast.error('Failed to activate version')
    }
  }

  if (isLoading) return <Spinner />
  if (error) return <ErrorMessage error={error} />

  return (
    <Drawer isOpen={isOpen} onClose={onClose}>
      <VersionDetails version={version} />
      <ActivationControls version={version} onActivated={handleActivate} />
    </Drawer>
  )
}
```

## Error Handling

### Error Types

```typescript
interface ApiError {
  status: number
  message: string
  correlationId: string
  details?: Record<string, unknown>
}
```

### Handling Query Errors

```typescript
const { data, error, isError } = useQuery({
  queryKey: ['versions', documentId],
  queryFn: fetchVersions,
  retry: (failureCount, error) => {
    // Don't retry on 4xx errors
    if (error.response?.status >= 400 && error.response?.status < 500) {
      return false
    }
    // Retry up to 3 times for 5xx errors
    return failureCount < 3
  },
})

if (isError) {
  const correlationId = error.response?.headers['x-correlation-id']

  return (
    <ErrorMessage
      message={error.message}
      correlationId={correlationId}
      onRetry={() => queryClient.invalidateQueries({ queryKey: ['versions'] })}
    />
  )
}
```

### Handling Mutation Errors

```typescript
const mutation = useMutation({
  mutationFn: activateVersion,
  onError: (error, variables, context) => {
    const correlationId = error.response?.headers['x-correlation-id']

    toast.error(`Failed to activate version. Correlation ID: ${correlationId}`, {
      duration: 5000,
      action: {
        label: 'Retry',
        onClick: () => mutation.mutate(variables),
      },
    })

    // Log for debugging
    console.error('Activation failed:', {
      error,
      variables,
      correlationId,
    })
  },
})
```

### Global Error Handling

The HTTP client interceptor handles 401 errors globally:

```typescript
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear session
      sessionStore.getState().clearCredentials()

      // Show notification
      toast.error('Session expired. Please log in again.')

      // Redirect to settings
      window.location.href = '/settings'
    }

    return Promise.reject(error)
  },
)
```

## Query Management

### Query Keys

Use a query key factory for consistency:

```typescript
// features/version-history/queryKeys.ts
export const versionHistoryKeys = {
  all: ['versions'] as const,
  lists: () => [...versionHistoryKeys.all, 'list'] as const,
  list: (filters: string) => [...versionHistoryKeys.lists(), { filters }] as const,
  byDocument: (documentId: string) => [...versionHistoryKeys.all, documentId] as const,
  detail: (documentId: string, versionNumber: number) =>
    [...versionHistoryKeys.byDocument(documentId), versionNumber] as const,
}

export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (filters: string) => [...documentKeys.lists(), { filters }] as const,
  detail: (documentId: string) => [...documentKeys.all, documentId] as const,
}
```

### Cache Invalidation

Invalidate queries after mutations:

```typescript
// Invalidate specific document's versions
queryClient.invalidateQueries({
  queryKey: versionHistoryKeys.byDocument(documentId),
})

// Invalidate all versions
queryClient.invalidateQueries({
  queryKey: versionHistoryKeys.all,
})

// Invalidate with predicate
queryClient.invalidateQueries({
  predicate: (query) => query.queryKey[0] === 'versions' && query.queryKey[1] === documentId,
})
```

### Optimistic Updates

Update cache immediately before API call:

```typescript
const mutation = useMutation({
  mutationFn: activateVersion,

  onMutate: async (variables) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({
      queryKey: versionHistoryKeys.byDocument(variables.documentId),
    })

    // Snapshot previous value
    const previousVersions = queryClient.getQueryData(
      versionHistoryKeys.byDocument(variables.documentId),
    )

    // Optimistically update
    queryClient.setQueryData(
      versionHistoryKeys.byDocument(variables.documentId),
      (old: Version[]) =>
        old.map((v) =>
          v.versionNumber.toString() === variables.versionNumber
            ? { ...v, isActive: true }
            : { ...v, isActive: false },
        ),
    )

    // Return context for rollback
    return { previousVersions }
  },

  onError: (err, variables, context) => {
    // Rollback on error
    if (context?.previousVersions) {
      queryClient.setQueryData(
        versionHistoryKeys.byDocument(variables.documentId),
        context.previousVersions,
      )
    }
  },

  onSettled: (data, error, variables) => {
    // Refetch to ensure consistency
    queryClient.invalidateQueries({
      queryKey: versionHistoryKeys.byDocument(variables.documentId),
    })
  },
})
```

### Query Configuration

Configure default options in `main.tsx`:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds
      gcTime: 300000, // 5 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
    mutations: {
      retry: 0,
    },
  },
})
```

## Mutation Patterns

### Basic Mutation

```typescript
const createVersionMutation = useMutation({
  mutationFn: (data: CreateVersionRequest) => MetadataApi.createVersion(data),
  onSuccess: () => {
    toast.success('Version created')
    queryClient.invalidateQueries({ queryKey: ['versions'] })
  },
})
```

### Mutation with Loading State

```typescript
const { mutate, isPending } = useMutation({
  mutationFn: deleteVersion,
  onSuccess: () => {
    toast.success('Version deleted')
  },
})

<Button onClick={() => mutate(versionId)} disabled={isPending}>
  {isPending ? 'Deleting...' : 'Delete'}
</Button>
```

### Sequential Mutations

```typescript
const handleBulkActivation = async (versionIds: string[]) => {
  for (const versionId of versionIds) {
    try {
      await activateMutation.mutateAsync({ versionId })
    } catch (error) {
      console.error(`Failed to activate ${versionId}:`, error)
      // Continue with remaining versions
    }
  }

  queryClient.invalidateQueries({ queryKey: ['versions'] })
}
```

### Parallel Mutations

```typescript
const handleBulkDelete = async (versionIds: string[]) => {
  const deletePromises = versionIds.map((id) => deleteMutation.mutateAsync({ versionId: id }))

  try {
    await Promise.all(deletePromises)
    toast.success('All versions deleted')
  } catch (error) {
    toast.error('Some deletions failed')
  }

  queryClient.invalidateQueries({ queryKey: ['versions'] })
}
```

## Testing API Integration

### Mock Service Worker (MSW)

Set up MSW handlers for testing:

```typescript
// tests/mocks/handlers.ts
import { rest } from 'msw'

export const handlers = [
  rest.get('/api/v1/metadata/:type/:name/versions', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          versionId: '1',
          versionNumber: 1,
          documentId: 'config/app-settings',
          isActive: true,
          metadata: { key: 'value' },
        },
      ]),
    )
  }),

  rest.post('/api/v1/metadata/:type/:name/versions/:versionNumber/activate', (req, res, ctx) => {
    return res(ctx.status(204))
  }),
]
```

### Testing Queries

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

describe('useVersionHistory', () => {
  it('should fetch versions successfully', async () => {
    const queryClient = new QueryClient()
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )

    const { result } = renderHook(
      () => useVersionHistory('config/app-settings'),
      { wrapper }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toHaveLength(1)
    expect(result.current.data[0].versionNumber).toBe(1)
  })
})
```

### Testing Mutations

```typescript
import { act } from '@testing-library/react'

describe('useActivateVersion', () => {
  it('should activate version and invalidate cache', async () => {
    const queryClient = new QueryClient()
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )

    const { result } = renderHook(() => useActivateVersion(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({
        documentId: 'config/app-settings',
        versionNumber: '2',
      })
    })

    expect(result.current.isSuccess).toBe(true)

    // Verify cache invalidation
    const invalidatedQueries = queryClient.getQueryCache().findAll({
      queryKey: ['versions'],
      type: 'active',
    })
    expect(invalidatedQueries).toHaveLength(0) // Cache cleared
  })
})
```

### Testing Error Handling

```typescript
it('should handle 401 error and clear credentials', async () => {
  server.use(
    rest.post('/api/v1/metadata/:type/:name/versions/:versionNumber/activate', (req, res, ctx) => {
      return res(ctx.status(401))
    }),
  )

  const { result } = renderHook(() => useActivateVersion(), { wrapper })

  await act(async () => {
    try {
      await result.current.mutateAsync({
        documentId: 'config/app',
        versionNumber: '2',
      })
    } catch (error) {
      expect(error.response.status).toBe(401)
    }
  })

  // Verify credentials cleared
  const { username } = sessionStore.getState()
  expect(username).toBeNull()
})
```

## Best Practices

### 1. Always Use Query Keys Factory

```typescript
// ✅ Good
queryClient.invalidateQueries({
  queryKey: versionHistoryKeys.byDocument(documentId),
})

// ❌ Bad
queryClient.invalidateQueries({
  queryKey: ['versions', documentId],
})
```

### 2. Handle Loading and Error States

```typescript
// ✅ Good
if (isLoading) return <Spinner />
if (error) return <ErrorMessage error={error} />
return <VersionList versions={data} />

// ❌ Bad
return <VersionList versions={data || []} />
```

### 3. Use Correlation IDs

```typescript
// ✅ Good - Included automatically by httpClient
httpClient.interceptors.request.use((config) => {
  config.headers['X-Correlation-ID'] = uuidv4()
  return config
})
```

### 4. Validate Input Before API Calls

```typescript
// ✅ Good
const [type, name] = documentId.split('/')
if (!type || !name) {
  throw new Error('Invalid documentId format')
}

// ❌ Bad
const [type, name] = documentId.split('/')
await api.activateVersion(type, name, versionNumber)
```

### 5. Provide User Feedback

```typescript
// ✅ Good
const mutation = useMutation({
  mutationFn: activateVersion,
  onSuccess: () => toast.success('Version activated'),
  onError: (error) => toast.error(`Failed: ${error.message}`),
})

// ❌ Bad
const mutation = useMutation({
  mutationFn: activateVersion,
})
```

## Additional Resources

- [Architecture Documentation](./ARCHITECTURE.md)
- [Contributing Guide](./CONTRIBUTING.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Axios Documentation](https://axios-http.com/)
