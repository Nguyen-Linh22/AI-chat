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
  getChatDetailController
)

router.patch(
  '/:id',
  authMiddleware,
  validate(renameChatSchema),
  renameChatController
)

router.delete(
  '/:id',
  authMiddleware,
  deleteChatController
)

export default router