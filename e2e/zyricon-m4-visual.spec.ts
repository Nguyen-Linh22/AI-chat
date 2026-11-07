import fs from 'node:fs'
import path from 'node:path'
import { test, expect, Page } from '@playwright/test'

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'screenshots/zyricon-m4')
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
}

async function setAppTheme(page: Page, targetTheme: 'light' | 'dark' | 'zyricon') {
  const themeBtn = page.locator('#theme-selector-btn')
  if (await themeBtn.isVisible()) {
    await themeBtn.click()
    const option = page.locator(`#theme-option-${targetTheme}`)
    if (await option.isVisible()) {
      await option.click()
    }
  }

  await page.waitForTimeout(400)
  await page.evaluate(() => document.fonts.ready)
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })

  await page.addInitScript(() => {
    localStorage.setItem('theme', 'zyricon')
    localStorage.removeItem('chat-store')
  })

  await page.route('https://accounts.google.com/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: 'window.google = { accounts: { id: { initialize: () => {}, renderButton: () => {} } } };',
    })
  )

  await page.route('**/api/**', async (route) => {
    const url = route.request().url()
    const method = route.request().method()

    if (url.includes('/api/ai/models') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          models: [
            {
              id: 'gemini-3.6-flash',
              name: 'Gemini 3.6 Flash',
              provider: 'gemini',
              model: 'gemini-3.6-flash',
              available: true,
            },
            {
              id: 'ollama-qwen3-1.7b',
              name: 'Qwen 3 (1.7B)',
              provider: 'ollama',
              model: 'qwen3:1.7b',
              available: true,
            },
          ],
        }),
      })
    }

    if (url.includes('/api/auth/me') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'mock-user-m4',
            email: 'zyricon.designer@example.com',
            name: 'Zyricon Creator',
            createdAt: '2026-11-06T00:00:00.000Z',
          },
        }),
      })
    }

    if (url.endsWith('/api/chats') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          chats: [],
        }),
      })
    }

    if (url.includes('/api/chats/') && url.includes('/messages') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          messages: [],
          nextCursor: null,
          hasMore: false,
        }),
      })
    }

    return route.fulfill({ status: 200, body: '{}' })
  })
})

test('M4 Visual Capture: Desktop 1440px Zyricon Empty State with AI Orb', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/chat')

  await expect(page.getByTestId('zyricon-ai-orb')).toBeVisible({ timeout: 10000 })
  await expect(page.getByRole('heading', { name: /Ready to Create Something New\?/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Gợi ý hành động: Create Image/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Khám phá: Image Generator/i })).toBeVisible()

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'desktop-1440-zyricon-empty-m4.png'),
    fullPage: false,
  })
})

test('M4 Visual Capture: Laptop 1024px Zyricon Empty State', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 })
  await page.goto('/chat')

  await expect(page.getByTestId('zyricon-ai-orb')).toBeVisible({ timeout: 10000 })
  await expect(page.getByRole('heading', { name: /Ready to Create Something New\?/i })).toBeVisible()

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'laptop-1024-zyricon-empty-m4.png'),
    fullPage: false,
  })
})

test('M4 Visual Capture: Tablet 768px Zyricon Empty State', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 })
  await page.goto('/chat')

  await expect(page.getByTestId('zyricon-ai-orb')).toBeVisible({ timeout: 10000 })
  await expect(page.getByRole('heading', { name: /Ready to Create Something New\?/i })).toBeVisible()

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'tablet-768-zyricon-empty-m4.png'),
    fullPage: false,
  })
})

test('M4 Visual Capture: Mobile 375px Zyricon Empty State', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/chat')

  await expect(page.getByTestId('zyricon-ai-orb')).toBeVisible({ timeout: 10000 })
  await expect(page.getByRole('heading', { name: /Ready to Create Something New\?/i })).toBeVisible()

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'mobile-375-zyricon-empty-m4.png'),
    fullPage: false,
  })
})

test('M4 Visual Capture: Prompt Selection via Chip populates composer', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/chat')

  await expect(page.getByTestId('zyricon-ai-orb')).toBeVisible({ timeout: 10000 })
  const brainstormBtn = page.getByRole('button', { name: /Gợi ý hành động: Brainstorm/i })
  await brainstormBtn.click()

  const textarea = page.locator('#chat-composer-textarea, textarea')
  await expect(textarea).toHaveValue(/Hãy cùng tôi brainstorm các ý tưởng sáng tạo/i)

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'desktop-1440-zyricon-chip-selected-m4.png'),
    fullPage: false,
  })
})

test('M4 Regression Capture: Light Theme at 1440px intact', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/chat')

  await setAppTheme(page, 'light')
  await expect(page.getByRole('heading', { name: /Chào mừng/i })).toBeVisible({ timeout: 10000 })
  await expect(page.getByText('Workspace Sẵn Sàng')).toBeVisible()

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'desktop-1440-light-regression-m4.png'),
    fullPage: false,
  })
})

test('M4 Regression Capture: Dark Theme at 1440px intact', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/chat')

  await setAppTheme(page, 'dark')
  await expect(page.getByRole('heading', { name: /Chào mừng/i })).toBeVisible({ timeout: 10000 })
  await expect(page.getByText('Workspace Sẵn Sàng')).toBeVisible()

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'desktop-1440-dark-regression-m4.png'),
    fullPage: false,
  })
})
