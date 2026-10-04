import { Request, Response } from 'express'
import {
  createMessage,
  createAssistantMessage
} from '../services/message.service.js'
import { getChatHistory } from '../ai/context/chat-history.service.js'
import { buildChatContext } from '../ai/context/chat.context.js'
import { buildChatPrompt, MAX_AI_CONTEXT_CHARS } from '../ai/prompts/chat.prompt.js'
import { getModelById } from '../ai/model.registry.js'
import { createAIProvider } from '../ai/ai.router.js'
import { getAttachmentContext } from '../services/attachment-context.service.js'
import { uploadFileToCloudinary, deleteFileFromCloudinary } from '../services/cloudinary.service.js'
import { extractFileText, isExtractableMimeType, FileExtractionError } from '../services/file-extraction.service.js'
import fs from 'fs'
import { prisma } from '../lib/prisma.js'
import { safeDeleteFile } from '../utils/file.util.js'
import { AI_TIMEOUT_MS } from '../ai/ai.config.js'
import {
  logAiRequestStart,
  logAiRequestCompleted,
  logAiRequestTimeout,
  logAiRequestFailed
} from '../utils/ai-audit.util.js'

export const streamChatResponse = async (
  req: Request,
  res: Response
) => {
  let fullResponse = ''
  const chatId = req.params.id as string
  const file = req.file
  const startTime = Date.now()

  const abortController = new AbortController()
  let isTimedOut = false

  const timeoutId = setTimeout(() => {
    isTimedOut = true
    abortController.abort()
  }, AI_TIMEOUT_MS)

  res.on('close', () => {
    if (!res.writableEnded) {
      abortController.abort()
    }
  })

  let selectedModel: ReturnType<typeof getModelById> = null
  const userId = req.userId

  try {
    const { content, modelId } = req.body

    if (!userId) {
      clearTimeout(timeoutId)
      return res.status(401).json({
        message: 'Bạn chưa đăng nhập'
      })
    }

    selectedModel = getModelById(modelId)

    if (!selectedModel) {
      return res.status(400).json({
        message: `AI model không được hỗ trợ: ${modelId}`
      })
    }

    const userMessage = await createMessage(
      chatId,
      userId,
      content
    )

    if (!userMessage) {
      return res.status(404).json({
        message: 'Không tìm thấy cuộc trò chuyện'
      })
    }

    let createdAttachment = null
    if (file) {
      let uploadedPublicId: string | undefined
      let uploadedResourceType: string = 'image'
      let isSavedInDb = false

      try {
        let extractedText: string | null = null

        if (isExtractableMimeType(file.mimetype)) {
          extractedText = await extractFileText(
            file.path,
            file.mimetype
          )
        }

        const cloudinaryResult =
          await uploadFileToCloudinary(
            file.path,
            file.originalname
          )
        uploadedPublicId = cloudinaryResult.public_id
        uploadedResourceType = cloudinaryResult.resource_type || 'image'

        createdAttachment = await prisma.attachment.create({
          data: {
            messageId: userMessage.id,
            fileName: file.originalname,
            fileUrl: cloudinaryResult.secure_url,
            fileType: file.mimetype,
            sizeBytes: BigInt(file.size),
            extractedText,
            cloudinaryPublicId: uploadedPublicId
          }
        })
        isSavedInDb = true
      } catch (error) {
        console.error(
          'STREAM: không thể xử lý file:',
          error
        )

        if (uploadedPublicId && !isSavedInDb) {
          await deleteFileFromCloudinary(uploadedPublicId, uploadedResourceType)
        }

        if (error instanceof FileExtractionError) {
          return res.status(400).json({
            message: 'Không thể xử lý nội dung file'
          })
        }

        return res.status(500).json({
          message: 'Không thể xử lý file đính kèm'
        })
      } finally {
        safeDeleteFile(file.path)
      }
    }

    const history = await getChatHistory(
      chatId,
      userId
    )

    if (!history) {
      return res.status(404).json({
        message: 'Không tìm thấy cuộc trò chuyện'
      })
    }

    const context = buildChatContext(history)

    const attachmentContext =
      await getAttachmentContext(userMessage.id, userId)

    const prompt = buildChatPrompt(
      content,
      context,
      attachmentContext
    )

    if (prompt.length > MAX_AI_CONTEXT_CHARS) {
      return res.status(413).json({
        message: 'Nội dung cuộc trò chuyện quá lớn để xử lý.'
      })
    }

    const provider = createAIProvider(selectedModel.provider)

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    logAiRequestStart({
      userId,
      chatId,
      provider: selectedModel.provider,
      model: selectedModel.model
    })

    const stream = provider.generateResponseStream(
      prompt,
      selectedModel.model,
      abortController.signal
    )

    for await (const chunk of stream) {
      fullResponse += chunk

      res.write(
        `data: ${JSON.stringify({
          type: 'chunk',
          content: chunk
        })}\n\n`
      )
    }

    logAiRequestCompleted({
      userId,
      chatId,
      provider: selectedModel.provider,
      model: selectedModel.model,
      durationMs: Date.now() - startTime
    })

    const assistantMessage = await createAssistantMessage(
      chatId,
      userId,
      fullResponse
    )

    const normalizedAttachment = createdAttachment
      ? {
          ...createdAttachment,
          sizeBytes: createdAttachment.sizeBytes.toString()
        }
      : null

    const normalizedUserMessage = {
      ...userMessage,
      attachments: normalizedAttachment
        ? [normalizedAttachment]
        : []
    }

    clearTimeout(timeoutId)

    res.write(
      `data: ${JSON.stringify({
        type: 'done',
        userMessage: normalizedUserMessage,
        message: assistantMessage
      })}\n\n`
    )

    res.end()
  } catch (error: any) {
    clearTimeout(timeoutId)
    const durationMs = Date.now() - startTime

    if (isTimedOut) {
      logAiRequestTimeout({
        provider: selectedModel?.provider || 'unknown',
        model: selectedModel?.model || 'unknown',
        durationMs
      })

      if (!res.headersSent) {
        return res.status(504).json({
          message: 'AI phản hồi quá lâu. Vui lòng thử lại.'
        })
      }

      if (!res.writableEnded) {
        res.write(
          `data: ${JSON.stringify({
            type: 'error',
            message: 'AI phản hồi quá lâu. Vui lòng thử lại.'
          })}\n\n`
        )

        res.end()
      }

      return
    }

    if (
      (error instanceof Error && error.name === 'AbortError') ||
      abortController.signal.aborted
    ) {
      if (fullResponse.trim() && userId) {
        try {
          await createAssistantMessage(
            chatId,
            userId,
            fullResponse
          )
        } catch (saveError) {
          console.error(
            'STREAM: không thể lưu partial AI message:',
            saveError
          )
        }
      }

      if (!res.writableEnded) {
        res.end()
      }

      return
    }

    logAiRequestFailed({
      provider: selectedModel?.provider || 'unknown',
      model: selectedModel?.model || 'unknown',
      errorName: error?.name || 'Error',
      durationMs
    })

    console.error('Stream chat error:', error)

    if (!res.headersSent) {
      return res.status(500).json({
        message: 'Đã xảy ra lỗi khi streaming'
      })
    }

    if (!res.writableEnded) {
      res.write(
        `data: ${JSON.stringify({
          type: 'error',
          message: 'Đã xảy ra lỗi khi streaming'
        })}\n\n`
      )

      res.end()
    }
  } finally {
    clearTimeout(timeoutId)
    safeDeleteFile(file?.path)
  }
}