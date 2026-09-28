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

test('visual and responsive verification for login and register', async ({ page }) => {
  // 1. Desktop Login (1440x900)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Đăng nhập' })).toBeVisible()
  await page.waitForTimeout(400)
  await page.getByLabel('Email').fill('tester@example.com')
  await page.waitForTimeout(200)
  await page.screenshot({ path: 'screenshots/login-desktop-1440.png' })

  // 2. Error state & shake verification
  await page.getByLabel('Mật khẩu', { exact: true }).fill('WrongPass')
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 })
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'screenshots/login-error-shake.png' })

  // 3. Switch to Register via UI
  await page.getByRole('button', { name: 'Đăng ký' }).click()
  await expect(page).toHaveURL(/\/register$/)
  await expect(page.getByRole('heading', { name: 'Đăng ký' })).toBeVisible()
  await page.waitForTimeout(700)

  // 4. Password Strength Meter test (Weak -> Strong)
  await page.getByLabel('Email').fill('newuser@example.com')
  await page.getByLabel('Mật khẩu', { exact: true }).fill('Abc!123456')
  await expect(page.getByText('Mạnh', { exact: true })).toBeVisible()
  await page.waitForTimeout(300)
  await page.screenshot({ path: 'screenshots/register-desktop-strength.png' })

  // 5. Tablet Viewport (768x1024)
  await page.setViewportSize({ width: 768, height: 1024 })
  await page.waitForTimeout(300)
  await page.screenshot({ path: 'screenshots/register-tablet-768.png' })

  // 6. Mobile Viewport (390x844)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(300)
  await page.screenshot({ path: 'screenshots/register-mobile-390.png' })

  // 7. Mobile Login
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Đăng nhập' })).toBeVisible()
  await page.waitForTimeout(300)
  await page.screenshot({ path: 'screenshots/login-mobile-390.png' })
})


