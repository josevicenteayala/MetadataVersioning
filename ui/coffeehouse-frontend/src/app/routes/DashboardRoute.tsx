import { useCallback, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardHero from '@features/dashboard/components/DashboardHero'
import DocumentsTable from '@features/documents/components/DocumentsTable'
import CreateDocumentModal from '@features/documents/components/CreateDocumentModal'
import { useDocumentsPage } from '@features/documents/api/useDocumentsPage'
import type { MetadataDocumentResponse } from '@services/generated/models/MetadataDocumentResponse'

const DashboardRoute = () => {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPage(0) // Reset to first page on new search
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const { data, isLoading, isFetching } = useDocumentsPage({ 
    page, 
    size: 20, 
    search: debouncedSearch 
  })

  const handleNext = () => {
    if (data?.hasMore) {
      setPage((p) => p + 1)
    }
  }

  const handlePrev = () => {
    setPage((p) => Math.max(0, p - 1))
  }

  const handleRowClick = useCallback(
    (doc: MetadataDocumentResponse) => {
      void navigate(`/documents/${doc.id}`)
    },
    [navigate],
  )

  const handleOpenCreateModal = useCallback(() => {
    setIsCreateModalOpen(true)
  }, [])

  const handleCloseCreateModal = useCallback(() => {
    setIsCreateModalOpen(false)
  }, [])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  return (
    <div className="dashboard-route">
      <DashboardHero onCreateDocument={handleOpenCreateModal} />

      <section className="dashboard-route__list">
        <header className="dashboard-route__list-header">
          <h2>Documents</h2>
          <input
            type="search"
            placeholder="Search documents…"
            className="dashboard-route__search"
            aria-label="Search documents"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </header>

        <DocumentsTable
          documents={data?.documents ?? []}
          isLoading={isLoading}
          onRowClick={handleRowClick}
        />

        <nav className="dashboard-route__pagination" aria-label="Pagination">
          <button type="button" onClick={handlePrev} disabled={page === 0 || isFetching}>
            Previous
          </button>
          <span data-testid="pagination-info">
            {isFetching ? 'Loading…' : `${data?.totalElements ?? 0} documents`}
          </span>
          <button
            type="button"
            onClick={handleNext}
            disabled={!data?.hasMore || isFetching}
            aria-label="Next page"
          >
            Next
          </button>
        </nav>
      </section>

      {/* Create Document Modal */}
      <CreateDocumentModal isOpen={isCreateModalOpen} onClose={handleCloseCreateModal} />
    </div>
  )
}

export default DashboardRoute
