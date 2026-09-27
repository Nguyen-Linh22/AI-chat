import request from 'supertest'
import { describe, it, expect, afterEach } from 'vitest'
import app from '../../src/app.js'
import { prisma } from '../../src/lib/prisma.js'
import { authRateLimiter } from '../../src/middlewares/rate-limit.middleware.js'

const createTestUser = async () => {
  const agent = request.agent(app)

  const email = `attachment-${Date.now()}-${Math.random()}@example.com`
  const password = 'Password123!'

  const registerResponse = await agent
    .post('/api/auth/register')
    .send({
      email,
      password
    })

  expect(registerResponse.status).toBe(201)

  const loginResponse = await agent
    .post('/api/auth/login')
    .send({
      email,
      password
    })

  expect(loginResponse.status).toBe(200)

  return agent
}

const createTestMessage = async () => {
  const agent = await createTestUser()

  const chatResponse = await agent
    .post('/api/chats')
    .send({
      title: 'Attachment Test Chat'
    })

  expect(chatResponse.status).toBe(201)

  const chatId = chatResponse.body.chat.id

  const message = await prisma.message.create({
    data: {
      sessionId: chatId,
      role: 'user',
      content: 'Attachment test message'
    }
  })

  return {
    agent,
    chatId,
    messageId: message.id
  }
}

const createTestPdfBuffer = (): Buffer => {
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    '5 0 obj\n<< /Length 44 >>\nstream\nBT\n/F1 18 Tf\n72 720 Td\n(PDF extraction test) Tj\nET\nendstream\nendobj\n'
  ]

  let pdf = '%PDF-1.4\n'
  const offsets: number[] = [0]

  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, 'latin1'))
    pdf += object
  }

  const xrefOffset = Buffer.byteLength(pdf, 'latin1')

  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'

  for (let i = 1; i <= objects.length; i++) {
    pdf += `${offsets[i].toString().padStart(10, '0')} 00000 n \n`
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`
  pdf += `startxref\n${xrefOffset}\n`
  pdf += '%%EOF\n'

  return Buffer.from(pdf, 'latin1')
}

afterEach(async () => {
  await authRateLimiter.resetKey('::ffff:127.0.0.1')
  await authRateLimiter.resetKey('127.0.0.1')
})

describe('Attachment API', () => {
  it('should return 401 when uploading without authentication', async () => {
    const response = await request(app)
      .post('/api/uploads/00000000-0000-0000-0000-000000000000')
      .attach('file', Buffer.from('Hello attachment'), 'test.txt')

    expect(response.status).toBe(401)
  })

  it('should return 400 for invalid message ID', async () => {
    const agent = await createTestUser()

    const response = await agent
      .post('/api/uploads/not-a-valid-uuid')
      .attach(
        'file',
        Buffer.from('Hello attachment'),
        'test.txt'
      )

    expect(response.status).toBe(400)
  })

  it('should return 400 when no file is provided', async () => {
    const { agent, messageId } = await createTestMessage()

    const response = await agent
      .post(`/api/uploads/${messageId}`)

    expect(response.status).toBe(400)
    expect(response.body.message).toBe('Chưa có file')
  })

  it('should return 404 when message does not exist', async () => {
    const agent = await createTestUser()

    const fakeMessageId = '00000000-0000-0000-0000-000000000000'

    const response = await agent
      .post(`/api/uploads/${fakeMessageId}`)
      .attach(
        'file',
        Buffer.from('Hello attachment'),
        'test.txt'
      )

    expect(response.status).toBe(404)
  })

  it('should upload a valid text file successfully', async () => {
    const { agent, messageId } = await createTestMessage()

    const response = await agent
      .post(`/api/uploads/${messageId}`)
      .attach(
        'file',
        Buffer.from('Hello attachment test'),
        'test.txt'
      )

    expect(response.status).toBe(201)
    expect(response.body.message).toBe('Upload file thành công')

    expect(response.body.data).toBeDefined()
    expect(response.body.data.sizeBytes).toBe('21')
  })

  it('should return 400 for an empty file', async () => {
    const { agent, messageId } = await createTestMessage()

    const response = await agent
      .post(`/api/uploads/${messageId}`)
      .attach(
        'file',
        Buffer.alloc(0),
        'empty.txt'
      )

    expect(response.status).toBe(400)
    expect(response.body.message).toBe('File không được rỗng')
  })

  it('should return 400 for unsupported file extension', async () => {
    const { agent, messageId } = await createTestMessage()

    const response = await agent
      .post(`/api/uploads/${messageId}`)
      .attach(
        'file',
        Buffer.from('Hello attachment'),
        'test.exe'
      )

    expect(response.status).toBe(400)
    expect(response.body.message).toBe(
      'Phần mở rộng file không được hỗ trợ'
    )
  })

  it('should return 415 for unsupported MIME type', async () => {
    const { agent, messageId } = await createTestMessage()

    const response = await agent
      .post(`/api/uploads/${messageId}`)
      .attach(
        'file',
        Buffer.from('Hello attachment'),
        {
          filename: 'test.txt',
          contentType: 'application/octet-stream'
        }
      )

    expect(response.status).toBe(415)
    expect(response.body.message).toBe(
      'Loại file không được hỗ trợ'
    )
  })

  it('should return 400 when extension and MIME type do not match', async () => {
    const { agent, messageId } = await createTestMessage()

    const response = await agent
      .post(`/api/uploads/${messageId}`)
      .attach(
        'file',
        Buffer.from('Hello attachment'),
        {
          filename: 'test.txt',
          contentType: 'image/png'
        }
      )

    expect(response.status).toBe(400)
    expect(response.body.message).toBe(
      'Phần mở rộng file không khớp với định dạng MIME'
    )
  })

  it('should return 400 when text file contains a null byte', async () => {
    const { agent, messageId } = await createTestMessage()

    const invalidText = Buffer.from([
      0x48,
      0x65,
      0x6c,
      0x6c,
      0x6f,
      0x00,
      0x41
    ])

    const response = await agent
      .post(`/api/uploads/${messageId}`)
      .attach(
        'file',
        invalidText,
        'test.txt'
      )

    expect(response.status).toBe(400)
    expect(response.body.message).toBe(
      'Nội dung file không hợp lệ hoặc không khớp với định dạng khai báo'
    )
  })

  it('should return 400 when PDF signature is invalid', async () => {
    const { agent, messageId } = await createTestMessage()

    const fakePdf = Buffer.from('This is not a real PDF file')

    const response = await agent
      .post(`/api/uploads/${messageId}`)
      .attach(
        'file',
        fakePdf,
        {
          filename: 'test.pdf',
          contentType: 'application/pdf'
        }
      )

    expect(response.status).toBe(400)
    expect(response.body.message).toBe(
      'Nội dung file không hợp lệ hoặc không khớp với định dạng khai báo'
    )
  })

  it('should return 400 when PNG signature is invalid', async () => {
    const { agent, messageId } = await createTestMessage()

    const fakePng = Buffer.from('This is not a real PNG file')

    const response = await agent
      .post(`/api/uploads/${messageId}`)
      .attach('file', fakePng, {
        filename: 'test.png',
        contentType: 'image/png',
      })

    expect(response.status).toBe(400)
  })

  it('should return 400 when JPEG signature is invalid', async () => {
    const { agent, messageId } = await createTestMessage()

    const fakeJpeg = Buffer.from('This is not a real JPEG file')

    const response = await agent
      .post(`/api/uploads/${messageId}`)
      .attach('file', fakeJpeg, {
        filename: 'test.jpg',
        contentType: 'image/jpeg',
      })

    expect(response.status).toBe(400)
  })

  it('should return 400 for path traversal in filename', async () => {
    const { agent, messageId } = await createTestMessage()

    const response = await agent
      .post(`/api/uploads/${messageId}`)
      .attach(
        'file',
        Buffer.from('Hello attachment'),
        {
          filename: '..malicious.txt',
          contentType: 'text/plain'
        }
      )

    expect(response.status).toBe(400)
    expect(response.body.message).toContain(
      'Tên file không hợp lệ'
    )
  })

  it('should return 413 when uploaded file exceeds 10 MB', async () => {
    const { agent, messageId } = await createTestMessage()

    const oversizedFile = Buffer.alloc(10 * 1024 * 1024 + 1, 'a')

    const response = await agent
      .post(`/api/uploads/${messageId}`)
      .attach('file', oversizedFile, 'oversized.txt')

    expect(response.status).toBe(413)
  })

  it('should return 400 when filename exceeds 255 characters', async () => {
    const { agent, messageId } = await createTestMessage()

    const longFilename = `${'a'.repeat(252)}.txt`

    const response = await agent
      .post(`/api/uploads/${messageId}`)
      .attach('file', Buffer.from('Valid text content'), longFilename)

    expect(response.status).toBe(400)
  })

  it('should return 400 when filename contains a null byte', async () => {
    const { agent, messageId } = await createTestMessage()

    const response = await agent
      .post(`/api/uploads/${messageId}`)
      .attach('file', Buffer.from('Valid text content'), 'test\0.txt')

    expect(response.status).toBe(400)
  })

  it('should truncate extracted text when TXT content exceeds 50,000 characters', async () => {
    const { agent, messageId } = await createTestMessage()

    const content = 'A'.repeat(50_001)

    const response = await agent
      .post(`/api/uploads/${messageId}`)
      .attach('file', Buffer.from(content), 'large-content.txt')

    expect(response.status).toBe(201)

    const attachment = await prisma.attachment.findFirst({
      where: {
        messageId
      }
    })

    expect(attachment).not.toBeNull()
    expect(attachment?.extractedText).toContain(
      '[...Nội dung đã được cắt bớt do vượt quá giới hạn 50.000 ký tự...]'
    )
    expect(attachment?.extractedText?.startsWith('A'.repeat(50_000))).toBe(true)
  })

  it('should extract text from a valid PDF file', async () => {
    const { agent, messageId } = await createTestMessage()

    const pdfBuffer = createTestPdfBuffer()

    const response = await agent
      .post(`/api/uploads/${messageId}`)
      .attach('file', pdfBuffer, {
        filename: 'extraction-test.pdf',
        contentType: 'application/pdf'
      })

    expect(response.status).toBe(201)

    const attachment = await prisma.attachment.findFirst({
      where: { messageId }
    })

    expect(attachment).not.toBeNull()
    expect(attachment?.fileType).toBe('application/pdf')
    expect(attachment?.extractedText).toContain('PDF extraction test')
  })
})
