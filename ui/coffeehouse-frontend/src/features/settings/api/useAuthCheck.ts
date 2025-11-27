/**
 * T042 [P] [US5]: Auth check hook using TanStack Query
 * Validates credentials against /auth/check endpoint
 */
import { useMutation } from '@tanstack/react-query'
import { httpClient } from '../../../services/api/httpClient'
import { sessionStore, type UserRole } from '../../../services/auth/sessionStore'
import { emitToast } from '../../../services/feedback/toastBus'

interface AuthCheckResponse {
  valid: boolean
  role?: UserRole
  message?: string
}

interface AuthCheckError {
  message: string
  status?: number
  correlationId?: string
}

/**
 * Check authentication status with the API
 */
const checkAuth = async (): Promise<AuthCheckResponse> => {
  const response = await httpClient.get<AuthCheckResponse>('/auth/check')
  return response.data
}

/**
 * Hook for testing connection/validating credentials
 * Uses mutation instead of query since it's an explicit user action
 */
export const useAuthCheck = () => {
  const mutation = useMutation<AuthCheckResponse, AuthCheckError>({
    mutationFn: checkAuth,
    onSuccess: (data) => {
      if (data.valid) {
        sessionStore.getState().setRole(data.role)
        sessionStore.getState().markValidated()
        emitToast({
          title: 'Connection Successful',
          message: data.role
            ? `Authenticated as ${data.role}`
            : 'Credentials validated successfully',
          intent: 'success',
        })
      } else {
        // Server says invalid but returned 200
        emitToast({
          title: 'Connection Failed',
          message: data.message ?? 'Credentials are not valid',
          intent: 'error',
        })
      }
    },
    onError: (error) => {
      const message = error.message ?? 'Unable to verify credentials'
      emitToast({
        title: 'Connection Failed',
        message,
        intent: 'error',
        correlationId: error.correlationId,
      })
    },
  })

  return {
    checkConnection: mutation.mutate,
    isChecking: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  }
}

export type { AuthCheckResponse, AuthCheckError }
