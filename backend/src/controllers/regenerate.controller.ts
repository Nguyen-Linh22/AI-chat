import { Request, Response } from 'express'
import {
  updateAssistantMessage
} from '../services/message.service.js'
import { getChatHistory } from '../ai/context/chat-history.service.js'
import { buildChatContext } from '../ai/context/chat.context.js'
import { buildChatPrompt } from '../ai/prompts/chat.prompt.js'
import { getModelById } from '../ai/model.registry.js'
import { createAIProvider } from '../ai/ai.router.js'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client.js'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!
})

const prisma = new PrismaClient({
  adapter
})

export const regenerateMessage = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.userId
    const chatId = req.params.id as string
    const messageId =
      req.params.messageId as string

    const { modelId } = req.body

    if (!userId) {
      return res.status(401).json({
        message: 'Bạn chưa đăng nhập'
      })
    }

    if (!chatId || !messageId) {
      return res.status(400).json({
        message:
          'Chat ID hoặc Message ID không hợp lệ'
      })
    }

    if (!modelId) {
      return res.status(400).json({
        message: 'Model ID không được để trống'
      })
    }

    const selectedModel =
      getModelById(modelId)

    if (!selectedModel) {
      return res.status(400).json({
        message:
          `AI model không được hỗ trợ: ${modelId}`
      })
    }

    const targetMessage =
      await prisma.message.findFirst({
        where: {
          id: messageId,
          sessionId: chatId,
          role: 'ai',
          session: {
            userId
          }
        }
      })

    if (!targetMessage) {
      console.log(
        'REGENERATE: không tìm thấy target message',
        {
          messageId,
          chatId,
          userId
        }
      )

      return res.status(404).json({
        message:
          'Không tìm thấy tin nhắn AI'
      })
    }

    const previousUserMessage =
      await prisma.message.findFirst({
        where: {
          sessionId: chatId,
          role: 'user',
          createdAt: {
            lt: targetMessage.createdAt
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

    if (!previousUserMessage) {
      return res.status(400).json({
        message:
          'Không tìm thấy tin nhắn người dùng tương ứng'
      })
    }

    const history =
      await getChatHistory(
        chatId,
        userId
      )

    if (!history) {
      return res.status(404).json({
        message:
          'Không tìm thấy cuộc trò chuyện'
      })
    }

    const context =
      buildChatContext(history)

    const prompt =
      buildChatPrompt(
        previousUserMessage.content,
        context
      )

    const provider =
      createAIProvider(
        selectedModel.provider
      )

    const abortController =
      new AbortController()

    res.on('close', () => {
      if (!res.writableEnded) {
        console.log(
          'REGENERATE: client đã hủy request'
        )

        abortController.abort()
      }
    })

    res.setHeader(
      'Content-Type',
      'text/event-stream'
    )

    res.setHeader(
      'Cache-Control',
      'no-cache'
    )

    res.setHeader(
      'Connection',
      'keep-alive'
    )

    res.flushHeaders()

    let fullResponse = ''

    const stream =
      provider.generateResponseStream(
        prompt,
        selectedModel.model,
        abortController.signal
      )

    for await (
      const chunk of stream
    ) {
      fullResponse += chunk

      res.write(
        `data: ${JSON.stringify({
          type: 'chunk',
          content: chunk
        })}\n\n`
      )
    }

    const updatedMessage =
      await updateAssistantMessage(
        chatId,
        messageId,
        fullResponse
      )

    if (!updatedMessage) {
      return res.end()
    }

    res.write(
      `data: ${JSON.stringify({
        type: 'done',
        message: updatedMessage
      })}\n\n`
    )

    res.end()
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === 'AbortError'
    ) {
      console.log(
        'REGENERATE: generation đã bị hủy'
      )

      if (!res.writableEnded) {
        res.end()
      }

      return
    }

    console.error(
      'Regenerate message error:',
      error
    )

    if (!res.headersSent) {
      return res.status(500).json({
        message:
          'Đã xảy ra lỗi khi regenerate'
      })
    }

    if (!res.writableEnded) {
      res.write(
        `data: ${JSON.stringify({
          type: 'error',
          message:
            'Đã xảy ra lỗi khi regenerate'
        })}\n\n`
      )

      res.end()
    }
  }
}