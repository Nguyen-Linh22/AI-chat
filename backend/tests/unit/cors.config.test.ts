import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import express from 'express'
import cors from 'cors'
import request from 'supertest'
import {
  getAllowedOrigins,
  LOCAL_DEV_ORIGINS
} from '../../src/config/cors.config.js'

describe('CORS Configuration & Middleware Verification', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('getAllowedOrigins() Unit Logic', () => {
    it('should allow default Vite dev origins in development when FRONTEND_URL is not set', () => {
      process.env.NODE_ENV = 'development'
      delete process.env.FRONTEND_URL

      const allowed = getAllowedOrigins()
      expect(allowed).toContain('http://localhost:5173')
      expect(allowed).toContain('http://localhost:5174')
      expect(allowed).toContain('http://localhost:5175')
      expect(allowed).toContain('http://localhost:5176')
      expect(allowed).toContain('http://127.0.0.1:5173')
      expect(allowed).toContain('http://127.0.0.1:5174')
      expect(allowed).not.toContain('http://localhost.evil.example:5174')
      expect(allowed).not.toContain('http://attacker.com')
    })

    it('should include both FRONTEND_URL and local dev origins in development if FRONTEND_URL is set', () => {
      process.env.NODE_ENV = 'development'
      process.env.FRONTEND_URL = 'http://custom-dev-host:3000/'

      const allowed = getAllowedOrigins()
      expect(allowed).toContain('http://custom-dev-host:3000')
      expect(allowed).toContain('http://localhost:5173')
      expect(allowed).toContain('http://localhost:5174')
    })

    it('should strictly isolate production to only configured FRONTEND_URL', () => {
      process.env.NODE_ENV = 'production'
      process.env.FRONTEND_URL = 'https://ai-chat-linhh.vercel.app/'

      const allowed = getAllowedOrigins()
      expect(allowed).toEqual(['https://ai-chat-linhh.vercel.app'])
      expect(allowed).not.toContain('http://localhost:5173')
      expect(allowed).not.toContain('http://localhost:5174')
      expect(allowed).not.toContain('http://127.0.0.1:5173')
    })

    it('should return empty list in production if FRONTEND_URL is not set', () => {
      process.env.NODE_ENV = 'production'
      delete process.env.FRONTEND_URL

      const allowed = getAllowedOrigins()
      expect(allowed).toEqual([])
    })
  })

  describe('CORS Middleware Integration (Preflight & Headers)', () => {
    const createCorsApp = () => {
      const app = express()
      app.use(
        cors({
          origin: (origin, callback) => {
            const allowed = getAllowedOrigins()
            if (!origin || allowed.includes(origin)) {
              return callback(null, true)
            }
            return callback(null, false)
          },
          credentials: true,
          methods: ['GET', 'POST', 'PATCH', 'DELETE'],
          allowedHeaders: ['Content-Type'],
          maxAge: 86400
        })
      )

      app.post('/api/auth/login', (_req, res) => {
        res.json({ message: 'login success' })
      })

      return app
    }

    it('should allow OPTIONS preflight from http://localhost:5173 in development', async () => {
      process.env.NODE_ENV = 'development'
      delete process.env.FRONTEND_URL
      const app = createCorsApp()

      const res = await request(app)
        .options('/api/auth/login')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type')

      expect(res.status).toBe(204)
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173')
      expect(res.headers['access-control-allow-credentials']).toBe('true')
    })

    it('should allow OPTIONS preflight from http://localhost:5174 in development', async () => {
      process.env.NODE_ENV = 'development'
      delete process.env.FRONTEND_URL
      const app = createCorsApp()

      const res = await request(app)
        .options('/api/auth/login')
        .set('Origin', 'http://localhost:5174')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type')

      expect(res.status).toBe(204)
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5174')
      expect(res.headers['access-control-allow-credentials']).toBe('true')
    })

    it('should allow OPTIONS preflight from http://127.0.0.1:5173 and http://127.0.0.1:5174 in development', async () => {
      process.env.NODE_ENV = 'development'
      delete process.env.FRONTEND_URL
      const app = createCorsApp()

      const res127 = await request(app)
        .options('/api/auth/login')
        .set('Origin', 'http://127.0.0.1:5174')
        .set('Access-Control-Request-Method', 'POST')

      expect(res127.status).toBe(204)
      expect(res127.headers['access-control-allow-origin']).toBe('http://127.0.0.1:5174')
      expect(res127.headers['access-control-allow-credentials']).toBe('true')
    })

    it('should reject unauthorized malicious origin like http://localhost.evil.example:5174', async () => {
      process.env.NODE_ENV = 'development'
      delete process.env.FRONTEND_URL
      const app = createCorsApp()

      const res = await request(app)
        .options('/api/auth/login')
        .set('Origin', 'http://localhost.evil.example:5174')
        .set('Access-Control-Request-Method', 'POST')

      expect(res.headers['access-control-allow-origin']).toBeUndefined()
    })

    it('should reject localhost origins when NODE_ENV is production', async () => {
      process.env.NODE_ENV = 'production'
      process.env.FRONTEND_URL = 'https://ai-chat-linhh.vercel.app'
      const app = createCorsApp()

      const res = await request(app)
        .options('/api/auth/login')
        .set('Origin', 'http://localhost:5174')
        .set('Access-Control-Request-Method', 'POST')

      expect(res.headers['access-control-allow-origin']).toBeUndefined()

      const prodRes = await request(app)
        .options('/api/auth/login')
        .set('Origin', 'https://ai-chat-linhh.vercel.app')
        .set('Access-Control-Request-Method', 'POST')

      expect(prodRes.status).toBe(204)
      expect(prodRes.headers['access-control-allow-origin']).toBe('https://ai-chat-linhh.vercel.app')
      expect(prodRes.headers['access-control-allow-credentials']).toBe('true')
    })
  })
})
