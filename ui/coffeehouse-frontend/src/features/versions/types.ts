/**
 * Version-related type definitions for the Coffeehouse Frontend.
 * Maps to MetadataVersion schema from the OpenAPI contract.
 */

export type VersionStatus = 'draft' | 'approved' | 'published' | 'archived' | 'active'

export interface MetadataVersion {
  versionId: string
  documentId: string
  versionNumber: number
  status: VersionStatus
  createdBy: string
  createdAt: string
  activatedAt: string | null
  changeSummary: string
  payload: Record<string, unknown>
}

export interface VersionHistoryResult {
  versions: MetadataVersion[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
}

export type SortColumn = 'versionNumber' | 'status' | 'createdAt' | 'activatedAt' | 'createdBy'
export type SortDirection = 'asc' | 'desc'

export interface VersionSortState {
  sortBy: SortColumn
  sortDir: SortDirection
}

export interface VersionDetailDrawerProps {
  version: MetadataVersion | null
  isOpen: boolean
  onClose: () => void
  correlationId?: string | null
}

export interface ActivationEligibility {
  eligible: boolean
  reason: string
}

export const getActivationEligibility = (version: MetadataVersion): ActivationEligibility => {
  switch (version.status) {
    case 'active':
      return { eligible: false, reason: 'Currently active' }
    case 'archived':
      return { eligible: false, reason: 'Archived versions cannot be activated' }
    case 'draft':
      return { eligible: true, reason: 'Eligible for activation' }
    case 'approved':
      return { eligible: true, reason: 'Eligible for activation' }
    case 'published':
      return { eligible: true, reason: 'Eligible for activation' }
    default:
      return { eligible: false, reason: 'Unknown status' }
  }
}
