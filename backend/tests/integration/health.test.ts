import { describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import app from '../../src/app.js'
import { prisma } from '../../src/lib/prisma.js'

describe('GET /api/health', () => {
  it('should return 200 and healthy status when database is reachable', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200)

    expect(response.body).toMatchObject({
      status: 'ok',
      message: 'Backend is healthy'
    })
  })

  it('should return JSON response', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect('Content-Type', /json/)
      .expect(200)

    expect(response.body).toBeDefined()
  })

  it('should return 503 when database connectivity fails without leaking DB info', async () => {
    const querySpy = vi
      .spyOn(prisma, '$queryRaw')
      .mockRejectedValueOnce(new Error('Connection to database timed out'))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await request(app)
      .get('/api/health')
      .expect(503)

    expect(response.body).toEqual({
      status: 'error',
      message: 'Database connection failed'
    })
    expect(response.body.stack).toBeUndefined()
    expect(response.text).not.toContain('Connection to database timed out')

    querySpy.mockRestore()
    errorSpy.mockRestore()
  })
})
