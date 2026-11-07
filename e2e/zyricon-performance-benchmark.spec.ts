import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'screenshots/zyricon-phase3');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

interface BenchmarkSample {
  second: number;
  tier: string;
  fps: number;
  frameTimeMs: number;
  stars: number;
}

async function collectSamples(page: any, durationSeconds: number): Promise<BenchmarkSample[]> {
  const samples: BenchmarkSample[] = [];
  for (let s = 1; s <= durationSeconds; s++) {
    await page.waitForTimeout(1000);
    const hudText = await page.locator('div[data-testid="cosmic-diagnostics-hud"]').innerText();
    const tierMatch = hudText.match(/Active Tier:\s*(\w+)/i);
    const fpsMatch = hudText.match(/FPS:\s*(\d+)/i);
    const frameTimeMatch = hudText.match(/Frame Time:\s*([\d.]+)\s*ms/i);
    const starsMatch = hudText.match(/Stars in Scene:\s*(\d+)/i);

    samples.push({
      second: s,
      tier: tierMatch?.[1] ?? 'unknown',
      fps: parseInt(fpsMatch?.[1] ?? '0', 10),
      frameTimeMs: parseFloat(frameTimeMatch?.[1] ?? '0'),
      stars: parseInt(starsMatch?.[1] ?? '0', 10),
    });
  }
  return samples;
}

function calculateStats(samples: BenchmarkSample[]) {
  // Use last 15 seconds for stable metrics (drop warm-up frames)
  const stable = samples.slice(Math.max(0, samples.length - 15));
  const avgFps = Math.round(stable.reduce((sum, s) => sum + s.fps, 0) / stable.length);
  const minFps = Math.min(...stable.map((s) => s.fps));
  const maxFps = Math.max(...stable.map((s) => s.fps));
  const avgFrameTime = (stable.reduce((sum, s) => sum + s.frameTimeMs, 0) / stable.length).toFixed(1);
  return { avgFps, minFps, maxFps, avgFrameTime, finalTier: stable[stable.length - 1]?.tier };
}

test.describe('Zyricon 3D Performance Benchmark (15-20s Stable Run)', () => {
  test('Benchmark: High Tier on Desktop (20s stable)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/preview.html');

    // Switch to High Tier
    await page.getByRole('button', { name: 'High' }).click();
    await page.waitForTimeout(1000);

    const samples = await collectSamples(page, 20);
    const stats = calculateStats(samples);
    console.log('=== BENCHMARK HIGH TIER RESULT ===');
    console.log(JSON.stringify(stats, null, 2));
  });

  test('Benchmark: Medium Tier on Desktop (20s stable)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/preview.html');

    // Switch to Medium Tier
    await page.getByRole('button', { name: 'Medium' }).click();
    await page.waitForTimeout(1000);

    const samples = await collectSamples(page, 20);
    const stats = calculateStats(samples);
    console.log('=== BENCHMARK MEDIUM TIER RESULT ===');
    console.log(JSON.stringify(stats, null, 2));
  });

  test('Benchmark: Low Tier on Desktop (20s stable)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/preview.html');

    // Switch to Low Tier
    await page.getByRole('button', { name: 'Low' }).click();
    await page.waitForTimeout(1000);

    const samples = await collectSamples(page, 20);
    const stats = calculateStats(samples);
    console.log('=== BENCHMARK LOW TIER RESULT ===');
    console.log(JSON.stringify(stats, null, 2));
  });

  test('Benchmark: Mobile Portrait Viewport 390x844 (Optimized Layout Verification)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/preview.html');

    await page.waitForTimeout(2500);

    // Capture screenshot of optimized mobile layout to prove zero clipping
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '04-mobile-optimized-390x844.png'),
    });

    const samples = await collectSamples(page, 15);
    const stats = calculateStats(samples);
    console.log('=== BENCHMARK MOBILE PORTRAIT RESULT ===');
    console.log(JSON.stringify(stats, null, 2));
  });
});

