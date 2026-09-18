import multer from 'multer'
import { Request, Response, NextFunction } from 'express'
import path from 'path'

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'uploads/')
  },

  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`

    cb(null, uniqueName)
  }
})

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
})

export const uploadSingleFile = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  upload.single('file')(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          message: 'File không được vượt quá 10 MB'
        })
      }

      return res.status(400).json({
        message: 'Lỗi khi upload file',
        code: error.code
      })
    }

    if (error) {
      console.error('Upload error:', error)

      return res.status(400).json({
        message: 'Lỗi khi upload file'
      })
    }

    next()
  })
}