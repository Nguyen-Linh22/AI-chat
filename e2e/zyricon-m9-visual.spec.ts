import fs from 'node:fs'
import path from 'node:path'
import { test, expect } from '@playwright/test'

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'screenshots/theme-selector-redesign')
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
}

const DARK_SYNC_DIR = path.resolve(process.cwd(), 'screenshots/dark-theme-synchronization')
if (!fs.existsSync(DARK_SYNC_DIR)) {
  fs.mkdirSync(DARK_SYNC_DIR, { recursive: true })
}

const LIGHT_SYNC_DIR = path.resolve(process.cwd(), 'screenshots/light-theme-synchronization')
if (!fs.existsSync(LIGHT_SYNC_DIR)) {
  fs.mkdirSync(LIGHT_SYNC_DIR, { recursive: true })
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
            {
              id: 'chatgpt-4o-latest',
              name: 'ChatGPT 4o',
              provider: 'openai',
              model: 'chatgpt-4o-latest',
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
            id: 'mock-user-theme',
            email: 'theme.master@example.com',
            name: 'Theme Master',
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
              id: 'chat-dark-1',
              title: 'Đồng bộ màu Dark theme indigo/twilight',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: 'chat-light-1',
              title: 'Đồng bộ màu Light theme mặt trời & độ tương phản',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: 'chat-dark-2',
              title: 'Kiến trúc giao diện AI Chat Clone',
              createdAt: new Date(Date.now() - 3600000).toISOString(),
              updatedAt: new Date(Date.now() - 3600000).toISOString(),
            },
          ],
        }),
      })
    }

    if (url.includes('/api/chats/chat-light-1/messages') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          messages: [
            {
              id: 'msg-lu1',
              chatId: 'chat-light-1',
              role: 'user',
              content: 'Theme Light đã cải tiến background và đồng bộ màu nút bấm như thế nào?',
              createdAt: new Date().toISOString(),
            },
            {
              id: 'msg-la1',
              chatId: 'chat-light-1',
              role: 'assistant',
              content: 'Giao diện **Theme Light** được nâng cấp toàn diện theo concept **Mặt Trời (Bright Sun / Sunrise Amber)**:\n\n1. **Background & Độ Tương Phản Rõ Nét**:\n   - **Sidebar**: Nền Slate sáng thanh lịch `#F0F3F7` tách bạch rõ rệt với không gian chat.\n   - **Chat Canvas**: Nền giấy dịu mắt `#FAFBFD` với độ tương phản văn bản đạt **16.1:1** (vượt xa chuẩn WCAG AAA 7.0:1).\n   - **Bầu trời sao**: Giảm độ chói và đổi sang gradient nắng mai ấm áp (`rgba(254, 243, 199, 0.22)`).\n\n2. **Đồng Bộ Nút Bấm & Hiệu Ứng Hover**:\n   - Nút gửi (Send) & Action buttons: Gradient rực rỡ `linear-gradient(135deg, #F59E0B, #EA580C)` kèm ánh sáng ấm.\n   - Nút Chat Mới, đính kèm file, mở rộng: Ánh kim hoàng kim `amber-500` đồng bộ với biểu tượng Mặt Trời.\n\n```typescript\n// Cấu hình bảng màu Light Theme mới\nconst lightPalette = {\n  canvas: "#FAFBFD",\n  sidebar: "#F0F3F7",\n  textPrimary: "#0F172A", // Contrast ratio 16.1:1\n  brandSun: "#F59E0B",\n  brandSunHover: "#EA580C",\n};\n```',
              createdAt: new Date().toISOString(),
            },
          ],
          hasMore: false,
        }),
      })
    }

    if (url.includes('/api/chats/chat-dark-1/messages') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          messages: [
            {
              id: 'msg-u1',
              chatId: 'chat-dark-1',
              role: 'user',
              content: 'Các nút bấm và hiệu ứng hover trong Dark theme đã được đồng bộ với màu nào?',
              createdAt: new Date().toISOString(),
            },
            {
              id: 'msg-a1',
              chatId: 'chat-dark-1',
              role: 'assistant',
              content: 'Toàn bộ các nút bấm, hiệu ứng hover, focus ring và active states trong Dark theme đã được đồng bộ với bảng màu **Celestial Indigo / Twilight Violet**:\n\n- Nút gửi (Send) & Action buttons: `from-[#4F46E5] to-[#7C3AED]`\n- Nút đính kèm file, mở rộng & tìm kiếm: `dark:bg-indigo-950/60`, `dark:border-indigo-500/30`, hover `shadow-indigo-500/25`\n- Focus rings: `dark:focus-visible:ring-indigo-400/50`\n- Active item & Indicators: `dark:from-[#6366F1] dark:to-[#4F46E5]`\n\n```typescript\n// Bảng màu Dark Theme thống nhất\nconst darkPalette = {\n  primary: "#4F46E5",\n  accent: "#7C3AED",\n  glow: "#6366F1",\n  surfaceHover: "#1E1B4B",\n  border: "rgba(99, 102, 241, 0.35)",\n};\n```',
              createdAt: new Date().toISOString(),
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

test('Capture Theme Selector side-by-side with Model Selector & open dropdown', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/chat')
  await page.waitForLoadState('networkidle')

  const themeBtn = page.locator('#theme-selector-btn')
  const modelBtn = page.locator('#model-selector-btn')
  await expect(themeBtn).toBeVisible({ timeout: 10_000 })
  await expect(modelBtn).toBeVisible({ timeout: 10_000 })

  // 1. Capture Header showing both Model Selector and Theme Selector side-by-side in Dark theme
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'header-pills-side-by-side-dark.png'),
    fullPage: false,
  })

  // 2. Open Theme Selector dropdown
  await themeBtn.click()
  const listbox = page.locator('#theme-selector-listbox')
  await expect(listbox).toBeVisible()

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'theme-selector-dropdown-dark.png'),
    fullPage: false,
  })

  // 3. Switch to Light theme and open dropdown
  const lightOption = page.locator('#theme-option-light')
  await lightOption.click()
  await page.waitForTimeout(300)

  // Capture Header showing both Model Selector and Theme Selector side-by-side in Light theme (Amber synchronized)
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'header-pills-side-by-side-light.png'),
    fullPage: false,
  })

  await themeBtn.click()
  await expect(listbox).toBeVisible()

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'theme-selector-dropdown-light.png'),
    fullPage: false,
  })

  // 4. Switch to Zyricon theme and open dropdown
  const zyriconOption = page.locator('#theme-option-zyricon')
  await zyriconOption.click()
  await page.waitForTimeout(300)

  await themeBtn.click()
  await expect(listbox).toBeVisible()

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'theme-selector-dropdown-zyricon.png'),
    fullPage: false,
  })
})

test('Capture Dark Theme synchronized buttons, hover states, and active conversation', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  // Ensure Dark theme is selected
  await page.addInitScript(() => {
    window.localStorage.setItem('theme', 'dark')
  })

  await page.goto('/chat')
  await page.waitForLoadState('networkidle')

  const html = page.locator('html')
  await expect(html).toHaveClass(/dark/)

  // 1. Dark Welcome screen overview (shows synchronized quick chips, hero cards, sidebar)
  await page.screenshot({
    path: path.join(DARK_SYNC_DIR, '01-dark-welcome-workspace.png'),
    fullPage: false,
  })

  // 2. Hover over New Chat button (showing indigo gradient hover)
  const newChatBtn = page.getByRole('button', { name: /Chat mới/i })
  if (await newChatBtn.isVisible()) {
    await newChatBtn.hover()
    await page.waitForTimeout(200)
    await page.screenshot({
      path: path.join(DARK_SYNC_DIR, '02-dark-newchat-hover.png'),
      fullPage: false,
    })
  }

  // 2b. Hover over Quick prompt chip on Welcome screen
  const promptChip = page.locator('button:has-text("Lập kế hoạch")').first()
  if (await promptChip.isVisible()) {
    await promptChip.hover()
    await page.waitForTimeout(200)
    await page.screenshot({
      path: path.join(DARK_SYNC_DIR, '02b-dark-quick-chip-hover.png'),
      fullPage: false,
    })
  }

  // 3. Hover over Composer Send button
  const chatInput = page.getByPlaceholder('Nhập tin nhắn...')
  await chatInput.fill('Kiểm tra nút bấm đồng bộ Dark theme')
  const sendBtn = page.getByRole('button', { name: 'Gửi' })
  await sendBtn.hover()
  await page.waitForTimeout(200)
  await page.screenshot({
    path: path.join(DARK_SYNC_DIR, '03-dark-composer-send-hover.png'),
    fullPage: false,
  })
  await chatInput.fill('')

  // 4. Navigate into active chat to capture messages, code blocks, copy buttons, and active sidebar item
  await page.goto('/chat/chat-dark-1')
  await page.waitForLoadState('networkidle')
  await page.waitForSelector('text=Các nút bấm và hiệu ứng hover', { timeout: 10_000 })
  await page.waitForTimeout(400)

  await page.screenshot({
    path: path.join(DARK_SYNC_DIR, '04-dark-active-chat-synchronized.png'),
    fullPage: false,
  })

  // 5. Open Model Selector in Dark theme to show synchronized indigo options
  const modelBtn = page.locator('#model-selector-btn')
  await modelBtn.click()
  const modelListbox = page.locator('#model-selector-listbox')
  await expect(modelListbox).toBeVisible()
  await page.screenshot({
    path: path.join(DARK_SYNC_DIR, '05-dark-model-dropdown-synchronized.png'),
    fullPage: false,
  })
})

test('Capture Light Theme synchronized buttons, hover states, and active conversation', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  // Ensure Light theme is selected
  await page.addInitScript(() => {
    window.localStorage.setItem('theme', 'light')
  })

  await page.goto('/chat')
  await page.waitForLoadState('networkidle')

  const html = page.locator('html')
  await expect(html).not.toHaveClass(/dark/)
  await expect(html).not.toHaveClass(/zyricon/)

  // 1. Light Welcome screen overview (shows enhanced #F0F3F7 sidebar, #FAFBFD canvas, sun amber quick chips)
  await page.screenshot({
    path: path.join(LIGHT_SYNC_DIR, '01-light-welcome-workspace.png'),
    fullPage: false,
  })

  // 2. Hover over New Chat button (showing amber sliding highlight)
  const newChatBtn = page.getByRole('button', { name: /Chat mới/i })
  if (await newChatBtn.isVisible()) {
    await newChatBtn.hover()
    await page.waitForTimeout(200)
    await page.screenshot({
      path: path.join(LIGHT_SYNC_DIR, '02-light-newchat-hover.png'),
      fullPage: false,
    })
  }

  // 2b. Hover over Quick prompt chip on Welcome screen
  const promptChip = page.locator('button:has-text("Lập kế hoạch")').first()
  if (await promptChip.isVisible()) {
    await promptChip.hover()
    await page.waitForTimeout(200)
    await page.screenshot({
      path: path.join(LIGHT_SYNC_DIR, '02b-light-quick-chip-hover.png'),
      fullPage: false,
    })
  }

  // 3. Hover over Composer Send button (showing radiant sun amber gradient)
  const chatInput = page.getByPlaceholder('Nhập tin nhắn...')
  await chatInput.fill('Kiểm tra nút bấm đồng bộ Light theme mặt trời')
  const sendBtn = page.getByRole('button', { name: 'Gửi' })
  await sendBtn.hover()
  await page.waitForTimeout(200)
  await page.screenshot({
    path: path.join(LIGHT_SYNC_DIR, '03-light-composer-send-hover.png'),
    fullPage: false,
  })
  await chatInput.fill('')

  // 4. Navigate into active chat to capture messages, readable contrast, code blocks, copy buttons, and active sidebar item
  await page.goto('/chat/chat-light-1')
  await page.waitForLoadState('networkidle')
  await page.waitForSelector('text=Theme Light đã cải tiến background', { timeout: 10_000 })
  await page.waitForTimeout(400)

  await page.screenshot({
    path: path.join(LIGHT_SYNC_DIR, '04-light-active-chat-synchronized.png'),
    fullPage: false,
  })

  // 5. Open Model Selector in Light theme to show synchronized amber options
  const modelBtn = page.locator('#model-selector-btn')
  await modelBtn.click()
  const modelListbox = page.locator('#model-selector-listbox')
  await expect(modelListbox).toBeVisible()
  await page.screenshot({
    path: path.join(LIGHT_SYNC_DIR, '05-light-model-dropdown-synchronized.png'),
    fullPage: false,
  })
})
