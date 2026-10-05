import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import express, { Request, Response } from 'express'
import request from 'supertest'
import { csrfProtectionMiddleware } from '../../src/middlewares/csrf.middleware.js'

describe('CSRF Protection Middleware (Origin Validation)', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  const createTestApp = () => {
    const app = express()
    app.use(express.json())
    app.use('/api', csrfProtectionMiddleware)

    // Sample endpoints for testing all HTTP methods
    app.get('/api/test', (_req: Request, res: Response) => {
      res.json({ message: 'GET success' })
    })

    app.options('/api/test', (_req: Request, res: Response) => {
      res.sendStatus(204)
    })

    app.post('/api/test', (_req: Request, res: Response) => {
      res.json({ message: 'POST success' })
    })

    app.patch('/api/test', (_req: Request, res: Response) => {
      res.json({ message: 'PATCH success' })
    })

    app.delete('/api/test', (_req: Request, res: Response) => {
      res.json({ message: 'DELETE success' })
    })

    return app
  }

  describe('Safe HTTP Methods (A & B)', () => {
    it('A. should allow GET requests without origin check', async () => {
      process.env.NODE_ENV = 'production'
      process.env.FRONTEND_URL = 'https://ai-chat-linhh.vercel.app'
      const app = createTestApp()

      const res = await request(app).get('/api/test')
      expect(res.status).toBe(200)
      expect(res.body.message).toBe('GET success')
    })

    it('B. should allow OPTIONS requests without origin check', async () => {
      process.env.NODE_ENV = 'production'
      process.env.FRONTEND_URL = 'https://ai-chat-linhh.vercel.app'
      const app = createTestApp()

      const res = await request(app)
        .options('/api/test')
        .set('Origin', 'https://malicious-website.com')

      expect(res.status).toBe(204)
    })
  })

  describe('Production Environment with Allowed Origin (C, D, E)', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production'
      process.env.FRONTEND_URL = 'https://ai-chat-linhh.vercel.app'
    })

    it('C. should allow POST request with allowed Origin', async () => {
      const app = createTestApp()
      const res = await request(app)
        .post('/api/test')
        .set('Origin', 'https://ai-chat-linhh.vercel.app')
        .send({ data: 'test' })

      expect(res.status).toBe(200)
      expect(res.body.message).toBe('POST success')
    })

    it('D. should allow PATCH request with allowed Origin', async () => {
      const app = createTestApp()
      const res = await request(app)
        .patch('/api/test')
        .set('Origin', 'https://ai-chat-linhh.vercel.app')
        .send({ data: 'test' })

      expect(res.status).toBe(200)
      expect(res.body.message).toBe('PATCH success')
    })

    it('E. should allow DELETE request with allowed Origin', async () => {
      const app = createTestApp()
      const res = await request(app)
        .delete('/api/test')
        .set('Origin', 'https://ai-chat-linhh.vercel.app')

      expect(res.status).toBe(200)
      expect(res.body.message).toBe('DELETE success')
    })

    it('should allow POST request with allowed Referer when Origin is omitted', async () => {
      const app = createTestApp()
      const res = await request(app)
        .post('/api/test')
        .set('Referer', 'https://ai-chat-linhh.vercel.app/chat')
        .send({ data: 'test' })

      expect(res.status).toBe(200)
      expect(res.body.message).toBe('POST success')
    })
  })

  describe('Production Environment with Malicious Origin (F, G, H)', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production'
      process.env.FRONTEND_URL = 'https://ai-chat-linhh.vercel.app'
    })

    it('F. should block POST request with malicious Origin with 403 and log warning', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const app = createTestApp()
      const res = await request(app)
        .post('/api/test')
        .set('Origin', 'https://evil-attacker.com')
        .set('Cookie', 'token=secret-token')
        .send({ data: 'exploit' })

      expect(res.status).toBe(403)
      expect(res.body.message).toContain('CSRF protection')

      expect(warnSpy).toHaveBeenCalled()
      const warnCall = warnSpy.mock.calls.find((call) =>
        typeof call[0] === 'string' && call[0].includes('CSRF blocked')
      )
      expect(warnCall).toBeDefined()
      expect(warnCall![0]).toContain('method=POST')
      expect(warnCall![0]).toContain('path=/api/test')
      expect(warnCall![0]).toContain('origin=https://evil-attacker.com')
      // Security: no token or body leaked
      expect(warnCall![0]).not.toContain('secret-token')
      expect(warnCall![0]).not.toContain('exploit')

      warnSpy.mockRestore()
    })

    it('G. should block PATCH request with malicious Origin with 403', async () => {
      const app = createTestApp()
      const res = await request(app)
        .patch('/api/test')
        .set('Origin', 'https://evil-attacker.com')
        .send({ data: 'exploit' })

      expect(res.status).toBe(403)
      expect(res.body.message).toContain('CSRF protection')
    })

    it('H. should block DELETE request with malicious Origin with 403', async () => {
      const app = createTestApp()
      const res = await request(app)
        .delete('/api/test')
        .set('Origin', 'https://evil-attacker.com')

      expect(res.status).toBe(403)
      expect(res.body.message).toContain('CSRF protection')
    })
  })

  describe('Missing Origin Behavior in Production vs Development (I & J)', () => {
    it('I. should reject state-changing request in production when Origin and Referer are missing and log warning', async () => {
      process.env.NODE_ENV = 'production'
      process.env.FRONTEND_URL = 'https://ai-chat-linhh.vercel.app'
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const app = createTestApp()

      const res = await request(app)
        .post('/api/test')
        .send({ data: 'no-origin' })

      expect(res.status).toBe(403)
      expect(res.body.message).toContain('thiếu header nguồn gốc')

      expect(warnSpy).toHaveBeenCalled()
      const warnCall = warnSpy.mock.calls.find((call) =>
        typeof call[0] === 'string' && call[0].includes('CSRF blocked')
      )
      expect(warnCall).toBeDefined()
      expect(warnCall![0]).toContain('method=POST')
      expect(warnCall![0]).toContain('path=/api/test')
      expect(warnCall![0]).toContain('origin=none')

      warnSpy.mockRestore()
    })

    it('J. should allow state-changing request in development/test without Origin header', async () => {
      process.env.NODE_ENV = 'test'
      const app = createTestApp()

      const res = await request(app)
        .post('/api/test')
        .send({ data: 'test-runner' })

      expect(res.status).toBe(200)
      expect(res.body.message).toBe('POST success')
    })

    it('should still enforce origin check in development if an explicit Origin is provided', async () => {
      process.env.NODE_ENV = 'development'
      delete process.env.FRONTEND_URL // defaults to http://localhost:5173
      const app = createTestApp()

      const allowedRes = await request(app)
        .post('/api/test')
        .set('Origin', 'http://localhost:5173')

      expect(allowedRes.status).toBe(200)

      const blockedRes = await request(app)
        .post('/api/test')
        .set('Origin', 'http://attacker-local.com')

      expect(blockedRes.status).toBe(403)
    })
  })
})
