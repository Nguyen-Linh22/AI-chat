import { test as setup, expect } from '@playwright/test'

const authFile = 'e2e/.auth/user.json'

setup('authenticate E2E user', async ({ page }) => {
  const email = `e2e-shared-${Date.now()}@example.com`
  const password = 'TestPassword123!'

  // Register
  await page.goto('/register')

  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password)
  await page.getByLabel('Xác nhận mật khẩu').fill(password)

  await page.getByRole('button', { name: 'Đăng ký' }).click()

  await expect(page).toHaveURL(/\/login$/, { timeout: 10_000 })

  // Login
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password)

  await page.getByRole('button', { name: 'Đăng nhập' }).click()

  await expect(page).toHaveURL(/\/chat$/, { timeout: 10_000 })

  // Save authenticated browser state
  await page.context().storageState({ path: authFile })
})
