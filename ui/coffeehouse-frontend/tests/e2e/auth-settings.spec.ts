/**
 * T041 [P] [US5]: Playwright e2e spec for auth settings
 * Tests: credential entry, test connection, API failure handling
 */
import { test, expect } from '@playwright/test'

test.describe('Auth Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings')
  })

  test.describe('Page Layout', () => {
    test('displays auth settings panel', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /authentication/i })).toBeVisible()
    })

    test('shows credential form fields', async ({ page }) => {
      await expect(page.getByLabel(/username/i)).toBeVisible()
      await expect(page.getByLabel(/password/i)).toBeVisible()
    })

    test('shows action buttons', async ({ page }) => {
      await expect(page.getByRole('button', { name: /save credentials/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /test connection/i })).toBeVisible()
    })

    test('displays guidance about credential storage', async ({ page }) => {
      await expect(page.getByText(/session memory only/i)).toBeVisible()
    })
  })

  test.describe('Credential Entry', () => {
    test('can enter username and password', async ({ page }) => {
      await page.getByLabel(/username/i).fill('testuser')
      await page.getByLabel(/password/i).fill('testpass')

      await expect(page.getByLabel(/username/i)).toHaveValue('testuser')
      await expect(page.getByLabel(/password/i)).toHaveValue('testpass')
    })

    test('validates empty username on submit', async ({ page }) => {
      await page.getByLabel(/password/i).fill('testpass')
      await page.getByRole('button', { name: /save credentials/i }).click()

      await expect(page.getByText(/username is required/i)).toBeVisible()
    })

    test('validates empty password on submit', async ({ page }) => {
      await page.getByLabel(/username/i).fill('testuser')
      await page.getByRole('button', { name: /save credentials/i }).click()

      await expect(page.getByText(/password is required/i)).toBeVisible()
    })

    test('saves credentials successfully', async ({ page }) => {
      await page.getByLabel(/username/i).fill('admin')
      await page.getByLabel(/password/i).fill('secret123')
      await page.getByRole('button', { name: /save credentials/i }).click()

      // Should show success toast
      await expect(page.getByText(/credentials saved/i)).toBeVisible()
    })

    test('shows username in status after saving', async ({ page }) => {
      await page.getByLabel(/username/i).fill('coffeeadmin')
      await page.getByLabel(/password/i).fill('brewmaster')
      await page.getByRole('button', { name: /save credentials/i }).click()

      await expect(page.getByText(/coffeeadmin/i)).toBeVisible()
    })

    test('clears password field after saving', async ({ page }) => {
      await page.getByLabel(/username/i).fill('admin')
      await page.getByLabel(/password/i).fill('secret')
      await page.getByRole('button', { name: /save credentials/i }).click()

      await expect(page.getByLabel(/password/i)).toHaveValue('')
    })
  })

  test.describe('Clear Credentials', () => {
    test.beforeEach(async ({ page }) => {
      // First save credentials
      await page.getByLabel(/username/i).fill('admin')
      await page.getByLabel(/password/i).fill('secret')
      await page.getByRole('button', { name: /save credentials/i }).click()
      await expect(page.getByText(/credentials saved/i)).toBeVisible()
    })

    test('shows clear button when credentials exist', async ({ page }) => {
      await expect(page.getByRole('button', { name: /clear credentials/i })).toBeVisible()
    })

    test('clears credentials when clicked', async ({ page }) => {
      await page.getByRole('button', { name: /clear credentials/i }).click()

      await expect(page.getByText(/credentials cleared/i)).toBeVisible()
      await expect(page.getByText(/no credentials configured/i)).toBeVisible()
    })

    test('hides clear button after clearing', async ({ page }) => {
      await page.getByRole('button', { name: /clear credentials/i }).click()

      await expect(page.getByRole('button', { name: /clear credentials/i })).not.toBeVisible()
    })
  })

  test.describe('Test Connection - Success', () => {
    test.beforeEach(async ({ page }) => {
      // Mock successful auth check
      await page.route('**/auth/check', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ valid: true, role: 'admin' }),
        })
      })

      // Save credentials first
      await page.getByLabel(/username/i).fill('admin')
      await page.getByLabel(/password/i).fill('secret')
      await page.getByRole('button', { name: /save credentials/i }).click()
    })

    test('tests connection successfully', async ({ page }) => {
      await page.getByRole('button', { name: /test connection/i }).click()

      await expect(page.getByText(/connection successful/i)).toBeVisible()
    })

    test('displays role after successful test', async ({ page }) => {
      await page.getByRole('button', { name: /test connection/i }).click()

      await expect(page.getByText(/admin/i)).toBeVisible()
    })

    test('shows validated status after successful test', async ({ page }) => {
      await page.getByRole('button', { name: /test connection/i }).click()

      await expect(page.getByText(/validated/i)).toBeVisible()
    })

    test('shows loading state during test', async ({ page }) => {
      // Add delay to route
      await page.route('**/auth/check', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 500))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ valid: true, role: 'admin' }),
        })
      })

      await page.getByRole('button', { name: /test connection/i }).click()
      await expect(page.getByText(/testing/i)).toBeVisible()
    })
  })

  test.describe('Test Connection - Failure', () => {
    test('handles 401 unauthorized', async ({ page }) => {
      await page.route('**/auth/check', async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Unauthorized', message: 'Invalid credentials' }),
        })
      })

      // Save credentials
      await page.getByLabel(/username/i).fill('wronguser')
      await page.getByLabel(/password/i).fill('wrongpass')
      await page.getByRole('button', { name: /save credentials/i }).click()

      // Test connection
      await page.getByRole('button', { name: /test connection/i }).click()

      await expect(page.getByText(/connection failed/i)).toBeVisible()
    })

    test('clears credentials on 401', async ({ page }) => {
      await page.route('**/auth/check', async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Unauthorized' }),
        })
      })

      // Save credentials
      await page.getByLabel(/username/i).fill('wronguser')
      await page.getByLabel(/password/i).fill('wrongpass')
      await page.getByRole('button', { name: /save credentials/i }).click()

      // Test connection
      await page.getByRole('button', { name: /test connection/i }).click()

      // Should show no credentials status
      await expect(page.getByText(/no credentials configured/i)).toBeVisible()
    })

    test('handles 500 server error', async ({ page }) => {
      await page.route('**/auth/check', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        })
      })

      // Save credentials
      await page.getByLabel(/username/i).fill('admin')
      await page.getByLabel(/password/i).fill('secret')
      await page.getByRole('button', { name: /save credentials/i }).click()

      // Test connection
      await page.getByRole('button', { name: /test connection/i }).click()

      await expect(page.getByText(/connection failed/i)).toBeVisible()
    })

    test('handles network error', async ({ page }) => {
      await page.route('**/auth/check', async (route) => {
        await route.abort('failed')
      })

      // Save credentials
      await page.getByLabel(/username/i).fill('admin')
      await page.getByLabel(/password/i).fill('secret')
      await page.getByRole('button', { name: /save credentials/i }).click()

      // Test connection
      await page.getByRole('button', { name: /test connection/i }).click()

      await expect(page.getByText(/connection failed|network error/i)).toBeVisible()
    })

    test('handles timeout', async ({ page }) => {
      // Set short timeout
      page.setDefaultTimeout(5000)

      await page.route('**/auth/check', async (route) => {
        // Never respond - will timeout
        await new Promise((resolve) => setTimeout(resolve, 10000))
        await route.fulfill({ status: 200 })
      })

      // Save credentials
      await page.getByLabel(/username/i).fill('admin')
      await page.getByLabel(/password/i).fill('secret')
      await page.getByRole('button', { name: /save credentials/i }).click()

      // Test connection - will timeout
      await page.getByRole('button', { name: /test connection/i }).click()

      // Restore default timeout
      page.setDefaultTimeout(30000)
    })
  })

  test.describe('API Failure Handling from Other Pages', () => {
    test('redirects to settings on 401 from dashboard', async ({ page }) => {
      // First set up credentials
      await page.getByLabel(/username/i).fill('admin')
      await page.getByLabel(/password/i).fill('secret')
      await page.getByRole('button', { name: /save credentials/i }).click()

      // Mock 401 on dashboard stats
      await page.route('**/api/metadata/stats', async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Unauthorized' }),
        })
      })

      // Navigate to dashboard
      await page.goto('/dashboard')

      // Should show session expired toast
      await expect(page.getByText(/session expired|credentials cleared/i)).toBeVisible()
    })
  })

  test.describe('Role-Based Display', () => {
    const roles = ['admin', 'contributor', 'viewer'] as const

    for (const role of roles) {
      test(`displays ${role} role badge correctly`, async ({ page }) => {
        await page.route('**/auth/check', async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ valid: true, role }),
          })
        })

        // Save credentials
        await page.getByLabel(/username/i).fill('user')
        await page.getByLabel(/password/i).fill('pass')
        await page.getByRole('button', { name: /save credentials/i }).click()

        // Test connection
        await page.getByRole('button', { name: /test connection/i }).click()

        await expect(page.getByText(new RegExp(role, 'i'))).toBeVisible()
      })
    }
  })

  test.describe('Accessibility', () => {
    test('form has proper labels', async ({ page }) => {
      const usernameInput = page.getByLabel(/username/i)
      const passwordInput = page.getByLabel(/password/i)

      await expect(usernameInput).toBeVisible()
      await expect(passwordInput).toBeVisible()
    })

    test('buttons are keyboard accessible', async ({ page }) => {
      await page.getByLabel(/username/i).fill('admin')
      await page.getByLabel(/password/i).fill('secret')

      // Tab to save button
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter')

      // Should have saved
      await expect(page.getByText(/credentials saved/i)).toBeVisible()
    })

    test('error messages are announced', async ({ page }) => {
      await page.getByRole('button', { name: /save credentials/i }).click({ force: true })

      const errorMessage = page.getByText(/username is required/i)
      await expect(errorMessage).toHaveAttribute('role', 'alert')
    })
  })

  test.describe('Persistence Behavior', () => {
    test('credentials persist across page navigation', async ({ page }) => {
      // Save credentials
      await page.getByLabel(/username/i).fill('persistuser')
      await page.getByLabel(/password/i).fill('persistpass')
      await page.getByRole('button', { name: /save credentials/i }).click()

      // Navigate away
      await page.goto('/dashboard')

      // Navigate back
      await page.goto('/settings')

      // Should still show username
      await expect(page.getByText(/persistuser/i)).toBeVisible()
    })

    test('credentials clear on page refresh (session memory)', async ({ page }) => {
      // Save credentials
      await page.getByLabel(/username/i).fill('tempuser')
      await page.getByLabel(/password/i).fill('temppass')
      await page.getByRole('button', { name: /save credentials/i }).click()

      // Hard refresh
      await page.reload()

      // Should show no credentials (Zustand doesn't persist by default)
      await expect(page.getByText(/no credentials configured/i)).toBeVisible()
    })
  })
})
