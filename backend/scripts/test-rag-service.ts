import {
  semanticSearch,
  buildContext,
  buildRagPrompt
} from '../src/rag/rag.service.js'

const query = 'Gói Miễn phí có hạn mức bao nhiêu tin nhắn mỗi ngày?'

const results = await semanticSearch(query, 3)

const context = buildContext(results)

const prompt = buildRagPrompt(query, context)

console.log('\n===== RAG PROMPT =====')
console.log(prompt)

console.log('\n===== CONTEXT =====')
console.log(context)

console.log('Query:', query)
console.log('Số kết quả:', results.length)

for (const result of results) {
  console.log(`\n--- Chunk ${result.chunkIndex} ---`)
  console.log('Distance:', result.distance)
  console.log(result.content)
}