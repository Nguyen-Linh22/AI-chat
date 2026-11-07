import fs from 'node:fs';
import path from 'node:path';
import { test, expect, Page } from '@playwright/test';

const CELESTIAL_SCREENSHOT_DIR = path.resolve(process.cwd(), 'screenshots/celestial-preview');
if (!fs.existsSync(CELESTIAL_SCREENSHOT_DIR)) {
  fs.mkdirSync(CELESTIAL_SCREENSHOT_DIR, { recursive: true });
}

interface ROI {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ROIAnalysisResult {
  blackoutCount: number;
  totalPixels: number;
  blackoutRatio: number;
  meanLuminance: number;
  minLuminance: number;
  maxLuminance: number;
}

/**
 * Common Mocking Setup for Google Auth and Backend APIs
 */
async function setupMocks(page: Page) {
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
            id: 'celestial-tester',
            email: 'tester@celestial.workspace.io',
            name: 'Celestial Integration Tester',
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
              id: 'chat-1',
              title: 'Khám phá bầu trời Celestial Daylight',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        }),
      });
    }

    if (url.includes('/api/chats/chat-1/messages') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          messages: [
            {
              id: 'm1',
              chatId: 'chat-1',
              role: 'user',
              content: 'Xin chào, hãy phân tích vẻ đẹp của bầu trời ban ngày.',
              createdAt: new Date(Date.now() - 60000).toISOString(),
            },
            {
              id: 'm2',
              chatId: 'chat-1',
              role: 'assistant',
              content: 'Bầu trời ban ngày được chiếu sáng bởi hiện tượng tán xạ Rayleigh, mang lại sắc xanh thiên thanh êm dịu từ đỉnh trời xuống đường chân trời.',
              createdAt: new Date().toISOString(),
            },
          ],
        }),
      });
    }

    return route.continue();
  });
}

/**
 * Confirms image decoding complete for all cloud layers
 */
async function waitForCelestialAssets(page: Page) {
  await page.waitForSelector('[data-testid="celestial-daylight-bg"]', { timeout: 15_000 });
  await page.evaluate(async () => {
    const images = Array.from(document.querySelectorAll<HTMLImageElement>('.celestial-cloud-image'));
    await Promise.all(
      images.map((img) => {
        if (img.complete && img.naturalWidth > 0) {
          return img.decode().catch(() => {});
        }
        return new Promise<void>((resolve) => {
          img.onload = () => {
            img.decode().catch(() => {}).then(() => resolve());
          };
          img.onerror = () => resolve();
        });
      })
    );
  });
}

/**
 * Computes pixel-by-pixel WCAG 2.1 sRGB Relative Luminance in the given ROI
 */
async function analyzeROI(page: Page, roi: ROI): Promise<ROIAnalysisResult> {
  const screenshotBuffer = await page.screenshot();
  const dataUrl = 'data:image/png;base64,' + screenshotBuffer.toString('base64');

  return await page.evaluate(
    async ({ src, roi }: { src: string; roi: ROI }) => {
      const img = new Image();
      img.src = src;
      await new Promise((r) => (img.onload = r));

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('Failed to get 2d context');

      ctx.drawImage(img, 0, 0);

      const startX = Math.max(0, Math.round(roi.x));
      const startY = Math.max(0, Math.round(roi.y));
      const w = Math.min(canvas.width - startX, Math.round(roi.width));
      const h = Math.min(canvas.height - startY, Math.round(roi.height));

      const imgData = ctx.getImageData(startX, startY, w, h).data;
      let blackoutCount = 0;
      let totalPixels = w * h;
      let sumLuminance = 0;
      let minL = 1.0;
      let maxL = 0.0;

      for (let i = 0; i < imgData.length; i += 4) {
        const r = imgData[i];
        const g = imgData[i + 1];
        const b = imgData[i + 2];

        // WCAG sRGB channel normalization
        const rs = r / 255;
        const gs = g / 255;
        const bs = b / 255;

        // Linearize (Gamma expansion)
        const rLin = rs <= 0.04045 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4);
        const gLin = gs <= 0.04045 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4);
        const bLin = bs <= 0.04045 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4);

        // WCAG Relative Luminance
        const L = 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;

        // Blackout Pixel threshold: L <= 0.0100
        if (L <= 0.0100) {
          blackoutCount++;
        }

        sumLuminance += L;
        if (L < minL) minL = L;
        if (L > maxL) maxL = L;
      }

      const blackoutRatio = totalPixels > 0 ? (blackoutCount / totalPixels) * 100 : 0;
      const meanLuminance = totalPixels > 0 ? sumLuminance / totalPixels : 0;

      return {
        blackoutCount,
        totalPixels,
        blackoutRatio,
        meanLuminance,
        minLuminance: minL,
        maxLuminance: maxL,
      };
    },
    { src: dataUrl, roi }
  );
}

/**
 * Saves a verification screenshot with a red bounding box marking the ROI
 */
async function saveROIVerification(page: Page, roi: ROI, outputPath: string) {
  const screenshotBuffer = await page.screenshot();
  const dataUrl = 'data:image/png;base64,' + screenshotBuffer.toString('base64');

  const markedDataUrl = await page.evaluate(
    async ({ src, roi }: { src: string; roi: ROI }) => {
      const img = new Image();
      img.src = src;
      await new Promise((r) => (img.onload = r));

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No context');

      ctx.drawImage(img, 0, 0);

      // Red border around ROI
      ctx.strokeStyle = '#EF4444'; // Bright Red
      ctx.lineWidth = 3;
      ctx.strokeRect(roi.x, roi.y, roi.width, roi.height);

      // Label background ROI
      ctx.fillStyle = '#EF4444';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(
        `ROI 1 (Desktop Right Gutter: ${roi.width}x${roi.height})`,
        roi.x - 20,
        roi.y - 10
      );

      return canvas.toDataURL('image/png');
    },
    { src: dataUrl, roi }
  );

  const base64Data = markedDataUrl.replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync(outputPath, Buffer.from(base64Data, 'base64'));
}

test.describe('Celestial Daylight — UI Integration & Transition Verification', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
  });

  test('TC-CELESTIAL-01: ROI verification and Desktop Sidebar Collapse (Open -> Close) zero black flash', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'light');
    });

    await page.goto('/c/chat-1');
    await page.waitForLoadState('networkidle');
    await waitForCelestialAssets(page);

    // Verify ChatBackground and Celestial Daylight are rendered
    const chatBg = page.locator('[data-testid="chat-background"]');
    const celestialBg = page.locator('[data-testid="celestial-daylight-bg"]');
    await expect(chatBg).toBeVisible();
    await expect(celestialBg).toBeVisible();

    // Verify non-blocking attributes
    await expect(chatBg).toHaveAttribute('aria-hidden', 'true');
    await expect(chatBg).toHaveClass(/pointer-events-none/);

    // Extract actual BoundingBox of <main>
    const mainBox = await page.locator('main').boundingBox();
    expect(mainBox).not.toBeNull();
    if (!mainBox) return;

    // Define ROI 1: Desktop Right Gutter Margin
    // X in [mainBox.x + mainBox.width - 130, mainBox.x + mainBox.width - 30], Y in [mainBox.y + 120, mainBox.y + 400]
    const initialRoi: ROI = {
      x: mainBox.x + mainBox.width - 130,
      y: mainBox.y + 120,
      width: 100,
      height: 280,
    };

    // Save ROI Verification visual screenshot
    const roiVerificationPath = path.join(CELESTIAL_SCREENSHOT_DIR, 'roi-verification.png');
    await saveROIVerification(page, initialRoi, roiVerificationPath);
    expect(fs.existsSync(roiVerificationPath)).toBe(true);

    // Initial baseline frame t = 0
    const initialAnalysis = await analyzeROI(page, initialRoi);
    console.log(
      `[TC-01 Initial t=0ms] BlackoutRatio: ${initialAnalysis.blackoutRatio.toFixed(2)}%, L_mean: ${initialAnalysis.meanLuminance.toFixed(4)}, minL: ${initialAnalysis.minLuminance.toFixed(4)}`
    );
    expect(initialAnalysis.blackoutRatio, 'Initial state must have zero blackout pixels').toBe(0);
    expect(initialAnalysis.meanLuminance, 'Initial state must maintain daylight luminance >= 0.4500').toBeGreaterThanOrEqual(0.45);

    // Find collapse button
    const collapseBtn = page.getByRole('button', { name: 'Thu gọn thanh bên' });
    await expect(collapseBtn).toBeVisible();

    // Trigger sidebar collapse (200ms transition)
    await collapseBtn.click();

    // Discrete timestamp sampling at ~30ms increments during the 200ms transition
    // Intervals: 30, 60, 90, 120, 150, 180, 210, 240, 350ms
    const sampleIntervals = [30, 30, 30, 30, 30, 30, 30, 30, 110];
    let elapsedMs = 0;

    for (let i = 0; i < sampleIntervals.length; i++) {
      const step = sampleIntervals[i];
      await page.waitForTimeout(step);
      elapsedMs += step;

      // Recalculate dynamic ROI based on current main container width
      const curMainBox = await page.locator('main').boundingBox();
      const currentRoi: ROI = curMainBox
        ? {
            x: curMainBox.x + curMainBox.width - 130,
            y: curMainBox.y + 120,
            width: 100,
            height: 280,
          }
        : initialRoi;

      const frameAnalysis = await analyzeROI(page, currentRoi);
      console.log(
        `[TC-01 Collapse frame t=${elapsedMs}ms] BlackoutRatio: ${frameAnalysis.blackoutRatio.toFixed(2)}%, L_mean: ${frameAnalysis.meanLuminance.toFixed(4)}, minL: ${frameAnalysis.minLuminance.toFixed(4)}`
      );

      // Save frame screenshot
      const framePath = path.join(
        CELESTIAL_SCREENSHOT_DIR,
        `collapse-frame-${String(i + 1).padStart(2, '0')}-${elapsedMs}ms.png`
      );
      await page.screenshot({ path: framePath });

      // MANDATORY PASS/FAIL ASSERTIONS
      expect(
        frameAnalysis.blackoutRatio,
        `Collapse Frame at ${elapsedMs}ms must have BlackoutRatio == 0.00%`
      ).toBe(0);
      expect(
        frameAnalysis.meanLuminance,
        `Collapse Frame at ${elapsedMs}ms must maintain L_mean >= 0.4500`
      ).toBeGreaterThanOrEqual(0.45);
    }

    // Wait for transition to settle and capture settled collapsed state
    await page.waitForTimeout(200);
    const finalCollapsedPath = path.join(CELESTIAL_SCREENSHOT_DIR, 'preview-1440x900-collapsed.png');
    await page.screenshot({ path: finalCollapsedPath });
    expect(fs.existsSync(finalCollapsedPath)).toBe(true);

    expect(consoleErrors.filter((e) => !e.includes('favicon'))).toHaveLength(0);
  });

  test('TC-CELESTIAL-02: Desktop Sidebar Expand (Close -> Open) zero black flash', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'light');
    });

    await page.goto('/c/chat-1');
    await page.waitForLoadState('networkidle');
    await waitForCelestialAssets(page);

    // Collapse first
    const collapseBtn = page.getByRole('button', { name: 'Thu gọn thanh bên' });
    await collapseBtn.click();
    await page.waitForTimeout(300);

    // Now find expand button
    const expandBtn = page.getByRole('button', { name: 'Mở rộng thanh bên' });
    await expect(expandBtn).toBeVisible();

    // Trigger expand (240ms transition)
    await expandBtn.click();

    const sampleIntervals = [30, 30, 30, 30, 30, 30, 30, 30, 110];
    let elapsedMs = 0;

    for (let i = 0; i < sampleIntervals.length; i++) {
      const step = sampleIntervals[i];
      await page.waitForTimeout(step);
      elapsedMs += step;

      const curMainBox = await page.locator('main').boundingBox();
      const currentRoi: ROI = curMainBox
        ? {
            x: curMainBox.x + curMainBox.width - 130,
            y: curMainBox.y + 120,
            width: 100,
            height: 280,
          }
        : { x: 1310, y: 120, width: 100, height: 280 };

      const frameAnalysis = await analyzeROI(page, currentRoi);
      console.log(
        `[TC-02 Expand frame t=${elapsedMs}ms] BlackoutRatio: ${frameAnalysis.blackoutRatio.toFixed(2)}%, L_mean: ${frameAnalysis.meanLuminance.toFixed(4)}, minL: ${frameAnalysis.minLuminance.toFixed(4)}`
      );

      const framePath = path.join(
        CELESTIAL_SCREENSHOT_DIR,
        `expand-frame-${String(i + 1).padStart(2, '0')}-${elapsedMs}ms.png`
      );
      await page.screenshot({ path: framePath });

      // MANDATORY PASS/FAIL ASSERTIONS
      expect(
        frameAnalysis.blackoutRatio,
        `Expand Frame at ${elapsedMs}ms must have BlackoutRatio == 0.00%`
      ).toBe(0);
      expect(
        frameAnalysis.meanLuminance,
        `Expand Frame at ${elapsedMs}ms must maintain L_mean >= 0.4500`
      ).toBeGreaterThanOrEqual(0.45);
    }

    await page.waitForTimeout(200);
    const finalExpandedPath = path.join(CELESTIAL_SCREENSHOT_DIR, 'preview-1440x900-expanded.png');
    await page.screenshot({ path: finalExpandedPath });
    expect(fs.existsSync(finalExpandedPath)).toBe(true);
  });

  test('TC-CELESTIAL-03: Theme Switching Cycle (Light -> Dark -> Zyricon -> Light) preservation', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'light');
    });

    await page.goto('/c/chat-1');
    await page.waitForLoadState('networkidle');
    await waitForCelestialAssets(page);

    // Initial Light state: Celestial background present
    await expect(page.locator('[data-testid="celestial-daylight-bg"]')).toBeVisible();
    await expect(page.locator('.chat-stars-layer-1')).not.toBeAttached();

    // 1. Switch to Dark
    const themeBtn = page.locator('#theme-selector-btn');
    await themeBtn.click();
    await page.locator('#theme-option-dark').click();
    await page.waitForTimeout(400);

    // Dark assertions: Celestial unmounted, star layers mounted
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.locator('[data-testid="celestial-daylight-bg"]')).not.toBeAttached();
    await expect(page.locator('.chat-stars-layer-1')).toBeAttached();

    // 2. Switch to Zyricon
    await themeBtn.click();
    await page.locator('#theme-option-zyricon').click();
    await page.waitForTimeout(600);

    // Zyricon assertions: Celestial not attached, stars not attached, Zyricon canvas/fallback attached
    await expect(page.locator('html')).toHaveClass(/zyricon/);
    await expect(page.locator('[data-testid="celestial-daylight-bg"]')).not.toBeAttached();
    await expect(page.locator('.chat-stars-layer-1')).not.toBeAttached();
    const hasZyriconElement =
      (await page.locator('[data-testid="zyricon-cosmic-container"]').count()) > 0 ||
      (await page.locator('[data-testid="cosmic-static-fallback"]').count()) > 0;
    expect(hasZyriconElement).toBe(true);

    // 3. Switch back to Light
    await themeBtn.click();
    await page.locator('#theme-option-light').click();
    await page.waitForTimeout(600);

    // Light restored: Celestial daylight remounted cleanly, zero 3D canvas, zero stars
    await expect(page.locator('[data-testid="celestial-daylight-bg"]')).toBeVisible();
    await expect(page.locator('.chat-stars-layer-1')).not.toBeAttached();
    await expect(page.locator('[data-testid="zyricon-cosmic-container"]')).not.toBeAttached();

    // Zero WebGL leak or unhandled console errors
    const seriousErrors = consoleErrors.filter(
      (e) => !e.includes('favicon') && !e.includes('ServiceWorker')
    );
    expect(seriousErrors).toHaveLength(0);
  });

  test('TC-CELESTIAL-04: Responsive Viewport Matrix and Reduced Motion', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'light');
    });

    // 1. Laptop 1280x800
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/c/chat-1');
    await page.waitForLoadState('networkidle');
    await waitForCelestialAssets(page);
    await page.screenshot({
      path: path.join(CELESTIAL_SCREENSHOT_DIR, 'preview-1280x800-integrated.png'),
    });
    const scrollW1280 = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientW1280 = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollW1280, 'Zero horizontal scroll on 1280px').toBe(clientW1280);

    // 2. Tablet 768x1024
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(CELESTIAL_SCREENSHOT_DIR, 'preview-768x1024-integrated.png'),
    });
    const scrollW768 = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientW768 = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollW768, 'Zero horizontal scroll on 768px').toBe(clientW768);

    // 3. Mobile 390x844 (Closed drawer and open drawer)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(CELESTIAL_SCREENSHOT_DIR, 'preview-390x844-integrated.png'),
    });

    // Open mobile sidebar drawer
    const menuBtn = page.getByRole('button', { name: 'Mở menu danh sách đoạn chat' });
    if (await menuBtn.isVisible()) {
      await menuBtn.click();
      await page.waitForTimeout(350);
      await page.screenshot({
        path: path.join(CELESTIAL_SCREENSHOT_DIR, 'preview-390x844-drawer.png'),
      });
      // Close drawer
      const closeBtn = page.getByRole('button', { name: 'Đóng thanh bên' });
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
        await page.waitForTimeout(300);
      }
    }
    const scrollW390 = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientW390 = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollW390, 'Zero horizontal scroll on 390px').toBe(clientW390);

    // 4. Small Mobile 360x800
    await page.setViewportSize({ width: 360, height: 800 });
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(CELESTIAL_SCREENSHOT_DIR, 'preview-360x800-integrated.png'),
    });
    const scrollW360 = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientW360 = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollW360, 'Zero horizontal scroll on 360px').toBe(clientW360);

    // 5. Reduced Motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(CELESTIAL_SCREENSHOT_DIR, 'preview-reduced-motion-integrated.png'),
    });

    // Verify reduced motion animation disabled
    const animationInfo = await page.evaluate(() => {
      const strip = document.querySelector('.celestial-cloud-strip');
      const corona = document.querySelector('.celestial-sun-corona');
      return {
        stripAnimationName: strip ? window.getComputedStyle(strip).animationName : null,
        coronaAnimationName: corona ? window.getComputedStyle(corona).animationName : null,
      };
    });
    console.log(
      `[Reduced Motion] Cloud strip animationName: ${animationInfo.stripAnimationName}, Sun corona animationName: ${animationInfo.coronaAnimationName}`
    );
    expect(animationInfo.stripAnimationName).toBe('none');
    expect(animationInfo.coronaAnimationName).toBe('none');
  });
});

