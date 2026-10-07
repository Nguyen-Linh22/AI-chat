import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response } from 'express'
import { streamChatResponse } from '../../src/controllers/stream.controller.js'

const {
  createMessageMock,
  createAssistantMessageMock,
  getChatHistoryMock,
  buildChatContextMock,
  buildChatPromptMock,
  semanticSearchMock,
  buildContextMock,
  getModelByIdMock,
  createAIProviderMock,
  getAttachmentContextMock,
  logAiRequestStartMock,
  logAiRequestCompletedMock,
  logAiRequestFailedMock,
  resWriteMock,
  resEndMock,
  resSetHeaderMock,
  resFlushHeadersMock,
  resStatusMock,
  resJsonMock,
  resOnMock
} = vi.hoisted(() => ({
  createMessageMock: vi.fn(),
  createAssistantMessageMock: vi.fn(),
  getChatHistoryMock: vi.fn(),
  buildChatContextMock: vi.fn(),
  buildChatPromptMock: vi.fn(),
  semanticSearchMock: vi.fn(),
  buildContextMock: vi.fn(),
  getModelByIdMock: vi.fn(),
  createAIProviderMock: vi.fn(),
  getAttachmentContextMock: vi.fn(),
  logAiRequestStartMock: vi.fn(),
  logAiRequestCompletedMock: vi.fn(),
  logAiRequestFailedMock: vi.fn(),
  resWriteMock: vi.fn(),
  resEndMock: vi.fn(),
  resSetHeaderMock: vi.fn(),
  resFlushHeadersMock: vi.fn(),
  resStatusMock: vi.fn(),
  resJsonMock: vi.fn(),
  resOnMock: vi.fn()
}))

vi.mock('../../src/services/message.service.js', () => ({
  createMessage: createMessageMock,
  createAssistantMessage: createAssistantMessageMock
}))

vi.mock('../../src/ai/context/chat-history.service.js', () => ({
  getChatHistory: getChatHistoryMock
}))

vi.mock('../../src/ai/context/chat.context.js', () => ({
  buildChatContext: buildChatContextMock
}))

vi.mock('../../src/ai/prompts/chat.prompt.js', () => ({
  buildChatPrompt: buildChatPromptMock,
  MAX_AI_CONTEXT_CHARS: 30_000
}))

vi.mock('../../src/rag/rag.service.js', () => ({
  semanticSearch: semanticSearchMock,
  buildContext: buildContextMock
}))

vi.mock('../../src/ai/model.registry.js', () => ({
  getModelById: getModelByIdMock
}))

vi.mock('../../src/ai/ai.router.js', () => ({
  createAIProvider: createAIProviderMock
}))

vi.mock('../../src/services/attachment-context.service.js', () => ({
  getAttachmentContext: getAttachmentContextMock
}))

vi.mock('../../src/utils/ai-audit.util.js', () => ({
  logAiRequestStart: logAiRequestStartMock,
  logAiRequestCompleted: logAiRequestCompletedMock,
  logAiRequestTimeout: vi.fn(),
  logAiRequestFailed: logAiRequestFailedMock
}))

vi.mock('../../src/utils/file.util.js', () => ({
  safeDeleteFile: vi.fn()
}))

describe('Stream Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    getModelByIdMock.mockReturnValue({
      id: 'ollama-qwen3-1.7b',
      name: 'Qwen 3 1.7B',
      provider: 'ollama',
      model: 'qwen3:1.7b'
    })

    createMessageMock.mockResolvedValue({
      id: 'user-message-id',
      sessionId: 'chat-id',
      role: 'user',
      content: 'Hello'
    })

    createAssistantMessageMock.mockResolvedValue({
      id: 'assistant-message-id',
      sessionId: 'chat-id',
      role: 'ai',
      content: 'Hello world'
    })

    getChatHistoryMock.mockResolvedValue([
      {
        role: 'user',
        content: 'Previous message'
      }
    ])

    buildChatContextMock.mockReturnValue('Previous context')

    getAttachmentContextMock.mockResolvedValue('')

    semanticSearchMock.mockResolvedValue([])
    buildContextMock.mockReturnValue('')

    buildChatPromptMock.mockReturnValue('Generated prompt')

    createAIProviderMock.mockReturnValue({
      generateResponseStream: async function* () {
        yield 'Hello'
        yield ' world'
      }
    })

    resOnMock.mockImplementation(() => {})
    resWriteMock.mockImplementation(() => true)
    resEndMock.mockImplementation(() => {})
    resSetHeaderMock.mockImplementation(() => {})
    resFlushHeadersMock.mockImplementation(() => {})
    resStatusMock.mockReturnThis()
    resJsonMock.mockImplementation(() => {})
  })

  it('should include RAG context in the AI prompt when relevant knowledge is found', async () => {
    const ragResults = [
      {
        id: 'chunk-1',
        content: 'AI Chat hỗ trợ đăng nhập bằng email và mật khẩu.',
        chunkIndex: 0,
        distance: 0.25
      },
      {
        id: 'chunk-2',
        content: 'Người dùng có thể tạo nhiều cuộc trò chuyện.',
        chunkIndex: 1,
        distance: 0.3
      }
    ]

    semanticSearchMock.mockResolvedValue(ragResults)
    buildContextMock.mockReturnValue(
      '[Chunk 0]\nAI Chat hỗ trợ đăng nhập bằng email và mật khẩu.\n\n' +
      '[Chunk 1]\nNgười dùng có thể tạo nhiều cuộc trò chuyện.'
    )

    const req = {
      params: {
        id: 'chat-id'
      },
      body: {
        content: 'AI Chat có hỗ trợ nhiều cuộc trò chuyện không?',
        modelId: 'ollama-qwen3-1.7b'
      },
      userId: 'user-id',
      file: undefined
    } as unknown as Request

    const res = {
      on: resOnMock,
      setHeader: resSetHeaderMock,
      flushHeaders: resFlushHeadersMock,
      write: resWriteMock,
      end: resEndMock,
      status: resStatusMock,
      json: resJsonMock,
      writableEnded: false,
      headersSent: false
    } as unknown as Response

    await streamChatResponse(req, res)

    expect(semanticSearchMock).toHaveBeenCalledWith(
      'AI Chat có hỗ trợ nhiều cuộc trò chuyện không?',
      3
    )

    expect(buildContextMock).toHaveBeenCalledWith(ragResults)

    expect(buildChatPromptMock).toHaveBeenCalledWith(
      'AI Chat có hỗ trợ nhiều cuộc trò chuyện không?',
      'Previous context',
      '',
      '[Chunk 0]\nAI Chat hỗ trợ đăng nhập bằng email và mật khẩu.\n\n' +
        '[Chunk 1]\nNgười dùng có thể tạo nhiều cuộc trò chuyện.'
    )
  })

  it('should continue without RAG context when no knowledge is found', async () => {
    semanticSearchMock.mockResolvedValue([])

    const req = {
      params: {
        id: 'chat-id'
      },
      body: {
        content: 'Xin chào',
        modelId: 'ollama-qwen3-1.7b'
      },
      userId: 'user-id',
      file: undefined
    } as unknown as Request

    const res = {
      on: resOnMock,
      setHeader: resSetHeaderMock,
      flushHeaders: resFlushHeadersMock,
      write: resWriteMock,
      end: resEndMock,
      status: resStatusMock,
      json: resJsonMock,
      writableEnded: false,
      headersSent: false
    } as unknown as Response

    await streamChatResponse(req, res)

    expect(semanticSearchMock).toHaveBeenCalledWith(
      'Xin chào',
      3
    )

    expect(buildContextMock).not.toHaveBeenCalled()

    expect(buildChatPromptMock).toHaveBeenCalledWith(
      'Xin chào',
      'Previous context',
      '',
      ''
    )

    expect(resFlushHeadersMock).toHaveBeenCalled()
    expect(resEndMock).toHaveBeenCalled()
  })

  it('should continue without RAG when semantic search fails', async () => {
    semanticSearchMock.mockRejectedValue(
      new Error('Gemini embedding service unavailable')
    )

    const req = {
      params: {
        id: 'chat-id'
      },
      body: {
        content: 'Thông tin về AI Chat là gì?',
        modelId: 'ollama-qwen3-1.7b'
      },
      userId: 'user-id',
      file: undefined
    } as unknown as Request

    const res = {
      on: resOnMock,
      setHeader: resSetHeaderMock,
      flushHeaders: resFlushHeadersMock,
      write: resWriteMock,
      end: resEndMock,
      status: resStatusMock,
      json: resJsonMock,
      writableEnded: false,
      headersSent: false
    } as unknown as Response

    await streamChatResponse(req, res)

    expect(semanticSearchMock).toHaveBeenCalledWith(
      'Thông tin về AI Chat là gì?',
      3
    )

    expect(buildChatPromptMock).toHaveBeenCalledWith(
      'Thông tin về AI Chat là gì?',
      'Previous context',
      '',
      ''
    )

    expect(resFlushHeadersMock).toHaveBeenCalled()

    expect(resWriteMock).toHaveBeenCalledWith(
      `data: ${JSON.stringify({
        type: 'chunk',
        content: 'Hello'
      })}\n\n`
    )

    expect(resEndMock).toHaveBeenCalled()
  })

  it('should preserve chat history and attachment context when RAG is active', async () => {
    const ragResults = [
      {
        id: 'chunk-1',
        content: 'AI Chat hỗ trợ nhiều cuộc trò chuyện.',
        chunkIndex: 0,
        distance: 0.2
      }
    ]

    semanticSearchMock.mockResolvedValue(ragResults)

    buildContextMock.mockReturnValue(
      '[Chunk 0]\nAI Chat hỗ trợ nhiều cuộc trò chuyện.'
    )

    getAttachmentContextMock.mockResolvedValue(
      'Nội dung file: Hướng dẫn sử dụng AI Chat.'
    )

    const req = {
      params: {
        id: 'chat-id'
      },
      body: {
        content: 'AI Chat có hỗ trợ nhiều cuộc trò chuyện không?',
        modelId: 'ollama-qwen3-1.7b'
      },
      userId: 'user-id',
      file: undefined
    } as unknown as Request

    const res = {
      on: resOnMock,
      setHeader: resSetHeaderMock,
      flushHeaders: resFlushHeadersMock,
      write: resWriteMock,
      end: resEndMock,
      status: resStatusMock,
      json: resJsonMock,
      writableEnded: false,
      headersSent: false
    } as unknown as Response

    await streamChatResponse(req, res)

    expect(buildChatPromptMock).toHaveBeenCalledWith(
      'AI Chat có hỗ trợ nhiều cuộc trò chuyện không?',
      'Previous context',
      'Nội dung file: Hướng dẫn sử dụng AI Chat.',
      '[Chunk 0]\nAI Chat hỗ trợ nhiều cuộc trò chuyện.'
    )
  })

  it('should keep the existing SSE protocol when RAG is active', async () => {
    const ragResults = [
      {
        id: 'chunk-1',
        content: 'AI Chat là ứng dụng hỗ trợ hội thoại AI.',
        chunkIndex: 0,
        distance: 0.2
      }
    ]

    semanticSearchMock.mockResolvedValue(ragResults)
    buildContextMock.mockReturnValue(
      '[Chunk 0]\nAI Chat là ứng dụng hỗ trợ hội thoại AI.'
    )

    const req = {
      params: {
        id: 'chat-id'
      },
      body: {
        content: 'AI Chat là gì?',
        modelId: 'ollama-qwen3-1.7b'
      },
      userId: 'user-id',
      file: undefined
    } as unknown as Request

    const res = {
      on: resOnMock,
      setHeader: resSetHeaderMock,
      flushHeaders: resFlushHeadersMock,
      write: resWriteMock,
      end: resEndMock,
      status: resStatusMock,
      json: resJsonMock,
      writableEnded: false,
      headersSent: false
    } as unknown as Response

    await streamChatResponse(req, res)

    expect(resSetHeaderMock).toHaveBeenCalledWith(
      'Content-Type',
      'text/event-stream'
    )

    expect(resSetHeaderMock).toHaveBeenCalledWith(
      'Cache-Control',
      'no-cache'
    )

    expect(resSetHeaderMock).toHaveBeenCalledWith(
      'Connection',
      'keep-alive'
    )

    expect(resFlushHeadersMock).toHaveBeenCalled()

    expect(resWriteMock).toHaveBeenCalledWith(
      `data: ${JSON.stringify({
        type: 'chunk',
        content: 'Hello'
      })}\n\n`
    )

    expect(resWriteMock).toHaveBeenCalledWith(
      `data: ${JSON.stringify({
        type: 'chunk',
        content: ' world'
      })}\n\n`
    )

    expect(resWriteMock).toHaveBeenCalledWith(
      `data: ${JSON.stringify({
        type: 'done',
        userMessage: {
          id: 'user-message-id',
          sessionId: 'chat-id',
          role: 'user',
          content: 'Hello',
          attachments: []
        },
        message: {
          id: 'assistant-message-id',
          sessionId: 'chat-id',
          role: 'ai',
          content: 'Hello world'
        }
      })}\n\n`
    )

    expect(resEndMock).toHaveBeenCalled()
  })

  it('should stream AI chunks and send a done event', async () => {
    const req = {
      params: {
        id: 'chat-id'
      },
      body: {
        content: 'Hello',
        modelId: 'ollama-qwen3-1.7b'
      },
      userId: 'user-id',
      file: undefined
    } as unknown as Request

    const res = {
      on: resOnMock,
      setHeader: resSetHeaderMock,
      flushHeaders: resFlushHeadersMock,
      write: resWriteMock,
      end: resEndMock,
      status: resStatusMock,
      json: resJsonMock,
      writableEnded: false,
      headersSent: false
    } as unknown as Response

    await streamChatResponse(req, res)

    expect(resSetHeaderMock).toHaveBeenCalledWith(
      'Content-Type',
      'text/event-stream'
    )

    expect(resSetHeaderMock).toHaveBeenCalledWith(
      'Cache-Control',
      'no-cache'
    )

    expect(resSetHeaderMock).toHaveBeenCalledWith(
      'Connection',
      'keep-alive'
    )

    expect(resFlushHeadersMock).toHaveBeenCalled()

    expect(resWriteMock).toHaveBeenCalledWith(
      `data: ${JSON.stringify({
        type: 'chunk',
        content: 'Hello'
      })}\n\n`
    )

    expect(resWriteMock).toHaveBeenCalledWith(
      `data: ${JSON.stringify({
        type: 'chunk',
        content: ' world'
      })}\n\n`
    )

    expect(resWriteMock).toHaveBeenCalledWith(
      `data: ${JSON.stringify({
        type: 'done',
        userMessage: {
          id: 'user-message-id',
          sessionId: 'chat-id',
          role: 'user',
          content: 'Hello',
          attachments: []
        },
        message: {
          id: 'assistant-message-id',
          sessionId: 'chat-id',
          role: 'ai',
          content: 'Hello world'
        }
      })}\n\n`
    )

    expect(createAssistantMessageMock).toHaveBeenCalledWith(
      'chat-id',
      'user-id',
      'Hello world'
    )

    expect(resEndMock).toHaveBeenCalled()
  })

  it('should send an SSE error event when the AI provider fails', async () => {
    createAIProviderMock.mockReturnValue({
      generateResponseStream: async function* () {
        yield 'Partial'
        throw new Error('AI provider failed')
      }
    })

    const req = {
      params: {
        id: 'chat-id'
      },
      body: {
        content: 'Hello',
        modelId: 'ollama-qwen3-1.7b'
      },
      userId: 'user-id',
      file: undefined
    } as unknown as Request

    const res = {
      on: resOnMock,
      setHeader: resSetHeaderMock,
      flushHeaders: resFlushHeadersMock,
      write: resWriteMock,
      end: resEndMock,
      status: resStatusMock,
      json: resJsonMock,
      writableEnded: false,
      headersSent: true
    } as unknown as Response

    await streamChatResponse(req, res)

    expect(resWriteMock).toHaveBeenCalledWith(
      `data: ${JSON.stringify({
        type: 'chunk',
        content: 'Partial'
      })}\n\n`
    )

    expect(resWriteMock).toHaveBeenCalledWith(
      `data: ${JSON.stringify({
        type: 'error',
        message: 'Đã xảy ra lỗi khi streaming'
      })}\n\n`
    )

    expect(resEndMock).toHaveBeenCalled()
    expect(logAiRequestFailedMock).toHaveBeenCalled()
  })

  it('should abort the AI stream when the client connection closes', async () => {
    let closeHandler: (() => void) | undefined
    let receivedSignal: AbortSignal | undefined

    resOnMock.mockImplementation(
      (event: string, handler: () => void) => {
        if (event === 'close') {
          closeHandler = handler
        }
      }
    )

    createAIProviderMock.mockReturnValue({
      generateResponseStream: async function* (
        _prompt: string,
        _model: string,
        signal: AbortSignal
      ) {
        receivedSignal = signal

        closeHandler?.()

        expect(signal.aborted).toBe(true)

        yield 'Partial'
      }
    })

    const req = {
      params: {
        id: 'chat-id'
      },
      body: {
        content: 'Hello',
        modelId: 'ollama-qwen3-1.7b'
      },
      userId: 'user-id',
      file: undefined
    } as unknown as Request

    const res = {
      on: resOnMock,
      setHeader: resSetHeaderMock,
      flushHeaders: resFlushHeadersMock,
      write: resWriteMock,
      end: resEndMock,
      status: resStatusMock,
      json: resJsonMock,
      writableEnded: false,
      headersSent: false
    } as unknown as Response

    await streamChatResponse(req, res)

    expect(receivedSignal).toBeDefined()
    expect(receivedSignal?.aborted).toBe(true)
  })

  it('should save partial AI response when streaming is aborted', async () => {
    createAssistantMessageMock.mockClear()

    createAIProviderMock.mockReturnValue({
      generateResponseStream: async function* (
        _prompt: string,
        _model: string,
        _signal: AbortSignal
      ) {
        yield 'Partial response'

        const error = new Error('Stream aborted')
        error.name = 'AbortError'
        throw error
      }
    })

    const req = {
      params: {
        id: 'chat-id'
      },
      body: {
        content: 'Hello',
        modelId: 'ollama-qwen3-1.7b'
      },
      userId: 'user-id',
      file: undefined
    } as unknown as Request

    const res = {
      on: resOnMock,
      setHeader: resSetHeaderMock,
      flushHeaders: resFlushHeadersMock,
      write: resWriteMock,
      end: resEndMock,
      status: resStatusMock,
      json: resJsonMock,
      writableEnded: false,
      headersSent: true
    } as unknown as Response

    await streamChatResponse(req, res)

    expect(createAssistantMessageMock).toHaveBeenCalledWith(
      'chat-id',
      'user-id',
      'Partial response'
    )

    expect(resEndMock).toHaveBeenCalled()
  })
})