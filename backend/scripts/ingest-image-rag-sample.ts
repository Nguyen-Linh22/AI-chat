import { GoogleGenAI } from '@google/genai'
import { prisma } from '../src/lib/prisma.js'

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
})

const SAMPLE_DOC_NAME = '[Sample Knowledge] Sơ đồ kiến trúc AI Chat'
const SAMPLE_IMAGE_URL =
  'https://res.cloudinary.com/zcjbxmc5/image/upload/v1791342496/ai_chat_architecture_diagram.png'
const SAMPLE_CONTENT =
  'Đây là sơ đồ kiến trúc hệ thống AI Chat. Sơ đồ thể hiện Frontend kết nối với Backend API, Backend sử dụng PostgreSQL/pgvector để lưu trữ và tìm kiếm knowledge, sau đó gửi context liên quan tới AI Provider.'

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
    throw new Error('Không nhận được embedding từ Gemini API.')
  }

  return values
}

export async function ingestImageRagSample() {
  console.log('=== BẮT ĐẦU INGEST IMAGE RAG SAMPLE KNOWLEDGE ===')

  // 1. Tìm hoặc tạo Document
  let doc = await prisma.document.findFirst({
    where: { name: SAMPLE_DOC_NAME },
  })

  let isNewDoc = false
  if (!doc) {
    console.log(`Tạo Document mới: "${SAMPLE_DOC_NAME}"...`)
    doc = await prisma.document.create({
      data: {
        name: SAMPLE_DOC_NAME,
        mimeType: 'text/markdown',
        size: BigInt(Buffer.byteLength(SAMPLE_CONTENT, 'utf-8')),
        storageUrl: 'sample/architecture-diagram.md',
        status: 'READY',
      },
    })
    isNewDoc = true
    console.log('Tạo Document thành công, ID:', doc.id)
  } else {
    console.log(`Document đã tồn tại (ID: ${doc.id}), kiểm tra các chunks...`)
  }

  // 2. Tìm hoặc tạo DocumentChunk (Idempotent)
  let chunk = await prisma.documentChunk.findFirst({
    where: {
      documentId: doc.id,
      chunkIndex: 0,
    },
  })

  let isNewChunk = false

  try {
    if (!chunk) {
      console.log('Tạo DocumentChunk mới cho sơ đồ kiến trúc...')
      chunk = await prisma.documentChunk.create({
        data: {
          documentId: doc.id,
          chunkIndex: 0,
          content: SAMPLE_CONTENT,
          imageUrl: SAMPLE_IMAGE_URL,
        },
      })
      isNewChunk = true
      console.log('Tạo DocumentChunk thành công, ID:', chunk.id)
    } else {
      console.log(`DocumentChunk đã tồn tại (ID: ${chunk.id}). Đồng bộ content và imageUrl...`)
      chunk = await prisma.documentChunk.update({
        where: { id: chunk.id },
        data: {
          content: SAMPLE_CONTENT,
          imageUrl: SAMPLE_IMAGE_URL,
        },
      })
    }

    // 3. Kiểm tra embedding hiện có của chunk
    const existingEmbeddingCheck = await prisma.$queryRaw<
      Array<{ has_embedding: boolean }>
    >`
      SELECT ("embedding" IS NOT NULL) AS has_embedding
      FROM "DocumentChunk"
      WHERE "id" = ${chunk.id}::uuid
    `

    const alreadyEmbedded = existingEmbeddingCheck[0]?.has_embedding === true

    if (!alreadyEmbedded) {
      console.log('Tạo vector embedding (768 dimensions) qua Gemini API...')
      const embedding = await embedText(SAMPLE_CONTENT)
      console.log(`Đã tạo vector embedding với độ dài: ${embedding.length}`)

      await prisma.$executeRaw`
        UPDATE "DocumentChunk"
        SET "embedding" = ${JSON.stringify(embedding)}::vector
        WHERE "id" = ${chunk.id}::uuid
      `
      console.log('Đã lưu vector embedding vào pgvector thành công!')
    } else {
      console.log('Vector embedding đã tồn tại trong pgvector, không cần tính toán lại.')
    }

    // 4. Xác thực dữ liệu hoàn chỉnh trong DB
    const verification = await prisma.$queryRaw<
      Array<{
        id: string
        documentId: string
        chunkIndex: number
        content: string
        imageUrl: string | null
        has_embedding: boolean
      }>
    >`
      SELECT
        "id",
        "documentId",
        "chunkIndex",
        "content",
        "imageUrl",
        ("embedding" IS NOT NULL) AS has_embedding
      FROM "DocumentChunk"
      WHERE "id" = ${chunk.id}::uuid
    `

    const verifiedChunk = verification[0]

    console.log('\n=== KẾT QUẢ INGESTION ===')
    console.log('Document ID:', doc.id)
    console.log('Document Name:', doc.name)
    console.log('Chunk ID:', verifiedChunk?.id)
    console.log('Chunk Index:', verifiedChunk?.chunkIndex)
    console.log('Chunk Image URL:', verifiedChunk?.imageUrl)
    console.log('Has Embedding:', verifiedChunk?.has_embedding)
    console.log('Idempotent Action:', isNewDoc ? 'Created Doc' : 'Reused Doc', '|', isNewChunk ? 'Created Chunk' : 'Reused Chunk')
    console.log('=========================\n')

    return {
      doc,
      chunk: verifiedChunk,
    }
  } catch (error) {
    console.error('LỖI TRONG QUÁ TRÌNH INGESTION:', error)
    // Rollback an toàn nếu vừa tạo chunk mới mà bước embedding lỗi
    if (isNewChunk && chunk) {
      console.log('Đang dọn dẹp DocumentChunk bị lỗi...')
      await prisma.documentChunk.delete({ where: { id: chunk.id } }).catch(() => {})
    }
    if (isNewDoc && doc) {
      console.log('Đang dọn dẹp Document bị lỗi...')
      await prisma.document.delete({ where: { id: doc.id } }).catch(() => {})
    }
    throw error
  }
}

// Chạy trực tiếp khi execute bằng CLI
if (process.argv[1]?.includes('ingest-image-rag-sample')) {
  ingestImageRagSample()
    .catch((err) => {
      console.error('Lỗi thực thi script:', err)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
