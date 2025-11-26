import axios, {
  AxiosHeaders,
  type AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { sessionStore, getAuthorizationHeader } from '../auth/sessionStore'
import { emitToast } from '../feedback/toastBus'

interface FrontendEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_API_TIMEOUT_MS?: string
}

const getEnvString = (value: string | undefined, fallback: string) =>
  typeof value === 'string' && value.length > 0 ? value : fallback

const getEnvNumber = (value: string | undefined, fallback: number) => {
  if (typeof value !== 'string') {
    return fallback
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const runtimeEnv = import.meta.env as unknown as FrontendEnv

const API_BASE_URL = getEnvString(runtimeEnv.VITE_API_BASE_URL, 'http://localhost:8080')
const API_TIMEOUT_MS = getEnvNumber(runtimeEnv.VITE_API_TIMEOUT_MS, 10_000)

const correlationHeaderName = 'x-correlation-id'

const ensureHeaders = (config: InternalAxiosRequestConfig): AxiosHeaders => {
  if (!config.headers) {
    config.headers = new AxiosHeaders()
  } else if (!(config.headers instanceof AxiosHeaders)) {
    config.headers = new AxiosHeaders(config.headers)
  }

  return config.headers
}

const readCorrelationId = (response?: AxiosResponse): string | undefined => {
  if (!response?.headers) {
    return undefined
  }

  const headers = AxiosHeaders.from(response.headers)
  return headers.get(correlationHeaderName) ?? undefined
}

const setCorrelationId = (response?: AxiosResponse): void => {
  const correlationId = readCorrelationId(response)
  if (correlationId) {
    sessionStore.getState().setCorrelationId(correlationId)
  }
}

/**
 * T045 [US5]: Callback registry for 401 credential prompts
 * Allows UI components to register handlers for credential prompts
 */
type UnauthorizedCallback = (correlationId?: string) => void
let onUnauthorizedCallback: UnauthorizedCallback | undefined

/**
 * Register a callback to be invoked when 401 response is received
 * Useful for triggering credential prompt UI
 */
export const onUnauthorized = (callback: UnauthorizedCallback | undefined) => {
  onUnauthorizedCallback = callback
}

const client: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
})

client.interceptors.request.use((config) => {
  const authHeader = getAuthorizationHeader()
  if (authHeader) {
    const headers = ensureHeaders(config)
    headers.set('Authorization', authHeader)
  }

  const headers = ensureHeaders(config)
  headers.set('X-Requested-With', 'MetadataVersioningUI')
  return config
})

/**
 * T045 [US5]: Callback registry for 403 permission denied prompts
 * Allows UI components to register handlers for forbidden access
 */
type ForbiddenCallback = (correlationId?: string) => void
let onForbiddenCallback: ForbiddenCallback | undefined

/**
 * Register a callback to be invoked when 403 response is received
 * Useful for triggering permission denied UI guidance
 */
export const onForbidden = (callback: ForbiddenCallback | undefined) => {
  onForbiddenCallback = callback
}

client.interceptors.response.use(
  (response) => {
    setCorrelationId(response)
    return response
  },
  (error: AxiosError<unknown>) => {
    const { response } = error

    // Handle JSON parsing errors (malformed responses)
    if (error.code === 'ERR_BAD_RESPONSE' || error.message?.includes('JSON')) {
      const correlationId = sessionStore.getState().correlationId
      emitToast({
        intent: 'error',
        title: 'Invalid server response',
        message: 'The server returned an unexpected response. Please try again or contact support.',
        correlationId,
      })
      return Promise.reject(error)
    }

    setCorrelationId(response)

    if (response?.status === 401) {
      const correlationId = readCorrelationId(response)
      sessionStore.getState().handleUnauthorized()

      emitToast({
        intent: 'warning',
        title: 'Session expired',
        message: 'Credentials cleared after unauthorized response. Please re-enter in Settings.',
        correlationId,
      })

      // T045: Invoke registered callback for credential prompt
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback(correlationId)
      }
    }

    // FR-015: Handle 403 Forbidden with permission denied message
    if (response?.status === 403) {
      const correlationId = readCorrelationId(response)

      emitToast({
        intent: 'error',
        title: 'Permission denied',
        message:
          'You do not have permission to perform this action. Contact your administrator for access.',
        correlationId,
      })

      if (onForbiddenCallback) {
        onForbiddenCallback(correlationId)
      }
    }

    // FR-016: Handle 5xx server errors with retry guidance
    if (response?.status && response.status >= 500) {
      const correlationId = readCorrelationId(response)

      emitToast({
        intent: 'error',
        title: 'Server error',
        message:
          'A server error occurred. Please try again using the refresh button or reload the page.',
        correlationId,
      })
    }

    return Promise.reject(error)
  },
)

export const httpClient = client

export type HttpClient = typeof httpClient

/**
 * T049: Get the current correlation ID from session store
 * Useful for error boundary displays and support troubleshooting
 */
export const getCorrelationId = (): string | null => {
  return sessionStore.getState().correlationId ?? null
}
