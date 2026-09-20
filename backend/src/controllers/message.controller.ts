import { Request, Response } from 'express'
import {
  createMessage,
  createAssistantMessage,
  getMessages,
  deleteMessage
} from '../services/message.service.js'
import { generateChatResponse } from '../ai/chat.service.js'

export const createMessageController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.userId
    const chatId = req.params.id as string
    const { content } = req.body

    if (!userId) {
      return res.status(401).json({
        message: 'Bạn chưa đăng nhập'
      })
    }

    if (!chatId) {
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
      return res.status(404).json({
        message: 'Không tìm thấy cuộc trò chuyện'
      })
    }

    const aiResponse = await generateChatResponse(
      chatId,
      userId,
      content
    )

    if (aiResponse === null) {
      return res.status(404).json({
        message: 'Không tìm thấy cuộc trò chuyện'
      })
    }

    const assistantMessage =
      await createAssistantMessage(
        chatId,
        aiResponse
      )

    return res.status(201).json({
      message: 'Gửi tin nhắn thành công',
      data: {
        userMessage,
        assistantMessage
      }
    })
  } catch (error) {
    console.error(
      'Create message error:',
      error
    )

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

    if (!chatId) {
      return res.status(400).json({
        message: 'Chat ID không hợp lệ'
      })
    }

    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 20

    if (
      !Number.isInteger(page) ||
      page < 1
    ) {
      return res.status(400).json({
        message: 'Page phải là số nguyên lớn hơn hoặc bằng 1'
      })
    }

    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      return res.status(400).json({
        message: 'Limit phải là số nguyên từ 1 đến 100'
      })
    }

    const result = await getMessages(
      chatId,
      userId,
      page,
      limit
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
      data: message
    })
  } catch (error) {
    console.error('Delete message error:', error)

    return res.status(500).json({
      message: 'Đã xảy ra lỗi khi xóa tin nhắn'
    })
  }
}