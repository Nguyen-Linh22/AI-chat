import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import express from 'express'
import request from 'supertest'
import cookieParser from 'cookie-parser'
import {
  getAuthCookieOptions,
  getAuthClearCookieOptions
} from '../../src/config/cookie.config.js'

describe('16.6-C Production Cross-Site Cookie Configuration', () => {
  const originalEnv = process.env.NODE_ENV

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
  })

  describe('Cookie Options Unit Validation', () => {
    it('A & D. Production login cookie options: HttpOnly=true, Secure=true, SameSite=none, Path=/, Max-Age=604800000, no Domain', () => {
      process.env.NODE_ENV = 'production'
      const options = getAuthCookieOptions()

      expect(options.httpOnly).toBe(true)
      expect(options.secure).toBe(true)
      expect(options.sameSite).toBe('none')
      expect(options.path).toBe('/')
      expect(options.maxAge).toBe(7 * 24 * 60 * 60 * 1000) // 604800000 ms
      expect(options.domain).toBeUndefined()
    })

    it('B & D. Development/test login cookie options: HttpOnly=true, Secure=false, SameSite=lax, Path=/, no Domain', () => {
      process.env.NODE_ENV = 'development'
      const options = getAuthCookieOptions()

      expect(options.httpOnly).toBe(true)
      expect(options.secure).toBe(false)
      expect(options.sameSite).toBe('lax')
      expect(options.path).toBe('/')
      expect(options.maxAge).toBe(7 * 24 * 60 * 60 * 1000)
      expect(options.domain).toBeUndefined()
    })

    it('C & D. Production clearCookie options: HttpOnly=true, Secure=true, SameSite=none, Path=/, no Domain', () => {
      process.env.NODE_ENV = 'production'
      const options = getAuthClearCookieOptions()

      expect(options.httpOnly).toBe(true)
      expect(options.secure).toBe(true)
      expect(options.sameSite).toBe('none')
      expect(options.path).toBe('/')
      expect(options.domain).toBeUndefined()
    })

    it('Development/test clearCookie options: HttpOnly=true, Secure=false, SameSite=lax, Path=/, no Domain', () => {
      process.env.NODE_ENV = 'test'
      const options = getAuthClearCookieOptions()

      expect(options.httpOnly).toBe(true)
      expect(options.secure).toBe(false)
      expect(options.sameSite).toBe('lax')
      expect(options.path).toBe('/')
      expect(options.domain).toBeUndefined()
    })
  })

  describe('HTTP Set-Cookie Header Serialization', () => {
    const buildTestApp = () => {
      const app = express()
      app.use(cookieParser())

      app.post('/test/login', (_req, res) => {
        res.cookie('token', 'mock-access-token', getAuthCookieOptions())
        return res.status(200).json({ ok: true })
      })

      app.post('/test/logout', (_req, res) => {
        res.clearCookie('token', getAuthClearCookieOptions())
        return res.status(200).json({ ok: true })
      })

      return app
    }

    it('A & D. Serializes production login Set-Cookie with HttpOnly, Secure, SameSite=None, Path=/, Max-Age=604800, and without Domain', async () => {
      process.env.NODE_ENV = 'production'
      const app = buildTestApp()

      const res = await request(app).post('/test/login')
      expect(res.status).toBe(200)

      const cookies = res.headers['set-cookie'] as unknown as string[]
      expect(cookies).toBeDefined()
      const tokenCookie = cookies.find((c: string) => c.startsWith('token='))
      expect(tokenCookie).toBeDefined()

      expect(tokenCookie).toContain('HttpOnly')
      expect(tokenCookie).toContain('Secure')
      expect(tokenCookie).toMatch(/SameSite=None/i)
      expect(tokenCookie).toContain('Path=/')
      expect(tokenCookie).toContain('Max-Age=604800')
      expect(tokenCookie).not.toContain('Domain=')
    })

    it('B & D. Serializes development login Set-Cookie with HttpOnly, SameSite=Lax, Path=/, Max-Age=604800, no Secure, and without Domain', async () => {
      process.env.NODE_ENV = 'development'
      const app = buildTestApp()

      const res = await request(app).post('/test/login')
      expect(res.status).toBe(200)

      const cookies = res.headers['set-cookie'] as unknown as string[]
      expect(cookies).toBeDefined()
      const tokenCookie = cookies.find((c: string) => c.startsWith('token='))
      expect(tokenCookie).toBeDefined()

      expect(tokenCookie).toContain('HttpOnly')
      expect(tokenCookie).toMatch(/SameSite=Lax/i)
      expect(tokenCookie).toContain('Path=/')
      expect(tokenCookie).toContain('Max-Age=604800')
      expect(tokenCookie).not.toContain('Secure')
      expect(tokenCookie).not.toContain('Domain=')
    })

    it('C & D. Serializes production clearCookie with HttpOnly, Secure, SameSite=None, Path=/, and without Domain', async () => {
      process.env.NODE_ENV = 'production'
      const app = buildTestApp()

      const res = await request(app).post('/test/logout')
      expect(res.status).toBe(200)

      const cookies = res.headers['set-cookie'] as unknown as string[]
      expect(cookies).toBeDefined()
      const tokenCookie = cookies.find((c: string) => c.startsWith('token='))
      expect(tokenCookie).toBeDefined()

      expect(tokenCookie).toContain('HttpOnly')
      expect(tokenCookie).toContain('Secure')
      expect(tokenCookie).toMatch(/SameSite=None/i)
      expect(tokenCookie).toContain('Path=/')
      expect(tokenCookie).not.toContain('Domain=')
    })

    it('Serializes development/test clearCookie with HttpOnly, SameSite=Lax, Path=/, no Secure, and without Domain', async () => {
      process.env.NODE_ENV = 'test'
      const app = buildTestApp()

      const res = await request(app).post('/test/logout')
      expect(res.status).toBe(200)

      const cookies = res.headers['set-cookie'] as unknown as string[]
      expect(cookies).toBeDefined()
      const tokenCookie = cookies.find((c: string) => c.startsWith('token='))
      expect(tokenCookie).toBeDefined()

      expect(tokenCookie).toContain('HttpOnly')
      expect(tokenCookie).toMatch(/SameSite=Lax/i)
      expect(tokenCookie).toContain('Path=/')
      expect(tokenCookie).not.toContain('Secure')
      expect(tokenCookie).not.toContain('Domain=')
    })
  })
})
