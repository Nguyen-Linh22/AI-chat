import request from 'supertest'
import { describe, expect, it, afterEach } from 'vitest'
import app from '../../src/app.js'
import {
  authRateLimiter,
  aiRateLimiter
} from '../../src/middlewares/rate-limit.middleware.js'

const createTestUser = async () => {
  const email = `message-test-${Date.now()}-${Math.random()}@example.com`
  const password = 'Test123456'

  const agent = request.agent(app)

  const registerResponse = await agent
    .post('/api/auth/register')
    .send({
      email,
      password
    })

  expect(registerResponse.status).toBe(201)

  const loginResponse = await agent
    .post('/api/auth/login')
    .send({
      email,
      password
    })

  expect(loginResponse.status).toBe(200)

  return agent
}

const createTestChat = async (
  agent: request.SuperAgentTest
) => {
  const response = await agent
    .post('/api/chats')
    .send({
      title: 'Message Test Chat'
    })

  expect(response.status).toBe(201)

  return response.body.chat.id as string
}

afterEach(async () => {
  await authRateLimiter.resetKey('::ffff:127.0.0.1')
  await authRateLimiter.resetKey('127.0.0.1')
})

describe('Message API', () => {
  it('GET /api/chats/:id/messages - unauthenticated should return 401', async () => {
    const response = await request(app)
      .get('/api/chats/00000000-0000-0000-0000-000000000000/messages')

    expect(response.status).toBe(401)
  })

  it('GET /api/chats/:id/messages - invalid chat ID should return 400', async () => {
    const agent = await createTestUser()

    const response = await agent
      .get('/api/chats/not-a-uuid/messages')

    expect(response.status).toBe(400)
  })

  it('GET /api/chats/:id/messages - should return empty messages with pagination', async () => {
    const agent = await createTestUser()
    const chatId = await createTestChat(agent)

    const response = await agent
      .get(`/api/chats/${chatId}/messages`)
      .query({
        page: 1,
        limit: 20
      })

    expect(response.status).toBe(200)

    expect(response.body).toHaveProperty('messages')
    expect(response.body).toHaveProperty('pagination')

    expect(response.body.messages).toEqual([])

    expect(response.body.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0
    })
  })

  it('GET /api/chats/:id/messages - should return 404 for another user chat', async () => {
    const owner = await createTestUser()
    const otherUser = await createTestUser()

    const chatId = await createTestChat(owner)

    const response = await otherUser
      .get(`/api/chats/${chatId}/messages`)
      .query({
        page: 1,
        limit: 20
      })

    expect(response.status).toBe(404)
  })

  it('GET /api/chats/:id/messages - invalid pagination should return 400', async () => {
    const agent = await createTestUser()
    const chatId = await createTestChat(agent)

    const response = await agent
      .get(`/api/chats/${chatId}/messages`)
      .query({
        page: 0,
        limit: 1000
      })

    expect(response.status).toBe(400)
  })

  it('POST /api/chats/:id/messages - unauthenticated should return 401', async () => {
    const response = await request(app)
      .post('/api/chats/00000000-0000-0000-0000-000000000000/messages')
      .send({
        content: 'Hello',
        modelId: 'ollama-qwen3-1.7b'
      })

    expect(response.status).toBe(401)
  })

  it('POST /api/chats/:id/messages - invalid chat ID should return 400', async () => {
    const agent = await createTestUser()

    const response = await agent
      .post('/api/chats/not-a-uuid/messages')
      .send({
        content: 'Hello',
        modelId: 'ollama-qwen3-1.7b'
      })

    expect(response.status).toBe(400)
  })

  it('POST /api/chats/:id/messages - invalid body should return 400 without calling AI', async () => {
    const agent = await createTestUser()
    const chatId = await createTestChat(agent)

    const response = await agent
      .post(`/api/chats/${chatId}/messages`)
      .send({
        content: '',
        modelId: 'invalid-model'
      })

    expect(response.status).toBe(400)
  })

  it('POST /api/chats/:id/messages - should return 429 after exceeding AI rate limit', async () => {
    const agent = await createTestUser()
    const chatId = await createTestChat(agent)

    const meResponse = await agent
      .get('/api/auth/me')

    expect(meResponse.status).toBe(200)

    const userId = meResponse.body.user.id as string

    const responses = []

    for (let i = 0; i < 16; i++) {
      const response = await agent
        .post(`/api/chats/${chatId}/messages`)
        .send({
          content: ''
        })

      responses.push(response)
    }

    expect(responses.slice(0, 15).every((response) => response.status === 400)).toBe(true)

    expect(responses[15].status).toBe(429)

    expect(responses[15].body).toEqual({
      message: 'Bạn đang gửi yêu cầu AI quá nhanh. Vui lòng chờ giây lát trước khi tiếp tục.'
    })

    await aiRateLimiter.resetKey(`user_${userId}`)
  })

  it('POST /api/chats/:id/messages - chat not owned by user should return 404', async () => {
    const owner = await createTestUser()
    const otherUser = await createTestUser()

    const chatId = await createTestChat(owner)

    const response = await otherUser
      .post(`/api/chats/${chatId}/messages`)
      .send({
        content: 'Hello',
        modelId: 'ollama-qwen3-1.7b'
      })

    expect(response.status).toBe(404)
  })

  it('DELETE /api/chats/:chatId/messages/:messageId - unauthenticated should return 401', async () => {
    const response = await request(app)
      .delete(
        '/api/chats/00000000-0000-0000-0000-000000000000/messages/00000000-0000-0000-0000-000000000000'
      )

    expect(response.status).toBe(401)
  })

  it('DELETE /api/chats/:chatId/messages/:messageId - invalid IDs should return 400', async () => {
    const agent = await createTestUser()

    const response = await agent
      .delete('/api/chats/not-a-uuid/messages/not-a-uuid')

    expect(response.status).toBe(400)
  })

  it('DELETE /api/chats/:chatId/messages/:messageId - nonexistent message should return 404', async () => {
    const agent = await createTestUser()
    const chatId = await createTestChat(agent)

    const messageId = '00000000-0000-0000-0000-000000000000'

    const response = await agent
      .delete(`/api/chats/${chatId}/messages/${messageId}`)

    expect(response.status).toBe(404)
  })
})
