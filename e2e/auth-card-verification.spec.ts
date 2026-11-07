import { test, expect } from '@playwright/test'
import * as path from 'path'
import * as fs from 'fs'

const SCREENSHOT_DIR = path.resolve('screenshots/auth-redesign')
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
}

const VIEWPORTS = [
  { width: 1440, height: 900, name: 'desktop-1440' },
  { width: 1024, height: 768, name: 'laptop-1024' },
  { width: 768, height: 1024, name: 'tablet-768' },
  { width: 375, height: 667, name: 'mobile-375' },
]

test.describe('Animated Auth Card Login Page Verification', () => {
  for (const vp of VIEWPORTS) {
    test(`Login renders correctly on solid #212121 background on ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('/login')

      // Verify solid #212121 (rgb(33, 33, 33)) background
      const root = page.getByTestId('login-page-root')
      await expect(root).toBeVisible()
      const bgColor = await root.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor
      })
      expect(bgColor).toBe('rgb(33, 33, 33)')

      // Verify zero horizontal overflow
      const hasHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth
      })
      expect(hasHorizontalOverflow).toBe(false)

      // Verify form elements exist
      await expect(page.getByRole('heading', { name: /Welcome Back!/i })).toBeVisible()
      await expect(page.getByPlaceholder('Email')).toBeVisible()
      await expect(page.getByPlaceholder('Password')).toBeVisible()
      await expect(page.getByRole('button', { name: /Sign In|Đăng nhập/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /Sign up, it's free!/i })).toBeVisible()

      // Take screenshot of default empty state
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `login-${vp.name}-empty.png`),
        fullPage: true,
      })
    })
  }

  test('Clicking "Sign up, it\'s free!" navigates to /register', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/login')

    const registerLink = page.getByRole('button', { name: /Sign up, it's free!/i })
    await expect(registerLink).toBeVisible()
    await registerLink.click()

    await expect(page).toHaveURL(/\/register/)
  })
})

test.describe('Animated Auth Card Register Page Verification', () => {
  for (const vp of VIEWPORTS) {
    test(`Register renders correctly on solid #212121 background on ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('/register')

      // Verify solid #212121 (rgb(33, 33, 33)) background
      const root = page.getByTestId('register-page-root')
      await expect(root).toBeVisible()
      const bgColor = await root.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor
      })
      expect(bgColor).toBe('rgb(33, 33, 33)')

      // Verify zero horizontal overflow
      const hasHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth
      })
      expect(hasHorizontalOverflow).toBe(false)

      // Verify form elements exist
      await expect(page.getByRole('heading', { name: /Create Account/i })).toBeVisible()
      await expect(page.getByText('Create your account and start your AI journey.')).toBeVisible()
      await expect(page.getByPlaceholder('Email')).toBeVisible()
      await expect(page.getByPlaceholder('Password', { exact: true })).toBeVisible()
      await expect(page.getByPlaceholder('Confirm Password')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible()
      await expect(page.getByRole('button', { name: /Sign in|Đăng nhập/i })).toBeVisible()

      // Take screenshot of default empty state
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `register-${vp.name}-empty.png`),
        fullPage: true,
      })

      // Type in inputs and verify password strength checklist appears
      await page.getByPlaceholder('Email').fill('newbie@example.com')
      await page.getByPlaceholder('Password', { exact: true }).fill('StrongPass123!@#')
      await page.getByPlaceholder('Confirm Password').fill('StrongPass123!@#')

      // Confirm strength meter is visible
      await expect(page.getByText(/Độ mạnh mật khẩu/i)).toBeVisible()

      // Take screenshot of filled state with strength checklist
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `register-${vp.name}-filled.png`),
        fullPage: true,
      })
    })
  }

  test('Clicking "Sign in" navigates to /login', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/register')

    const loginLink = page.getByRole('button', { name: /Sign in|Đăng nhập/i })
    await expect(loginLink).toBeVisible()
    await loginLink.click()

    await expect(page).toHaveURL(/\/login/)
  })
})
