import { useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreateDocumentForm } from '@features/documents/forms/CreateDocumentForm'
import type { CreateDocumentResponse } from '@features/documents/api/useCreateDocument'
import { useSessionStore } from '@services/auth/sessionStore'
import { emitToast } from '@services/feedback/toastBus'

export interface CreateDocumentModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback to close the modal */
  onClose: () => void
}

/**
 * Modal wrapper for creating a new metadata document.
 *
 * Features:
 * - Auth guard: redirects unauthenticated users to Settings
 * - Focus trap within modal
 * - ESC key to close
 * - Success navigation to new document detail page
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false)
 *
 * <button onClick={() => setIsOpen(true)}>Create Document</button>
 * <CreateDocumentModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
 * ```
 */
export const CreateDocumentModal = ({ isOpen, onClose }: CreateDocumentModalProps) => {
  const navigate = useNavigate()
  const modalRef = useRef<HTMLDivElement>(null)

  // Get auth state from session store - check if credentials exist
  const credentials = useSessionStore((state) => state.credentials)
  const hasCredentials = credentials !== undefined

  // Check auth and redirect if not authenticated
  useEffect(() => {
    if (isOpen && !hasCredentials) {
      emitToast({
        intent: 'warning',
        title: 'Authentication required',
        message: 'Please enter your credentials in Settings before creating documents.',
      })
      onClose()
      void navigate('/settings')
    }
  }, [isOpen, hasCredentials, navigate, onClose])

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Focus trap: focus first focusable element when modal opens
  useEffect(() => {
    if (!isOpen || !modalRef.current) return

    const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )

    if (focusableElements.length > 0) {
      focusableElements[0].focus()
    }

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Handle successful document creation
  const handleSuccess = useCallback(
    (document: CreateDocumentResponse) => {
      onClose()

      // Navigate to the new document detail page
      void navigate(`/documents/${document.type}/${document.name}`)

      emitToast({
        intent: 'success',
        title: 'Document created',
        message: `Successfully created ${document.type}/${document.name}`,
        correlationId: document.correlationId,
      })
    },
    [navigate, onClose],
  )

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose()
      }
    },
    [onClose],
  )

  if (!isOpen || !hasCredentials) {
    return null
  }

  return (
    <div
      className="create-document-modal__backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-document-modal-title"
    >
      <div
        ref={modalRef}
        className="create-document-modal__content"
        role="document"
      >
        {/* Close button */}
        <button
          type="button"
          className="create-document-modal__close"
          onClick={onClose}
          aria-label="Close modal"
        >
          ×
        </button>

        {/* Form */}
        <CreateDocumentForm
          onSuccess={handleSuccess}
          onCancel={onClose}
        />
      </div>

      <style>{`
        .create-document-modal__backdrop {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1000;
          padding: var(--space-lg, 1.5rem);
          animation: fadeIn 0.15s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .create-document-modal__content {
          position: relative;
          background: var(--color-bg-surface, #ffffff);
          border-radius: var(--radius-lg, 0.5rem);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          max-width: 90vw;
          max-height: 90vh;
          overflow-y: auto;
          animation: slideUp 0.2s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .create-document-modal__close {
          position: absolute;
          top: var(--space-sm, 0.5rem);
          right: var(--space-sm, 0.5rem);
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          border-radius: var(--radius-full, 9999px);
          font-size: 1.5rem;
          color: var(--color-text-muted, #6b7280);
          cursor: pointer;
          transition: background-color 0.15s ease, color 0.15s ease;
          z-index: 1;
        }

        .create-document-modal__close:hover {
          background: var(--color-bg-hover, #f3f4f6);
          color: var(--color-text-primary, #1a1a1a);
        }

        .create-document-modal__close:focus {
          outline: 2px solid var(--color-primary, #6b4423);
          outline-offset: 2px;
        }

        /* Responsive: full screen on mobile */
        @media (max-width: 640px) {
          .create-document-modal__backdrop {
            padding: 0;
          }

          .create-document-modal__content {
            width: 100%;
            max-width: 100%;
            height: 100%;
            max-height: 100%;
            border-radius: 0;
          }
        }
      `}</style>
    </div>
  )
}

export default CreateDocumentModal
