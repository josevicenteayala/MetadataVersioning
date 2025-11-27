/**
 * T043 [US5]: AuthSettingsPanel component
 * Provides credential entry, test connection, and session management
 */
import { useState, useCallback, useId, type FormEvent } from 'react'
import { useSessionStore, type SessionCredentials } from '../../../services/auth/sessionStore'
import { useAuthCheck } from '../api/useAuthCheck'
import { emitToast } from '../../../services/feedback/toastBus'

interface FormErrors {
  username?: string
  password?: string
}

export const AuthSettingsPanel = () => {
  const descriptionId = useId()
  const usernameErrorId = useId()
  const passwordErrorId = useId()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  const credentials = useSessionStore((state) => state.credentials)
  const role = useSessionStore((state) => state.role)
  const validatedAt = useSessionStore((state) => state.validatedAt)
  const setCredentials = useSessionStore((state) => state.setCredentials)
  const clearCredentials = useSessionStore((state) => state.clearCredentials)

  const { checkConnection, isChecking } = useAuthCheck()

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {}

    const trimmedUsername = username.trim()
    const trimmedPassword = password.trim()

    if (!trimmedUsername) {
      newErrors.username = 'Username is required'
    }

    if (!trimmedPassword) {
      newErrors.password = 'Password is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [username, password])

  const isFormValid = username.trim().length > 0 && password.trim().length > 0

  const handleSave = useCallback(
    (e: FormEvent) => {
      e.preventDefault()

      if (!validateForm()) {
        return
      }

      const newCredentials: SessionCredentials = {
        username: username.trim(),
        password: password.trim(),
      }

      setCredentials(newCredentials)
      setPassword('') // Clear password field for security
      setErrors({})

      emitToast({
        title: 'Credentials Saved',
        message: 'Credentials stored in session memory',
        intent: 'success',
      })
    },
    [username, password, validateForm, setCredentials],
  )

  const handleClear = useCallback(() => {
    clearCredentials()
    setUsername('')
    setPassword('')
    setErrors({})

    emitToast({
      title: 'Credentials Cleared',
      message: 'Session credentials have been removed',
      intent: 'info',
    })
  }, [clearCredentials])

  const handleTestConnection = useCallback(() => {
    checkConnection()
  }, [checkConnection])

  const formatValidatedAt = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString()
    } catch {
      return isoString
    }
  }

  return (
    <div className="auth-settings-panel">
      <div className="auth-settings-header">
        <h2 className="auth-settings-title">Authentication</h2>
        <p className="auth-settings-description" id={descriptionId}>
          Credentials are stored in session memory only and will be cleared when you close the
          browser or on unauthorized responses.
        </p>
      </div>

      {/* Credential Status */}
      <div className="auth-status-section">
        <h3 className="auth-status-title">Current Status</h3>
        {credentials ? (
          <div className="auth-status-active">
            <div className="auth-status-row">
              <span className="auth-status-label">Username:</span>
              <span className="auth-status-value">{credentials.username}</span>
            </div>
            {role && (
              <div className="auth-status-row">
                <span className="auth-status-label">Role:</span>
                <span className={`auth-role-badge auth-role-${role}`}>{role}</span>
              </div>
            )}
            {validatedAt && (
              <div className="auth-status-row">
                <span className="auth-status-label">Validated:</span>
                <span className="auth-status-value">{formatValidatedAt(validatedAt)}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="auth-status-empty">No credentials configured</p>
        )}
      </div>

      {/* Credential Form */}
      <form className="auth-form" onSubmit={handleSave}>
        <div className="auth-form-field">
          <label htmlFor="auth-username" className="auth-label">
            Username
          </label>
          <input
            id="auth-username"
            type="text"
            className={`auth-input ${errors.username ? 'auth-input-error' : ''}`}
            value={username}
            onChange={(e) => {
              setUsername(e.target.value)
              if (errors.username) {
                setErrors((prev) => {
                  const newErrors = { ...prev }
                  delete newErrors.username
                  return newErrors
                })
              }
            }}
            placeholder="Enter username"
            autoComplete="username"
            aria-invalid={!!errors.username}
            aria-describedby={errors.username ? usernameErrorId : undefined}
          />
          {errors.username && (
            <span id={usernameErrorId} className="auth-error-message" role="alert">
              {errors.username}
            </span>
          )}
        </div>

        <div className="auth-form-field">
          <label htmlFor="auth-password" className="auth-label">
            Password
          </label>
          <input
            id="auth-password"
            type="password"
            className={`auth-input ${errors.password ? 'auth-input-error' : ''}`}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (errors.password) {
                setErrors((prev) => {
                  const newErrors = { ...prev }
                  delete newErrors.password
                  return newErrors
                })
              }
            }}
            placeholder="Enter password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            aria-describedby={`${descriptionId}${errors.password ? ` ${passwordErrorId}` : ''}`}
          />
          {errors.password && (
            <span id={passwordErrorId} className="auth-error-message" role="alert">
              {errors.password}
            </span>
          )}
        </div>

        <div className="auth-form-actions">
          <button type="submit" className="auth-button auth-button-primary" disabled={!isFormValid}>
            Save Credentials
          </button>

          <button
            type="button"
            className="auth-button auth-button-secondary"
            onClick={handleTestConnection}
            disabled={!credentials || isChecking}
          >
            {isChecking ? 'Testing...' : 'Test Connection'}
          </button>

          {credentials && (
            <button type="button" className="auth-button auth-button-danger" onClick={handleClear}>
              Clear Credentials
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
