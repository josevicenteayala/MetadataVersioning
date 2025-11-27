import type { QueryClient } from '@tanstack/react-query'

/**
 * Query key constants for document-related queries.
 */
export const queryKeys = {
  documents: {
    all: ['documents'] as const,
    page: ['documents', 'page'] as const,
    detail: (type: string, name: string) => ['document', type, name] as const,
  },
  dashboard: {
    stats: ['dashboard', 'stats'] as const,
  },
}

/**
 * Invalidates the document list cache.
 * Use after creating, deleting, or modifying documents.
 */
export const invalidateDocumentList = async (queryClient: QueryClient): Promise<void> => {
  await queryClient.invalidateQueries({
    queryKey: queryKeys.documents.all,
  })
}

/**
 * Invalidates dashboard statistics cache.
 * Use when document counts or metrics may have changed.
 */
export const invalidateDashboardStats = async (queryClient: QueryClient): Promise<void> => {
  await queryClient.invalidateQueries({
    queryKey: queryKeys.dashboard.stats,
  })
}

/**
 * Invalidates a specific document's detail cache.
 */
export const invalidateDocumentDetail = async (
  queryClient: QueryClient,
  type: string,
  name: string,
): Promise<void> => {
  await queryClient.invalidateQueries({
    queryKey: queryKeys.documents.detail(type, name),
  })
}

/**
 * Performs full cache invalidation after a document creation.
 * Invalidates document list and dashboard stats.
 */
export const invalidateAfterDocumentCreation = async (queryClient: QueryClient): Promise<void> => {
  await Promise.all([invalidateDocumentList(queryClient), invalidateDashboardStats(queryClient)])
}
