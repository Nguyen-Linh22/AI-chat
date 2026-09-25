import { Router } from 'express'
import {
  createChatController,
  getChatsController,
  getChatDetailController,
  renameChatController,
  deleteChatController
} from '../controllers/chat.controller.js'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validate.middleware.js'
import { renameChatSchema } from '../validators/chat.validator.js'
import { chatIdParamsSchema } from '../validators/params.validator.js'

const router = Router()

router.post(
  '/',
  authMiddleware,
  createChatController
)

router.get(
  '/',
  authMiddleware,
  getChatsController
)

router.get(
  '/:id',
  authMiddleware,
  validate(chatIdParamsSchema, 'params'),
  getChatDetailController
)

router.patch(
  '/:id',
  authMiddleware,
  validate(chatIdParamsSchema, 'params'),
  validate(renameChatSchema),
  renameChatController
)

router.delete(
  '/:id',
  authMiddleware,
  validate(chatIdParamsSchema, 'params'),
  deleteChatController
)

export default router