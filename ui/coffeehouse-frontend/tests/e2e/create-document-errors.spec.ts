import { test, expect } from '@playwright/test'

/**
 * Playwright E2E tests for Create Document error handling (US6)
 *
 * Tests error scenarios: validation errors, 409 conflict, 400 bad request, network failures
 */

const API_BASE = '/api/v1'

test.describe('Create Document Flow - Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the dashboard metadata list endpoint
    await page.route(`${API_BASE}/metadata*`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            documents: [],
            cursor: null,
            hasMore: false,
          }),
        })
      } else {
        await route.continue()
      }
    })

    // Setup authentication
    await page.goto('/settings')
    await page.getByLabel(/username/i).fill('testuser')
    await page.getByLabel(/password/i).fill('testpass')
    await page.getByRole('button', { name: /save credentials/i }).click()
    await expect(page.getByRole('status')).toContainText(/saved/i)
  })

  test.describe('Missing Credentials', () => {
    test('shows authentication warning when credentials are not set', async ({ page }) => {
      // Clear credentials by reloading (since they are in-memory only)
      await page.reload()

      await page.goto('/')
      await page.getByRole('button', { name: /create.*document/i }).click()

      const modal = page.getByRole('dialog')
      await expect(modal).toBeVisible()

      // Should show warning instead of form
      await expect(modal.getByRole('heading', { name: /authentication required/i })).toBeVisible()
      await expect(modal.getByText(/please enter your credentials/i)).toBeVisible()
      await expect(modal.getByRole('button', { name: /go to settings/i })).toBeVisible()

      // Form fields should NOT be visible
      await expect(modal.getByLabelText(/document type/i)).not.toBeVisible()
    })
  })

  test.describe('Client-side Validation Errors', () => {
    test('shows error when document type is empty', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('button', { name: /create.*document/i }).click()

      const modal = page.getByRole('dialog')

      // Fill other fields but leave type empty
      await modal.getByLabelText(/document name/i).fill('test-name')
      await modal.getByLabelText(/json.*payload/i).fill('{"test": true}')
      await modal.getByLabelText(/change summary/i).fill('Test summary')

      // Focus and blur type field to trigger validation
      await modal.getByLabelText(/document type/i).focus()
      await modal.getByLabelText(/document type/i).blur()

      // Should show required error
      await expect(modal.getByText(/type.*required|required/i)).toBeVisible()
    })

    test('shows error when document name is empty', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('button', { name: /create.*document/i }).click()

      const modal = page.getByRole('dialog')

      // Fill other fields but leave name empty
      await modal.getByLabelText(/document type/i).fill('test-type')
      await modal.getByLabelText(/json.*payload/i).fill('{"test": true}')

      // Focus and blur name field
      await modal.getByLabelText(/document name/i).focus()
      await modal.getByLabelText(/document name/i).blur()

      // Should show required error
      await expect(modal.getByText(/name.*required|required/i)).toBeVisible()
    })

    test('shows error when JSON payload is empty', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('button', { name: /create.*document/i }).click()

      const modal = page.getByRole('dialog')

      // Fill other fields
      await modal.getByLabelText(/document type/i).fill('test-type')
      await modal.getByLabelText(/document name/i).fill('test-name')

      // Focus and blur payload field
      await modal.getByLabelText(/json.*payload/i).focus()
      await modal.getByLabelText(/json.*payload/i).blur()

      // Should show required error
      await expect(modal.getByText(/payload.*required|required/i)).toBeVisible()
    })

    test('prevents submission when form has validation errors', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('button', { name: /create.*document/i }).click()

      const modal = page.getByRole('dialog')

      // Fill with invalid data
      await modal.getByLabelText(/document type/i).fill('INVALID_TYPE')
      await modal.getByLabelText(/document name/i).fill('INVALID_NAME')
      await modal.getByLabelText(/json.*payload/i).fill('not valid json')
      await modal.getByLabelText(/change summary/i).fill('Test')

      // Try to submit
      await modal.getByRole('button', { name: /create/i }).click()

      // Modal should stay open (form not submitted)
      await expect(modal).toBeVisible()
    })
  })

  test.describe('API Error - 409 Conflict (Duplicate)', () => {
    test.beforeEach(async ({ page }) => {
      // Mock 409 conflict response
      await page.route(`${API_BASE}/metadata`, async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 409,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'Conflict',
              message:
                'Document with type "loyalty-program" and name "existing-doc" already exists',
              code: 'DUPLICATE_DOCUMENT',
              field: 'name',
            }),
          })
        } else {
          await route.continue()
        }
      })
    })

    test('displays conflict error from API', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('button', { name: /create.*document/i }).click()

      const modal = page.getByRole('dialog')

      // Fill valid data
      await modal.getByLabelText(/document type/i).fill('loyalty-program')
      await modal.getByLabelText(/document name/i).fill('existing-doc')
      await modal.getByLabelText(/json.*payload/i).fill('{"test": true}')
      await modal.getByLabelText(/change summary/i).fill('Test summary')

      // Submit
      await modal.getByRole('button', { name: /create/i }).click()

      // Should show conflict error
      await expect(modal.getByText(/already exists|conflict|duplicate/i)).toBeVisible()

      // Modal should stay open for correction
      await expect(modal).toBeVisible()
    })

    test('maps 409 error to specific form field', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('button', { name: /create.*document/i }).click()

      const modal = page.getByRole('dialog')

      // Fill and submit
      await modal.getByLabelText(/document type/i).fill('loyalty-program')
      await modal.getByLabelText(/document name/i).fill('existing-doc')
      await modal.getByLabelText(/json.*payload/i).fill('{"test": true}')
      await modal.getByLabelText(/change summary/i).fill('Test summary')
      await modal.getByRole('button', { name: /create/i }).click()

      // Error should be associated with name field
      const nameField = modal.getByLabelText(/document name/i)
      const nameContainer = nameField.locator('..')

      // Check for error indicator near the field
      await expect(nameContainer.getByText(/already exists|duplicate/i)).toBeVisible()
    })
  })

  test.describe('API Error - 400 Bad Request', () => {
    test.beforeEach(async ({ page }) => {
      await page.route(`${API_BASE}/metadata`, async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'Bad Request',
              message: 'Invalid document type format',
              code: 'VALIDATION_ERROR',
              field: 'type',
            }),
          })
        } else {
          await route.continue()
        }
      })
    })

    test('displays validation error from API', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('button', { name: /create.*document/i }).click()

      const modal = page.getByRole('dialog')

      // Fill and submit
      await modal.getByLabelText(/document type/i).fill('test-type')
      await modal.getByLabelText(/document name/i).fill('test-name')
      await modal.getByLabelText(/json.*payload/i).fill('{"test": true}')
      await modal.getByLabelText(/change summary/i).fill('Test summary')
      await modal.getByRole('button', { name: /create/i }).click()

      // Should show API error
      await expect(modal.getByText(/invalid|bad request|validation/i)).toBeVisible()

      // Modal stays open
      await expect(modal).toBeVisible()
    })
  })

  test.describe('API Error - 500 Server Error', () => {
    test.beforeEach(async ({ page }) => {
      await page.route(`${API_BASE}/metadata`, async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'Internal Server Error',
              message: 'An unexpected error occurred',
            }),
          })
        } else {
          await route.continue()
        }
      })
    })

    test('displays generic error for server errors', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('button', { name: /create.*document/i }).click()

      const modal = page.getByRole('dialog')

      // Fill and submit
      await modal.getByLabelText(/document type/i).fill('test-type')
      await modal.getByLabelText(/document name/i).fill('test-name')
      await modal.getByLabelText(/json.*payload/i).fill('{"test": true}')
      await modal.getByLabelText(/change summary/i).fill('Test summary')
      await modal.getByRole('button', { name: /create/i }).click()

      // Should show error message
      await expect(modal.getByRole('alert')).toBeVisible()
      await expect(modal.getByText(/error|failed|unable/i)).toBeVisible()

      // Modal stays open for retry
      await expect(modal).toBeVisible()
    })

    test('allows retry after server error', async ({ page }) => {
      let requestCount = 0

      await page.route(`${API_BASE}/metadata`, async (route) => {
        if (route.request().method() === 'POST') {
          requestCount++
          if (requestCount === 1) {
            // First request fails
            await route.fulfill({
              status: 500,
              contentType: 'application/json',
              body: JSON.stringify({ error: 'Internal Server Error' }),
            })
          } else {
            // Second request succeeds
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
          }
        } else {
          await route.continue()
        }
      })

      await page.goto('/')
      await page.getByRole('button', { name: /create.*document/i }).click()

      const modal = page.getByRole('dialog')

      // Fill and submit (first attempt fails)
      await modal.getByLabelText(/document type/i).fill('test-type')
      await modal.getByLabelText(/document name/i).fill('test-name')
      await modal.getByLabelText(/json.*payload/i).fill('{"test": true}')
      await modal.getByLabelText(/change summary/i).fill('Test summary')
      await modal.getByRole('button', { name: /create/i }).click()

      // Wait for error
      await expect(modal.getByText(/error|failed/i)).toBeVisible()

      // Retry (second attempt succeeds)
      await modal.getByRole('button', { name: /create/i }).click()

      // Should succeed and navigate
      await expect(page).toHaveURL(/\/documents\/new-doc-001/)
    })
  })

  test.describe('Network Error', () => {
    test.beforeEach(async ({ page }) => {
      await page.route(`${API_BASE}/metadata`, async (route) => {
        if (route.request().method() === 'POST') {
          await route.abort('failed')
        } else {
          await route.continue()
        }
      })
    })

    test('displays network error message', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('button', { name: /create.*document/i }).click()

      const modal = page.getByRole('dialog')

      // Fill and submit
      await modal.getByLabelText(/document type/i).fill('test-type')
      await modal.getByLabelText(/document name/i).fill('test-name')
      await modal.getByLabelText(/json.*payload/i).fill('{"test": true}')
      await modal.getByLabelText(/change summary/i).fill('Test summary')
      await modal.getByRole('button', { name: /create/i }).click()

      // Should show network error
      await expect(modal.getByText(/network|connection|unable to connect/i)).toBeVisible()

      // Modal stays open
      await expect(modal).toBeVisible()
    })
  })

  test.describe('Authentication Error - 401 Unauthorized', () => {
    test.beforeEach(async ({ page }) => {
      await page.route(`${API_BASE}/metadata`, async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'Unauthorized',
              message: 'Invalid or expired credentials',
            }),
          })
        } else {
          await route.continue()
        }
      })
    })

    test('displays authentication error and prompts re-login', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('button', { name: /create.*document/i }).click()

      const modal = page.getByRole('dialog')

      // Fill and submit
      await modal.getByLabelText(/document type/i).fill('test-type')
      await modal.getByLabelText(/document name/i).fill('test-name')
      await modal.getByLabelText(/json.*payload/i).fill('{"test": true}')
      await modal.getByLabelText(/change summary/i).fill('Test summary')
      await modal.getByRole('button', { name: /create/i }).click()

      // Should show auth error or redirect to settings
      await expect(page.getByText(/unauthorized|authentication|credentials|sign in/i)).toBeVisible()
    })
  })

  test.describe('Form State Preservation on Error', () => {
    test('preserves all field values after API error', async ({ page }) => {
      await page.route(`${API_BASE}/metadata`, async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Server Error' }),
          })
        } else {
          await route.continue()
        }
      })

      await page.goto('/')
      await page.getByRole('button', { name: /create.*document/i }).click()

      const modal = page.getByRole('dialog')

      // Fill all fields with specific values
      await modal.getByLabelText(/document type/i).fill('my-document-type')
      await modal.getByLabelText(/document name/i).fill('my-document-name')
      await modal.getByLabelText(/json.*payload/i).fill('{"preserved": "data"}')
      await modal.getByLabelText(/change summary/i).fill('My change summary text')

      // Submit (will fail)
      await modal.getByRole('button', { name: /create/i }).click()

      // Wait for error
      await expect(modal.getByText(/error|failed/i)).toBeVisible()

      // Verify all values are preserved
      await expect(modal.getByLabelText(/document type/i)).toHaveValue('my-document-type')
      await expect(modal.getByLabelText(/document name/i)).toHaveValue('my-document-name')
      await expect(modal.getByLabelText(/json.*payload/i)).toHaveValue('{"preserved": "data"}')
      await expect(modal.getByLabelText(/change summary/i)).toHaveValue('My change summary text')
    })
  })

  test.describe('Error Message Accessibility', () => {
    test('error messages are announced to screen readers', async ({ page }) => {
      await page.route(`${API_BASE}/metadata`, async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'Bad Request',
              message: 'Validation failed',
            }),
          })
        } else {
          await route.continue()
        }
      })

      await page.goto('/')
      await page.getByRole('button', { name: /create.*document/i }).click()

      const modal = page.getByRole('dialog')

      // Fill and submit
      await modal.getByLabelText(/document type/i).fill('test-type')
      await modal.getByLabelText(/document name/i).fill('test-name')
      await modal.getByLabelText(/json.*payload/i).fill('{"test": true}')
      await modal.getByLabelText(/change summary/i).fill('Test summary')
      await modal.getByRole('button', { name: /create/i }).click()

      // Error should be in an alert role for screen readers
      await expect(modal.getByRole('alert')).toBeVisible()
    })

    test('form fields with errors have aria-invalid attribute', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('button', { name: /create.*document/i }).click()

      const modal = page.getByRole('dialog')
      const typeInput = modal.getByLabelText(/document type/i)

      // Enter invalid type
      await typeInput.fill('INVALID')
      await typeInput.blur()

      // Should have aria-invalid
      await expect(typeInput).toHaveAttribute('aria-invalid', 'true')
    })
  })
})
