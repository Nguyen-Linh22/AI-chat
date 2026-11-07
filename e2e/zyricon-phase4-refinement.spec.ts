import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';

const REFINEMENT_SCREENSHOT_DIR = path.resolve(process.cwd(), 'screenshots/zyricon-phase4-refinement');
if (!fs.existsSync(REFINEMENT_SCREENSHOT_DIR)) {
  fs.mkdirSync(REFINEMENT_SCREENSHOT_DIR, { recursive: true });
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
            id: 'zyricon-cosmic-pilot',
            email: 'astronomy.pilot@ai-workspace.io',
            name: 'Commander Leo Sterling',
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
              id: 'chat-refinement-1',
              title: 'Hải đồ quang phổ Gas Giant & vành đai băng',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: 'chat-refinement-2',
              title: 'Cơ học quỹ đạo Lagrange L2 James Webb',
              createdAt: new Date(Date.now() - 3600000).toISOString(),
              updatedAt: new Date(Date.now() - 3600000).toISOString(),
            },
            {
              id: 'chat-dark-1',
              title: 'Thử nghiệm hồi quy Dark Theme',
              createdAt: new Date(Date.now() - 86400000).toISOString(),
              updatedAt: new Date(Date.now() - 86400000).toISOString(),
            },
          ],
        }),
      });
    }

    if (url.includes('/api/chats/chat-refinement-1/messages') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          messages: [
            {
              id: 'msg-u1',
              chatId: 'chat-refinement-1',
              role: 'user',
              content: 'Phân tích hải đồ quang phổ vành đai Sao Thổ và vùng cực của Sao Mộc theo dữ liệu viễn thám NASA.',
              createdAt: new Date(Date.now() - 120000).toISOString(),
            },
            {
              id: 'msg-a1',
              chatId: 'chat-refinement-1',
              role: 'assistant',
              content: `### Kết Quả Trinh Sát & Dữ Liệu Quang Phổ Thiên Thể

Quan sát trực tiếp từ các dải cảm biến hồng ngoại và tử ngoại:

| Vị Trí Quan Sát | Thiên Thể | Hiện Tượng Nổi Bật | Thành Phần Chính |
| :--- | :--- | :--- | :--- |
| **Góc Trên Bên Trái** | **Sao Hỏa (Mars)** | Bão bụi Syrtis Major | Silicat oxit sắt, tầng $CO_2$ loãng |
| **Góc Dưới Bên Trái** | **Sao Thổ (Saturn)** | Vành đai Cassini Division hoàn chỉnh | 99.1% hạt băng nước $H_2O$ tinh khiết |
| **Rìa Giữa Bên Phải** | **Sao Mộc (Jupiter)** | Xoáy xoay Great Red Spot & dải mây đối lưu | Hydro lỏng, amoniac, photphin |

\`\`\`typescript
// Tính chu kỳ cộng hưởng quỹ đạo giữa vành đai và vệ tinh Mimas
function computeRingResonance(satellitePeriodHours: number, ratio: [number, number]): number {
  const [p, q] = ratio;
  return satellitePeriodHours * Math.pow(p / q, 2.0 / 3.0);
}
\`\`\`

> *Bầu khí quyển ổn định, tầm nhìn bao quát toàn bộ ba thiên thể mà không cản trở khu vực làm việc trung tâm.*`,
              createdAt: new Date(Date.now() - 60000).toISOString(),
            },
          ],
        }),
      });
    }

    return route.continue();
  });
});

test.describe('Phase 4 Refinement — Zyricon Cosmic Composition & Motion Polish', () => {
  test('01-desktop-sidebar-expanded: Desktop — Sidebar expanded', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'zyricon');
    });

    await page.goto('/c/chat-refinement-1');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="zyricon-cosmic-canvas"]', { timeout: 15_000 });
    await page.waitForTimeout(2000);

    const screenshotPath = path.join(REFINEMENT_SCREENSHOT_DIR, '01-desktop-sidebar-expanded.png');
    await page.screenshot({ path: screenshotPath });
    expect(fs.existsSync(screenshotPath)).toBe(true);
  });

  test('02-desktop-sidebar-collapsed: Desktop — Sidebar collapsed', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'zyricon');
    });

    await page.goto('/c/chat-refinement-1');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="zyricon-cosmic-canvas"]', { timeout: 15_000 });

    const collapseBtn = page.getByRole('button', { name: 'Thu gọn thanh bên' });
    await collapseBtn.click();
    await page.waitForTimeout(800);

    const screenshotPath = path.join(REFINEMENT_SCREENSHOT_DIR, '02-desktop-sidebar-collapsed.png');
    await page.screenshot({ path: screenshotPath });
    expect(fs.existsSync(screenshotPath)).toBe(true);
  });

  test('03-desktop-new-planet-composition: Desktop — New planet composition on empty chat', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'zyricon');
    });

    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="zyricon-cosmic-canvas"]', { timeout: 15_000 });
    // Let WebGL render initial cosmic scene with Mars top-left, Jupiter right-center, Saturn bottom-left
    await page.waitForTimeout(2500);

    const screenshotPath = path.join(REFINEMENT_SCREENSHOT_DIR, '03-desktop-new-planet-composition.png');
    await page.screenshot({ path: screenshotPath });
    expect(fs.existsSync(screenshotPath)).toBe(true);
  });

  test('04-desktop-chat-conversation: Desktop — Chat conversation with glassmorphism', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'zyricon');
    });

    await page.goto('/c/chat-refinement-1');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="zyricon-cosmic-canvas"]', { timeout: 15_000 });
    await page.waitForSelector('[data-testid="code-block"]', { timeout: 10_000 });
    await page.waitForTimeout(2000);

    const screenshotPath = path.join(REFINEMENT_SCREENSHOT_DIR, '04-desktop-chat-conversation.png');
    await page.screenshot({ path: screenshotPath });
    expect(fs.existsSync(screenshotPath)).toBe(true);
  });

  test('05-desktop-composer-visible: Desktop — Composer visible & focused with glowing aura', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'zyricon');
    });

    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="zyricon-cosmic-canvas"]', { timeout: 15_000 });

    const composerTextarea = page.locator('textarea');
    await composerTextarea.click();
    await composerTextarea.fill('Đo đạc từ trường hành tinh và thông lượng gió mặt trời tại vành đai ngoài...');
    await page.waitForTimeout(600);

    const screenshotPath = path.join(REFINEMENT_SCREENSHOT_DIR, '05-desktop-composer-visible.png');
    await page.screenshot({ path: screenshotPath });
    expect(fs.existsSync(screenshotPath)).toBe(true);
  });

  test('06-mobile-new-planet-composition: Mobile 390x844 — New serpentine planet composition', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'zyricon');
    });

    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="zyricon-cosmic-canvas"]', { timeout: 15_000 });
    await page.waitForTimeout(2500);

    const screenshotPath = path.join(REFINEMENT_SCREENSHOT_DIR, '06-mobile-new-planet-composition.png');
    await page.screenshot({ path: screenshotPath });
    expect(fs.existsSync(screenshotPath)).toBe(true);
  });

  test('07-mobile-sidebar-open: Mobile — Sidebar drawer open over cosmic background', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'zyricon');
    });

    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="zyricon-cosmic-canvas"]', { timeout: 15_000 });

    const openMenuBtn = page.getByRole('button', { name: 'Mở menu danh sách đoạn chat' });
    await openMenuBtn.click();
    await page.waitForTimeout(600);

    const screenshotPath = path.join(REFINEMENT_SCREENSHOT_DIR, '07-mobile-sidebar-open.png');
    await page.screenshot({ path: screenshotPath });
    expect(fs.existsSync(screenshotPath)).toBe(true);
  });

  test('08-dark-theme-regression: Dark theme regression verification', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'dark');
    });

    await page.goto('/c/chat-refinement-1');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Verify 3D canvas is NOT present
    const canvasCount = await page.locator('[data-testid="zyricon-cosmic-canvas"]').count();
    expect(canvasCount).toBe(0);

    const screenshotPath = path.join(REFINEMENT_SCREENSHOT_DIR, '08-dark-theme-regression.png');
    await page.screenshot({ path: screenshotPath });
    expect(fs.existsSync(screenshotPath)).toBe(true);
  });

  test('09-light-theme-regression: Light theme regression verification', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'light');
    });

    await page.goto('/c/chat-refinement-1');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Verify 3D canvas is NOT present
    const canvasCount = await page.locator('[data-testid="zyricon-cosmic-canvas"]').count();
    expect(canvasCount).toBe(0);

    const screenshotPath = path.join(REFINEMENT_SCREENSHOT_DIR, '09-light-theme-regression.png');
    await page.screenshot({ path: screenshotPath });
    expect(fs.existsSync(screenshotPath)).toBe(true);
  });

  test('10-reduced-motion: Reduced motion preference verification', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'zyricon');
    });

    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="zyricon-cosmic-canvas"]', { timeout: 15_000 });
    await page.waitForTimeout(1500);

    const screenshotPath = path.join(REFINEMENT_SCREENSHOT_DIR, '10-reduced-motion.png');
    await page.screenshot({ path: screenshotPath });
    expect(fs.existsSync(screenshotPath)).toBe(true);
  });
});

