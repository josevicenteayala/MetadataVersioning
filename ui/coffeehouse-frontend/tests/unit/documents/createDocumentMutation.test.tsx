import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { useCreateDocument } from '@features/documents/api/useCreateDocument'
import type { ReactNode } from 'react'

// Mock httpClient
const mockPost = vi.fn()
vi.mock('@services/api/httpClient', () => ({
  httpClient: {
    post: (...args: unknown[]) => mockPost(...args),
  },
}))

// Mock toast bus
const mockEmitToast = vi.fn()
vi.mock('@services/feedback/toastBus', () => ({
  emitToast: (toast: unknown) => mockEmitToast(toast),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useCreateDocument', () => {
  const mockRequest = {
    type: 'loyalty-program',
    name: 'spring-bonus',
    content: { programId: 'SPRING2025' },
    changeSummary: 'Initial version',
  }

  const mockSuccessResponse = {
    data: {
      id: 123,
      type: 'loyalty-program',
      name: 'spring-bonus',
      versionCount: 1,
      activeVersion: null,
      createdAt: '2025-11-27T10:00:00Z',
      updatedAt: '2025-11-27T10:00:00Z',
    },
    headers: {
      'x-correlation-id': 'corr-123',
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('successful creation (201)', () => {
    it('returns created document on success', async () => {
      mockPost.mockResolvedValueOnce(mockSuccessResponse)

      const { result } = renderHook(() => useCreateDocument(), {
        wrapper: createWrapper(),
      })

      await result.current.mutateAsync(mockRequest)

      expect(mockPost).toHaveBeenCalledWith('/api/v1/metadata', {
        type: mockRequest.type,
        name: mockRequest.name,
        content: mockRequest.content,
        changeSummary: mockRequest.changeSummary,
      })
    })

    it('includes correlation ID in response', async () => {
      mockPost.mockResolvedValueOnce(mockSuccessResponse)

      const { result } = renderHook(() => useCreateDocument(), {
        wrapper: createWrapper(),
      })

      const response = await result.current.mutateAsync(mockRequest)

      expect(response.correlationId).toBe('corr-123')
    })

    it('emits success toast with correlation ID', async () => {
      mockPost.mockResolvedValueOnce(mockSuccessResponse)

      const { result } = renderHook(() => useCreateDocument(), {
        wrapper: createWrapper(),
      })

      await result.current.mutateAsync(mockRequest)

      await waitFor(() => {
        expect(mockEmitToast).toHaveBeenCalledWith(
          expect.objectContaining({
            intent: 'success',
            title: expect.stringContaining('created'),
            correlationId: 'corr-123',
          }),
        )
      })
    })

    it('calls onSuccess callback with response data', async () => {
      mockPost.mockResolvedValueOnce(mockSuccessResponse)
      const onSuccessMock = vi.fn()

      const { result } = renderHook(() => useCreateDocument({ onSuccess: onSuccessMock }), {
        wrapper: createWrapper(),
      })

      await result.current.mutateAsync(mockRequest)

      await waitFor(() => {
        expect(onSuccessMock).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 123,
            type: 'loyalty-program',
            name: 'spring-bonus',
          }),
        )
      })
    })

    it('invalidates dashboard stats cache', async () => {
      mockPost.mockResolvedValueOnce(mockSuccessResponse)

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })

      // Set up initial cache data
      queryClient.setQueryData(['dashboard', 'stats'], { totalDocuments: 5 })
      queryClient.setQueryData(['documents', 'page'], { documents: [] })

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useCreateDocument(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      await result.current.mutateAsync(mockRequest)

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            queryKey: expect.arrayContaining(['dashboard']),
          }),
        )
      })
    })
  })

  describe('validation error (400)', () => {
    it('handles 400 validation error', async () => {
      const validationError = {
        response: {
          status: 400,
          data: {
            error: 'VALIDATION_ERROR',
            message: 'Invalid metadata type format',
            details: [{ field: 'type', constraint: 'must match kebab-case pattern' }],
          },
          headers: { 'x-correlation-id': 'corr-400' },
        },
      }
      mockPost.mockRejectedValueOnce(validationError)

      const { result } = renderHook(() => useCreateDocument(), {
        wrapper: createWrapper(),
      })

      await expect(result.current.mutateAsync(mockRequest)).rejects.toMatchObject({
        response: expect.objectContaining({
          status: 400,
        }),
      })
    })

    it('emits error toast for validation failure', async () => {
      const validationError = {
        response: {
          status: 400,
          data: {
            error: 'VALIDATION_ERROR',
            message: 'Invalid metadata type format',
          },
          headers: { 'x-correlation-id': 'corr-400' },
        },
      }
      mockPost.mockRejectedValueOnce(validationError)

      const { result } = renderHook(() => useCreateDocument(), {
        wrapper: createWrapper(),
      })

      try {
        await result.current.mutateAsync(mockRequest)
      } catch {
        // Expected to throw
      }

      await waitFor(() => {
        expect(mockEmitToast).toHaveBeenCalledWith(
          expect.objectContaining({
            intent: 'error',
          }),
        )
      })
    })

    it('calls onError callback for validation failure', async () => {
      const validationError = {
        response: {
          status: 400,
          data: {
            error: 'VALIDATION_ERROR',
            message: 'Invalid metadata type format',
          },
          headers: { 'x-correlation-id': 'corr-400' },
        },
      }
      mockPost.mockRejectedValueOnce(validationError)

      const onErrorMock = vi.fn()
      const { result } = renderHook(() => useCreateDocument({ onError: onErrorMock }), {
        wrapper: createWrapper(),
      })

      try {
        await result.current.mutateAsync(mockRequest)
      } catch {
        // Expected to throw
      }

      await waitFor(() => {
        expect(onErrorMock).toHaveBeenCalled()
      })
    })
  })

  describe('conflict error (409)', () => {
    it('handles 409 conflict error', async () => {
      const conflictError = {
        response: {
          status: 409,
          data: {
            error: 'CONFLICT',
            message: 'Metadata document already exists: loyalty-program:spring-bonus',
          },
          headers: { 'x-correlation-id': 'corr-409' },
        },
      }
      mockPost.mockRejectedValueOnce(conflictError)

      const { result } = renderHook(() => useCreateDocument(), {
        wrapper: createWrapper(),
      })

      await expect(result.current.mutateAsync(mockRequest)).rejects.toMatchObject({
        response: expect.objectContaining({
          status: 409,
        }),
      })
    })

    it('emits error toast for conflict', async () => {
      const conflictError = {
        response: {
          status: 409,
          data: {
            error: 'CONFLICT',
            message: 'Metadata document already exists',
          },
          headers: { 'x-correlation-id': 'corr-409' },
        },
      }
      mockPost.mockRejectedValueOnce(conflictError)

      const { result } = renderHook(() => useCreateDocument(), {
        wrapper: createWrapper(),
      })

      try {
        await result.current.mutateAsync(mockRequest)
      } catch {
        // Expected to throw
      }

      await waitFor(() => {
        expect(mockEmitToast).toHaveBeenCalledWith(
          expect.objectContaining({
            intent: 'error',
            message: expect.stringContaining('already exists'),
          }),
        )
      })
    })
  })

  describe('server error (5xx)', () => {
    it('handles 500 server error', async () => {
      const serverError = {
        response: {
          status: 500,
          data: {
            error: 'INTERNAL_ERROR',
            message: 'Internal server error',
          },
          headers: { 'x-correlation-id': 'corr-500' },
        },
      }
      mockPost.mockRejectedValueOnce(serverError)

      const { result } = renderHook(() => useCreateDocument(), {
        wrapper: createWrapper(),
      })

      await expect(result.current.mutateAsync(mockRequest)).rejects.toMatchObject({
        response: expect.objectContaining({
          status: 500,
        }),
      })
    })

    it('emits error toast with retry guidance for 5xx', async () => {
      const serverError = {
        response: {
          status: 503,
          data: {
            error: 'SERVICE_UNAVAILABLE',
            message: 'Service temporarily unavailable',
          },
          headers: { 'x-correlation-id': 'corr-503' },
        },
      }
      mockPost.mockRejectedValueOnce(serverError)

      const { result } = renderHook(() => useCreateDocument(), {
        wrapper: createWrapper(),
      })

      try {
        await result.current.mutateAsync(mockRequest)
      } catch {
        // Expected to throw
      }

      await waitFor(() => {
        expect(mockEmitToast).toHaveBeenCalledWith(
          expect.objectContaining({
            intent: 'error',
            correlationId: 'corr-503',
          }),
        )
      })
    })
  })

  describe('network error', () => {
    it('handles network failure', async () => {
      const networkError = new Error('Network Error')
      mockPost.mockRejectedValueOnce(networkError)

      const { result } = renderHook(() => useCreateDocument(), {
        wrapper: createWrapper(),
      })

      await expect(result.current.mutateAsync(mockRequest)).rejects.toThrow('Network Error')
    })

    it('emits error toast for network failure', async () => {
      const networkError = new Error('Network Error')
      mockPost.mockRejectedValueOnce(networkError)

      const { result } = renderHook(() => useCreateDocument(), {
        wrapper: createWrapper(),
      })

      try {
        await result.current.mutateAsync(mockRequest)
      } catch {
        // Expected to throw
      }

      await waitFor(() => {
        expect(mockEmitToast).toHaveBeenCalledWith(
          expect.objectContaining({
            intent: 'error',
          }),
        )
      })
    })
  })

  describe('mutation state', () => {
    it('sets isPending to true during mutation', async () => {
      let resolvePost: (value: typeof mockSuccessResponse) => void
      const pendingPromise = new Promise<typeof mockSuccessResponse>((resolve) => {
        resolvePost = resolve
      })
      mockPost.mockReturnValueOnce(pendingPromise)

      const { result } = renderHook(() => useCreateDocument(), {
        wrapper: createWrapper(),
      })

      const mutationPromise = result.current.mutateAsync(mockRequest)

      await waitFor(() => {
        expect(result.current.isPending).toBe(true)
      })

      resolvePost!(mockSuccessResponse)
      await mutationPromise

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })
    })

    it('sets isError to true after failure', async () => {
      mockPost.mockRejectedValueOnce(new Error('Test error'))

      const { result } = renderHook(() => useCreateDocument(), {
        wrapper: createWrapper(),
      })

      try {
        await result.current.mutateAsync(mockRequest)
      } catch {
        // Expected to throw
      }

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })

    it('can reset mutation state', async () => {
      mockPost.mockRejectedValueOnce(new Error('Test error'))

      const { result } = renderHook(() => useCreateDocument(), {
        wrapper: createWrapper(),
      })

      try {
        await result.current.mutateAsync(mockRequest)
      } catch {
        // Expected to throw
      }

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      result.current.reset()

      await waitFor(() => {
        expect(result.current.isError).toBe(false)
      })
    })
  })
})
