import { describe, it, expect, beforeEach } from 'vitest'
import express, { Request, Response } from 'express'
import request from 'supertest'
import { generalRateLimiter } from '../../src/middlewares/rate-limit.middleware.js'

describe('16.10-B General API Rate Limiter', () => {
  let app: express.Express

  beforeEach(() => {
    app = express()
    app.set('trust proxy', 1)
    app.use(express.json())

    // Mount generalRateLimiter trên tiền tố /api
    app.use('/api', generalRateLimiter)

    app.get('/api/health', (_req: Request, res: Response) => {
      res.status(200).json({ status: 'ok', message: 'Healthy' })
    })

    app.get('/api/data', (_req: Request, res: Response) => {
      res.status(200).json({ data: [1, 2, 3] })
    })
  })

  it('cho phép các request trong ngưỡng giới hạn và trả về RateLimit headers chuẩn RFC', async () => {
    const ip = '198.51.100.10'
    await generalRateLimiter.resetKey(ip)

    const res = await request(app)
      .get('/api/health')
      .set('X-Forwarded-For', ip)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(res.headers['ratelimit-limit']).toBe('300')
    expect(res.headers['ratelimit-remaining']).toBeDefined()

    await generalRateLimiter.resetKey(ip)
  })

  it('chặn request khi vượt quá 300 requests / 15 phút với mã 429', async () => {
    const ip = '198.51.100.20'
    await generalRateLimiter.resetKey(ip)

    // Gửi 300 requests
    for (let i = 0; i < 300; i++) {
      const res = await request(app)
        .get('/api/data')
        .set('X-Forwarded-For', ip)
      expect(res.status).toBe(200)
    }

    // Request thứ 301 phải bị chặn
    const blockedRes = await request(app)
      .get('/api/health')
      .set('X-Forwarded-For', ip)

    expect(blockedRes.status).toBe(429)
    expect(blockedRes.body).toEqual({
      message: 'Quá nhiều yêu cầu từ địa chỉ IP này. Vui lòng thử lại sau.'
    })
    expect(blockedRes.headers['ratelimit-remaining']).toBe('0')

    await generalRateLimiter.resetKey(ip)
  })

  it('cho phép resetKey để phục hồi quota cho IP', async () => {
    const ip = '198.51.100.30'
    await generalRateLimiter.resetKey(ip)

    for (let i = 0; i < 300; i++) {
      await request(app)
        .get('/api/health')
        .set('X-Forwarded-For', ip)
    }

    const blocked = await request(app)
      .get('/api/health')
      .set('X-Forwarded-For', ip)
    expect(blocked.status).toBe(429)

    // Reset quota
    await generalRateLimiter.resetKey(ip)

    const allowed = await request(app)
      .get('/api/health')
      .set('X-Forwarded-For', ip)
    expect(allowed.status).toBe(200)

    await generalRateLimiter.resetKey(ip)
  })
})
