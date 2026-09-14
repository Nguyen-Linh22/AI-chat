import express from 'express'

const app = express()

const PORT = 3000

app.get('/', (_req, res) => {
  res.json({
    message: 'AI Chat Clone Backend is running!'
  })
})

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})