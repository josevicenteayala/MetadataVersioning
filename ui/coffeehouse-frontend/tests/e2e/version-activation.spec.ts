import { test, expect } from '@playwright/test'

test.describe('Version Activation Flow', () => {
  test.describe('Create Version', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to document detail page
      await page.goto('/documents/doc-001')
      await page.waitForSelector('[data-testid="document-detail"]')
    })

    test('opens create version modal from document header', async ({ page }) => {
      const createBtn = page.getByRole('button', { name: /create new version/i })
      await createBtn.click()

      const modal = page.getByRole('dialog', { name: /create new version/i })
      await expect(modal).toBeVisible()
      await expect(modal.getByLabelText(/json payload/i)).toBeVisible()
      await expect(modal.getByLabelText(/change summary/i)).toBeVisible()
    })

    test('creates a draft version with valid payload', async ({ page }) => {
      // Open form
      await page.getByRole('button', { name: /create new version/i }).click()

      const modal = page.getByRole('dialog')

      // Fill in form
      await modal.getByLabelText(/json payload/i).fill('{"newField": "newValue"}')
      await modal.getByLabelText(/change summary/i).fill('Added new configuration field')

      // Submit
      await modal.getByRole('button', { name: /create draft/i }).click()

      // Verify success toast
      await expect(page.getByRole('status')).toContainText(/version.*created/i)

      // Modal should close
      await expect(modal).not.toBeVisible()

      // New version should appear in history table
      const historyTable = page.getByRole('table', { name: /version history/i })
      await expect(historyTable).toContainText('Draft')
      await expect(historyTable).toContainText('Added new configuration field')
    })

    test('shows validation error for invalid JSON', async ({ page }) => {
      await page.getByRole('button', { name: /create new version/i }).click()

      const modal = page.getByRole('dialog')
      const payloadInput = modal.getByLabelText(/json payload/i)

      await payloadInput.fill('{ invalid json }')
      await payloadInput.blur()

      await expect(modal.getByText(/invalid json syntax/i)).toBeVisible()

      // Submit button should be disabled or show error on click
      await modal.getByRole('button', { name: /create draft/i }).click()
      await expect(modal).toBeVisible() // Modal stays open
    })

    test('shows character count for summary', async ({ page }) => {
      await page.getByRole('button', { name: /create new version/i }).click()

      const modal = page.getByRole('dialog')
      const summaryInput = modal.getByLabelText(/change summary/i)

      await summaryInput.fill('Short summary')

      await expect(modal.getByText(/13 \/ 500/)).toBeVisible()
    })

    test('cancels form and discards changes', async ({ page }) => {
      await page.getByRole('button', { name: /create new version/i }).click()

      const modal = page.getByRole('dialog')

      // Fill in some data
      await modal.getByLabelText(/json payload/i).fill('{"test": true}')
      await modal.getByLabelText(/change summary/i).fill('Test change')

      // Cancel
      await modal.getByRole('button', { name: /cancel/i }).click()

      // Modal should close
      await expect(modal).not.toBeVisible()

      // Re-open should show empty form
      await page.getByRole('button', { name: /create new version/i }).click()
      await expect(modal.getByLabelText(/json payload/i)).toHaveValue('')
    })

    test('formats JSON with format button', async ({ page }) => {
      await page.getByRole('button', { name: /create new version/i }).click()

      const modal = page.getByRole('dialog')
      const payloadInput = modal.getByLabelText(/json payload/i)

      await payloadInput.fill('{"a":1,"b":2}')
      await modal.getByRole('button', { name: /format json/i }).click()

      const formatted = await payloadInput.inputValue()
      expect(formatted).toContain('\n') // Should be prettified
    })
  })

  test.describe('Activate Version', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/documents/doc-001')
      await page.waitForSelector('[data-testid="document-detail"]')
    })

    test('shows activate button for draft version', async ({ page }) => {
      // Click on a draft version row
      const draftRow = page.getByTestId('version-history-row').filter({ hasText: 'Draft' }).first()
      await draftRow.click()

      const drawer = page.getByTestId('version-detail-drawer')
      await expect(drawer.getByRole('button', { name: /activate version/i })).toBeVisible()
    })

    test('hides activate button for already active version', async ({ page }) => {
      // Click on active version row
      const activeRow = page
        .getByTestId('version-history-row')
        .filter({ hasText: 'Active' })
        .first()
      await activeRow.click()

      const drawer = page.getByTestId('version-detail-drawer')
      await expect(drawer.getByRole('button', { name: /activate version/i })).not.toBeVisible()
    })

    test('opens confirmation modal when clicking activate', async ({ page }) => {
      const draftRow = page.getByTestId('version-history-row').filter({ hasText: 'Draft' }).first()
      await draftRow.click()

      const drawer = page.getByTestId('version-detail-drawer')
      await drawer.getByRole('button', { name: /activate version/i }).click()

      const confirmModal = page.getByRole('dialog', { name: /confirm activation/i })
      await expect(confirmModal).toBeVisible()
      await expect(confirmModal).toContainText(/are you sure/i)
      await expect(confirmModal.getByRole('button', { name: /confirm/i })).toBeVisible()
      await expect(confirmModal.getByRole('button', { name: /cancel/i })).toBeVisible()
    })

    test('activates version after confirmation', async ({ page }) => {
      const draftRow = page.getByTestId('version-history-row').filter({ hasText: 'Draft' }).first()
      await draftRow.click()

      const drawer = page.getByTestId('version-detail-drawer')
      await drawer.getByRole('button', { name: /activate version/i }).click()

      const confirmModal = page.getByRole('dialog', { name: /confirm activation/i })
      await confirmModal.getByRole('button', { name: /confirm/i }).click()

      // Success toast
      await expect(page.getByRole('status')).toContainText(/version activated/i)

      // Version should now show as Active
      await expect(drawer.getByTestId('status-chip')).toContainText('Active')

      // Previous active version should be demoted
      const historyTable = page.getByRole('table', { name: /version history/i })
      const publishedChips = historyTable
        .getByTestId('status-chip')
        .filter({ hasText: 'Published' })
      await expect(publishedChips).toHaveCount(2) // Original + demoted
    })

    test('cancels activation when clicking cancel in confirmation', async ({ page }) => {
      const draftRow = page.getByTestId('version-history-row').filter({ hasText: 'Draft' }).first()
      await draftRow.click()

      const drawer = page.getByTestId('version-detail-drawer')
      await drawer.getByRole('button', { name: /activate version/i }).click()

      const confirmModal = page.getByRole('dialog', { name: /confirm activation/i })
      await confirmModal.getByRole('button', { name: /cancel/i }).click()

      await expect(confirmModal).not.toBeVisible()
      // Version should still be draft
      await expect(drawer.getByTestId('status-chip')).toContainText('Draft')
    })

    test('shows loading state during activation', async ({ page }) => {
      // Slow down the API
      await page.route('**/api/v1/metadata/*/versions/*/activate', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        await route.continue()
      })

      const draftRow = page.getByTestId('version-history-row').filter({ hasText: 'Draft' }).first()
      await draftRow.click()

      const drawer = page.getByTestId('version-detail-drawer')
      await drawer.getByRole('button', { name: /activate version/i }).click()

      const confirmModal = page.getByRole('dialog', { name: /confirm activation/i })
      await confirmModal.getByRole('button', { name: /confirm/i }).click()

      // Should show loading indicator
      await expect(confirmModal.getByText(/activating/i)).toBeVisible()
    })
  })

  test.describe('Role-based Access', () => {
    test('contributor can create drafts', async ({ page }) => {
      // Mock contributor role
      await page.route('**/api/v1/auth/check', (route) =>
        route.fulfill({
          status: 200,
          body: JSON.stringify({ role: 'contributor', expiresAt: '2025-12-31T00:00:00Z' }),
        }),
      )

      await page.goto('/documents/doc-001')

      // Create button should be visible
      await expect(page.getByRole('button', { name: /create new version/i })).toBeVisible()
    })

    test('contributor cannot activate versions', async ({ page }) => {
      // Mock contributor role
      await page.route('**/api/v1/auth/check', (route) =>
        route.fulfill({
          status: 200,
          body: JSON.stringify({ role: 'contributor', expiresAt: '2025-12-31T00:00:00Z' }),
        }),
      )

      await page.goto('/documents/doc-001')

      const draftRow = page.getByTestId('version-history-row').filter({ hasText: 'Draft' }).first()
      await draftRow.click()

      const drawer = page.getByTestId('version-detail-drawer')

      // Activate button should be disabled or not visible for contributor
      const activateBtn = drawer.getByRole('button', { name: /activate version/i })
      const isDisabled = await activateBtn.isDisabled().catch(() => true)
      const isHidden = await activateBtn.isHidden().catch(() => false)

      expect(isDisabled || isHidden).toBe(true)
    })

    test('admin can activate versions', async ({ page }) => {
      // Mock admin role
      await page.route('**/api/v1/auth/check', (route) =>
        route.fulfill({
          status: 200,
          body: JSON.stringify({ role: 'admin', expiresAt: '2025-12-31T00:00:00Z' }),
        }),
      )

      await page.goto('/documents/doc-001')

      const draftRow = page.getByTestId('version-history-row').filter({ hasText: 'Draft' }).first()
      await draftRow.click()

      const drawer = page.getByTestId('version-detail-drawer')
      await expect(drawer.getByRole('button', { name: /activate version/i })).toBeEnabled()
    })

    test('viewer cannot create or activate', async ({ page }) => {
      // Mock viewer role
      await page.route('**/api/v1/auth/check', (route) =>
        route.fulfill({
          status: 200,
          body: JSON.stringify({ role: 'viewer', expiresAt: '2025-12-31T00:00:00Z' }),
        }),
      )

      await page.goto('/documents/doc-001')

      // Create button should be hidden or disabled
      const createBtn = page.getByRole('button', { name: /create new version/i })
      const isDisabled = await createBtn.isDisabled().catch(() => true)
      const isHidden = await createBtn.isHidden().catch(() => false)

      expect(isDisabled || isHidden).toBe(true)
    })
  })

  test.describe('Error Handling', () => {
    test('shows error toast when activation fails', async ({ page }) => {
      await page.route('**/api/v1/metadata/*/versions/*/activate', (route) =>
        route.fulfill({
          status: 500,
          headers: { 'X-Correlation-ID': 'corr-error-123' },
          body: JSON.stringify({ message: 'Activation failed' }),
        }),
      )

      await page.goto('/documents/doc-001')

      const draftRow = page.getByTestId('version-history-row').filter({ hasText: 'Draft' }).first()
      await draftRow.click()

      const drawer = page.getByTestId('version-detail-drawer')
      await drawer.getByRole('button', { name: /activate version/i }).click()

      const confirmModal = page.getByRole('dialog', { name: /confirm activation/i })
      await confirmModal.getByRole('button', { name: /confirm/i }).click()

      // Error toast with correlation ID
      await expect(page.getByRole('alert')).toContainText(/activation failed/i)
      await expect(page.getByRole('alert')).toContainText('corr-error-123')
    })

    test('shows error toast when create fails', async ({ page }) => {
      await page.route('**/api/v1/metadata/*/versions', (route) => {
        if (route.request().method() === 'POST') {
          return route.fulfill({
            status: 400,
            headers: { 'X-Correlation-ID': 'corr-create-error' },
            body: JSON.stringify({ message: 'Invalid payload schema' }),
          })
        }
        return route.continue()
      })

      await page.goto('/documents/doc-001')

      await page.getByRole('button', { name: /create new version/i }).click()

      const modal = page.getByRole('dialog')
      await modal.getByLabelText(/json payload/i).fill('{"test": true}')
      await modal.getByLabelText(/change summary/i).fill('Test')
      await modal.getByRole('button', { name: /create draft/i }).click()

      await expect(page.getByRole('alert')).toContainText(/invalid payload/i)
    })
  })

  test.describe('Dashboard Refresh', () => {
    test('refreshes dashboard stats after creating version', async ({ page }) => {
      await page.goto('/documents/doc-001')

      // Get initial version count
      const versionCountBefore = await page.getByTestId('version-count').textContent()

      await page.getByRole('button', { name: /create new version/i }).click()

      const modal = page.getByRole('dialog')
      await modal.getByLabelText(/json payload/i).fill('{"new": true}')
      await modal.getByLabelText(/change summary/i).fill('New version')
      await modal.getByRole('button', { name: /create draft/i }).click()

      // Wait for toast
      await expect(page.getByRole('status')).toContainText(/created/i)

      // Version count should be updated
      const versionCountAfter = await page.getByTestId('version-count').textContent()
      expect(versionCountAfter).not.toBe(versionCountBefore)
    })

    test('highlights newly created version in history', async ({ page }) => {
      await page.goto('/documents/doc-001')

      await page.getByRole('button', { name: /create new version/i }).click()

      const modal = page.getByRole('dialog')
      await modal.getByLabelText(/json payload/i).fill('{"highlighted": true}')
      await modal.getByLabelText(/change summary/i).fill('Should be highlighted')
      await modal.getByRole('button', { name: /create draft/i }).click()

      await expect(page.getByRole('status')).toContainText(/created/i)

      // New version row should be highlighted
      const highlightedRow = page.locator('.version-row--highlighted')
      await expect(highlightedRow).toBeVisible()
      await expect(highlightedRow).toContainText('Should be highlighted')
    })
  })

  test.describe('Keyboard Navigation', () => {
    test('can complete create flow with keyboard', async ({ page }) => {
      await page.goto('/documents/doc-001')

      // Tab to create button and press Enter
      await page.keyboard.press('Tab')
      const createBtn = page.getByRole('button', { name: /create new version/i })
      await createBtn.focus()
      await page.keyboard.press('Enter')

      const modal = page.getByRole('dialog')
      await expect(modal).toBeVisible()

      // Fill form with keyboard
      await page.keyboard.type('{"keyboard": true}')
      await page.keyboard.press('Tab')
      await page.keyboard.type('Created via keyboard')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter') // Submit

      await expect(page.getByRole('status')).toContainText(/created/i)
    })

    test('Escape closes create modal', async ({ page }) => {
      await page.goto('/documents/doc-001')

      await page.getByRole('button', { name: /create new version/i }).click()

      const modal = page.getByRole('dialog')
      await expect(modal).toBeVisible()

      await page.keyboard.press('Escape')
      await expect(modal).not.toBeVisible()
    })
  })
})
