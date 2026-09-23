import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client.js'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!
})

const prisma = new PrismaClient({
  adapter
})

export const createMessage = async (
  chatId: string,
  userId: string,
  content: string
) => {
  const chat = await prisma.chatSession.findFirst({
    where: {
      id: chatId,
      userId
    }
  })

  if (!chat) {
    return null
  }

  const message = await prisma.message.create({
    data: {
      sessionId: chatId,
      role: 'user',
      content
    }
  })

  return message
}

export const getMessages = async (
  chatId: string,
  userId: string,
  page: number,
  limit: number
) => {
  const chat = await prisma.chatSession.findFirst({
    where: {
      id: chatId,
      userId
    }
  })

  if (!chat) {
    return null
  }

  const skip = (page - 1) * limit

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: {
        sessionId: chatId
      },
      include: {
        attachments: true
      },
      orderBy: {
        createdAt: 'asc'
      },
      skip,
      take: limit
    }),

    prisma.message.count({
      where: {
        sessionId: chatId
      }
    })
  ])

  const normalizedMessages = messages.map((message) => ({
    ...message,
    attachments: message.attachments.map((attachment) => ({
      ...attachment,
      sizeBytes: attachment.sizeBytes.toString()
    }))
  }))

  return {
    messages: normalizedMessages,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }
}

export const deleteMessage = async (
  chatId: string,
  messageId: string,
  userId: string
) => {
  const message = await prisma.message.findFirst({
    where: {
      id: messageId,
      sessionId: chatId,
      session: {
        userId
      }
    }
  })

  if (!message) {
    return null
  }

  await prisma.message.delete({
    where: {
      id: messageId
    }
  })

  return message
}

export const createAssistantMessage = async (
  chatId: string,
  content: string
) => {
  const message = await prisma.message.create({
    data: {
      sessionId: chatId,
      role: 'ai',
      content
    }
  })

  return message
}

export const updateAssistantMessage = async (
  chatId: string,
  messageId: string,
  content: string
) => {
  const message = await prisma.message.findFirst({
    where: {
      id: messageId,
      sessionId: chatId,
      role: 'ai'
    }
  })

  if (!message) {
    return null
  }

  const updatedMessage =
    await prisma.message.update({
      where: {
        id: messageId
      },
      data: {
        content
      }
    })

  return updatedMessage
}