export interface DashboardStats {
  totalDocuments: number
  activeVersions: number
  draftsAwaitingReview: number
  lastRefreshedAt: string | null
}

export interface UseDashboardStatsResult {
  data: DashboardStats | undefined
  isLoading: boolean
  isError: boolean
}

// Re-export concrete implementation
export { useDashboardStatsQuery as useDashboardStats } from './useDashboardStatsQuery'
