import fs from 'node:fs'
import path from 'node:path'
import { prisma } from '../src/lib/prisma.ts'

const RELATIVE_DOC_PATH = 'data/sample-documents/quy-dinh-su-dung-va-chinh-sach-ai-chat.txt'
const FULL_DOC_PATH = path.resolve(process.cwd(), RELATIVE_DOC_PATH)

async function seedSampleDocument() {
  console.log('--- RAG-2: SEED SAMPLE DOCUMENT ---')

  if (!fs.existsSync(FULL_DOC_PATH)) {
    throw new Error(`Tệp tài liệu mẫu không tồn tại tại: ${FULL_DOC_PATH}`)
  }

  const fileStat = fs.statSync(FULL_DOC_PATH)
  const docName = path.basename(FULL_DOC_PATH)

  console.log(`Đang đọc tệp: ${docName} (${fileStat.size} bytes)`)

  // Kiểm tra xem Document đã tồn tại trong database chưa (đảm bảo tính idempotent)
  let doc = await prisma.document.findFirst({
    where: { name: docName },
    include: { chunks: true },
  })

  if (!doc) {
    console.log('Document chưa tồn tại trong database. Đang tạo mới...')
    doc = await prisma.document.create({
      data: {
        name: docName,
        mimeType: 'text/plain',
        size: BigInt(fileStat.size),
        storageUrl: RELATIVE_DOC_PATH,
        status: 'PROCESSING', // Trạng thái sẵn sàng cho bước RAG-3 (chunking & embedding)
      },
      include: { chunks: true },
    })
    console.log('Tạo Document mẫu thành công!')
  } else {
    console.log('Document mẫu đã tồn tại trong database.')
  }

  const chunkCount = await prisma.documentChunk.count({
    where: { documentId: doc.id },
  })

  console.log('\n--- THÔNG TIN DOCUMENT MẪU ---')
  console.log('Document ID:', doc.id)
  console.log('Tên tài liệu:', doc.name)
  console.log('MIME Type:', doc.mimeType)
  console.log('Dung lượng:', `${doc.size.toString()} bytes`)
  console.log('Storage URL:', doc.storageUrl)
  console.log('Trạng thái (status):', doc.status)
  console.log('Số lượng DocumentChunk ở bước RAG-2:', chunkCount)
  console.log('-------------------------------\n')
}

seedSampleDocument()
  .catch((error) => {
    console.error('Lỗi khi tạo Document mẫu:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
