/**
 * T049: ErrorBoundary Component
 * Catches React errors and displays a user-friendly fallback with correlation ID support
 */
import { Component, type ReactNode, type ErrorInfo } from 'react'
import { getCorrelationId } from '@services/api/httpClient'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  correlationId: string | null
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      correlationId: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      correlationId: getCorrelationId(),
    }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      errorInfo,
    })

    // Could send to error tracking service here
    // e.g., Sentry, LogRocket, etc.
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      correlationId: null,
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <ErrorFallback
          error={this.state.error}
          correlationId={this.state.correlationId}
          componentStack={this.state.errorInfo?.componentStack ?? undefined}
          onReset={this.handleReset}
          onReload={this.handleReload}
        />
      )
    }

    return this.props.children
  }
}

interface ErrorFallbackProps {
  error: Error | null
  correlationId: string | null
  componentStack?: string
  onReset: () => void
  onReload: () => void
}

const ErrorFallback = ({
  error,
  correlationId,
  componentStack,
  onReset,
  onReload,
}: ErrorFallbackProps) => {
  const showDetails = import.meta.env.DEV

  return (
    <div className="error-boundary" role="alert" aria-live="assertive">
      <div className="error-boundary__content">
        <div className="error-boundary__icon" aria-hidden="true">
          ☕
        </div>
        
        <h1 className="error-boundary__title">Something went wrong</h1>
        
        <p className="error-boundary__message">
          We've encountered an unexpected error. Please try again or contact support if the problem persists.
        </p>

        {correlationId && (
          <div className="error-boundary__correlation">
            <span className="error-boundary__correlation-label">Correlation ID:</span>
            <code className="error-boundary__correlation-id">{correlationId}</code>
            <button
              className="error-boundary__copy-btn"
              onClick={() => navigator.clipboard.writeText(correlationId)}
              aria-label="Copy correlation ID"
            >
              Copy
            </button>
          </div>
        )}

        <div className="error-boundary__actions">
          <button
            className="btn btn--primary"
            onClick={onReset}
          >
            Try Again
          </button>
          <button
            className="btn btn--outline"
            onClick={onReload}
          >
            Reload Page
          </button>
        </div>

        {showDetails && error && (
          <details className="error-boundary__details">
            <summary>Error Details (Development Only)</summary>
            <div className="error-boundary__stack">
              <strong>Error:</strong>
              <pre>{error.message}</pre>
              {error.stack && (
                <>
                  <strong>Stack Trace:</strong>
                  <pre>{error.stack}</pre>
                </>
              )}
              {componentStack && (
                <>
                  <strong>Component Stack:</strong>
                  <pre>{componentStack}</pre>
                </>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  )
}

export default ErrorBoundary
