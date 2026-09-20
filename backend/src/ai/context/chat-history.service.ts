import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../generated/prisma/client.js'
import type { ChatContextMessage } from './chat.context.js'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!
})

const prisma = new PrismaClient({
  adapter
})

export const getChatHistory = async (
  chatId: string,
  userId: string,
  limit = 20
): Promise<ChatContextMessage[] | null> => {
  const chat = await prisma.chatSession.findFirst({
    where: {
      id: chatId,
      userId
    }
  })

  if (!chat) {
    return null
  }

  const messages = await prisma.message.findMany({
  where: {
    sessionId: chatId
  },
  orderBy: {
    createdAt: 'desc'
  },
  take: limit
})

  return messages.map((message) => ({
    role:
      message.role === 'user'
        ? 'user'
        : 'assistant',
    content: message.content
  }))
}