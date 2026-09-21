import { Router } from 'express'

const router = Router()

router.get('/test', (_req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  res.flushHeaders()

  res.write(`data: Hello from SSE\n\n`)
  res.write(`data: SSE is working\n\n`)

  res.end()
})

export default router