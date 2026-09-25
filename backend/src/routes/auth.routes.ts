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

import { authRateLimiter } from '../middlewares/rate-limit.middleware.js'

const router = Router()

router.post(
  '/register',
  authRateLimiter,
  validate(registerSchema),
  register
)

router.post(
  '/login',
  authRateLimiter,
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