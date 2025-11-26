import type { QueryClient } from '@tanstack/react-query'
import { versionHistoryKeys } from '../api/useVersionHistory'

// ─────────────────────────────────────────────────────────────
// Internal Types
// ─────────────────────────────────────────────────────────────

interface VersionItem {
  versionId: string
}

interface VersionWithStatus extends VersionItem {
  status: string
}

/**
 * Query key constants for version-related queries.
 */
export const queryKeys = {
  versions: versionHistoryKeys,
  documents: {
    all: ['documents'] as const,
    detail: (documentId: string) => ['document', documentId] as const,
  },
  dashboard: {
    stats: ['dashboard', 'stats'] as const,
  },
}

/**
 * Invalidates all version-related caches for a specific document.
 * Use after creating, activating, or modifying versions.
 */
export const invalidateDocumentVersions = async (
  queryClient: QueryClient,
  documentId: string,
): Promise<void> => {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: versionHistoryKeys.byDocument(documentId),
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.documents.detail(documentId),
    }),
  ])
}

/**
 * Invalidates all document-related caches.
 * Use when document list or aggregate counts may have changed.
 */
export const invalidateDocumentList = async (queryClient: QueryClient): Promise<void> => {
  await queryClient.invalidateQueries({
    queryKey: queryKeys.documents.all,
  })
}

/**
 * Invalidates dashboard statistics cache.
 * Use when any counts or metrics may have changed.
 */
export const invalidateDashboardStats = async (queryClient: QueryClient): Promise<void> => {
  await queryClient.invalidateQueries({
    queryKey: queryKeys.dashboard.stats,
  })
}

/**
 * Performs full cache invalidation after a version mutation.
 * Invalidates version history, document details, document list, and dashboard.
 */
export const invalidateAfterVersionMutation = async (
  queryClient: QueryClient,
  documentId: string,
): Promise<void> => {
  await Promise.all([
    invalidateDocumentVersions(queryClient, documentId),
    invalidateDocumentList(queryClient),
    invalidateDashboardStats(queryClient),
  ])
}

/**
 * Prefetches version history for a document.
 * Useful for improving perceived performance when user is likely to view versions.
 */
export const prefetchVersionHistory = async (
  queryClient: QueryClient,
  documentId: string,
  fetchFn: () => Promise<unknown>,
): Promise<void> => {
  await queryClient.prefetchQuery({
    queryKey: versionHistoryKeys.byDocument(documentId),
    queryFn: fetchFn,
    staleTime: 30_000, // 30 seconds
  })
}

/**
 * Optimistically updates version history cache with a new version.
 * Returns a rollback function to revert the change if the mutation fails.
 */
export const optimisticAddVersion = (
  queryClient: QueryClient,
  documentId: string,
  newVersion: VersionItem,
): (() => void) => {
  const queryKey = versionHistoryKeys.byDocument(documentId)

  // Get current data
  const previousData = queryClient.getQueryData<VersionItem[]>(queryKey)

  // Optimistically update
  if (previousData) {
    queryClient.setQueryData<VersionItem[]>(queryKey, [newVersion, ...previousData])
  }

  // Return rollback function
  return () => {
    if (previousData) {
      queryClient.setQueryData<VersionItem[]>(queryKey, previousData)
    }
  }
}

/**
 * Optimistically updates a version's status in the cache.
 * Returns a rollback function to revert the change if the mutation fails.
 */
export const optimisticUpdateVersionStatus = (
  queryClient: QueryClient,
  documentId: string,
  versionId: string,
  newStatus: string,
): (() => void) => {
  const queryKey = versionHistoryKeys.byDocument(documentId)

  // Get current data
  const previousData = queryClient.getQueryData<VersionWithStatus[]>(queryKey)

  // Optimistically update
  if (previousData) {
    const updatedData = previousData.map((version) =>
      version.versionId === versionId ? { ...version, status: newStatus } : version,
    )
    queryClient.setQueryData<VersionWithStatus[]>(queryKey, updatedData)
  }

  // Return rollback function
  return () => {
    if (previousData) {
      queryClient.setQueryData<VersionWithStatus[]>(queryKey, previousData)
    }
  }
}
