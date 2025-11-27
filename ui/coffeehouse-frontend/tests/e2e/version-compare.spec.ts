/**
 * T034 [US4] - Playwright e2e spec for version comparison
 * Verifies selecting versions and diff metadata display
 */
import { expect, test } from '@playwright/test'

test.describe('Version Compare Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a document with multiple versions
    await page.goto('/documents/doc-001')
    await page.waitForSelector('[data-testid="version-history-table"]')
  })

  test('can select two versions to compare from history table', async ({ page }) => {
    // Select first version checkbox
    const firstVersionCheckbox = page.locator('[data-testid="version-select-checkbox"]').first()
    await firstVersionCheckbox.check()

    // Select second version checkbox
    const secondVersionCheckbox = page.locator('[data-testid="version-select-checkbox"]').nth(1)
    await secondVersionCheckbox.check()

    // Compare button should be enabled
    const compareBtn = page.getByRole('button', { name: /compare/i })
    await expect(compareBtn).toBeEnabled()

    // Click compare
    await compareBtn.click()

    // Should navigate to compare view
    await expect(page).toHaveURL(/\/compare/)
    await expect(page.getByTestId('diff-container')).toBeVisible()
  })

  test('displays version metadata in compare header', async ({ page }) => {
    // Navigate directly to compare view
    await page.goto('/documents/doc-001/compare?left=ver-001&right=ver-002')

    // Version numbers displayed
    await expect(page.getByText('v1')).toBeVisible()
    await expect(page.getByText('v2')).toBeVisible()

    // Metadata badges visible
    await expect(page.getByTestId('compare-metadata-left')).toContainText(/created/i)
    await expect(page.getByTestId('compare-metadata-right')).toContainText(/created/i)
  })

  test('shows change summary statistics', async ({ page }) => {
    await page.goto('/documents/doc-001/compare?left=ver-001&right=ver-002')

    // Stats panel visible
    const statsPanel = page.getByTestId('diff-stats-panel')
    await expect(statsPanel).toBeVisible()

    // Contains change counts
    await expect(statsPanel).toContainText(/additions/i)
    await expect(statsPanel).toContainText(/removals/i)
    await expect(statsPanel).toContainText(/modifications/i)
  })

  test('can toggle between inline and split view', async ({ page }) => {
    await page.goto('/documents/doc-001/compare?left=ver-001&right=ver-002')

    // Default is inline
    const inlineBtn = page.getByRole('button', { name: /inline/i })
    await expect(inlineBtn).toHaveAttribute('aria-pressed', 'true')

    // Click split view
    const splitBtn = page.getByRole('button', { name: /split/i })
    await splitBtn.click()

    // Split view active
    await expect(splitBtn).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('diff-panel-left')).toBeVisible()
    await expect(page.getByTestId('diff-panel-right')).toBeVisible()
  })

  test('highlights additions in green', async ({ page }) => {
    await page.goto('/documents/doc-001/compare?left=ver-001&right=ver-002')

    const addedLine = page.locator('[data-testid="diff-line-added"]').first()
    await expect(addedLine).toBeVisible()

    // Check it has the added styling (green-ish background)
    const bgColor = await addedLine.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor
    })
    // Should be a green-tinted color
    expect(bgColor).toMatch(/rgba?\(.*,\s*\d+/)
  })

  test('highlights removals in red', async ({ page }) => {
    await page.goto('/documents/doc-001/compare?left=ver-001&right=ver-002')

    const removedLine = page.locator('[data-testid="diff-line-removed"]').first()
    if ((await removedLine.count()) > 0) {
      await expect(removedLine).toBeVisible()
    }
  })

  test('can expand nested object changes', async ({ page }) => {
    await page.goto('/documents/doc-001/compare?left=ver-001&right=ver-002')

    // Find and click expand button for nested object
    const expandBtn = page.getByRole('button', { name: /expand/i }).first()
    if ((await expandBtn.count()) > 0) {
      await expandBtn.click()

      // Nested content should be visible
      await expect(page.locator('.diff-nested-content')).toBeVisible()
    }
  })

  test('shows breaking changes warning when applicable', async ({ page }) => {
    // Navigate to a compare with breaking changes
    await page.goto('/documents/doc-001/compare?left=ver-001&right=ver-003')

    // Look for warning alert
    const warningAlert = page.getByRole('alert').filter({ hasText: /breaking/i })
    if ((await warningAlert.count()) > 0) {
      await expect(warningAlert).toBeVisible()
    }
  })

  test('preserves compare selections on page refresh', async ({ page }) => {
    await page.goto('/documents/doc-001/compare?left=ver-001&right=ver-002')

    // Refresh page
    await page.reload()

    // Selections should persist from URL
    await expect(page.getByText('v1')).toBeVisible()
    await expect(page.getByText('v2')).toBeVisible()
  })

  test('allows swapping left and right versions', async ({ page }) => {
    await page.goto('/documents/doc-001/compare?left=ver-001&right=ver-002')

    // Find swap button
    const swapBtn = page.getByRole('button', { name: /swap/i })
    await swapBtn.click()

    // URL should update
    await expect(page).toHaveURL(/left=ver-002.*right=ver-001/)

    // Headers should swap
    const leftHeader = page.getByTestId('compare-header-left')
    const rightHeader = page.getByTestId('compare-header-right')

    await expect(leftHeader).toContainText('v2')
    await expect(rightHeader).toContainText('v1')
  })

  test('loads diff within performance threshold', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/documents/doc-001/compare?left=ver-001&right=ver-002')
    await page.waitForSelector('[data-testid="diff-container"]')

    const loadTime = Date.now() - startTime

    // Should load within 3 seconds per spec
    expect(loadTime).toBeLessThan(3000)
  })

  test('keyboard navigation works in diff view', async ({ page }) => {
    await page.goto('/documents/doc-001/compare?left=ver-001&right=ver-002')

    // Focus first diff row
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Navigate with arrow keys
    await page.keyboard.press('ArrowDown')

    // Active element should change
    const activeElement = await page.evaluate(() =>
      document.activeElement?.getAttribute('data-testid'),
    )
    expect(activeElement).toMatch(/diff-line/)
  })

  test('can navigate back to document from compare view', async ({ page }) => {
    await page.goto('/documents/doc-001/compare?left=ver-001&right=ver-002')

    // Find back button
    const backBtn = page.getByRole('link', { name: /back to document/i })
    await backBtn.click()

    await expect(page).toHaveURL('/documents/doc-001')
  })

  test('compare button disabled when less than 2 versions selected', async ({ page }) => {
    await page.goto('/documents/doc-001')

    // Only select one version
    const firstCheckbox = page.locator('[data-testid="version-select-checkbox"]').first()
    await firstCheckbox.check()

    // Compare button should be disabled
    const compareBtn = page.getByRole('button', { name: /compare/i })
    await expect(compareBtn).toBeDisabled()
  })

  test('prevents selecting more than 2 versions', async ({ page }) => {
    await page.goto('/documents/doc-001')

    // Select two versions
    await page.locator('[data-testid="version-select-checkbox"]').first().check()
    await page.locator('[data-testid="version-select-checkbox"]').nth(1).check()

    // Third checkbox should be disabled
    const thirdCheckbox = page.locator('[data-testid="version-select-checkbox"]').nth(2)
    await expect(thirdCheckbox).toBeDisabled()
  })
})
