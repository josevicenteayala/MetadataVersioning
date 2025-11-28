import { useMemo } from 'react'
import { useDashboardStats } from '@features/dashboard/api/useDashboardStats'

const formatNumber = (value: number) => new Intl.NumberFormat('en-US').format(value)

export interface DashboardHeroProps {
  /** Callback invoked when user clicks the create document CTA */
  onCreateDocument?: () => void
}

const DashboardHero = ({ onCreateDocument }: DashboardHeroProps) => {
  const { data, isLoading } = useDashboardStats()
  const hasDocuments = (data?.totalDocuments ?? 0) > 0

  const metrics = useMemo(() => {
    if (!data) {
      return []
    }

    return [
      {
        id: 'total-documents',
        label: 'Total documents',
        value: formatNumber(data.totalDocuments),
        testId: 'dashboard-hero-metric-total-documents',
      },
      {
        id: 'active-versions',
        label: 'Active versions',
        value: formatNumber(data.activeVersions),
        testId: 'dashboard-hero-metric-active-versions',
      },
      {
        id: 'drafts-awaiting-review',
        label: 'Drafts awaiting review',
        value: formatNumber(data.draftsAwaitingReview),
        testId: 'dashboard-hero-metric-drafts-awaiting-review',
      },
    ]
  }, [data])

  if (isLoading) {
    return (
      <section aria-busy="true" aria-live="polite">
        <p>Loading dashboard summary…</p>
      </section>
    )
  }

  if (!hasDocuments) {
    return (
      <section aria-live="polite" className="dashboard-hero">
        <div className="dashboard-hero__empty">
          <p className="eyebrow">Dashboard</p>
          <h2>No metadata documents yet</h2>
          <p>Share credentials and create your first metadata draft to light up this view.</p>
          <button
            type="button"
            className="dashboard-hero__cta"
            onClick={onCreateDocument}
            aria-label="Add first metadata document"
          >
            Add first metadata document
          </button>
        </div>
      </section>
    )
  }

  return (
    <section aria-live="polite" className="dashboard-hero">
      <header className="dashboard-hero__header">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h2>Metadata overview</h2>
          {data?.lastRefreshedAt ? (
            <p className="muted" role="status">
              Refreshed {new Date(data.lastRefreshedAt).toLocaleString()}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className="dashboard-hero__cta"
          onClick={onCreateDocument}
          aria-label="Create metadata draft"
        >
          Create metadata draft
        </button>
      </header>
      <div className="dashboard-hero__metrics" role="list">
        {metrics.map((metric) => (
          <div
            role="listitem"
            key={metric.id}
            className="dashboard-hero__metric"
            data-testid={metric.testId}
          >
            <p className="metric-label">{metric.label}</p>
            <p className="metric-value">{metric.value}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default DashboardHero
