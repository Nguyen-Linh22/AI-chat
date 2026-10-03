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

const document = await prisma.document.findFirst({
  orderBy: {
    createdAt: 'desc',
  },
})

if (!document) {
  throw new Error('Không tìm thấy Document.')
}

const chunks = await prisma.documentChunk.findMany({
  where: {
    documentId: document.id,
  },
  orderBy: {
    chunkIndex: 'asc',
  },
})

console.log(`Tìm thấy ${chunks.length} chunks.`)

for (const chunk of chunks) {
  const embedding = await embedText(chunk.content)

  console.log(
    `Chunk ${chunk.chunkIndex}: ${embedding.length} dimensions`,
  )

  await prisma.$executeRaw`
    UPDATE "DocumentChunk"
    SET "embedding" = ${JSON.stringify(embedding)}::vector
    WHERE "id" = ${chunk.id}::uuid
  `

  console.log(
    `Đã lưu embedding cho chunk ${chunk.chunkIndex}.`,
  )
}
const result = await prisma.$queryRaw<
  Array<{
    total: bigint
    embedded: bigint
  }>
>`
  SELECT
    COUNT(*) AS total,
    COUNT("embedding") AS embedded
  FROM "DocumentChunk"
  WHERE "documentId" = ${document.id}::uuid
`

console.log('Kiểm tra database:')
console.log('Tổng chunks:', result[0]?.total.toString())
console.log('Chunks có embedding:', result[0]?.embedded.toString())