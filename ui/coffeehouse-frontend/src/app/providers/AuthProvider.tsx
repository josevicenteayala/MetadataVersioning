/**
 * T044 [US5]: AuthProvider context
 * Provides auth state and actions to the application
 */
import { useCallback, useMemo, type ReactNode } from 'react'
import { useSessionStore, type UserRole } from '../../services/auth/sessionStore'
import { AuthContext, type AuthContextValue } from './AuthContext'

interface AuthProviderProps {
  children: ReactNode
}

/**
 * Role hierarchy for permission checks
 */
const roleHierarchy: Record<UserRole, number> = {
  admin: 3,
  contributor: 2,
  viewer: 1,
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const credentials = useSessionStore((state) => state.credentials)
  const role = useSessionStore((state) => state.role)
  const validatedAt = useSessionStore((state) => state.validatedAt)
  const setCredentialsStore = useSessionStore((state) => state.setCredentials)
  const clearCredentialsStore = useSessionStore((state) => state.clearCredentials)

  const hasRole = useCallback(
    (requiredRole: UserRole): boolean => {
      if (!role) return false
      return roleHierarchy[role] >= roleHierarchy[requiredRole]
    },
    [role],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      username: credentials?.username,
      isAuthenticated: !!credentials,
      role,
      isValidated: !!validatedAt,
      validatedAt,
      setCredentials: setCredentialsStore,
      clearCredentials: clearCredentialsStore,
      hasRole,
      isAdmin: role === 'admin',
      canEdit: role === 'admin' || role === 'contributor',
    }),
    [
      credentials,
      role,
      validatedAt,
      setCredentialsStore,
      clearCredentialsStore,
      hasRole,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
