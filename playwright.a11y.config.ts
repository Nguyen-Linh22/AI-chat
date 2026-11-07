import { defineConfig, devices } from '@playwright/test'

/**
 * Isolated Playwright configuration for Final Accessibility Verification (M7.2.3)
 *
 * Strict guarantees:
 * - NO backend server spawned.
 * - NO database connection (Neon or local).
 * - NO external AI provider or Cloudinary access.
 * - Reuses existing frontend dev server on port 5173.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: /m7-accessibility-verification\.spec\.ts/,
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'off',
    screenshot: 'off',
    video: 'off',
    ...devices['Desktop Chrome'],
  },
  projects: [
    {
      name: 'chromium-a11y',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
  webServer: {
    command: 'npm run dev --prefix frontend',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})

