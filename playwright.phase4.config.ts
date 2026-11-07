import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: /zyricon-.*\.spec\.ts/,
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'off',
    screenshot: 'off',
    video: 'off',
    launchOptions: {
      args: [
        '--enable-gpu',
        '--use-gl=angle',
        '--use-angle=d3d11',
        '--enable-gpu-rasterization',
        '--enable-zero-copy',
        '--ignore-gpu-blocklist',
      ],
    },
    ...devices['Desktop Chrome'],
  },
  projects: [
    {
      name: 'chromium-phase4',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
  webServer: {
    command: 'npm run dev --prefix frontend',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});

