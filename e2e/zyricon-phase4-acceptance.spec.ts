import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'screenshots/zyricon-phase4');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

test.beforeEach(async ({ page }) => {
  // Mock Google Accounts
  await page.route('https://accounts.google.com/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: 'window.google = { accounts: { id: { initialize: () => {}, renderButton: () => {} } } };',
    })
  );

  // Mock Backend APIs
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
            {
              id: 'chatgpt-4o-latest',
              name: 'ChatGPT 4o',
              provider: 'openai',
              model: 'chatgpt-4o-latest',
              available: true,
            },
            {
              id: 'claude-3-7-sonnet',
              name: 'Claude 3.7 Sonnet',
              provider: 'anthropic',
              model: 'claude-3-7-sonnet',
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
            id: 'zyricon-tester-id',
            email: 'zyricon.cosmic@ai-workspace.io',
            name: 'Dr. Katherine Vance',
          },
        }),
      });
    }

    if (url.endsWith('/api/chats') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          chats: [
            {
              id: 'chat-zyricon-1',
              title: 'Khảo sát khí quyển hành tinh Gas Giant',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: 'chat-zyricon-2',
              title: 'Mô phỏng quỹ đạo vành đai sao Thổ',
              createdAt: new Date(Date.now() - 3600000).toISOString(),
              updatedAt: new Date(Date.now() - 3600000).toISOString(),
            },
            {
              id: 'chat-dark-1',
              title: 'Kiến trúc Deep Space & PBR Shaders',
              createdAt: new Date(Date.now() - 86400000).toISOString(),
              updatedAt: new Date(Date.now() - 86400000).toISOString(),
            },
          ],
        }),
      });
    }

    if (url.includes('/api/chats/chat-zyricon-1/messages') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          messages: [
            {
              id: 'msg-u1',
              chatId: 'chat-zyricon-1',
              role: 'user',
              content: 'Hãy phân tích thành phần bầu khí quyển của Sao Mộc và Sao Thổ dựa trên dữ liệu quang phổ mới nhất từ tàu không gian Cassini và Juno.',
              createdAt: new Date(Date.now() - 120000).toISOString(),
            },
            {
              id: 'msg-a1',
              chatId: 'chat-zyricon-1',
              role: 'assistant',
              content: `### Phân Tích Quang Phổ Khí Quyển Hành Tinh Khí Khổng Lồ

Dữ liệu tổng hợp từ tàu thăm dò **Juno** (NASA) và **Cassini-Huygens** (NASA/ESA) cung cấp chi tiết thành phần khí quyển sâu:

| Hành Tinh | Hydro ($H_2$) | Heli ($He$) | Hợp Chất Thứ Cấp | Đặc Tính Quang Phổ |
| :--- | :--- | :--- | :--- | :--- |
| **Sao Mộc (Jupiter)** | ~89.8% | ~10.2% | $CH_4, NH_3, H_2S, H_2O$ | Băng amoniac tầng cao, Great Red Spot hấp thụ tia UV mạnh |
| **Sao Thổ (Saturn)** | ~96.3% | ~3.25% | $CH_4, C_2H_6, PH_3, CO$ | Lớp sương mù hydrocacbon dày, vành đai $H_2O$ băng tinh khiết 99% |

\`\`\`typescript
// Thuật toán tính toán thông lượng bức xạ tán xạ Rayleigh
function computeAtmosphericRayleigh(wavelengthNm: number, pressureBar: number): number {
  const referenceWavelength = 550.0; // 550nm green baseline
  const rayleighCoeff = 0.0012;
  const wavelengthFactor = Math.pow(referenceWavelength / wavelengthNm, 4);
  return rayleighCoeff * pressureBar * wavelengthFactor;
}
\`\`\`

> **Kết luận trinh sát**: Cả hai thiên thể đều có lõi áp suất cực cao vượt quá 100 GPa, nơi Hydro chuyển sang pha kim loại lỏng siêu dẫn từ trường.`,
              createdAt: new Date(Date.now() - 60000).toISOString(),
            },
          ],
        }),
      });
    }

    // Default passthrough
    return route.continue();
  });
});

test.describe('Phase 4 — Zyricon UI Integration & Acceptance Screenshots', () => {
  test('01-zyricon-desktop-empty: Empty chat with welcome screen on Zyricon theme', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'zyricon');
    });

    await page.goto('/chat');
    await page.waitForLoadState('networkidle');

    // Wait for 3D Cosmic canvas or container to mount and stabilize
    await page.waitForSelector('[data-testid="zyricon-cosmic-canvas"]', { timeout: 15_000 });
    // Let WebGL render initial cosmic scene
    await page.waitForTimeout(2500);

    // Verify WelcomeScreen elements
    await expect(page.getByTestId('zyricon-cosmic-canvas')).toBeVisible();

    const screenshotPath = path.join(SCREENSHOT_DIR, '01-zyricon-desktop-empty.png');
    await page.screenshot({ path: screenshotPath });
    expect(fs.existsSync(screenshotPath)).toBe(true);
  });

  test('02-zyricon-desktop-conversation: Active chat messages with codeblock and table', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'zyricon');
    });

    await page.goto('/c/chat-zyricon-1');
    await page.waitForLoadState('networkidle');

    await page.waitForSelector('[data-testid="zyricon-cosmic-canvas"]', { timeout: 15_000 });
    await page.waitForSelector('[data-testid="code-block"]', { timeout: 10_000 });
    await page.waitForTimeout(2000);

    const screenshotPath = path.join(SCREENSHOT_DIR, '02-zyricon-desktop-conversation.png');
    await page.screenshot({ path: screenshotPath });
    expect(fs.existsSync(screenshotPath)).toBe(true);
  });

  test('03-zyricon-desktop-model-dropdown: Open model selector with glassmorphism', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'zyricon');
    });

    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="zyricon-cosmic-canvas"]', { timeout: 15_000 });

    // Click model selector trigger
    const modelTrigger = page.locator('.model-selector-trigger');
    await modelTrigger.click();
    await page.waitForSelector('.model-selector-popover', { state: 'visible' });
    await page.waitForTimeout(600);

    const screenshotPath = path.join(SCREENSHOT_DIR, '03-zyricon-desktop-model-dropdown.png');
    await page.screenshot({ path: screenshotPath });
    expect(fs.existsSync(screenshotPath)).toBe(true);
  });

  test('04-zyricon-desktop-sidebar-expanded: Expanded sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'zyricon');
    });

    await page.goto('/c/chat-zyricon-1');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="zyricon-cosmic-canvas"]', { timeout: 15_000 });
    await page.waitForTimeout(1500);

    const screenshotPath = path.join(SCREENSHOT_DIR, '04-zyricon-desktop-sidebar-expanded.png');
    await page.screenshot({ path: screenshotPath });
    expect(fs.existsSync(screenshotPath)).toBe(true);
  });

  test('05-zyricon-desktop-sidebar-collapsed: Collapsed sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'zyricon');
    });

    await page.goto('/c/chat-zyricon-1');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="zyricon-cosmic-canvas"]', { timeout: 15_000 });

    // Toggle collapse sidebar button
    const collapseBtn = page.getByRole('button', { name: 'Thu gọn thanh bên' });
    await collapseBtn.click();
    await page.waitForTimeout(600);

    const screenshotPath = path.join(SCREENSHOT_DIR, '05-zyricon-desktop-sidebar-collapsed.png');
    await page.screenshot({ path: screenshotPath });
    expect(fs.existsSync(screenshotPath)).toBe(true);
  });

  test('06-zyricon-desktop-composer-focused: Focused composer with input text', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'zyricon');
    });

    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="zyricon-cosmic-canvas"]', { timeout: 15_000 });

    const composerTextarea = page.locator('textarea');
    await composerTextarea.click();
    await composerTextarea.fill('Mô phỏng trường hấp dẫn của hố đen siêu khối lượng ở tâm dải Ngân Hà Sag A*...');
    await page.waitForTimeout(600);

    const screenshotPath = path.join(SCREENSHOT_DIR, '06-zyricon-desktop-composer-focused.png');
    await page.screenshot({ path: screenshotPath });
    expect(fs.existsSync(screenshotPath)).toBe(true);
  });

  test('07-zyricon-desktop-modal: Open Search Modal with glassmorphic backdrop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'zyricon');
    });

    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="zyricon-cosmic-canvas"]', { timeout: 15_000 });

    // Open search modal via search button in sidebar
    const searchBtn = page.locator('button[title="Tìm kiếm cuộc trò chuyện (Ctrl+K)"]').first();
    if (await searchBtn.isVisible()) {
      await searchBtn.click();
    } else {
      await page.keyboard.press('Control+k');
    }

    await page.waitForSelector('[role="dialog"], [aria-label="Tìm kiếm cuộc trò chuyện"]', { state: 'visible' });
    await page.waitForTimeout(600);

    const screenshotPath = path.join(SCREENSHOT_DIR, '07-zyricon-desktop-modal.png');
    await page.screenshot({ path: screenshotPath });
    expect(fs.existsSync(screenshotPath)).toBe(true);
  });

  test('08-zyricon-mobile: Mobile portrait 390x844 responsive layout', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'zyricon');
    });

    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="zyricon-cosmic-canvas"]', { timeout: 15_000 });
    await page.waitForTimeout(2000);

    const screenshotPath = path.join(SCREENSHOT_DIR, '08-zyricon-mobile.png');
    await page.screenshot({ path: screenshotPath });
    expect(fs.existsSync(screenshotPath)).toBe(true);
  });

  test('09-dark-theme-regression: Dark theme regression verification', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'dark');
    });

    await page.goto('/c/chat-zyricon-1');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Verify 3D canvas is NOT present
    const canvasCount = await page.locator('[data-testid="zyricon-cosmic-canvas"]').count();
    expect(canvasCount).toBe(0);

    // Verify CSS stars are present
    const starsLayer = page.locator('.chat-stars-layer-1');
    await expect(starsLayer).toBeAttached();

    const screenshotPath = path.join(SCREENSHOT_DIR, '09-dark-theme-regression.png');
    await page.screenshot({ path: screenshotPath });
    expect(fs.existsSync(screenshotPath)).toBe(true);
  });

  test('10-light-theme-regression: Light theme regression verification', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'light');
    });

    await page.goto('/c/chat-zyricon-1');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Verify 3D canvas is NOT present
    const canvasCount = await page.locator('[data-testid="zyricon-cosmic-canvas"]').count();
    expect(canvasCount).toBe(0);

    // Verify CSS stars are present
    const starsLayer = page.locator('.chat-stars-layer-1');
    await expect(starsLayer).toBeAttached();

    const screenshotPath = path.join(SCREENSHOT_DIR, '10-light-theme-regression.png');
    await page.screenshot({ path: screenshotPath });
    expect(fs.existsSync(screenshotPath)).toBe(true);
  });
});
