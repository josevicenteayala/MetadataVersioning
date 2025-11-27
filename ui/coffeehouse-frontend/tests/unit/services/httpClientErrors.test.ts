/**
 * Unit tests for httpClient error handling
 * Tests: 401, 403, 5xx, and malformed JSON response handling
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios, { AxiosError, type AxiosResponse } from 'axios'
import MockAdapter from 'axios-mock-adapter'

// Mock modules before importing
vi.mock('../../../src/services/auth/sessionStore', () => ({
  sessionStore: {
    getState: vi.fn(() => ({
      credentials: { username: 'test', password: 'pass' },
      correlationId: 'test-correlation-id',
      handleUnauthorized: vi.fn(),
      setCorrelationId: vi.fn(),
    })),
  },
  getAuthorizationHeader: vi.fn(() => 'Basic dGVzdDpwYXNz'),
}))

vi.mock('../../../src/services/feedback/toastBus', () => ({
  emitToast: vi.fn(),
}))

describe('httpClient error handling', () => {
  describe('error response types', () => {
    it('handles 401 Unauthorized by clearing credentials', async () => {
      const { sessionStore } = await import('../../../src/services/auth/sessionStore')
      const { emitToast } = await import('../../../src/services/feedback/toastBus')

      const mockHandleUnauthorized = vi.fn()
      const mockSetCorrelationId = vi.fn()

      vi.mocked(sessionStore.getState).mockReturnValue({
        credentials: { username: 'test', password: 'pass' },
        correlationId: undefined,
        handleUnauthorized: mockHandleUnauthorized,
        setCorrelationId: mockSetCorrelationId,
        role: 'admin',
        validatedAt: new Date().toISOString(),
        setCredentials: vi.fn(),
        clearCredentials: vi.fn(),
        setRole: vi.fn(),
        markValidated: vi.fn(),
      })

      // Re-import to get fresh instance
      const { httpClient } = await import('../../../src/services/api/httpClient')

      const mockAdapter = new MockAdapter(httpClient)
      mockAdapter.onGet('/test').reply(
        401,
        { message: 'Unauthorized' },
        {
          'x-correlation-id': 'corr-401',
        },
      )

      await expect(httpClient.get('/test')).rejects.toThrow()

      expect(mockHandleUnauthorized).toHaveBeenCalled()
      expect(emitToast).toHaveBeenCalledWith(
        expect.objectContaining({
          intent: 'warning',
          title: 'Session expired',
        }),
      )

      mockAdapter.restore()
    })

    it('handles 403 Forbidden with permission denied message', async () => {
      const { emitToast } = await import('../../../src/services/feedback/toastBus')
      const { httpClient } = await import('../../../src/services/api/httpClient')

      const mockAdapter = new MockAdapter(httpClient)
      mockAdapter.onGet('/admin-only').reply(
        403,
        { message: 'Forbidden' },
        {
          'x-correlation-id': 'corr-403',
        },
      )

      await expect(httpClient.get('/admin-only')).rejects.toThrow()

      expect(emitToast).toHaveBeenCalledWith(
        expect.objectContaining({
          intent: 'error',
          title: 'Permission denied',
          message: expect.stringContaining('administrator'),
        }),
      )

      mockAdapter.restore()
    })

    it('handles 5xx server errors with retry guidance', async () => {
      const { emitToast } = await import('../../../src/services/feedback/toastBus')
      const { httpClient } = await import('../../../src/services/api/httpClient')

      const mockAdapter = new MockAdapter(httpClient)
      mockAdapter.onGet('/server-error').reply(
        500,
        { message: 'Internal Server Error' },
        {
          'x-correlation-id': 'corr-500',
        },
      )

      await expect(httpClient.get('/server-error')).rejects.toThrow()

      expect(emitToast).toHaveBeenCalledWith(
        expect.objectContaining({
          intent: 'error',
          title: 'Server error',
          message: expect.stringContaining('try again'),
        }),
      )

      mockAdapter.restore()
    })

    it('handles 502 Bad Gateway with server error message', async () => {
      const { emitToast } = await import('../../../src/services/feedback/toastBus')
      const { httpClient } = await import('../../../src/services/api/httpClient')

      const mockAdapter = new MockAdapter(httpClient)
      mockAdapter.onGet('/gateway-error').reply(502, { message: 'Bad Gateway' })

      await expect(httpClient.get('/gateway-error')).rejects.toThrow()

      expect(emitToast).toHaveBeenCalledWith(
        expect.objectContaining({
          intent: 'error',
          title: 'Server error',
        }),
      )

      mockAdapter.restore()
    })

    it('handles 503 Service Unavailable with server error message', async () => {
      const { emitToast } = await import('../../../src/services/feedback/toastBus')
      const { httpClient } = await import('../../../src/services/api/httpClient')

      const mockAdapter = new MockAdapter(httpClient)
      mockAdapter.onGet('/unavailable').reply(503, { message: 'Service Unavailable' })

      await expect(httpClient.get('/unavailable')).rejects.toThrow()

      expect(emitToast).toHaveBeenCalledWith(
        expect.objectContaining({
          intent: 'error',
          title: 'Server error',
        }),
      )

      mockAdapter.restore()
    })
  })

  describe('callback registration', () => {
    it('invokes onUnauthorized callback when 401 received', async () => {
      const { httpClient, onUnauthorized } = await import('../../../src/services/api/httpClient')
      const mockCallback = vi.fn()

      onUnauthorized(mockCallback)

      const mockAdapter = new MockAdapter(httpClient)
      mockAdapter.onGet('/trigger-401').reply(
        401,
        {},
        {
          'x-correlation-id': 'callback-corr',
        },
      )

      await expect(httpClient.get('/trigger-401')).rejects.toThrow()

      expect(mockCallback).toHaveBeenCalled()

      // Cleanup
      onUnauthorized(undefined)
      mockAdapter.restore()
    })

    it('invokes onForbidden callback when 403 received', async () => {
      const { httpClient, onForbidden } = await import('../../../src/services/api/httpClient')
      const mockCallback = vi.fn()

      onForbidden(mockCallback)

      const mockAdapter = new MockAdapter(httpClient)
      mockAdapter.onGet('/trigger-403').reply(
        403,
        {},
        {
          'x-correlation-id': 'forbidden-corr',
        },
      )

      await expect(httpClient.get('/trigger-403')).rejects.toThrow()

      expect(mockCallback).toHaveBeenCalled()

      // Cleanup
      onForbidden(undefined)
      mockAdapter.restore()
    })
  })

  describe('correlation ID handling', () => {
    it('extracts correlation ID from response headers', async () => {
      const { sessionStore } = await import('../../../src/services/auth/sessionStore')
      const mockSetCorrelationId = vi.fn()

      vi.mocked(sessionStore.getState).mockReturnValue({
        credentials: { username: 'test', password: 'pass' },
        correlationId: undefined,
        handleUnauthorized: vi.fn(),
        setCorrelationId: mockSetCorrelationId,
        role: 'admin',
        validatedAt: new Date().toISOString(),
        setCredentials: vi.fn(),
        clearCredentials: vi.fn(),
        setRole: vi.fn(),
        markValidated: vi.fn(),
      })

      const { httpClient } = await import('../../../src/services/api/httpClient')

      const mockAdapter = new MockAdapter(httpClient)
      mockAdapter.onGet('/with-correlation').reply(
        200,
        { success: true },
        {
          'x-correlation-id': 'success-corr-123',
        },
      )

      await httpClient.get('/with-correlation')

      expect(mockSetCorrelationId).toHaveBeenCalledWith('success-corr-123')

      mockAdapter.restore()
    })
  })
})
