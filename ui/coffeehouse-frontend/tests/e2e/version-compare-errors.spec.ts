/**
 * T057 [US4] - Playwright e2e spec for version compare error handling
 * Asserts error toasts + guidance when backend returns incompatible payloads
 */
import { expect, test } from '@playwright/test'

test.describe('Version Compare Error Handling', () => {
  test.describe('backend error responses', () => {
    test('shows toast on 500 server error', async ({ page }) => {
      // Mock API to return 500
      await page.route('**/api/v1/metadata/*/versions/compare*', (route) => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal server error' }),
        })
      })

      await page.goto('/documents/doc-001/compare?left=ver-001&right=ver-002')

      // Error toast should appear
      const toast = page.getByRole('alert').filter({ hasText: /error/i })
      await expect(toast).toBeVisible()
      await expect(toast).toContainText(/server error/i)
    })

    test('shows guidance toast on 400 bad request', async ({ page }) => {
      await page.route('**/api/v1/metadata/*/versions/compare*', (route) => {
        route.fulfill({
          status: 400,
          body: JSON.stringify({ error: 'Invalid version IDs' }),
        })
      })

      await page.goto('/documents/doc-001/compare?left=invalid&right=ver-002')

      const toast = page.getByRole('alert')
      await expect(toast).toContainText(/invalid/i)
    })

    test('redirects to auth on 401 unauthorized', async ({ page }) => {
      await page.route('**/api/v1/metadata/*/versions/compare*', (route) => {
        route.fulfill({
          status: 401,
          body: JSON.stringify({ error: 'Unauthorized' }),
        })
      })

      await page.goto('/documents/doc-001/compare?left=ver-001&right=ver-002')

      // Should show auth prompt or redirect
      await expect(
        page.getByText(/session expired|sign in|unauthorized/i),
      ).toBeVisible()
    })

    test('shows permission error on 403 forbidden', async ({ page }) => {
      await page.route('**/api/v1/metadata/*/versions/compare*', (route) => {
        route.fulfill({
          status: 403,
          body: JSON.stringify({ error: 'Forbidden' }),
        })
      })

      await page.goto('/documents/doc-001/compare?left=ver-001&right=ver-002')

      await expect(page.getByText(/permission|forbidden/i)).toBeVisible()
    })

    test('shows not found error for missing versions', async ({ page }) => {
      await page.route('**/api/v1/metadata/*/versions/compare*', (route) => {
        route.fulfill({
          status: 404,
          body: JSON.stringify({ error: 'Version not found' }),
        })
      })

      await page.goto('/documents/doc-001/compare?left=ver-999&right=ver-002')

      await expect(page.getByText(/not found/i)).toBeVisible()
    })
  })

  test.describe('incompatible payload handling', () => {
    test('shows guidance when payloads have mismatched types', async ({ page }) => {
      await page.route('**/api/v1/metadata/*/versions/compare*', (route) => {
        route.fulfill({
          status: 422,
          body: JSON.stringify({
            error: 'Incompatible payloads',
            details: 'Cannot compare object with array',
          }),
        })
      })

      await page.goto('/documents/doc-001/compare?left=ver-001&right=ver-002')

      await expect(page.getByText(/incompatible/i)).toBeVisible()
      await expect(page.getByText(/cannot compare/i)).toBeVisible()
    })

    test('offers to view versions individually on structure mismatch', async ({ page }) => {
      await page.route('**/api/v1/metadata/*/versions/compare*', (route) => {
        route.fulfill({
          status: 422,
          body: JSON.stringify({
            error: 'Structure mismatch',
            details: 'Schemas are too different to compare',
          }),
        })
      })

      await page.goto('/documents/doc-001/compare?left=ver-001&right=ver-002')

      // Should offer alternative actions
      await expect(page.getByText(/view.*individually/i)).toBeVisible()

      const viewLeftBtn = page.getByRole('link', { name: /view version 1/i })
      const viewRightBtn = page.getByRole('link', { name: /view version 2/i })

      await expect(viewLeftBtn).toBeVisible()
      await expect(viewRightBtn).toBeVisible()
    })
  })

  test.describe('payload size errors', () => {
    test('shows warning for oversized payloads', async ({ page }) => {
      await page.route('**/api/v1/metadata/*/versions/compare*', (route) => {
        route.fulfill({
          status: 413,
          body: JSON.stringify({
            error: 'Payload too large',
            maxSize: '200KB',
            actualSize: '512KB',
          }),
        })
      })

      await page.goto('/documents/doc-001/compare?left=ver-001&right=ver-002')

      await expect(page.getByText(/too large/i)).toBeVisible()
      await expect(page.getByText(/200KB/)).toBeVisible()
    })

    test('offers download option for large payloads', async ({ page }) => {
      await page.route('**/api/v1/metadata/*/versions/compare*', (route) => {
        route.fulfill({
          status: 413,
          body: JSON.stringify({ error: 'Payload too large' }),
        })
      })

      await page.goto('/documents/doc-001/compare?left=ver-001&right=ver-002')

      const downloadBtn = page.getByRole('button', { name: /download/i })
      await expect(downloadBtn).toBeVisible()
    })
  })

  test.describe('network errors', () => {
    test('shows toast on network failure', async ({ page }) => {
      await page.route('**/api/v1/metadata/*/versions/compare*', (route) => {
        route.abort('failed')
      })

      await page.goto('/documents/doc-001/compare?left=ver-001&right=ver-002')

      await expect(page.getByText(/network|connection/i)).toBeVisible()
    })

    test('shows timeout message on slow response', async ({ page }) => {
      await page.route('**/api/v1/metadata/*/versions/compare*', async (route) => {
        // Simulate very slow response
        await new Promise((resolve) => setTimeout(resolve, 10000))
        route.fulfill({ status: 200, body: '{}' })
      })

      // Set shorter timeout for test
      page.setDefaultTimeout(5000)

      await page.goto('/documents/doc-001/compare?left=ver-001&right=ver-002')

      await expect(page.getByText(/timeout|taking too long/i)).toBeVisible({ timeout: 6000 })
    })

    test('provides retry button on transient errors', async ({ page }) => {
      let requestCount = 0
      await page.route('**/api/v1/metadata/*/versions/compare*', (route) => {
        requestCount++
        if (requestCount < 2) {
          route.abort('failed')
        } else {
          route.fulfill({
            status: 200,
            body: JSON.stringify({
              leftPayload: { test: 1 },
              rightPayload: { test: 2 },
            }),
          })
        }
      })

      await page.goto('/documents/doc-001/compare?left=ver-001&right=ver-002')

      // Should show error with retry
      const retryBtn = page.getByRole('button', { name: /retry|try again/i })
      await expect(retryBtn).toBeVisible()

      // Click retry
      await retryBtn.click()

      // Should now show diff content
      await expect(page.getByTestId('diff-container')).toBeVisible()
    })
  })

  test.describe('error recovery flows', () => {
    test('can navigate back to document from error state', async ({ page }) => {
      await page.route('**/api/v1/metadata/*/versions/compare*', (route) => {
        route.fulfill({ status: 500, body: '{}' })
      })

      await page.goto('/documents/doc-001/compare?left=ver-001&right=ver-002')

      const backLink = page.getByRole('link', { name: /back|return/i })
      await backLink.click()

      await expect(page).toHaveURL('/documents/doc-001')
    })

    test('can select different versions after error', async ({ page }) => {
      await page.route('**/api/v1/metadata/*/versions/compare*', (route) => {
        route.fulfill({
          status: 404,
          body: JSON.stringify({ error: 'Version not found' }),
        })
      })

      await page.goto('/documents/doc-001/compare?left=ver-999&right=ver-002')

      // Should provide way to select different versions
      const selectVersionsLink = page.getByRole('link', { name: /select.*versions/i })
      await expect(selectVersionsLink).toBeVisible()
    })
  })

  test.describe('toast notifications', () => {
    test('toast auto-dismisses after timeout', async ({ page }) => {
      await page.route('**/api/v1/metadata/*/versions/compare*', (route) => {
        route.fulfill({ status: 500, body: '{}' })
      })

      await page.goto('/documents/doc-001/compare?left=ver-001&right=ver-002')

      const toast = page.getByRole('alert')
      await expect(toast).toBeVisible()

      // Wait for auto-dismiss (typically 5 seconds)
      await expect(toast).not.toBeVisible({ timeout: 7000 })
    })

    test('toast can be manually dismissed', async ({ page }) => {
      await page.route('**/api/v1/metadata/*/versions/compare*', (route) => {
        route.fulfill({ status: 500, body: '{}' })
      })

      await page.goto('/documents/doc-001/compare?left=ver-001&right=ver-002')

      const toast = page.getByRole('alert')
      await expect(toast).toBeVisible()

      const closeBtn = toast.getByRole('button', { name: /close|dismiss/i })
      await closeBtn.click()

      await expect(toast).not.toBeVisible()
    })

    test('toast includes correlation ID for support', async ({ page }) => {
      await page.route('**/api/v1/metadata/*/versions/compare*', (route) => {
        route.fulfill({
          status: 500,
          headers: { 'X-Correlation-ID': 'corr-12345' },
          body: JSON.stringify({ error: 'Server error' }),
        })
      })

      await page.goto('/documents/doc-001/compare?left=ver-001&right=ver-002')

      const toast = page.getByRole('alert')
      await expect(toast).toContainText(/corr-12345/)
    })
  })

  test.describe('accessibility in error states', () => {
    test('error message is announced to screen readers', async ({ page }) => {
      await page.route('**/api/v1/metadata/*/versions/compare*', (route) => {
        route.fulfill({ status: 500, body: '{}' })
      })

      await page.goto('/documents/doc-001/compare?left=ver-001&right=ver-002')

      const errorRegion = page.getByRole('alert')
      await expect(errorRegion).toHaveAttribute('aria-live', 'assertive')
    })

    test('focus moves to error message on error', async ({ page }) => {
      await page.route('**/api/v1/metadata/*/versions/compare*', (route) => {
        route.fulfill({ status: 500, body: '{}' })
      })

      await page.goto('/documents/doc-001/compare?left=ver-001&right=ver-002')

      // Error element should receive focus
      const errorElement = page.getByRole('alert')
      await expect(errorElement).toBeFocused()
    })

    test('keyboard navigation works in error state', async ({ page }) => {
      await page.route('**/api/v1/metadata/*/versions/compare*', (route) => {
        route.fulfill({ status: 500, body: '{}' })
      })

      await page.goto('/documents/doc-001/compare?left=ver-001&right=ver-002')

      // Tab through error state actions
      await page.keyboard.press('Tab')
      const retryBtn = page.getByRole('button', { name: /retry/i })
      await expect(retryBtn).toBeFocused()

      await page.keyboard.press('Tab')
      const backLink = page.getByRole('link', { name: /back/i })
      await expect(backLink).toBeFocused()
    })
  })
})
