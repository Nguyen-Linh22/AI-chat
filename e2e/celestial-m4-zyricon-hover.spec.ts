import fs from 'node:fs'
import path from 'node:path'
import { test, expect, Page } from '@playwright/test'

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'screenshots/zyricon-hover-fix')
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
}

async function setupMocks(page: Page) {
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
            id: 'mock-user',
            email: 'user@example.com',
            name: 'Test User',
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
              id: 'chat-1',
              title: 'Đoạn chat thử nghiệm',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        }),
      })
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    })
  })
}

test.describe('Targeted Hover Verification — Light, Dark, Zyricon', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page)
  })

  for (const theme of ['light', 'dark', 'zyricon'] as const) {
    test(`Verify ${theme} theme New Chat & Search hover states (expanded & collapsed)`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.addInitScript((t) => {
        localStorage.setItem('theme', t)
      }, theme)

      await page.goto('/chat')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(400)

      const sidebar = page.locator('#app-sidebar')
      await expect(sidebar).toBeVisible()

      // Expanded: New Chat button
      const newChatBtn = sidebar.getByRole('button', { name: /Chat mới/i })
      await expect(newChatBtn).toBeVisible()

      // Screenshot 1: Expanded New Chat default
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `${theme}-expanded-new-chat-default.png`),
      })

      // Hover on New Chat button
      await newChatBtn.hover()
      await page.waitForTimeout(200)

      // Screenshot 2: Expanded New Chat hover
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `${theme}-expanded-new-chat-hover.png`),
      })

      // Check slider background on hover in Zyricon vs Dark vs Light
      const slider = newChatBtn.locator('.new-chat-bg-slider')
      const sliderBg = await slider.evaluate((el) => window.getComputedStyle(el).backgroundImage)
      console.log(`[${theme} expanded new chat slider bg]:`, sliderBg)

      if (theme === 'zyricon') {
        expect(sliderBg).toMatch(/rgb\(105,\s*71,\s*136\)|rgb\(194,\s*117,\s*149\)|rgb\(152,\s*87,\s*141\)/)
      } else if (theme === 'dark') {
        expect(sliderBg).toMatch(/rgb\(79,\s*70,\s*229\)|rgb\(124,\s*58,\s*237\)/)
      } else if (theme === 'light') {
        expect(sliderBg).toMatch(/rgb\(245,\s*158,\s*11\)|rgb\(234,\s*88,\s*12\)/)
      }

      // Expanded: Search button
      const searchBtn = sidebar.getByRole('button', { name: /Tìm kiếm cuộc trò chuyện/i })
      await expect(searchBtn).toBeVisible()

      // Move mouse away to reset hover
      await page.mouse.move(500, 500)
      await page.waitForTimeout(100)

      // Screenshot 3: Expanded Search default
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `${theme}-expanded-search-default.png`),
      })

      // Hover on Search button
      await searchBtn.hover()
      await page.waitForTimeout(200)

      // Screenshot 4: Expanded Search hover
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `${theme}-expanded-search-hover.png`),
      })

      // Inspect Search icon color on hover
      const searchIcon = searchBtn.locator('svg').first()
      const searchIconColor = await searchIcon.evaluate((el) => window.getComputedStyle(el).color)
      console.log(`[${theme} expanded search icon hover color]:`, searchIconColor)

      if (theme === 'zyricon') {
        expect(searchIconColor).toMatch(/rgb\(194,\s*117,\s*149\)/)
      } else if (theme === 'dark') {
        expect(searchIconColor).toMatch(/rgb\(129,\s*140,\s*248\)|oklch\(0\.673/)
      } else if (theme === 'light') {
        expect(searchIconColor).toMatch(/rgb\(217,\s*119,\s*6\)|oklch\(0\.666/)
      }

      // Now Collapse Sidebar
      const collapseBtn = page.getByRole('button', { name: /Thu gọn thanh bên/i })
      await collapseBtn.click()
      await page.waitForTimeout(300)

      // Collapsed: New Chat button
      const collapsedNewChat = sidebar.locator('.new-chat-collapsed-btn')
      await expect(collapsedNewChat).toBeVisible()

      // Screenshot 5: Collapsed New Chat default
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `${theme}-collapsed-new-chat-default.png`),
      })

      // Hover collapsed New Chat
      await collapsedNewChat.hover()
      await page.waitForTimeout(200)

      // Screenshot 6: Collapsed New Chat hover
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `${theme}-collapsed-new-chat-hover.png`),
      })

      const collapsedNewChatBg = await collapsedNewChat.evaluate(
        (el) => window.getComputedStyle(el).backgroundImage
      )
      console.log(`[${theme} collapsed new chat hover bg]:`, collapsedNewChatBg)

      if (theme === 'zyricon') {
        expect(collapsedNewChatBg).toMatch(/rgb\(105,\s*71,\s*136\)|rgb\(194,\s*117,\s*149\)/)
      }

      // Collapsed: Search button
      const collapsedSearch = sidebar.getByRole('button', { name: /Tìm kiếm cuộc trò chuyện/i })
      await expect(collapsedSearch).toBeVisible()

      // Reset mouse
      await page.mouse.move(500, 500)
      await page.waitForTimeout(100)

      // Hover collapsed Search
      await collapsedSearch.hover()
      await page.waitForTimeout(200)

      // Screenshot 7: Collapsed Search hover
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `${theme}-collapsed-search-hover.png`),
      })

      const collapsedSearchIcon = collapsedSearch.locator('svg').first()
      const collapsedSearchIconColor = await collapsedSearchIcon.evaluate(
        (el) => window.getComputedStyle(el).color
      )
      console.log(`[${theme} collapsed search icon hover color]:`, collapsedSearchIconColor)

      if (theme === 'zyricon') {
        expect(collapsedSearchIconColor).toBe('rgb(194, 117, 149)')
      }
    })
  }
})
