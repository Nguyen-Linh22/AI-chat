import { GoogleGenAI } from '@google/genai'
import { prisma } from '../lib/prisma.js'

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

export async function semanticSearch(
  query: string,
  limit = 3,
) {
  const queryEmbedding = await embedText(query)

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
    LIMIT ${limit}
  `

  return results
}

export function buildContext(
  results: Array<{
    content: string
    chunkIndex: number
  }>,
): string {
  return results
    .map(
      (result) =>
        `[Chunk ${result.chunkIndex}]\n${result.content}`,
    )
    .join('\n\n')
}

export function buildRagPrompt(
  question: string,
  context: string,
): string {
  return `Hãy trả lời câu hỏi dựa trên thông tin trong CONTEXT bên dưới.

Nếu CONTEXT không chứa đủ thông tin để trả lời, hãy nói rằng không tìm thấy thông tin phù hợp trong tài liệu.

CONTEXT:
${context}

CÂU HỎI:
${question}
`
}