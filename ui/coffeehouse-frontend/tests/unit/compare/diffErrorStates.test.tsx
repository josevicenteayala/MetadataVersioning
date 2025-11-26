/**
 * T056 [US4] - Vitest spec for DiffErrorState component
 * Tests error handling for mismatched JSON structures and error fallbacks
 */
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DiffErrorState, DiffErrorBoundary } from '@features/compare/components/DiffErrorState'
import type { VersionDiffError } from '@features/compare/api/useVersionDiff'
import { renderWithProviders } from '@tests/utils/renderWithProviders'

describe('DiffErrorState', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('error display', () => {
    it('renders error alert with title and description', () => {
      const error: VersionDiffError = {
        code: 'NETWORK_ERROR',
        message: 'Unable to fetch version data',
      }

      renderWithProviders(<DiffErrorState error={error} />)

      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(/network error/i)).toBeInTheDocument()
    })

    it('shows PAYLOAD_TOO_LARGE error with size details', () => {
      const error: VersionDiffError = {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Payload exceeds limit',
        details: {
          leftPayloadSize: 250000,
          rightPayloadSize: 180000,
          maxSize: 204800,
        },
      }

      renderWithProviders(<DiffErrorState error={error} />)

      expect(screen.getByText(/payload too large/i)).toBeInTheDocument()
      expect(screen.getByText(/244.1 KB/)).toBeInTheDocument() // Left payload
      expect(screen.getByText(/175.8 KB/)).toBeInTheDocument() // Right payload
      expect(screen.getByText(/200.0 KB/)).toBeInTheDocument() // Max size
    })

    it('shows VERSION_NOT_FOUND error with guidance', () => {
      const error: VersionDiffError = {
        code: 'VERSION_NOT_FOUND',
        message: 'Version not found',
      }

      renderWithProviders(<DiffErrorState error={error} />)

      expect(screen.getAllByText(/version not found/i).length).toBeGreaterThan(0)
      expect(screen.getByText(/may have been deleted/i)).toBeInTheDocument()
    })

    it('shows INCOMPATIBLE_SCHEMA error with guidance', () => {
      const error: VersionDiffError = {
        code: 'INCOMPATIBLE_SCHEMA',
        message: 'Schema mismatch',
      }

      renderWithProviders(<DiffErrorState error={error} />)

      expect(screen.getByText(/incompatible schemas/i)).toBeInTheDocument()
      expect(screen.getByText(/significantly different schemas/i)).toBeInTheDocument()
    })

    it('shows UNKNOWN error with generic message', () => {
      const error: VersionDiffError = {
        code: 'UNKNOWN',
        message: 'Something unexpected happened',
      }

      renderWithProviders(<DiffErrorState error={error} />)

      expect(screen.getAllByText(/unexpected error/i).length).toBeGreaterThan(0)
    })
  })

  describe('retry functionality', () => {
    it('shows retry button for retryable errors', () => {
      const error: VersionDiffError = {
        code: 'NETWORK_ERROR',
        message: 'Network failed',
      }
      const onRetry = vi.fn()

      renderWithProviders(<DiffErrorState error={error} onRetry={onRetry} />)

      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })

    it('calls onRetry when retry button clicked', async () => {
      const error: VersionDiffError = {
        code: 'NETWORK_ERROR',
        message: 'Network failed',
      }
      const onRetry = vi.fn()

      renderWithProviders(<DiffErrorState error={error} onRetry={onRetry} />)

      await user.click(screen.getByRole('button', { name: /retry/i }))

      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it('does not show retry for non-retryable errors', () => {
      const error: VersionDiffError = {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Too large',
      }
      const onRetry = vi.fn()

      renderWithProviders(<DiffErrorState error={error} onRetry={onRetry} />)

      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument()
    })
  })

  describe('dismiss functionality', () => {
    it('shows dismiss button when onDismiss provided', () => {
      const error: VersionDiffError = {
        code: 'NETWORK_ERROR',
        message: 'Error',
      }
      const onDismiss = vi.fn()

      renderWithProviders(<DiffErrorState error={error} onDismiss={onDismiss} />)

      expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument()
    })

    it('calls onDismiss when dismiss button clicked', async () => {
      const error: VersionDiffError = {
        code: 'NETWORK_ERROR',
        message: 'Error',
      }
      const onDismiss = vi.fn()

      renderWithProviders(<DiffErrorState error={error} onDismiss={onDismiss} />)

      await user.click(screen.getByRole('button', { name: /dismiss/i }))

      expect(onDismiss).toHaveBeenCalledTimes(1)
    })
  })

  describe('technical details', () => {
    it('shows technical details expandable when message differs from description', () => {
      const error: VersionDiffError = {
        code: 'UNKNOWN',
        message: 'Detailed stack trace: Error at line 42',
      }

      renderWithProviders(<DiffErrorState error={error} />)

      expect(screen.getByText(/technical details/i)).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has role alert', () => {
      const error: VersionDiffError = {
        code: 'NETWORK_ERROR',
        message: 'Error',
      }

      renderWithProviders(<DiffErrorState error={error} />)

      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('has aria-live polite for screen readers', () => {
      const error: VersionDiffError = {
        code: 'NETWORK_ERROR',
        message: 'Error',
      }

      renderWithProviders(<DiffErrorState error={error} />)

      const alert = screen.getByRole('alert')
      expect(alert).toHaveAttribute('aria-live', 'polite')
    })

    it('has proper button labels', () => {
      const error: VersionDiffError = {
        code: 'NETWORK_ERROR',
        message: 'Error',
      }

      renderWithProviders(<DiffErrorState error={error} onRetry={vi.fn()} onDismiss={vi.fn()} />)

      expect(screen.getByLabelText(/retry diff computation/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/dismiss error/i)).toBeInTheDocument()
    })
  })

  describe('CSS classes', () => {
    it('applies error code as class modifier', () => {
      const error: VersionDiffError = {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Too large',
      }

      renderWithProviders(<DiffErrorState error={error} />)

      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('diff-error-state--payload_too_large')
    })

    it('applies custom className', () => {
      const error: VersionDiffError = {
        code: 'UNKNOWN',
        message: 'Error',
      }

      renderWithProviders(<DiffErrorState error={error} className="custom-error" />)

      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('custom-error')
    })
  })
})

describe('DiffErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Suppress console.error for error boundary tests
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('renders children when no error', () => {
    renderWithProviders(
      <DiffErrorBoundary>
        <div data-testid="child">Content</div>
      </DiffErrorBoundary>,
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('renders custom fallback when provided and error occurs', () => {
    const ThrowingComponent = () => {
      throw new Error('Test error')
    }

    renderWithProviders(
      <DiffErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowingComponent />
      </DiffErrorBoundary>,
    )

    expect(screen.getByText('Custom fallback')).toBeInTheDocument()
  })

  it('renders DiffErrorState when no fallback and error occurs', () => {
    const ThrowingComponent = () => {
      throw new Error('Test error')
    }

    renderWithProviders(
      <DiffErrorBoundary>
        <ThrowingComponent />
      </DiffErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getAllByText(/unexpected error/i).length).toBeGreaterThan(0)
  })

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn()
    const ThrowingComponent = () => {
      throw new Error('Test error')
    }

    renderWithProviders(
      <DiffErrorBoundary onError={onError}>
        <ThrowingComponent />
      </DiffErrorBoundary>,
    )

    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith(expect.any(Error))
  })
})
