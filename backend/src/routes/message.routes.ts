import { Router } from 'express'

import {
  createMessageController,
  getMessagesController,
  deleteMessageController
} from '../controllers/message.controller.js'

import {
  regenerateMessage
} from '../controllers/regenerate.controller.js'

import { streamChatResponse } from '../controllers/stream.controller.js'

import { authMiddleware } from '../middlewares/auth.middleware.js'

import { validate } from '../middlewares/validate.middleware.js'

import { createMessageSchema } from '../validators/message.validator.js'

import { uploadSingleFile } from '../middlewares/upload.middleware.js'

const router = Router()

router.post(
  '/:id/messages/stream',
  authMiddleware,
  uploadSingleFile,
  streamChatResponse
)

router.post(
  '/:id/messages/:messageId/regenerate',
  authMiddleware,
  regenerateMessage
)

router.post(
  '/:id/messages',
  authMiddleware,
  validate(createMessageSchema),
  createMessageController
)

router.get(
  '/:id/messages',
  authMiddleware,
  getMessagesController
)

router.delete(
  '/:chatId/messages/:messageId',
  authMiddleware,
  deleteMessageController
)

export default router