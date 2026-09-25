import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'

export const authMiddleware = async (
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
    const payload = jwt.verify(token, jwtSecret, {
      algorithms: ['HS256']
    })

    if (
      typeof payload !== 'object' ||
      payload === null ||
      !('userId' in payload)
    ) {
      return res.status(401).json({
        message: 'Token không hợp lệ'
      })
    }

    const tokenPayload = payload as {
      userId: string
      tokenVersion?: number
    }

    const user = await prisma.user.findUnique({
      where: {
        id: String(tokenPayload.userId)
      },
      select: {
        id: true,
        tokenVersion: true
      }
    })

    if (!user || user.tokenVersion !== tokenPayload.tokenVersion) {
      return res.status(401).json({
        message: 'Phiên đăng nhập đã hết hạn hoặc đã bị thu hồi'
      })
    }

    req.userId = user.id

    next()
  } catch (error) {
    return res.status(401).json({
      message: 'Token không hợp lệ hoặc đã hết hạn'
    })
  }
}