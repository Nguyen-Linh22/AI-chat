import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'screenshots/zyricon-phase3');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

test.describe('Zyricon Phase 3 — 3D Engine Preview Verification', () => {
  test('1. Loads preview bench, renders WebGL cosmic scene and HUD on Desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/preview.html');

    // Verify canvas and preview root exist
    const canvas = page.locator('canvas[data-testid="zyricon-cosmic-canvas"]');
    await expect(canvas).toBeVisible({ timeout: 15_000 });

    const hud = page.locator('div[data-testid="cosmic-diagnostics-hud"]');
    await expect(hud).toBeVisible();

    // Allow textures and shader warmup
    await page.waitForTimeout(2500);

    // Capture desktop panoramic screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '01-preview-desktop-panoramic.png'),
    });
  });

  test('2. Toggles quality tiers and reduced-motion mode', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/preview.html');

    const canvas = page.locator('canvas[data-testid="zyricon-cosmic-canvas"]');
    await expect(canvas).toBeVisible();

    // Click "Low" tier button
    const lowTierBtn = page.getByRole('button', { name: 'Low' });
    await lowTierBtn.click();
    await page.waitForTimeout(1000);

    // Verify HUD reflects LOW tier
    await expect(page.locator('div[data-testid="cosmic-diagnostics-hud"]')).toContainText(/low/i);

    // Click "Reduced Motion" button
    const reducedMotionBtn = page.getByRole('button', { name: /Reduced Motion/i });
    await reducedMotionBtn.click();
    await page.waitForTimeout(1000);

    // Capture screenshot in Low Tier + Reduced Motion
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '02-preview-low-tier-reduced-motion.png'),
    });
  });

  test('3. Responsive mobile viewport rendering', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 14
    await page.goto('/preview.html');

    const canvas = page.locator('canvas[data-testid="zyricon-cosmic-canvas"]');
    await expect(canvas).toBeVisible();

    await page.waitForTimeout(2000);

    // Capture mobile viewport screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '03-preview-mobile-viewport.png'),
    });
  });
});
