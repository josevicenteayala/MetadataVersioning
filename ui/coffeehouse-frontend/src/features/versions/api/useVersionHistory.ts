import { useQuery } from '@tanstack/react-query'
import { httpClient } from '@services/api/httpClient'
import type { VersionResponse } from '@services/generated/models/VersionResponse'
import type { MetadataVersion, VersionHistoryResult, VersionStatus } from '../types'

/**
 * Query key factory for version history queries.
 * Enables targeted cache invalidation.
 */
export const versionHistoryKeys = {
  all: ['versions'] as const,
  byDocument: (documentId: string) => [...versionHistoryKeys.all, 'document', documentId] as const,
}

const mapToMetadataVersion = (v: VersionResponse): MetadataVersion => {
  let status: VersionStatus = 'draft'
  if (v.isActive) {
    status = 'active'
  } else if (v.publishingState) {
    status = v.publishingState.toLowerCase() as VersionStatus
  }

  return {
    versionId: v.id?.toString() ?? `v${v.versionNumber}`,
    documentId: `${v.type}/${v.name}`,
    versionNumber: v.versionNumber ?? 0,
    status,
    createdBy: v.author ?? 'Unknown',
    createdAt: v.createdAt ?? new Date().toISOString(),
    activatedAt: null, // Not provided by backend yet
    changeSummary: v.changeSummary ?? '',
    payload: v.content ?? {},
  }
}

/**
 * Fetches version history for a specific document.
 * Results are cached per document ID.
 */
const fetchVersionHistory = async (documentId: string): Promise<MetadataVersion[]> => {
  const response = await httpClient.get<VersionResponse[]>(
    `/api/v1/metadata/${documentId}/versions`,
  )
  return response.data.map(mapToMetadataVersion)
}

export interface UseVersionHistoryOptions {
  /** Document ID to fetch versions for */
  documentId: string
  /** Whether to enable the query (default: true) */
  enabled?: boolean
}

/**
 * Hook to fetch and cache version history for a metadata document.
 *
 * @example
 * ```tsx
 * const { versions, isLoading, isError } = useVersionHistory({
 *   documentId: 'doc-001',
 * })
 * ```
 */
export const useVersionHistory = ({
  documentId,
  enabled = true,
}: UseVersionHistoryOptions): VersionHistoryResult => {
  const {
    data = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: versionHistoryKeys.byDocument(documentId),
    queryFn: () => fetchVersionHistory(documentId),
    enabled: enabled && Boolean(documentId),
    staleTime: 30_000, // 30 seconds
    gcTime: 5 * 60_000, // 5 minutes
  })

  return {
    versions: data,
    isLoading,
    isError,
    error: error instanceof Error ? error : null,
    refetch,
  }
}

export default useVersionHistory
