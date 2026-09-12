import { expect, test } from '@playwright/test'

test('home page loads and shows the login form', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Sign in to FamFin' })).toBeVisible()
})

test('submitting the login form with invalid credentials shows an error', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Email').fill('nonexistent@famfin.test')
  await page.getByLabel('Password').fill('wrongpassword')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('alert').last()).toBeVisible()
})
