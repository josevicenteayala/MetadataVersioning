import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import DashboardHero from '@features/dashboard/components/DashboardHero'
import { renderWithProviders } from '@tests/utils/renderWithProviders'
import { useDashboardStats } from '@features/dashboard/api/useDashboardStats'

vi.mock('@features/dashboard/api/useDashboardStats', () => ({
  useDashboardStats: vi.fn(),
}))

const mockUseDashboardStats = vi.mocked(useDashboardStats)

describe('DashboardHero', () => {
  beforeEach(() => {
    mockUseDashboardStats.mockReset()
  })

  it('renders KPI metrics when stats are available', () => {
    mockUseDashboardStats.mockReturnValue({
      data: {
        totalDocuments: 72,
        activeVersions: 18,
        draftsAwaitingReview: 5,
        lastRefreshedAt: '2025-11-24T11:00:00Z',
      },
      isLoading: false,
      isError: false,
    })

    renderWithProviders(<DashboardHero />)

    expect(screen.getByRole('heading', { name: /metadata overview/i })).toBeInTheDocument()
    expect(screen.getByTestId('dashboard-hero-metric-total-documents')).toHaveTextContent('72')
    expect(screen.getByTestId('dashboard-hero-metric-active-versions')).toHaveTextContent('18')
    expect(screen.getByTestId('dashboard-hero-metric-drafts-awaiting-review')).toHaveTextContent(
      '5',
    )
    expect(screen.getByRole('button', { name: /create metadata draft/i })).toBeEnabled()
  })

  it('renders empty state guidance when no documents exist', () => {
    mockUseDashboardStats.mockReturnValue({
      data: {
        totalDocuments: 0,
        activeVersions: 0,
        draftsAwaitingReview: 0,
        lastRefreshedAt: null,
      },
      isLoading: false,
      isError: false,
    })

    renderWithProviders(<DashboardHero />)

    expect(screen.getByRole('heading', { name: /no metadata documents yet/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add first metadata document/i })).toBeInTheDocument()
    expect(screen.queryByTestId('dashboard-hero-metric-total-documents')).not.toBeInTheDocument()
  })
})
