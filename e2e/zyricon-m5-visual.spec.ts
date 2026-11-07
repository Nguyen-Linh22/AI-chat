import fs from 'node:fs'
import path from 'node:path'
import { test, expect, Page } from '@playwright/test'

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'screenshots/zyricon-m5')
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
}

async function setAppTheme(page: Page, targetTheme: 'light' | 'dark' | 'zyricon') {
  const themeBtn = page.locator('#theme-selector-btn')
  await expect(themeBtn).toBeVisible()
  await themeBtn.click()
  const option = page.locator(`#theme-option-${targetTheme}`)
  await expect(option).toBeVisible()
  await option.click()

  if (targetTheme === 'zyricon') {
    await expect(page.locator('html')).toHaveClass(/zyricon/)
  } else if (targetTheme === 'dark') {
    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect(page.locator('html')).not.toHaveClass(/zyricon/)
  } else {
    await expect(page.locator('html')).not.toHaveClass(/dark/)
    await expect(page.locator('html')).not.toHaveClass(/zyricon/)
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
            id: 'mock-user-m5',
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
        }),
      })
    }

    return route.continue()
  })
})

test('1. Desktop 1440px — Zyricon Composer Idle State', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')

  const textarea = page.locator('textarea[placeholder="Nhập tin nhắn..."]')
  await expect(textarea).toBeVisible()

  // Verify controls in the two-tier layout
  const attachBtn = page.getByRole('button', { name: 'Đính kèm file' })
  await expect(attachBtn).toBeVisible()

  const modelBadge = page.locator('[data-testid="model-indicator"]')
  await expect(modelBadge).toBeVisible()

  const expandBtn = page.getByRole('button', { name: 'Mở rộng trình soạn thảo' })
  await expect(expandBtn).toBeVisible()

  const sendBtn = page.getByRole('button', { name: 'Gửi' })
  await expect(sendBtn).toBeVisible()
  await expect(sendBtn).toBeDisabled()

  await page.waitForTimeout(500)
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'desktop-1440-zyricon-composer-idle.png'),
    fullPage: false,
  })
})

test('2. Desktop 1440px — Zyricon Composer Focused & Active Text', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')

  const textarea = page.locator('textarea[placeholder="Nhập tin nhắn..."]')
  await expect(textarea).toBeVisible()

  await textarea.click()
  await textarea.fill('Hello Zyricon, design me a sleek AI interface with purple ambient lighting.')

  const sendBtn = page.getByRole('button', { name: 'Gửi' })
  await expect(sendBtn).toBeEnabled()

  await page.waitForTimeout(400)
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'desktop-1440-zyricon-composer-focused.png'),
    fullPage: false,
  })
})

test('3. Desktop 1440px — Zyricon Attachment Popover & Controls', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')

  const attachBtn = page.getByRole('button', { name: 'Đính kèm file' })
  await expect(attachBtn).toBeVisible()

  await attachBtn.click()

  const popover = page.getByRole('dialog', { name: 'Đính kèm tệp' })
  await expect(popover).toBeVisible()

  const docOption = page.getByRole('button', { name: 'Tài liệu (PDF, TXT)' })
  await expect(docOption).toBeVisible()

  const codeOption = page.getByRole('button', { name: 'Mã nguồn' })
  await expect(codeOption).toBeVisible()

  await page.waitForTimeout(400)
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'desktop-1440-zyricon-composer-attachment.png'),
    fullPage: false,
  })
})

test('4. Desktop 1440px — Zyricon ExpandedEditorModal', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')

  const textarea = page.locator('textarea[placeholder="Nhập tin nhắn..."]')
  await textarea.fill('const message = "Zyricon Expanded Composer Mode";\nconsole.log(message);')

  const expandBtn = page.getByRole('button', { name: 'Mở rộng trình soạn thảo' })
  await expandBtn.click()

  const modal = page.locator('[role="dialog"][aria-label="Soạn tin nhắn"]')
  await expect(modal).toBeVisible()

  await page.waitForTimeout(500)
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'desktop-1440-zyricon-composer-expanded.png'),
    fullPage: false,
  })
})

test('5. Mobile 375px — Zyricon Composer Layout', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')

  const textarea = page.locator('textarea[placeholder="Nhập tin nhắn..."]')
  await expect(textarea).toBeVisible()

  const sendBtn = page.getByRole('button', { name: 'Gửi' })
  await expect(sendBtn).toBeVisible()

  await page.waitForTimeout(500)
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'mobile-375-zyricon-composer.png'),
    fullPage: false,
  })
})

test('6. Desktop 1440px — Light Theme Baseline Composer Regression', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')

  await setAppTheme(page, 'light')

  const textarea = page.locator('textarea[placeholder="Nhập tin nhắn..."]')
  await expect(textarea).toBeVisible()

  const sendBtn = page.getByRole('button', { name: 'Gửi' })
  await expect(sendBtn).toBeVisible()

  await page.waitForTimeout(500)
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'desktop-1440-light-composer-regression.png'),
    fullPage: false,
  })
})

test('7. Desktop 1440px — Dark Theme Baseline Composer Regression', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')

  await setAppTheme(page, 'dark')

  const textarea = page.locator('textarea[placeholder="Nhập tin nhắn..."]')
  await expect(textarea).toBeVisible()

  const sendBtn = page.getByRole('button', { name: 'Gửi' })
  await expect(sendBtn).toBeVisible()

  await page.waitForTimeout(500)
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'desktop-1440-dark-composer-regression.png'),
    fullPage: false,
  })
})
