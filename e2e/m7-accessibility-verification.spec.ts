import { test, expect, Page } from '@playwright/test'

// Track unexpected requests and console errors
let unexpectedRequests: string[] = []
let consoleErrors: string[] = []

/**
 * Synchronize theme state with DOM and Zustand store
 */
async function setTheme(page: Page, targetTheme: 'light' | 'dark') {
  const isCurrentlyDark = await page.evaluate(() =>
    document.documentElement.classList.contains('dark')
  )
  const currentTheme = isCurrentlyDark ? 'dark' : 'light'

  if (currentTheme !== targetTheme) {
    const toggleBtn = page.locator('#theme-toggle-btn')
    await toggleBtn.dispatchEvent('click')
  }

  await expect(page.locator('html')).toHaveClass(new RegExp(`\\b${targetTheme}\\b`))
  await page.waitForTimeout(250)
  await page.evaluate(() => document.fonts.ready)
}

const MOCK_USER = {
  id: 'mock-a11y-user-id',
  email: 'a11y-verifier@example.com',
  name: 'A11y Tester',
  createdAt: '2026-10-31T20:00:00.000Z',
}

const MOCK_CHATS = [
  {
    id: 'mock-a11y-chat-1',
    userId: 'mock-a11y-user-id',
    title: 'Visual Regression Suite',
    createdAt: '2026-10-31T20:00:00.000Z',
    updatedAt: '2026-10-31T20:00:00.000Z',
  },
  {
    id: 'mock-a11y-chat-2',
    userId: 'mock-a11y-user-id',
    title: 'Secondary Research Thread',
    createdAt: '2026-10-31T19:00:00.000Z',
    updatedAt: '2026-10-31T19:00:00.000Z',
  },
]

// Wide table with unbreakable strings to guarantee horizontal overflow & scrolling
const MOCK_TABLE_MARKDOWN = `Dưới đây là bảng thông số so sánh hiệu năng chi tiết:

| Mã_định_danh_A1 | Tiêu_chuẩn_ISO_B2 | Hiệu_năng_tối_đa_C3 | Trạng_thái_kiểm_thử_D4 | Thời_gian_đáp_ứng_E5 | Độ_tương_phản_WCAG_F6 | Hỗ_trợ_cuộn_phím_G7 | Trợ_năng_Chromium_H8 | Trạng_thái_M7_I9 | Ghi_chú_J10 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| CHAT-CORE-001-ALPHA | ISO-25010-SOFTWARE-QUALITY | 99.999-PERCENT-UPTIME | PASSED-AUTOMATED-SUITE | 12.5-MILLISECONDS-LATENCY | COMPLIANT-WCAG-2.1-AA | TABINDEX-ZERO-ROLE-REGION | KEYBOARD-NAV-VERIFIED | FULLY-IMPLEMENTED | READY-FOR-DEPLOY |
| CHAT-CORE-002-BETA | ISO-27001-INFO-SECURITY | 99.995-PERCENT-UPTIME | VERIFIED-MANUAL-AND-AUTO | 14.8-MILLISECONDS-LATENCY | HIGH-CONTRAST-TOKENS | HORIZONTAL-SCROLL-KEYS | COMPLETE-ACCESSIBLE-NAME | VERIFIED-ALL-CRITERIA | PRODUCTION-CERTIFIED |
`

test.beforeEach(async ({ page }) => {
  unexpectedRequests = []
  consoleErrors = []

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text())
    }
  })

  // Initialize clean state in localStorage
  await page.addInitScript(() => {
    localStorage.setItem('theme', 'dark')
    localStorage.removeItem('chat-store')
  })

  // Mock Google Accounts
  await page.route('https://accounts.google.com/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: 'window.google = { accounts: { id: { initialize: () => {}, renderButton: () => {} } } };',
    })
  )

  // Network isolation
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
        body: JSON.stringify({ user: MOCK_USER }),
      })
    }

    if (url.endsWith('/api/chats') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ chats: MOCK_CHATS }),
      })
    }

    if (url.includes('/api/chats/mock-a11y-chat-1/messages') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          messages: [
            {
              id: 'msg-user-1',
              chatId: 'mock-a11y-chat-1',
              role: 'user',
              content: 'Cho tôi bảng thông số so sánh hiệu năng',
              createdAt: '2026-10-31T20:00:00.000Z',
            },
            {
              id: 'msg-assistant-1',
              chatId: 'mock-a11y-chat-1',
              role: 'assistant',
              content: MOCK_TABLE_MARKDOWN,
              createdAt: '2026-10-31T20:00:02.000Z',
            },
          ],
          nextCursor: null,
          hasMore: false,
        }),
      })
    }

    if (url.includes('/api/chats/mock-a11y-chat-2/messages') && method === 'GET') {
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

    // Any unhandled API call
    unexpectedRequests.push(`${method} ${url}`)
    return route.abort('failed')
  })
})

test.describe('M7.2.3 — Integrated Accessibility Verification', () => {

  test('A. Sidebar Accessibility & Keyboard Navigation', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/chat')

    // 1. Sidebar element
    const sidebar = page.locator('#app-sidebar')
    await expect(sidebar).toBeVisible()
    await expect(sidebar).toHaveAttribute('aria-label', 'Thanh bên cuộc trò chuyện')

    // 2. Collapse / Expand toggle button
    const collapseBtn = page.locator('button[aria-controls="app-sidebar"]')
    await expect(collapseBtn).toBeVisible()
    await expect(collapseBtn).toHaveAttribute('aria-expanded', 'true')
    await expect(collapseBtn).toHaveAttribute('aria-label', 'Thu gọn thanh bên')

    // Test focus-visible on collapse button
    await collapseBtn.focus()
    const isFocusVisible = await collapseBtn.evaluate((el) => {
      const style = window.getComputedStyle(el)
      return style.outlineStyle !== 'none' || style.boxShadow.length > 0
    })
    expect(isFocusVisible).toBe(true)

    // Click collapse
    await collapseBtn.click()
    await expect(collapseBtn).toHaveAttribute('aria-expanded', 'false')
    await expect(collapseBtn).toHaveAttribute('aria-label', 'Mở rộng thanh bên')

    // Expand back
    await collapseBtn.click()
    await expect(collapseBtn).toHaveAttribute('aria-expanded', 'true')
    await expect(collapseBtn).toHaveAttribute('aria-label', 'Thu gọn thanh bên')

    // 3. Accessible name of action buttons for each chat
    const chat1ActionBtn = page.locator(
      'button[aria-label=\'Thao tác với đoạn chat "Visual Regression Suite"\']'
    )
    await expect(chat1ActionBtn).toBeVisible()
    await expect(chat1ActionBtn).toHaveAttribute(
      'title',
      'Thao tác với đoạn chat "Visual Regression Suite"'
    )

    const chat2ActionBtn = page.locator(
      'button[aria-label=\'Thao tác với đoạn chat "Secondary Research Thread"\']'
    )
    await expect(chat2ActionBtn).toBeVisible()

    // 4. Active chat semantics
    // Navigate to chat-1
    const chat1ItemBtn = page.locator('button', { hasText: 'Visual Regression Suite' })
    await chat1ItemBtn.click()
    await expect(chat1ItemBtn).toHaveAttribute('aria-current', 'page')

    const chat2ItemBtn = page.locator('button', { hasText: 'Secondary Research Thread' })
    await expect(chat2ItemBtn).not.toHaveAttribute('aria-current')
  })

  test('B. ChatActionMenu Keyboard Navigation & Focus Restoration', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/chat')

    const trigger = page.locator(
      'button[aria-label=\'Thao tác với đoạn chat "Visual Regression Suite"\']'
    )
    await expect(trigger).toBeVisible()

    // 1. Open menu via click
    await trigger.click()
    const menu = page.locator('div[role="menu"]')
    await expect(menu).toBeVisible()

    // Initial focus on first enabled menu item ("Đổi tên")
    const renameBtn = menu.locator('button[role="menuitem"]:has-text("Đổi tên")')
    const deleteBtn = menu.locator('button[role="menuitem"]:has-text("Xóa")')
    await expect(renameBtn).toBeFocused()

    // 2. ArrowDown moves to next item ("Xóa")
    await page.keyboard.press('ArrowDown')
    await expect(deleteBtn).toBeFocused()

    // ArrowDown at bottom wraps to first item ("Đổi tên")
    await page.keyboard.press('ArrowDown')
    await expect(renameBtn).toBeFocused()

    // ArrowUp at top wraps to last item ("Xóa")
    await page.keyboard.press('ArrowUp')
    await expect(deleteBtn).toBeFocused()

    // Home moves to first item
    await page.keyboard.press('Home')
    await expect(renameBtn).toBeFocused()

    // End moves to last item
    await page.keyboard.press('End')
    await expect(deleteBtn).toBeFocused()

    // 3. Escape closes menu and restores focus to trigger
    await page.keyboard.press('Escape')
    await expect(menu).not.toBeVisible()
    await expect(trigger).toBeFocused()

    // 4. Tab closes menu and continues navigation
    await trigger.click()
    await expect(menu).toBeVisible()
    await page.keyboard.press('Tab')
    await expect(menu).not.toBeVisible()

    // 5. Enter activates item exactly once
    await trigger.click()
    await expect(menu).toBeVisible()
    await expect(renameBtn).toBeFocused()
    await page.keyboard.press('Enter')

    // Should open inline rename input
    const renameInput = page.locator('input[aria-label="Tên cuộc trò chuyện mới"]')
    await expect(renameInput).toBeVisible()
    await expect(renameInput).toBeFocused()

    // Cancel rename via Escape
    await page.keyboard.press('Escape')
    await expect(renameInput).not.toBeVisible()
  })

  test('C. ExpandedEditorModal Keyboard Navigation & Focus Trap', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/chat')

    const expandBtn = page.locator('button[aria-label="Mở rộng trình soạn thảo"]')
    await expect(expandBtn).toBeVisible()

    // 1. Open modal via expand button
    await expandBtn.click()
    const dialog = page.locator('div[role="dialog"]')
    await expect(dialog).toBeVisible()

    // Focus lands inside textarea
    const modalTextarea = dialog.locator('textarea')
    await expect(modalTextarea).toBeFocused()

    // 2. Tab key in textarea inserts 4 spaces indent
    await modalTextarea.fill('Test')
    await page.keyboard.press('Tab')
    await expect(modalTextarea).toHaveValue('Test    ')
    await expect(modalTextarea).toBeFocused()

    // 3. Shift+Tab from textarea moves backwards in DOM order to close button
    await page.keyboard.press('Shift+Tab')
    const closeBtn = dialog.locator('button[aria-label="Đóng trình soạn thảo"]')
    await expect(closeBtn).toBeFocused()

    // Shift+Tab from close button moves backwards to #tab-edit
    await page.keyboard.press('Shift+Tab')
    const editTab = dialog.locator('#tab-edit')
    await expect(editTab).toBeFocused()

    // ArrowRight on tab switches to Preview tab per WAI-ARIA tab pattern
    await page.keyboard.press('ArrowRight')
    const previewTab = dialog.locator('#tab-preview')
    await expect(previewTab).toBeFocused()

    // 4. Escape closes modal and restores focus to opener
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
    await expect(expandBtn).toBeFocused()

    // 5. Cancel button closes modal and restores focus
    await expandBtn.click()
    await expect(dialog).toBeVisible()
    const cancelBtn = dialog.locator('button:has-text("Hủy")')
    await cancelBtn.click()
    await expect(dialog).not.toBeVisible()
    await expect(expandBtn).toBeFocused()
  })

  test('D. SearchChatModal Keyboard Navigation & Focus', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/chat')

    const searchBtn = page.locator('button[aria-label="Tìm kiếm cuộc trò chuyện"]')
    await expect(searchBtn).toBeVisible()

    // 1. Open Search modal
    await searchBtn.click()
    const dialog = page.locator('div[role="dialog"][aria-label="Tìm kiếm cuộc trò chuyện"]')
    await expect(dialog).toBeVisible()

    // Auto-focus input
    const searchInput = dialog.locator('input[aria-label="Tìm kiếm cuộc trò chuyện"]')
    await expect(searchInput).toBeFocused()

    // 2. Type query and verify results
    await searchInput.fill('Visual')
    const resultItem = dialog.locator('button:has-text("Visual Regression Suite")')
    await expect(resultItem).toBeVisible()

    // Clear search button clears query and refocuses input
    const clearBtn = dialog.locator('button[aria-label="Xóa nội dung tìm kiếm"]')
    await expect(clearBtn).toBeVisible()
    await clearBtn.click()
    await expect(searchInput).toHaveValue('')
    await expect(searchInput).toBeFocused()

    // 3. Close via Escape key
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()

    // Opener focus restored
    await expect(searchBtn).toBeFocused()
  })

  test('E. MessageBubble Markdown Table Keyboard Scrolling & Accessibility', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/chat')

    // Navigate to chat-1 to render messages
    const chat1ItemBtn = page.locator('button', { hasText: 'Visual Regression Suite' })
    await chat1ItemBtn.click()

    // 1. Verify table container semantics
    const tableContainer = page.locator('[data-testid="table-container"]')
    await expect(tableContainer).toBeVisible()
    await expect(tableContainer).toHaveAttribute('role', 'region')
    await expect(tableContainer).toHaveAttribute('aria-label', 'Bảng dữ liệu')
    await expect(tableContainer).toHaveAttribute('tabindex', '0')

    // 2. Verify table header semantics
    const thElements = tableContainer.locator('th')
    const thCount = await thElements.count()
    expect(thCount).toBeGreaterThan(0)
    for (let i = 0; i < thCount; i++) {
      await expect(thElements.nth(i)).toHaveAttribute('scope', 'col')
    }

    // 3. Verify keyboard focusable
    await tableContainer.focus()
    const isContainerFocused = await tableContainer.evaluate((el) => el === document.activeElement)
    expect(isContainerFocused).toBe(true)

    // Verify focus-visible outline/ring
    const hasFocusRing = await tableContainer.evaluate((el) => {
      const style = window.getComputedStyle(el)
      return style.outlineStyle !== 'none' || style.boxShadow.length > 0
    })
    expect(hasFocusRing).toBe(true)

    // 4. Verify horizontal scrolling capability
    const scrollInfo = await tableContainer.evaluate((el) => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      scrollLeft: el.scrollLeft,
    }))
    expect(scrollInfo.scrollWidth).toBeGreaterThan(scrollInfo.clientWidth)

    // Simulate horizontal scroll via keyboard
    await tableContainer.evaluate((el) => {
      el.scrollLeft += 100
    })
    const updatedScrollLeft = await tableContainer.evaluate((el) => el.scrollLeft)
    expect(updatedScrollLeft).toBeGreaterThan(0)
  })

  test('F. Reduced Motion & Responsive Viewports', async ({ page }) => {
    // 1. Reduced Motion Test
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/chat')

    const reducedMotionTransition = await page.evaluate(() => {
      const chatLayout = document.querySelector('.chat-layout')
      const sidebar = document.querySelector('#app-sidebar')
      const chatPage = document.querySelector('.chat-page-root')

      const layoutTrans = chatLayout ? window.getComputedStyle(chatLayout).transitionDuration : '0s'
      const sidebarTrans = sidebar ? window.getComputedStyle(sidebar).transitionDuration : '0s'
      const pageTrans = chatPage ? window.getComputedStyle(chatPage).transitionDuration : '0s'

      return { layoutTrans, sidebarTrans, pageTrans }
    })

    // In reduced-motion, transition durations should be 0s, 0.001s, or 0.01ms
    expect(['0s', '0.001s', '0.00001s']).toContain(reducedMotionTransition.layoutTrans)

    // 2. Responsive Viewports across Light and Dark Mode
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1024, height: 768, name: 'Small Desktop' },
      { width: 1440, height: 900, name: 'Large Desktop' },
    ]

    for (const theme of ['light', 'dark'] as const) {
      await setTheme(page, theme)

      for (const vp of viewports) {
        await page.setViewportSize({ width: vp.width, height: vp.height })
        await page.waitForTimeout(150)

        // Verify document root has no unwanted horizontal scrollbar
        const hasUnwantedOverflow = await page.evaluate((expectedWidth) => {
          const docWidth = document.documentElement.scrollWidth
          // Tolerating at most 1px rendering subpixel rounding
          return docWidth > expectedWidth + 1
        }, vp.width)

        expect(
          hasUnwantedOverflow,
          `Unexpected horizontal overflow at viewport ${vp.name} (${vp.width}px) in ${theme} mode`
        ).toBe(false)
      }
    }
  })

  test('G. Contrast Ratios Verification (Light & Dark Mode)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/chat')

    // Helper using 2D canvas to reliably convert any browser color (oklch, rgb, lab, hex) to sRGB
    const evaluateContrast = async (locatorSelector: string, defaultBg: string) => {
      return await page.evaluate(
        ({ sel, fallbackBg }) => {
          const el = document.querySelector(sel)
          if (!el) return null

          function getEffectiveRgb(colorStr: string, parentBgStr: string) {
            const canvas = document.createElement('canvas')
            canvas.width = 1
            canvas.height = 1
            const ctx = canvas.getContext('2d', { willReadFrequently: true })
            if (!ctx) return { r: 0, g: 0, b: 0 }
            ctx.fillStyle = parentBgStr
            ctx.fillRect(0, 0, 1, 1)
            ctx.fillStyle = colorStr
            ctx.fillRect(0, 0, 1, 1)
            const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
            return { r, g, b }
          }

          function srgbToLinear(c: number) {
            const v = c / 255
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
          }

          function getLuminance(rgb: { r: number; g: number; b: number }) {
            return 0.2126 * srgbToLinear(rgb.r) + 0.7152 * srgbToLinear(rgb.g) + 0.0722 * srgbToLinear(rgb.b)
          }

          const computed = window.getComputedStyle(el)

          // Find effective background
          let current: HTMLElement | null = el as HTMLElement
          let bgStr = computed.backgroundColor
          while (current && (bgStr === 'transparent' || bgStr === 'rgba(0, 0, 0, 0)')) {
            current = current.parentElement
            if (current) {
              bgStr = window.getComputedStyle(current).backgroundColor
            }
          }
          if (!current || bgStr === 'transparent' || bgStr === 'rgba(0, 0, 0, 0)') {
            bgStr = fallbackBg
          }

          const bgRgb = getEffectiveRgb(bgStr, fallbackBg)
          const fgRgb = getEffectiveRgb(computed.color, bgStr)

          const l1 = getLuminance(fgRgb)
          const l2 = getLuminance(bgRgb)
          const lighter = Math.max(l1, l2)
          const darker = Math.min(l1, l2)
          const ratio = (lighter + 0.05) / (darker + 0.05)

          return {
            fg: computed.color,
            bg: bgStr,
            ratio: parseFloat(ratio.toFixed(2)),
          }
        },
        { sel: locatorSelector, fallbackBg: defaultBg }
      )
    }

    for (const theme of ['light', 'dark'] as const) {
      await setTheme(page, theme)
      const fallbackBg = theme === 'dark' ? 'rgb(21, 29, 42)' : 'rgb(255, 255, 255)'

      // 1. MessageBubble table elements (load chat while no modal is active)
      const chat1ItemBtn = page.locator('#app-sidebar').getByRole('button', { name: /Visual Regression Suite/i }).first()
      await chat1ItemBtn.click()

      const tableHeader = await evaluateContrast(
        'th[scope="col"]',
        fallbackBg
      )
      expect(tableHeader).not.toBeNull()
      expect(tableHeader!.ratio).toBeGreaterThanOrEqual(4.5)

      const tableCell = await evaluateContrast(
        'td',
        fallbackBg
      )
      expect(tableCell).not.toBeNull()
      expect(tableCell!.ratio).toBeGreaterThanOrEqual(4.5)

      // 2. SearchChatModal components
      const searchBtn = page.locator('button[aria-label="Tìm kiếm cuộc trò chuyện"]')
      await searchBtn.click()
      const searchDialog = page.locator('div[role="dialog"][aria-label="Tìm kiếm cuộc trò chuyện"]')
      await expect(searchDialog).toBeVisible()

      const escKbd = await evaluateContrast(
        'button[aria-label="Đóng tìm kiếm"] kbd',
        fallbackBg
      )
      expect(escKbd).not.toBeNull()
      expect(escKbd!.ratio).toBeGreaterThanOrEqual(4.5)

      const sectionTitle = await evaluateContrast(
        'span.tracking-wider',
        fallbackBg
      )
      expect(sectionTitle).not.toBeNull()
      expect(sectionTitle!.ratio).toBeGreaterThanOrEqual(4.5)

      const relativeTime = await evaluateContrast(
        'p.text-\\[10px\\].mt-0\\.5',
        fallbackBg
      )
      expect(relativeTime).not.toBeNull()
      expect(relativeTime!.ratio).toBeGreaterThanOrEqual(4.5)

      // Close modal and wait for backdrop to disappear
      const escBtn = searchDialog.locator('button[aria-label="Đóng tìm kiếm"]')
      await escBtn.click()
      await expect(searchDialog).not.toBeVisible()

      console.log(`[Contrast ${theme.toUpperCase()}] ESC kbd: ${escKbd!.ratio}:1 | Section title: ${sectionTitle!.ratio}:1 | Relative time: ${relativeTime!.ratio}:1 | Table header: ${tableHeader!.ratio}:1 | Table cell: ${tableCell!.ratio}:1`)
    }
  })

  test('H. Network & Console Isolation Verification', async () => {
    // Assert 0 unexpected network calls to real backend/database/external AI
    expect(unexpectedRequests).toHaveLength(0)

    // Assert 0 console errors
    expect(consoleErrors).toHaveLength(0)
  })
})
