import { Router } from 'express'

import { uploadSingleFile } from '../middlewares/upload.middleware.js'
import { validateUploadedFile } from '../validators/file.validator.js'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { createAttachmentController } from '../controllers/attachment.controller.js'
import { validate } from '../middlewares/validate.middleware.js'
import { messageIdParamsSchema } from '../validators/params.validator.js'
import { uploadRateLimiter } from '../middlewares/rate-limit.middleware.js'

const router = Router()

router.post(
  '/:messageId',
  authMiddleware,
  validate(messageIdParamsSchema, 'params'),
  uploadRateLimiter,
  uploadSingleFile,
  validateUploadedFile,
  createAttachmentController
)

export default router