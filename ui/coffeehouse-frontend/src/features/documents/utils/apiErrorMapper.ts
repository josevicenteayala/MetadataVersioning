import type { AxiosError } from 'axios'

/**
 * API error response structure from the backend.
 */
export interface ApiErrorResponse {
  error: string
  message: string
  details?: {
    field: string
    constraint: string
    value?: unknown
  }[]
  path?: string
  timestamp?: string
}

/**
 * Form field error structure for inline display.
 */
export interface FieldError {
  field: string
  message: string
}

/**
 * Mapped error result for form handling.
 */
export interface MappedFormError {
  /** General error message (for toast or form-level display) */
  message: string
  /** Field-specific errors for inline display */
  fieldErrors: FieldError[]
  /** Whether this is a conflict (document already exists) */
  isConflict: boolean
  /** Whether this is a validation error */
  isValidation: boolean
  /** Whether this is a server error (5xx) */
  isServerError: boolean
  /** Whether this is a network error */
  isNetworkError: boolean
  /** Correlation ID from response headers */
  correlationId?: string
}

/**
 * Maps API field names to form field names.
 * The backend may use different field names than our form.
 */
const FIELD_NAME_MAP: Record<string, string> = {
  type: 'type',
  name: 'name',
  content: 'payload',
  changeSummary: 'changeSummary',
  payload: 'payload',
}

/**
 * Extract correlation ID from axios error.
 */
const extractCorrelationId = (error: AxiosError<ApiErrorResponse>): string | undefined => {
  const headers = error.response?.headers as Record<string, unknown> | undefined
  const header = headers?.['x-correlation-id']
  return typeof header === 'string' ? header : undefined
}

/**
 * Maps an API error field name to form field name.
 */
const mapFieldName = (apiField: string): string => {
  return FIELD_NAME_MAP[apiField] ?? apiField
}

/**
 * Maps API error details to form field errors.
 */
const mapDetailsToFieldErrors = (
  details?: { field: string; constraint: string; value?: unknown }[],
): FieldError[] => {
  if (!details || details.length === 0) {
    return []
  }

  return details.map((detail) => ({
    field: mapFieldName(detail.field),
    message: detail.constraint,
  }))
}

/**
 * Extracts field errors from validation error message.
 * Falls back to parsing the message if no details array.
 */
const extractFieldErrorsFromMessage = (message: string): FieldError[] => {
  const errors: FieldError[] = []

  // Common patterns in error messages
  const patterns = [
    { regex: /type.*(?:invalid|format|kebab)/i, field: 'type' },
    { regex: /name.*(?:invalid|format|kebab)/i, field: 'name' },
    { regex: /content.*(?:invalid|required)/i, field: 'payload' },
    { regex: /payload.*(?:invalid|required)/i, field: 'payload' },
    { regex: /(?:invalid|malformed).*json/i, field: 'payload' },
  ]

  for (const { regex, field } of patterns) {
    if (regex.test(message)) {
      errors.push({ field, message })
    }
  }

  return errors
}

/**
 * Maps an axios error to form error structure.
 *
 * Handles different error types:
 * - 400: Validation errors with field-specific messages
 * - 409: Conflict errors (document already exists)
 * - 401/403: Authentication/authorization errors
 * - 5xx: Server errors with retry guidance
 * - Network errors
 *
 * @param error - The axios error from the API call
 * @returns Mapped error with field errors and metadata
 *
 * @example
 * ```tsx
 * try {
 *   await createDocument(data)
 * } catch (error) {
 *   const mapped = mapApiErrorToFormError(error)
 *   if (mapped.isConflict) {
 *     setFieldError('name', 'Document already exists')
 *   }
 *   mapped.fieldErrors.forEach(({ field, message }) => {
 *     setFieldError(field, message)
 *   })
 * }
 * ```
 */
export const mapApiErrorToFormError = (error: unknown): MappedFormError => {
  const axiosError = error as AxiosError<ApiErrorResponse>
  const correlationId = extractCorrelationId(axiosError)
  const status = axiosError.response?.status
  const data = axiosError.response?.data

  // Network error (no response)
  if (!axiosError.response) {
    return {
      message: 'Network error. Please check your connection and try again.',
      fieldErrors: [],
      isConflict: false,
      isValidation: false,
      isServerError: false,
      isNetworkError: true,
      correlationId,
    }
  }

  // 409 Conflict - Document already exists
  if (status === 409) {
    return {
      message: data?.message ?? 'A document with this name and type already exists.',
      fieldErrors: [
        { field: 'type', message: 'This type/name combination already exists' },
        { field: 'name', message: 'This type/name combination already exists' },
      ],
      isConflict: true,
      isValidation: false,
      isServerError: false,
      isNetworkError: false,
      correlationId,
    }
  }

  // 400 Validation Error
  if (status === 400) {
    const fieldErrors = data?.details
      ? mapDetailsToFieldErrors(data.details)
      : extractFieldErrorsFromMessage(data?.message ?? '')

    return {
      message: data?.message ?? 'Validation error. Please check your input.',
      fieldErrors,
      isConflict: false,
      isValidation: true,
      isServerError: false,
      isNetworkError: false,
      correlationId,
    }
  }

  // 401 Unauthorized
  if (status === 401) {
    return {
      message: 'Authentication required. Please enter your credentials in Settings.',
      fieldErrors: [],
      isConflict: false,
      isValidation: false,
      isServerError: false,
      isNetworkError: false,
      correlationId,
    }
  }

  // 403 Forbidden
  if (status === 403) {
    return {
      message: 'Permission denied. Contact an administrator for access.',
      fieldErrors: [],
      isConflict: false,
      isValidation: false,
      isServerError: false,
      isNetworkError: false,
      correlationId,
    }
  }

  // 5xx Server Error
  if (status && status >= 500) {
    return {
      message: 'Server error. Please try again later or contact support if the problem persists.',
      fieldErrors: [],
      isConflict: false,
      isValidation: false,
      isServerError: true,
      isNetworkError: false,
      correlationId,
    }
  }

  // Unknown error
  return {
    message: axiosError.message ?? 'An unexpected error occurred. Please try again.',
    fieldErrors: [],
    isConflict: false,
    isValidation: false,
    isServerError: false,
    isNetworkError: false,
    correlationId,
  }
}

/**
 * Checks if an error is an axios error with response.
 */
export const isApiError = (error: unknown): error is AxiosError<ApiErrorResponse> => {
  return (
    error != null &&
    typeof error === 'object' &&
    'isAxiosError' in error &&
    (error as AxiosError).isAxiosError === true
  )
}

/**
 * Gets the HTTP status code from an error if available.
 */
export const getErrorStatus = (error: unknown): number | undefined => {
  if (isApiError(error)) {
    return error.response?.status
  }
  return undefined
}
