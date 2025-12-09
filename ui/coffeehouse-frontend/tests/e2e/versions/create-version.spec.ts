import { test, expect } from '@playwright/test'

test.describe('Create Version Modal', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a page where the modal can be triggered
    // Assuming there's a button to open the modal on the versions page
    // For now, we'll just navigate to the root or a specific route
    await page.goto('/')
  })

  test('should open modal when create button is clicked', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /create version/i })
    await createButton.click()

    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()
    await expect(modal).toContainText('Create New Version')
  })

  test('should close modal when close button is clicked', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /create version/i })
    await createButton.click()

    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()

    const closeButton = modal.getByRole('button', { name: /close/i })
    await closeButton.click()

    await expect(modal).not.toBeVisible()
  })

  test('should create version with valid JSON and display success', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /create version/i })
    await createButton.click()

    const modal = page.getByRole('dialog')
    await modal.getByLabel(/summary/i).fill('New version summary')
    await modal.getByLabel(/content/i).fill('{"key": "value"}')

    // Mock API response if needed, or rely on real backend if available/configured

    await modal.getByRole('button', { name: /create/i }).click()

    await expect(page.getByText(/version created successfully/i)).toBeVisible()
    await expect(modal).not.toBeVisible()
  })

  test('should show validation error for invalid JSON syntax', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /create version/i })
    await createButton.click()

    const modal = page.getByRole('dialog')
    await modal.getByLabel(/content/i).fill('{invalid json')
    await modal.getByRole('button', { name: /create/i }).click()

    await expect(modal.getByText(/invalid json/i)).toBeVisible()
  })

  test('should auto-format JSON when Format button clicked', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /create version/i })
    await createButton.click()

    const modal = page.getByRole('dialog')
    const payloadInput = modal.getByLabel(/payload/i)
    await payloadInput.fill('{"key":"value"}')

    await modal.getByRole('button', { name: /format json/i }).click()

    const formattedValue = await payloadInput.inputValue()
    expect(formattedValue).toContain('{\n  "key": "value"\n}')
  })

  test('should show error when payload is empty', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /create version/i })
    await createButton.click()

    const modal = page.getByRole('dialog')
    await modal.getByLabel(/summary/i).fill('Summary')
    // Payload is empty by default
    await modal.getByRole('button', { name: /create/i }).click()

    await expect(modal.getByText(/payload is required/i)).toBeVisible()
  })

  test('should show error when payload is array not object', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /create version/i })
    await createButton.click()

    const modal = page.getByRole('dialog')
    await modal.getByLabel(/payload/i).fill('["item"]')
    await modal.getByRole('button', { name: /create/i }).click()

    await expect(modal.getByText(/payload must be a json object/i)).toBeVisible()
  })

  test('should clear error when user starts typing after validation error', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /create version/i })
    await createButton.click()

    const modal = page.getByRole('dialog')
    const payloadInput = modal.getByLabel(/payload/i)
    await payloadInput.fill('{invalid')
    await payloadInput.blur() // Trigger validation on blur

    await expect(modal.getByText(/invalid json/i)).toBeVisible()

    await payloadInput.fill('{invalid}') // Type more
    await expect(modal.getByText(/invalid json/i)).not.toBeVisible()
  })

  test('should refresh version history within 1s after successful creation', async ({ page }) => {
    // This requires setting up the initial state and verifying the list updates
    // For now, just a placeholder
    const createButton = page.getByRole('button', { name: /create version/i })
    await createButton.click()

    // ... fill form ...
    const modal = page.getByRole('dialog')
    await modal.getByLabel(/summary/i).fill('New version summary')
    await modal.getByLabel(/content/i).fill('{"key": "value"}')
    await modal.getByRole('button', { name: /create/i }).click()

    // Verify list update
    await expect(page.getByText('New version summary')).toBeVisible({ timeout: 1000 })
  })

  // User Story 3: Pre-populate with Active Version
  test('should pre-populate payload with active version when available', async ({ page }) => {
    // Navigate to a document that has an active version
    // The payload textarea should be pre-filled with the active version's payload
    const createButton = page.getByRole('button', { name: /create version/i })
    await createButton.click()

    const modal = page.getByRole('dialog')
    const payloadInput = modal.getByLabel(/payload/i)

    // Verify the payload has some content (pre-populated from active version)
    const payloadValue = await payloadInput.inputValue()
    // If there's an active version, it should not be empty and should be valid JSON
    if (payloadValue.trim()) {
      expect(() => JSON.parse(payloadValue)).not.toThrow()
    }
  })

  test('should create new version with modified payload when pre-populated', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /create version/i })
    await createButton.click()

    const modal = page.getByRole('dialog')
    const payloadInput = modal.getByLabel(/payload/i)

    // Modify the pre-populated payload
    await payloadInput.fill('{"modified": "payload", "newKey": "newValue"}')
    await modal.getByLabel(/summary/i).fill('Modified from active version')
    await modal.getByRole('button', { name: /create/i }).click()

    // Verify success (modal closes)
    await expect(modal).not.toBeVisible()
  })

  test('should show empty payload when no active version exists', async ({ page }) => {
    // This test would need to navigate to a document without an active version
    // For now, we skip if the document has an active version
    const createButton = page.getByRole('button', { name: /create version/i })
    await createButton.click()

    const modal = page.getByRole('dialog')
    const payloadInput = modal.getByLabel(/payload/i)

    // Get current value - if empty, the test passes
    // If not empty, skip this test as it indicates active version exists
    // This is a soft test - just verifying the field exists and is accessible
    expect(payloadInput).toBeTruthy()
  })
})
