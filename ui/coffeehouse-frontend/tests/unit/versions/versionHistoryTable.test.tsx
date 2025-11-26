import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import VersionHistoryTable from '@features/versions/components/VersionHistoryTable'
import { renderWithProviders } from '@tests/utils/renderWithProviders'
import type { MetadataVersion } from '@features/versions/types'

const mockVersions: MetadataVersion[] = [
  {
    versionId: 'ver-001',
    documentId: 'doc-001',
    versionNumber: 3,
    status: 'active',
    createdBy: 'alice@example.com',
    createdAt: '2025-01-15T10:30:00Z',
    activatedAt: '2025-01-16T09:00:00Z',
    changeSummary: 'Added new pricing fields',
    payload: { pricing: { monthly: 99 } },
  },
  {
    versionId: 'ver-002',
    documentId: 'doc-001',
    versionNumber: 2,
    status: 'published',
    createdBy: 'bob@example.com',
    createdAt: '2025-01-10T08:15:00Z',
    activatedAt: '2025-01-12T14:30:00Z',
    changeSummary: 'Initial schema setup',
    payload: { base: true },
  },
  {
    versionId: 'ver-003',
    documentId: 'doc-001',
    versionNumber: 1,
    status: 'draft',
    createdBy: 'carol@example.com',
    createdAt: '2025-01-05T11:00:00Z',
    activatedAt: null,
    changeSummary: 'Draft for review',
    payload: {},
  },
]

describe('VersionHistoryTable', () => {
  const onRowClick = vi.fn()
  const onSort = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders version rows with correct data', () => {
      renderWithProviders(
        <VersionHistoryTable versions={mockVersions} onRowClick={onRowClick} onSort={onSort} />,
      )

      const rows = screen.getAllByTestId('version-history-row')
      expect(rows).toHaveLength(3)

      // Check first row (active version)
      const firstRow = rows[0]
      expect(within(firstRow).getByText('v3')).toBeInTheDocument()
      expect(within(firstRow).getByText('alice@example.com')).toBeInTheDocument()
      expect(within(firstRow).getByText('Added new pricing fields')).toBeInTheDocument()
      expect(within(firstRow).getByTestId('status-chip')).toHaveTextContent('Active')
    })

    it('renders status chips with correct styling classes', () => {
      renderWithProviders(
        <VersionHistoryTable versions={mockVersions} onRowClick={onRowClick} onSort={onSort} />,
      )

      const chips = screen.getAllByTestId('status-chip')
      expect(chips[0]).toHaveClass('status-chip--active')
      expect(chips[1]).toHaveClass('status-chip--published')
      expect(chips[2]).toHaveClass('status-chip--draft')
    })

    it('displays activation date for activated versions', () => {
      renderWithProviders(
        <VersionHistoryTable versions={mockVersions} onRowClick={onRowClick} onSort={onSort} />,
      )

      const rows = screen.getAllByTestId('version-history-row')

      // Active version should show activation date
      expect(within(rows[0]).getByText(/Jan 16, 2025/)).toBeInTheDocument()
      // Draft version should show dash for no activation
      expect(within(rows[2]).getByText('—')).toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('renders empty state when no versions exist', () => {
      renderWithProviders(
        <VersionHistoryTable versions={[]} onRowClick={onRowClick} onSort={onSort} />,
      )

      expect(screen.getByRole('heading', { name: /no versions yet/i })).toBeInTheDocument()
      expect(
        screen.getByText(/create the first version to start tracking changes/i),
      ).toBeInTheDocument()
      expect(screen.queryAllByTestId('version-history-row')).toHaveLength(0)
    })

    it('shows create version CTA in empty state', () => {
      renderWithProviders(
        <VersionHistoryTable versions={[]} onRowClick={onRowClick} onSort={onSort} />,
      )

      expect(screen.getByRole('button', { name: /create first version/i })).toBeInTheDocument()
    })
  })

  describe('sorting', () => {
    it('renders sortable column headers', () => {
      renderWithProviders(
        <VersionHistoryTable versions={mockVersions} onRowClick={onRowClick} onSort={onSort} />,
      )

      expect(screen.getByRole('columnheader', { name: /version/i })).toHaveAttribute('aria-sort')
      expect(screen.getByRole('columnheader', { name: /created/i })).toHaveAttribute('aria-sort')
      expect(screen.getByRole('columnheader', { name: /status/i })).toHaveAttribute('aria-sort')
    })

    it('calls onSort with column key when header is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <VersionHistoryTable
          versions={mockVersions}
          onRowClick={onRowClick}
          onSort={onSort}
          sortBy="createdAt"
          sortDir="desc"
        />,
      )

      const versionHeader = screen.getByRole('columnheader', { name: /version/i })
      await user.click(versionHeader)

      expect(onSort).toHaveBeenCalledWith('versionNumber')
    })

    it('displays sort indicator on active sort column', () => {
      renderWithProviders(
        <VersionHistoryTable
          versions={mockVersions}
          onRowClick={onRowClick}
          onSort={onSort}
          sortBy="createdAt"
          sortDir="desc"
        />,
      )

      const createdHeader = screen.getByRole('columnheader', { name: /created/i })
      expect(createdHeader).toHaveAttribute('aria-sort', 'descending')
    })

    it('toggles sort direction when same column is clicked twice', async () => {
      const user = userEvent.setup()
      const { rerender } = renderWithProviders(
        <VersionHistoryTable
          versions={mockVersions}
          onRowClick={onRowClick}
          onSort={onSort}
          sortBy="createdAt"
          sortDir="asc"
        />,
      )

      const createdHeader = screen.getByRole('columnheader', { name: /created/i })
      await user.click(createdHeader)

      expect(onSort).toHaveBeenCalledWith('createdAt')

      // Simulate parent toggling direction and re-rendering
      rerender(
        <VersionHistoryTable
          versions={mockVersions}
          onRowClick={onRowClick}
          onSort={onSort}
          sortBy="createdAt"
          sortDir="desc"
        />,
      )

      expect(createdHeader).toHaveAttribute('aria-sort', 'descending')
    })
  })

  describe('row interactions', () => {
    it('calls onRowClick when a row is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <VersionHistoryTable versions={mockVersions} onRowClick={onRowClick} onSort={onSort} />,
      )

      const rows = screen.getAllByTestId('version-history-row')
      await user.click(rows[0])

      expect(onRowClick).toHaveBeenCalledWith(mockVersions[0])
    })

    it('supports keyboard navigation with Enter key', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <VersionHistoryTable versions={mockVersions} onRowClick={onRowClick} onSort={onSort} />,
      )

      const rows = screen.getAllByTestId('version-history-row')
      rows[1].focus()
      await user.keyboard('{Enter}')

      expect(onRowClick).toHaveBeenCalledWith(mockVersions[1])
    })

    it('supports keyboard navigation with Space key', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <VersionHistoryTable versions={mockVersions} onRowClick={onRowClick} onSort={onSort} />,
      )

      const rows = screen.getAllByTestId('version-history-row')
      rows[2].focus()
      await user.keyboard(' ')

      expect(onRowClick).toHaveBeenCalledWith(mockVersions[2])
    })

    it('does not call onRowClick when onRowClick is undefined', async () => {
      const user = userEvent.setup()
      renderWithProviders(<VersionHistoryTable versions={mockVersions} onSort={onSort} />)

      const rows = screen.getAllByTestId('version-history-row')
      await user.click(rows[0])

      expect(onRowClick).not.toHaveBeenCalled()
    })
  })

  describe('loading state', () => {
    it('renders skeleton rows when loading', () => {
      renderWithProviders(
        <VersionHistoryTable versions={[]} onRowClick={onRowClick} onSort={onSort} isLoading />,
      )

      expect(screen.getByLabelText(/loading version history/i)).toBeInTheDocument()
      expect(screen.getAllByTestId('version-skeleton-row')).toHaveLength(5)
    })

    it('sets aria-busy when loading', () => {
      renderWithProviders(
        <VersionHistoryTable versions={[]} onRowClick={onRowClick} onSort={onSort} isLoading />,
      )

      expect(screen.getByRole('region')).toHaveAttribute('aria-busy', 'true')
    })
  })

  describe('accessibility', () => {
    it('has correct table ARIA attributes', () => {
      renderWithProviders(
        <VersionHistoryTable versions={mockVersions} onRowClick={onRowClick} onSort={onSort} />,
      )

      expect(screen.getByRole('table')).toHaveAttribute('aria-label', 'Version history')
    })

    it('rows are focusable when onRowClick is provided', () => {
      renderWithProviders(
        <VersionHistoryTable versions={mockVersions} onRowClick={onRowClick} onSort={onSort} />,
      )

      const rows = screen.getAllByTestId('version-history-row')
      rows.forEach((row) => {
        expect(row).toHaveAttribute('tabIndex', '0')
      })
    })

    it('rows are not focusable when onRowClick is not provided', () => {
      renderWithProviders(<VersionHistoryTable versions={mockVersions} onSort={onSort} />)

      const rows = screen.getAllByTestId('version-history-row')
      rows.forEach((row) => {
        expect(row).not.toHaveAttribute('tabIndex')
      })
    })
  })
})
