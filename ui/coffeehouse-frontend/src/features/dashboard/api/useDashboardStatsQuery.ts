import { useQuery } from '@tanstack/react-query'
import { httpClient } from '@services/api/httpClient'
import type { MetadataDocumentList } from '@services/generated/models/MetadataDocumentList'
import type { DashboardStats } from './useDashboardStats'

const STATS_QUERY_KEY = ['dashboard', 'stats'] as const

export interface DashboardStatsQueryResult {
  data: DashboardStats | undefined
  isLoading: boolean
  isError: boolean
}

const fetchDashboardStats = async (): Promise<DashboardStats> => {
  // Fetch first page of metadata documents to compute stats client-side.
  // The backend list endpoint returns documents ordered by active status.
  const { data } = await httpClient.get<MetadataDocumentList>('/api/v1/metadata', {
    params: { limit: 500 },
  })

  const documents = data.documents ?? []
  const totalDocuments = documents.length
  const activeVersions = documents.filter((d) => d.activeVersion !== null).length
  // Treat draft as "awaiting review" – in real-world, may be a separate status
  const draftsAwaitingReview = documents.filter(
    (d) => d.activeVersion === null && (d.versionCount ?? 0) > 0,
  ).length

  return {
    totalDocuments,
    activeVersions,
    draftsAwaitingReview,
    lastRefreshedAt: new Date().toISOString(),
  }
}

/**
 * Fetch and cache dashboard stats using TanStack Query (T015).
 * Stats are derived from the first 500 documents list.
 */
export const useDashboardStatsQuery = (): DashboardStatsQueryResult => {
  const { data, isLoading, isError } = useQuery({
    queryKey: STATS_QUERY_KEY,
    queryFn: fetchDashboardStats,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })

  return { data, isLoading, isError }
}
