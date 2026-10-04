import { describe, it, expect, beforeEach, vi } from 'vitest'
import express, { Request, Response, NextFunction } from 'express'
import request from 'supertest'
import { uploadRateLimiter } from '../../src/middlewares/rate-limit.middleware.js'

describe('Upload Rate Limiter (PHASE 16.7-D)', () => {
  let app: express.Express
  let multerCallCount: number
  let controllerCallCount: number

  beforeEach(() => {
    multerCallCount = 0
    controllerCallCount = 0

    app = express()
    app.use(express.json())

    // Middleware giả lập auth: gán req.userId từ header 'x-user-id' nếu có
    app.use((req: Request, _res: Response, next: NextFunction) => {
      const authUserId = req.headers['x-user-id'] as string | undefined
      if (authUserId) {
        req.userId = authUserId
      }
      next()
    })

    // Middleware giả lập Multer
    const mockMulter = (_req: Request, _res: Response, next: NextFunction) => {
      multerCallCount++
      next()
    }

    // Controller giả lập upload
    const mockController = (_req: Request, res: Response) => {
      controllerCallCount++
      return res.status(201).json({
        message: 'Upload file thành công'
      })
    }

    // Route mô phỏng chính xác thứ tự: auth -> uploadRateLimiter -> Multer -> Controller
    app.post(
      '/api/uploads/:messageId',
      uploadRateLimiter,
      mockMulter,
      mockController
    )
  })

  it('should allow requests within limit (1 to 10) and call Multer + controller', async () => {
    const userId = `user-quota-test-${Date.now()}`

    for (let i = 1; i <= 10; i++) {
      const res = await request(app)
        .post('/api/uploads/msg-123')
        .set('x-user-id', userId)

      expect(res.status).toBe(201)
      expect(res.body.message).toBe('Upload file thành công')
      expect(res.headers['ratelimit-limit']).toBe('10')
      expect(res.headers['ratelimit-remaining']).toBe(String(10 - i))
    }

    expect(multerCallCount).toBe(10)
    expect(controllerCallCount).toBe(10)
  })

  it('should reject 11th request with 429 and correct message without calling Multer or controller', async () => {
    const userId = `user-11th-test-${Date.now()}`

    // 10 requests thành công
    for (let i = 1; i <= 10; i++) {
      const res = await request(app)
        .post('/api/uploads/msg-123')
        .set('x-user-id', userId)
      expect(res.status).toBe(201)
    }

    expect(multerCallCount).toBe(10)
    expect(controllerCallCount).toBe(10)

    // Request thứ 11 trong window
    const blockedRes = await request(app)
      .post('/api/uploads/msg-123')
      .set('x-user-id', userId)

    expect(blockedRes.status).toBe(429)
    expect(blockedRes.body).toEqual({
      message: 'Bạn đã tải lên quá nhiều file. Vui lòng thử lại sau 15 phút.'
    })
    expect(blockedRes.headers['ratelimit-remaining']).toBe('0')

    // QUAN TRỌNG: Multer và controller KHÔNG được gọi cho request thứ 11
    expect(multerCallCount).toBe(10)
    expect(controllerCallCount).toBe(10)
  })

  it('should isolate quota between different users (Rate limit key prioritizes userId)', async () => {
    const userA = `user-a-${Date.now()}`
    const userB = `user-b-${Date.now()}`

    // User A dùng hết 10 requests
    for (let i = 1; i <= 10; i++) {
      await request(app)
        .post('/api/uploads/msg-123')
        .set('x-user-id', userA)
    }

    // User A bị chặn ở request 11
    const resA = await request(app)
      .post('/api/uploads/msg-123')
      .set('x-user-id', userA)
    expect(resA.status).toBe(429)

    // User B vẫn được phép upload bình thường (quota độc lập)
    const resB = await request(app)
      .post('/api/uploads/msg-123')
      .set('x-user-id', userB)

    expect(resB.status).toBe(201)
    expect(resB.body.message).toBe('Upload file thành công')
    expect(resB.headers['ratelimit-remaining']).toBe('9')
  })

  it('should fallback to client IP when req.userId is not present', async () => {
    const ip = '198.51.100.55'

    // Gửi request không có x-user-id, fallback sang IP
    const res = await request(app)
      .post('/api/uploads/msg-123')
      .set('X-Forwarded-For', ip)

    expect(res.status).toBe(201)
    expect(res.headers['ratelimit-limit']).toBe('10')
  })

  it('should allow resetKey to reset user quota', async () => {
    const userId = `user-reset-${Date.now()}`

    for (let i = 1; i <= 10; i++) {
      await request(app)
        .post('/api/uploads/msg-123')
        .set('x-user-id', userId)
    }

    const blocked = await request(app)
      .post('/api/uploads/msg-123')
      .set('x-user-id', userId)
    expect(blocked.status).toBe(429)

    // Reset quota cho user
    await uploadRateLimiter.resetKey(`user_${userId}`)

    // Sau khi reset, user có thể gửi tiếp
    const allowed = await request(app)
      .post('/api/uploads/msg-123')
      .set('x-user-id', userId)
    expect(allowed.status).toBe(201)
  })
})
