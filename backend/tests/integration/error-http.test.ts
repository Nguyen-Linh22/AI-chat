import request from 'supertest'
import { describe, expect, it } from 'vitest'
import app from '../../src/app.js'

describe('Error / HTTP behavior', () => {
  it('should return 400 for malformed JSON', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": "test@example.com",}')

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty('message')
    expect(response.body.message).not.toContain('SyntaxError')
  })

  it('should return 413 when JSON body exceeds the configured limit', async () => {
    const largeContent = 'A'.repeat(1_100_000)

    const response = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({
        email: 'test@example.com',
        password: largeContent,
      }))

    expect(response.status).toBe(413)
    expect(response.body).toHaveProperty('message')
  })

  it('should reject unsupported HTTP methods', async () => {
    const response = await request(app)
      .put('/api/health')

    expect(response.status).toBe(404)
  })

  it('should return a safe response for an unexpected server error', async () => {
    const response = await request(app)
      .get('/api/this-route-does-not-exist')

    expect(response.status).toBe(404)
    expect(response.body).not.toHaveProperty('stack')
    expect(response.body).not.toHaveProperty('error.stack')
  })
})
