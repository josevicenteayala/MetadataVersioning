import type { MetadataDocumentResponse } from '@services/generated/models/MetadataDocumentResponse'

export interface DocumentsTableProps {
  documents: MetadataDocumentResponse[]
  isLoading?: boolean
  onRowClick?: (doc: MetadataDocumentResponse) => void
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  approved: 'Approved',
  published: 'Published',
  archived: 'Archived',
}

const formatDate = (iso?: string) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const DocumentsTable = ({ documents, isLoading, onRowClick }: DocumentsTableProps) => {
  if (isLoading) {
    return (
      <div className="documents-table" aria-busy="true" aria-live="polite">
        <p className="documents-table__loading">Loading documents…</p>
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="documents-table documents-table--empty" aria-live="polite">
        <p>No documents match your filters.</p>
      </div>
    )
  }

  return (
    <div className="documents-table" role="region" aria-label="Metadata documents">
      <table>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Type</th>
            <th scope="col">Status</th>
            <th scope="col">Versions</th>
            <th scope="col">Active</th>
            <th scope="col">Updated</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => {
            const status = doc.activeVersion !== null ? 'published' : 'draft'
            return (
              <tr
                key={doc.id}
                data-testid="documents-table-row"
                onClick={() => onRowClick?.(doc)}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={(e) => {
                  if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    onRowClick(doc)
                  }
                }}
                className={onRowClick ? 'documents-table__row--clickable' : undefined}
              >
                <td className="documents-table__name">{doc.name}</td>
                <td className="documents-table__type">{doc.type}</td>
                <td>
                  <span className={`status-chip status-chip--${status}`} data-testid="status-chip">
                    {STATUS_LABELS[status] ?? status}
                  </span>
                </td>
                <td className="documents-table__versions">{doc.versionCount ?? 0}</td>
                <td className="documents-table__active">
                  {doc.activeVersion !== null ? (
                    <span className="active-badge" title="Has active version">
                      v{doc.activeVersion}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="documents-table__updated">{formatDate(doc.updatedAt)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default DocumentsTable
