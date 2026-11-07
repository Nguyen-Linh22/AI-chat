import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';

const BUGFIX_SCREENSHOT_DIR = path.resolve(process.cwd(), 'screenshots/zyricon-sidebar-bugfix');
if (!fs.existsSync(BUGFIX_SCREENSHOT_DIR)) {
  fs.mkdirSync(BUGFIX_SCREENSHOT_DIR, { recursive: true });
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
            id: 'bugfix-tester',
            email: 'bugfix@ai-workspace.io',
            name: 'Bugfix Verification User',
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
              id: 'chat-bugfix-1',
              title: 'Hành tinh sao Thổ và Sao Mộc',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        }),
      });
    }

    if (url.includes('/api/chats/chat-bugfix-1/messages') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          messages: [
            {
              id: 'm1',
              chatId: 'chat-bugfix-1',
              role: 'assistant',
              content: 'Chào mừng bạn đến với AI Workspace.',
              createdAt: new Date().toISOString(),
            },
          ],
        }),
      });
    }

    return route.continue();
  });
});

/**
 * Helper to calculate non-black pixel ratio from a composited screenshot.
 * #07040B has RGB (7, 4, 11). Cosmic stars, planets, and nebula have higher values.
 */
async function getScreenshotNonBlackRatio(page: any): Promise<number> {
  const screenshotBuffer = await page.screenshot();
  const dataUrl = 'data:image/png;base64,' + screenshotBuffer.toString('base64');

  return await page.evaluate(async (src: string) => {
    const img = new Image();
    img.src = src;
    await new Promise((r) => (img.onload = r));

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 0;

    ctx.drawImage(img, 0, 0);

    let nonBlackPixels = 0;
    let totalSampled = 0;
    // Sample across the chat area
    for (let x = 400; x < canvas.width - 50; x += 40) {
      for (let y = 150; y < canvas.height - 100; y += 30) {
        totalSampled++;
        const p = ctx.getImageData(x, y, 1, 1).data;
        if (p[0] > 15 || p[1] > 15 || p[2] > 25) {
          nonBlackPixels++;
        }
      }
    }
    return totalSampled > 0 ? nonBlackPixels / totalSampled : 0;
  }, dataUrl);
}

test.describe('Phase 4 Bugfix — Zyricon Background Continuity During Sidebar Transitions', () => {
  test('TC-SIDEBAR-01: Desktop Sidebar Open -> Close continuous background verification', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'zyricon');
    });

    await page.goto('/c/chat-bugfix-1');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="zyricon-cosmic-canvas"]', { timeout: 15_000 });
    await page.waitForTimeout(2000);

    const initialRatio = await getScreenshotNonBlackRatio(page);
    expect(initialRatio).toBeGreaterThan(0.2);

    const collapseBtn = page.getByRole('button', { name: 'Thu gọn thanh bên' });
    await expect(collapseBtn).toBeVisible();

    // Trigger sidebar collapse (200ms CSS transition)
    await collapseBtn.click();

    // Sample 6 intermediate frames during the 200ms collapse animation
    for (let i = 1; i <= 6; i++) {
      await page.waitForTimeout(25);
      const ratio = await getScreenshotNonBlackRatio(page);
      const screenshotPath = path.join(
        BUGFIX_SCREENSHOT_DIR,
        `01-collapse-frame-${String(i).padStart(2, '0')}-${i * 25}ms.png`
      );
      await page.screenshot({ path: screenshotPath });

      // CRITICAL ASSERTION: The non-black ratio must NEVER drop to 0 (no blackout)
      expect(ratio, `Frame ${i} at ${i * 25}ms must maintain cosmic background visibility`).toBeGreaterThan(0.15);
    }

    // Wait for transition to settle
    await page.waitForTimeout(300);
    const finalRatio = await getScreenshotNonBlackRatio(page);
    expect(finalRatio).toBeGreaterThan(0.2);

    await page.screenshot({
      path: path.join(BUGFIX_SCREENSHOT_DIR, '01-collapse-settled.png'),
    });

    // Zero critical errors
    const criticalErrors = consoleErrors.filter((e) => !e.includes('favicon') && !e.includes('Failed to fetch'));
    expect(criticalErrors).toHaveLength(0);
  });

  test('TC-SIDEBAR-02: Desktop Sidebar Close -> Open continuous background verification', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'zyricon');
    });

    await page.goto('/c/chat-bugfix-1');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="zyricon-cosmic-canvas"]', { timeout: 15_000 });

    // Collapse first
    const collapseBtn = page.getByRole('button', { name: 'Thu gọn thanh bên' });
    await collapseBtn.click();
    await page.waitForTimeout(350);

    const expandBtn = page.getByRole('button', { name: 'Mở rộng thanh bên' });
    await expect(expandBtn).toBeVisible();

    // Trigger expand (240ms CSS transition)
    await expandBtn.click();

    // Sample 6 intermediate frames during expand animation
    for (let i = 1; i <= 6; i++) {
      await page.waitForTimeout(30);
      const ratio = await getScreenshotNonBlackRatio(page);
      const screenshotPath = path.join(
        BUGFIX_SCREENSHOT_DIR,
        `02-expand-frame-${String(i).padStart(2, '0')}-${i * 30}ms.png`
      );
      await page.screenshot({ path: screenshotPath });

      // CRITICAL ASSERTION: The non-black ratio must NEVER drop to 0
      expect(ratio, `Expand frame ${i} at ${i * 30}ms must maintain cosmic background visibility`).toBeGreaterThan(
        0.15
      );
    }

    await page.waitForTimeout(350);
    const settledRatio = await getScreenshotNonBlackRatio(page);
    expect(settledRatio).toBeGreaterThan(0.2);

    await page.screenshot({
      path: path.join(BUGFIX_SCREENSHOT_DIR, '02-expand-settled.png'),
    });
  });

  test('TC-SIDEBAR-03: Rapid toggle stress test (interrupting mid-flight animations)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'zyricon');
    });

    await page.goto('/c/chat-bugfix-1');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="zyricon-cosmic-canvas"]', { timeout: 15_000 });
    await page.waitForTimeout(1500);

    // Rapidly toggle 4 times with short delays (50ms - 80ms)
    for (let cycle = 1; cycle <= 4; cycle++) {
      const toggleBtn = page.locator('#app-sidebar button[aria-controls="app-sidebar"]');
      await toggleBtn.click();
      await page.waitForTimeout(60);

      const ratio = await getScreenshotNonBlackRatio(page);
      expect(ratio, `Rapid toggle cycle ${cycle} must not black out`).toBeGreaterThan(0.15);
    }

    await page.waitForTimeout(400);
    const finalRatio = await getScreenshotNonBlackRatio(page);
    expect(finalRatio).toBeGreaterThan(0.2);

    await page.screenshot({
      path: path.join(BUGFIX_SCREENSHOT_DIR, '03-rapid-toggle-final.png'),
    });
  });

  test('TC-SIDEBAR-04: Viewport resize during sidebar transition', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'zyricon');
    });

    await page.goto('/c/chat-bugfix-1');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="zyricon-cosmic-canvas"]', { timeout: 15_000 });

    const collapseBtn = page.getByRole('button', { name: 'Thu gọn thanh bên' });
    await collapseBtn.click();

    // Concurrently resize the browser window during sidebar collapse animation
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(50);
    await page.setViewportSize({ width: 1100, height: 750 });
    await page.waitForTimeout(50);

    const ratio = await getScreenshotNonBlackRatio(page);
    expect(ratio).toBeGreaterThan(0.15);

    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(BUGFIX_SCREENSHOT_DIR, '04-resize-during-transition.png'),
    });
  });

  test('TC-SIDEBAR-05: Mobile 390x844 drawer open/close verification', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'zyricon');
    });

    await page.goto('/c/chat-bugfix-1');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="zyricon-cosmic-canvas"]', { timeout: 15_000 });
    await page.waitForTimeout(1500);

    // Open mobile sidebar drawer
    const openMenuBtn = page.getByRole('button', { name: 'Mở menu danh sách đoạn chat' });
    await expect(openMenuBtn).toBeVisible();
    await openMenuBtn.click();

    await page.waitForTimeout(350);
    await page.screenshot({
      path: path.join(BUGFIX_SCREENSHOT_DIR, '05-mobile-drawer-open.png'),
    });

    // Cosmic canvas remains visible behind glass drawer
    await expect(page.getByTestId('zyricon-cosmic-canvas')).toBeVisible();

    // Close mobile drawer by clicking backdrop or close button
    const backdrop = page.locator('.fixed.inset-0.bg-black\\/60, .fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible()) {
      await backdrop.click({ position: { x: 350, y: 400 }, force: true });
    }

    await page.waitForTimeout(350);
    await page.screenshot({
      path: path.join(BUGFIX_SCREENSHOT_DIR, '05-mobile-drawer-closed.png'),
    });
  });

  test('TC-SIDEBAR-06: Dark theme sidebar transition regression', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'dark');
    });

    await page.goto('/c/chat-bugfix-1');
    await page.waitForLoadState('networkidle');

    const collapseBtn = page.getByRole('button', { name: 'Thu gọn thanh bên' });
    await expect(collapseBtn).toBeVisible();
    await collapseBtn.click();
    await page.waitForTimeout(300);

    await page.screenshot({
      path: path.join(BUGFIX_SCREENSHOT_DIR, '06-dark-sidebar-collapsed.png'),
    });
  });

  test('TC-SIDEBAR-07: Light theme sidebar transition regression', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'light');
    });

    await page.goto('/c/chat-bugfix-1');
    await page.waitForLoadState('networkidle');

    const collapseBtn = page.getByRole('button', { name: 'Thu gọn thanh bên' });
    await expect(collapseBtn).toBeVisible();
    await collapseBtn.click();
    await page.waitForTimeout(300);

    await page.screenshot({
      path: path.join(BUGFIX_SCREENSHOT_DIR, '07-light-sidebar-collapsed.png'),
    });
  });

  test('TC-SIDEBAR-08: Reduced motion sidebar transition', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'zyricon');
    });

    await page.goto('/c/chat-bugfix-1');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="zyricon-cosmic-canvas"]', { timeout: 15_000 });

    const collapseBtn = page.getByRole('button', { name: 'Thu gọn thanh bên' });
    await collapseBtn.click();
    // With reduced motion, transition is immediate
    await page.waitForTimeout(50);

    const ratio = await getScreenshotNonBlackRatio(page);
    expect(ratio).toBeGreaterThan(0.15);

    await page.screenshot({
      path: path.join(BUGFIX_SCREENSHOT_DIR, '08-reduced-motion-collapsed.png'),
    });
  });
});
