import fs from 'node:fs'
import path from 'node:path'
import { test, expect } from '@playwright/test'

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'screenshots/m3-sidebar-background')
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
}

test.beforeEach(async ({ page }) => {
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
            id: 'mock-user-m3',
            email: 'celestial.m3@example.com',
            name: 'Celestial Tester',
          },
        }),
      })
    }

    if (url.endsWith('/api/chats') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          chats: [
            {
              id: 'chat-m3-1',
              title: 'Kiểm thử Bầu trời Sidebar M3',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: 'chat-m3-2',
              title: 'Lịch sử thiết kế Celestial Daylight',
              createdAt: new Date(Date.now() - 3600000).toISOString(),
              updatedAt: new Date(Date.now() - 3600000).toISOString(),
            },
          ],
        }),
      })
    }

    if (url.includes('/api/chats/chat-m3-1/messages') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          messages: [
            {
              id: 'msg-m3-1',
              chatId: 'chat-m3-1',
              role: 'user',
              content: 'Xin chào AI, kiểm tra giao diện Sidebar.',
              createdAt: new Date(Date.now() - 60000).toISOString(),
            },
          ],
          hasMore: false,
        }),
      })
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    })
  })
})

test('1. Light expanded Sidebar (240px)', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('theme', 'light')
  })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/chat')
  await page.waitForLoadState('networkidle')

  const sidebar = page.locator('#app-sidebar')
  await expect(sidebar).toBeVisible({ timeout: 10_000 })
  await page.waitForTimeout(300)

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'sidebar-light-expanded.png'),
    fullPage: false,
  })
})

test('2. Light collapsed Sidebar (64px)', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('theme', 'light')
  })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/chat')
  await page.waitForLoadState('networkidle')

  const collapseBtn = page.getByRole('button', { name: /Thu gọn thanh bên/i })
  await expect(collapseBtn).toBeVisible({ timeout: 10_000 })
  await collapseBtn.click()
  await page.waitForTimeout(400)

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'sidebar-light-collapsed.png'),
    fullPage: false,
  })
})

test('3. Dark expanded Sidebar', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('theme', 'dark')
  })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/chat')
  await page.waitForLoadState('networkidle')

  const sidebar = page.locator('#app-sidebar')
  await expect(sidebar).toBeVisible({ timeout: 10_000 })
  await page.waitForTimeout(300)

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'sidebar-dark-expanded.png'),
    fullPage: false,
  })
})

test('4. Zyricon expanded Sidebar', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('theme', 'zyricon')
  })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/chat')
  await page.waitForLoadState('networkidle')

  const sidebar = page.locator('#app-sidebar')
  await expect(sidebar).toBeVisible({ timeout: 10_000 })
  await page.waitForTimeout(300)

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'sidebar-zyricon-expanded.png'),
    fullPage: false,
  })
})

test('5. Mobile drawer (390px viewport)', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('theme', 'light')
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/chat')
  await page.waitForLoadState('networkidle')

  const openBtn = page.getByRole('button', { name: /Mở menu/i })
  await expect(openBtn).toBeVisible({ timeout: 10_000 })
  await openBtn.click()
  await page.waitForTimeout(400)

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'sidebar-mobile-drawer.png'),
    fullPage: false,
  })
})

test('6. Reduced motion mode', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(() => {
    localStorage.setItem('theme', 'light')
  })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/chat')
  await page.waitForLoadState('networkidle')

  const sidebar = page.locator('#app-sidebar')
  await expect(sidebar).toBeVisible({ timeout: 10_000 })
  await page.waitForTimeout(300)

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'sidebar-reduced-motion.png'),
    fullPage: false,
  })
})

