import 'dotenv/config'
import app from './app.js'
import { ensureUploadDir } from './config/upload.config.js'

ensureUploadDir()

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})