import { Request, Response } from 'express'
import { createAttachment } from '../services/attachment.service.js'
import { safeDeleteFile } from '../utils/file.util.js'
import { FileExtractionError } from '../services/file-extraction.service.js'

export const createAttachmentController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.userId
    const messageId = req.params.messageId as string

    if (!userId) {
      return res.status(401).json({
        message: 'Bạn chưa đăng nhập'
      })
    }

    if (!messageId) {
      return res.status(400).json({
        message: 'Message ID không hợp lệ'
      })
    }

    if (!req.file) {
      return res.status(400).json({
        message: 'Chưa có file'
      })
    }

    const attachment = await createAttachment(
      messageId,
      userId,
      req.file
    )

    if (!attachment) {
      return res.status(404).json({
        message: 'Không tìm thấy tin nhắn'
      })
    }

    return res.status(201).json({
      message: 'Upload file thành công',
      data: {
        ...attachment,
        sizeBytes: attachment.sizeBytes.toString()
      }
    })
  } catch (error) {
    console.error('Create attachment error:', error)

    if (error instanceof FileExtractionError) {
      return res.status(400).json({
        message: 'Không thể xử lý nội dung file'
      })
    }

    return res.status(500).json({
      message: 'Đã xảy ra lỗi khi lưu file'
    })
  } finally {
    safeDeleteFile(req.file?.path)
  }
}