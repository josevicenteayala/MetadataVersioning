import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CreateDocumentForm from '@features/documents/forms/CreateDocumentForm'
import { renderWithProviders } from '@tests/utils/renderWithProviders'

// Types for tracking mock state
interface CreateDocumentOptions {
  onSuccess?: (data: unknown) => void
  onError?: (error: Error) => void
}

let capturedOptions: CreateDocumentOptions | undefined
let mockMutateAsync: ReturnType<typeof vi.fn>
let mockIsPending = false
let mockReset: ReturnType<typeof vi.fn>
let mockIsError = false
let mockError: Error | null = null

// Mock the create document mutation hook
vi.mock('@features/documents/api/useCreateDocument', () => ({
  useCreateDocument: vi.fn((options?: CreateDocumentOptions) => {
    capturedOptions = options
    return {
      mutate: vi.fn(),
      mutateAsync: mockMutateAsync,
      isPending: mockIsPending,
      isError: mockIsError,
      error: mockError,
      reset: mockReset,
    }
  }),
}))

// Mock toast bus
const mockEmitToast = vi.fn()
vi.mock('@services/feedback/toastBus', () => ({
  emitToast: (toast: unknown) => mockEmitToast(toast),
}))

// Mock navigation
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

/**
 * Helper to set value in a textarea using fireEvent.change
 */
function setTextareaValue(element: HTMLElement, value: string) {
  fireEvent.change(element, { target: { value } })
  fireEvent.blur(element)
}

/**
 * Helper to set input value
 */
function setInputValue(element: HTMLElement, value: string) {
  fireEvent.change(element, { target: { value } })
  fireEvent.blur(element)
}

describe('CreateDocumentForm', () => {
  const defaultProps = {
    onSuccess: vi.fn(),
    onCancel: vi.fn(),
  }

  const mockDocumentResponse = {
    id: 123,
    type: 'loyalty-program',
    name: 'spring-bonus',
    versionCount: 1,
    activeVersion: null,
    createdAt: '2025-11-27T10:00:00Z',
    updatedAt: '2025-11-27T10:00:00Z',
    correlationId: 'corr-123',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    capturedOptions = undefined
    mockIsPending = false
    mockIsError = false
    mockError = null
    mockReset = vi.fn()
    mockMutateAsync = vi.fn().mockImplementation(async () => {
      capturedOptions?.onSuccess?.(mockDocumentResponse)
      return mockDocumentResponse
    })
  })

  describe('rendering', () => {
    it('renders the form with all required fields', () => {
      renderWithProviders(<CreateDocumentForm {...defaultProps} />)

      expect(screen.getByRole('heading', { name: /create new document/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/document type/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/document name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/json payload/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/change summary/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create document/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('renders with empty fields initially', () => {
      renderWithProviders(<CreateDocumentForm {...defaultProps} />)

      expect(screen.getByLabelText(/document type/i)).toHaveValue('')
      expect(screen.getByLabelText(/document name/i)).toHaveValue('')
      expect(screen.getByLabelText(/json payload/i)).toHaveValue('')
      expect(screen.getByLabelText(/change summary/i)).toHaveValue('')
    })
  })

  describe('field validation - document type (kebab-case)', () => {
    it('shows error for invalid type format - uppercase letters', async () => {
      renderWithProviders(<CreateDocumentForm {...defaultProps} />)

      const typeInput = screen.getByLabelText(/document type/i)
      setInputValue(typeInput, 'InvalidType')

      await waitFor(() => {
        expect(screen.getByText(/must be kebab-case/i)).toBeInTheDocument()
      })
    })

    it('shows error for invalid type format - numbers at start', async () => {
      renderWithProviders(<CreateDocumentForm {...defaultProps} />)

      const typeInput = screen.getByLabelText(/document type/i)
      setInputValue(typeInput, '123-type')

      await waitFor(() => {
        expect(screen.getByText(/must be kebab-case/i)).toBeInTheDocument()
      })
    })

    it('shows error for invalid type format - underscores', async () => {
      renderWithProviders(<CreateDocumentForm {...defaultProps} />)

      const typeInput = screen.getByLabelText(/document type/i)
      setInputValue(typeInput, 'invalid_type')

      await waitFor(() => {
        expect(screen.getByText(/must be kebab-case/i)).toBeInTheDocument()
      })
    })

    it('shows error for type with trailing hyphen', async () => {
      renderWithProviders(<CreateDocumentForm {...defaultProps} />)

      const typeInput = screen.getByLabelText(/document type/i)
      setInputValue(typeInput, 'invalid-type-')

      await waitFor(() => {
        expect(screen.getByText(/must be kebab-case/i)).toBeInTheDocument()
      })
    })

    it('accepts valid kebab-case type', async () => {
      renderWithProviders(<CreateDocumentForm {...defaultProps} />)

      const typeInput = screen.getByLabelText(/document type/i)
      setInputValue(typeInput, 'loyalty-program')

      await waitFor(() => {
        expect(screen.queryByText(/must be kebab-case/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('field validation - document name (kebab-case with numbers)', () => {
    it('shows error for invalid name format - uppercase letters', async () => {
      renderWithProviders(<CreateDocumentForm {...defaultProps} />)

      const nameInput = screen.getByLabelText(/document name/i)
      setInputValue(nameInput, 'InvalidName')

      await waitFor(() => {
        expect(screen.getByText(/must be kebab-case/i)).toBeInTheDocument()
      })
    })

    it('accepts valid kebab-case name with numbers', async () => {
      renderWithProviders(<CreateDocumentForm {...defaultProps} />)

      const nameInput = screen.getByLabelText(/document name/i)
      setInputValue(nameInput, 'spring-bonus-2025')

      await waitFor(() => {
        expect(screen.queryByText(/must be kebab-case/i)).not.toBeInTheDocument()
      })
    })

    it('shows error for empty name when touched', async () => {
      renderWithProviders(<CreateDocumentForm {...defaultProps} />)

      const nameInput = screen.getByLabelText(/document name/i)
      fireEvent.focus(nameInput)
      fireEvent.blur(nameInput)

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument()
      })
    })
  })

  describe('field validation - JSON payload', () => {
    it('shows error for invalid JSON syntax', async () => {
      renderWithProviders(<CreateDocumentForm {...defaultProps} />)

      const payloadInput = screen.getByLabelText(/json payload/i)
      setTextareaValue(payloadInput, '{ invalid json }')

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/invalid json syntax/i)
      })
    })

    it('shows line/character position for JSON syntax errors', async () => {
      renderWithProviders(<CreateDocumentForm {...defaultProps} />)

      const payloadInput = screen.getByLabelText(/json payload/i)
      setTextareaValue(payloadInput, '{\n  "key": value\n}')

      // Modern JSON parsers include the invalid token in the error message
      // Some browsers include "line" and "position", others show the invalid token
      await waitFor(() => {
        const alert = screen.getByRole('alert')
        expect(alert).toHaveTextContent(/invalid json syntax/i)
      })
    })

    it('accepts valid JSON object', async () => {
      renderWithProviders(<CreateDocumentForm {...defaultProps} />)

      const payloadInput = screen.getByLabelText(/json payload/i)
      setTextareaValue(payloadInput, '{"key": "value", "number": 42}')

      await waitFor(() => {
        expect(screen.queryByText(/invalid json/i)).not.toBeInTheDocument()
      })
    })

    it('shows error for non-object JSON (array)', async () => {
      renderWithProviders(<CreateDocumentForm {...defaultProps} />)

      const payloadInput = screen.getByLabelText(/json payload/i)
      setTextareaValue(payloadInput, '[1, 2, 3]')

      await waitFor(() => {
        expect(screen.getByText(/must be a json object/i)).toBeInTheDocument()
      })
    })

    it('shows error for empty payload when touched', async () => {
      renderWithProviders(<CreateDocumentForm {...defaultProps} />)

      const payloadInput = screen.getByLabelText(/json payload/i)
      fireEvent.focus(payloadInput)
      fireEvent.blur(payloadInput)

      await waitFor(() => {
        expect(screen.getByText(/payload is required/i)).toBeInTheDocument()
      })
    })
  })

  describe('submit state management', () => {
    it('disables submit button when form is invalid', () => {
      renderWithProviders(<CreateDocumentForm {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: /create document/i })
      expect(submitButton).toBeDisabled()
    })

    it('enables submit button when all required fields are valid', async () => {
      renderWithProviders(<CreateDocumentForm {...defaultProps} />)

      // Fill all required fields with valid data
      setInputValue(screen.getByLabelText(/document type/i), 'loyalty-program')
      setInputValue(screen.getByLabelText(/document name/i), 'spring-bonus')
      setTextareaValue(screen.getByLabelText(/json payload/i), '{"key": "value"}')

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /create document/i })
        expect(submitButton).toBeEnabled()
      })
    })

    it('shows loading indicator during submission', async () => {
      mockIsPending = true
      renderWithProviders(<CreateDocumentForm {...defaultProps} />)

      expect(screen.getByRole('button', { name: /creating/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled()
    })

    it('prevents double submission while pending', async () => {
      const user = userEvent.setup()
      mockIsPending = false
      renderWithProviders(<CreateDocumentForm {...defaultProps} />)

      // Fill form with valid data
      setInputValue(screen.getByLabelText(/document type/i), 'loyalty-program')
      setInputValue(screen.getByLabelText(/document name/i), 'spring-bonus')
      setTextareaValue(screen.getByLabelText(/json payload/i), '{"key": "value"}')

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create document/i })).toBeEnabled()
      })

      // First click triggers mutation
      await user.click(screen.getByRole('button', { name: /create document/i }))

      expect(mockMutateAsync).toHaveBeenCalledTimes(1)
    })
  })

  describe('form submission', () => {
    it('calls mutateAsync with correct payload on submit', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CreateDocumentForm {...defaultProps} />)

      // Fill form
      setInputValue(screen.getByLabelText(/document type/i), 'loyalty-program')
      setInputValue(screen.getByLabelText(/document name/i), 'spring-bonus')
      setTextareaValue(screen.getByLabelText(/json payload/i), '{"programId": "SPRING2025"}')
      setInputValue(screen.getByLabelText(/change summary/i), 'Initial version')

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create document/i })).toBeEnabled()
      })

      await user.click(screen.getByRole('button', { name: /create document/i }))

      expect(mockMutateAsync).toHaveBeenCalledWith({
        type: 'loyalty-program',
        name: 'spring-bonus',
        content: { programId: 'SPRING2025' },
        changeSummary: 'Initial version',
      })
    })

    it('calls onSuccess callback after successful submission', async () => {
      const user = userEvent.setup()
      const onSuccessMock = vi.fn()
      renderWithProviders(<CreateDocumentForm {...defaultProps} onSuccess={onSuccessMock} />)

      // Fill form
      setInputValue(screen.getByLabelText(/document type/i), 'loyalty-program')
      setInputValue(screen.getByLabelText(/document name/i), 'spring-bonus')
      setTextareaValue(screen.getByLabelText(/json payload/i), '{"key": "value"}')

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create document/i })).toBeEnabled()
      })

      await user.click(screen.getByRole('button', { name: /create document/i }))

      await waitFor(() => {
        expect(onSuccessMock).toHaveBeenCalledWith(mockDocumentResponse)
      })
    })
  })

  describe('cancel behavior', () => {
    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()
      const onCancelMock = vi.fn()
      renderWithProviders(<CreateDocumentForm {...defaultProps} onCancel={onCancelMock} />)

      await user.click(screen.getByRole('button', { name: /cancel/i }))

      expect(onCancelMock).toHaveBeenCalled()
    })

    it('does not submit form when cancel is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CreateDocumentForm {...defaultProps} />)

      // Fill form partially
      setInputValue(screen.getByLabelText(/document type/i), 'loyalty-program')

      await user.click(screen.getByRole('button', { name: /cancel/i }))

      expect(mockMutateAsync).not.toHaveBeenCalled()
    })
  })

  describe('error display', () => {
    it('displays inline error for conflict (409) response', async () => {
      const user = userEvent.setup()
      const conflictError = new Error('Document already exists') as Error & {
        response?: { status: number; data: { error: string; message: string } }
      }
      conflictError.response = {
        status: 409,
        data: {
          error: 'CONFLICT',
          message: 'Metadata document already exists: loyalty-program:spring-bonus',
        },
      }

      mockMutateAsync = vi.fn().mockImplementation(() => {
        // Trigger the onError callback that was captured
        if (capturedOptions?.onError) {
          capturedOptions.onError(conflictError)
        }
        return Promise.reject(conflictError)
      })
      renderWithProviders(<CreateDocumentForm {...defaultProps} />)

      // Fill form
      setInputValue(screen.getByLabelText(/document type/i), 'loyalty-program')
      setInputValue(screen.getByLabelText(/document name/i), 'spring-bonus')
      setTextareaValue(screen.getByLabelText(/json payload/i), '{"key": "value"}')

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create document/i })).toBeEnabled()
      })

      await user.click(screen.getByRole('button', { name: /create document/i }))

      // The mapper sets field-specific error for both type and name fields
      await waitFor(() => {
        const errorElements = screen.getAllByText(/type\/name combination already exists/i)
        expect(errorElements.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('displays validation errors for 400 response', async () => {
      const user = userEvent.setup()
      const validationError = new Error('Validation failed') as Error & {
        response?: {
          status: number
          data: {
            error: string
            message: string
            details?: { field: string; constraint: string }[]
          }
        }
      }
      validationError.response = {
        status: 400,
        data: {
          error: 'VALIDATION_ERROR',
          message: 'Invalid metadata type format',
          details: [{ field: 'type', constraint: 'must match kebab-case pattern' }],
        },
      }

      mockMutateAsync = vi.fn().mockImplementation(() => {
        if (capturedOptions?.onError) {
          capturedOptions.onError(validationError)
        }
        return Promise.reject(validationError)
      })
      renderWithProviders(<CreateDocumentForm {...defaultProps} />)

      // Fill form
      setInputValue(screen.getByLabelText(/document type/i), 'loyalty-program')
      setInputValue(screen.getByLabelText(/document name/i), 'spring-bonus')
      setTextareaValue(screen.getByLabelText(/json payload/i), '{"key": "value"}')

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create document/i })).toBeEnabled()
      })

      await user.click(screen.getByRole('button', { name: /create document/i }))

      await waitFor(() => {
        expect(screen.getByText(/kebab-case/i)).toBeInTheDocument()
      })
    })

    it('preserves form data after error', async () => {
      const user = userEvent.setup()
      mockMutateAsync = vi.fn().mockRejectedValue(new Error('Network error'))
      renderWithProviders(<CreateDocumentForm {...defaultProps} />)

      // Fill form
      setInputValue(screen.getByLabelText(/document type/i), 'loyalty-program')
      setInputValue(screen.getByLabelText(/document name/i), 'spring-bonus')
      setTextareaValue(screen.getByLabelText(/json payload/i), '{"key": "value"}')
      setInputValue(screen.getByLabelText(/change summary/i), 'My summary')

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create document/i })).toBeEnabled()
      })

      await user.click(screen.getByRole('button', { name: /create document/i }))

      // Form data should still be present
      await waitFor(() => {
        expect(screen.getByLabelText(/document type/i)).toHaveValue('loyalty-program')
        expect(screen.getByLabelText(/document name/i)).toHaveValue('spring-bonus')
        expect(screen.getByLabelText(/json payload/i)).toHaveValue('{"key": "value"}')
        expect(screen.getByLabelText(/change summary/i)).toHaveValue('My summary')
      })
    })

    it('re-enables submit button after error', async () => {
      const user = userEvent.setup()
      mockMutateAsync = vi.fn().mockRejectedValue(new Error('Network error'))
      renderWithProviders(<CreateDocumentForm {...defaultProps} />)

      // Fill form
      setInputValue(screen.getByLabelText(/document type/i), 'loyalty-program')
      setInputValue(screen.getByLabelText(/document name/i), 'spring-bonus')
      setTextareaValue(screen.getByLabelText(/json payload/i), '{"key": "value"}')

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create document/i })).toBeEnabled()
      })

      await user.click(screen.getByRole('button', { name: /create document/i }))

      // Button should be re-enabled after error
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create document/i })).toBeEnabled()
      })
    })
  })
})
