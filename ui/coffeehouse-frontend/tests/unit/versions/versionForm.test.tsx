import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import NewVersionForm from '@features/versions/forms/NewVersionForm'
import { renderWithProviders } from '@tests/utils/renderWithProviders'

// Types for tracking mock state
interface CreateVersionOptions {
  onSuccess?: (data: unknown) => void
  onError?: (error: Error) => void
}

let capturedOptions: CreateVersionOptions | undefined
let mockMutateAsync: ReturnType<typeof vi.fn>
let mockIsPending = false
let mockReset: ReturnType<typeof vi.fn>

// Mock the create version mutation hook
vi.mock('@features/versions/api/useCreateVersion', () => ({
  useCreateVersion: vi.fn((options?: CreateVersionOptions) => {
    capturedOptions = options
    return {
      mutate: vi.fn(),
      mutateAsync: mockMutateAsync,
      isPending: mockIsPending,
      isError: false,
      error: null,
      reset: mockReset,
    }
  }),
}))

// Mock toast bus
const mockEmitToast = vi.fn()
vi.mock('@services/feedback/toastBus', () => ({
  emitToast: (toast: unknown) => mockEmitToast(toast),
}))

/**
 * Helper to set value in a textarea using fireEvent.change
 * (userEvent.type interprets {} and [] as keyboard modifiers)
 */
function setTextareaValue(element: HTMLElement, value: string) {
  fireEvent.change(element, { target: { value } })
  fireEvent.blur(element)
}

describe('NewVersionForm', () => {
  const defaultProps = {
    documentId: 'doc-001',
    onSuccess: vi.fn(),
    onCancel: vi.fn(),
  }

  const mockVersionResponse = {
    versionId: 'ver-new',
    versionNumber: 4,
    status: 'draft',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    capturedOptions = undefined
    mockIsPending = false
    mockReset = vi.fn()
    mockMutateAsync = vi.fn().mockImplementation(async () => {
      // Simulate calling onSuccess when mutation succeeds
      capturedOptions?.onSuccess?.(mockVersionResponse)
      return mockVersionResponse
    })
  })

  describe('rendering', () => {
    it('renders the form with all required fields', () => {
      renderWithProviders(<NewVersionForm {...defaultProps} />)

      expect(screen.getByRole('heading', { name: /create new version/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/json payload/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/change summary/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create draft/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('shows character count for summary field', () => {
      renderWithProviders(<NewVersionForm {...defaultProps} />)

      expect(screen.getByText(/0 \/ 500/)).toBeInTheDocument()
    })
  })

  describe('JSON validation', () => {
    it('shows error when JSON payload is invalid', async () => {
      renderWithProviders(<NewVersionForm {...defaultProps} />)

      const payloadInput = screen.getByLabelText(/json payload/i)
      setTextareaValue(payloadInput, '{ invalid json }')

      await waitFor(() => {
        expect(screen.getByText(/invalid json syntax/i)).toBeInTheDocument()
      })
    })

    it('clears JSON error when valid JSON is entered', async () => {
      renderWithProviders(<NewVersionForm {...defaultProps} />)

      const payloadInput = screen.getByLabelText(/json payload/i)

      // Enter invalid JSON first
      setTextareaValue(payloadInput, '{ invalid }')

      await waitFor(() => {
        expect(screen.getByText(/invalid json syntax/i)).toBeInTheDocument()
      })

      // Clear and enter valid JSON
      setTextareaValue(payloadInput, '{"valid": "json"}')

      await waitFor(() => {
        expect(screen.queryByText(/invalid json syntax/i)).not.toBeInTheDocument()
      })
    })

    it('shows error when JSON payload is empty', async () => {
      const user = userEvent.setup()
      renderWithProviders(<NewVersionForm {...defaultProps} />)

      const submitBtn = screen.getByRole('button', { name: /create draft/i })
      await user.click(submitBtn)

      await waitFor(() => {
        expect(screen.getByText(/payload is required/i)).toBeInTheDocument()
      })
    })

    it('accepts valid JSON object', async () => {
      renderWithProviders(<NewVersionForm {...defaultProps} />)

      const payloadInput = screen.getByLabelText(/json payload/i)
      setTextareaValue(payloadInput, '{"key": "value", "nested": {"a": 1}}')

      expect(screen.queryByText(/invalid json/i)).not.toBeInTheDocument()
    })

    it('shows error for non-object JSON (array)', async () => {
      renderWithProviders(<NewVersionForm {...defaultProps} />)

      const payloadInput = screen.getByLabelText(/json payload/i)
      setTextareaValue(payloadInput, '[1, 2, 3]')

      await waitFor(() => {
        expect(screen.getByText(/payload must be a json object/i)).toBeInTheDocument()
      })
    })

    it('shows error for non-object JSON (primitive)', async () => {
      renderWithProviders(<NewVersionForm {...defaultProps} />)

      const payloadInput = screen.getByLabelText(/json payload/i)
      setTextareaValue(payloadInput, '"just a string"')

      await waitFor(() => {
        expect(screen.getByText(/payload must be a json object/i)).toBeInTheDocument()
      })
    })
  })

  describe('change summary validation', () => {
    it('shows error when summary is empty on submit', async () => {
      const user = userEvent.setup()
      renderWithProviders(<NewVersionForm {...defaultProps} />)

      const payloadInput = screen.getByLabelText(/json payload/i)
      setTextareaValue(payloadInput, '{"test": true}')

      const submitBtn = screen.getByRole('button', { name: /create draft/i })
      await user.click(submitBtn)

      await waitFor(() => {
        expect(screen.getByText(/summary is required/i)).toBeInTheDocument()
      })
    })

    it('shows error when summary exceeds 500 characters', async () => {
      renderWithProviders(<NewVersionForm {...defaultProps} />)

      const summaryInput = screen.getByLabelText(/change summary/i)
      const longText = 'a'.repeat(501)
      setTextareaValue(summaryInput, longText)

      await waitFor(() => {
        expect(screen.getByText(/summary must be 500 characters or less/i)).toBeInTheDocument()
      })
    })

    it('updates character count as user types', async () => {
      const user = userEvent.setup()
      renderWithProviders(<NewVersionForm {...defaultProps} />)

      const summaryInput = screen.getByLabelText(/change summary/i)
      await user.type(summaryInput, 'Added new pricing fields')

      expect(screen.getByText(/24 \/ 500/)).toBeInTheDocument()
    })
  })

  describe('form submission', () => {
    it('calls mutation with correct payload on valid submission', async () => {
      const user = userEvent.setup()
      renderWithProviders(<NewVersionForm {...defaultProps} />)

      const payloadInput = screen.getByLabelText(/json payload/i)
      const summaryInput = screen.getByLabelText(/change summary/i)

      setTextareaValue(payloadInput, '{"pricing": {"monthly": 99}}')
      await user.type(summaryInput, 'Added pricing configuration')

      const submitBtn = screen.getByRole('button', { name: /create draft/i })
      await user.click(submitBtn)

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          documentId: 'doc-001',
          payload: { pricing: { monthly: 99 } },
          changeSummary: 'Added pricing configuration',
        })
      })
    })

    it('calls onSuccess callback after successful submission', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      renderWithProviders(<NewVersionForm {...defaultProps} onSuccess={onSuccess} />)

      const payloadInput = screen.getByLabelText(/json payload/i)
      const summaryInput = screen.getByLabelText(/change summary/i)

      setTextareaValue(payloadInput, '{"test": true}')
      await user.type(summaryInput, 'Test change')

      const submitBtn = screen.getByRole('button', { name: /create draft/i })
      await user.click(submitBtn)

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(mockVersionResponse)
      })
    })

    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()
      const onCancel = vi.fn()
      renderWithProviders(<NewVersionForm {...defaultProps} onCancel={onCancel} />)

      const cancelBtn = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelBtn)

      expect(onCancel).toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('displays inline error message on failure', async () => {
      mockMutateAsync = vi.fn().mockImplementation(async () => {
        const error = new Error('Server validation failed')
        capturedOptions?.onError?.(error)
        throw error
      })

      const user = userEvent.setup()
      renderWithProviders(<NewVersionForm {...defaultProps} />)

      const payloadInput = screen.getByLabelText(/json payload/i)
      const summaryInput = screen.getByLabelText(/change summary/i)

      setTextareaValue(payloadInput, '{"test": true}')
      await user.type(summaryInput, 'Test change')

      const submitBtn = screen.getByRole('button', { name: /create draft/i })
      await user.click(submitBtn)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/server validation failed/i)
      })
    })
  })

  describe('loading state', () => {
    it('disables form fields during submission', async () => {
      mockIsPending = true

      renderWithProviders(<NewVersionForm {...defaultProps} />)

      expect(screen.getByLabelText(/json payload/i)).toBeDisabled()
      expect(screen.getByLabelText(/change summary/i)).toBeDisabled()
      expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled()
    })

    it('shows loading indicator in submit button', async () => {
      mockIsPending = true

      renderWithProviders(<NewVersionForm {...defaultProps} />)

      expect(screen.getByRole('button', { name: /creating/i })).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('associates error messages with form fields', async () => {
      renderWithProviders(<NewVersionForm {...defaultProps} />)

      const payloadInput = screen.getByLabelText(/json payload/i)
      setTextareaValue(payloadInput, '{ invalid }')

      await waitFor(() => {
        const errorId = payloadInput.getAttribute('aria-describedby')
        expect(errorId).toBeTruthy()
        const errorElement = document.getElementById(errorId!)
        expect(errorElement).toHaveTextContent(/invalid json/i)
      })
    })

    it('sets aria-invalid on fields with errors', async () => {
      renderWithProviders(<NewVersionForm {...defaultProps} />)

      const payloadInput = screen.getByLabelText(/json payload/i)
      setTextareaValue(payloadInput, '{ invalid }')

      await waitFor(() => {
        expect(payloadInput).toHaveAttribute('aria-invalid', 'true')
      })
    })

    it('focuses first error field on submit with errors', async () => {
      const user = userEvent.setup()
      renderWithProviders(<NewVersionForm {...defaultProps} />)

      const submitBtn = screen.getByRole('button', { name: /create draft/i })
      await user.click(submitBtn)

      await waitFor(() => {
        expect(screen.getByLabelText(/json payload/i)).toHaveFocus()
      })
    })
  })

  describe('JSON formatting', () => {
    it('provides format button to prettify JSON', async () => {
      const user = userEvent.setup()
      renderWithProviders(<NewVersionForm {...defaultProps} />)

      const payloadInput = screen.getByLabelText(/json payload/i)
      setTextareaValue(payloadInput, '{"a":1,"b":2}')

      const formatBtn = screen.getByRole('button', { name: /format json/i })
      await user.click(formatBtn)

      await waitFor(() => {
        expect(payloadInput).toHaveValue(JSON.stringify({ a: 1, b: 2 }, null, 2))
      })
    })
  })
})
