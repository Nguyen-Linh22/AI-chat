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

import {
  createMessageSchema,
  streamMessageSchema,
  regenerateMessageSchema
} from '../validators/message.validator.js'
import {
  chatIdParamsSchema,
  chatMessageParamsSchema,
  deleteMessageParamsSchema
} from '../validators/params.validator.js'
import { paginationQuerySchema } from '../validators/pagination.validator.js'

import { uploadSingleFile } from '../middlewares/upload.middleware.js'
import { validateUploadedFile } from '../validators/file.validator.js'
import {
  aiRateLimiter,
  concurrentAiLimiter,
  conditionalUploadRateLimiter
} from '../middlewares/rate-limit.middleware.js'

const router = Router()

router.post(
  '/:id/messages/stream',
  authMiddleware,
  concurrentAiLimiter,
  aiRateLimiter,
  validate(chatIdParamsSchema, 'params'),
  uploadSingleFile,
  conditionalUploadRateLimiter,
  validate(streamMessageSchema, 'body'),
  validateUploadedFile,
  streamChatResponse
)

router.post(
  '/:id/messages/:messageId/regenerate',
  authMiddleware,
  concurrentAiLimiter,
  aiRateLimiter,
  validate(chatMessageParamsSchema, 'params'),
  validate(regenerateMessageSchema, 'body'),
  regenerateMessage
)

router.post(
  '/:id/messages',
  authMiddleware,
  concurrentAiLimiter,
  aiRateLimiter,
  validate(chatIdParamsSchema, 'params'),
  validate(createMessageSchema),
  createMessageController
)

router.get(
  '/:id/messages',
  authMiddleware,
  validate(chatIdParamsSchema, 'params'),
  validate(paginationQuerySchema, 'query'),
  getMessagesController
)

router.delete(
  '/:chatId/messages/:messageId',
  authMiddleware,
  validate(deleteMessageParamsSchema, 'params'),
  deleteMessageController
)

export default router