import { Router } from 'express'

import { uploadSingleFile } from '../middlewares/upload.middleware.js'
import { validateUploadedFile } from '../validators/file.validator.js'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { createAttachmentController } from '../controllers/attachment.controller.js'

const router = Router()

router.post(
  '/test',
  uploadSingleFile,
  validateUploadedFile,
  (req, res) => {
    return res.status(200).json({
      message: 'Upload file thành công',
      file: {
        originalname: req.file!.originalname,
        filename: req.file!.filename,
        mimetype: req.file!.mimetype,
        size: req.file!.size,
        path: req.file!.path
      }
    })
  }
)

router.post(
  '/:messageId',
  authMiddleware,
  uploadSingleFile,
  validateUploadedFile,
  createAttachmentController
)

export default router