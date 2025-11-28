import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import NewVersionForm from '../forms/NewVersionForm'

export interface CreateVersionModalProps {
  isOpen: boolean
  onClose: () => void
  documentId: string
}

export const CreateVersionModal = ({
  isOpen,
  onClose,
  documentId,
}: CreateVersionModalProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen) {
      dialog.showModal()
    } else {
      dialog.close()
    }
  }, [isOpen])

  const handleSuccess = () => {
    onClose()
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="backdrop:bg-gray-900/50 p-0 rounded-lg shadow-xl w-full max-w-2xl"
      aria-modal="true"
      aria-labelledby="create-version-title"
    >
      <div className="p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          aria-label="Close modal"
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
        />
      </div>
    </dialog>,
    document.body
  )
}

export default CreateVersionModal
