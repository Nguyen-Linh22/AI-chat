import { describe, expect, it } from 'vitest'
import { prisma } from '../../src/lib/prisma.js'

describe('Dedicated Integration Test Database Target', () => {
  it('should verify that Prisma connects to ep-tiny-salad test database', async () => {
    const dbUrl = process.env.DATABASE_URL
    expect(dbUrl).toBeDefined()

    const parsed = new URL(dbUrl!)
    expect(parsed.hostname).toMatch(/^ep-tiny-salad/)
    expect(parsed.hostname).not.toContain('ep-patient-silence')
    expect(parsed.hostname).not.toContain('ep-purple-cloud')
    expect(parsed.hostname).not.toContain('ep-gentle-dust')
    expect(parsed.pathname).toBe('/neondb')

    const dbQuery = await prisma.$queryRaw<Array<{ current_database: string }>>`SELECT current_database()`
    expect(dbQuery).toHaveLength(1)
    expect(dbQuery[0].current_database).toBe('neondb')

    const migrationCount = await prisma.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*) FROM "_prisma_migrations"`
    expect(Number(migrationCount[0].count)).toBeGreaterThanOrEqual(8)
  })
})
