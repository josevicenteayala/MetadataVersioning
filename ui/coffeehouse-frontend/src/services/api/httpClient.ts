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

client.interceptors.response.use(
  (response) => {
    setCorrelationId(response)
    return response
  },
  (error: AxiosError<unknown>) => {
    const { response } = error
    setCorrelationId(response)

    if (response?.status === 401) {
      sessionStore.getState().handleUnauthorized()
      emitToast({
        intent: 'warning',
        title: 'Session expired',
        message: 'Credentials cleared after unauthorized response. Please re-enter.',
        correlationId: readCorrelationId(response),
      })
    }

    return Promise.reject(error)
  },
)

export const httpClient = client

export type HttpClient = typeof httpClient
