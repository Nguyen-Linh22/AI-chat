import request from 'supertest'
import { afterEach, describe, expect, it } from 'vitest'
import app from '../../src/app.js'
import { authRateLimiter } from '../../src/middlewares/rate-limit.middleware.js'

const createTestUser = async () => {
  const email = `chat-test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`
  const password = 'Test123456'

  const agent = request.agent(app)

  const registerResponse = await agent
    .post('/api/auth/register')
    .send({
      email,
      password,
    })

  expect(registerResponse.status).toBe(201)

  const loginResponse = await agent
    .post('/api/auth/login')
    .send({
      email,
      password,
    })

  expect(loginResponse.status).toBe(200)

  return agent
}

describe('Chat API', () => {
  afterEach(async () => {
    await authRateLimiter.resetKey('::ffff:127.0.0.1')
    await authRateLimiter.resetKey('127.0.0.1')
  })

  it('should reject unauthenticated request', async () => {
    const response = await request(app).get('/api/chats')

    expect(response.status).toBe(401)
  })

  it('should create a new chat', async () => {
    const agent = await createTestUser()

    const response = await agent.post('/api/chats')

    expect(response.status).toBe(201)
    expect(response.body).toHaveProperty('message')
    expect(response.body).toHaveProperty('chat')
    expect(response.body.chat).toHaveProperty('id')
    expect(response.body.chat).toHaveProperty('userId')
  })

  it('should return only the authenticated user chats', async () => {
    const agent = await createTestUser()

    await agent.post('/api/chats')
    await agent.post('/api/chats')

    const response = await agent.get('/api/chats')

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('chats')
    expect(Array.isArray(response.body.chats)).toBe(true)
    expect(response.body.chats.length).toBe(2)
  })

  it('should get a chat by id', async () => {
    const agent = await createTestUser()

    const createResponse = await agent.post('/api/chats')
    const chatId = createResponse.body.chat.id

    const response = await agent.get(`/api/chats/${chatId}`)

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('chat')
    expect(response.body.chat.id).toBe(chatId)
  })

  it('should reject invalid chat id', async () => {
    const agent = await createTestUser()

    const response = await agent.get('/api/chats/not-a-uuid')

    expect(response.status).toBe(400)
    expect(response.body.message).toBe('Dữ liệu không hợp lệ')
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'id',
          message: 'Chat ID không hợp lệ',
        }),
      ])
    )
  })

  it('should rename a chat', async () => {
    const agent = await createTestUser()

    const createResponse = await agent.post('/api/chats')
    const chatId = createResponse.body.chat.id

    const response = await agent
      .patch(`/api/chats/${chatId}`)
      .send({
        title: 'Chat đã đổi tên',
      })

    expect(response.status).toBe(200)
    expect(response.body.message).toBe(
      'Đổi tên cuộc trò chuyện thành công'
    )
    expect(response.body.chat.title).toBe('Chat đã đổi tên')
  })

  it('should delete a chat', async () => {
    const agent = await createTestUser()

    const createResponse = await agent.post('/api/chats')
    const chatId = createResponse.body.chat.id

    const deleteResponse = await agent.delete(`/api/chats/${chatId}`)

    expect(deleteResponse.status).toBe(200)
    expect(deleteResponse.body.message).toBe(
      'Xóa cuộc trò chuyện thành công'
    )

    const getResponse = await agent.get(`/api/chats/${chatId}`)

    expect(getResponse.status).toBe(404)
  })

  it('should prevent one user from accessing another user chat', async () => {
    const userA = await createTestUser()
    const userB = await createTestUser()

    const createResponse = await userA.post('/api/chats')
    const chatId = createResponse.body.chat.id

    const response = await userB.get(`/api/chats/${chatId}`)

    expect(response.status).toBe(404)
  })

  it('should prevent one user from renaming another user chat', async () => {
    const userA = await createTestUser()
    const userB = await createTestUser()

    const createResponse = await userA.post('/api/chats')
    const chatId = createResponse.body.chat.id

    const response = await userB
      .patch(`/api/chats/${chatId}`)
      .send({
        title: 'IDOR attempt',
      })

    expect(response.status).toBe(404)
  })

  it('should prevent one user from deleting another user chat', async () => {
    const userA = await createTestUser()
    const userB = await createTestUser()

    const createResponse = await userA.post('/api/chats')
    const chatId = createResponse.body.chat.id

    const response = await userB.delete(`/api/chats/${chatId}`)

    expect(response.status).toBe(404)

    const ownerResponse = await userA.get(`/api/chats/${chatId}`)

    expect(ownerResponse.status).toBe(200)
  })
})
