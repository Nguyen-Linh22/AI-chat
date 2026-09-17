import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client.js'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!
})

const prisma = new PrismaClient({
  adapter
})

export const createChat = async (userId: string) => {
  const chat = await prisma.chatSession.create({
    data: {
      userId
    }
  })

  return chat
}
export const getChats = async (userId: string) => {
     console.log('Get chats for userId:', userId)
  const chats = await prisma.chatSession.findMany({
    where: {
      userId: userId
    },
    orderBy: {
      updatedAt: 'desc'
    }
  })

  return chats
}
export const getChatById = async (
  chatId: string,
  userId: string
) => {
  const chat = await prisma.chatSession.findFirst({
    where: {
      id: chatId,
      userId
    }
  })

  return chat
}
export const renameChat = async (
  chatId: string,
  userId: string,
  title: string
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

  const updatedChat = await prisma.chatSession.update({
    where: {
      id: chatId
    },
    data: {
      title
    }
  })

  return updatedChat
}

export const deleteChat = async (
  chatId: string,
  userId: string
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

  await prisma.chatSession.delete({
    where: {
      id: chatId
    }
  })

  return chat
}