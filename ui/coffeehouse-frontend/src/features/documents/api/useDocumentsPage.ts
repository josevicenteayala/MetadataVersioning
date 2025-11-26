import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { httpClient } from '@services/api/httpClient'
import type { MetadataDocumentList } from '@services/generated/models/MetadataDocumentList'
import type { MetadataDocumentResponse } from '@services/generated/models/MetadataDocumentResponse'

export interface DocumentsPageParams {
  type?: string
  limit?: number
  cursor?: string | null
}

export interface DocumentsPageResult {
  documents: MetadataDocumentResponse[]
  cursor: string | null
  hasMore: boolean
}

export interface UseDocumentsPageResult {
  data: DocumentsPageResult | undefined
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  error: unknown
}

const DOCUMENTS_QUERY_KEY_BASE = ['documents', 'page'] as const

const fetchDocumentsPage = async (params: DocumentsPageParams): Promise<DocumentsPageResult> => {
  const { data } = await httpClient.get<MetadataDocumentList>('/api/v1/metadata', {
    params: {
      type: params.type,
      limit: params.limit ?? 20,
      cursor: params.cursor ?? undefined,
    },
  })

  return {
    documents: data.documents ?? [],
    cursor: data.cursor ?? null,
    hasMore: data.hasMore ?? false,
  }
}

/**
 * Paginated document list hook (T016).
 *
 * Supports cursor-based pagination with type filter. Results stay on screen
 * while the next page is being fetched via `placeholderData: keepPreviousData`.
 */
export const useDocumentsPage = (params: DocumentsPageParams): UseDocumentsPageResult => {
  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: [...DOCUMENTS_QUERY_KEY_BASE, params],
    queryFn: () => fetchDocumentsPage(params),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  })

  return { data, isLoading, isFetching, isError, error }
}
