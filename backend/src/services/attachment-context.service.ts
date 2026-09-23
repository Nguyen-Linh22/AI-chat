import { prisma } from '../lib/prisma.js'

export const getAttachmentContext = async (
  messageId: string
) => {
  const attachments = await prisma.attachment.findMany({
    where: {
      messageId
    },
    select: {
      fileName: true,
      fileType: true,
      extractedText: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  })

  if (attachments.length === 0) {
    return ''
  }

  return attachments
  .map((attachment) => {
    const extractedText = attachment.extractedText

    if (!extractedText || typeof extractedText !== 'string') {
      return ''
    }

    return [
      `Tên file: ${attachment.fileName}`,
      `Loại file: ${attachment.fileType}`,
      `Nội dung file:`,
      extractedText
    ].join('\n')
  })
  .filter((context) => context !== '')
  .join('\n\n---\n\n')
}