import { useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import NewVersionForm from '../forms/NewVersionForm'

export interface CreateVersionModalProps {
  isOpen: boolean
  onClose: () => void
  documentId: string
  /** Initial payload to pre-populate the form (e.g., from active version) */
  initialPayload?: Record<string, unknown> | undefined
  /** Reference to the trigger button for focus management */
  triggerRef?: React.RefObject<HTMLButtonElement | null>
}

export const CreateVersionModal = ({
  isOpen,
  onClose,
  documentId,
  initialPayload,
  triggerRef,
}: CreateVersionModalProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen) {
      dialog.showModal()
      // Focus first field when modal opens (T082)
      requestAnimationFrame(() => {
        const firstInput = dialog.querySelector<HTMLElement>('textarea, input')
        firstInput?.focus()
      })
    } else {
      dialog.close()
      // Return focus to trigger button when modal closes (T083)
      triggerRef?.current?.focus()
    }
  }, [isOpen, triggerRef])

  const handleSuccess = useCallback(() => {
    onClose()
  }, [onClose])

  return createPortal(
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="backdrop:bg-gray-900/50 p-0 rounded-lg shadow-xl w-full max-w-2xl"
      aria-modal="true"
      aria-labelledby="create-version-title"
      data-testid="create-version-modal"
    >
      <div className="p-6 relative" data-testid="create-version-modal-content">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          aria-label="Close modal"
          data-testid="create-version-modal-close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <h2 id="create-version-title" className="text-xl font-bold mb-4">
          Create New Version
        </h2>
        <NewVersionForm
          documentId={documentId}
          onSuccess={handleSuccess}
          onCancel={onClose}
          initialPayload={initialPayload}
        />
      </div>
    </dialog>,
    document.body,
  )
}

export default CreateVersionModal
