/**
 * T035: Version Diff API Hook
 * TanStack Query hook for fetching version comparison data with 200KB guardrails
 */

import { useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import { apiClient } from '@services/api/client'
import type { VersionResponse } from '@services/api/generated'

/** Maximum payload size in bytes (200KB) */
const MAX_PAYLOAD_SIZE = 200 * 1024

/** Query key factory for version diff queries */
export const versionDiffKeys = {
  all: ['version-diff'] as const,
  diff: (documentId: string, leftVersionId: string, rightVersionId: string) =>
    [...versionDiffKeys.all, documentId, leftVersionId, rightVersionId] as const,
}

export interface VersionDiffResult {
  /** Left (older) version data */
  leftVersion: VersionResponse
  /** Right (newer) version data */
  rightVersion: VersionResponse
  /** Computed JSON diff using jsondiffpatch delta format */
  delta: unknown
  /** Size of left payload in bytes */
  leftPayloadSize: number
  /** Size of right payload in bytes */
  rightPayloadSize: number
  /** Whether either payload exceeded the 200KB limit */
  exceedsLimit: boolean
  /** Time taken to compute diff in milliseconds */
  diffComputeTime: number
}

export interface VersionDiffError {
  code:
    | 'PAYLOAD_TOO_LARGE'
    | 'VERSION_NOT_FOUND'
    | 'INCOMPATIBLE_SCHEMA'
    | 'NETWORK_ERROR'
    | 'UNKNOWN'
  message: string
  details?: {
    leftPayloadSize?: number
    rightPayloadSize?: number
    maxSize?: number
  }
}

/**
 * Calculate byte size of a JSON object
 */
function getPayloadSize(payload: unknown): number {
  return new TextEncoder().encode(JSON.stringify(payload)).length
}

/**
 * Compute JSON diff between two payloads using jsondiffpatch
 * Note: jsondiffpatch will be dynamically imported to reduce bundle size
 */
async function computeDiff(left: unknown, right: unknown): Promise<unknown> {
  const { diff } = await import('jsondiffpatch')
  return diff(left, right)
}

/**
 * Fetch and compare two versions
 */
async function fetchVersionDiff(
  documentId: string,
  leftVersionId: string,
  rightVersionId: string,
): Promise<VersionDiffResult> {
  const startTime = performance.now()

  // Fetch both versions in parallel
  const [leftResponse, rightResponse] = await Promise.all([
    apiClient.get<VersionResponse>(`/api/v1/documents/${documentId}/versions/${leftVersionId}`),
    apiClient.get<VersionResponse>(`/api/v1/documents/${documentId}/versions/${rightVersionId}`),
  ])

  const leftVersion = leftResponse.data
  const rightVersion = rightResponse.data

  // Calculate payload sizes
  const leftPayloadSize = getPayloadSize(leftVersion.payload)
  const rightPayloadSize = getPayloadSize(rightVersion.payload)
  const exceedsLimit = leftPayloadSize > MAX_PAYLOAD_SIZE || rightPayloadSize > MAX_PAYLOAD_SIZE

  // Compute diff (skip if payload too large)
  let delta: unknown = null
  if (!exceedsLimit) {
    delta = await computeDiff(leftVersion.payload, rightVersion.payload)
  }

  const diffComputeTime = performance.now() - startTime

  return {
    leftVersion,
    rightVersion,
    delta,
    leftPayloadSize,
    rightPayloadSize,
    exceedsLimit,
    diffComputeTime,
  }
}

export interface UseVersionDiffOptions {
  documentId: string
  leftVersionId: string
  rightVersionId: string
  enabled?: boolean
}

/**
 * Hook for fetching version comparison data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useVersionDiff({
 *   documentId: 'doc-123',
 *   leftVersionId: 'v1',
 *   rightVersionId: 'v2',
 * });
 * ```
 */
export function useVersionDiff(
  options: UseVersionDiffOptions,
  queryOptions?: Omit<UseQueryOptions<VersionDiffResult, VersionDiffError>, 'queryKey' | 'queryFn'>,
) {
  const { documentId, leftVersionId, rightVersionId, enabled = true } = options

  return useQuery<VersionDiffResult, VersionDiffError>({
    queryKey: versionDiffKeys.diff(documentId, leftVersionId, rightVersionId),
    queryFn: () => fetchVersionDiff(documentId, leftVersionId, rightVersionId),
    enabled: enabled && !!documentId && !!leftVersionId && !!rightVersionId,
    staleTime: 5 * 60 * 1000, // 5 minutes - versions are immutable
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    retry: (failureCount, error) => {
      // Don't retry on payload too large or not found errors
      if (error.code === 'PAYLOAD_TOO_LARGE' || error.code === 'VERSION_NOT_FOUND') {
        return false
      }
      return failureCount < 3
    },
    ...queryOptions,
  })
}

/**
 * Hook for prefetching version diff (useful for hover states)
 */
export function usePrefetchVersionDiff() {
  const queryClient = useQueryClient()

  return async (options: UseVersionDiffOptions) => {
    const { documentId, leftVersionId, rightVersionId } = options

    await queryClient.prefetchQuery({
      queryKey: versionDiffKeys.diff(documentId, leftVersionId, rightVersionId),
      queryFn: () => fetchVersionDiff(documentId, leftVersionId, rightVersionId),
      staleTime: 5 * 60 * 1000,
    })
  }
}

/** Re-export for convenience */
export { MAX_PAYLOAD_SIZE }
