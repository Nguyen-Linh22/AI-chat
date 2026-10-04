import { Request, Response } from 'express'
import {
  createMessage,
  createAssistantMessage,
  getMessages,
  deleteMessage
} from '../services/message.service.js'
import { generateChatResponse } from '../ai/chat.service.js'
import { AI_TIMEOUT_MS } from '../ai/ai.config.js'
import { getModelById } from '../ai/model.registry.js'
import {
  logAiRequestStart,
  logAiRequestCompleted,
  logAiRequestTimeout,
  logAiRequestFailed
} from '../utils/ai-audit.util.js'

export const createMessageController = async (
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
  const { content, modelId } = req.body
  const selectedModel = getModelById(modelId)

  try {
    if (!userId) {
      clearTimeout(timeoutId)
      return res.status(401).json({
        message: 'Bạn chưa đăng nhập'
      })
    }

    if (!chatId) {
      clearTimeout(timeoutId)
      return res.status(400).json({
        message: 'Chat ID không hợp lệ'
      })
    }

    const userMessage = await createMessage(
      chatId,
      userId,
      content
    )

    if (!userMessage) {
      clearTimeout(timeoutId)
      return res.status(404).json({
        message: 'Không tìm thấy cuộc trò chuyện'
      })
    }

    logAiRequestStart({
      userId,
      chatId,
      provider: selectedModel?.provider || 'unknown',
      model: selectedModel?.model || modelId
    })

    const aiResponse = await generateChatResponse(
      chatId,
      userId,
      content,
      modelId,
      abortController.signal
    )

    clearTimeout(timeoutId)

    if (aiResponse === null) {
      return res.status(404).json({
        message: 'Không tìm thấy cuộc trò chuyện'
      })
    }

    const assistantMessage =
      await createAssistantMessage(
        chatId,
        userId,
        aiResponse
      )

    logAiRequestCompleted({
      userId,
      chatId,
      provider: selectedModel?.provider || 'unknown',
      model: selectedModel?.model || modelId,
      durationMs: Date.now() - startTime
    })

    return res.status(201).json({
      message: 'Gửi tin nhắn thành công',
      data: {
        userMessage,
        assistantMessage
      }
    })
  } catch (error: any) {
    clearTimeout(timeoutId)
    const durationMs = Date.now() - startTime

    if (isTimedOut) {
      logAiRequestTimeout({
        provider: selectedModel?.provider || 'unknown',
        model: selectedModel?.model || modelId,
        durationMs
      })
      return res.status(504).json({
        message: 'AI phản hồi quá lâu. Vui lòng thử lại.'
      })
    }

    if (error?.statusCode === 413 || error?.status === 413) {
      return res.status(413).json({
        message: 'Nội dung cuộc trò chuyện quá lớn để xử lý.'
      })
    }

    logAiRequestFailed({
      provider: selectedModel?.provider || 'unknown',
      model: selectedModel?.model || modelId,
      errorName: error?.name || 'Error',
      durationMs
    })

    console.error('Create message error:', error)

    return res.status(500).json({
      message: 'Đã xảy ra lỗi khi gửi tin nhắn'
    })
  }
}

export const getMessagesController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.userId
    const chatId = req.params.id as string

    if (!userId) {
      return res.status(401).json({
        message: 'Bạn chưa đăng nhập'
      })
    }

    const page = req.query.page ? Number(req.query.page) : 1
    const limit = req.query.limit ? Number(req.query.limit) : 30
    const before = req.query.before as string | undefined

    const result = await getMessages(
      chatId,
      userId,
      page,
      limit,
      before
    )

    if (!result) {
      return res.status(404).json({
        message: 'Không tìm thấy cuộc trò chuyện'
      })
    }

    return res.status(200).json(result)
  } catch (error) {
    console.error('Get messages error:', error)

    return res.status(500).json({
      message: 'Đã xảy ra lỗi khi lấy tin nhắn'
    })
  }
}

export const deleteMessageController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.userId
    const chatId = req.params.chatId as string
    const messageId = req.params.messageId as string

    if (!userId) {
      return res.status(401).json({
        message: 'Bạn chưa đăng nhập'
      })
    }

    if (!chatId || !messageId) {
      return res.status(400).json({
        message: 'Chat ID hoặc Message ID không hợp lệ'
      })
    }

    const message = await deleteMessage(
      chatId,
      messageId,
      userId
    )

    if (!message) {
      return res.status(404).json({
        message: 'Không tìm thấy tin nhắn'
      })
    }

    return res.status(200).json({
      message: 'Xóa tin nhắn thành công',
      data: {
        id: message.id
      }
    })
  } catch (error) {
    console.error('Delete message error:', error)

    return res.status(500).json({
      message: 'Đã xảy ra lỗi khi xóa tin nhắn'
    })
  }
}