import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardHero from '@features/dashboard/components/DashboardHero'
import DocumentsTable from '@features/documents/components/DocumentsTable'
import CreateDocumentModal from '@features/documents/components/CreateDocumentModal'
import { useDocumentsPage } from '@features/documents/api/useDocumentsPage'
import type { MetadataDocumentResponse } from '@services/generated/models/MetadataDocumentResponse'

const DashboardRoute = () => {
  const navigate = useNavigate()
  const [cursor, setCursor] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const { data, isLoading, isFetching } = useDocumentsPage({ limit: 20, cursor })

  const handleNext = () => {
    if (data?.hasMore && data.cursor) {
      setCursor(data.cursor)
    }
  }

  const handlePrev = () => {
    // Cursor-based APIs typically don't support backward navigation
    // For a real implementation, track page stack or switch to offset pagination
    setCursor(null)
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
            disabled // Search wiring pending
          />
        </header>

        <DocumentsTable
          documents={data?.documents ?? []}
          isLoading={isLoading}
          onRowClick={handleRowClick}
        />

        <nav className="dashboard-route__pagination" aria-label="Pagination">
          <button type="button" onClick={handlePrev} disabled={!cursor || isFetching}>
            Previous
          </button>
          <span data-testid="pagination-info">
            {isFetching ? 'Loading…' : `${data?.documents.length ?? 0} shown`}
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
