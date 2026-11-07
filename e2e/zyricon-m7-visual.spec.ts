import fs from 'node:fs'
import path from 'node:path'
import { test, expect, Page } from '@playwright/test'

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'screenshots/zyricon-m7')
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

  await page.waitForTimeout(300)
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
            {
              id: 'openai-gpt-5-mini',
              name: 'GPT-5 Mini',
              provider: 'openai',
              model: 'gpt-5-mini',
              available: true,
            },
            {
              id: 'groq-gpt-oss-20b',
              name: 'Groq LPU 20B',
              provider: 'groq',
              model: 'groq-20b',
              available: false,
              disabledReason: 'Cần API key Groq',
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
            id: 'mock-user-m7',
            email: 'zyricon.m7@example.com',
            name: 'Zyricon Architect',
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
          chats: [
            {
              id: 'chat-m7-01',
              title: 'Thiết kế hệ thống Token Zyricon',
              userId: 'mock-user-m7',
              createdAt: '2026-11-06T00:00:00.000Z',
              updatedAt: '2026-11-06T00:00:00.000Z',
            },
            {
              id: 'chat-m7-02',
              title: 'Đánh giá giao diện Dark vs Light',
              userId: 'mock-user-m7',
              createdAt: '2026-11-05T00:00:00.000Z',
              updatedAt: '2026-11-05T00:00:00.000Z',
            },
          ],
        }),
      })
    }

    if (url.includes('/api/chats/chat-m7-01/messages') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          messages: [
            {
              id: 'msg-1',
              chatSessionId: 'chat-m7-01',
              role: 'user',
              content: 'Kiểm tra dropdowns and modals trong Zyricon theme.',
              createdAt: '2026-11-06T00:00:00.000Z',
              attachments: [],
            },
          ],
          nextCursor: null,
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

test('M7-01: Capture Zyricon Model Dropdown with Popover and Active Option', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/chat')
  await page.waitForLoadState('networkidle')

  // Open Model Selector dropdown
  const modelBtn = page.locator('#model-selector-btn')
  await expect(modelBtn).toBeVisible({ timeout: 10_000 })
  await modelBtn.click()

  const listbox = page.locator('#model-selector-listbox')
  await expect(listbox).toBeVisible()

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'desktop-1440-zyricon-model-dropdown.png'),
    fullPage: false,
  })
})

test('M7-02: Capture Zyricon Chat Action Menu (Popover)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/chat')
  await page.waitForLoadState('networkidle')

  // Locate the first chat item in sidebar and trigger its action menu
  const chatItem = page.locator('text=Thiết kế hệ thống Token Zyricon').first()
  await expect(chatItem).toBeVisible({ timeout: 10_000 })
  await chatItem.hover()

  // Click the more options button for this chat
  const actionBtn = page.locator('button[aria-label*="Thao tác với đoạn chat"]').first()
  await expect(actionBtn).toBeVisible()
  await actionBtn.click()

  const menu = page.locator('[role="menu"][aria-label="Tùy chọn đoạn chat"]')
  await expect(menu).toBeVisible()

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'desktop-1440-zyricon-chat-action-menu.png'),
    fullPage: false,
  })
})

test('M7-03: Capture Zyricon Search Chat Modal with Results', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/chat')
  await page.waitForLoadState('networkidle')

  // Click Search Chat button in sidebar
  const searchBtn = page.locator('button[aria-label="Tìm kiếm cuộc trò chuyện"]')
  await expect(searchBtn).toBeVisible({ timeout: 10_000 })
  await searchBtn.click()

  const searchModal = page.locator('[role="dialog"][aria-label="Tìm kiếm cuộc trò chuyện"]')
  await expect(searchModal).toBeVisible()

  // Type query to show highlighted matches
  const searchInput = page.locator('input[placeholder="Tìm kiếm theo tiêu đề cuộc trò chuyện..."]')
  await searchInput.fill('Token')

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'desktop-1440-zyricon-search-modal.png'),
    fullPage: false,
  })
})

test('M7-04: Capture Zyricon Delete Chat Modal', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/chat')
  await page.waitForLoadState('networkidle')

  // Trigger chat action menu then click delete
  const chatItem = page.locator('text=Thiết kế hệ thống Token Zyricon').first()
  await expect(chatItem).toBeVisible({ timeout: 10_000 })
  await chatItem.hover()

  const actionBtn = page.locator('button[aria-label*="Thao tác với đoạn chat"]').first()
  await expect(actionBtn).toBeVisible()
  await actionBtn.click()

  const deleteMenuItem = page.locator('button[role="menuitem"]:has-text("Xóa")')
  await expect(deleteMenuItem).toBeVisible()
  await deleteMenuItem.click()

  const deleteDialog = page.locator('[role="dialog"][aria-labelledby="delete-chat-title"]')
  await expect(deleteDialog).toBeVisible()

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'desktop-1440-zyricon-delete-modal.png'),
    fullPage: false,
  })
})

test('M7-05: Capture Zyricon Search Modal on Mobile Viewport (375px)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/chat')
  await page.waitForLoadState('networkidle')

  // Open sidebar drawer on mobile
  const drawerBtn = page.locator('button[aria-label="Mở menu danh sách đoạn chat"]')
  await expect(drawerBtn).toBeVisible({ timeout: 10_000 })
  await drawerBtn.click()
  await page.waitForTimeout(300)

  const searchBtn = page.locator('button[aria-label="Tìm kiếm cuộc trò chuyện"]')
  await expect(searchBtn).toBeVisible({ timeout: 10_000 })
  await searchBtn.click()

  const searchModal = page.locator('[role="dialog"][aria-label="Tìm kiếm cuộc trò chuyện"]')
  await expect(searchModal).toBeVisible()

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'mobile-375-zyricon-search-modal.png'),
    fullPage: false,
  })
})

test('M7-06: Capture Light Theme Model Dropdown Regression Baseline', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/chat')
  await page.waitForLoadState('networkidle')

  await setAppTheme(page, 'light')

  const modelBtn = page.locator('#model-selector-btn')
  await expect(modelBtn).toBeVisible()
  await modelBtn.click()

  const listbox = page.locator('#model-selector-listbox')
  await expect(listbox).toBeVisible()

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'desktop-1440-light-model-dropdown-regression.png'),
    fullPage: false,
  })
})

test('M7-07: Capture Dark Theme Model Dropdown Regression Baseline', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/chat')
  await page.waitForLoadState('networkidle')

  await setAppTheme(page, 'dark')

  const modelBtn = page.locator('#model-selector-btn')
  await expect(modelBtn).toBeVisible()
  await modelBtn.click()

  const listbox = page.locator('#model-selector-listbox')
  await expect(listbox).toBeVisible()

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'desktop-1440-dark-model-dropdown-regression.png'),
    fullPage: false,
  })
})
