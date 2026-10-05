import { rateLimit, ipKeyGenerator } from 'express-rate-limit'
import { Request, Response, NextFunction } from 'express'
import { logRateLimitExceeded } from '../utils/ai-audit.util.js'
import { safeDeleteFile } from '../utils/file.util.js'

/**
 * Rate limiter chung bảo vệ toàn bộ API (General API protection).
 * Bảo vệ server Render Free, database connection pool (đặc biệt là GET /api/health)
 * và chống các hành vi spam/crawler diện rộng.
 * Giới hạn: 300 requests / 15 phút theo IP nguồn.
 */
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  limit: 300, // tối đa 300 requests / 15 phút / IP
  standardHeaders: true, // Thêm RateLimit-* headers chuẩn RFC
  legacyHeaders: false, // Bỏ X-RateLimit-* cũ
  message: {
    message: 'Quá nhiều yêu cầu từ địa chỉ IP này. Vui lòng thử lại sau.'
  },
  handler: (req: Request, res: Response, _next, options) => {
    logRateLimitExceeded({
      route: req.originalUrl || req.path,
      ip: req.ip || req.socket.remoteAddress
    })
    res.status(options.statusCode).json(options.message)
  }
})

/**
 * Rate limiter cho các endpoint xác thực (Auth: Login, Register).
 * Chống brute-force mật khẩu, credential stuffing và flood tạo tài khoản.
 * Giới hạn: 10 requests / 15 phút theo IP nguồn.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  limit: 10, // tối đa 10 requests / 15 phút / IP
  standardHeaders: true, // Thêm RateLimit-* headers chuẩn RFC
  legacyHeaders: false, // Bỏ X-RateLimit-* cũ
  message: {
    message: 'Quá nhiều lượt thử đăng nhập hoặc đăng ký. Vui lòng thử lại sau 15 phút.'
  },
  handler: (req: Request, res: Response, _next, options) => {
    logRateLimitExceeded({
      route: req.originalUrl || req.path,
      ip: req.ip || req.socket.remoteAddress
    })
    res.status(options.statusCode).json(options.message)
  }
})

/**
 * Rate limiter cho các endpoint xử lý AI (Chat message, Stream SSE, Regenerate).
 * Chống spam request AI, bảo vệ quota token LLM và tài nguyên server.
 * Giới hạn: 15 requests / 1 phút theo User ID (hoặc IP nếu chưa qua auth).
 */
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  limit: 15, // tối đa 15 requests / phút / user
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    // Ưu tiên định danh theo userId của user đã đăng nhập
    if (req.userId) {
      return `user_${req.userId}`
    }
    // Fallback theo chuẩn IP an toàn (hỗ trợ cả IPv4 và IPv6)
    const rawIp = req.ip || req.socket.remoteAddress || 'anonymous'
    return ipKeyGenerator(rawIp)
  },
  message: {
    message: 'Bạn đang gửi yêu cầu AI quá nhanh. Vui lòng chờ giây lát trước khi tiếp tục.'
  },
  handler: (req: Request, res: Response, _next, options) => {
    logRateLimitExceeded({
      route: req.originalUrl || req.path,
      userId: req.userId,
      ip: req.ip || req.socket.remoteAddress
    })
    res.status(options.statusCode).json(options.message)
  }
})

/**
 * Rate limiter cho các endpoint upload file đính kèm.
 * Chống spam upload, bảo vệ dung lượng đĩa tạm thời, RAM và Cloudinary quota.
 * Giới hạn: 10 requests / 15 phút theo User ID (hoặc IP nếu chưa qua auth).
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  limit: 10, // tối đa 10 requests / 15 phút / user
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    // Ưu tiên định danh theo userId của user đã đăng nhập
    if (req.userId) {
      return `user_${req.userId}`
    }
    // Fallback theo chuẩn IP an toàn (hỗ trợ cả IPv4 và IPv6)
    const rawIp = req.ip || req.socket.remoteAddress || 'anonymous'
    return ipKeyGenerator(rawIp)
  },
  message: {
    message: 'Bạn đã tải lên quá nhiều file. Vui lòng thử lại sau 15 phút.'
  },
  handler: (req: Request, res: Response, _next, options) => {
    if (req.file?.path) {
      safeDeleteFile(req.file.path)
    }
    logRateLimitExceeded({
      route: req.originalUrl || req.path,
      userId: req.userId,
      ip: req.ip || req.socket.remoteAddress
    })
    res.status(options.statusCode).json(options.message)
  }
})

/**
 * Rate limiter có điều kiện cho upload file trong stream endpoint.
 * Nếu request có chứa file (req.file tồn tại sau khi qua multer),
 * áp dụng uploadRateLimiter. Nếu không có file, cho qua next().
 */
export const conditionalUploadRateLimiter = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.file) {
    return next()
  }
  return uploadRateLimiter(req, res, next)
}

/**
 * Quản lý số lượng yêu cầu AI đang xử lý đồng thời trên mỗi user.
 * Chống tình huống một user mở nhiều luồng stream/chat song song làm cạn kiệt tài nguyên server.
 * Giới hạn: tối đa 1 yêu cầu AI đang hoạt động cùng lúc trên mỗi user.
 */
const activeAIRequests = new Map<string, number>()
export const MAX_CONCURRENT_AI_REQUESTS = 1

export const concurrentAiLimiter = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.userId
  if (!userId) {
    return next()
  }

  const currentCount = activeAIRequests.get(userId) || 0
  if (currentCount >= MAX_CONCURRENT_AI_REQUESTS) {
    logRateLimitExceeded({
      route: req.originalUrl || req.path,
      userId,
      ip: req.ip || req.socket.remoteAddress
    })
    return res.status(429).json({
      message: 'Bạn đang có một yêu cầu AI đang xử lý. Vui lòng chờ phản hồi hiện tại hoàn thành trước khi gửi tiếp.'
    })
  }

  activeAIRequests.set(userId, currentCount + 1)

  let released = false
  const release = () => {
    if (released) return
    released = true

    const count = activeAIRequests.get(userId) || 1
    if (count <= 1) {
      activeAIRequests.delete(userId)
    } else {
      activeAIRequests.set(userId, count - 1)
    }
  }

  res.on('finish', release)
  res.on('close', release)

  next()
}

/**
 * Trả về số lượng AI request đang chạy của user (dùng cho testing/monitoring)
 */
export const getActiveAIRequestCount = (userId: string): number => {
  return activeAIRequests.get(userId) || 0
}

/**
 * Xóa toàn bộ active tracking (dùng cho unit test cleanup)
 */
export const clearActiveAIRequests = (): void => {
  activeAIRequests.clear()
}
