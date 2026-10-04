import { prisma } from '../lib/prisma.js'
import { cleanupCloudinaryAttachments } from './cloudinary.service.js'

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
  page: number = 1,
  limit: number = 30,
  before?: string
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

  // Cap limit between 1 and 50 per requirement
  const effectiveLimit = Math.min(Math.max(limit, 1), 50)

  let messages: any[] = []
  let hasMore = false
  let nextCursor: string | null = null

  if (before) {
    const cursorMessage = await prisma.message.findFirst({
      where: {
        id: before,
        sessionId: chatId
      }
    })

    if (!cursorMessage) {
      return {
        messages: [],
        nextCursor: null,
        hasMore: false,
        pagination: {
          page,
          limit: effectiveLimit,
          total: 0,
          totalPages: 0
        }
      }
    }

    // Query messages strictly older than the cursor message:
    // createdAt < cursor.createdAt OR (createdAt == cursor.createdAt AND id < cursor.id)
    const rawMessages = await prisma.message.findMany({
      where: {
        sessionId: chatId,
        OR: [
          { createdAt: { lt: cursorMessage.createdAt } },
          {
            createdAt: cursorMessage.createdAt,
            id: { lt: cursorMessage.id }
          }
        ]
      },
      include: {
        attachments: true
      },
      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' }
      ],
      take: effectiveLimit + 1
    })

    if (rawMessages.length > effectiveLimit) {
      hasMore = true
      const sliced = rawMessages.slice(0, effectiveLimit)
      nextCursor = sliced[sliced.length - 1].id
      messages = sliced.reverse()
    } else {
      hasMore = false
      nextCursor = null
      messages = rawMessages.reverse()
    }
  } else {
    // Initial fetch: newest messages
    const rawMessages = await prisma.message.findMany({
      where: {
        sessionId: chatId
      },
      include: {
        attachments: true
      },
      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' }
      ],
      take: effectiveLimit + 1
    })

    if (rawMessages.length > effectiveLimit) {
      hasMore = true
      const sliced = rawMessages.slice(0, effectiveLimit)
      nextCursor = sliced[sliced.length - 1].id
      messages = sliced.reverse()
    } else {
      hasMore = false
      nextCursor = null
      messages = rawMessages.reverse()
    }
  }

  const total = await prisma.message.count({
    where: {
      sessionId: chatId
    }
  })

  const normalizedMessages = messages.map((message) => ({
    ...message,
    attachments: message.attachments.map((attachment: any) => ({
      ...attachment,
      sizeBytes: attachment.sizeBytes.toString()
    }))
  }))

  return {
    messages: normalizedMessages,
    nextCursor,
    hasMore,
    pagination: {
      page,
      limit: effectiveLimit,
      total,
      totalPages: Math.ceil(total / effectiveLimit)
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
    },
    include: {
      attachments: true
    }
  })

  if (!message) {
    return null
  }

  if (message.attachments && message.attachments.length > 0) {
    await cleanupCloudinaryAttachments(message.attachments)
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
      role: 'ai',
      content
    }
  })

  return message
}

export const updateAssistantMessage = async (
  chatId: string,
  messageId: string,
  userId: string,
  content: string
) => {
  const message = await prisma.message.findFirst({
    where: {
      id: messageId,
      sessionId: chatId,
      role: 'ai',
      session: {
        userId
      }
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