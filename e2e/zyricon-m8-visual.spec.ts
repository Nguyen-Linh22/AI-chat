import fs from 'node:fs'
import path from 'node:path'
import { test, expect, Page } from '@playwright/test'

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'screenshots/zyricon-m8')
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
}

const MOCK_CHAT = {
  id: 'chat-m8-active',
  title: 'Zyricon Architecture & Final Review',
  userId: 'mock-user-m8',
  createdAt: '2026-11-06T00:00:00.000Z',
  updatedAt: '2026-11-06T00:00:00.000Z',
}

const MOCK_MESSAGES = [
  {
    id: 'msg-m8-user',
    chatSessionId: 'chat-m8-active',
    role: 'user',
    content: 'Tổng hợp kết quả triển khai toàn bộ các milestone của Zyricon Theme.',
    createdAt: '2026-11-06T00:00:00.000Z',
    attachments: [],
  },
  {
    id: 'msg-m8-ai',
    chatSessionId: 'chat-m8-active',
    role: 'assistant',
    content: `# Kết quả triển khai Zyricon Theme

Tất cả 8 milestone đã hoàn tất với độ tương thích và thẩm mỹ cao:

| Milestone | Tên module | Trạng thái nghiệm thu |
| :--- | :--- | :--- |
| M0–M2 | Route Isolation & Store | Đã nghiệm thu |
| M3 | Sidebar & Layout | Đã nghiệm thu |
| M4 | AI Orb & Welcome | Đã nghiệm thu |
| M5 | Composer & Toolbar | Đã nghiệm thu |
| M6 | Conversation & Messages | Đã nghiệm thu |
| M7 | Dropdowns & Modals | Đã nghiệm thu |
| M8 | Responsive & Regression | Đang nghiệm thu |

\`\`\`typescript
export const ZYRICON_STATUS = {
  theme: 'zyricon',
  totalMilestones: 8,
  status: 'ALL_PASSED_100_PERCENT'
};
\`\`\`

Toàn bộ hệ thống sẵn sàng hoạt động thương mại hóa.`,
    createdAt: '2026-11-06T00:00:01.000Z',
    attachments: [],
  },
]

let activeChats: any[] = []
let activeMessages: any[] = []

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
  activeChats = []
  activeMessages = []

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
            id: 'mock-user-m8',
            email: 'zyricon.m8@example.com',
            name: 'Zyricon Master',
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
          chats: activeChats,
        }),
      })
    }

    if (url.includes('/api/chats/chat-m8-active/messages') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          messages: activeMessages,
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

test('M8-01: Desktop Viewport (1440x900) - Full Workspace & AI Orb Welcome Experience', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/chat')
  await page.waitForLoadState('networkidle')

  // Verify Welcome Screen Elements
  await expect(page.locator('text=Ready to Create Something New?').first()).toBeVisible({ timeout: 10_000 })
  await expect(page.locator('text=Create Image').first()).toBeVisible()
  await expect(page.locator('textarea[placeholder="Nhập tin nhắn..."]')).toBeVisible()

  // Verify no horizontal overflow
  const hasHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(hasHorizontalScroll).toBe(false)

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'desktop-1440-zyricon-workspace.png'),
    fullPage: false,
  })
})

test('M8-02: Laptop Viewport (1024x768) - Adapted Workspace Layout & Spacing', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 })
  await page.goto('/chat')
  await page.waitForLoadState('networkidle')

  await expect(page.locator('text=Ready to Create Something New?').first()).toBeVisible({ timeout: 10_000 })
  await expect(page.locator('textarea[placeholder="Nhập tin nhắn..."]')).toBeVisible()

  const hasHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(hasHorizontalScroll).toBe(false)

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'laptop-1024-zyricon-workspace.png'),
    fullPage: false,
  })
})

test('M8-03: Tablet Viewport (768x1024) - Clean Layout and Sidebar Usability', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 })
  await page.goto('/chat')
  await page.waitForLoadState('networkidle')

  await expect(page.locator('text=Ready to Create Something New?').first()).toBeVisible({ timeout: 10_000 })

  const hasHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(hasHorizontalScroll).toBe(false)

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'tablet-768-zyricon-workspace.png'),
    fullPage: false,
  })
})

test('M8-04: Mobile Viewport (375x812) - Welcome Experience & Responsive AI Orb', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/chat')
  await page.waitForLoadState('networkidle')

  await expect(page.locator('text=Ready to Create Something New?').first()).toBeVisible({ timeout: 10_000 })
  await expect(page.locator('textarea[placeholder="Nhập tin nhắn..."]')).toBeVisible()

  const hasHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(hasHorizontalScroll).toBe(false)

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'mobile-375-zyricon-welcome.png'),
    fullPage: false,
  })
})

test('M8-05: Mobile Viewport (375x812) - Active Conversation State with Code & Table', async ({ page }) => {
  activeChats = [MOCK_CHAT]
  activeMessages = MOCK_MESSAGES

  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/chat')
  await page.waitForLoadState('networkidle')

  // Open sidebar drawer on mobile if chat not yet opened
  const drawerBtn = page.locator('button[aria-label="Mở menu danh sách đoạn chat"]')
  if (await drawerBtn.isVisible()) {
    await drawerBtn.click()
    await page.waitForTimeout(300)

    const chatItem = page.locator('text=Zyricon Architecture & Final Review').first()
    if (await chatItem.isVisible()) {
      await chatItem.click()
    }
  }

  // Verify messages visible
  await expect(page.locator('text=Tổng hợp kết quả triển khai toàn bộ các milestone').first()).toBeVisible({ timeout: 10_000 })
  await expect(page.locator('text=Kết quả triển khai Zyricon Theme').first()).toBeVisible()

  const hasHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(hasHorizontalScroll).toBe(false)

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'mobile-375-zyricon-conversation.png'),
    fullPage: false,
  })
})

test('M8-06: Keyboard Navigation & Focus Visible Ring Consistency', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/chat')
  await page.waitForLoadState('networkidle')

  // Focus theme selector trigger
  const themeBtn = page.locator('#theme-selector-btn')
  await themeBtn.focus()
  await expect(themeBtn).toBeFocused()

  // Focus composer textarea
  const textarea = page.locator('textarea[placeholder="Nhập tin nhắn..."]')
  await textarea.focus()
  await expect(textarea).toBeFocused()

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'desktop-1440-zyricon-keyboard-focus.png'),
    fullPage: false,
  })
})

test('M8-07: Reduced Motion Verification (Animations Neutralized)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/chat')
  await page.waitForLoadState('networkidle')

  // Verify orb animation is disabled under reduced motion
  const orb = page.locator('.zyricon-orb-container').first()
  if (await orb.isVisible()) {
    const animationName = await orb.evaluate((el) => window.getComputedStyle(el).animationName)
    expect(animationName === 'none' || animationName === '').toBe(true)
  }

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'desktop-1440-zyricon-reduced-motion.png'),
    fullPage: false,
  })
})

test('M8-08: Full Light Theme Final Regression Baseline', async ({ page }) => {
  activeChats = [MOCK_CHAT]
  activeMessages = MOCK_MESSAGES

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/chat')
  await page.waitForLoadState('networkidle')

  await setAppTheme(page, 'light')

  const chatItem = page.locator('text=Zyricon Architecture & Final Review').first()
  if (await chatItem.isVisible()) {
    await chatItem.click()
  }

  await expect(page.locator('html')).not.toHaveClass(/zyricon/)
  await expect(page.locator('html')).not.toHaveClass(/dark/)

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'desktop-1440-light-final-regression.png'),
    fullPage: false,
  })
})

test('M8-09: Full Dark Theme Final Regression Baseline', async ({ page }) => {
  activeChats = [MOCK_CHAT]
  activeMessages = MOCK_MESSAGES

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/chat')
  await page.waitForLoadState('networkidle')

  await setAppTheme(page, 'dark')

  const chatItem = page.locator('text=Zyricon Architecture & Final Review').first()
  if (await chatItem.isVisible()) {
    await chatItem.click()
  }

  await expect(page.locator('html')).not.toHaveClass(/zyricon/)
  await expect(page.locator('html')).toHaveClass(/dark/)

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'desktop-1440-dark-final-regression.png'),
    fullPage: false,
  })
})
