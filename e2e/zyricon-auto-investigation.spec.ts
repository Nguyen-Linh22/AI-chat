import { test } from '@playwright/test';

test('Monitor Auto mode adaptation over 15 seconds', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/preview.html');

  console.log('--- STARTING 15-SECOND MONITORING ---');
  for (let s = 1; s <= 15; s++) {
    await page.waitForTimeout(1000);
    const hudText = await page.locator('div[data-testid="cosmic-diagnostics-hud"]').innerText();
    const tierMatch = hudText.match(/Active Tier:\s*(\w+)/i);
    const fpsMatch = hudText.match(/FPS:\s*(\d+)/i);
    const frameTimeMatch = hudText.match(/Frame Time:\s*([\d.]+)\s*ms/i);
    const starsMatch = hudText.match(/Stars in Scene:\s*(\d+)/i);

    console.log(`[T=${s}s] Tier: ${tierMatch?.[1]} | FPS: ${fpsMatch?.[1]} | FrameTime: ${frameTimeMatch?.[1]}ms | Stars: ${starsMatch?.[1]}`);
  }
  console.log('--- COMPLETED MONITORING ---');
});

