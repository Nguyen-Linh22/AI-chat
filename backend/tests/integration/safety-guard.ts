import { beforeAll, expect } from 'vitest'

export function validateIntegrationDbUrl(dbUrl?: string): void {
  if (!dbUrl) {
    throw new Error('FAIL-SAFE ABORT: DATABASE_URL is not defined in environment.')
  }

  try {
    const parsed = new URL(dbUrl)
    const protocolValid = parsed.protocol === 'postgresql:' || parsed.protocol === 'postgres:'
    const hostname = parsed.hostname.toLowerCase()
    const pathname = parsed.pathname

    const isTestCluster =
      hostname.startsWith('ep-tiny-salad') &&
      hostname.endsWith('.neon.tech') &&
      !hostname.includes('ep-patient-silence') &&
      !hostname.includes('ep-purple-cloud') &&
      !hostname.includes('ep-gentle-dust')

    const isTestDb = pathname === '/neondb'

    if (!protocolValid || !isTestCluster || !isTestDb) {
      throw new Error(
        'FAIL-SAFE ABORT: Integration tests must target the dedicated test cluster (ep-tiny-salad) and database (/neondb). Hostname or database detected is not allowed. Terminating immediately to protect database.'
      )
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('FAIL-SAFE ABORT')) {
      throw err
    }
    throw new Error('FAIL-SAFE ABORT: Invalid DATABASE_URL format.')
  }
}

try {
  beforeAll(() => {
    const testPath = (expect.getState().testPath || '').replace(/\\/g, '/')
    if (!testPath.includes('tests/integration')) {
      return // Unit/smoke tests do not touch DB; skip guard
    }

    validateIntegrationDbUrl(process.env.DATABASE_URL)
  })
} catch {
  // Standalone imports outside of Vitest runner do not register lifecycle hook
}
