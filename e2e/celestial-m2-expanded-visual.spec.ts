import fs from 'node:fs'
import path from 'node:path'
import { test, expect } from '@playwright/test'

const BEFORE_DIR = path.resolve(process.cwd(), 'screenshots/m2-expanded-editor/before')
if (!fs.existsSync(BEFORE_DIR)) {
  fs.mkdirSync(BEFORE_DIR, { recursive: true })
}

const AFTER_DIR = path.resolve(process.cwd(), 'screenshots/m2-expanded-editor/after')
if (!fs.existsSync(AFTER_DIR)) {
  fs.mkdirSync(AFTER_DIR, { recursive: true })
}

const targetDir = process.env.CAPTURE_MODE === 'after' ? AFTER_DIR : BEFORE_DIR

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
            id: 'mock-user-m2',
            email: 'user.m2@example.com',
            name: 'M2 Tester',
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
              id: 'chat-m2-1',
              title: 'Thử nghiệm Expanded Editor Modal',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        }),
      })
    }

    if (url.includes('/api/chats/chat-m2-1/messages') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          messages: [
            {
              id: 'msg-m2-1',
              chatId: 'chat-m2-1',
              role: 'user',
              content: 'Chào AI, hãy soạn tài liệu kiến trúc.',
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

async function openExpandedEditor(page: any, theme: 'light' | 'dark' | 'zyricon', prefix: string) {
  await page.addInitScript((t: string) => {
    localStorage.setItem('theme', t)
  }, theme)

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/chat')
  await page.waitForLoadState('networkidle')

  const textarea = page.locator('textarea[placeholder="Nhập tin nhắn..."]')
  await expect(textarea).toBeVisible({ timeout: 10_000 })
  await textarea.fill('# Kế hoạch Kiến trúc Celestial Daylight\n\nNội dung soạn thảo trong **Expanded Editor Modal** nhằm kiểm tra Send button và các trạng thái.')

  const expandBtn = page.locator('button[aria-label="Mở rộng trình soạn thảo"]')
  await expect(expandBtn).toBeVisible()
  await expandBtn.click()

  const modal = page.locator('[role="dialog"][aria-label="Soạn tin nhắn"]')
  await expect(modal).toBeVisible()
  await page.waitForTimeout(400)

  // Capture full modal
  await page.screenshot({
    path: path.join(targetDir, `${prefix}-${theme}.png`),
    fullPage: false,
  })

  // Capture close up of footer (send button & actions)
  const footer = modal.locator('.flex.flex-wrap.items-center.justify-between').last()
  if (await footer.isVisible()) {
    await footer.screenshot({
      path: path.join(targetDir, `${prefix}-footer-${theme}.png`),
    })
  }

  // Close modal
  const cancelBtn = page.getByRole('button', { name: 'Hủy' })
  await cancelBtn.click()
  await expect(modal).toBeHidden()
}

test('1. Capture Expanded Editor Modal — Light Theme', async ({ page }) => {
  await openExpandedEditor(page, 'light', 'expanded-editor')
})

test('2. Capture Expanded Editor Modal — Dark Theme', async ({ page }) => {
  await openExpandedEditor(page, 'dark', 'expanded-editor')
})

test('3. Capture Expanded Editor Modal — Zyricon Theme', async ({ page }) => {
  await openExpandedEditor(page, 'zyricon', 'expanded-editor')
})
