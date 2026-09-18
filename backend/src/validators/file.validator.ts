import { Request, Response, NextFunction } from 'express'
import fs from 'fs'

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'image/png',
  'image/jpeg'
]

const deleteUploadedFile = (filePath: string) => {
  try {
    fs.unlinkSync(filePath)
  } catch (error) {
    console.error('Không thể xóa file:', error)
  }
}

export const validateUploadedFile = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.file) {
    return res.status(400).json({
      message: 'Chưa có file'
    })
  }

  if (!req.file.originalname.trim()) {
    deleteUploadedFile(req.file.path)

    return res.status(400).json({
      message: 'Tên file không hợp lệ'
    })
  }

  if (req.file.size === 0) {
    deleteUploadedFile(req.file.path)

    return res.status(400).json({
      message: 'File không được rỗng'
    })
  }

  if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
    deleteUploadedFile(req.file.path)

    return res.status(415).json({
      message: 'Loại file không được hỗ trợ',
      mimetype: req.file.mimetype
    })
  }

  next()
}