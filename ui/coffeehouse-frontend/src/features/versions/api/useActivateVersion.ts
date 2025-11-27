import { useMutation, useQueryClient } from '@tanstack/react-query'
import { httpClient } from '@services/api/httpClient'
import { emitToast } from '@services/feedback/toastBus'
import { sessionStore, useSessionStore } from '@services/auth/sessionStore'
import { versionHistoryKeys } from './useVersionHistory'

export interface ActivateVersionRequest {
  documentId: string
  versionId: string
}

export interface ActivateVersionResponse {
  documentId: string
  activatedVersionId: string
  previousActiveVersionId: string | null
  correlationId?: string
}

/**
 * Activates a specific version, making it the current active version.
 * Only admin users can activate versions.
 */
const activateVersion = async (
  request: ActivateVersionRequest,
): Promise<ActivateVersionResponse> => {
  // Split documentId (e.g., "config/app-settings") into type and name
  const [type, name] = request.documentId.split('/')
  if (!type || !name) {
    throw new Error(`Invalid documentId format: ${request.documentId}. Expected format: type/name`)
  }

  const response = await httpClient.post<ActivateVersionResponse>(
    `/api/v1/metadata/${type}/${name}/versions/${request.versionId}/activate`,
  )

  const correlationId = response.headers['x-correlation-id'] as string | undefined

  return correlationId
    ? { ...response.data, correlationId }
    : response.data
}

export interface UseActivateVersionOptions {
  /** Callback when version is activated successfully */
  onSuccess?: (result: ActivateVersionResponse) => void
  /** Callback when activation fails */
  onError?: (error: Error) => void
}

/**
 * Hook to activate a metadata version.
 * Requires admin role - will show error for non-admin users.
 *
 * @example
 * ```tsx
 * const { mutateAsync, isPending } = useActivateVersion({
 *   onSuccess: (result) => console.log('Activated:', result.activatedVersionId),
 * })
 *
 * await mutateAsync({
 *   documentId: 'doc-001',
 *   versionId: 'ver-003',
 * })
 * ```
 */
export const useActivateVersion = (options?: UseActivateVersionOptions) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: ActivateVersionRequest) => {
      // Check role before making request
      const role = sessionStore.getState().role
      if (role && role !== 'admin') {
        throw new Error('Only administrators can activate versions')
      }

      return activateVersion(request)
    },

    onSuccess: (data, variables) => {
      // Invalidate version history for this document
      void queryClient.invalidateQueries({
        queryKey: versionHistoryKeys.byDocument(variables.documentId),
      })

      // Invalidate document details
      void queryClient.invalidateQueries({
        queryKey: ['document', variables.documentId],
      })

      // Invalidate dashboard stats (active version counts may change)
      void queryClient.invalidateQueries({
        queryKey: ['documents'],
      })

      // Show success toast
      emitToast({
        intent: 'success',
        title: 'Version activated',
        message: data.previousActiveVersionId
          ? `Version activated. Previous active version has been demoted.`
          : 'Version is now active.',
        ...(data.correlationId && { correlationId: data.correlationId }),
      })

      options?.onSuccess?.(data)
    },

    onError: (error: Error) => {
      const correlationId = (error as { correlationId?: string }).correlationId

      emitToast({
        intent: 'error',
        title: 'Activation failed',
        message: error.message,
        ...(correlationId && { correlationId }),
      })

      options?.onError?.(error)
    },
  })
}

/**
 * Checks if the current user can activate versions.
 */
export const useCanActivate = (): boolean => {
  const role = useSessionStore((state) => state.role)
  if (!role) {
    // If role has not been validated yet, allow and let API enforce permissions
    return true
  }
  return role === 'admin'
}

export default useActivateVersion
