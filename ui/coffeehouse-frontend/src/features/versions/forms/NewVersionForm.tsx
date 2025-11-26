import { useCallback, useId, useRef, useState } from 'react'
import { useCreateVersion } from '../api/useCreateVersion'
import type { CreateVersionResponse } from '../api/useCreateVersion'

export interface NewVersionFormProps {
  documentId: string
  onSuccess?: (version: CreateVersionResponse) => void
  onCancel?: () => void
}

interface FormErrors {
  payload?: string
  changeSummary?: string
}

const MAX_SUMMARY_LENGTH = 500

/**
 * Validates JSON string and returns parsed object or error message.
 */
const validateJsonPayload = (
  value: string,
): { valid: true; data: Record<string, unknown> } | { valid: false; error: string } => {
  if (!value.trim()) {
    return { valid: false, error: 'Payload is required' }
  }

  try {
    const parsed: unknown = JSON.parse(value)

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { valid: false, error: 'Payload must be a JSON object' }
    }

    return { valid: true, data: parsed as Record<string, unknown> }
  } catch {
    return { valid: false, error: 'Invalid JSON syntax' }
  }
}

const NewVersionForm = ({ documentId, onSuccess, onCancel }: NewVersionFormProps) => {
  const formId = useId()
  const payloadRef = useRef<HTMLTextAreaElement>(null)
  const summaryRef = useRef<HTMLTextAreaElement>(null)

  const [payload, setPayload] = useState('')
  const [changeSummary, setChangeSummary] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { mutateAsync, isPending, reset } = useCreateVersion({
    onSuccess: (version) => {
      onSuccess?.(version)
    },
    onError: (error) => {
      setSubmitError(error.message)
    },
  })

  const validatePayload = useCallback((value: string): string | undefined => {
    const result = validateJsonPayload(value)
    return result.valid ? undefined : result.error
  }, [])

  const validateSummary = useCallback((value: string): string | undefined => {
    if (!value.trim()) {
      return 'Summary is required'
    }
    if (value.length > MAX_SUMMARY_LENGTH) {
      return `Summary must be ${MAX_SUMMARY_LENGTH} characters or less`
    }
    return undefined
  }, [])

  const handlePayloadBlur = useCallback(() => {
    const error = validatePayload(payload)
    setErrors((prev) => ({ ...prev, payload: error }))
  }, [payload, validatePayload])

  const handleSummaryBlur = useCallback(() => {
    const error = validateSummary(changeSummary)
    setErrors((prev) => ({ ...prev, changeSummary: error }))
  }, [changeSummary, validateSummary])

  const handlePayloadChange = useCallback((value: string) => {
    setPayload(value)
    // Clear error when user starts typing
    if (errors.payload) {
      setErrors((prev) => ({ ...prev, payload: undefined }))
    }
  }, [errors.payload])

  const handleSummaryChange = useCallback((value: string) => {
    setChangeSummary(value)
    if (errors.changeSummary && value.length <= MAX_SUMMARY_LENGTH) {
      setErrors((prev) => ({ ...prev, changeSummary: undefined }))
    } else if (value.length > MAX_SUMMARY_LENGTH) {
      setErrors((prev) => ({
        ...prev,
        changeSummary: `Summary must be ${MAX_SUMMARY_LENGTH} characters or less`,
      }))
    }
  }, [errors.changeSummary])

  const handleFormatJson = useCallback(() => {
    const result = validateJsonPayload(payload)
    if (result.valid) {
      setPayload(JSON.stringify(result.data, null, 2))
    }
  }, [payload])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setSubmitError(null)
      reset()

      // Validate all fields
      const payloadError = validatePayload(payload)
      const summaryError = validateSummary(changeSummary)

      const newErrors: FormErrors = {
        payload: payloadError,
        changeSummary: summaryError,
      }

      setErrors(newErrors)

      // Focus first error field
      if (payloadError) {
        payloadRef.current?.focus()
        return
      }
      if (summaryError) {
        summaryRef.current?.focus()
        return
      }

      // Parse payload (we know it's valid at this point)
      const result = validateJsonPayload(payload)
      if (!result.valid) return

      try {
        await mutateAsync({
          documentId,
          payload: result.data,
          changeSummary: changeSummary.trim(),
        })
      } catch {
        // Error handling done in mutation onError
      }
    },
    [documentId, payload, changeSummary, validatePayload, validateSummary, mutateAsync, reset],
  )

  const handleCancel = useCallback(() => {
    onCancel?.()
  }, [onCancel])

  const payloadErrorId = `${formId}-payload-error`
  const summaryErrorId = `${formId}-summary-error`

  return (
    <form className="new-version-form" onSubmit={handleSubmit}>
      <header className="new-version-form__header">
        <h3 id={`${formId}-title`}>Create New Version</h3>
      </header>

      {submitError && (
        <div role="alert" className="new-version-form__error-banner">
          {submitError}
        </div>
      )}

      <div className="new-version-form__field">
        <div className="new-version-form__label-row">
          <label htmlFor={`${formId}-payload`}>JSON Payload</label>
          <button
            type="button"
            className="new-version-form__format-btn"
            onClick={handleFormatJson}
            disabled={isPending || !payload.trim()}
            aria-label="Format JSON"
          >
            Format JSON
          </button>
        </div>
        <textarea
          ref={payloadRef}
          id={`${formId}-payload`}
          className={`new-version-form__textarea new-version-form__textarea--code ${errors.payload ? 'new-version-form__textarea--error' : ''}`}
          value={payload}
          onChange={(e) => handlePayloadChange(e.target.value)}
          onBlur={handlePayloadBlur}
          disabled={isPending}
          rows={10}
          placeholder='{"key": "value"}'
          aria-invalid={Boolean(errors.payload)}
          aria-describedby={errors.payload ? payloadErrorId : undefined}
        />
        {errors.payload && (
          <p id={payloadErrorId} className="new-version-form__error" role="alert">
            {errors.payload}
          </p>
        )}
      </div>

      <div className="new-version-form__field">
        <div className="new-version-form__label-row">
          <label htmlFor={`${formId}-summary`}>Change Summary</label>
          <span
            className={`new-version-form__char-count ${changeSummary.length > MAX_SUMMARY_LENGTH ? 'new-version-form__char-count--error' : ''}`}
          >
            {changeSummary.length} / {MAX_SUMMARY_LENGTH}
          </span>
        </div>
        <textarea
          ref={summaryRef}
          id={`${formId}-summary`}
          className={`new-version-form__textarea ${errors.changeSummary ? 'new-version-form__textarea--error' : ''}`}
          value={changeSummary}
          onChange={(e) => handleSummaryChange(e.target.value)}
          onBlur={handleSummaryBlur}
          disabled={isPending}
          rows={3}
          placeholder="Describe what changed in this version..."
          aria-invalid={Boolean(errors.changeSummary)}
          aria-describedby={errors.changeSummary ? summaryErrorId : undefined}
        />
        {errors.changeSummary && (
          <p id={summaryErrorId} className="new-version-form__error" role="alert">
            {errors.changeSummary}
          </p>
        )}
      </div>

      <footer className="new-version-form__footer">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={handleCancel}
          disabled={isPending}
        >
          Cancel
        </button>
        <button type="submit" className="btn btn--primary" disabled={isPending}>
          {isPending ? 'Creating…' : 'Create Draft'}
        </button>
      </footer>
    </form>
  )
}

export default NewVersionForm
