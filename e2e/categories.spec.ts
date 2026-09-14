import { expect, test } from '@playwright/test'

// Requires a real seeded Supabase user's credentials (not committed — see
// SETUP.md / PROGRESS.md). Skips gracefully when not provided so the base
// test:e2e run still passes without live backend credentials.
const email = process.env.E2E_TEST_EMAIL
const password = process.env.E2E_TEST_PASSWORD

test.describe('Categories CRUD', () => {
  test.skip(!email || !password, 'E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set — skipping live-backend test')

  test('create, edit, and delete a category', async ({ page }) => {
    const initialName = `E2E Category ${Date.now()}`
    const editedName = `${initialName} Edited`

    await page.goto('/')
    await page.getByLabel('Email').fill(email!)
    await page.getByLabel('Password').fill(password!)
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page.getByRole('heading', { name: 'Categories' })).toBeVisible()

    await page.getByLabel('Name').fill(initialName)
    await page.getByLabel('Type').selectOption('Expense')
    await page.getByRole('button', { name: 'Add' }).click()

    const row = page.locator('li', { hasText: initialName })
    await expect(row).toBeVisible()

    await row.getByRole('button', { name: 'Edit' }).click()
    await page.getByLabel('Name').fill(editedName)
    await page.getByRole('button', { name: 'Save' }).click()

    const editedRow = page.locator('li', { hasText: editedName })
    await expect(editedRow).toBeVisible()

    page.once('dialog', (dialog) => void dialog.accept())
    await editedRow.getByRole('button', { name: 'Delete' }).click()
    await expect(page.locator('li', { hasText: editedName })).toHaveCount(0)
  })
})
