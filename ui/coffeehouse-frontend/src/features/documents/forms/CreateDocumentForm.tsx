import { useCallback, useId, useState } from 'react'
import {
  useCreateDocument,
  type CreateDocumentResponse,
} from '@features/documents/api/useCreateDocument'
import {
  validateDocumentType,
  validateDocumentName,
  validateJsonPayload,
  validateChangeSummary,
} from '@features/documents/utils/kebabCaseValidator'
import { mapApiErrorToFormError } from '@features/documents/utils/apiErrorMapper'
import { JsonPayloadEditor } from '@features/documents/components/JsonPayloadEditor'

export interface CreateDocumentFormProps {
  /** Callback when document is created successfully */
  onSuccess?: (document: CreateDocumentResponse) => void
  /** Callback when user cancels */
  onCancel?: () => void
}

interface FormState {
  type: string
  name: string
  payload: string
  changeSummary: string
}

interface FormErrors {
  type?: string
  name?: string
  payload?: string
  changeSummary?: string
  general?: string
}

interface TouchedFields {
  type: boolean
  name: boolean
  payload: boolean
  changeSummary: boolean
}

const initialFormState: FormState = {
  type: '',
  name: '',
  payload: '',
  changeSummary: '',
}

const initialTouched: TouchedFields = {
  type: false,
  name: false,
  payload: false,
  changeSummary: false,
}

/**
 * Form component for creating a new metadata document.
 *
 * Features:
 * - Kebab-case validation for type and name fields
 * - JSON syntax validation for payload
 * - Submit button disabled until form is valid
 * - Loading state during submission
 * - Inline error display for API errors
 * - Form data preservation on errors
 *
 * @example
 * ```tsx
 * <CreateDocumentForm
 *   onSuccess={(doc) => navigate(`/documents/${doc.type}/${doc.name}`)}
 *   onCancel={() => closeModal()}
 * />
 * ```
 */
export const CreateDocumentForm = ({ onSuccess, onCancel }: CreateDocumentFormProps) => {
  const formId = useId()

  const [formState, setFormState] = useState<FormState>(initialFormState)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<TouchedFields>(initialTouched)

  const { mutateAsync, isPending, reset } = useCreateDocument({
    onSuccess: (document) => {
      onSuccess?.(document)
    },
    onError: (error) => {
      const mapped = mapApiErrorToFormError(error)

      // Set field-specific errors
      const newErrors: FormErrors = {}
      for (const fieldError of mapped.fieldErrors) {
        newErrors[fieldError.field as keyof FormErrors] = fieldError.message
      }

      // Set general error if no field-specific errors
      if (mapped.fieldErrors.length === 0) {
        newErrors.general = mapped.message
      }

      setErrors(newErrors)
    },
  })

  // Validate a single field
  const validateField = useCallback((field: keyof FormState, value: string): string | undefined => {
    switch (field) {
      case 'type': {
        const result = validateDocumentType(value)
        return result.valid ? undefined : result.error
      }
      case 'name': {
        const result = validateDocumentName(value)
        return result.valid ? undefined : result.error
      }
      case 'payload': {
        const result = validateJsonPayload(value)
        return result.valid ? undefined : result.error
      }
      case 'changeSummary': {
        const result = validateChangeSummary(value)
        return result.valid ? undefined : result.error
      }
      default:
        return undefined
    }
  }, [])

  // Check if form is valid for submission
  const isFormValid = useCallback((): boolean => {
    const typeError = validateField('type', formState.type)
    const nameError = validateField('name', formState.name)
    const payloadError = validateField('payload', formState.payload)
    const summaryError = validateField('changeSummary', formState.changeSummary)

    return !typeError && !nameError && !payloadError && !summaryError
  }, [formState, validateField])

  // Handle field change
  const handleChange = useCallback(
    (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value
      setFormState((prev) => ({ ...prev, [field]: value }))

      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors[field]
          return newErrors
        })
      }

      // Clear general error on any change
      if (errors.general) {
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors.general
          return newErrors
        })
        reset()
      }
    },
    [errors, reset],
  )

  // Handle JSON payload change (separate handler for JsonPayloadEditor)
  const handlePayloadChange = useCallback(
    (value: string) => {
      setFormState((prev) => ({ ...prev, payload: value }))

      if (errors.payload) {
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors.payload
          return newErrors
        })
      }

      if (errors.general) {
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors.general
          return newErrors
        })
        reset()
      }
    },
    [errors, reset],
  )

  // Handle field blur (validation)
  const handleBlur = useCallback(
    (field: keyof FormState) => () => {
      setTouched((prev) => ({ ...prev, [field]: true }))

      const error = validateField(field, formState[field])
      if (error) {
        setErrors((prev) => ({ ...prev, [field]: error }))
      }
    },
    [formState, validateField],
  )

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      // Mark all fields as touched
      setTouched({
        type: true,
        name: true,
        payload: true,
        changeSummary: true,
      })

      // Validate all fields
      const typeError = validateField('type', formState.type)
      const nameError = validateField('name', formState.name)
      const payloadError = validateField('payload', formState.payload)
      const summaryError = validateField('changeSummary', formState.changeSummary)

      if (typeError || nameError || payloadError || summaryError) {
        setErrors({
          ...(typeError && { type: typeError }),
          ...(nameError && { name: nameError }),
          ...(payloadError && { payload: payloadError }),
          ...(summaryError && { changeSummary: summaryError }),
        })
        return
      }

      // Parse payload JSON
      let content: Record<string, unknown>
      try {
        const parsed: unknown = JSON.parse(formState.payload)
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
          content = parsed as Record<string, unknown>
        } else {
          setErrors((prev) => ({ ...prev, payload: 'Invalid JSON: must be an object' }))
          return
        }
      } catch {
        setErrors((prev) => ({ ...prev, payload: 'Invalid JSON syntax' }))
        return
      }

      // Submit
      try {
        await mutateAsync({
          type: formState.type.trim(),
          name: formState.name.trim(),
          content,
          ...(formState.changeSummary.trim() && { changeSummary: formState.changeSummary.trim() }),
        })
      } catch {
        // Error is handled by onError callback
      }
    },
    [formState, validateField, mutateAsync],
  )

  const canSubmit = isFormValid() && !isPending

  return (
    <form
      onSubmit={handleSubmit}
      className="create-document-form"
      aria-labelledby={`${formId}-title`}
    >
      <h2 id={`${formId}-title`} className="create-document-form__title">
        Create New Document
      </h2>

      <div className="create-document-form__info">
        <strong>Tip:</strong> This form is for brand-new type/name combinations. To change an existing
        document, open it and create a new version instead of creating another document.
      </div>

      {/* General error message */}
      {errors.general && (
        <div className="create-document-form__general-error" role="alert">
          {errors.general}
        </div>
      )}

      {/* Document Type Field */}
      <div className="create-document-form__field">
        <label htmlFor={`${formId}-type`} className="create-document-form__label">
          Document Type *
        </label>
        <input
          id={`${formId}-type`}
          type="text"
          value={formState.type}
          onChange={handleChange('type')}
          onBlur={handleBlur('type')}
          disabled={isPending}
          placeholder="loyalty-program"
          className={`create-document-form__input ${touched.type && errors.type ? 'create-document-form__input--error' : ''}`}
          aria-invalid={touched.type && !!errors.type}
          aria-describedby={errors.type ? `${formId}-type-error` : `${formId}-type-hint`}
          autoComplete="off"
        />
        {touched.type && errors.type ? (
          <div id={`${formId}-type-error`} className="create-document-form__error" role="alert">
            {errors.type}
          </div>
        ) : (
          <div id={`${formId}-type-hint`} className="create-document-form__hint">
            Lowercase letters separated by hyphens (e.g., loyalty-program)
          </div>
        )}
      </div>

      {/* Document Name Field */}
      <div className="create-document-form__field">
        <label htmlFor={`${formId}-name`} className="create-document-form__label">
          Document Name *
        </label>
        <input
          id={`${formId}-name`}
          type="text"
          value={formState.name}
          onChange={handleChange('name')}
          onBlur={handleBlur('name')}
          disabled={isPending}
          placeholder="spring-bonus-2025"
          className={`create-document-form__input ${touched.name && errors.name ? 'create-document-form__input--error' : ''}`}
          aria-invalid={touched.name && !!errors.name}
          aria-describedby={errors.name ? `${formId}-name-error` : `${formId}-name-hint`}
          autoComplete="off"
        />
        {touched.name && errors.name ? (
          <div id={`${formId}-name-error`} className="create-document-form__error" role="alert">
            {errors.name}
          </div>
        ) : (
          <div id={`${formId}-name-hint`} className="create-document-form__hint">
            Lowercase letters and numbers separated by hyphens
          </div>
        )}
      </div>

      {/* JSON Payload Field */}
      <div className="create-document-form__field">
        <JsonPayloadEditor
          value={formState.payload}
          onChange={handlePayloadChange}
          onBlur={handleBlur('payload')}
          {...(touched.payload && errors.payload && { error: errors.payload })}
          disabled={isPending}
          aria-label="JSON Payload"
        />
      </div>

      {/* Change Summary Field */}
      <div className="create-document-form__field">
        <label htmlFor={`${formId}-summary`} className="create-document-form__label">
          Change Summary
        </label>
        <input
          id={`${formId}-summary`}
          type="text"
          value={formState.changeSummary}
          onChange={handleChange('changeSummary')}
          onBlur={handleBlur('changeSummary')}
          disabled={isPending}
          placeholder="Initial version"
          maxLength={500}
          className={`create-document-form__input ${touched.changeSummary && errors.changeSummary ? 'create-document-form__input--error' : ''}`}
          aria-invalid={touched.changeSummary && !!errors.changeSummary}
          aria-describedby={
            errors.changeSummary ? `${formId}-summary-error` : `${formId}-summary-hint`
          }
          autoComplete="off"
        />
        {touched.changeSummary && errors.changeSummary ? (
          <div id={`${formId}-summary-error`} className="create-document-form__error" role="alert">
            {errors.changeSummary}
          </div>
        ) : (
          <div id={`${formId}-summary-hint`} className="create-document-form__hint">
            Optional description of this version (max 500 characters)
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="create-document-form__actions">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="create-document-form__button create-document-form__button--secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="create-document-form__button create-document-form__button--primary"
        >
          {isPending ? 'Creating...' : 'Create Document'}
        </button>
      </div>

      <style>{`
        .create-document-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-md, 1rem);
          padding: var(--space-lg, 1.5rem);
          max-width: 600px;
        }

        .create-document-form__title {
          margin: 0 0 var(--space-sm, 0.5rem) 0;
          font-size: var(--font-size-xl, 1.25rem);
          font-weight: 600;
          color: var(--color-text-primary, #1a1a1a);
        }

        .create-document-form__info {
          margin: 0;
          padding: var(--space-sm, 0.75rem);
          background: var(--color-bg-subtle, #f5f0eb);
          border: 1px solid var(--color-border, #e5e7eb);
          border-radius: var(--radius-md, 0.375rem);
          color: var(--color-text-secondary, #4b5563);
          line-height: 1.4;
        }

        .create-document-form__general-error {
          padding: var(--space-sm, 0.5rem) var(--space-md, 1rem);
          background: var(--color-error-bg, #fef2f2);
          border: 1px solid var(--color-error, #dc2626);
          border-radius: var(--radius-md, 0.375rem);
          color: var(--color-error, #dc2626);
          font-size: var(--font-size-sm, 0.875rem);
        }

        .create-document-form__field {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs, 0.25rem);
        }

        .create-document-form__label {
          font-weight: 500;
          color: var(--color-text-primary, #1a1a1a);
          font-size: var(--font-size-sm, 0.875rem);
        }

        .create-document-form__input {
          padding: var(--space-sm, 0.5rem) var(--space-md, 0.75rem);
          border: 1px solid var(--color-border, #d1d5db);
          border-radius: var(--radius-md, 0.375rem);
          font-size: var(--font-size-base, 1rem);
          color: var(--color-text-primary, #1a1a1a);
          background: var(--color-bg-input, #ffffff);
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .create-document-form__input:focus {
          outline: none;
          border-color: var(--color-primary, #6b4423);
          box-shadow: 0 0 0 2px var(--color-primary-light, rgba(107, 68, 35, 0.1));
        }

        .create-document-form__input--error {
          border-color: var(--color-error, #dc2626);
        }

        .create-document-form__input--error:focus {
          box-shadow: 0 0 0 2px var(--color-error-light, rgba(220, 38, 38, 0.1));
        }

        .create-document-form__input:disabled {
          background: var(--color-bg-disabled, #f3f4f6);
          cursor: not-allowed;
        }

        .create-document-form__input::placeholder {
          color: var(--color-text-placeholder, #9ca3af);
        }

        .create-document-form__error {
          color: var(--color-error, #dc2626);
          font-size: var(--font-size-sm, 0.875rem);
        }

        .create-document-form__hint {
          color: var(--color-text-muted, #6b7280);
          font-size: var(--font-size-xs, 0.75rem);
        }

        .create-document-form__actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--space-sm, 0.5rem);
          margin-top: var(--space-md, 1rem);
          padding-top: var(--space-md, 1rem);
          border-top: 1px solid var(--color-border, #e5e7eb);
        }

        .create-document-form__button {
          padding: var(--space-sm, 0.5rem) var(--space-lg, 1.5rem);
          border-radius: var(--radius-md, 0.375rem);
          font-size: var(--font-size-sm, 0.875rem);
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.15s ease, opacity 0.15s ease;
        }

        .create-document-form__button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .create-document-form__button--primary {
          background: var(--color-primary, #6b4423);
          color: var(--color-text-on-primary, #ffffff);
          border: none;
        }

        .create-document-form__button--primary:hover:not(:disabled) {
          background: var(--color-primary-dark, #5a3a1d);
        }

        .create-document-form__button--secondary {
          background: transparent;
          color: var(--color-text-secondary, #4b5563);
          border: 1px solid var(--color-border, #d1d5db);
        }

        .create-document-form__button--secondary:hover:not(:disabled) {
          background: var(--color-bg-hover, #f9fafb);
        }
      `}</style>
    </form>
  )
}

export default CreateDocumentForm
