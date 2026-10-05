import { describe, it, expect, vi } from 'vitest'
import express, { Request, Response } from 'express'
import request from 'supertest'
import { loggerMiddleware } from '../../src/middlewares/logger.middleware.js'

describe('Logger Middleware', () => {
  it('should log METHOD URL STATUS durationMs on response finish', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const app = express()
    app.use(loggerMiddleware)
    app.get('/api/test-log', (_req: Request, res: Response) => {
      res.status(200).json({ ok: true })
    })

    const res = await request(app)
      .get('/api/test-log')
      .set('Authorization', 'Bearer secret-token-123')
      .set('Cookie', 'token=secret-cookie-456')

    expect(res.status).toBe(200)

    expect(consoleSpy).toHaveBeenCalled()
    const logCall = consoleSpy.mock.calls.find((call) =>
      typeof call[0] === 'string' && call[0].includes('/api/test-log')
    )

    expect(logCall).toBeDefined()
    const logMessage = logCall![0] as string

    // Match format: METHOD URL STATUS durationMs (e.g. "GET /api/test-log 200 5ms")
    expect(logMessage).toMatch(/^GET \/api\/test-log 200 \d+ms$/)

    // Security check: must not log sensitive headers/tokens
    expect(logMessage).not.toContain('secret-token-123')
    expect(logMessage).not.toContain('secret-cookie-456')
    expect(logMessage).not.toContain('Authorization')
    expect(logMessage).not.toContain('Bearer')

    consoleSpy.mockRestore()
  })

  it('should log non-200 status code accurately', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const app = express()
    app.use(loggerMiddleware)
    app.get('/api/not-found', (_req: Request, res: Response) => {
      res.status(404).json({ error: 'not found' })
    })

    const res = await request(app).get('/api/not-found')
    expect(res.status).toBe(404)

    const logCall = consoleSpy.mock.calls.find((call) =>
      typeof call[0] === 'string' && call[0].includes('/api/not-found')
    )
    expect(logCall).toBeDefined()
    expect(logCall![0]).toMatch(/^GET \/api\/not-found 404 \d+ms$/)

    consoleSpy.mockRestore()
  })
})
