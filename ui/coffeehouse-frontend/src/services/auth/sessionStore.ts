import { create } from 'zustand'

interface BufferPolyfill {
  from: (value: string, encoding: 'utf-8') => { toString: (encoding: 'base64') => string }
}

type BufferAwareGlobal = typeof globalThis & { Buffer?: BufferPolyfill }

export type UserRole = 'admin' | 'contributor' | 'viewer'

export interface SessionCredentials {
  username: string
  password: string
}

interface SessionState {
  credentials?: SessionCredentials
  role?: UserRole
  correlationId?: string
  validatedAt?: string
  setCredentials: (credentials: SessionCredentials) => void
  clearCredentials: () => void
  setRole: (role?: UserRole) => void
  setCorrelationId: (correlationId?: string) => void
  markValidated: () => void
  handleUnauthorized: () => void
}

const getNodeBuffer = (): BufferPolyfill | undefined => (globalThis as BufferAwareGlobal).Buffer

const base64Encode = (value: string) => {
  if (typeof globalThis.btoa === 'function') {
    return globalThis.btoa(value)
  }
  const buffer = getNodeBuffer()
  if (buffer) {
    return buffer.from(value, 'utf-8').toString('base64')
  }
  throw new Error('No base64 encoder available in this environment')
}

export const sessionStore = create<SessionState>((set, get) => ({
  credentials: undefined,
  role: undefined,
  correlationId: undefined,
  validatedAt: undefined,
  setCredentials: (credentials) => set({ credentials }),
  clearCredentials: () =>
    set({
      credentials: undefined,
      role: undefined,
      correlationId: undefined,
      validatedAt: undefined,
    }),
  setRole: (role) => set({ role }),
  setCorrelationId: (correlationId) => set({ correlationId: correlationId ?? undefined }),
  markValidated: () => set({ validatedAt: new Date().toISOString() }),
  handleUnauthorized: () => {
    const previous = get().credentials
    set({
      credentials: undefined,
      role: undefined,
      correlationId: undefined,
      validatedAt: undefined,
    })
    if (previous) {
      console.info('[session] Cleared credentials due to unauthorized response')
    }
  },
}))

export const useSessionStore = sessionStore

export const getAuthorizationHeader = () => {
  const credentials = sessionStore.getState().credentials
  if (!credentials) {
    return undefined
  }
  return `Basic ${base64Encode(`${credentials.username}:${credentials.password}`)}`
}
