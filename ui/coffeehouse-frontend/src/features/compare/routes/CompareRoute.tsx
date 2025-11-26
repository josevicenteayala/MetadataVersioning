/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/**
 * T038: CompareRoute
 * Route component for version comparison page
 */

import React, { useMemo } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { VersionComparePanel, DiffErrorBoundary } from '@features/compare/components'
import type { VersionCompareOption } from '@features/compare/components'
import { apiClient } from '@services/api/client'
import type { VersionResponse } from '@services/api/generated'

/**
 * Fetch versions for a document
 */
async function fetchVersions(documentId: string): Promise<VersionResponse[]> {
  const response = await apiClient.get<VersionResponse[]>(
    `/api/v1/documents/${documentId}/versions`,
  )
  return response.data as VersionResponse[]
}

/**
 * CompareRoute - Main route for version comparison
 *
 * URL: /documents/:documentId/compare?left=<versionId>&right=<versionId>
 */
export const CompareRoute: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const leftVersionId = searchParams.get('left') ?? ''
  const rightVersionId = searchParams.get('right') ?? ''

  // Fetch available versions
  const {
    data: versions,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['document-versions', documentId],
    queryFn: () => fetchVersions(documentId!),
    enabled: !!documentId,
  })

  // Transform versions to compare options
  const compareOptions: VersionCompareOption[] = useMemo(() => {
    if (!versions) return []
    return versions.map((v: VersionResponse) => ({
      id: String(v.id),
      versionNumber: Number(v.versionNumber),
      label: String(v.summary ?? `Version ${v.versionNumber}`),
      createdAt: String(v.createdAt),
      isActive: Boolean(v.isActive),
    }))
  }, [versions])

  // Handle selection change - update URL params
  const handleSelectionChange = (left: string, right: string) => {
    const params = new URLSearchParams()
    if (left) params.set('left', left)
    if (right) params.set('right', right)
    setSearchParams(params, { replace: true })
  }

  // Handle close - navigate back to document
  const handleClose = () => {
    void navigate(`/documents/${documentId}`)
  }

  if (!documentId) {
    return (
      <div className="compare-route compare-route--error" role="alert">
        <h1>Missing Document ID</h1>
        <p>No document ID was provided in the URL.</p>
        <button onClick={() => navigate('/documents')}>Go to Documents</button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="compare-route compare-route--loading" role="status">
        <div className="loading-spinner" aria-hidden="true" />
        <span>Loading versions...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="compare-route compare-route--error" role="alert">
        <h1>Error Loading Versions</h1>
        <p>Unable to load versions for comparison.</p>
        <button onClick={() => navigate(`/documents/${documentId}`)}>Back to Document</button>
      </div>
    )
  }

  return (
    <div className="compare-route">
      <DiffErrorBoundary>
        <VersionComparePanel
          documentId={documentId}
          versions={compareOptions}
          initialLeftVersionId={leftVersionId}
          initialRightVersionId={rightVersionId}
          onSelectionChange={handleSelectionChange}
          onClose={handleClose}
          className="compare-route__panel"
        />
      </DiffErrorBoundary>
    </div>
  )
}

export default CompareRoute
