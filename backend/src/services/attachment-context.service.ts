import { prisma } from '../lib/prisma.js'

export const MAX_ATTACHMENT_CONTEXT_CHARS = 50_000

export const getAttachmentContext = async (
  messageId: string,
  userId?: string
): Promise<string> => {
  const attachments = await prisma.attachment.findMany({
    where: {
      messageId,
      ...(userId
        ? {
            message: {
              session: {
                userId
              }
            }
          }
        : {})
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

  let totalChars = 0
  const contextParts: string[] = []

  for (const attachment of attachments) {
    const extractedText = attachment.extractedText

    if (!extractedText || typeof extractedText !== 'string' || !extractedText.trim()) {
      continue
    }

    const remainingBudget = MAX_ATTACHMENT_CONTEXT_CHARS - totalChars
    if (remainingBudget <= 0) {
      break
    }

    let textToInclude = extractedText
    if (textToInclude.length > remainingBudget) {
      textToInclude =
        textToInclude.slice(0, remainingBudget) +
        '\n\n[...Đã đạt giới hạn tối đa của ngữ cảnh file đính kèm...]'
    }

    const part = [
      `Tên file: ${attachment.fileName}`,
      `Loại file: ${attachment.fileType}`,
      `Nội dung file:`,
      textToInclude
    ].join('\n')

    totalChars += textToInclude.length
    contextParts.push(part)
  }

  return contextParts.join('\n\n---\n\n')
}