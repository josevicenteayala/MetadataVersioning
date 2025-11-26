/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/**
 * T036: VersionDiffViewer Component
 * Renders JSON diff visualization using jsondiffpatch with coffeehouse theming
 */

import React, { useMemo, useState, useCallback } from 'react'
import type { VersionDiffResult } from '../api/useVersionDiff'

export type DiffViewMode = 'inline' | 'split'

export interface VersionDiffViewerProps {
  /** Diff result from useVersionDiff hook */
  diffResult: VersionDiffResult | null
  /** View mode: inline (unified) or split (side-by-side) */
  viewMode?: DiffViewMode
  /** Callback when view mode changes */
  onViewModeChange?: (mode: DiffViewMode) => void
  /** Whether to start with all sections collapsed */
  defaultCollapsed?: boolean
  /** Loading state */
  isLoading?: boolean
  /** Custom class name */
  className?: string
}

/**
 * Color tokens for diff visualization (coffeehouse theme)
 * - Additions: Foam green (#C8E6C9 / mint-cream variant)
 * - Deletions: Light roast red (#FFCDD2 / blush-latte variant)
 * - Modifications: Crema yellow (#FFF9C4 / warm highlight)
 */
const DIFF_COLORS = {
  added: {
    bg: 'var(--color-foam, #C8E6C9)',
    border: 'var(--color-foam-dark, #81C784)',
    text: 'var(--color-mocha, #3E2723)',
  },
  removed: {
    bg: 'var(--color-blush-latte, #FFCDD2)',
    border: 'var(--color-blush-dark, #E57373)',
    text: 'var(--color-mocha, #3E2723)',
  },
  modified: {
    bg: 'var(--color-crema, #FFF9C4)',
    border: 'var(--color-crema-dark, #FFF176)',
    text: 'var(--color-mocha, #3E2723)',
  },
}

interface DiffLineProps {
  type: 'added' | 'removed' | 'modified' | 'unchanged'
  path: string
  oldValue?: unknown
  newValue?: unknown
  isExpanded?: boolean
  onToggle?: () => void
}

/**
 * Individual diff line component
 */
const DiffLine: React.FC<DiffLineProps> = ({
  type,
  path,
  oldValue,
  newValue,
  isExpanded = true,
  onToggle,
}) => {
  const colors = type !== 'unchanged' ? DIFF_COLORS[type] : null

  const lineStyle: React.CSSProperties = colors
    ? {
        backgroundColor: colors.bg,
        borderLeft: `4px solid ${colors.border}`,
        color: colors.text,
      }
    : {}

  const formatValue = (value: unknown): string => {
    if (value === undefined) return ''
    return JSON.stringify(value, null, 2)
  }

  const getTypeIcon = () => {
    switch (type) {
      case 'added':
        return (
          <span className="diff-icon diff-icon--added" aria-label="Added">
            +
          </span>
        )
      case 'removed':
        return (
          <span className="diff-icon diff-icon--removed" aria-label="Removed">
            −
          </span>
        )
      case 'modified':
        return (
          <span className="diff-icon diff-icon--modified" aria-label="Modified">
            ~
          </span>
        )
      default:
        return (
          <span className="diff-icon diff-icon--unchanged" aria-hidden="true">
            {' '}
          </span>
        )
    }
  }

  return (
    <div
      className={`diff-line diff-line--${type}`}
      style={lineStyle}
      role="row"
      aria-label={`${type} at ${path}`}
    >
      <button
        className="diff-line__toggle"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-label={isExpanded ? 'Collapse' : 'Expand'}
      >
        {isExpanded ? '▼' : '▶'}
      </button>
      {getTypeIcon()}
      <span className="diff-line__path" role="cell">
        {path}
      </span>
      {isExpanded && (
        <div className="diff-line__values">
          {(type === 'removed' || type === 'modified') && (
            <pre className="diff-line__old-value" aria-label="Old value">
              {formatValue(oldValue)}
            </pre>
          )}
          {type === 'modified' && (
            <span className="diff-arrow" aria-hidden="true">
              →
            </span>
          )}
          {(type === 'added' || type === 'modified') && (
            <pre className="diff-line__new-value" aria-label="New value">
              {formatValue(newValue)}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}

interface DiffEntry {
  path: string
  type: 'added' | 'removed' | 'modified' | 'unchanged'
  oldValue?: unknown
  newValue?: unknown
}

/**
 * Flatten jsondiffpatch delta into array of diff entries
 */
function flattenDelta(delta: unknown, left: unknown, right: unknown, path = ''): DiffEntry[] {
  const entries: DiffEntry[] = []

  if (!delta || typeof delta !== 'object') {
    return entries
  }

  const deltaObj = delta as Record<string, unknown>

  for (const [key, value] of Object.entries(deltaObj)) {
    // Skip internal jsondiffpatch properties
    if (key === '_t') continue

    const currentPath = path ? `${path}.${key}` : key
    const leftVal = (left as Record<string, unknown>)?.[key]
    const rightVal = (right as Record<string, unknown>)?.[key]

    if (Array.isArray(value)) {
      if (value.length === 1) {
        // Addition: [newValue]
        entries.push({
          path: currentPath,
          type: 'added',
          newValue: value[0],
        })
      } else if (value.length === 2) {
        // Modification: [oldValue, newValue]
        entries.push({
          path: currentPath,
          type: 'modified',
          oldValue: value[0],
          newValue: value[1],
        })
      } else if (value.length === 3 && value[2] === 0) {
        // Deletion: [oldValue, 0, 0]
        entries.push({
          path: currentPath,
          type: 'removed',
          oldValue: value[0],
        })
      }
    } else if (typeof value === 'object' && value !== null) {
      // Nested object diff
      entries.push(...flattenDelta(value, leftVal, rightVal, currentPath))
    }
  }

  return entries
}

/**
 * VersionDiffViewer - Main diff visualization component
 */
export const VersionDiffViewer: React.FC<VersionDiffViewerProps> = ({
  diffResult,
  viewMode = 'inline',
  onViewModeChange,
  defaultCollapsed = false,
  isLoading = false,
  className = '',
}) => {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    defaultCollapsed ? new Set() : new Set(['*']),
  )

  const togglePath = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }, [])

  const expandAll = useCallback(() => {
    setExpandedPaths(new Set(['*']))
  }, [])

  const collapseAll = useCallback(() => {
    setExpandedPaths(new Set())
  }, [])

  const diffEntries = useMemo(() => {
    if (!diffResult?.delta) return []
    return flattenDelta(
      diffResult.delta,
      diffResult.leftVersion.payload as Record<string, unknown>,
      diffResult.rightVersion.payload as Record<string, unknown>,
    )
  }, [diffResult])

  const stats = useMemo(() => {
    const counts = { added: 0, removed: 0, modified: 0 }
    for (const entry of diffEntries) {
      if (entry.type in counts) {
        counts[entry.type as keyof typeof counts]++
      }
    }
    return counts
  }, [diffEntries])

  const isExpanded = (path: string) => expandedPaths.has('*') || expandedPaths.has(path)

  if (isLoading) {
    return (
      <div
        className={`version-diff-viewer version-diff-viewer--loading ${className}`}
        role="status"
        aria-label="Loading diff"
      >
        <div className="diff-loading-spinner" aria-hidden="true" />
        <span>Computing diff...</span>
      </div>
    )
  }

  if (!diffResult) {
    return (
      <div className={`version-diff-viewer version-diff-viewer--empty ${className}`} role="status">
        <span>Select two versions to compare</span>
      </div>
    )
  }

  if (diffResult.exceedsLimit) {
    return (
      <div className={`version-diff-viewer version-diff-viewer--error ${className}`} role="alert">
        <h3>Payload Too Large</h3>
        <p>One or both versions exceed the 200KB limit for diff visualization.</p>
        <dl>
          <dt>Left payload size:</dt>
          <dd>{(diffResult.leftPayloadSize / 1024).toFixed(1)} KB</dd>
          <dt>Right payload size:</dt>
          <dd>{(diffResult.rightPayloadSize / 1024).toFixed(1)} KB</dd>
        </dl>
      </div>
    )
  }

  return (
    <div
      className={`version-diff-viewer version-diff-viewer--${viewMode} ${className}`}
      role="region"
      aria-label="Version diff viewer"
    >
      {/* Header with controls */}
      <header className="diff-header">
        <div className="diff-stats" aria-label="Diff statistics">
          <span className="diff-stat diff-stat--added" aria-label={`${stats.added} additions`}>
            +{stats.added}
          </span>
          <span className="diff-stat diff-stat--removed" aria-label={`${stats.removed} removals`}>
            −{stats.removed}
          </span>
          <span
            className="diff-stat diff-stat--modified"
            aria-label={`${stats.modified} modifications`}
          >
            ~{stats.modified}
          </span>
        </div>

        <div className="diff-controls">
          <button className="diff-control-btn" onClick={expandAll} aria-label="Expand all">
            Expand All
          </button>
          <button className="diff-control-btn" onClick={collapseAll} aria-label="Collapse all">
            Collapse All
          </button>

          {onViewModeChange && (
            <div className="diff-view-toggle" role="group" aria-label="View mode">
              <button
                className={`diff-view-btn ${viewMode === 'inline' ? 'diff-view-btn--active' : ''}`}
                onClick={() => onViewModeChange('inline')}
                aria-pressed={viewMode === 'inline'}
              >
                Inline
              </button>
              <button
                className={`diff-view-btn ${viewMode === 'split' ? 'diff-view-btn--active' : ''}`}
                onClick={() => onViewModeChange('split')}
                aria-pressed={viewMode === 'split'}
              >
                Split
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Metadata badges */}
      <div className="diff-metadata" aria-label="Version metadata">
        <div className="diff-metadata__version diff-metadata__version--left">
          <span className="diff-metadata__label">Left:</span>
          <span className="diff-metadata__number">
            v{String(diffResult.leftVersion.versionNumber)}
          </span>
          <span className="diff-metadata__date">
            {new Date(String(diffResult.leftVersion.createdAt)).toLocaleDateString()}
          </span>
        </div>
        <span className="diff-metadata__arrow" aria-hidden="true">
          →
        </span>
        <div className="diff-metadata__version diff-metadata__version--right">
          <span className="diff-metadata__label">Right:</span>
          <span className="diff-metadata__number">
            v{String(diffResult.rightVersion.versionNumber)}
          </span>
          <span className="diff-metadata__date">
            {new Date(String(diffResult.rightVersion.createdAt)).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Diff content */}
      <div className="diff-content" role="table" aria-label="Diff entries">
        {diffEntries.length === 0 ? (
          <div className="diff-no-changes" role="row">
            <span role="cell">No differences found</span>
          </div>
        ) : viewMode === 'inline' ? (
          // Inline (unified) view
          diffEntries.map((entry) => (
            <DiffLine
              key={entry.path}
              type={entry.type}
              path={entry.path}
              oldValue={entry.oldValue}
              newValue={entry.newValue}
              isExpanded={isExpanded(entry.path)}
              onToggle={() => togglePath(entry.path)}
            />
          ))
        ) : (
          // Split (side-by-side) view
          <div className="diff-split-container">
            <div className="diff-split-pane diff-split-pane--left" aria-label="Left version">
              {diffEntries.map((entry) => (
                <DiffLine
                  key={`left-${entry.path}`}
                  type={entry.type === 'added' ? 'unchanged' : entry.type}
                  path={entry.path}
                  oldValue={entry.oldValue}
                  isExpanded={isExpanded(entry.path)}
                  onToggle={() => togglePath(entry.path)}
                />
              ))}
            </div>
            <div className="diff-split-pane diff-split-pane--right" aria-label="Right version">
              {diffEntries.map((entry) => (
                <DiffLine
                  key={`right-${entry.path}`}
                  type={entry.type === 'removed' ? 'unchanged' : entry.type}
                  path={entry.path}
                  newValue={entry.newValue}
                  isExpanded={isExpanded(entry.path)}
                  onToggle={() => togglePath(entry.path)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Performance footer */}
      <footer className="diff-footer">
        <span className="diff-compute-time">
          Diff computed in {diffResult.diffComputeTime.toFixed(0)}ms
        </span>
      </footer>
    </div>
  )
}

export default VersionDiffViewer
