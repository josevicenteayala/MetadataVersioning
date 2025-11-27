/**
 * Hook to require authentication
 * Useful for protected routes
 */
import { useSessionStore } from '../../services/auth/sessionStore'

export const useRequireAuth = () => {
  const credentials = useSessionStore((state) => state.credentials)
  return {
    isAuthenticated: !!credentials,
    credentials,
  }
}
