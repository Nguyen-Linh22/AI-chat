import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import app from '../../src/app.js'
import { prisma } from '../../src/lib/prisma.js'
import { authRateLimiter } from '../../src/middlewares/rate-limit.middleware.js'

const createTestEmail = () =>
  `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`

describe('Authentication API', () => {
  beforeEach(async () => {
    // Đảm bảo mỗi test có trạng thái metrics/DB độc lập nếu cần.
  })

  afterEach(async () => {
    await authRateLimiter.resetKey('::ffff:127.0.0.1')
    await authRateLimiter.resetKey('127.0.0.1')
  })

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const email = createTestEmail()

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: 'TestPassword123',
        })
        .expect(201)

      expect(response.body).toHaveProperty('user')
      expect(response.body.user).toHaveProperty('id')
      expect(response.body.user.email).toBe(email)

      expect(response.body.user).not.toHaveProperty('password')
      expect(response.body.user).not.toHaveProperty('passwordHash')
    })

    it('should reject duplicate email', async () => {
      const email = createTestEmail()

      await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: 'TestPassword123',
        })
        .expect(201)

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: 'TestPassword123',
        })
        .expect(409)

      expect(response.body).toHaveProperty('message')
    })

    it('should reject invalid registration data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          password: '123',
        })
        .expect(400)

      expect(response.body).toHaveProperty('message')
    })
  })

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const email = createTestEmail()
      const password = 'TestPassword123'

      await request(app)
        .post('/api/auth/register')
        .send({ email, password })
        .expect(201)

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email, password })
        .expect(200)

      expect(response.body).toHaveProperty('user')
      expect(response.body.user.email).toBe(email)

      expect(response.body).not.toHaveProperty('accessToken')
      expect(response.body.user).not.toHaveProperty('passwordHash')

      const cookies = response.headers['set-cookie']
      expect(cookies).toBeDefined()
      expect(cookies.join(';')).toContain('token=')
      expect(cookies.join(';')).toContain('HttpOnly')
    })

    it('should reject invalid credentials', async () => {
      const email = createTestEmail()

      await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: 'TestPassword123',
        })
        .expect(201)

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email,
          password: 'WrongPassword123',
        })
        .expect(401)

      expect(response.body).toHaveProperty('message')
    })
  })

  describe('GET /api/auth/me', () => {
    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401)

      expect(response.body).toHaveProperty('message')
    })

    it('should return current user after login', async () => {
      const email = createTestEmail()
      const password = 'TestPassword123'

      await request(app)
        .post('/api/auth/register')
        .send({ email, password })
        .expect(201)

      const agent = request.agent(app)

      await agent
        .post('/api/auth/login')
        .send({ email, password })
        .expect(200)

      const response = await agent
        .get('/api/auth/me')
        .expect(200)

      expect(response.body).toHaveProperty('user')
      expect(response.body.user.email).toBe(email)

      expect(response.body.user).not.toHaveProperty('passwordHash')
    })
  })

  describe('POST /api/auth/logout', () => {
    it('should logout authenticated user', async () => {
      const email = createTestEmail()
      const password = 'TestPassword123'

      await request(app)
        .post('/api/auth/register')
        .send({ email, password })
        .expect(201)

      const agent = request.agent(app)

      await agent
        .post('/api/auth/login')
        .send({ email, password })
        .expect(200)

      await agent
        .get('/api/auth/me')
        .expect(200)

      await agent
        .post('/api/auth/logout')
        .expect(200)

      await agent
        .get('/api/auth/me')
        .expect(401)
    })
  })

  describe('Password Security (15.4-A)', () => {
    it('should not expose password or passwordHash during registration', async () => {
      const agent = request.agent(app)

      const email = `password-security-${Date.now()}@example.com`
      const password = 'Password123!'

      const response = await agent
        .post('/api/auth/register')
        .send({
          email,
          password,
        })

      expect(response.status).toBe(201)

      expect(response.body).not.toHaveProperty('password')
      expect(response.body).not.toHaveProperty('passwordHash')
    })

    it('should not expose password or passwordHash during login', async () => {
      const agent = request.agent(app)

      const email = `password-login-${Date.now()}@example.com`
      const password = 'Password123!'

      await agent
        .post('/api/auth/register')
        .send({
          email,
          password,
        })

      const response = await agent
        .post('/api/auth/login')
        .send({
          email,
          password,
        })

      expect(response.status).toBe(200)

      expect(response.body).not.toHaveProperty('password')
      expect(response.body).not.toHaveProperty('passwordHash')
      expect(response.body).not.toHaveProperty('accessToken')
    })

    it('should reject login with an incorrect password', async () => {
      const agent = request.agent(app)

      const email = `wrong-password-${Date.now()}@example.com`

      await agent
        .post('/api/auth/register')
        .send({
          email,
          password: 'CorrectPassword123!',
        })

      const response = await agent
        .post('/api/auth/login')
        .send({
          email,
          password: 'WrongPassword123!',
        })

      expect(response.status).toBe(401)
      expect(response.body.message).toBe('Email hoặc mật khẩu không đúng')
    })

    it('should allow login with the correct password', async () => {
      const agent = request.agent(app)

      const email = `correct-password-${Date.now()}@example.com`
      const password = 'CorrectPassword123!'

      await agent
        .post('/api/auth/register')
        .send({
          email,
          password,
        })

      const response = await agent
        .post('/api/auth/login')
        .send({
          email,
          password,
        })

      expect(response.status).toBe(200)
      expect(response.body).not.toHaveProperty('password')
      expect(response.body).not.toHaveProperty('passwordHash')
    })
  })

  describe('JWT / Cookie Security (15.4-B)', () => {
    it('should set a secure authentication cookie with correct security attributes', async () => {
      const agent = request.agent(app)

      const email = `cookie-security-${Date.now()}@example.com`
      const password = 'Password123!'

      await agent
        .post('/api/auth/register')
        .send({
          email,
          password,
        })

      const response = await agent
        .post('/api/auth/login')
        .send({
          email,
          password,
        })

      expect(response.status).toBe(200)

      const setCookie = response.headers['set-cookie'] as unknown as string[]

      expect(setCookie).toBeDefined()
      expect(setCookie.length).toBeGreaterThan(0)

      const authCookie = setCookie.find((cookie: string) =>
        cookie.startsWith('token=')
      )

      expect(authCookie).toBeDefined()
      expect(authCookie).toContain('HttpOnly')
      expect(authCookie).toContain('SameSite=Lax')
      expect(authCookie).toContain('Path=/')
      expect(authCookie).toContain('Max-Age=604800')

      expect(response.body).not.toHaveProperty('accessToken')
      expect(response.body).not.toHaveProperty('token')
      expect(response.body).not.toHaveProperty('jwt')
    })

    it('should invalidate the old authentication token after logout', async () => {
      const agent = request.agent(app)

      const email = `token-invalidation-${Date.now()}@example.com`
      const password = 'Password123!'

      await agent
        .post('/api/auth/register')
        .send({
          email,
          password,
        })

      const loginResponse = await agent
        .post('/api/auth/login')
        .send({
          email,
          password,
        })

      expect(loginResponse.status).toBe(200)

      const setCookie = loginResponse.headers['set-cookie'] as unknown as string[]

      expect(setCookie).toBeDefined()
      expect(setCookie.length).toBeGreaterThan(0)

      const authCookie = setCookie.find((cookie: string) =>
        cookie.startsWith('token=')
      )

      expect(authCookie).toBeDefined()

      const token = authCookie!.split(';')[0]

      const beforeLogout = await request(app)
        .get('/api/auth/me')
        .set('Cookie', token)

      expect(beforeLogout.status).toBe(200)

      const logoutResponse = await agent
        .post('/api/auth/logout')

      expect(logoutResponse.status).toBe(200)

      const afterLogout = await request(app)
        .get('/api/auth/me')
        .set('Cookie', token)

      expect(afterLogout.status).toBe(401)
    })
  })

  describe('Authentication Input Boundary (15.4-C)', () => {
    it('should reject password shorter than 6 characters', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: `short-password-${Date.now()}@example.com`,
          password: '12345',
        })

      expect(response.status).toBe(400)
    })

    it('should reject password longer than 72 characters', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: `long-password-${Date.now()}@example.com`,
          password: 'A'.repeat(73),
        })

      expect(response.status).toBe(400)
    })

    it('should reject invalid email during registration', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          password: 'Password123!',
        })

      expect(response.status).toBe(400)
    })

    it('should reject invalid email during login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'not-an-email',
          password: 'Password123!',
        })

      expect(response.status).toBe(400)
    })

    it('should reject missing password during login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
        })

      expect(response.status).toBe(400)
    })

    it('should reject empty password during login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: '',
        })

      expect(response.status).toBe(400)
    })
  })

  describe('Authentication Rate Limiting (15.4-D)', () => {
    it('should return 429 after exceeding the authentication rate limit', async () => {
      const email = `rate-limit-${Date.now()}@example.com`

      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            email,
            password: 'WrongPassword123!',
          })
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email,
          password: 'WrongPassword123!',
        })

      expect(response.status).toBe(429)
      expect(response.body).toHaveProperty('message')
    })
  })
})
