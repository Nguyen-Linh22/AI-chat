import { Request, Response } from 'express'
import {
  createChat,
  getChats,
  getChatById,
  renameChat,
  deleteChat
} from '../services/chat.service.js'

export const createChatController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.userId

    if (!userId) {
      return res.status(401).json({
        message: 'Bạn chưa đăng nhập'
      })
    }

    const chat = await createChat(userId)

    return res.status(201).json({
      message: 'Tạo cuộc trò chuyện thành công',
      chat
    })
  } catch (error) {
    console.error('Create chat error:', error)

    return res.status(500).json({
      message: 'Đã xảy ra lỗi khi tạo cuộc trò chuyện'
    })
  }
}

export const getChatsController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.userId

    if (!userId) {
      return res.status(401).json({
        message: 'Bạn chưa đăng nhập'
      })
    }

    const chats = await getChats(userId)

    return res.status(200).json({
      chats
    })
  } catch (error) {
    console.error('Get chats error:', error)

    return res.status(500).json({
      message: 'Đã xảy ra lỗi khi lấy danh sách cuộc trò chuyện'
    })
  }
}

export const getChatDetailController = async (
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

    const chat = await getChatById(chatId, userId)

    if (!chat) {
      return res.status(404).json({
        message: 'Không tìm thấy cuộc trò chuyện'
      })
    }

    return res.status(200).json({
      chat
    })
  } catch (error) {
    console.error('Get chat detail error:', error)

    return res.status(500).json({
      message: 'Đã xảy ra lỗi khi lấy cuộc trò chuyện'
    })
  }
}

export const renameChatController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.userId
    const chatId = req.params.id as string
    const { title } = req.body

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

    const chat = await renameChat(
      chatId,
      userId,
      title
    )

    if (!chat) {
      return res.status(404).json({
        message: 'Không tìm thấy cuộc trò chuyện'
      })
    }

    return res.status(200).json({
      message: 'Đổi tên cuộc trò chuyện thành công',
      chat
    })
  } catch (error) {
    console.error('Rename chat error:', error)

    return res.status(500).json({
      message: 'Đã xảy ra lỗi khi đổi tên cuộc trò chuyện'
    })
  }
}

export const deleteChatController = async (
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

    const chat = await deleteChat(
      chatId,
      userId
    )

    if (!chat) {
      return res.status(404).json({
        message: 'Không tìm thấy cuộc trò chuyện'
      })
    }

    return res.status(200).json({
      message: 'Xóa cuộc trò chuyện thành công'
    })
  } catch (error) {
    console.error('Delete chat error:', error)

    return res.status(500).json({
      message: 'Đã xảy ra lỗi khi xóa cuộc trò chuyện'
    })
  }
}