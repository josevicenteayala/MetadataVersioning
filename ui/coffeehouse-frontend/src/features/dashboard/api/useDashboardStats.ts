import type { UseQueryResult } from '@tanstack/react-query'

export type DashboardStats = {
  totalDocuments: number
  activeVersions: number
  draftsAwaitingReview: number
  lastRefreshedAt: string | null
}

export type UseDashboardStatsResult = Pick<UseQueryResult<DashboardStats>, 'data' | 'isLoading' | 'isError'>

export const useDashboardStats = (): UseDashboardStatsResult => {
  throw new Error('useDashboardStats has not been implemented yet. Follow task T015. ')
}
