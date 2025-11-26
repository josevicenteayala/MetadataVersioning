/**
 * T040 [P] [US5]: Vitest spec for AuthSettingsPanel
 * Tests: validation, auto-clear, credential entry, test connection
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { AuthSettingsPanel } from '../../../src/features/settings/components/AuthSettingsPanel'
import { sessionStore } from '../../../src/services/auth/sessionStore'
import { toastBus } from '../../../src/services/feedback/toastBus'

// Mock the useAuthCheck hook
const mockCheckConnection = vi.fn()
let mockIsChecking = false

vi.mock('../../../src/features/settings/api/useAuthCheck', () => ({
  useAuthCheck: () => ({
    checkConnection: mockCheckConnection,
    isChecking: mockIsChecking,
    isSuccess: false,
    isError: false,
    error: null,
    data: null,
    reset: vi.fn(),
  }),
}))

beforeEach(() => {
  sessionStore.getState().clearCredentials()
  vi.clearAllMocks()
  mockCheckConnection.mockClear()
  mockIsChecking = false
})

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

const renderWithProviders = (ui: ReactNode) => {
  const queryClient = createQueryClient()
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('AuthSettingsPanel', () => {
  describe('Form Rendering', () => {
    it('renders username and password fields', () => {
      renderWithProviders(<AuthSettingsPanel />)

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    })

    it('renders test connection button', () => {
      renderWithProviders(<AuthSettingsPanel />)

      expect(screen.getByRole('button', { name: /test connection/i })).toBeInTheDocument()
    })

    it('renders save credentials button', () => {
      renderWithProviders(<AuthSettingsPanel />)

      expect(screen.getByRole('button', { name: /save credentials/i })).toBeInTheDocument()
    })

    it('renders clear credentials button when credentials exist', () => {
      sessionStore.getState().setCredentials({ username: 'admin', password: 'secret' })
      renderWithProviders(<AuthSettingsPanel />)

      expect(screen.getByRole('button', { name: /clear credentials/i })).toBeInTheDocument()
    })

    it('displays guidance text about credential storage', () => {
      renderWithProviders(<AuthSettingsPanel />)

      expect(
        screen.getByText(/credentials are stored in session memory only/i),
      ).toBeInTheDocument()
    })

    it('shows password field as masked by default', () => {
      renderWithProviders(<AuthSettingsPanel />)

      const passwordField = screen.getByLabelText(/password/i)
      expect(passwordField).toHaveAttribute('type', 'password')
    })
  })

  describe('Validation', () => {
    it('disables save button when username is empty', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AuthSettingsPanel />)

      await user.type(screen.getByLabelText(/password/i), 'secret')

      const saveButton = screen.getByRole('button', { name: /save credentials/i })
      expect(saveButton).toBeDisabled()
    })

    it('disables save button when password is empty', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AuthSettingsPanel />)

      await user.type(screen.getByLabelText(/username/i), 'admin')

      const saveButton = screen.getByRole('button', { name: /save credentials/i })
      expect(saveButton).toBeDisabled()
    })

    it('disables save button when username contains whitespace only', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AuthSettingsPanel />)

      await user.type(screen.getByLabelText(/username/i), '   ')
      await user.type(screen.getByLabelText(/password/i), 'secret')

      const saveButton = screen.getByRole('button', { name: /save credentials/i })
      expect(saveButton).toBeDisabled()
    })

    it('disables save button while form is invalid', () => {
      renderWithProviders(<AuthSettingsPanel />)

      const saveButton = screen.getByRole('button', { name: /save credentials/i })
      expect(saveButton).toBeDisabled()
    })

    it('enables save button when both fields have valid values', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AuthSettingsPanel />)

      await user.type(screen.getByLabelText(/username/i), 'admin')
      await user.type(screen.getByLabelText(/password/i), 'secret')

      const saveButton = screen.getByRole('button', { name: /save credentials/i })
      expect(saveButton).not.toBeDisabled()
    })
  })

  describe('Save Credentials', () => {
    it('saves credentials to session store on valid submit', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AuthSettingsPanel />)

      await user.type(screen.getByLabelText(/username/i), 'admin')
      await user.type(screen.getByLabelText(/password/i), 'secret123')
      await user.click(screen.getByRole('button', { name: /save credentials/i }))

      await waitFor(() => {
        const state = sessionStore.getState()
        expect(state.credentials).toEqual({ username: 'admin', password: 'secret123' })
      })
    })

    it('shows success toast after saving credentials', async () => {
      const toastSpy = vi.fn()
      const unsubscribe = toastBus.subscribe(toastSpy)

      const user = userEvent.setup()
      renderWithProviders(<AuthSettingsPanel />)

      await user.type(screen.getByLabelText(/username/i), 'admin')
      await user.type(screen.getByLabelText(/password/i), 'secret')
      await user.click(screen.getByRole('button', { name: /save credentials/i }))

      await waitFor(() => {
        expect(toastSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            intent: 'success',
            title: expect.stringMatching(/credentials saved/i) as unknown,
          }),
        )
      })

      unsubscribe()
    })

    it('clears password field after saving', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AuthSettingsPanel />)

      await user.type(screen.getByLabelText(/username/i), 'admin')
      await user.type(screen.getByLabelText(/password/i), 'secret')
      await user.click(screen.getByRole('button', { name: /save credentials/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/password/i)).toHaveValue('')
      })
    })
  })

  describe('Clear Credentials', () => {
    it('clears credentials from session store', async () => {
      sessionStore.getState().setCredentials({ username: 'admin', password: 'secret' })

      const user = userEvent.setup()
      renderWithProviders(<AuthSettingsPanel />)

      await user.click(screen.getByRole('button', { name: /clear credentials/i }))

      await waitFor(() => {
        expect(sessionStore.getState().credentials).toBeUndefined()
      })
    })

    it('clears role when credentials are cleared', async () => {
      sessionStore.getState().setCredentials({ username: 'admin', password: 'secret' })
      sessionStore.getState().setRole('admin')

      const user = userEvent.setup()
      renderWithProviders(<AuthSettingsPanel />)

      await user.click(screen.getByRole('button', { name: /clear credentials/i }))

      await waitFor(() => {
        expect(sessionStore.getState().role).toBeUndefined()
      })
    })

    it('shows info toast after clearing credentials', async () => {
      sessionStore.getState().setCredentials({ username: 'admin', password: 'secret' })

      const toastSpy = vi.fn()
      const unsubscribe = toastBus.subscribe(toastSpy)

      const user = userEvent.setup()
      renderWithProviders(<AuthSettingsPanel />)

      await user.click(screen.getByRole('button', { name: /clear credentials/i }))

      await waitFor(() => {
        expect(toastSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            intent: 'info',
            title: expect.stringMatching(/credentials cleared/i) as unknown,
          }),
        )
      })

      unsubscribe()
    })

    it('hides clear button after credentials are cleared', async () => {
      sessionStore.getState().setCredentials({ username: 'admin', password: 'secret' })

      const user = userEvent.setup()
      renderWithProviders(<AuthSettingsPanel />)

      await user.click(screen.getByRole('button', { name: /clear credentials/i }))

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /clear credentials/i })).not.toBeInTheDocument()
      })
    })
  })

  describe('Test Connection', () => {
    it('calls checkConnection when test connection is clicked', async () => {
      sessionStore.getState().setCredentials({ username: 'admin', password: 'secret' })

      const user = userEvent.setup()
      renderWithProviders(<AuthSettingsPanel />)

      await user.click(screen.getByRole('button', { name: /test connection/i }))

      expect(mockCheckConnection).toHaveBeenCalled()
    })

    it('disables test button when no credentials exist', () => {
      renderWithProviders(<AuthSettingsPanel />)

      const testButton = screen.getByRole('button', { name: /test connection/i })
      expect(testButton).toBeDisabled()
    })

    it('enables test button when credentials exist', () => {
      sessionStore.getState().setCredentials({ username: 'admin', password: 'secret' })
      renderWithProviders(<AuthSettingsPanel />)

      const testButton = screen.getByRole('button', { name: /test connection/i })
      expect(testButton).not.toBeDisabled()
    })
  })

  describe('Credential Status Display', () => {
    it('shows "No credentials configured" when store is empty', () => {
      renderWithProviders(<AuthSettingsPanel />)

      expect(screen.getByText(/no credentials configured/i)).toBeInTheDocument()
    })

    it('shows username when credentials exist', () => {
      sessionStore.getState().setCredentials({ username: 'coffeelover', password: 'secret' })
      renderWithProviders(<AuthSettingsPanel />)

      expect(screen.getByText(/coffeelover/i)).toBeInTheDocument()
    })

    it('shows role badge when role is set', () => {
      sessionStore.getState().setCredentials({ username: 'testuser', password: 'secret' })
      sessionStore.getState().setRole('admin')
      renderWithProviders(<AuthSettingsPanel />)

      // Check for role badge with specific class
      const roleBadge = screen.getByText('admin')
      expect(roleBadge).toHaveClass('auth-role-badge')
    })

    it('shows validated timestamp when credentials are validated', () => {
      sessionStore.getState().setCredentials({ username: 'admin', password: 'secret' })
      sessionStore.getState().markValidated()
      renderWithProviders(<AuthSettingsPanel />)

      expect(screen.getByText(/validated/i)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has accessible labels for all form fields', () => {
      renderWithProviders(<AuthSettingsPanel />)

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    })

    it('has aria-describedby for password guidance', () => {
      renderWithProviders(<AuthSettingsPanel />)

      const passwordField = screen.getByLabelText(/password/i)
      expect(passwordField).toHaveAttribute('aria-describedby')
    })

    it('has appropriate button states for screen readers', () => {
      renderWithProviders(<AuthSettingsPanel />)

      // Save button should be disabled when form is empty
      const saveButton = screen.getByRole('button', { name: /save credentials/i })
      expect(saveButton).toBeDisabled()

      // Test button should be disabled when no credentials
      const testButton = screen.getByRole('button', { name: /test connection/i })
      expect(testButton).toBeDisabled()
    })
  })
})
