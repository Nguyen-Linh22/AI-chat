import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import helmet from 'helmet'

import healthRouter from './routes/health.routes.js'
import authRouter from './routes/auth.routes.js'
import chatRouter from './routes/chat.routes.js'
import messageRouter from './routes/message.routes.js'
import { loggerMiddleware } from './middlewares/logger.middleware.js'
import uploadRouter from './routes/upload.routes.js'
import aiRouter from './routes/ai.routes.js'
import { errorHandler } from './middlewares/error.middleware.js'

const app = express()

const isProduction = process.env.NODE_ENV === 'production'

if (isProduction || process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1)
}

app.disable('x-powered-by')

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'none'"],
        styleSrc: ["'none'"],
        imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
        connectSrc: ["'self'"],
        frameAncestors: ["'none'"]
      }
    },
    frameguard: {
      action: 'deny'
    },
    referrerPolicy: {
      policy: 'no-referrer'
    },
    hsts: isProduction
      ? {
          maxAge: 31536000,
          includeSubDomains: true
        }
      : false,
    crossOriginResourcePolicy: {
      policy: 'cross-origin'
    },
    crossOriginOpenerPolicy: {
      policy: 'same-origin'
    }
  })
)

app.use((_req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  next()
})

export const getAllowedOrigins = (): string[] => {
  if (process.env.FRONTEND_URL) {
    return [process.env.FRONTEND_URL]
  }
  return process.env.NODE_ENV === 'production' ? [] : ['http://localhost:5173']
}

app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = getAllowedOrigins()
      if (!origin || allowed.includes(origin)) {
        return callback(null, true)
      }
      return callback(null, false)
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type'],
    maxAge: 86400
  })
)

app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))
app.use(cookieParser())
app.use(loggerMiddleware)

app.get('/', (_req, res) => {
  res.json({
    message: 'AI Chat Clone Backend is running!'
  })
})

app.use('/api', healthRouter)
app.use('/api/auth', authRouter)
app.use('/api/chats', chatRouter)
app.use('/api/chats', messageRouter)
app.use('/api/uploads', uploadRouter)
app.use('/api/ai', aiRouter)

// Fallback 404 JSON cho các endpoint không tồn tại
app.use((_req, res) => {
  res.status(404).json({
    message: 'Không tìm thấy tài nguyên yêu cầu'
  })
})

// Error handling middleware cho body parser và các lỗi hệ thống
app.use(errorHandler)

export default app