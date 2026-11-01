import { defineConfig, devices } from '@playwright/test'

/**
 * Isolated Playwright configuration for Composer & Attachment Visual Testing (M6.4)
 *
 * Strict guarantees:
 * - NO backend server spawned.
 * - NO database connection (Neon or local).
 * - NO authentication setup project or storageState.
 * - NO external AI provider or Cloudinary access.
 * - ONLY runs frontend Vite dev server if not already running.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: /composer-visual\.spec\.ts/,
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
      name: 'chromium-visual',
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

