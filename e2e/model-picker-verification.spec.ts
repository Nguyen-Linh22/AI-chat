import { test, expect } from '@playwright/test'
import * as path from 'path'
import * as fs from 'fs'

const SCREENSHOT_DIR = path.resolve('screenshots/m7-model-picker')
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
}

const VIEWPORTS = [
  { width: 375, height: 667, name: 'mobile-375' },
  { width: 768, height: 1024, name: 'tablet-768' },
  { width: 1024, height: 768, name: 'laptop-1024' },
  { width: 1440, height: 900, name: 'desktop-1440' },
]

test.describe('Premium Animated Model Picker E2E & Visual Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Mock user login and models in localStorage / API
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: {
            user: { id: 'test-user', email: 'user@example.com' },
            isAuthenticated: true,
          },
          version: 0,
        })
      )
      window.localStorage.setItem(
        'ai-storage',
        JSON.stringify({
          state: {
            models: [
              { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash', provider: 'gemini', model: 'gemini-3.6-flash', available: true },
              { id: 'openai-gpt-5-mini', name: 'GPT-5 Mini', provider: 'openai', model: 'gpt-5-mini', available: true },
              { id: 'ollama-qwen3-1.7b', name: 'Qwen 3 1.7B', provider: 'ollama', model: 'qwen3:1.7b', available: false, disabledReason: 'Chỉ khả dụng ở môi trường Local' },
              { id: 'groq-gpt-oss-20b', name: 'GPT OSS 20B (Groq)', provider: 'groq', model: 'openai/gpt-oss-20b', available: true },
            ],
            selectedModelId: 'gemini-3.6-flash',
          },
          version: 0,
        })
      )
    })

    // Mock API calls
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: { id: 'test-user', email: 'user@example.com' } }),
      })
    })

    await page.route('**/api/chats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ chats: [] }),
      })
    })

    await page.route('**/api/ai/models', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          models: [
            { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash', provider: 'gemini', model: 'gemini-3.6-flash', available: true },
            { id: 'openai-gpt-5-mini', name: 'GPT-5 Mini', provider: 'openai', model: 'gpt-5-mini', available: true },
            { id: 'ollama-qwen3-1.7b', name: 'Qwen 3 1.7B', provider: 'ollama', model: 'qwen3:1.7b', available: false, disabledReason: 'Chỉ khả dụng ở môi trường Local' },
            { id: 'groq-gpt-oss-20b', name: 'GPT OSS 20B (Groq)', provider: 'groq', model: 'openai/gpt-oss-20b', available: true },
          ],
        }),
      })
    })
  })

  for (const vp of VIEWPORTS) {
    test(`Verify layout and zero overflow at ${vp.name} in Light and Dark Mode`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('/')

      const triggerBtn = page.getByRole('button', { name: /Mô hình AI hiện tại:/i })
      await expect(triggerBtn).toBeVisible()

      // 1. Dark Mode check
      await page.evaluate(() => {
        document.documentElement.classList.add('dark')
        document.documentElement.setAttribute('data-theme', 'dark')
      })

      // Check zero horizontal overflow
      const overflowDark = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth
      })
      expect(overflowDark).toBe(false)

      // Open dropdown in Dark Mode
      await triggerBtn.click()
      const listbox = page.getByRole('listbox')
      await expect(listbox).toBeVisible()

      // Screenshot dropdown in Dark Mode
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `${vp.name}-dark-open.png`),
      })

      // Close dropdown via Escape
      await page.keyboard.press('Escape')
      await expect(listbox).not.toBeVisible()

      // 2. Light Mode check
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark')
        document.documentElement.setAttribute('data-theme', 'light')
      })

      const overflowLight = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth
      })
      expect(overflowLight).toBe(false)

      // Open dropdown in Light Mode
      await triggerBtn.click()
      await expect(listbox).toBeVisible()

      // Screenshot dropdown in Light Mode
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `${vp.name}-light-open.png`),
      })

      // Close
      await page.keyboard.press('Escape')
      await expect(listbox).not.toBeVisible()
    })
  }

  test('Verify Model Selection & Keyboard Navigation', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.goto('/')

    const triggerBtn = page.getByRole('button', { name: /Mô hình AI hiện tại:/i })
    await expect(triggerBtn).toBeVisible()

    // 1. Open via keyboard ArrowDown
    await triggerBtn.focus()
    await page.keyboard.press('ArrowDown')

    const listbox = page.getByRole('listbox')
    await expect(listbox).toBeVisible()

    // 2. Navigate with ArrowDown
    await page.keyboard.press('ArrowDown')

    // 3. Select with Enter
    await page.keyboard.press('Enter')
    await expect(listbox).not.toBeVisible()

    // Expect model changed to GPT-5 Mini
    await expect(triggerBtn).toContainText('GPT-5 Mini')

    // 4. Click outside closes dropdown
    await triggerBtn.click()
    await expect(listbox).toBeVisible()
    await page.mouse.click(50, 50)
    await expect(listbox).not.toBeVisible()
  })
})

