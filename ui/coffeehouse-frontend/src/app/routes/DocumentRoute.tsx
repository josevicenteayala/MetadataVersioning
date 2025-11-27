import { useCallback, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { httpClient } from '@services/api/httpClient'
import { useVersionHistory } from '@features/versions/api/useVersionHistory'
import { VersionHistoryTable, VersionDetailDrawer } from '@features/versions/components'
import type { MetadataVersion, SortColumn, SortDirection } from '@features/versions/types'
import type { MetadataDocumentResponse } from '@services/generated/models/MetadataDocumentResponse'

const fetchDocument = async (type: string, name: string): Promise<MetadataDocumentResponse> => {
  const response = await httpClient.get<MetadataDocumentResponse>(
    `/api/v1/metadata/${type}/${name}`,
  )
  return response.data
}

const sortVersions = (
  versions: MetadataVersion[],
  sortBy: SortColumn,
  sortDir: SortDirection,
): MetadataVersion[] => {
  const sorted = [...versions].sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case 'versionNumber':
        comparison = a.versionNumber - b.versionNumber
        break
      case 'status':
        comparison = a.status.localeCompare(b.status)
        break
      case 'createdBy':
        comparison = a.createdBy.localeCompare(b.createdBy)
        break
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        break
      case 'activatedAt': {
        const aTime = a.activatedAt ? new Date(a.activatedAt).getTime() : 0
        const bTime = b.activatedAt ? new Date(b.activatedAt).getTime() : 0
        comparison = aTime - bTime
        break
      }
      default:
        comparison = 0
    }

    return sortDir === 'asc' ? comparison : -comparison
  })

  return sorted
}

const DocumentRoute = () => {
  const navigate = useNavigate()
  const { type, name } = useParams<{ type: string; name: string }>()
  const documentId = type && name ? `${type}/${name}` : undefined
  const [searchParams, setSearchParams] = useSearchParams()

  // Sorting state
  const [sortBy, setSortBy] = useState<SortColumn>('createdAt')
  const [sortDir, setSortDir] = useState<SortDirection>('desc')

  // Drawer state
  const [selectedVersion, setSelectedVersion] = useState<MetadataVersion | null>(null)
  const [correlationId, setCorrelationId] = useState<string | null>(null)

  // Fetch document details
  const {
    data: document,
    isLoading: isDocumentLoading,
    isError: isDocumentError,
    error: documentError,
  } = useQuery({
    queryKey: ['document', type, name],
    queryFn: () => fetchDocument(type!, name!),
    enabled: Boolean(type && name),
  })

  // Fetch version history
  const {
    versions,
    isLoading: isVersionsLoading,
    isError: isVersionsError,
    error: versionsError,
  } = useVersionHistory({
    documentId: documentId ?? '',
    enabled: Boolean(documentId),
  })

  // Sort versions
  const sortedVersions = useMemo(
    () => sortVersions(versions, sortBy, sortDir),
    [versions, sortBy, sortDir],
  )

  // Handle deep link to specific version - derive initial state from URL
  const linkedVersionId = searchParams.get('version')
  const linkedVersion = useMemo(() => {
    if (linkedVersionId && versions.length > 0) {
      return versions.find((v) => v.versionId === linkedVersionId) ?? null
    }
    return null
  }, [linkedVersionId, versions])

  // Use linked version as initial selection when drawer is closed
  const effectiveSelectedVersion = selectedVersion ?? linkedVersion

  // Handle sort
  const handleSort = useCallback(
    (column: SortColumn) => {
      if (sortBy === column) {
        setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortBy(column)
        setSortDir('desc')
      }
    },
    [sortBy],
  )

  // Handle row click
  const handleRowClick = useCallback(
    (version: MetadataVersion) => {
      setSelectedVersion(version)
      setSearchParams({ version: version.versionId })
      // Store correlation ID from last operation (would come from API headers)
      // For now, simulate with a placeholder
      setCorrelationId(`corr-${version.versionId.slice(0, 8)}`)
    },
    [setSearchParams],
  )

  // Handle drawer close
  const handleCloseDrawer = useCallback(() => {
    setSelectedVersion(null)
    setSearchParams({})
    setCorrelationId(null)
  }, [setSearchParams])

  // Navigate back to dashboard
  const handleBackToDashboard = useCallback(() => {
    void navigate('/dashboard')
  }, [navigate])

  // Loading state
  if (isDocumentLoading) {
    return (
      <div className="document-route document-route--loading" data-testid="document-detail">
        <div className="document-route__skeleton">
          <div className="skeleton skeleton--title" />
          <div className="skeleton skeleton--subtitle" />
        </div>
      </div>
    )
  }

  // Error state
  if (isDocumentError || isVersionsError) {
    const error = documentError ?? versionsError
    const errorCorrelationId = (error as { correlationId?: string })?.correlationId ?? 'unknown'

    return (
      <div className="document-route document-route--error" data-testid="document-detail">
        <div role="alert" className="document-route__error">
          <h2>Error loading {isDocumentError ? 'document' : 'versions'}</h2>
          <p>{error?.message ?? 'Document not found'}</p>
          <p data-testid="error-correlation-id">
            Correlation ID: <code>{errorCorrelationId}</code>
          </p>
          <button type="button" className="btn btn--primary" onClick={handleBackToDashboard}>
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="document-route document-route--not-found" data-testid="document-detail">
        <div role="alert" className="document-route__error">
          <h2>Document not found</h2>
          <button type="button" className="btn btn--primary" onClick={handleBackToDashboard}>
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="document-route" data-testid="document-detail">
      {/* Breadcrumb */}
      <nav className="document-route__breadcrumb" aria-label="Breadcrumb">
        <ol>
          <li>
            <a
              href="/dashboard"
              onClick={(e) => {
                e.preventDefault()
                handleBackToDashboard()
              }}
            >
              Documents
            </a>
          </li>
          <li aria-current="page">{document.name}</li>
        </ol>
      </nav>

      {/* Header */}
      <header className="document-route__header">
        <div className="document-route__title-row">
          <h1>{document.name}</h1>
          {document.activeVersion !== null && (
            <span className="active-version-badge" data-testid="active-version-badge">
              v{document.activeVersion}
            </span>
          )}
        </div>
        <div className="document-route__meta">
          <span className="document-route__type" data-testid="document-type">
            {document.type}
          </span>
          <span className="document-route__version-count" data-testid="version-count">
            {versions.length} version{versions.length !== 1 ? 's' : ''}
          </span>
        </div>
      </header>

      {/* Version History */}
      <section className="document-route__history">
        <h2>Version History</h2>
        <VersionHistoryTable
          versions={sortedVersions}
          isLoading={isVersionsLoading}
          onRowClick={handleRowClick}
          onSort={handleSort}
          sortBy={sortBy}
          sortDir={sortDir}
          highlightedVersionId={linkedVersionId ?? undefined}
        />
      </section>

      {/* Version Detail Drawer */}
      <VersionDetailDrawer
        version={effectiveSelectedVersion}
        isOpen={effectiveSelectedVersion !== null}
        onClose={handleCloseDrawer}
        correlationId={correlationId}
      />
    </div>
  )
}

export default DocumentRoute
