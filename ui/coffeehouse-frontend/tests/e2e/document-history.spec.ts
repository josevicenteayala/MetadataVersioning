import { test, expect } from '@playwright/test'

test.describe('Document History Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a specific document detail page
    await page.goto('/documents/doc-001')
    await page.waitForSelector('[data-testid="document-detail"]')
  })

  test.describe('version history table', () => {
    test('displays version history with chronological order', async ({ page }) => {
      const table = page.getByRole('table', { name: /version history/i })
      await expect(table).toBeVisible()

      // Should have header row + version rows
      const rows = page.getByTestId('version-history-row')
      await expect(rows).toHaveCount(3)

      // First row should be the latest version
      const firstRow = rows.first()
      await expect(firstRow).toContainText('v3')
      await expect(firstRow.getByTestId('status-chip')).toContainText('Active')
    })

    test('shows status chips with correct colors for each status', async ({ page }) => {
      const activeChip = page.getByTestId('status-chip').filter({ hasText: 'Active' })
      const publishedChip = page.getByTestId('status-chip').filter({ hasText: 'Published' })
      const draftChip = page.getByTestId('status-chip').filter({ hasText: 'Draft' })

      await expect(activeChip).toBeVisible()
      await expect(publishedChip).toBeVisible()
      await expect(draftChip).toBeVisible()

      // Verify CSS classes are applied
      await expect(activeChip).toHaveClass(/status-chip--active/)
      await expect(publishedChip).toHaveClass(/status-chip--published/)
      await expect(draftChip).toHaveClass(/status-chip--draft/)
    })

    test('displays activation date for activated versions', async ({ page }) => {
      const activeRow = page.getByTestId('version-history-row').first()
      await expect(activeRow.locator('.version-activated-at')).toContainText(/Jan/)

      const draftRow = page.getByTestId('version-history-row').last()
      await expect(draftRow.locator('.version-activated-at')).toContainText('—')
    })

    test('supports sorting by column headers', async ({ page }) => {
      // Click on version column header to sort
      const versionHeader = page.getByRole('columnheader', { name: /version/i })
      await versionHeader.click()

      // After click, first row should now show v1 (ascending)
      await expect(versionHeader).toHaveAttribute('aria-sort', 'ascending')
      const rows = page.getByTestId('version-history-row')
      await expect(rows.first()).toContainText('v1')

      // Click again to reverse sort
      await versionHeader.click()
      await expect(versionHeader).toHaveAttribute('aria-sort', 'descending')
      await expect(rows.first()).toContainText('v3')
    })
  })

  test.describe('version detail drawer', () => {
    test('opens drawer when clicking a version row', async ({ page }) => {
      const row = page.getByTestId('version-history-row').first()
      await row.click()

      const drawer = page.getByTestId('version-detail-drawer')
      await expect(drawer).toBeVisible()
      await expect(drawer).toContainText('Version Details')
    })

    test('displays correlation ID from last operation', async ({ page }) => {
      const row = page.getByTestId('version-history-row').first()
      await row.click()

      const drawer = page.getByTestId('version-detail-drawer')
      await expect(drawer.getByTestId('correlation-id')).toBeVisible()
      await expect(drawer.getByTestId('correlation-id')).toContainText(/[a-f0-9-]{36}/i)
    })

    test('shows activation eligibility status', async ({ page }) => {
      // Click draft row (should show eligible)
      const draftRow = page.getByTestId('version-history-row').last()
      await draftRow.click()

      const drawer = page.getByTestId('version-detail-drawer')
      await expect(drawer.getByTestId('activation-eligibility')).toContainText(
        /eligible for activation/i,
      )

      // Close drawer
      await page.keyboard.press('Escape')

      // Click active row (should show not eligible)
      const activeRow = page.getByTestId('version-history-row').first()
      await activeRow.click()

      await expect(drawer.getByTestId('activation-eligibility')).toContainText(
        /currently active/i,
      )
    })

    test('displays payload preview in JSON format', async ({ page }) => {
      const row = page.getByTestId('version-history-row').first()
      await row.click()

      const drawer = page.getByTestId('version-detail-drawer')
      const payloadSection = drawer.getByTestId('payload-preview')
      await expect(payloadSection).toBeVisible()
      await expect(payloadSection).toContainText('{')
      await expect(payloadSection).toContainText('pricing')
    })

    test('closes drawer with Escape key', async ({ page }) => {
      const row = page.getByTestId('version-history-row').first()
      await row.click()

      const drawer = page.getByTestId('version-detail-drawer')
      await expect(drawer).toBeVisible()

      await page.keyboard.press('Escape')
      await expect(drawer).not.toBeVisible()
    })

    test('closes drawer with close button', async ({ page }) => {
      const row = page.getByTestId('version-history-row').first()
      await row.click()

      const drawer = page.getByTestId('version-detail-drawer')
      await drawer.getByRole('button', { name: /close/i }).click()

      await expect(drawer).not.toBeVisible()
    })
  })

  test.describe('deep linking', () => {
    test('opens specific version from URL query parameter', async ({ page }) => {
      await page.goto('/documents/doc-001?version=ver-002')

      const drawer = page.getByTestId('version-detail-drawer')
      await expect(drawer).toBeVisible()
      await expect(drawer).toContainText('v2')
    })

    test('highlights the linked version row', async ({ page }) => {
      await page.goto('/documents/doc-001?version=ver-002')

      const rows = page.getByTestId('version-history-row')
      const highlightedRow = rows.filter({ has: page.locator('.version-row--highlighted') })
      await expect(highlightedRow).toContainText('v2')
    })
  })

  test.describe('document header', () => {
    test('displays document name and metadata', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Product Catalog')
      await expect(page.getByTestId('document-type')).toContainText('API_CONFIG')
    })

    test('shows active version badge in header', async ({ page }) => {
      const badge = page.getByTestId('active-version-badge')
      await expect(badge).toBeVisible()
      await expect(badge).toContainText('v3')
    })

    test('displays total version count', async ({ page }) => {
      await expect(page.getByTestId('version-count')).toContainText('3 versions')
    })
  })

  test.describe('navigation', () => {
    test('breadcrumb links back to dashboard', async ({ page }) => {
      const breadcrumb = page.getByRole('navigation', { name: /breadcrumb/i })
      await expect(breadcrumb).toBeVisible()

      await breadcrumb.getByRole('link', { name: /documents/i }).click()
      await expect(page).toHaveURL(/\/dashboard/)
    })

    test('keyboard navigation through version rows', async ({ page }) => {
      const rows = page.getByTestId('version-history-row')

      // Focus first row and navigate with arrow keys
      await rows.first().focus()
      await page.keyboard.press('ArrowDown')

      // Second row should now be focused
      await expect(rows.nth(1)).toBeFocused()

      // Press Enter to open drawer
      await page.keyboard.press('Enter')
      await expect(page.getByTestId('version-detail-drawer')).toBeVisible()
    })
  })

  test.describe('responsive behavior', () => {
    test('collapses table to cards on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      // Table should be hidden, cards should be visible
      await expect(page.getByRole('table')).not.toBeVisible()
      await expect(page.getByTestId('version-card')).toHaveCount(3)
    })

    test('version cards show all essential info on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      const firstCard = page.getByTestId('version-card').first()
      await expect(firstCard).toContainText('v3')
      await expect(firstCard).toContainText('Active')
      await expect(firstCard).toContainText('alice@example.com')
    })
  })

  test.describe('empty state', () => {
    test('shows empty state when document has no versions', async ({ page }) => {
      await page.goto('/documents/doc-empty')

      await expect(page.getByRole('heading', { name: /no versions yet/i })).toBeVisible()
      await expect(
        page.getByRole('button', { name: /create first version/i }),
      ).toBeVisible()
    })
  })

  test.describe('error handling', () => {
    test('shows error state when document not found', async ({ page }) => {
      await page.goto('/documents/invalid-doc-id')

      await expect(page.getByRole('alert')).toContainText(/document not found/i)
    })

    test('displays correlation ID on API errors', async ({ page }) => {
      // Mock API to return 500 error
      await page.route('**/api/v1/metadata/doc-error/versions', (route) =>
        route.fulfill({
          status: 500,
          headers: { 'X-Correlation-ID': 'corr-12345-error' },
          body: JSON.stringify({ message: 'Internal server error' }),
        }),
      )

      await page.goto('/documents/doc-error')

      await expect(page.getByRole('alert')).toContainText(/error loading versions/i)
      await expect(page.getByTestId('error-correlation-id')).toContainText('corr-12345-error')
    })
  })

  test.describe('loading states', () => {
    test('shows skeleton loader while fetching versions', async ({ page }) => {
      // Delay the API response
      await page.route('**/api/v1/metadata/doc-001/versions', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        await route.continue()
      })

      await page.goto('/documents/doc-001')

      await expect(page.getByTestId('version-skeleton-row')).toHaveCount(5)
      await expect(page.getByRole('region')).toHaveAttribute('aria-busy', 'true')
    })
  })
})
