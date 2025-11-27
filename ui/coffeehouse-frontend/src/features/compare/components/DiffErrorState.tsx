/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
/**
 * T059: DiffErrorState Component
 * Error boundary / fallback component for mismatched payloads and diff errors
 */

import React from 'react'
import type { VersionDiffError } from '../api/useVersionDiff'

export interface DiffErrorStateProps {
  /** Error from diff computation */
  error: VersionDiffError
  /** Callback to retry diff computation */
  onRetry?: () => void
  /** Callback to dismiss error */
  onDismiss?: () => void
  /** Custom class name */
  className?: string
}

/**
 * Error message and guidance based on error code
 */
const ERROR_CONTENT: Record<
  VersionDiffError['code'],
  {
    title: string
    description: string
    guidance: string
    icon: string
    canRetry: boolean
  }
> = {
  PAYLOAD_TOO_LARGE: {
    title: 'Payload Too Large',
    description: 'One or both versions exceed the 200KB limit for diff visualization.',
    guidance:
      'Consider comparing versions with smaller payloads, or export the versions to compare locally.',
    icon: '📦',
    canRetry: false,
  },
  VERSION_NOT_FOUND: {
    title: 'Version Not Found',
    description: 'One or both of the selected versions could not be found.',
    guidance: 'The version may have been deleted. Please select different versions to compare.',
    icon: '🔍',
    canRetry: false,
  },
  INCOMPATIBLE_SCHEMA: {
    title: 'Incompatible Schemas',
    description:
      'The selected versions have incompatible JSON structures that cannot be meaningfully compared.',
    guidance:
      'This may occur when versions have significantly different schemas. Consider comparing versions closer together in the version history.',
    icon: '⚠️',
    canRetry: false,
  },
  NETWORK_ERROR: {
    title: 'Network Error',
    description: 'Unable to fetch version data due to a network issue.',
    guidance: 'Check your internet connection and try again.',
    icon: '🌐',
    canRetry: true,
  },
  UNKNOWN: {
    title: 'Unexpected Error',
    description: 'An unexpected error occurred while computing the diff.',
    guidance: 'Please try again. If the problem persists, contact support.',
    icon: '❓',
    canRetry: true,
  },
}

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

/**
 * DiffErrorState - Error display component for diff failures
 */
export const DiffErrorState: React.FC<DiffErrorStateProps> = ({
  error,
  onRetry,
  onDismiss,
  className = '',
}) => {
  const content = ERROR_CONTENT[error.code] ?? ERROR_CONTENT.UNKNOWN

  return (
    <div
      className={`diff-error-state diff-error-state--${error.code.toLowerCase()} ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="diff-error-state__icon" aria-hidden="true">
        {content.icon}
      </div>

      <div className="diff-error-state__content">
        <h3 className="diff-error-state__title">{content.title}</h3>
        <p className="diff-error-state__description">{content.description}</p>

        {/* Show size details for PAYLOAD_TOO_LARGE */}
        {error.code === 'PAYLOAD_TOO_LARGE' && error.details && (
          <dl className="diff-error-state__details">
            {error.details.leftPayloadSize !== undefined && (
              <>
                <dt>Left payload:</dt>
                <dd
                  className={
                    error.details.leftPayloadSize > (error.details.maxSize ?? 0)
                      ? 'diff-error-state__over-limit'
                      : ''
                  }
                >
                  {formatBytes(error.details.leftPayloadSize)}
                </dd>
              </>
            )}
            {error.details.rightPayloadSize !== undefined && (
              <>
                <dt>Right payload:</dt>
                <dd
                  className={
                    error.details.rightPayloadSize > (error.details.maxSize ?? 0)
                      ? 'diff-error-state__over-limit'
                      : ''
                  }
                >
                  {formatBytes(error.details.rightPayloadSize)}
                </dd>
              </>
            )}
            {error.details.maxSize !== undefined && (
              <>
                <dt>Maximum allowed:</dt>
                <dd>{formatBytes(error.details.maxSize)}</dd>
              </>
            )}
          </dl>
        )}

        <p className="diff-error-state__guidance">{content.guidance}</p>

        {/* Raw error message for debugging */}
        {error.message && error.message !== content.description && (
          <details className="diff-error-state__raw">
            <summary>Technical details</summary>
            <pre>{error.message}</pre>
          </details>
        )}
      </div>

      <div className="diff-error-state__actions">
        {content.canRetry && onRetry && (
          <button
            className="diff-error-btn diff-error-btn--retry"
            onClick={onRetry}
            aria-label="Retry diff computation"
          >
            Retry
          </button>
        )}
        {onDismiss && (
          <button
            className="diff-error-btn diff-error-btn--dismiss"
            onClick={onDismiss}
            aria-label="Dismiss error"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Error boundary specifically for diff-related errors
 */
interface DiffErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error) => void
}

interface DiffErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class DiffErrorBoundary extends React.Component<
  DiffErrorBoundaryProps,
  DiffErrorBoundaryState
> {
  constructor(props: DiffErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): DiffErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('DiffErrorBoundary caught error:', error, errorInfo)
    this.props.onError?.(error)
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const diffError: VersionDiffError = {
        code: 'UNKNOWN',
        message: this.state.error?.message || 'An unexpected error occurred',
      }

      return <DiffErrorState error={diffError} onRetry={this.handleRetry} />
    }

    return this.props.children
  }
}

export default DiffErrorState
