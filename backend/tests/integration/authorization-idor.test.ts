import request from 'supertest'
import { afterEach, describe, expect, it } from 'vitest'

import app from '../../src/app.js'
import { prisma } from '../../src/lib/prisma.js'
import { authRateLimiter } from '../../src/middlewares/rate-limit.middleware.js'

async function createAuthenticatedUser(
  suffix: string
) {
  const agent = request.agent(app)

  const email = `idor-${suffix}-${Date.now()}@example.com`
  const password = 'Password123!'

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

async function createChat(agent: ReturnType<typeof request.agent>) {
  const response = await agent
    .post('/api/chats')
    .send({
      title: 'Private Chat A',
    })

  expect(response.status).toBe(201)

  return response.body.chat
}

describe('Authorization / IDOR', () => {
  afterEach(async () => {
    await authRateLimiter.resetKey('::ffff:127.0.0.1')
    await authRateLimiter.resetKey('127.0.0.1')
  })

  describe('Chat IDOR (15.5-A)', () => {
    it('should prevent another user from reading a private chat', async () => {
      const userA = await createAuthenticatedUser('chat-read-a')
      const userB = await createAuthenticatedUser('chat-read-b')

      const chatA = await createChat(userA)

      const response = await userB
        .get(`/api/chats/${chatA.id}`)

      expect(response.status).toBe(404)
    })

    it('should prevent another user from renaming a private chat', async () => {
      const userA = await createAuthenticatedUser('chat-rename-a')
      const userB = await createAuthenticatedUser('chat-rename-b')

      const chatA = await createChat(userA)

      const response = await userB
        .patch(`/api/chats/${chatA.id}`)
        .send({
          title: 'Hacked Chat',
        })

      expect(response.status).toBe(404)

      const chatAfterAttempt = await prisma.chatSession.findUnique({
        where: {
          id: chatA.id,
        },
      })

      expect(chatAfterAttempt).not.toBeNull()
      expect(chatAfterAttempt?.title).toBe(chatA.title)
      expect(chatAfterAttempt?.title).not.toBe('Hacked Chat')
    })

    it('should prevent another user from deleting a private chat', async () => {
      const userA = await createAuthenticatedUser('chat-delete-a')
      const userB = await createAuthenticatedUser('chat-delete-b')

      const chatA = await createChat(userA)

      const response = await userB
        .delete(`/api/chats/${chatA.id}`)

      expect(response.status).toBe(404)

      const chatAfterAttempt = await prisma.chatSession.findUnique({
        where: {
          id: chatA.id,
        },
      })

      expect(chatAfterAttempt).not.toBeNull()
      expect(chatAfterAttempt?.userId).toBeDefined()
    })
  })

  describe('Message IDOR (15.5-B)', () => {
    it('should prevent another user from listing messages of a private chat', async () => {
      const userA = await createAuthenticatedUser('message-list-a')
      const userB = await createAuthenticatedUser('message-list-b')

      const chatA = await createChat(userA)

      await prisma.message.create({
        data: {
          sessionId: chatA.id,
          role: 'user',
          content: 'Private message A',
        },
      })

      const response = await userB
        .get(`/api/chats/${chatA.id}/messages`)

      expect(response.status).toBe(404)
    })

    it('should prevent another user from sending a message to a private chat', async () => {
      const userA = await createAuthenticatedUser('message-send-a')
      const userB = await createAuthenticatedUser('message-send-b')

      const chatA = await createChat(userA)

      const response = await userB
        .post(`/api/chats/${chatA.id}/messages`)
        .send({
          content: 'Unauthorized message',
          modelId: 'ollama-qwen3-1.7b',
        })

      expect(response.status).toBe(404)
    })

    it('should prevent another user from deleting a private message', async () => {
      const userA = await createAuthenticatedUser('message-delete-a')
      const userB = await createAuthenticatedUser('message-delete-b')

      const chatA = await createChat(userA)

      const messageA = await prisma.message.create({
        data: {
          sessionId: chatA.id,
          role: 'user',
          content: 'Private message A',
        },
      })

      const response = await userB
        .delete(`/api/chats/${chatA.id}/messages/${messageA.id}`)

      expect(response.status).toBe(404)

      const messageAfterAttempt = await prisma.message.findUnique({
        where: {
          id: messageA.id,
        },
      })

      expect(messageAfterAttempt).not.toBeNull()
    })

    it('should prevent using a message from another chat with a different chatId', async () => {
      const userA = await createAuthenticatedUser('message-cross-chat-a')

      const chatA = await createChat(userA)
      const chatB = await createChat(userA)

      const messageA = await prisma.message.create({
        data: {
          sessionId: chatA.id,
          role: 'user',
          content: 'Message from Chat A',
        },
      })

      const response = await userA
        .delete(`/api/chats/${chatB.id}/messages/${messageA.id}`)

      expect(response.status).toBe(404)

      const messageAfterAttempt = await prisma.message.findUnique({
        where: {
          id: messageA.id,
        },
      })

      expect(messageAfterAttempt).not.toBeNull()
      expect(messageAfterAttempt?.sessionId).toBe(chatA.id)
    })
  })

  describe('Attachment Upload IDOR (15.5-C)', () => {
    it('should prevent another user from uploading an attachment to a private message', async () => {
      const userA = await createAuthenticatedUser('attachment-upload-a')
      const userB = await createAuthenticatedUser('attachment-upload-b')

      const chatA = await createChat(userA)

      const messageA = await prisma.message.create({
        data: {
          sessionId: chatA.id,
          role: 'user',
          content: 'Private message with attachment',
        },
      })

      const response = await userB
        .post(`/api/uploads/${messageA.id}`)
        .attach(
          'file',
          Buffer.from('Unauthorized attachment'),
          'test.txt',
        )

      expect(response.status).toBe(404)
      expect(response.body.message).toBe('Không tìm thấy tin nhắn')

      const attachments = await prisma.attachment.findMany({
        where: {
          messageId: messageA.id,
        },
      })

      expect(attachments.length).toBe(0)
    })
  })

  describe('Regenerate IDOR (15.5-D)', () => {
    it('should prevent another user from regenerating a private AI message', async () => {
      const userA = await createAuthenticatedUser('regenerate-a')
      const userB = await createAuthenticatedUser('regenerate-b')

      const chatA = await createChat(userA)

      await prisma.message.create({
        data: {
          sessionId: chatA.id,
          role: 'user',
          content: 'User A prompt',
        },
      })

      const messageA2 = await prisma.message.create({
        data: {
          sessionId: chatA.id,
          role: 'ai',
          content: 'AI original response',
        },
      })

      const response = await userB
        .post(
          `/api/chats/${chatA.id}/messages/${messageA2.id}/regenerate`,
        )
        .send({
          modelId: 'ollama-qwen3-1.7b',
        })

      expect(response.status).toBe(404)
      expect(response.body.message).toBe('Không tìm thấy tin nhắn AI')

      const messageAfter = await prisma.message.findUnique({
        where: {
          id: messageA2.id,
        },
      })

      expect(messageAfter).not.toBeNull()
      expect(messageAfter?.content).toBe('AI original response')
    })
  })
})
