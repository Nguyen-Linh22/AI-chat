import 'dotenv/config'
import app from './app.js'
import { ensureUploadDir, cleanupTempUploads } from './config/upload.config.js'

ensureUploadDir()
cleanupTempUploads()

const PORT = process.env.PORT || 3000

export const handleUnhandledRejection = (
  reason: unknown,
  promise?: Promise<unknown>
) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
}

let isTerminating = false
export const handleUncaughtException = (error: Error) => {
  console.error('Uncaught Exception thrown:', error)
  if (!isTerminating) {
    isTerminating = true
    process.exit(1)
  }
}

process.on('unhandledRejection', handleUnhandledRejection)
process.on('uncaughtException', handleUncaughtException)

const server = app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})

export default server