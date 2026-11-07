import fs from 'node:fs'
import path from 'node:path'
import { GoogleGenAI } from '@google/genai'
import { prisma } from '../src/lib/prisma.js'

export const RELATIVE_POLICY_DOC_PATH =
  'data/sample-documents/quy-dinh-su-dung-va-chinh-sach-ai-chat.txt'
export const POLICY_DOC_NAME = 'quy-dinh-su-dung-va-chinh-sach-ai-chat.txt'
export const CHUNK_SIZE = 1000
export const CHUNK_OVERLAP = 200
export const EMBEDDING_MODEL = 'gemini-embedding-2'
export const EMBEDDING_DIMENSION = 768

export interface ChunkInfo {
  chunkIndex: number
  start: number
  end: number
  characterCount: number
  content: string
}

export function chunkText(
  text: string,
  chunkSize = CHUNK_SIZE,
  chunkOverlap = CHUNK_OVERLAP,
): ChunkInfo[] {
  const chunks: ChunkInfo[] = []
  let start = 0

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)
    const content = text.slice(start, end)

    chunks.push({
      chunkIndex: chunks.length,
      start,
      end,
      characterCount: end - start,
      content,
    })

    start += chunkSize - chunkOverlap
  }

  return chunks
}

export function isProductionDatabase(dbUrl?: string): boolean {
  if (process.env.NODE_ENV === 'production') return true
  if (!dbUrl) return false
  try {
    const parsed = new URL(dbUrl)
    return (
      parsed.hostname.includes('ep-gentle-dust') ||
      parsed.hostname.includes('prod') ||
      parsed.pathname.includes('prod')
    )
  } catch {
    return false
  }
}

export interface IngestPolicyOptions {
  dryRun?: boolean
  allowProduction?: boolean
  validateEmbedding?: boolean
}

export async function ingestPolicyRag(options: IngestPolicyOptions = {}) {
  const dryRun = options.dryRun ?? true
  const allowProduction = options.allowProduction ?? false
  const validateEmbedding = options.validateEmbedding ?? false

  const fullPath = path.resolve(process.cwd(), RELATIVE_POLICY_DOC_PATH)

  console.log('====================================================')
  console.log(' POLICY RAG INGESTION SCRIPT')
  console.log(` Mode: ${dryRun ? 'DRY-RUN (VALIDATION ONLY)' : 'REAL INGESTION'}`)
  console.log('====================================================\n')

  // 1. File Validation
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Tệp tài liệu chính sách không tồn tại tại: ${fullPath}`)
  }

  const fileStat = fs.statSync(fullPath)
  const fileContent = fs.readFileSync(fullPath, 'utf-8')

  if (fileContent.trim().length === 0) {
    throw new Error('Tệp tài liệu chính sách rỗng.')
  }

  const lines = fileContent.split('\n')
  console.log('1. THÔNG TIN FILE TÀI LIỆU:')
  console.log('- File path:', RELATIVE_POLICY_DOC_PATH)
  console.log('- File size:', `${fileStat.size} bytes`)
  console.log('- Character count:', fileContent.length)
  console.log('- Line count:', lines.length)

  // 2. Chunking
  const chunks = chunkText(fileContent)
  console.log('\n2. KẾT QUẢ CHUNKING:')
  console.log('- Chunk size:', CHUNK_SIZE)
  console.log('- Chunk overlap:', CHUNK_OVERLAP)
  console.log('- Tổng số chunks:', chunks.length)

  chunks.forEach((c) => {
    const preview = c.content.slice(0, 75).replace(/\n/g, ' ')
    console.log(
      `  • Chunk ${c.chunkIndex} [chars: ${c.characterCount}, start: ${c.start}, end: ${c.end}]: "${preview}..."`,
    )
  })

  // 3. Database & Production Safety Guard
  const dbUrl = process.env.DATABASE_URL
  const isProd = isProductionDatabase(dbUrl)

  if (dbUrl) {
    try {
      const parsed = new URL(dbUrl)
      console.log('\n3. KIỂM TRA MÔI TRƯỜNG DATABASE:')
      console.log('- Target Host:', parsed.hostname)
      console.log('- Database Name:', parsed.pathname.slice(1))
      console.log('- Is Production Target:', isProd ? 'YES (CAUTION)' : 'NO')
    } catch {
      console.log('\n3. Database URL: Present (Custom format)')
    }
  } else {
    console.log('\n3. DATABASE_URL: None')
  }

  if (isProd && !dryRun && !allowProduction) {
    throw new Error(
      'AN TOÀN PRODUCTION: Database đích là Production database (ep-gentle-dust) nhưng không có flag --allow-production. Ingestion bị HỦY để bảo vệ an toàn!',
    )
  }

  // 4. Dry-run Mode
  if (dryRun) {
    console.log('\n4. KẾT QUẢ DRY-RUN:')
    console.log('- Trạng thái: CHỈ KIỂM TRA (DRY-RUN), KHÔNG GHI DATABASE.')
    console.log('- Document dự kiến tạo/đồng bộ:', POLICY_DOC_NAME)
    console.log('- DocumentChunks dự kiến tạo/đồng bộ:', chunks.length)
    console.log('- Embedding model dự kiến:', EMBEDDING_MODEL)
    console.log('- Embedding dimension dự kiến:', EMBEDDING_DIMENSION)

    if (validateEmbedding && process.env.GEMINI_API_KEY) {
      console.log('\n[DRY-RUN EMBEDDING VALIDATION]: Đang kiểm tra Gemini API...')
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
      const sampleResponse = await ai.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: chunks[0].content,
        config: { outputDimensionality: EMBEDDING_DIMENSION },
      })
      const embLen = sampleResponse.embeddings?.[0]?.values?.length
      console.log(`✓ Gemini embedding API hoạt động bình thường! Vector dimension: ${embLen}`)
    } else {
      console.log('- Bỏ qua gọi Gemini API trong dry-run để tối ưu quota.')
    }

    console.log('\n====================================================')
    console.log(' DRY-RUN HOÀN THÀNH — DATABASE HOÀN TOÀN KHÔNG BỊ THAY ĐỔI')
    console.log('====================================================\n')
    return {
      mode: 'dry-run',
      documentName: POLICY_DOC_NAME,
      chunkCount: chunks.length,
      chunks,
    }
  }

  // 5. Real Ingestion Mode (Chỉ chạy khi --apply và vượt qua Safety Guard)
  console.log('\n5. THỰC THI INGESTION THẬT VÀO DATABASE...')

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  })

  // 5.1 Tìm hoặc tạo Document
  let doc = await prisma.document.findFirst({
    where: { name: POLICY_DOC_NAME },
  })

  let isNewDoc = false
  if (!doc) {
    console.log(`Tạo Document mới: "${POLICY_DOC_NAME}"...`)
    doc = await prisma.document.create({
      data: {
        name: POLICY_DOC_NAME,
        mimeType: 'text/plain',
        size: BigInt(fileStat.size),
        storageUrl: RELATIVE_POLICY_DOC_PATH,
        status: 'PROCESSING',
      },
    })
    isNewDoc = true
    console.log('Tạo Document thành công, ID:', doc.id)
  } else {
    console.log(`Document đã tồn tại (ID: ${doc.id}). Đang cập nhật metadata...`)
    doc = await prisma.document.update({
      where: { id: doc.id },
      data: {
        size: BigInt(fileStat.size),
        storageUrl: RELATIVE_POLICY_DOC_PATH,
        status: 'PROCESSING',
      },
    })
  }

  // 5.2 Đồng bộ Chunks và Embeddings (Idempotent theo chunkIndex & nhất quán content)
  console.log('\nĐang đồng bộ DocumentChunks...')
  for (const c of chunks) {
    let chunk = await prisma.documentChunk.findFirst({
      where: {
        documentId: doc.id,
        chunkIndex: c.chunkIndex,
      },
    })

    const isContentChanged = !chunk || chunk.content !== c.content

    if (!chunk) {
      console.log(`Tạo mới Chunk ${c.chunkIndex}...`)
      chunk = await prisma.documentChunk.create({
        data: {
          documentId: doc.id,
          chunkIndex: c.chunkIndex,
          content: c.content,
          imageUrl: null,
        },
      })
    } else if (isContentChanged) {
      console.log(`Chunk ${c.chunkIndex} nội dung đã thay đổi. Cập nhật nội dung mới...`)
      chunk = await prisma.documentChunk.update({
        where: { id: chunk.id },
        data: {
          content: c.content,
          imageUrl: null,
        },
      })
    } else {
      console.log(`Chunk ${c.chunkIndex} nội dung không đổi.`)
    }

    // Kiểm tra embedding hiện có
    const existingEmbeddingCheck = await prisma.$queryRaw<
      Array<{ has_embedding: boolean }>
    >`
      SELECT ("embedding" IS NOT NULL) AS has_embedding
      FROM "DocumentChunk"
      WHERE "id" = ${chunk.id}::uuid
    `

    const alreadyEmbedded = existingEmbeddingCheck[0]?.has_embedding === true
    const needsEmbedding = !alreadyEmbedded || isContentChanged

    if (needsEmbedding) {
      console.log(
        isContentChanged && alreadyEmbedded
          ? `Nội dung Chunk ${c.chunkIndex} đã đổi -> Tạo lại vector embedding mới...`
          : `Tạo vector embedding cho Chunk ${c.chunkIndex}...`,
      )
      const embRes = await ai.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: c.content,
        config: { outputDimensionality: EMBEDDING_DIMENSION },
      })
      const values = embRes.embeddings?.[0]?.values
      if (!values || values.length !== EMBEDDING_DIMENSION) {
        throw new Error(`Embedding không hợp lệ cho Chunk ${c.chunkIndex}`)
      }

      await prisma.$executeRaw`
        UPDATE "DocumentChunk"
        SET "embedding" = ${JSON.stringify(values)}::vector
        WHERE "id" = ${chunk.id}::uuid
      `
      console.log(`✓ Đã lưu embedding cho Chunk ${c.chunkIndex}.`)
    } else {
      console.log(`Chunk ${c.chunkIndex} nội dung không đổi và đã có embedding, bỏ qua tính toán lại.`)
    }
  }

  // 5.3 Prune extra chunks nếu trước đó có nhiều chunks hơn
  const extraChunks = await prisma.documentChunk.deleteMany({
    where: {
      documentId: doc.id,
      chunkIndex: { gte: chunks.length },
    },
  })
  if (extraChunks.count > 0) {
    console.log(`Đã dọn dẹp ${extraChunks.count} chunks thừa cũ.`)
  }

  // 5.4 Cập nhật Document status = READY
  await prisma.document.update({
    where: { id: doc.id },
    data: { status: 'READY' },
  })

  console.log('\n====================================================')
  console.log(' REAL INGESTION HOÀN THÀNH THÀNH CÔNG!')
  console.log(` Document: ${doc.name} (ID: ${doc.id})`)
  console.log(` Status: READY | Total Chunks: ${chunks.length}`)
  console.log('====================================================\n')

  return {
    mode: 'apply',
    documentId: doc.id,
    documentName: doc.name,
    chunkCount: chunks.length,
  }
}

// CLI Entrypoint
if (process.argv[1]?.includes('ingest-policy-rag-sample')) {
  const args = process.argv.slice(2)
  const isApply = args.includes('--apply')
  const allowProduction = args.includes('--allow-production')
  const validateEmbedding = args.includes('--validate-embedding')
  const dryRun = !isApply || args.includes('--dry-run')

  ingestPolicyRag({
    dryRun,
    allowProduction,
    validateEmbedding,
  })
    .catch((err) => {
      console.error('\nLỖI THỰC THI SCRIPT:', err.message || err)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
