import { Router } from 'express'
import {
  register,
  login,
  me,
  logout,
  googleAuth
} from '../controllers/auth.controller.js'
import { validate } from '../middlewares/validate.middleware.js'
import {
  registerSchema,
  loginSchema,
  googleAuthSchema
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

router.post(
  '/google',
  authRateLimiter,
  validate(googleAuthSchema),
  googleAuth
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