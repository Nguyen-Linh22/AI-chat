import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, devices } from '@playwright/test'

function getE2EDatabaseUrl(): string | undefined {
  const envPath = path.resolve(process.cwd(), 'backend/.env.e2e')
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8')
    const match = content.match(/^DATABASE_URL\s*=\s*(.+)$/m)
    if (match) {
      return match[1].trim().replace(/^["']|["']$/g, '')
    }
  }
  return undefined
}

const e2eDatabaseUrl = getE2EDatabaseUrl()

export default defineConfig({
  testDir: './e2e',

  fullyParallel: false,

  retries: 0,

  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      testMatch: /.*(?:smoke|auth)\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'chromium-authenticated',
      testMatch: /.*chat\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  webServer: [
    {
      command: 'npm run dev --prefix backend',
      url: 'http://localhost:3000/api/health',
      reuseExistingServer: true,
      timeout: 120_000,
      env: {
        ...(e2eDatabaseUrl ? { DATABASE_URL: e2eDatabaseUrl } : {}),
      },
    },
    {
      command: 'npm run dev --prefix frontend',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
})
