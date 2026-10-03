import {
  semanticSearch,
  buildContext,
  buildRagPrompt,
} from '../src/rag/rag.service.js'
import { generateAIResponse } from '../src/ai/ai.service.js'

const questions = [
  'Gói Miễn phí có hạn mức bao nhiêu tin nhắn mỗi ngày?',
  'Người dùng có thể tải file có kích thước tối đa bao nhiêu?',
  'Tài liệu có quy định gì về việc khóa tài khoản?',
]

for (const question of questions) {
  console.log('\n========================================')
  console.log('QUESTION:')
  console.log(question)

  const results = await semanticSearch(question, 3)

  console.log('\nTOP CHUNKS:')
  for (const result of results) {
    console.log(
      `Chunk ${result.chunkIndex} | distance: ${result.distance}`,
    )
  }

  const context = buildContext(results)

  const prompt = buildRagPrompt(question, context)

  const answer = await generateAIResponse(
    prompt,
    'gemini-3.6-flash',
    'gemini',
  )

  console.log('\nAI ANSWER:')
  console.log(answer)
}