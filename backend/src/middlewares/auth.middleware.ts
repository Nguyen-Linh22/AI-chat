import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies?.token

  if (!token) {
    return res.status(401).json({
      message: 'Bạn chưa đăng nhập'
    })
  }

  const jwtSecret = process.env.JWT_SECRET

  if (!jwtSecret) {
    console.error('JWT_SECRET chưa được cấu hình')

    return res.status(500).json({
      message: 'Server chưa được cấu hình JWT'
    })
  }

  try {
  const payload = jwt.verify(token, jwtSecret)

  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('userId' in payload)
  ) {
    return res.status(401).json({
      message: 'Token không hợp lệ'
    })
  }

  req.userId = String(payload.userId)

  console.log('Authenticated user:', req.userId)

  next()
} catch (error) {
  return res.status(401).json({
    message: 'Token không hợp lệ hoặc đã hết hạn'
  })
}
}