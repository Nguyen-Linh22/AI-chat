import { Request, Response, NextFunction } from 'express'

export const loggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now()

  res.on('finish', () => {
    const durationMs = Date.now() - start
    const url = req.originalUrl || req.url
    console.log(`${req.method} ${url} ${res.statusCode} ${durationMs}ms`)
  })

  next()
}