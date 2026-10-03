import { GoogleGenAI } from '@google/genai'
import { prisma } from '../src/lib/prisma.js'

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
})

async function embedText(text: string): Promise<number[]> {
  const response = await ai.models.embedContent({
    model: 'gemini-embedding-2',
    contents: text,
    config: {
      outputDimensionality: 768,
    },
  })

  const values = response.embeddings?.[0]?.values

  if (!values) {
    throw new Error('Không nhận được embedding từ Gemini.')
  }

  return values
}

async function main() {
  const queries = [
    'Gói Miễn phí có hạn mức bao nhiêu tin nhắn mỗi ngày?',
    'Người dùng có thể tải file có kích thước tối đa bao nhiêu?',
    'Khi nào tài khoản có thể bị khóa?',
  ]

  for (const query of queries) {
    console.log('\n================================')
    console.log('Query:', query)

    const queryEmbedding = await embedText(query)

    console.log('Số chiều query embedding:', queryEmbedding.length)

    const results = await prisma.$queryRaw<
      Array<{
        id: string
        content: string
        chunkIndex: number
        distance: number
      }>
    >`
      SELECT
        "id",
        "content",
        "chunkIndex",
        "embedding" <=> ${JSON.stringify(queryEmbedding)}::vector AS distance
      FROM "DocumentChunk"
      WHERE "embedding" IS NOT NULL
      ORDER BY "embedding" <=> ${JSON.stringify(queryEmbedding)}::vector
      LIMIT 3
    `

    console.log('Kết quả:')

    for (const result of results) {
      console.log(`\n--- Chunk ${result.chunkIndex} ---`)
      console.log('Distance:', result.distance)
      console.log(result.content)
    }
  }
}

main()
  .catch((err) => {
    console.error('Lỗi khi chạy semantic search:', err)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })