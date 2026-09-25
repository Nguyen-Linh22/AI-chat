import type { Request, Response, NextFunction } from 'express'

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // 413 Payload Too Large (vượt quá giới hạn 1mb của express.json)
  if (err.type === 'entity.too.large' || err.status === 413) {
    return res.status(413).json({
      message: 'Request body quá lớn'
    })
  }

  // 400 Bad Request cho cú pháp JSON bị lỗi (malformed JSON)
  if (
    err instanceof SyntaxError &&
    'status' in err &&
    err.status === 400 &&
    'body' in err
  ) {
    return res.status(400).json({
      message: 'Định dạng JSON không hợp lệ'
    })
  }

  console.error('Unhandled Express error:', err)

  // Kiểm tra xem lỗi có liên quan tới Prisma / Database hay không
  const isDatabaseOrPrismaError =
    err?.name?.includes('Prisma') ||
    (typeof err?.code === 'string' && /^P\d{4}$/.test(err.code)) ||
    err?.clientVersion !== undefined

  if (isDatabaseOrPrismaError) {
    return res.status(500).json({
      message: 'Đã xảy ra lỗi máy chủ.'
    })
  }

  const statusCode =
    typeof err.status === 'number' && err.status >= 400 && err.status < 500
      ? err.status
      : 500

  const clientMessage =
    statusCode < 500
      ? err.message || 'Lỗi yêu cầu'
      : 'Đã xảy ra lỗi máy chủ.'

  return res.status(statusCode).json({
    message: clientMessage
  })
}
