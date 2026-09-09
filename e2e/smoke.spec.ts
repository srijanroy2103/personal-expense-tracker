import { expect, test } from '@playwright/test'

test('home page loads and shows Hello FamFin', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Hello FamFin' })).toBeVisible()
})
