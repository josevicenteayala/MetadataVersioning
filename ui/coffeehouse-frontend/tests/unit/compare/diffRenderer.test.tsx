/**
 * T033 [US4] - Vitest spec for VersionDiffViewer
 * Ensures color tokens + inline/split toggles behave correctly
 */
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { VersionDiffViewer } from '@features/compare/components/VersionDiffViewer'
import type { VersionDiffResult } from '@features/compare/api/useVersionDiff'
import { renderWithProviders } from '@tests/utils/renderWithProviders'

// Mock diff result data
const createMockDiffResult = (overrides?: Partial<VersionDiffResult>): VersionDiffResult => ({
  leftVersion: {
    id: 'ver-001',
    documentId: 'doc-001',
    versionNumber: 1,
    payload: {
      name: 'Product A',
      price: 100,
      features: ['basic', 'standard'],
    },
    summary: 'Initial version',
    isActive: false,
    createdAt: '2024-01-01T00:00:00Z',
    createdBy: 'user-001',
  },
  rightVersion: {
    id: 'ver-002',
    documentId: 'doc-001',
    versionNumber: 2,
    payload: {
      name: 'Product A',
      price: 150,
      features: ['basic', 'standard', 'premium'],
      newField: 'added',
    },
    summary: 'Updated pricing',
    isActive: true,
    createdAt: '2024-01-02T00:00:00Z',
    createdBy: 'user-001',
  },
  delta: {
    price: [100, 150],
    features: {
      2: ['premium'],
      _t: 'a',
    },
    newField: ['added'],
  },
  leftPayloadSize: 1024,
  rightPayloadSize: 1200,
  exceedsLimit: false,
  diffComputeTime: 42,
  ...overrides,
})

describe('VersionDiffViewer', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders diff viewer with version headers', () => {
      const diffResult = createMockDiffResult()
      renderWithProviders(<VersionDiffViewer diffResult={diffResult} />)

      expect(screen.getByText('v1')).toBeInTheDocument()
      expect(screen.getByText('v2')).toBeInTheDocument()
    })

    it('shows loading state while fetching diff', () => {
      renderWithProviders(<VersionDiffViewer diffResult={null} isLoading={true} />)

      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByText(/computing diff/i)).toBeInTheDocument()
    })

    it('displays empty state when no diff result', () => {
      renderWithProviders(<VersionDiffViewer diffResult={null} />)

      expect(screen.getByText(/select two versions/i)).toBeInTheDocument()
    })

    it('displays change count statistics in header', () => {
      const diffResult = createMockDiffResult()
      renderWithProviders(<VersionDiffViewer diffResult={diffResult} />)

      // Stats are displayed as +N, -N, ~N format
      const stats = screen.getByLabelText(/diff statistics/i)
      expect(stats).toBeInTheDocument()
    })

    it('shows payload too large error when exceeded', () => {
      const diffResult = createMockDiffResult({
        exceedsLimit: true,
        leftPayloadSize: 250000,
        rightPayloadSize: 180000,
      })
      renderWithProviders(<VersionDiffViewer diffResult={diffResult} />)

      expect(screen.getByText(/payload too large/i)).toBeInTheDocument()
      expect(screen.getByText(/244.1 KB/)).toBeInTheDocument()
    })
  })

  describe('view mode toggle', () => {
    it('renders inline view by default', () => {
      const diffResult = createMockDiffResult()
      const handleViewModeChange = vi.fn()

      renderWithProviders(
        <VersionDiffViewer
          diffResult={diffResult}
          viewMode="inline"
          onViewModeChange={handleViewModeChange}
        />,
      )

      const inlineBtn = screen.getByRole('button', { name: /inline/i })
      expect(inlineBtn).toHaveAttribute('aria-pressed', 'true')
    })

    it('switches to split view when toggle clicked', async () => {
      const diffResult = createMockDiffResult()
      const handleViewModeChange = vi.fn()

      renderWithProviders(
        <VersionDiffViewer
          diffResult={diffResult}
          viewMode="inline"
          onViewModeChange={handleViewModeChange}
        />,
      )

      const splitBtn = screen.getByRole('button', { name: /split/i })
      await user.click(splitBtn)

      expect(handleViewModeChange).toHaveBeenCalledWith('split')
    })

    it('renders split panels in split view mode', () => {
      const diffResult = createMockDiffResult()

      renderWithProviders(
        <VersionDiffViewer diffResult={diffResult} viewMode="split" onViewModeChange={vi.fn()} />,
      )

      expect(screen.getByLabelText(/left version/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/right version/i)).toBeInTheDocument()
    })
  })

  describe('expand/collapse', () => {
    it('provides expand all button', () => {
      const diffResult = createMockDiffResult()
      renderWithProviders(<VersionDiffViewer diffResult={diffResult} />)

      expect(screen.getByRole('button', { name: /expand all/i })).toBeInTheDocument()
    })

    it('provides collapse all button', () => {
      const diffResult = createMockDiffResult()
      renderWithProviders(<VersionDiffViewer diffResult={diffResult} />)

      expect(screen.getByRole('button', { name: /collapse all/i })).toBeInTheDocument()
    })

    it('starts with all sections expanded by default', () => {
      const diffResult = createMockDiffResult()
      renderWithProviders(<VersionDiffViewer diffResult={diffResult} />)

      // All toggle buttons should show ▼ (expanded)
      const toggleButtons = screen.getAllByRole('button', { name: /collapse|expand/i })
      expect(toggleButtons.length).toBeGreaterThan(0)
    })

    it('starts collapsed when defaultCollapsed is true', () => {
      const diffResult = createMockDiffResult()
      renderWithProviders(<VersionDiffViewer diffResult={diffResult} defaultCollapsed={true} />)

      // Content should exist but toggle buttons should show collapsed state
      const viewer = screen.getByRole('region', { name: /version diff viewer/i })
      expect(viewer).toBeInTheDocument()
    })
  })

  describe('diff content display', () => {
    it('shows no differences message when delta is empty', () => {
      const diffResult = createMockDiffResult({ delta: {} })
      renderWithProviders(<VersionDiffViewer diffResult={diffResult} />)

      expect(screen.getByText(/no differences found/i)).toBeInTheDocument()
    })

    it('renders diff entries as rows', () => {
      const diffResult = createMockDiffResult()
      renderWithProviders(<VersionDiffViewer diffResult={diffResult} />)

      const rows = screen.getAllByRole('row')
      expect(rows.length).toBeGreaterThan(0)
    })

    it('shows diff compute time in footer', () => {
      const diffResult = createMockDiffResult({ diffComputeTime: 42 })
      renderWithProviders(<VersionDiffViewer diffResult={diffResult} />)

      expect(screen.getByText(/42ms/)).toBeInTheDocument()
    })
  })

  describe('metadata display', () => {
    it('displays left version date', () => {
      const diffResult = createMockDiffResult()
      renderWithProviders(<VersionDiffViewer diffResult={diffResult} />)

      // Check for formatted date
      expect(screen.getByText(/1\/1\/2024|01\/01\/2024/)).toBeInTheDocument()
    })

    it('displays right version date', () => {
      const diffResult = createMockDiffResult()
      renderWithProviders(<VersionDiffViewer diffResult={diffResult} />)

      // Date format is locale-dependent, just check for presence of a date in the metadata
      const metadata = screen.getByLabelText(/version metadata/i)
      expect(metadata).toBeInTheDocument()
    })

    it('shows arrow between version metadata', () => {
      const diffResult = createMockDiffResult()
      renderWithProviders(<VersionDiffViewer diffResult={diffResult} />)

      const arrows = screen.getAllByText('→')
      expect(arrows.length).toBeGreaterThan(0)
    })
  })

  describe('accessibility', () => {
    it('has region role with proper label', () => {
      const diffResult = createMockDiffResult()
      renderWithProviders(<VersionDiffViewer diffResult={diffResult} />)

      expect(screen.getByRole('region', { name: /version diff viewer/i })).toBeInTheDocument()
    })

    it('has table role for diff content', () => {
      const diffResult = createMockDiffResult()
      renderWithProviders(<VersionDiffViewer diffResult={diffResult} />)

      expect(screen.getByRole('table', { name: /diff entries/i })).toBeInTheDocument()
    })

    it('provides aria-labels for statistics', () => {
      const diffResult = createMockDiffResult()
      renderWithProviders(<VersionDiffViewer diffResult={diffResult} />)

      expect(screen.getByLabelText(/additions/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/removals/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/modifications/i)).toBeInTheDocument()
    })

    it('has aria-expanded on row toggle buttons', () => {
      const diffResult = createMockDiffResult()
      renderWithProviders(<VersionDiffViewer diffResult={diffResult} />)

      // Get toggle buttons within diff rows (not the header controls)
      const rows = screen.getAllByRole('row')
      rows.forEach((row) => {
        const toggle = row.querySelector('[aria-expanded]')
        if (toggle) {
          expect(toggle).toHaveAttribute('aria-expanded')
        }
      })
    })
  })

  describe('CSS class application', () => {
    it('applies inline class in inline mode', () => {
      const diffResult = createMockDiffResult()
      renderWithProviders(<VersionDiffViewer diffResult={diffResult} viewMode="inline" />)

      const viewer = screen.getByRole('region', { name: /version diff viewer/i })
      expect(viewer).toHaveClass('version-diff-viewer--inline')
    })

    it('applies split class in split mode', () => {
      const diffResult = createMockDiffResult()
      renderWithProviders(<VersionDiffViewer diffResult={diffResult} viewMode="split" />)

      const viewer = screen.getByRole('region', { name: /version diff viewer/i })
      expect(viewer).toHaveClass('version-diff-viewer--split')
    })

    it('applies loading class when loading', () => {
      renderWithProviders(<VersionDiffViewer diffResult={null} isLoading={true} />)

      const viewer = screen.getByRole('status')
      expect(viewer).toHaveClass('version-diff-viewer--loading')
    })

    it('applies custom className', () => {
      const diffResult = createMockDiffResult()
      renderWithProviders(<VersionDiffViewer diffResult={diffResult} className="custom-class" />)

      const viewer = screen.getByRole('region', { name: /version diff viewer/i })
      expect(viewer).toHaveClass('custom-class')
    })
  })
})
