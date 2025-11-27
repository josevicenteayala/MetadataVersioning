/**
 * T037: VersionComparePanel Component
 * Compare selector UI with inline/split toggle + metadata badges
 */

import React, { useState, useCallback, useMemo } from 'react'
import { VersionDiffViewer, type DiffViewMode } from './VersionDiffViewer'
import { useVersionDiff } from '../api/useVersionDiff'

export interface VersionCompareOption {
  id: string
  versionNumber: number
  label: string
  createdAt: string
  isActive: boolean
}

export interface VersionComparePanelProps {
  /** Document ID for the versions being compared */
  documentId: string
  /** Available versions to select from */
  versions: VersionCompareOption[]
  /** Pre-selected left version ID */
  initialLeftVersionId?: string
  /** Pre-selected right version ID */
  initialRightVersionId?: string
  /** Callback when comparison selection changes */
  onSelectionChange?: (leftId: string, rightId: string) => void
  /** Callback when panel is closed */
  onClose?: () => void
  /** Custom class name */
  className?: string
}

/**
 * Version selector dropdown component
 */
interface VersionSelectorProps {
  label: string
  value: string
  options: VersionCompareOption[]
  onChange: (id: string) => void
  excludeId?: string
  id: string
}

const VersionSelector: React.FC<VersionSelectorProps> = ({
  label,
  value,
  options,
  onChange,
  excludeId,
  id,
}) => {
  const filteredOptions = options.filter((opt) => opt.id !== excludeId)

  return (
    <div className="version-selector">
      <label htmlFor={id} className="version-selector__label">
        {label}
      </label>
      <select
        id={id}
        className="version-selector__select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`Select ${label.toLowerCase()}`}
      >
        <option value="">Select version...</option>
        {filteredOptions.map((opt) => (
          <option key={opt.id} value={opt.id}>
            v{opt.versionNumber} - {opt.label}
            {opt.isActive ? ' (Active)' : ''}
          </option>
        ))}
      </select>
    </div>
  )
}

/**
 * Swap button component
 */
interface SwapButtonProps {
  onClick: () => void
  disabled: boolean
}

const SwapButton: React.FC<SwapButtonProps> = ({ onClick, disabled }) => (
  <button
    className="compare-swap-btn"
    onClick={onClick}
    disabled={disabled}
    aria-label="Swap versions"
    title="Swap left and right versions"
  >
    <span aria-hidden="true">⇄</span>
  </button>
)

/**
 * VersionComparePanel - Main comparison UI panel
 */
export const VersionComparePanel: React.FC<VersionComparePanelProps> = ({
  documentId,
  versions,
  initialLeftVersionId,
  initialRightVersionId,
  onSelectionChange,
  onClose,
  className = '',
}) => {
  const [leftVersionId, setLeftVersionId] = useState(initialLeftVersionId ?? '')
  const [rightVersionId, setRightVersionId] = useState(initialRightVersionId ?? '')
  const [viewMode, setViewMode] = useState<DiffViewMode>('inline')

  // Compute diff only when both versions are selected
  const shouldFetch = !!leftVersionId && !!rightVersionId

  const {
    data: diffResult,
    isLoading,
    error,
    refetch,
  } = useVersionDiff({
    documentId,
    leftVersionId,
    rightVersionId,
    enabled: shouldFetch,
  })

  // Get version metadata for display
  const leftVersion = useMemo(
    () => versions.find((v) => v.id === leftVersionId),
    [versions, leftVersionId],
  )
  const rightVersion = useMemo(
    () => versions.find((v) => v.id === rightVersionId),
    [versions, rightVersionId],
  )

  // Handle version selection
  const handleLeftChange = useCallback(
    (id: string) => {
      setLeftVersionId(id)
      onSelectionChange?.(id, rightVersionId)
    },
    [rightVersionId, onSelectionChange],
  )

  const handleRightChange = useCallback(
    (id: string) => {
      setRightVersionId(id)
      onSelectionChange?.(leftVersionId, id)
    },
    [leftVersionId, onSelectionChange],
  )

  // Swap versions
  const handleSwap = useCallback(() => {
    const newLeft = rightVersionId
    const newRight = leftVersionId
    setLeftVersionId(newLeft)
    setRightVersionId(newRight)
    onSelectionChange?.(newLeft, newRight)
  }, [leftVersionId, rightVersionId, onSelectionChange])

  // Auto-select latest versions if none provided
  React.useEffect(() => {
    if (versions.length >= 2 && !initialLeftVersionId && !initialRightVersionId) {
      // Sort by version number descending
      const sorted = [...versions].sort((a, b) => b.versionNumber - a.versionNumber)
      setRightVersionId(sorted[0].id) // Latest as right
      setLeftVersionId(sorted[1].id) // Second latest as left
    }
  }, [versions, initialLeftVersionId, initialRightVersionId])

  return (
    <div
      className={`version-compare-panel ${className}`}
      role="region"
      aria-label="Version comparison panel"
    >
      {/* Header with close button */}
      <header className="compare-panel__header">
        <h2 className="compare-panel__title">Compare Versions</h2>
        {onClose && (
          <button
            className="compare-panel__close"
            onClick={onClose}
            aria-label="Close comparison panel"
          >
            ×
          </button>
        )}
      </header>

      {/* Version selectors */}
      <div className="compare-panel__selectors">
        <VersionSelector
          id="left-version-select"
          label="Base Version (Left)"
          value={leftVersionId}
          options={versions}
          onChange={handleLeftChange}
          excludeId={rightVersionId}
        />

        <SwapButton onClick={handleSwap} disabled={!leftVersionId || !rightVersionId} />

        <VersionSelector
          id="right-version-select"
          label="Compare Version (Right)"
          value={rightVersionId}
          options={versions}
          onChange={handleRightChange}
          excludeId={leftVersionId}
        />
      </div>

      {/* Selected version badges */}
      {leftVersion && rightVersion && (
        <div className="compare-panel__badges" aria-label="Selected versions">
          <div className="version-badge version-badge--left">
            <span className="version-badge__number">v{leftVersion.versionNumber}</span>
            <span className="version-badge__label">{leftVersion.label}</span>
            {leftVersion.isActive && (
              <span className="version-badge__active" aria-label="Active version">
                ✓ Active
              </span>
            )}
          </div>
          <span className="compare-arrow" aria-hidden="true">
            →
          </span>
          <div className="version-badge version-badge--right">
            <span className="version-badge__number">v{rightVersion.versionNumber}</span>
            <span className="version-badge__label">{rightVersion.label}</span>
            {rightVersion.isActive && (
              <span className="version-badge__active" aria-label="Active version">
                ✓ Active
              </span>
            )}
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="compare-panel__error" role="alert">
          <h3>Error loading diff</h3>
          <p>{error.message}</p>
          <button onClick={() => refetch()} className="compare-panel__retry">
            Retry
          </button>
        </div>
      )}

      {/* Diff viewer */}
      {shouldFetch && !error && (
        <VersionDiffViewer
          diffResult={diffResult ?? null}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          isLoading={isLoading}
          className="compare-panel__diff"
        />
      )}

      {/* Empty state when no versions selected */}
      {!shouldFetch && !error && (
        <div className="compare-panel__empty" role="status">
          <p>Select two versions to compare their differences.</p>
          {versions.length < 2 && (
            <p className="compare-panel__hint">
              At least two versions are required for comparison.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default VersionComparePanel
