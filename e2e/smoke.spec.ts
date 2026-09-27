import { test, expect } from '@playwright/test'

test('frontend loads successfully', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle('frontend')
})
