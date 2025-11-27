import type { MetadataVersion, SortColumn, SortDirection } from '../types'

export interface VersionHistoryTableProps {
  versions: MetadataVersion[]
  isLoading?: boolean
  onRowClick?: (version: MetadataVersion) => void
  onSort?: (column: SortColumn) => void
  sortBy?: SortColumn
  sortDir?: SortDirection
  highlightedVersionId?: string
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  approved: 'Approved',
  published: 'Published',
  archived: 'Archived',
  active: 'Active',
}

const formatDate = (iso: string | null): string => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const formatDateTime = (iso: string): string => {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface SortableHeaderProps {
  column: SortColumn
  label: string
  currentSort?: SortColumn
  currentDir?: SortDirection
  onSort?: (column: SortColumn) => void
}

const SortableHeader = ({
  column,
  label,
  currentSort,
  currentDir,
  onSort,
}: SortableHeaderProps) => {
  const isActive = currentSort === column
  const ariaSort = isActive ? (currentDir === 'asc' ? 'ascending' : 'descending') : 'none'

  return (
    <th
      scope="col"
      role="columnheader"
      aria-sort={ariaSort}
      className={`version-history-table__header ${isActive ? 'version-history-table__header--sorted' : ''}`}
      onClick={() => onSort?.(column)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSort?.(column)
        }
      }}
      tabIndex={onSort ? 0 : undefined}
    >
      <span className="version-history-table__header-content">
        {label}
        {isActive && (
          <span className="version-history-table__sort-indicator" aria-hidden="true">
            {currentDir === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </span>
    </th>
  )
}

const SkeletonRow = () => (
  <tr data-testid="version-skeleton-row" className="version-history-table__skeleton-row">
    <td>
      <span className="skeleton skeleton--version" />
    </td>
    <td>
      <span className="skeleton skeleton--status" />
    </td>
    <td>
      <span className="skeleton skeleton--author" />
    </td>
    <td>
      <span className="skeleton skeleton--date" />
    </td>
    <td>
      <span className="skeleton skeleton--date" />
    </td>
    <td>
      <span className="skeleton skeleton--summary" />
    </td>
  </tr>
)

const EmptyState = () => (
  <div className="version-history-table__empty" role="region" aria-label="No versions">
    <h3 className="version-history-table__empty-title">No versions yet</h3>
    <p className="version-history-table__empty-description">
      Create the first version to start tracking changes to this document.
    </p>
    <button type="button" className="btn btn--primary version-history-table__empty-cta">
      Create first version
    </button>
  </div>
)

const VersionHistoryTable = ({
  versions,
  isLoading = false,
  onRowClick,
  onSort,
  sortBy,
  sortDir,
  highlightedVersionId,
}: VersionHistoryTableProps) => {
  if (isLoading) {
    return (
      <div
        className="version-history-table"
        role="region"
        aria-label="Loading version history"
        aria-busy="true"
        aria-live="polite"
      >
        <table aria-label="Version history">
          <thead>
            <tr>
              <th scope="col">Version</th>
              <th scope="col">Status</th>
              <th scope="col">Author</th>
              <th scope="col">Created</th>
              <th scope="col">Activated</th>
              <th scope="col">Summary</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (versions.length === 0) {
    return <EmptyState />
  }

  return (
    <div
      className="version-history-table"
      role="region"
      aria-label="Version history"
      aria-busy="false"
    >
      <table aria-label="Version history">
        <thead className="version-history-table__thead">
          <tr>
            <SortableHeader
              column="versionNumber"
              label="Version"
              currentSort={sortBy}
              currentDir={sortDir}
              onSort={onSort}
            />
            <SortableHeader
              column="status"
              label="Status"
              currentSort={sortBy}
              currentDir={sortDir}
              onSort={onSort}
            />
            <SortableHeader
              column="createdBy"
              label="Author"
              currentSort={sortBy}
              currentDir={sortDir}
              onSort={onSort}
            />
            <SortableHeader
              column="createdAt"
              label="Created"
              currentSort={sortBy}
              currentDir={sortDir}
              onSort={onSort}
            />
            <SortableHeader
              column="activatedAt"
              label="Activated"
              currentSort={sortBy}
              currentDir={sortDir}
              onSort={onSort}
            />
            <th scope="col">Summary</th>
          </tr>
        </thead>
        <tbody>
          {versions.map((version) => {
            const isHighlighted = highlightedVersionId === version.versionId
            return (
              <tr
                key={version.versionId}
                data-testid="version-history-row"
                onClick={() => onRowClick?.(version)}
                onKeyDown={(e) => {
                  if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    onRowClick(version)
                  }
                }}
                tabIndex={onRowClick ? 0 : undefined}
                className={`
                  version-history-table__row
                  ${onRowClick ? 'version-history-table__row--clickable' : ''}
                  ${isHighlighted ? 'version-row--highlighted' : ''}
                `}
                aria-selected={isHighlighted}
              >
                <td className="version-history-table__version">
                  <span className="version-number">v{version.versionNumber}</span>
                </td>
                <td>
                  <span
                    className={`status-chip status-chip--${version.status}`}
                    data-testid="status-chip"
                  >
                    {STATUS_LABELS[version.status] ?? version.status}
                  </span>
                </td>
                <td className="version-history-table__author">{version.createdBy}</td>
                <td
                  className="version-history-table__created"
                  title={formatDateTime(version.createdAt)}
                >
                  {formatDate(version.createdAt)}
                </td>
                <td className="version-history-table__activated version-activated-at">
                  {formatDate(version.activatedAt)}
                </td>
                <td className="version-history-table__summary">
                  <span className="version-summary" title={version.changeSummary}>
                    {version.changeSummary}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default VersionHistoryTable
