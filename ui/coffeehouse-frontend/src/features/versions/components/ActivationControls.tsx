import { useCallback, useEffect, useRef, useState } from 'react'
import { useActivateVersion, useCanActivate } from '../api/useActivateVersion'
import type { MetadataVersion } from '../types'
import { getActivationEligibility } from '../types'

export interface ActivationControlsProps {
  version: MetadataVersion
  onActivated?: () => void
}

interface ConfirmationModalProps {
  version: MetadataVersion
  isOpen: boolean
  isPending: boolean
  onConfirm: () => void
  onCancel: () => void
}

const ConfirmationModal = ({
  version,
  isOpen,
  isPending,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) => {
  const cancelRef = useRef<HTMLButtonElement>(null)

  // Focus cancel button when modal opens
  useEffect(() => {
    if (isOpen && cancelRef.current) {
      cancelRef.current.focus()
    }
  }, [isOpen])

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isPending) {
        onCancel()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, isPending, onCancel])

  if (!isOpen) return null

  return (
    <>
      <div
        className="activation-modal__backdrop"
        onClick={isPending ? undefined : onCancel}
        aria-hidden="true"
      />
      <div
        className="activation-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="activation-modal-title"
      >
        <header className="activation-modal__header">
          <h3 id="activation-modal-title">Confirm Activation</h3>
        </header>

        <div className="activation-modal__content">
          <p>
            Are you sure you want to activate <strong>v{version.versionNumber}</strong>?
          </p>
          <p className="activation-modal__warning">
            This will make this version the active version for this document.
            {version.status !== 'active' && ' The current active version will be demoted to Published.'}
          </p>
        </div>

        <footer className="activation-modal__footer">
          <button
            ref={cancelRef}
            type="button"
            className="btn btn--ghost"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? 'Activating…' : 'Confirm'}
          </button>
        </footer>
      </div>
    </>
  )
}

const ActivationControls = ({ version, onActivated }: ActivationControlsProps) => {
  const [showConfirmation, setShowConfirmation] = useState(false)
  const canActivate = useCanActivate()
  const eligibility = getActivationEligibility(version)

  const { mutateAsync, isPending } = useActivateVersion({
    onSuccess: () => {
      setShowConfirmation(false)
      onActivated?.()
    },
  })

  const handleActivateClick = useCallback(() => {
    setShowConfirmation(true)
  }, [])

  const handleConfirm = useCallback(async () => {
    try {
      await mutateAsync({
        documentId: version.documentId,
        versionId: version.versionId,
      })
    } catch {
      // Error handled by mutation
    }
  }, [mutateAsync, version.documentId, version.versionId])

  const handleCancel = useCallback(() => {
    setShowConfirmation(false)
  }, [])

  // Don't render if version is not eligible or user can't activate
  if (!eligibility.eligible) {
    return null
  }

  if (!canActivate) {
    return (
      <div className="activation-controls">
        <button
          type="button"
          className="btn btn--primary"
          disabled
          title="Only administrators can activate versions"
        >
          Activate Version
        </button>
        <p className="activation-controls__hint">
          Contact an administrator to activate this version.
        </p>
      </div>
    )
  }

  return (
    <div className="activation-controls">
      <button
        type="button"
        className="btn btn--primary"
        onClick={handleActivateClick}
        disabled={isPending}
      >
        Activate Version
      </button>

      <ConfirmationModal
        version={version}
        isOpen={showConfirmation}
        isPending={isPending}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  )
}

export default ActivationControls
