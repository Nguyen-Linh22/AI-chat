import { describe, expect, it } from 'vitest'
import request from 'supertest'
import app from '../../src/app.js'

describe('GET /api/health', () => {
  it('should return 200 and healthy status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200)

    expect(response.body).toMatchObject({
      status: 'ok',
    })
  })

  it('should return JSON response', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect('Content-Type', /json/)
      .expect(200)

    expect(response.body).toBeDefined()
  })
})
