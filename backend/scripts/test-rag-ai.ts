import {
  semanticSearch,
  buildContext,
  buildRagPrompt,
} from '../src/rag/rag.service.js'
import { generateAIResponse } from '../src/ai/ai.service.js'

const question =
  'Gói Miễn phí có hạn mức bao nhiêu tin nhắn mỗi ngày?'

const results = await semanticSearch(question, 3)

const context = buildContext(results)

const prompt = buildRagPrompt(question, context)

console.log('===== QUESTION =====')
console.log(question)

console.log('\n===== RAG PROMPT =====')
console.log(prompt)

const answer = await generateAIResponse(
  prompt,
  'gemini-3.6-flash',
  'gemini',
)

console.log('\n===== AI ANSWER =====')
console.log(answer)