import fs from 'node:fs'
import path from 'node:path'
import { test, expect, Page } from '@playwright/test'

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'screenshots/m6-visual')
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
}

// Track unexpected network calls
let unexpectedRequests: string[] = []

/**
 * Sets theme deterministically via the production ThemeToggle UI component.
 * This guarantees that both the Zustand useThemeStore state and DOM classes/attributes
 * remain 100% synchronized, re-rendering all theme-dependent components (e.g. PreviewCodeBlock).
 *
 * Waits at least 300ms for CSS color transitions (200ms in CSS) to fully complete before proceeding.
 */
async function setTheme(page: Page, targetTheme: 'light' | 'dark') {
  const isCurrentlyDark = await page.evaluate(() =>
    document.documentElement.classList.contains('dark')
  )
  const currentTheme = isCurrentlyDark ? 'dark' : 'light'

  if (currentTheme !== targetTheme) {
    const toggleBtn = page.locator('#theme-toggle-btn')
    // dispatchEvent('click') directly dispatches the click event to the button,
    // ensuring it works reliably even if an overlay/modal dialog is currently open.
    await toggleBtn.dispatchEvent('click')
  }

  // 1. Verify DOM class on <html> has updated
  await expect(page.locator('html')).toHaveClass(new RegExp(`\\b${targetTheme}\\b`))

  // 2. Verify component dependent on Zustand store has re-rendered with new state
  const expectedAriaLabel =
    targetTheme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'
  await expect(page.locator('#theme-toggle-btn')).toHaveAttribute('aria-label', expectedAriaLabel)

  // 3. Wait for CSS transition (200ms in CSS) to fully settle (300ms safety window)
  await page.waitForTimeout(300)
  await page.evaluate(() => document.fonts.ready)
}

test.beforeEach(async ({ page }) => {
  unexpectedRequests = []

  // Disable motion for stable rendering
  await page.emulateMedia({ reducedMotion: 'reduce' })

  // Initialize clean state in localStorage
  await page.addInitScript(() => {
    localStorage.setItem('theme', 'dark')
    localStorage.removeItem('chat-store')
  })

  // Mock Google Accounts script to avoid external network calls
  await page.route('https://accounts.google.com/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: 'window.google = { accounts: { id: { initialize: () => {}, renderButton: () => {} } } };',
    })
  )

  // Network isolation: Intercept all API endpoints
  await page.route('**/api/**', async (route) => {
    const url = route.request().url()
    const method = route.request().method()

    // 1. Available AI models
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
              id: 'openai-gpt-5-mini',
              name: 'GPT-5 Mini',
              provider: 'openai',
              model: 'gpt-5-mini',
              available: true,
            },
          ],
        }),
      })
    }

    // 2. Auth session verification
    if (url.includes('/api/auth/me') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'mock-visual-user-id',
            email: 'visual-test@example.com',
            createdAt: '2026-10-31T20:00:00.000Z',
          },
        }),
      })
    }

    // 3. Chat session list
    if (url.endsWith('/api/chats') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          chats: [
            {
              id: 'mock-visual-chat-1',
              userId: 'mock-visual-user-id',
              title: 'Visual Regression Suite',
              createdAt: '2026-10-31T20:00:00.000Z',
              updatedAt: '2026-10-31T20:00:00.000Z',
            },
          ],
        }),
      })
    }

    // 4. Message history for the active chat
    if (url.includes('/api/chats/mock-visual-chat-1/messages') && method === 'GET') {
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

    // Any unmocked API call is recorded and aborted
    unexpectedRequests.push(`${method} ${url}`)
    return route.abort('failed')
  })
})

test.describe('Composer & Attachment Visual Regression Suite (Isolated)', () => {
  test('1. Empty Composer initial state (light & dark desktop)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/chat')

    const textarea = page.locator('textarea[aria-label="Nội dung tin nhắn"]')
    await expect(textarea).toBeVisible()
    await expect(textarea).toHaveAttribute('placeholder', 'Nhập tin nhắn...')

    const modelIndicator = page.locator('[aria-label="Mô hình AI: Gemini 3.6 Flash"]')
    await expect(modelIndicator).toBeVisible()

    const sendButton = page.locator('button[aria-label="Gửi"]')
    await expect(sendButton).toBeDisabled()

    await page.evaluate(() => document.fonts.ready)

    // Dark theme capture
    await setTheme(page, 'dark')
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '01-composer-empty-dark-desktop.png'),
    })

    // Light theme capture
    await setTheme(page, 'light')
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '01-composer-empty-light-desktop.png'),
    })

    expect(unexpectedRequests).toEqual([])
  })

  test('2. Model Indicator at 375px mobile (icon-only, no overflow)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/chat')

    const modelIndicator = page.locator('[aria-label="Mô hình AI: Gemini 3.6 Flash"]')
    await expect(modelIndicator).toBeVisible()

    // Model name text must be hidden on mobile (< 640px)
    const modelText = modelIndicator.locator('span.hidden.sm\\:inline')
    await expect(modelText).toBeHidden()

    // Icon svg must remain visible
    const icon = modelIndicator.locator('svg')
    await expect(icon).toBeVisible()

    // Check no horizontal overflow on mobile
    const hasHorizontalOverflow = await page.evaluate(() => {
      const doc = document.documentElement
      return doc.scrollWidth > window.innerWidth
    })
    expect(hasHorizontalOverflow).toBe(false)

    // Screenshots
    await setTheme(page, 'dark')
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '02-model-indicator-mobile-375-dark.png'),
    })

    await setTheme(page, 'light')
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '02-model-indicator-mobile-375-light.png'),
    })

    expect(unexpectedRequests).toEqual([])
  })

  test('3. Model Indicator at 768px tablet (icon + label visible)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/chat')

    const modelIndicator = page.locator('[aria-label="Mô hình AI: Gemini 3.6 Flash"]')
    await expect(modelIndicator).toBeVisible()

    const modelText = modelIndicator.locator('span.hidden.sm\\:inline')
    await expect(modelText).toBeVisible()
    await expect(modelText).toHaveText('Gemini 3.6 Flash')

    await setTheme(page, 'dark')
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '03-model-indicator-tablet-768-dark.png'),
    })

    await setTheme(page, 'light')
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '03-model-indicator-tablet-768-light.png'),
    })

    expect(unexpectedRequests).toEqual([])
  })

  test('4. Model Indicator at 1440px desktop width', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/chat')

    const modelIndicator = page.locator('[aria-label="Mô hình AI: Gemini 3.6 Flash"]')
    await expect(modelIndicator).toBeVisible()

    const modelText = modelIndicator.locator('span.hidden.sm\\:inline')
    await expect(modelText).toBeVisible()
    await expect(modelText).toHaveText('Gemini 3.6 Flash')

    await setTheme(page, 'dark')
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '04-model-indicator-desktop-1440-dark.png'),
    })

    await setTheme(page, 'light')
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '04-model-indicator-desktop-1440-light.png'),
    })

    expect(unexpectedRequests).toEqual([])
  })

  test('5. PDF Attachment Pill styling & metadata', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.goto('/chat')

    // Attach PDF without sending or making any network request
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'financial-report.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 Mock PDF Stream Data'),
    })

    const pill = page.locator('[aria-label^="Tệp đính kèm: financial-report.pdf"]')
    await expect(pill).toBeVisible()
    await expect(pill).toContainText('financial-report.pdf')

    // Verify rose color indicator for PDF
    const badge = pill.locator('span').first()
    const badgeClass = await badge.getAttribute('class')
    expect(badgeClass).toContain('text-rose-600')

    // Verify remove button presence
    const removeBtn = pill.locator('button[aria-label="Xóa file financial-report.pdf"]')
    await expect(removeBtn).toBeVisible()

    await setTheme(page, 'dark')
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '05-attachment-pdf-dark.png'),
    })

    await setTheme(page, 'light')
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '05-attachment-pdf-light.png'),
    })

    expect(unexpectedRequests).toEqual([])
  })

  test('6. TXT Attachment Pill styling & metadata', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.goto('/chat')

    // Attach TXT file
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'prompt-system.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('You are a helpful coding assistant.'),
    })

    const pill = page.locator('[aria-label^="Tệp đính kèm: prompt-system.txt"]')
    await expect(pill).toBeVisible()
    await expect(pill).toContainText('prompt-system.txt')

    // Verify sky color indicator for TXT
    const badge = pill.locator('span').first()
    const badgeClass = await badge.getAttribute('class')
    expect(badgeClass).toContain('text-sky-600')

    await setTheme(page, 'dark')
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '06-attachment-txt-dark.png'),
    })

    await setTheme(page, 'light')
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '06-attachment-txt-light.png'),
    })

    expect(unexpectedRequests).toEqual([])
  })

  test('7. Remove attachment while preserving message draft', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.goto('/chat')

    const textarea = page.locator('textarea[aria-label="Nội dung tin nhắn"]')
    await textarea.fill('Draft message text that must be preserved')

    // Attach file
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'temporary.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Temporary file content'),
    })

    const pill = page.locator('[aria-label^="Tệp đính kèm: temporary.txt"]')
    await expect(pill).toBeVisible()

    // Click remove
    const removeBtn = pill.locator('button[aria-label="Xóa file temporary.txt"]')
    await removeBtn.click()

    // Verify pill is removed and textarea draft is untouched
    await expect(pill).toBeHidden()
    await expect(textarea).toHaveValue('Draft message text that must be preserved')

    expect(unexpectedRequests).toEqual([])
  })

  test('8. Open Expanded Editor Modal', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.goto('/chat')

    const textarea = page.locator('textarea[aria-label="Nội dung tin nhắn"]')
    await textarea.fill('Testing expanded editor modal functionality')

    const expandBtn = page.locator('button[aria-label="Mở rộng trình soạn thảo"]')
    await expandBtn.click()

    // Modal dialog is displayed
    const modalDialog = page.getByRole('dialog', { name: 'Soạn tin nhắn' })
    await expect(modalDialog).toBeVisible()

    // Verify default tab "Soạn thảo" is active
    const editTab = page.locator('#tab-edit')
    await expect(editTab).toHaveAttribute('aria-selected', 'true')

    // Modal textarea has the synced draft content
    const modalTextarea = page.locator('textarea[aria-label="Nội dung tin nhắn mở rộng"]')
    await expect(modalTextarea).toHaveValue('Testing expanded editor modal functionality')

    // Close modal via Cancel button
    const cancelBtn = page.getByRole('button', { name: 'Hủy' })
    await cancelBtn.click()
    await expect(modalDialog).toBeHidden()

    expect(unexpectedRequests).toEqual([])
  })

  test('9. Modal attachment pill styling and metadata', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.goto('/chat')

    // Attach PDF in composer first
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'modal-spec.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 Mock modal file buffer'),
    })

    // Open modal
    const expandBtn = page.locator('button[aria-label="Mở rộng trình soạn thảo"]')
    await expandBtn.click()

    const modalPill = page.locator('[data-testid="modal-attachment-pill"]')
    await expect(modalPill).toBeVisible()
    await expect(modalPill).toContainText('modal-spec.pdf')

    // Verify rose badge inside modal
    const modalBadge = page.locator('[data-testid="modal-attachment-type-badge"]')
    const modalBadgeClass = await modalBadge.getAttribute('class')
    expect(modalBadgeClass).toContain('text-rose-600')

    await setTheme(page, 'dark')
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '07-modal-attachment-edit-dark.png'),
    })

    await setTheme(page, 'light')
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '07-modal-attachment-edit-light.png'),
    })

    // Close modal
    await page.getByRole('button', { name: 'Hủy' }).click()
    expect(unexpectedRequests).toEqual([])
  })

  test('10. Editor tabs and Markdown Preview with syntax highlighting', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.goto('/chat')

    // Switch to Light Mode first per Task C requirement
    await setTheme(page, 'light')

    const expandBtn = page.locator('button[aria-label="Mở rộng trình soạn thảo"]')
    await expandBtn.click()

    const modalTextarea = page.locator('textarea[aria-label="Nội dung tin nhắn mở rộng"]')
    const markdownContent = [
      '# Kiến trúc Workspace',
      '',
      'Đoạn văn chứa định dạng **chữ đậm**, *chữ nghiêng*, và [liên kết](https://example.com).',
      '',
      '```typescript',
      'interface VisualTestPlan {',
      '  milestone: string;',
      '  status: "PASS" | "FAIL";',
      '}',
      'const plan: VisualTestPlan = { milestone: "M6.4", status: "PASS" };',
      '```',
      '',
      '| Thành phần | Trạng thái | Ghi chú |',
      '| :--- | :--- | :--- |',
      '| Model Indicator | Hoàn tất | Responsive < 640px |',
      '| Attachment Pill | Hoàn tất | Rose (PDF) / Sky (TXT) |',
      '',
      '> Ghi chú quan trọng: Mọi yêu cầu mạng đều được mock độc lập.',
    ].join('\n')

    await modalTextarea.fill(markdownContent)

    // Switch to Preview Tab
    const previewTab = page.locator('#tab-preview')
    await previewTab.click()
    await expect(previewTab).toHaveAttribute('aria-selected', 'true')

    // Verify preview elements
    const previewPanel = page.locator('[data-testid="markdown-preview-panel"]')
    await expect(previewPanel).toBeVisible()

    // Code block preview check
    const codeBlock = page.locator('[data-testid="preview-code-block"]')
    await expect(codeBlock).toBeVisible()

    // Table preview check
    const tableContainer = page.locator('[data-testid="preview-table-container"]')
    await expect(tableContainer).toBeVisible()

    // Task C: Verify Prism oneLight in Light Mode
    // 1. Container background is #fafafa (rgb(250, 250, 250))
    await expect(codeBlock).toHaveCSS('background-color', 'rgb(250, 250, 250)')

    // 2. Inner code element does NOT have oneDark background (#282c34 / rgb(40, 44, 52))
    const codeElement = codeBlock.locator('code')
    await expect(codeElement).toBeVisible()
    const codeBg = await codeElement.evaluate((el) => window.getComputedStyle(el).backgroundColor)
    expect(codeBg).not.toBe('rgb(40, 44, 52)')

    // 3. Tokens do NOT have oneDark dark background box
    const tokenBgs = await codeBlock.locator('.token').evaluateAll((tokens) =>
      tokens.map((t) => window.getComputedStyle(t).backgroundColor)
    )
    for (const bg of tokenBgs) {
      expect(bg).not.toBe('rgb(40, 44, 52)')
    }

    // Capture Light Markdown Preview
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '08-modal-markdown-preview-light.png'),
    })

    // Task C: Switch to Dark Mode and verify oneDark
    await setTheme(page, 'dark')

    // 1. Container background in Dark Mode is #282c34 (rgb(40, 44, 52))
    await expect(codeBlock).toHaveCSS('background-color', 'rgb(40, 44, 52)')

    // Capture Dark Markdown Preview
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '08-modal-markdown-preview-dark.png'),
    })

    // Close modal
    await page.getByRole('button', { name: 'Hủy' }).click()
    expect(unexpectedRequests).toEqual([])
  })
})
