import { describe, it, expect, vi, beforeEach } from 'vitest'

const {
  cloudinaryDestroyMock,
  cloudinaryUploadMock,
  prismaMessageFindFirstMock,
  prismaMessageDeleteMock,
  prismaChatSessionFindFirstMock,
  prismaChatSessionDeleteMock,
  prismaAttachmentFindManyMock,
  prismaAttachmentCreateMock,
  safeDeleteFileMock,
  extractFileTextMock,
  isExtractableMimeTypeMock
} = vi.hoisted(() => ({
  cloudinaryDestroyMock: vi.fn(),
  cloudinaryUploadMock: vi.fn(),
  prismaMessageFindFirstMock: vi.fn(),
  prismaMessageDeleteMock: vi.fn(),
  prismaChatSessionFindFirstMock: vi.fn(),
  prismaChatSessionDeleteMock: vi.fn(),
  prismaAttachmentFindManyMock: vi.fn(),
  prismaAttachmentCreateMock: vi.fn(),
  safeDeleteFileMock: vi.fn(),
  extractFileTextMock: vi.fn(),
  isExtractableMimeTypeMock: vi.fn()
}))

vi.mock('../../src/config/cloudinary.js', () => ({
  default: {
    uploader: {
      destroy: cloudinaryDestroyMock,
      upload: cloudinaryUploadMock
    }
  }
}))

vi.mock('../../src/lib/prisma.js', () => ({
  prisma: {
    message: {
      findFirst: prismaMessageFindFirstMock,
      delete: prismaMessageDeleteMock
    },
    chatSession: {
      findFirst: prismaChatSessionFindFirstMock,
      delete: prismaChatSessionDeleteMock
    },
    attachment: {
      findMany: prismaAttachmentFindManyMock,
      create: prismaAttachmentCreateMock
    }
  }
}))

vi.mock('../../src/utils/file.util.js', () => ({
  safeDeleteFile: safeDeleteFileMock
}))

vi.mock('../../src/services/file-extraction.service.js', () => ({
  extractFileText: extractFileTextMock,
  isExtractableMimeType: isExtractableMimeTypeMock
}))

import {
  deleteFileFromCloudinary,
  cleanupCloudinaryAttachments,
  getResourceTypeFromMime
} from '../../src/services/cloudinary.service.js'
import { deleteMessage } from '../../src/services/message.service.js'
import { deleteChat } from '../../src/services/chat.service.js'
import { createAttachment } from '../../src/services/attachment.service.js'

describe('Cloudinary Orphan Cleanup & Asset Lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Cloudinary Service Helpers', () => {
    it('should map MIME types to correct Cloudinary resource_type', () => {
      expect(getResourceTypeFromMime('image/png')).toBe('image')
      expect(getResourceTypeFromMime('image/jpeg')).toBe('image')
      expect(getResourceTypeFromMime('application/pdf')).toBe('raw')
      expect(getResourceTypeFromMime('text/plain')).toBe('raw')
      expect(getResourceTypeFromMime(undefined)).toBe('raw')
    })

    it('should call cloudinary uploader.destroy with public_id and resource_type', async () => {
      cloudinaryDestroyMock.mockResolvedValueOnce({ result: 'ok' })

      await deleteFileFromCloudinary('sample_pub_id', 'image')

      expect(cloudinaryDestroyMock).toHaveBeenCalledWith('sample_pub_id', {
        resource_type: 'image'
      })
    })

    it('should not throw error if Cloudinary delete fails (failure handling)', async () => {
      cloudinaryDestroyMock.mockRejectedValueOnce(new Error('Cloudinary timeout'))

      await expect(
        deleteFileFromCloudinary('failed_pub_id', 'raw')
      ).resolves.not.toThrow()

      expect(cloudinaryDestroyMock).toHaveBeenCalledWith('failed_pub_id', {
        resource_type: 'raw'
      })
    })

    it('should safely skip attachments without cloudinaryPublicId (legacy attachments)', async () => {
      const attachments = [
        { cloudinaryPublicId: null, fileType: 'image/png' },
        { cloudinaryPublicId: 'valid_id_1', fileType: 'image/jpeg' },
        { cloudinaryPublicId: null, fileType: 'application/pdf' },
        { cloudinaryPublicId: 'valid_id_2', fileType: 'text/plain' }
      ]

      cloudinaryDestroyMock.mockResolvedValue({ result: 'ok' })

      await cleanupCloudinaryAttachments(attachments)

      expect(cloudinaryDestroyMock).toHaveBeenCalledTimes(2)
      expect(cloudinaryDestroyMock).toHaveBeenNthCalledWith(1, 'valid_id_1', {
        resource_type: 'image'
      })
      expect(cloudinaryDestroyMock).toHaveBeenNthCalledWith(2, 'valid_id_2', {
        resource_type: 'raw'
      })
    })
  })

  describe('Upload Persists cloudinaryPublicId and Rollback on Failure', () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'document.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      size: 1024,
      destination: '/tmp',
      filename: 'document.pdf',
      path: '/tmp/document.pdf',
      buffer: Buffer.from('')
    } as any

    it('should save cloudinaryPublicId in Attachment on successful upload', async () => {
      prismaMessageFindFirstMock.mockResolvedValueOnce({
        id: 'msg-123',
        sessionId: 'chat-123'
      })
      isExtractableMimeTypeMock.mockReturnValueOnce(false)
      cloudinaryUploadMock.mockResolvedValueOnce({
        public_id: 'cloud_pdf_123',
        secure_url: 'https://cloudinary.com/doc.pdf',
        resource_type: 'raw'
      })
      prismaAttachmentCreateMock.mockResolvedValueOnce({
        id: 'att-123',
        cloudinaryPublicId: 'cloud_pdf_123',
        fileUrl: 'https://cloudinary.com/doc.pdf'
      })

      const result = await createAttachment('msg-123', 'user-123', mockFile)

      expect(prismaAttachmentCreateMock).toHaveBeenCalledWith({
        data: expect.objectContaining({
          messageId: 'msg-123',
          fileName: 'document.pdf',
          fileUrl: 'https://cloudinary.com/doc.pdf',
          cloudinaryPublicId: 'cloud_pdf_123'
        })
      })
      expect(safeDeleteFileMock).toHaveBeenCalledWith('/tmp/document.pdf')
      expect(result).toBeDefined()
    })

    it('should rollback Cloudinary asset if database insert fails', async () => {
      prismaMessageFindFirstMock.mockResolvedValueOnce({
        id: 'msg-123',
        sessionId: 'chat-123'
      })
      isExtractableMimeTypeMock.mockReturnValueOnce(false)
      cloudinaryUploadMock.mockResolvedValueOnce({
        public_id: 'cloud_rollback_id',
        secure_url: 'https://cloudinary.com/fail.pdf',
        resource_type: 'raw'
      })
      prismaAttachmentCreateMock.mockRejectedValueOnce(
        new Error('Database unique constraint or connection failure')
      )
      cloudinaryDestroyMock.mockResolvedValueOnce({ result: 'ok' })

      await expect(
        createAttachment('msg-123', 'user-123', mockFile)
      ).rejects.toThrow('Database unique constraint')

      expect(cloudinaryDestroyMock).toHaveBeenCalledWith('cloud_rollback_id', {
        resource_type: 'raw'
      })
      expect(safeDeleteFileMock).toHaveBeenCalledWith('/tmp/document.pdf')
    })
  })

  describe('Message Deletion Orphan Cleanup', () => {
    it('should delete Cloudinary assets before deleting message from database', async () => {
      prismaMessageFindFirstMock.mockResolvedValueOnce({
        id: 'msg-1',
        sessionId: 'chat-1',
        attachments: [
          { cloudinaryPublicId: 'cloud_msg_att_1', fileType: 'image/png' },
          { cloudinaryPublicId: 'cloud_msg_att_2', fileType: 'application/pdf' }
        ]
      })
      cloudinaryDestroyMock.mockResolvedValue({ result: 'ok' })
      prismaMessageDeleteMock.mockResolvedValueOnce({ id: 'msg-1' })

      const result = await deleteMessage('chat-1', 'msg-1', 'user-1')

      expect(cloudinaryDestroyMock).toHaveBeenCalledTimes(2)
      expect(cloudinaryDestroyMock).toHaveBeenCalledWith('cloud_msg_att_1', {
        resource_type: 'image'
      })
      expect(cloudinaryDestroyMock).toHaveBeenCalledWith('cloud_msg_att_2', {
        resource_type: 'raw'
      })
      expect(prismaMessageDeleteMock).toHaveBeenCalledWith({
        where: { id: 'msg-1' }
      })
      expect(result).toBeDefined()
    })

    it('should still delete message in DB even if Cloudinary cleanup encounters error', async () => {
      prismaMessageFindFirstMock.mockResolvedValueOnce({
        id: 'msg-error',
        sessionId: 'chat-1',
        attachments: [
          { cloudinaryPublicId: 'cloud_err_att', fileType: 'image/png' }
        ]
      })
      cloudinaryDestroyMock.mockRejectedValueOnce(new Error('Cloudinary 503'))
      prismaMessageDeleteMock.mockResolvedValueOnce({ id: 'msg-error' })

      const result = await deleteMessage('chat-1', 'msg-error', 'user-1')

      expect(cloudinaryDestroyMock).toHaveBeenCalledWith('cloud_err_att', {
        resource_type: 'image'
      })
      expect(prismaMessageDeleteMock).toHaveBeenCalledWith({
        where: { id: 'msg-error' }
      })
      expect(result).toBeDefined()
    })

    it('should normalize BigInt sizeBytes on attachments to prevent JSON serialization errors', async () => {
      prismaMessageFindFirstMock.mockResolvedValueOnce({
        id: 'msg-bigint',
        sessionId: 'chat-1',
        attachments: [
          { cloudinaryPublicId: 'cloud_msg_att_bigint', fileType: 'text/plain', sizeBytes: 1234567890123456789n }
        ]
      })
      cloudinaryDestroyMock.mockResolvedValue({ result: 'ok' })
      prismaMessageDeleteMock.mockResolvedValueOnce({ id: 'msg-bigint' })

      const result = await deleteMessage('chat-1', 'msg-bigint', 'user-1')

      expect(result).toBeDefined()
      expect(result?.attachments[0].sizeBytes).toBe('1234567890123456789')
      expect(() => JSON.stringify(result)).not.toThrow()
    })
  })

  describe('Chat Deletion Orphan Cleanup', () => {
    it('should find all chat attachments and delete Cloudinary assets before deleting chat session', async () => {
      prismaChatSessionFindFirstMock.mockResolvedValueOnce({
        id: 'chat-999',
        userId: 'user-1'
      })
      prismaAttachmentFindManyMock.mockResolvedValueOnce([
        { cloudinaryPublicId: 'chat_att_1', fileType: 'image/jpeg' },
        { cloudinaryPublicId: null, fileType: 'text/plain' }, // legacy attachment
        { cloudinaryPublicId: 'chat_att_2', fileType: 'application/pdf' }
      ])
      cloudinaryDestroyMock.mockResolvedValue({ result: 'ok' })
      prismaChatSessionDeleteMock.mockResolvedValueOnce({ id: 'chat-999' })

      const result = await deleteChat('chat-999', 'user-1')

      expect(prismaAttachmentFindManyMock).toHaveBeenCalledWith({
        where: { message: { sessionId: 'chat-999' } },
        select: { cloudinaryPublicId: true, fileType: true }
      })
      expect(cloudinaryDestroyMock).toHaveBeenCalledTimes(2)
      expect(cloudinaryDestroyMock).toHaveBeenCalledWith('chat_att_1', {
        resource_type: 'image'
      })
      expect(cloudinaryDestroyMock).toHaveBeenCalledWith('chat_att_2', {
        resource_type: 'raw'
      })
      expect(prismaChatSessionDeleteMock).toHaveBeenCalledWith({
        where: { id: 'chat-999' }
      })
      expect(result).toBeDefined()
    })
  })
})
