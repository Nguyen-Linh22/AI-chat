import { Request, Response } from 'express'
import {
  createMessage,
  createAssistantMessage
} from '../services/message.service.js'
import { getChatHistory } from '../ai/context/chat-history.service.js'
import { buildChatContext } from '../ai/context/chat.context.js'
import { buildChatPrompt } from '../ai/prompts/chat.prompt.js'
import { getModelById } from '../ai/model.registry.js'
import { createAIProvider } from '../ai/ai.router.js'

export const streamChatResponse = async (
  req: Request,
  res: Response
) => {
  try {
    console.log(
      'STREAM: bắt đầu controller'
    )

    const userId = req.userId
    const chatId = req.params.id as string
    const { content, modelId } = req.body

    const abortController =
      new AbortController()

    res.on('close', () => {
      if (!res.writableEnded) {
        console.log(
          'STREAM: client đã hủy request'
        )

        abortController.abort()
      }
    })

    if (!userId) {
      return res.status(401).json({
        message: 'Bạn chưa đăng nhập'
      })
    }

    if (!chatId) {
      return res.status(400).json({
        message: 'Chat ID không hợp lệ'
      })
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        message:
          'Nội dung tin nhắn không được để trống'
      })
    }

    if (!modelId) {
      return res.status(400).json({
        message: 'Model ID không được để trống'
      })
    }

    const selectedModel =
      getModelById(modelId)

    if (!selectedModel) {
      return res.status(400).json({
        message: `AI model không được hỗ trợ: ${modelId}`
      })
    }

    const userMessage =
      await createMessage(
        chatId,
        userId,
        content
      )

    console.log(
      'STREAM: đã tạo user message'
    )

    if (!userMessage) {
      return res.status(404).json({
        message:
          'Không tìm thấy cuộc trò chuyện'
      })
    }

    const history =
      await getChatHistory(
        chatId,
        userId
      )

    console.log(
      'STREAM: đã lấy chat history'
    )

    if (!history) {
      return res.status(404).json({
        message:
          'Không tìm thấy cuộc trò chuyện'
      })
    }

    const context =
      buildChatContext(history)

    const prompt =
      buildChatPrompt(
        content,
        context
      )

    const provider =
      createAIProvider(
        selectedModel.provider
      )

    console.log(
      'STREAM: đã tạo AI provider'
    )

    res.setHeader(
      'Content-Type',
      'text/event-stream'
    )

    res.setHeader(
      'Cache-Control',
      'no-cache'
    )

    res.setHeader(
      'Connection',
      'keep-alive'
    )

    res.flushHeaders()

    let fullResponse = ''

    const stream =
      provider.generateResponseStream(
        prompt,
        selectedModel.model,
        abortController.signal
      )

    console.log(
      'STREAM: bắt đầu streaming'
    )

    for await (
      const chunk of stream
    ) {
      console.log(
        'STREAM CHUNK:',
        chunk
      )

      fullResponse += chunk

      res.write(
        `data: ${JSON.stringify({
          type: 'chunk',
          content: chunk
        })}\n\n`
      )
    }

    console.log(
      'STREAM: Ollama đã hoàn tất'
    )

    const assistantMessage =
      await createAssistantMessage(
        chatId,
        fullResponse
      )

    res.write(
      `data: ${JSON.stringify({
        type: 'done',
        message: assistantMessage
      })}\n\n`
    )

    res.end()
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === 'AbortError'
    ) {
      console.log(
        'STREAM: generation đã bị hủy'
      )

      if (!res.writableEnded) {
        res.end()
      }

      return
    }

    console.error(
      'Stream chat error:',
      error
    )

    if (!res.headersSent) {
      return res.status(500).json({
        message:
          'Đã xảy ra lỗi khi streaming'
      })
    }

    if (!res.writableEnded) {
      res.write(
        `data: ${JSON.stringify({
          type: 'error',
          message:
            'Đã xảy ra lỗi khi streaming'
        })}\n\n`
      )

      res.end()
    }
  }
}