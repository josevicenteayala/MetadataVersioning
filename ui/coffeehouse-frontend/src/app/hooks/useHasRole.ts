/**
 * Hook to check if current user has required role
 * Safe to use even if not authenticated - returns false
 */
import { useSessionStore, type UserRole } from '../../services/auth/sessionStore'

/**
 * Role hierarchy for permission checks
 */
const roleHierarchy: Record<UserRole, number> = {
  admin: 3,
  contributor: 2,
  viewer: 1,
}

export const useHasRole = (requiredRole: UserRole): boolean => {
  const role = useSessionStore((state) => state.role)
  if (!role) return false
  return roleHierarchy[role] >= roleHierarchy[requiredRole]
}
