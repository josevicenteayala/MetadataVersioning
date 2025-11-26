/**
 * Auth context type and context creation
 */
import { createContext } from 'react'
import type { SessionCredentials, UserRole } from '../../services/auth/sessionStore'

export interface AuthContextValue {
  /** Current credentials (username only - password is not exposed) */
  username?: string
  /** Whether credentials are configured */
  isAuthenticated: boolean
  /** Current user role */
  role?: UserRole
  /** Whether credentials have been validated */
  isValidated: boolean
  /** When credentials were last validated */
  validatedAt?: string
  /** Set credentials in session store */
  setCredentials: (credentials: SessionCredentials) => void
  /** Clear all credentials */
  clearCredentials: () => void
  /** Check if user has specific role */
  hasRole: (requiredRole: UserRole) => boolean
  /** Check if user is admin */
  isAdmin: boolean
  /** Check if user can edit (admin or contributor) */
  canEdit: boolean
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
