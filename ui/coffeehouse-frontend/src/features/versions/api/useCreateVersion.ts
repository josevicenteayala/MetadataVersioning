import { useMutation, useQueryClient } from '@tanstack/react-query'
import { httpClient } from '@services/api/httpClient'
import { emitToast } from '@services/feedback/toastBus'
import { versionHistoryKeys } from './useVersionHistory'
import type { MetadataVersion } from '../types'

export interface CreateVersionRequest {
  documentId: string
  payload: Record<string, unknown>
  changeSummary: string
}

export interface CreateVersionResponse extends MetadataVersion {
  correlationId?: string
}

/**
 * Creates a new draft version for a document.
 */
const createVersion = async (request: CreateVersionRequest): Promise<CreateVersionResponse> => {
  const response = await httpClient.post<CreateVersionResponse>(
    `/api/v1/metadata/${request.documentId}/versions`,
    {
      payload: request.payload,
      changeSummary: request.changeSummary,
    },
  )

  // Extract correlation ID from response headers
  const correlationId = response.headers['x-correlation-id'] as string | undefined

  return correlationId ? { ...response.data, correlationId } : response.data
}

export interface UseCreateVersionOptions {
  /** Callback when version is created successfully */
  onSuccess?: (version: CreateVersionResponse) => void
  /** Callback when creation fails */
  onError?: (error: Error) => void
}

/**
 * Hook to create a new draft version for a metadata document.
 * Automatically invalidates version history cache on success.
 *
 * @example
 * ```tsx
 * const { mutateAsync, isPending } = useCreateVersion({
 *   onSuccess: (version) => console.log('Created:', version.versionId),
 * })
 *
 * await mutateAsync({
 *   documentId: 'doc-001',
 *   payload: { key: 'value' },
 *   changeSummary: 'Added new field',
 * })
 * ```
 */
export const useCreateVersion = (options?: UseCreateVersionOptions) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createVersion,

    onSuccess: (data, variables) => {
      // Invalidate version history for this document
      void queryClient.invalidateQueries({
        queryKey: versionHistoryKeys.byDocument(variables.documentId),
      })

      // Invalidate document details (version count changed)
      void queryClient.invalidateQueries({
        queryKey: ['document', variables.documentId],
      })

      // Invalidate dashboard stats
      void queryClient.invalidateQueries({
        queryKey: ['documents'],
      })

      // Show success toast
      emitToast({
        intent: 'success',
        title: 'Version created',
        message: `Draft v${data.versionNumber} created successfully`,
        ...(data.correlationId && { correlationId: data.correlationId }),
      })

      options?.onSuccess?.(data)
    },

    onError: (error: Error) => {
      // Extract correlation ID from error if available
      const correlationId = (error as { correlationId?: string }).correlationId

      emitToast({
        intent: 'error',
        title: 'Failed to create version',
        message: error.message,
        ...(correlationId && { correlationId }),
      })

      options?.onError?.(error)
    },
  })
}

export default useCreateVersion
