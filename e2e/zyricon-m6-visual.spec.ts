import fs from 'node:fs'
import path from 'node:path'
import { test, expect, Page } from '@playwright/test'

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'screenshots/zyricon-m6')
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
            id: 'mock-user-m6',
            email: 'zyricon.m6@example.com',
            name: 'Zyricon Designer',
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
              id: 'chat-m6-session',
              title: 'Zyricon Architecture & Tokens',
              userId: 'mock-user-m6',
              createdAt: '2026-11-06T00:00:00.000Z',
              updatedAt: '2026-11-06T00:00:00.000Z',
            },
          ],
        }),
      })
    }

    if (url.includes('/api/chats/chat-m6-session/messages') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          messages: [
            {
              id: 'msg-user-1',
              chatSessionId: 'chat-m6-session',
              role: 'user',
              content: 'Chào AI, hãy trình bày thiết kế kiến trúc Zyricon và hướng dẫn triển khai Token System.',
              createdAt: '2026-11-06T00:00:00.000Z',
              attachments: [
                {
                  id: 'att-m6-1',
                  fileName: 'zyricon-design-system.pdf',
                  fileUrl: 'https://example.com/zyricon-design-system.pdf',
                  fileType: 'application/pdf',
                  sizeBytes: '102400',
                  createdAt: '2026-11-06T00:00:00.000Z',
                },
              ],
            },
            {
              id: 'msg-ai-1',
              chatSessionId: 'chat-m6-session',
              role: 'assistant',
              content: `# Kiến trúc giao diện Zyricon
Zyricon là theme thứ 3 của AI Chat Clone, kết hợp tông tím vũ trụ \`#07040B\` cùng điểm nhấn hồng \`#C27595\`.

> Thiết kế nhấn mạnh chiều sâu, sự tinh tế và không tạo cảm giác lòe loẹt hay quá chói.

### Bảng phân bố màu sắc chủ đạo

| Thành phần | Mã màu Hex | Ý nghĩa chức năng |
| :--- | :--- | :--- |
| Nền chính (Deep Space) | \`#07040B\` | Nền tổng thể không gian vũ trụ |
| Nền thẻ & Bubble | \`#120B1C\` | Bề mặt nổi với độ tương phản cao |
| Viền tím mờ | \`#694788\` | Phân cách nhẹ nhàng, tinh tế |
| Accent Pink | \`#C27595\` | Nút hành động, con trỏ và điểm nhấn |

### Mã nguồn mẫu khai báo Token

\`\`\`typescript
export interface ZyriconThemeConfig {
  background: '#07040B';
  primaryPurple: '#3B2568';
  accentPink: '#C27595';
  softPinkText: '#C4A5B8';
}

export const zyriconTheme: ZyriconThemeConfig = {
  background: '#07040B',
  primaryPurple: '#3B2568',
  accentPink: '#C27595',
  softPinkText: '#C4A5B8',
};
\`\`\`

Xem thêm tại [Tài liệu Thiết kế Dribbble](https://dribbble.com/shots/26578109-Zyricon-AI-Chatbot-Web-App).`,
              createdAt: '2026-11-06T00:00:01.000Z',
              attachments: [],
            },
            {
              id: 'msg-user-2',
              chatSessionId: 'chat-m6-session',
              role: 'user',
              content: 'Tiến hành kiểm tra chi tiết các message bubble và trạng thái streaming.',
              createdAt: '2026-11-06T00:00:02.000Z',
              attachments: [],
            },
            {
              id: 'msg-ai-2',
              chatSessionId: 'chat-m6-session',
              role: 'assistant',
              content: 'Tất cả các tin nhắn, khối code syntax highlight và bảng dữ liệu đã được tinh chỉnh hoàn hảo theo phong cách Zyricon.',
              createdAt: '2026-11-06T00:00:03.000Z',
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

test('M6-01: Capture Zyricon Active Conversation with User & AI messages', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/chat')
  await page.waitForLoadState('networkidle')

  // Click chat in sidebar to open active conversation
  const chatItem = page.locator('text=Zyricon Architecture & Tokens').first()
  await expect(chatItem).toBeVisible({ timeout: 10_000 })
  await chatItem.click()

  // Verify messages loaded
  await expect(page.locator('text=Chào AI, hãy trình bày thiết kế kiến trúc Zyricon').first()).toBeVisible()
  await expect(page.locator('text=Kiến trúc giao diện Zyricon').first()).toBeVisible()

  // Take active conversation screenshot
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'desktop-1440-zyricon-messages-conversation.png'),
    fullPage: false,
  })
})

test('M6-02: Capture Zyricon Code Block with dark cosmic surface and copy action', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/chat')
  await page.waitForLoadState('networkidle')

  const chatItem = page.locator('text=Zyricon Architecture & Tokens').first()
  await expect(chatItem).toBeVisible()
  await chatItem.click()

  const codeBlock = page.locator('[data-testid="code-block"]').first()
  await expect(codeBlock).toBeVisible()
  await codeBlock.scrollIntoViewIfNeeded()

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'desktop-1440-zyricon-messages-code-block.png'),
    fullPage: false,
  })
})

test('M6-03: Capture Zyricon Attachment Preview in User Message', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/chat')
  await page.waitForLoadState('networkidle')

  const chatItem = page.locator('text=Zyricon Architecture & Tokens').first()
  await expect(chatItem).toBeVisible()
  await chatItem.click()

  const attachmentLink = page.locator('a:has-text("zyricon-design-system.pdf")').first()
  await expect(attachmentLink).toBeVisible()
  await attachmentLink.scrollIntoViewIfNeeded()

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'desktop-1440-zyricon-messages-attachment.png'),
    fullPage: false,
  })
})

test('M6-04: Capture Zyricon Active Conversation on Mobile Viewport (375px)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/chat')
  await page.waitForLoadState('networkidle')

  // On mobile, click chat from drawer or select current chat
  await page.evaluate(() => {
    // Select chat directly in store
    const store = (window as unknown as { useChatStore?: { getState: () => { setCurrentChatId: (id: string) => void } } })
    if (store.useChatStore) {
      store.useChatStore.getState().setCurrentChatId('chat-m6-session')
    }
  })

  // Open sidebar drawer to click chat if needed
  const drawerBtn = page.locator('button[aria-label="Mở danh sách chat"]')
  if (await drawerBtn.isVisible()) {
    await drawerBtn.click()
    const mobileChatItem = page.locator('text=Zyricon Architecture & Tokens').first()
    await expect(mobileChatItem).toBeVisible()
    await mobileChatItem.click()
  }

  await expect(page.locator('text=Chào AI, hãy trình bày thiết kế kiến trúc Zyricon').first()).toBeVisible({ timeout: 10_000 })

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'mobile-375-zyricon-messages.png'),
    fullPage: false,
  })
})

test('M6-05: Capture Light Theme Messages Regression Baseline', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/chat')
  await page.waitForLoadState('networkidle')

  const chatItem = page.locator('text=Zyricon Architecture & Tokens').first()
  await expect(chatItem).toBeVisible()
  await chatItem.click()

  await setAppTheme(page, 'light')

  await expect(page.locator('text=Kiến trúc giao diện Zyricon').first()).toBeVisible()

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'desktop-1440-light-messages-regression.png'),
    fullPage: false,
  })
})

test('M6-06: Capture Dark Theme Messages Regression Baseline', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/chat')
  await page.waitForLoadState('networkidle')

  const chatItem = page.locator('text=Zyricon Architecture & Tokens').first()
  await expect(chatItem).toBeVisible()
  await chatItem.click()

  await setAppTheme(page, 'dark')

  await expect(page.locator('text=Kiến trúc giao diện Zyricon').first()).toBeVisible()

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'desktop-1440-dark-messages-regression.png'),
    fullPage: false,
  })
})

