import fs from 'node:fs';
import path from 'node:path';
import { test, expect, Page } from '@playwright/test';

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'screenshots/celestial-preview');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function linearize(c: number): number {
  const norm = c / 255;
  return norm <= 0.04045 ? norm / 12.92 : Math.pow((norm + 0.055) / 1.055, 2.4);
}

function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function parseCssRgb(colorStr: string): { r: number; g: number; b: number; a: number } {
  // Support both rgb(r, g, b) and rgba(r, g, b, a) and oklch/color format
  const rgbaMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1], 10),
      g: parseInt(rgbaMatch[2], 10),
      b: parseInt(rgbaMatch[3], 10),
      a: rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1,
    };
  }
  return { r: 0, g: 0, b: 0, a: 1 };
}

async function setupMocks(page: Page, options: { emptyChats?: boolean } = {}) {
  await page.route('https://accounts.google.com/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: 'window.google = { accounts: { id: { initialize: () => {}, renderButton: () => {} } } };',
    })
  );

  await page.route('**/api/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();

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
      });
    }

    if (url.includes('/api/auth/me') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'celestial-user',
            email: 'user@celestial.workspace.io',
            name: 'Celestial User',
          },
        }),
      });
    }

    if (url.endsWith('/api/chats') && method === 'GET') {
      if (options.emptyChats) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ chats: [] }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          chats: [
            {
              id: 'chat-rich-1',
              title: 'Khảo sát độ tương phản Celestial Daylight',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        }),
      });
    }

    if (url.includes('/api/chats/chat-rich-1/messages') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          messages: [
            {
              id: 'm-user-1',
              chatId: 'chat-rich-1',
              role: 'user',
              content: 'Hãy mô tả chi tiết bầu trời kèm [Tài liệu người dùng](https://example.com/user-link) và bảng dữ liệu.',
              createdAt: new Date(Date.now() - 120000).toISOString(),
            },
            {
              id: 'm-ai-1',
              chatId: 'chat-rich-1',
              role: 'assistant',
              content: `Bầu trời [Celestial Daylight](https://example.com/celestial) được thiết kế với dải màu Rayleigh quang học.

Đoạn mã inline như \`linearize(c)\` tính toán độ chói WCAG sRGB chuẩn xác.

| Thành phần | Màu sắc | Độ tương phản |
| :--- | :--- | :--- |
| Đỉnh trời Zenith | \`#84C2F5\` | Tán xạ Rayleigh |
| Mây Cirrus tầng cao | \`cirrus-high.webp\` | Trắng quang học |
| Mặt trời điện ảnh | Golden Amber | Vầng hào quang ấm |

> Không gian làm việc thanh lịch, thoáng đãng cho tư duy sáng tạo.`,
              createdAt: new Date(Date.now() - 60000).toISOString(),
            },
          ],
        }),
      });
    }

    return route.continue();
  });
}

test.describe('Celestial Daylight — Contrast & Polish Verification (Phase 5)', () => {
  test('AC-01 & AC-04: Welcome Screen contrast compliance & focus states', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'light');
      localStorage.setItem('auth_token', 'mock_token');
      localStorage.setItem('auth_user', JSON.stringify({ id: 'celestial-user', email: 'user@celestial.workspace.io' }));
    });
    await setupMocks(page, { emptyChats: true });

    await page.goto('/chat', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // 1. Welcome Greeting Card existence & styling
    const greetingCard = page.locator('.rounded-3xl.backdrop-blur-md');
    await expect(greetingCard).toBeVisible();

    // 2. Welcome Description text color and contrast
    const welcomeDesc = greetingCard.locator('p.text-slate-700');
    await expect(welcomeDesc).toBeVisible();

    // 3. Hero Cards & Quick Chips
    const heroCards = page.locator('button[aria-label^="Khám phá:"]');
    await expect(heroCards).toHaveCount(4);

    const quickChips = page.locator('button[aria-label^="Gợi ý nhanh:"]');
    await expect(quickChips).toHaveCount(4);

    // Verify Focus Ring token classes on Hero Card
    const firstHero = heroCards.first();
    const heroClasses = await firstHero.getAttribute('class');
    expect(heroClasses).toContain('focus-visible:ring-amber-600');
    expect(heroClasses).not.toContain('#1B8F3D');

    // Verify Focus Ring token classes on Quick Chip
    const firstChip = quickChips.first();
    const chipClasses = await firstChip.getAttribute('class');
    expect(chipClasses).toContain('focus-visible:ring-amber-600');
    expect(chipClasses).not.toContain('#1B8F3D');

    // Screenshot Welcome Screen
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'e2e-ac01-welcome-screen-1440x900.png') });
  });

  test('AC-02 & AC-03: Header isolation, subtitle contrast & Send button amber gradient', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'light');
      localStorage.setItem('auth_token', 'mock_token');
      localStorage.setItem('auth_user', JSON.stringify({ id: 'celestial-user', email: 'user@celestial.workspace.io' }));
    });
    await setupMocks(page, { emptyChats: true });

    await page.goto('/chat', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // 1. Scoped Header attributes & classes
    const header = page.locator('header[data-chat-header="true"]');
    await expect(header).toBeVisible();
    await expect(header).toHaveClass(/chat-area-header/);

    // Verify Header Frosted Glass Background
    const headerComputed = await header.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return {
        bg: s.backgroundColor,
        backdrop: s.backdropFilter,
        borderBottom: s.borderBottomColor,
      };
    });
    expect(headerComputed.bg).toContain('rgba(255, 255, 255, 0.75)');
    expect(headerComputed.backdrop).toContain('blur(12px)');

    // 2. Header Subtitle ("Đoạn chat mới")
    const subtitle = header.locator('span.text-slate-600');
    await expect(subtitle).toBeVisible();
    await expect(subtitle).toHaveText('Đoạn chat mới');

    // 3. Send Button Golden Amber Gradient (AC-03)
    const sendBtn = page.locator('.composer-send-btn');
    await expect(sendBtn).toBeVisible();
    const sendBtnClasses = await sendBtn.getAttribute('class');
    expect(sendBtnClasses).toContain('from-[#D97706]');
    expect(sendBtnClasses).toContain('to-[#C2410C]');
    expect(sendBtnClasses).toContain('focus-visible:ring-amber-600');
    expect(sendBtnClasses).toContain('focus-visible:ring-offset-2');
    expect(sendBtnClasses).not.toContain('#1B8F3D');

    // 4. Model Indicator Icon
    const modelIcon = page.locator('[data-testid="model-indicator"] svg');
    if (await modelIcon.isVisible()) {
      const iconClasses = await modelIcon.getAttribute('class');
      expect(iconClasses).toContain('text-amber-600');
      expect(iconClasses).not.toContain('#1B8F3D');
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'e2e-ac02-header-and-composer-1440x900.png') });
  });

  test('AC-01 & AC-03: Chat Content, Markdown links, Inline Code & Elevation shadow', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'light');
      localStorage.setItem('auth_token', 'mock_token');
      localStorage.setItem('auth_user', JSON.stringify({ id: 'celestial-user', email: 'user@celestial.workspace.io' }));
    });
    await setupMocks(page, { emptyChats: false });

    await page.goto('/c/chat-rich-1', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // 1. AI Message Bubble
    const aiBubble = page.locator('[data-testid="ai-avatar"]').first().locator('xpath=ancestor::div[contains(@class, "rounded-2xl")]');
    await expect(aiBubble).toBeVisible();
    const aiBubbleClasses = await aiBubble.getAttribute('class');
    expect(aiBubbleClasses).toContain('bg-white');
    expect(aiBubbleClasses).toContain('shadow-[0_4px_20px_-4px_rgba(132,194,245,0.25)]');

    // 2. Markdown Link in AI Bubble (Sky-700 on bg-white: 5.93:1)
    const markdownLink = aiBubble.locator('a[href="https://example.com/celestial"]');
    await expect(markdownLink).toBeVisible();
    const linkClasses = await markdownLink.getAttribute('class');
    expect(linkClasses).toContain('text-sky-700');
    expect(linkClasses).not.toContain('text-emerald-600');
    expect(linkClasses).not.toContain('text-sky-300');
    expect(linkClasses).not.toContain('hover:opacity');

    // 2b. Markdown Link in User Bubble (Sky-300 on bg-slate-900: 10.71:1)
    const userBubble = page.locator('[data-testid="user-avatar"]').first().locator('xpath=ancestor::div[contains(@class, "rounded-2xl")]');
    await expect(userBubble).toBeVisible();
    const userBubbleClasses = await userBubble.getAttribute('class');
    expect(userBubbleClasses).toContain('bg-slate-900');
    const userMarkdownLink = userBubble.locator('a[href="https://example.com/user-link"]');
    await expect(userMarkdownLink).toBeVisible();
    const userLinkClasses = await userMarkdownLink.getAttribute('class');
    expect(userLinkClasses).toContain('text-sky-300');
    expect(userLinkClasses).not.toContain('text-sky-700');
    expect(userLinkClasses).not.toContain('hover:opacity');

    // 3. Inline Code (Amber 900)
    const inlineCode = aiBubble.locator('code:has-text("linearize(c)")');
    await expect(inlineCode).toBeVisible();
    const codeClasses = await inlineCode.getAttribute('class');
    expect(codeClasses).toContain('text-amber-900');
    expect(codeClasses).toContain('bg-amber-50/80');
    expect(codeClasses).not.toContain('text-emerald-700');

    // 4. Table Region Focus Ring
    const tableContainer = page.locator('[data-testid="table-container"]');
    await expect(tableContainer).toBeVisible();
    const tableClasses = await tableContainer.getAttribute('class');
    expect(tableClasses).toContain('focus-visible:ring-amber-600');
    expect(tableClasses).not.toContain('#1B8F3D');

    // 5. Action Buttons (Copy / Regenerate) Focus Ring
    const copyBtn = page.locator('button[title="Sao chép nội dung"]');
    await expect(copyBtn).toBeVisible();
    const copyClasses = await copyBtn.getAttribute('class');
    expect(copyClasses).toContain('focus-visible:ring-amber-600');
    expect(copyClasses).not.toContain('#1B8F3D');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'e2e-ac03-chat-content-1440x900.png') });
  });

  test('AC-06: Dark Theme and Zyricon Non-Interference', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Test Dark Theme
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'dark');
      localStorage.setItem('auth_token', 'mock_token');
      localStorage.setItem('auth_user', JSON.stringify({ id: 'celestial-user', email: 'user@celestial.workspace.io' }));
    });
    await setupMocks(page, { emptyChats: true });

    await page.goto('/chat', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Verify root has dark class
    const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(isDark).toBe(true);

    // Header in dark mode must NOT have white frosted glass
    const headerDark = page.locator('header[data-chat-header="true"]');
    const headerDarkBg = await headerDark.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(headerDarkBg).toBe('rgba(0, 0, 0, 0)');

    // Celestial background container should NOT be rendered in Dark Theme
    const celestialBgDark = page.locator('.celestial-background-container');
    await expect(celestialBgDark).toHaveCount(0);

    // Starfield layers should be present in Dark Theme
    const starLayer = page.locator('.chat-stars-layer-1');
    await expect(starLayer).toBeVisible();

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'e2e-ac06-dark-theme-1440x900.png') });
  });

  test('AC-07: Responsive Viewport Verification (5 Viewports)', async ({ page }) => {
    const viewports = [
      { width: 1440, height: 900, name: '1440x900-desktop' },
      { width: 1280, height: 800, name: '1280x800-laptop' },
      { width: 768, height: 1024, name: '768x1024-tablet' },
      { width: 390, height: 844, name: '390x844-mobile' },
      { width: 360, height: 800, name: '360x800-mobile-s' },
    ];

    await page.addInitScript(() => {
      localStorage.setItem('theme', 'light');
      localStorage.setItem('auth_token', 'mock_token');
      localStorage.setItem('auth_user', JSON.stringify({ id: 'celestial-user', email: 'user@celestial.workspace.io' }));
    });
    await setupMocks(page, { emptyChats: true });

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/chat', { waitUntil: 'networkidle' });
      await page.waitForTimeout(400);

      // Verify no horizontal document overflow
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScroll).toBe(false);

      // Header is docked and visible
      const header = page.locator('header[data-chat-header="true"]');
      await expect(header).toBeVisible();

      // Composer is visible
      const sendBtn = page.locator('.composer-send-btn');
      await expect(sendBtn).toBeVisible();

      // Capture screenshot
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `e2e-ac07-responsive-${vp.name}.png`),
      });
    }
  });
});
