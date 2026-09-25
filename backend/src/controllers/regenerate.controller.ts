import { Request, Response } from 'express'
import {
  updateAssistantMessage
} from '../services/message.service.js'
import { getChatHistory } from '../ai/context/chat-history.service.js'
import { buildChatContext } from '../ai/context/chat.context.js'
import { buildChatPrompt, MAX_AI_CONTEXT_CHARS } from '../ai/prompts/chat.prompt.js'
import { getModelById } from '../ai/model.registry.js'
import { createAIProvider } from '../ai/ai.router.js'
import { prisma } from '../lib/prisma.js'
import { AI_TIMEOUT_MS } from '../ai/ai.config.js'
import {
  logAiRequestStart,
  logAiRequestCompleted,
  logAiRequestTimeout,
  logAiRequestFailed
} from '../utils/ai-audit.util.js'

export const regenerateMessage = async (
  req: Request,
  res: Response
) => {
  const abortController = new AbortController()
  let isTimedOut = false
  const startTime = Date.now()

  const timeoutId = setTimeout(() => {
    isTimedOut = true
    abortController.abort()
  }, AI_TIMEOUT_MS)

  res.on('close', () => {
    if (!res.writableEnded) {
      abortController.abort()
    }
  })

  const userId = req.userId
  const chatId = req.params.id as string
  const messageId = req.params.messageId as string
  const { modelId } = req.body
  const selectedModel = getModelById(modelId)

  try {
    if (!userId) {
      clearTimeout(timeoutId)
      return res.status(401).json({
        message: 'Bạn chưa đăng nhập'
      })
    }

    if (!selectedModel) {
      clearTimeout(timeoutId)
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
      clearTimeout(timeoutId)
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
      clearTimeout(timeoutId)
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
      clearTimeout(timeoutId)
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
        context,
        ''
      )

    if (prompt.length > MAX_AI_CONTEXT_CHARS) {
      clearTimeout(timeoutId)
      return res.status(413).json({
        message: 'Nội dung cuộc trò chuyện quá lớn để xử lý.'
      })
    }

    const provider =
      createAIProvider(
        selectedModel.provider
      )

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

    logAiRequestStart({
      userId,
      chatId,
      provider: selectedModel.provider,
      model: selectedModel.model
    })

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

    logAiRequestCompleted({
      userId,
      chatId,
      provider: selectedModel.provider,
      model: selectedModel.model,
      durationMs: Date.now() - startTime
    })

    const updatedMessage =
      await updateAssistantMessage(
        chatId,
        messageId,
        userId,
        fullResponse
      )

    clearTimeout(timeoutId)

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
  } catch (error: any) {
    clearTimeout(timeoutId)
    const durationMs = Date.now() - startTime

    if (isTimedOut) {
      logAiRequestTimeout({
        provider: selectedModel?.provider || 'unknown',
        model: selectedModel?.model || 'unknown',
        durationMs
      })

      if (!res.headersSent) {
        return res.status(504).json({
          message: 'AI phản hồi quá lâu. Vui lòng thử lại.'
        })
      }

      if (!res.writableEnded) {
        res.write(
          `data: ${JSON.stringify({
            type: 'error',
            message: 'AI phản hồi quá lâu. Vui lòng thử lại.'
          })}\n\n`
        )

        res.end()
      }

      return
    }

    if (
      (error instanceof Error && error.name === 'AbortError') ||
      abortController.signal.aborted
    ) {
      if (!res.writableEnded) {
        res.end()
      }

      return
    }

    logAiRequestFailed({
      provider: selectedModel?.provider || 'unknown',
      model: selectedModel?.model || 'unknown',
      errorName: error?.name || 'Error',
      durationMs
    })

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