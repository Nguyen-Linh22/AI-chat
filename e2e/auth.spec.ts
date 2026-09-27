import { test, expect } from '@playwright/test'

test('user can register successfully', async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`
  const password = 'TestPassword123!'

  await page.goto('/register')

  await expect(
    page.getByRole('heading', { name: 'Đăng ký' })
  ).toBeVisible()

  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password)
  await page.getByLabel('Xác nhận mật khẩu').fill(password)

  await page.getByRole('button', { name: 'Đăng ký' }).click()

  await expect(page).toHaveURL(/\/login$/, { timeout: 10_000 })
})

test('registered user can login and reach chat page', async ({ page }) => {
  const email = `e2e-login-${Date.now()}@example.com`
  const password = 'TestPassword123!'

  // Register user through the UI
  await page.goto('/register')

  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password)
  await page.getByLabel('Xác nhận mật khẩu').fill(password)

  await page.getByRole('button', { name: 'Đăng ký' }).click()

  await expect(page).toHaveURL(/\/login$/)

  // Login through the UI
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password)

  await page.getByRole('button', { name: 'Đăng nhập' }).click()

  await expect(page).toHaveURL(/\/chat$/)
})
