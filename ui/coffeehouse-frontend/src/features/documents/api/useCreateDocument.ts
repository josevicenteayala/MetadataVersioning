import { useMutation, useQueryClient } from '@tanstack/react-query'
import { httpClient } from '@services/api/httpClient'
import { emitToast } from '@services/feedback/toastBus'
import {
  queryKeys,
  invalidateDashboardStats,
  invalidateDocumentList,
} from '@features/documents/utils/cacheInvalidation'
import type { AxiosError, AxiosResponse } from 'axios'

/**
 * Request payload for creating a new metadata document.
 */
export interface CreateDocumentRequest {
  /** Document type in kebab-case (e.g., "loyalty-program") */
  type: string
  /** Document name in kebab-case with optional numbers (e.g., "spring-bonus-2025") */
  name: string
  /** JSON content object */
  content: Record<string, unknown>
  /** Optional change summary (max 500 chars) */
  changeSummary?: string
}

/**
 * Response from creating a metadata document.
 */
export interface CreateDocumentResponse {
  id: number
  type: string
  name: string
  versionCount: number
  activeVersion: number | null
  createdAt: string
  updatedAt: string
  /** Correlation ID from response headers */
  correlationId?: string
}

/**
 * API error response structure.
 */
export interface ApiErrorResponse {
  error: string
  message: string
  details?: {
    field: string
    constraint: string
    value?: unknown
  }[]
  path?: string
  timestamp?: string
}

/**
 * Enhanced error with API response data.
 */
export interface CreateDocumentError extends Error {
  response?: {
    status: number
    data: ApiErrorResponse
    headers?: Record<string, string>
  }
  correlationId?: string
}

/**
 * Extract correlation ID from axios response headers.
 */
const extractCorrelationId = (response?: AxiosResponse): string | undefined => {
  const headers = response?.headers as Record<string, unknown> | undefined
  const header = headers?.['x-correlation-id']
  return typeof header === 'string' ? header : undefined
}

/**
 * Extract correlation ID from error response.
 */
const extractErrorCorrelationId = (error: AxiosError<ApiErrorResponse>): string | undefined => {
  const headers = error.response?.headers as Record<string, unknown> | undefined
  const header = headers?.['x-correlation-id']
  return typeof header === 'string' ? header : undefined
}

/**
 * Creates a new metadata document via POST /api/v1/metadata.
 */
const createDocument = async (request: CreateDocumentRequest): Promise<CreateDocumentResponse> => {
  const response = await httpClient.post<CreateDocumentResponse>('/api/v1/metadata', {
    type: request.type,
    name: request.name,
    content: request.content,
    changeSummary: request.changeSummary,
  })

  const correlationId = extractCorrelationId(response)

  return correlationId
    ? { ...response.data, correlationId }
    : response.data
}

export interface UseCreateDocumentOptions {
  /** Callback when document is created successfully */
  onSuccess?: (document: CreateDocumentResponse) => void
  /** Callback when creation fails */
  onError?: (error: CreateDocumentError) => void
}

/**
 * Get human-readable error message for different error types.
 */
const getErrorMessage = (error: AxiosError<ApiErrorResponse>): string => {
  const status = error.response?.status
  const data = error.response?.data

  if (status === 409) {
    return data?.message ?? 'A document with this name and type already exists'
  }

  if (status === 400) {
    return data?.message ?? 'Invalid document data. Please check your input.'
  }

  if (status === 401) {
    return 'Authentication required. Please enter your credentials in Settings.'
  }

  if (status === 403) {
    return 'Permission denied. Contact an administrator for access.'
  }

  if (status && status >= 500) {
    return 'Server error. Please try again later.'
  }

  return error.message || 'Failed to create document. Please try again.'
}

/**
 * Hook to create a new metadata document.
 *
 * Creates the first version (v1) of a new document via POST /api/v1/metadata.
 * Automatically invalidates dashboard stats and document list caches on success.
 *
 * @example
 * ```tsx
 * const { mutateAsync, isPending } = useCreateDocument({
 *   onSuccess: (doc) => navigate(`/documents/${doc.type}/${doc.name}`),
 * })
 *
 * await mutateAsync({
 *   type: 'loyalty-program',
 *   name: 'spring-bonus',
 *   content: { programId: 'SPRING2025' },
 *   changeSummary: 'Initial version',
 * })
 * ```
 */
export const useCreateDocument = (options?: UseCreateDocumentOptions) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createDocument,

    onSuccess: async (data) => {
      // Invalidate caches to refresh dashboard and document list
      await Promise.all([
        invalidateDashboardStats(queryClient),
        invalidateDocumentList(queryClient),
      ])

      // Show success toast
      emitToast({
        intent: 'success',
        title: 'Document created',
        message: `${data.type}/${data.name} created successfully`,
        ...(data.correlationId && { correlationId: data.correlationId }),
      })

      options?.onSuccess?.(data)
    },

    onError: (error: AxiosError<ApiErrorResponse>) => {
      const correlationId = extractErrorCorrelationId(error)
      const message = getErrorMessage(error)

      // Show error toast
      emitToast({
        intent: 'error',
        title: 'Failed to create document',
        message,
        ...(correlationId && { correlationId }),
      })

      // Enhance error with correlation ID for form error handling
      const enhancedError = error as CreateDocumentError
      if (correlationId) {
        enhancedError.correlationId = correlationId
      }

      options?.onError?.(enhancedError)
    },
  })
}

/**
 * Query key for the documents list.
 * Exported for cache invalidation in other components.
 */
export const documentListKey = queryKeys.documents.all
