import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { httpClient } from '@services/api/httpClient'
import type { MetadataDocumentResponse } from '@services/generated/models/MetadataDocumentResponse'

export interface DocumentsPageParams {
  type?: string
  page?: number
  size?: number
  search?: string
}

export interface DocumentsPageResult {
  documents: MetadataDocumentResponse[]
  totalPages: number
  totalElements: number
  hasMore: boolean
}

export interface UseDocumentsPageResult {
  data: DocumentsPageResult | undefined
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  error: unknown
}

interface PagedDocumentResponse {
  content?: MetadataDocumentResponse[]
  totalPages?: number
  totalElements?: number
  last?: boolean
}

const DOCUMENTS_QUERY_KEY_BASE = ['documents', 'page'] as const

const fetchDocumentsPage = async (params: DocumentsPageParams): Promise<DocumentsPageResult> => {
  // The backend returns a Spring Data Page object
  const { data } = await httpClient.get<PagedDocumentResponse>('/api/v1/metadata', {
    params: {
      type: params.type,
      page: params.page ?? 0,
      size: params.size ?? 20,
      search: params.search ?? undefined,
    },
  })

  return {
    documents: data.content ?? [],
    totalPages: data.totalPages ?? 0,
    totalElements: data.totalElements ?? 0,
    hasMore: Boolean(!data.last),
  }
}

/**
 * Paginated document list hook (T016).
 *
 * Supports page-based pagination with type and search filters. Results stay on screen
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
