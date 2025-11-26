import { useEffect, useRef } from 'react'
import type { MetadataVersion, VersionDetailDrawerProps } from '../types'
import { getActivationEligibility } from '../types'

const formatDateTime = (iso: string): string => {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

interface MetadataFieldProps {
  label: string
  value: string | React.ReactNode
  testId?: string
}

const MetadataField = ({ label, value, testId }: MetadataFieldProps) => (
  <div className="version-detail-drawer__field">
    <dt className="version-detail-drawer__label">{label}</dt>
    <dd className="version-detail-drawer__value" data-testid={testId}>
      {value}
    </dd>
  </div>
)

interface PayloadPreviewProps {
  payload: Record<string, unknown>
}

const PayloadPreview = ({ payload }: PayloadPreviewProps) => {
  const jsonString = JSON.stringify(payload, null, 2)

  return (
    <div className="version-detail-drawer__payload" data-testid="payload-preview">
      <h4 className="version-detail-drawer__section-title">Payload Preview</h4>
      <pre className="version-detail-drawer__json">
        <code>{jsonString}</code>
      </pre>
    </div>
  )
}

interface ActivationBadgeProps {
  version: MetadataVersion
}

const ActivationBadge = ({ version }: ActivationBadgeProps) => {
  const eligibility = getActivationEligibility(version)

  return (
    <div
      className={`version-detail-drawer__eligibility ${eligibility.eligible ? 'version-detail-drawer__eligibility--eligible' : 'version-detail-drawer__eligibility--ineligible'}`}
      data-testid="activation-eligibility"
    >
      <span className="version-detail-drawer__eligibility-icon" aria-hidden="true">
        {eligibility.eligible ? '✓' : '○'}
      </span>
      <span className="version-detail-drawer__eligibility-text">{eligibility.reason}</span>
    </div>
  )
}

const VersionDetailDrawer = ({
  version,
  isOpen,
  onClose,
  correlationId,
}: VersionDetailDrawerProps) => {
  const drawerRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Handle Escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Focus management
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus()
    }
  }, [isOpen])

  // Trap focus within drawer
  useEffect(() => {
    if (!isOpen || !drawerRef.current) return

    const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault()
        lastElement?.focus()
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault()
        firstElement?.focus()
      }
    }

    document.addEventListener('keydown', handleTab)
    return () => document.removeEventListener('keydown', handleTab)
  }, [isOpen])

  if (!isOpen || !version) {
    return null
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="version-detail-drawer__backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="version-detail-drawer"
        data-testid="version-detail-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Header */}
        <header className="version-detail-drawer__header">
          <h3 id="drawer-title" className="version-detail-drawer__title">
            Version Details
          </h3>
          <button
            ref={closeButtonRef}
            type="button"
            className="version-detail-drawer__close"
            onClick={onClose}
            aria-label="Close drawer"
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        {/* Content */}
        <div className="version-detail-drawer__content">
          {/* Version badge */}
          <div className="version-detail-drawer__version-badge">
            <span className="version-number version-number--large">
              v{version.versionNumber}
            </span>
            <span className={`status-chip status-chip--${version.status}`}>
              {version.status.charAt(0).toUpperCase() + version.status.slice(1)}
            </span>
          </div>

          {/* Activation eligibility */}
          <ActivationBadge version={version} />

          {/* Metadata */}
          <dl className="version-detail-drawer__metadata">
            <MetadataField label="Author" value={version.createdBy} />
            <MetadataField label="Created" value={formatDateTime(version.createdAt)} />
            {version.activatedAt && (
              <MetadataField
                label="Activated"
                value={formatDateTime(version.activatedAt)}
              />
            )}
            <MetadataField label="Summary" value={version.changeSummary || '—'} />
            {correlationId && (
              <MetadataField
                label="Correlation ID"
                value={
                  <code className="version-detail-drawer__correlation-id">
                    {correlationId}
                  </code>
                }
                testId="correlation-id"
              />
            )}
          </dl>

          {/* Payload preview */}
          <PayloadPreview payload={version.payload} />
        </div>

        {/* Footer with actions */}
        <footer className="version-detail-drawer__footer">
          {version.status !== 'active' && version.status !== 'archived' && (
            <button type="button" className="btn btn--primary">
              Activate Version
            </button>
          )}
          <button type="button" className="btn btn--outline">
            Compare with Active
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={onClose}
          >
            Close
          </button>
        </footer>
      </div>
    </>
  )
}

export default VersionDetailDrawer
