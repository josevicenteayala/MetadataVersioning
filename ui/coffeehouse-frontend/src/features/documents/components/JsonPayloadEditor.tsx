import { useCallback, useId, useState } from 'react'
import { validateJsonPayload } from '@features/documents/utils/kebabCaseValidator'

export interface JsonPayloadEditorProps {
  /** Current value of the JSON payload */
  value: string
  /** Callback when value changes */
  onChange: (value: string) => void
  /** Callback when field loses focus (for validation) */
  onBlur?: () => void
  /** External error message to display */
  error?: string
  /** Whether the field is disabled */
  disabled?: boolean
  /** Placeholder text */
  placeholder?: string
  /** Aria label for accessibility */
  'aria-label'?: string
}

/**
 * JSON payload editor with syntax validation and line numbers.
 *
 * Features:
 * - Real-time JSON syntax validation on blur
 * - Line/character position for syntax errors
 * - Visual error highlighting
 * - Line numbers display
 * - Monospace font for code editing
 *
 * @example
 * ```tsx
 * <JsonPayloadEditor
 *   value={payload}
 *   onChange={setPayload}
 *   error={payloadError}
 * />
 * ```
 */
export const JsonPayloadEditor = ({
  value,
  onChange,
  onBlur,
  error: externalError,
  disabled = false,
  placeholder = '{\n  "key": "value"\n}',
  'aria-label': ariaLabel = 'JSON Payload',
}: JsonPayloadEditorProps) => {
  const id = useId()
  const errorId = `${id}-error`
  const [internalError, setInternalError] = useState<string | undefined>()

  // Use external error if provided, otherwise use internal validation error
  const displayError = externalError ?? internalError

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value
      onChange(newValue)

      // Clear internal error while typing (will revalidate on blur)
      if (internalError) {
        setInternalError(undefined)
      }
    },
    [onChange, internalError],
  )

  const handleBlur = useCallback(() => {
    // Only validate internally if there's content
    if (value.trim()) {
      const result = validateJsonPayload(value)
      if (!result.valid) {
        setInternalError(result.error)
      } else {
        setInternalError(undefined)
      }
    } else {
      setInternalError(undefined)
    }

    onBlur?.()
  }, [value, onBlur])

  // Calculate line count for line numbers
  const lineCount = value.split('\n').length
  const lineNumbers = Array.from({ length: Math.max(lineCount, 5) }, (_, i) => i + 1)

  return (
    <div className="json-payload-editor">
      <label htmlFor={id} className="json-payload-editor__label">
        JSON Payload *
      </label>

      <div
        className={`json-payload-editor__container ${displayError ? 'json-payload-editor__container--error' : ''}`}
      >
        {/* Line numbers */}
        <div className="json-payload-editor__line-numbers" aria-hidden="true">
          {lineNumbers.map((num) => (
            <div key={num} className="json-payload-editor__line-number">
              {num}
            </div>
          ))}
        </div>

        {/* Editor textarea */}
        <textarea
          id={id}
          className="json-payload-editor__textarea"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-invalid={!!displayError}
          aria-describedby={displayError ? errorId : undefined}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          rows={10}
        />
      </div>

      {/* Error message */}
      {displayError && (
        <div id={errorId} className="json-payload-editor__error" role="alert">
          <span className="json-payload-editor__error-icon" aria-hidden="true">
            ⚠️
          </span>
          {displayError}
        </div>
      )}

      {/* Help text */}
      {!displayError && (
        <div className="json-payload-editor__help">
          Enter valid JSON object. Arrays and primitives are not allowed.
        </div>
      )}

      <style>{`
        .json-payload-editor {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs, 0.25rem);
        }

        .json-payload-editor__label {
          font-weight: 500;
          color: var(--color-text-primary, #1a1a1a);
          font-size: var(--font-size-sm, 0.875rem);
        }

        .json-payload-editor__container {
          display: flex;
          border: 1px solid var(--color-border, #d1d5db);
          border-radius: var(--radius-md, 0.375rem);
          background: var(--color-bg-input, #ffffff);
          overflow: hidden;
          transition: border-color 0.15s ease;
        }

        .json-payload-editor__container:focus-within {
          border-color: var(--color-primary, #6b4423);
          box-shadow: 0 0 0 2px var(--color-primary-light, rgba(107, 68, 35, 0.1));
        }

        .json-payload-editor__container--error {
          border-color: var(--color-error, #dc2626);
        }

        .json-payload-editor__container--error:focus-within {
          box-shadow: 0 0 0 2px var(--color-error-light, rgba(220, 38, 38, 0.1));
        }

        .json-payload-editor__line-numbers {
          display: flex;
          flex-direction: column;
          padding: var(--space-sm, 0.5rem) var(--space-xs, 0.25rem);
          background: var(--color-bg-muted, #f9fafb);
          border-right: 1px solid var(--color-border, #d1d5db);
          user-select: none;
          min-width: 2.5rem;
          text-align: right;
        }

        .json-payload-editor__line-number {
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: var(--font-size-sm, 0.875rem);
          line-height: 1.5;
          color: var(--color-text-muted, #6b7280);
          padding-right: var(--space-xs, 0.25rem);
        }

        .json-payload-editor__textarea {
          flex: 1;
          padding: var(--space-sm, 0.5rem);
          border: none;
          outline: none;
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: var(--font-size-sm, 0.875rem);
          line-height: 1.5;
          resize: vertical;
          min-height: 200px;
          background: transparent;
          color: var(--color-text-primary, #1a1a1a);
        }

        .json-payload-editor__textarea::placeholder {
          color: var(--color-text-placeholder, #9ca3af);
        }

        .json-payload-editor__textarea:disabled {
          background: var(--color-bg-disabled, #f3f4f6);
          cursor: not-allowed;
        }

        .json-payload-editor__error {
          display: flex;
          align-items: flex-start;
          gap: var(--space-xs, 0.25rem);
          color: var(--color-error, #dc2626);
          font-size: var(--font-size-sm, 0.875rem);
          padding: var(--space-xs, 0.25rem) 0;
        }

        .json-payload-editor__error-icon {
          flex-shrink: 0;
        }

        .json-payload-editor__help {
          color: var(--color-text-muted, #6b7280);
          font-size: var(--font-size-xs, 0.75rem);
        }
      `}</style>
    </div>
  )
}

export default JsonPayloadEditor
