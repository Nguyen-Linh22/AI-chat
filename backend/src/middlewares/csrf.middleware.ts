import { Request, Response, NextFunction } from 'express'
import { getAllowedOrigins } from '../config/cors.config.js'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/**
 * Trích xuất origin từ header request (Origin hoặc fallback Referer).
 */
const extractOrigin = (req: Request): string | null => {
  const originHeader = req.headers['origin']
  if (typeof originHeader === 'string' && originHeader.trim()) {
    try {
      return new URL(originHeader).origin
    } catch {
      return originHeader.trim().replace(/\/$/, '')
    }
  }

  const refererHeader = req.headers['referer']
  if (typeof refererHeader === 'string' && refererHeader.trim()) {
    try {
      return new URL(refererHeader).origin
    } catch {
      // Bỏ qua nếu định dạng referer không hợp lệ
    }
  }

  return null
}

/**
 * Middleware bảo vệ CSRF bằng Origin Validation tại application layer.
 * Áp dụng cho các phương thức có khả năng thay đổi trạng thái (POST, PATCH, DELETE, PUT).
 */
export const csrfProtectionMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 1. Cho phép các phương thức an toàn (GET, HEAD, OPTIONS)
  if (SAFE_METHODS.has(req.method.toUpperCase())) {
    return next()
  }

  const requestOrigin = extractOrigin(req)
  const allowedOrigins = getAllowedOrigins().map((origin) =>
    origin.replace(/\/$/, '')
  )
  const isProduction = process.env.NODE_ENV === 'production'

  // 2. Nếu request có Origin / Referer, bắt buộc phải nằm trong allowlist
  if (requestOrigin) {
    const isAllowed = allowedOrigins.includes(requestOrigin)
    if (!isAllowed) {
      console.warn(
        `CSRF blocked: method=${req.method} path=${req.originalUrl || req.path} origin=${requestOrigin}`
      )
      return res.status(403).json({
        message: 'CSRF protection: Nguồn gốc yêu cầu không hợp lệ'
      })
    }
    return next()
  }

  // 3. Nếu request không có header Origin / Referer:
  // - Trong production: Từ chối các request thay đổi trạng thái để phòng chống tấn công qua script/form ẩn danh.
  if (isProduction) {
    console.warn(
      `CSRF blocked: method=${req.method} path=${req.originalUrl || req.path} origin=none`
    )
    return res.status(403).json({
      message: 'CSRF protection: Yêu cầu bị từ chối do thiếu header nguồn gốc'
    })
  }

  // - Trong development/test: Cho phép để hỗ trợ công cụ dev, curl và các bài test tự động (supertest).
  return next()
}
