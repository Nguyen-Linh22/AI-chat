import express from 'express'
import healthRouter from './routes/health.routes.js'
import authRouter from './routes/auth.routes.js'
import { loggerMiddleware } from './middlewares/logger.middleware.js'
import cookieParser from 'cookie-parser'
import chatRouter from './routes/chat.routes.js'
import messageRouter from './routes/message.routes.js'
import uploadRouter from './routes/upload.routes.js'

const app = express()

app.use(express.json())
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

export default app