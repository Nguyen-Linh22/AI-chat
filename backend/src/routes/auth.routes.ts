import { Router } from 'express'
import {
  register,
  login,
  me,
  logout
} from '../controllers/auth.controller.js'
import { validate } from '../middlewares/validate.middleware.js'
import {
  registerSchema,
  loginSchema
} from '../validators/auth.validator.js'
import { authMiddleware } from '../middlewares/auth.middleware.js'

const router = Router()

router.post(
  '/register',
  validate(registerSchema),
  register
)

router.post(
  '/login',
  validate(loginSchema),
  login
)

router.get(
  '/me',
  authMiddleware,
  me
)

router.post(
  '/logout',
  authMiddleware,
  logout
)

export default router