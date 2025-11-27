import { test, expect } from '@playwright/test'

/**
 * Playwright E2E tests for the Create Document flow (US6)
 *
 * Tests the happy path: Dashboard CTA → Modal form → Validation → Submit → Detail page navigation
 */

const API_BASE = '/api/v1'

test.describe('Create Document Flow - Success Path', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the dashboard metadata list endpoint
    await page.route(`${API_BASE}/metadata*`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            documents: [
              {
                id: 'doc-001',
                type: 'loyalty-program',
                name: 'rewards-config',
                versionCount: 3,
                activeVersion: 1,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
            cursor: null,
            hasMore: false,
          }),
        })
      } else {
        await route.continue()
      }
    })

    // Mock successful document creation
    await page.route(`${API_BASE}/metadata`, async (route) => {
      if (route.request().method() === 'POST') {
        const body = JSON.parse(route.request().postData() ?? '{}')
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          headers: {
            'X-Correlation-Id': 'corr-12345-abcde',
          },
          body: JSON.stringify({
            id: 'new-doc-001',
            type: body.type,
            name: body.name,
            content: body.content,
            version: 1,
            status: 'DRAFT',
            changeSummary: body.changeSummary,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        })
      } else {
        await route.continue()
      }
    })
  })

  test('opens create document modal from dashboard CTA', async ({ page }) => {
    await page.goto('/')

    // Click the Create Document CTA button in the hero section
    const createBtn = page.getByRole('button', { name: /create.*document/i })
    await createBtn.click()

    // Modal should be visible
    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()
    await expect(modal.getByRole('heading', { name: /create.*document/i })).toBeVisible()
  })

  test('displays all required form fields', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /create.*document/i }).click()

    const modal = page.getByRole('dialog')

    // Check all form fields are present
    await expect(modal.getByLabelText(/document type/i)).toBeVisible()
    await expect(modal.getByLabelText(/document name/i)).toBeVisible()
    await expect(modal.getByLabelText(/json.*payload/i)).toBeVisible()
    await expect(modal.getByLabelText(/change summary/i)).toBeVisible()

    // Check action buttons
    await expect(modal.getByRole('button', { name: /create/i })).toBeVisible()
    await expect(modal.getByRole('button', { name: /cancel/i })).toBeVisible()
  })

  test('creates document with valid input and navigates to detail page', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /create.*document/i }).click()

    const modal = page.getByRole('dialog')

    // Fill in form with valid data
    await modal.getByLabelText(/document type/i).fill('loyalty-program')
    await modal.getByLabelText(/document name/i).fill('new-rewards-config')
    await modal.getByLabelText(/json.*payload/i).fill('{"points": 100, "tier": "gold"}')
    await modal.getByLabelText(/change summary/i).fill('Initial configuration for rewards program')

    // Submit form
    await modal.getByRole('button', { name: /create/i }).click()

    // Verify success toast appears
    await expect(page.getByRole('status')).toContainText(/created/i)

    // Modal should close
    await expect(modal).not.toBeVisible()

    // Should navigate to document detail page
    await expect(page).toHaveURL(/\/documents\/new-doc-001/)
  })

  test('shows character count for change summary', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /create.*document/i }).click()

    const modal = page.getByRole('dialog')
    const summaryInput = modal.getByLabelText(/change summary/i)

    await summaryInput.fill('Short summary text')

    // Should show character count
    await expect(modal.getByText(/18.*\/.*500/)).toBeVisible()
  })

  test('closes modal on cancel button click', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /create.*document/i }).click()

    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()

    // Fill in some data
    await modal.getByLabelText(/document type/i).fill('test-type')

    // Click cancel
    await modal.getByRole('button', { name: /cancel/i }).click()

    // Modal should close
    await expect(modal).not.toBeVisible()
  })

  test('closes modal on ESC key press', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /create.*document/i }).click()

    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()

    // Press ESC
    await page.keyboard.press('Escape')

    // Modal should close
    await expect(modal).not.toBeVisible()
  })

  test('closes modal on backdrop click', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /create.*document/i }).click()

    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()

    // Click the backdrop (outside the modal content)
    await page.locator('[data-testid="modal-backdrop"]').click({ position: { x: 10, y: 10 } })

    // Modal should close
    await expect(modal).not.toBeVisible()
  })

  test('validates document type in kebab-case format', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /create.*document/i }).click()

    const modal = page.getByRole('dialog')
    const typeInput = modal.getByLabelText(/document type/i)

    // Invalid: contains numbers
    await typeInput.fill('type123')
    await typeInput.blur()
    await expect(modal.getByText(/lowercase letters.*hyphens/i)).toBeVisible()

    // Invalid: uppercase
    await typeInput.fill('InvalidType')
    await typeInput.blur()
    await expect(modal.getByText(/lowercase letters.*hyphens/i)).toBeVisible()

    // Valid: kebab-case letters only
    await typeInput.fill('valid-type')
    await typeInput.blur()
    await expect(modal.getByText(/lowercase letters.*hyphens/i)).not.toBeVisible()
  })

  test('validates document name in kebab-case format with numbers', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /create.*document/i }).click()

    const modal = page.getByRole('dialog')
    const nameInput = modal.getByLabelText(/document name/i)

    // Invalid: uppercase
    await nameInput.fill('InvalidName')
    await nameInput.blur()
    await expect(modal.getByText(/lowercase letters.*numbers.*hyphens/i)).toBeVisible()

    // Invalid: underscores
    await nameInput.fill('invalid_name')
    await nameInput.blur()
    await expect(modal.getByText(/lowercase letters.*numbers.*hyphens/i)).toBeVisible()

    // Valid: kebab-case with numbers
    await nameInput.fill('valid-name-123')
    await nameInput.blur()
    await expect(modal.getByText(/lowercase letters.*numbers.*hyphens/i)).not.toBeVisible()
  })

  test('validates JSON payload syntax', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /create.*document/i }).click()

    const modal = page.getByRole('dialog')
    const payloadInput = modal.getByLabelText(/json.*payload/i)

    // Invalid JSON
    await payloadInput.fill('{ invalid json }')
    await payloadInput.blur()
    await expect(modal.getByText(/invalid json/i)).toBeVisible()

    // Valid JSON
    await payloadInput.fill('{"valid": "json"}')
    await payloadInput.blur()
    await expect(modal.getByText(/invalid json/i)).not.toBeVisible()
  })

  test('disables submit button while form is submitting', async ({ page }) => {
    // Add a delay to the API response to test loading state
    await page.route(`${API_BASE}/metadata`, async (route) => {
      if (route.request().method() === 'POST') {
        await new Promise((resolve) => setTimeout(resolve, 500))
        const body = JSON.parse(route.request().postData() ?? '{}')
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'new-doc-001',
            type: body.type,
            name: body.name,
            content: body.content,
            version: 1,
            status: 'DRAFT',
            changeSummary: body.changeSummary,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        })
      } else {
        await route.continue()
      }
    })

    await page.goto('/')
    await page.getByRole('button', { name: /create.*document/i }).click()

    const modal = page.getByRole('dialog')

    // Fill valid data
    await modal.getByLabelText(/document type/i).fill('test-type')
    await modal.getByLabelText(/document name/i).fill('test-name')
    await modal.getByLabelText(/json.*payload/i).fill('{"test": true}')
    await modal.getByLabelText(/change summary/i).fill('Test summary')

    const submitBtn = modal.getByRole('button', { name: /create/i })
    await submitBtn.click()

    // Button should show loading state or be disabled
    await expect(submitBtn).toBeDisabled()
  })

  test('preserves form data when validation fails', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /create.*document/i }).click()

    const modal = page.getByRole('dialog')

    // Fill in some valid fields
    await modal.getByLabelText(/document type/i).fill('valid-type')
    await modal.getByLabelText(/document name/i).fill('valid-name')
    await modal.getByLabelText(/change summary/i).fill('My change summary')

    // Fill invalid JSON
    await modal.getByLabelText(/json.*payload/i).fill('invalid json')

    // Try to submit (should fail validation)
    await modal.getByRole('button', { name: /create/i }).click()

    // Form should still be visible with data preserved
    await expect(modal).toBeVisible()
    await expect(modal.getByLabelText(/document type/i)).toHaveValue('valid-type')
    await expect(modal.getByLabelText(/document name/i)).toHaveValue('valid-name')
    await expect(modal.getByLabelText(/change summary/i)).toHaveValue('My change summary')
  })

  test('formats JSON payload with format button', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /create.*document/i }).click()

    const modal = page.getByRole('dialog')
    const payloadInput = modal.getByLabelText(/json.*payload/i)

    // Enter compact JSON
    await payloadInput.fill('{"a":1,"b":2,"nested":{"c":3}}')

    // Click format button
    const formatBtn = modal.getByRole('button', { name: /format/i })
    if (await formatBtn.isVisible()) {
      await formatBtn.click()

      // Should be prettified (contains newlines)
      const formatted = await payloadInput.inputValue()
      expect(formatted).toContain('\n')
    }
  })

  test('invalidates dashboard stats cache after successful creation', async ({ page }) => {
    let statsRequestCount = 0

    // Track stats endpoint calls
    await page.route(`${API_BASE}/stats*`, async (route) => {
      statsRequestCount++
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalDocuments: statsRequestCount > 1 ? 2 : 1,
          totalVersions: 5,
          activeVersions: 3,
        }),
      })
    })

    await page.goto('/')

    // Wait for initial stats load
    await page.waitForTimeout(100)
    const initialCount = statsRequestCount

    // Create a document
    await page.getByRole('button', { name: /create.*document/i }).click()
    const modal = page.getByRole('dialog')

    await modal.getByLabelText(/document type/i).fill('test-type')
    await modal.getByLabelText(/document name/i).fill('test-name')
    await modal.getByLabelText(/json.*payload/i).fill('{"test": true}')
    await modal.getByLabelText(/change summary/i).fill('Test summary')
    await modal.getByRole('button', { name: /create/i }).click()

    // Wait for navigation and potential refetch
    await page.waitForURL(/\/documents\//)
    await page.waitForTimeout(200)

    // Stats should have been refetched (cache invalidated)
    expect(statsRequestCount).toBeGreaterThan(initialCount)
  })
})
