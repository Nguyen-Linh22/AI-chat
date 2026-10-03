import { prisma } from '../src/lib/prisma.js'
import { readFile } from 'node:fs/promises'

const CHUNK_SIZE = 1000
const CHUNK_OVERLAP = 200

function chunkText(text: string): string[] {
  const chunks: string[] = []

  let start = 0

  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length)

    const chunk = text.slice(start, end)

    chunks.push(chunk)

    start += CHUNK_SIZE - CHUNK_OVERLAP
  }

  return chunks
}

const document = await prisma.document.findFirst({
  orderBy: {
    createdAt: 'desc',
  },
})

if (!document) {
  throw new Error('Không tìm thấy Document mẫu.')
}

const content = await readFile(document.storageUrl, 'utf-8')

const chunks = chunkText(content)

console.log('Số lượng chunks:', chunks.length)

chunks.forEach((chunk, index) => {
  console.log(`\n--- Chunk ${index} ---`)
  console.log(chunk)
})

await prisma.documentChunk.deleteMany({
  where: {
    documentId: document.id,
  },
})

console.log('Đã xóa chunks cũ.')

await prisma.documentChunk.createMany({
  data: chunks.map((chunk, index) => ({
    documentId: document.id,
    content: chunk,
    chunkIndex: index,
  })),
})

console.log('Đã lưu chunks vào database.')