/**
 * Validation patterns for document identifiers.
 *
 * Type pattern: lowercase letters only, separated by hyphens
 * Name pattern: lowercase letters and numbers, separated by hyphens
 */

/**
 * Pattern for document type (kebab-case, letters only).
 * Examples: "loyalty-program", "config", "user-preferences"
 */
export const TYPE_PATTERN = /^[a-z]+(-[a-z]+)*$/

/**
 * Pattern for document name (kebab-case, letters and numbers allowed).
 * Examples: "spring-bonus", "config-2025", "v1-settings"
 */
export const NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validates a document type against the kebab-case pattern.
 *
 * Rules:
 * - Only lowercase letters a-z
 * - Words separated by single hyphens
 * - No leading or trailing hyphens
 * - No consecutive hyphens
 * - No numbers, underscores, or special characters
 *
 * @param type - The document type to validate
 * @returns Validation result with error message if invalid
 *
 * @example
 * validateDocumentType('loyalty-program') // { valid: true }
 * validateDocumentType('INVALID') // { valid: false, error: '...' }
 */
export const validateDocumentType = (type: string): ValidationResult => {
  if (!type || type.trim().length === 0) {
    return { valid: false, error: 'Type is required' }
  }

  const trimmed = type.trim()

  if (trimmed.startsWith('-')) {
    return { valid: false, error: 'Type must be kebab-case: cannot start with a hyphen' }
  }

  if (trimmed.endsWith('-')) {
    return { valid: false, error: 'Type must be kebab-case: cannot end with a hyphen' }
  }

  if (trimmed.includes('--')) {
    return { valid: false, error: 'Type must be kebab-case: cannot have consecutive hyphens' }
  }

  if (/[A-Z]/.test(trimmed)) {
    return { valid: false, error: 'Type must be kebab-case: use lowercase letters only' }
  }

  if (/[0-9]/.test(trimmed)) {
    return { valid: false, error: 'Type must be kebab-case: letters only, no numbers' }
  }

  if (/[_\s]/.test(trimmed)) {
    return {
      valid: false,
      error: 'Type must be kebab-case: use hyphens instead of underscores or spaces',
    }
  }

  if (!TYPE_PATTERN.test(trimmed)) {
    return {
      valid: false,
      error: 'Type must be kebab-case (lowercase letters separated by hyphens)',
    }
  }

  return { valid: true }
}

/**
 * Validates a document name against the kebab-case pattern.
 *
 * Rules:
 * - Lowercase letters a-z and numbers 0-9
 * - Words separated by single hyphens
 * - No leading or trailing hyphens
 * - No consecutive hyphens
 * - No underscores or special characters
 *
 * @param name - The document name to validate
 * @returns Validation result with error message if invalid
 *
 * @example
 * validateDocumentName('spring-bonus-2025') // { valid: true }
 * validateDocumentName('InvalidName') // { valid: false, error: '...' }
 */
export const validateDocumentName = (name: string): ValidationResult => {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Name is required' }
  }

  const trimmed = name.trim()

  if (trimmed.startsWith('-')) {
    return { valid: false, error: 'Name must be kebab-case: cannot start with a hyphen' }
  }

  if (trimmed.endsWith('-')) {
    return { valid: false, error: 'Name must be kebab-case: cannot end with a hyphen' }
  }

  if (trimmed.includes('--')) {
    return { valid: false, error: 'Name must be kebab-case: cannot have consecutive hyphens' }
  }

  if (/[A-Z]/.test(trimmed)) {
    return { valid: false, error: 'Name must be kebab-case: use lowercase letters only' }
  }

  if (/[_\s]/.test(trimmed)) {
    return {
      valid: false,
      error: 'Name must be kebab-case: use hyphens instead of underscores or spaces',
    }
  }

  if (!NAME_PATTERN.test(trimmed)) {
    return {
      valid: false,
      error: 'Name must be kebab-case (lowercase letters/numbers separated by hyphens)',
    }
  }

  return { valid: true }
}

/**
 * Validates JSON payload string.
 *
 * Rules:
 * - Must be valid JSON syntax
 * - Must be a JSON object (not array, string, number, etc.)
 *
 * @param payload - The JSON string to validate
 * @returns Validation result with error message including position if syntax error
 *
 * @example
 * validateJsonPayload('{"key": "value"}') // { valid: true }
 * validateJsonPayload('{invalid}') // { valid: false, error: '... at position ...' }
 */
export const validateJsonPayload = (payload: string): ValidationResult => {
  if (!payload || payload.trim().length === 0) {
    return { valid: false, error: 'Payload is required' }
  }

  try {
    const parsed: unknown = JSON.parse(payload)

    // Must be an object, not array or primitive
    if (typeof parsed !== 'object' || parsed === null) {
      return { valid: false, error: 'Payload must be a JSON object' }
    }

    if (Array.isArray(parsed)) {
      return { valid: false, error: 'Payload must be a JSON object, not an array' }
    }

    return { valid: true }
  } catch (e) {
    if (e instanceof SyntaxError) {
      // Extract position from error message if available
      const positionMatch = /position\s*(\d+)/i.exec(e.message)
      const position = positionMatch ? parseInt(positionMatch[1], 10) : undefined

      if (position !== undefined) {
        // Calculate line and column from position
        const lines = payload.substring(0, position).split('\n')
        const line = lines.length
        const column = lines[lines.length - 1].length + 1

        return {
          valid: false,
          error: `Invalid JSON syntax at line ${line}, position ${column}: ${e.message}`,
        }
      }

      return { valid: false, error: `Invalid JSON syntax: ${e.message}` }
    }

    return { valid: false, error: 'Invalid JSON syntax' }
  }
}

/**
 * Validates the optional change summary field.
 *
 * Rules:
 * - Optional (empty is valid)
 * - Maximum 500 characters when provided
 *
 * @param summary - The change summary to validate
 * @returns Validation result with error message if invalid
 */
export const validateChangeSummary = (summary: string): ValidationResult => {
  if (summary.length > 500) {
    return {
      valid: false,
      error: `Change summary must be 500 characters or less (currently ${summary.length})`,
    }
  }

  return { valid: true }
}

/**
 * Converts a string to kebab-case suggestion.
 * Useful for showing users how to fix invalid input.
 *
 * @param input - The string to convert
 * @returns A kebab-case version of the input
 *
 * @example
 * toKebabCase('HelloWorld') // 'hello-world'
 * toKebabCase('user_name') // 'user-name'
 */
export const toKebabCase = (input: string): string => {
  return input
    .replace(/([a-z])([A-Z])/g, '$1-$2') // Insert hyphen between camelCase
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .toLowerCase()
}
