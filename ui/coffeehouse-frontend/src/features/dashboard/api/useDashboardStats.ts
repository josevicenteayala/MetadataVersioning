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

export const useDashboardStats = (): UseDashboardStatsResult => {
  throw new Error('useDashboardStats has not been implemented yet. Follow task T015. ')
}
