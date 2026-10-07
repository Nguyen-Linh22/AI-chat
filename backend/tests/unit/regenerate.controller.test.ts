import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response } from 'express'
import { regenerateMessage } from '../../src/controllers/regenerate.controller.js'

const {
  prismaFindFirstMock,
  updateAssistantMessageMock,
  getChatHistoryMock,
  buildChatContextMock,
  buildChatPromptMock,
  semanticSearchMock,
  buildContextMock,
  getModelByIdMock,
  createAIProviderMock,
  logAiRequestStartMock,
  logAiRequestCompletedMock,
  logAiRequestTimeoutMock,
  logAiRequestFailedMock,
  resWriteMock,
  resEndMock,
  resSetHeaderMock,
  resFlushHeadersMock,
  resStatusMock,
  resJsonMock,
  resOnMock
} = vi.hoisted(() => ({
  prismaFindFirstMock: vi.fn(),
  updateAssistantMessageMock: vi.fn(),
  getChatHistoryMock: vi.fn(),
  buildChatContextMock: vi.fn(),
  buildChatPromptMock: vi.fn(),
  semanticSearchMock: vi.fn(),
  buildContextMock: vi.fn(),
  getModelByIdMock: vi.fn(),
  createAIProviderMock: vi.fn(),
  logAiRequestStartMock: vi.fn(),
  logAiRequestCompletedMock: vi.fn(),
  logAiRequestTimeoutMock: vi.fn(),
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
  updateAssistantMessage: updateAssistantMessageMock
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

vi.mock('../../src/lib/prisma.js', () => ({
  prisma: {
    message: {
      findFirst: prismaFindFirstMock
    }
  }
}))

vi.mock('../../src/utils/ai-audit.util.js', () => ({
  logAiRequestStart: logAiRequestStartMock,
  logAiRequestCompleted: logAiRequestCompletedMock,
  logAiRequestTimeout: logAiRequestTimeoutMock,
  logAiRequestFailed: logAiRequestFailedMock
}))

describe('Regenerate Controller', () => {
  const createMockReq = (overrides: Partial<Request> = {}): Request =>
    ({
      params: {
        id: 'chat-id',
        messageId: 'ai-message-id'
      },
      body: {
        modelId: 'ollama-qwen3-1.7b'
      },
      userId: 'user-id',
      ...overrides
    }) as unknown as Request

  const createMockRes = (overrides: Partial<Response> = {}): Response => {
    const resObj = {
      on: resOnMock,
      setHeader: resSetHeaderMock,
      flushHeaders: vi.fn(() => {
        (resObj as any).headersSent = true
        resFlushHeadersMock()
      }),
      write: resWriteMock,
      end: resEndMock,
      status: resStatusMock,
      json: resJsonMock,
      writableEnded: false,
      headersSent: false,
      ...overrides
    }
    return resObj as unknown as Response
  }

  beforeEach(() => {
    vi.clearAllMocks()

    getModelByIdMock.mockReturnValue({
      id: 'ollama-qwen3-1.7b',
      name: 'Qwen 3 1.7B',
      provider: 'ollama',
      model: 'qwen3:1.7b'
    })

    prismaFindFirstMock.mockImplementation(({ where }) => {
      if (where.role === 'ai') {
        return Promise.resolve({
          id: 'ai-message-id',
          sessionId: 'chat-id',
          role: 'ai',
          createdAt: new Date('2026-01-01T10:00:00Z')
        })
      }
      if (where.role === 'user') {
        return Promise.resolve({
          id: 'user-message-id',
          sessionId: 'chat-id',
          role: 'user',
          content: 'AI Chat có hỗ trợ nhiều cuộc trò chuyện không?',
          createdAt: new Date('2026-01-01T09:59:00Z')
        })
      }
      return Promise.resolve(null)
    })

    getChatHistoryMock.mockResolvedValue([
      {
        role: 'user',
        content: 'Previous user question'
      }
    ])

    buildChatContextMock.mockReturnValue('Previous context')

    semanticSearchMock.mockResolvedValue([])
    buildContextMock.mockReturnValue('')

    buildChatPromptMock.mockReturnValue('Generated prompt')

    createAIProviderMock.mockReturnValue({
      generateResponseStream: async function* () {
        yield 'Regenerated'
        yield ' answer'
      }
    })

    updateAssistantMessageMock.mockResolvedValue({
      id: 'ai-message-id',
      sessionId: 'chat-id',
      role: 'ai',
      content: 'Regenerated answer'
    })

    resWriteMock.mockImplementation(() => true)
    resEndMock.mockImplementation(() => {})
    resSetHeaderMock.mockImplementation(() => {})
    resFlushHeadersMock.mockImplementation(() => {})
    resStatusMock.mockImplementation(() => ({
      json: resJsonMock
    }))
    resJsonMock.mockImplementation(() => {})
    resOnMock.mockImplementation(() => {})
  })

  // TEST 1 — RAG có kết quả
  it('should include RAG context when regenerating with relevant knowledge', async () => {
    const ragResults = [
      {
        id: 'chunk-1',
        content: 'AI Chat hỗ trợ nhiều cuộc trò chuyện.',
        chunkIndex: 0,
        distance: 0.25
      }
    ]

    semanticSearchMock.mockResolvedValue(ragResults)
    buildContextMock.mockReturnValue(
      '[Chunk 0]\nAI Chat hỗ trợ nhiều cuộc trò chuyện.'
    )

    const req = createMockReq()
    const res = createMockRes()

    await regenerateMessage(req, res)

    expect(semanticSearchMock).toHaveBeenCalledWith(
      'AI Chat có hỗ trợ nhiều cuộc trò chuyện không?',
      3
    )

    expect(buildContextMock).toHaveBeenCalledWith(ragResults)

    expect(buildChatPromptMock).toHaveBeenCalledWith(
      'AI Chat có hỗ trợ nhiều cuộc trò chuyện không?',
      'Previous context',
      '',
      '[Chunk 0]\nAI Chat hỗ trợ nhiều cuộc trò chuyện.'
    )

    expect(createAIProviderMock).toHaveBeenCalledWith('ollama')

    expect(updateAssistantMessageMock).toHaveBeenCalledWith(
      'chat-id',
      'ai-message-id',
      'user-id',
      'Regenerated answer'
    )

    expect(resWriteMock).toHaveBeenCalledWith(
      `data: ${JSON.stringify({
        type: 'chunk',
        content: 'Regenerated'
      })}\n\n`
    )

    expect(resWriteMock).toHaveBeenCalledWith(
      `data: ${JSON.stringify({
        type: 'chunk',
        content: ' answer'
      })}\n\n`
    )

    expect(resWriteMock).toHaveBeenCalledWith(
      `data: ${JSON.stringify({
        type: 'done',
        message: {
          id: 'ai-message-id',
          sessionId: 'chat-id',
          role: 'ai',
          content: 'Regenerated answer'
        }
      })}\n\n`
    )

    expect(resEndMock).toHaveBeenCalled()
  })

  // TEST 2 — Không có RAG result
  it('should regenerate without RAG context when no knowledge is found', async () => {
    semanticSearchMock.mockResolvedValue([])

    const req = createMockReq()
    const res = createMockRes()

    await regenerateMessage(req, res)

    expect(semanticSearchMock).toHaveBeenCalledWith(
      'AI Chat có hỗ trợ nhiều cuộc trò chuyện không?',
      3
    )

    expect(buildContextMock).not.toHaveBeenCalled()

    expect(buildChatPromptMock).toHaveBeenCalledWith(
      'AI Chat có hỗ trợ nhiều cuộc trò chuyện không?',
      'Previous context',
      '',
      ''
    )

    expect(resFlushHeadersMock).toHaveBeenCalled()
    expect(resEndMock).toHaveBeenCalled()
  })

  // TEST 3 — RAG bị lỗi
  it('should continue regeneration when RAG retrieval fails', async () => {
    semanticSearchMock.mockRejectedValue(
      new Error('Gemini embedding service unavailable')
    )

    const warnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {})

    const req = createMockReq()
    const res = createMockRes()

    await regenerateMessage(req, res)

    expect(semanticSearchMock).toHaveBeenCalledWith(
      'AI Chat có hỗ trợ nhiều cuộc trò chuyện không?',
      3
    )

    expect(warnSpy).toHaveBeenCalledWith(
      'REGENERATE: RAG retrieval failed, continuing without RAG:',
      expect.any(Error)
    )

    expect(buildChatPromptMock).toHaveBeenCalledWith(
      'AI Chat có hỗ trợ nhiều cuộc trò chuyện không?',
      'Previous context',
      '',
      ''
    )

    expect(createAIProviderMock).toHaveBeenCalledWith('ollama')

    expect(resFlushHeadersMock).toHaveBeenCalled()
    expect(resEndMock).toHaveBeenCalled()

    warnSpy.mockRestore()
  })

  // TEST 4 — Message quá ngắn
  it('should skip RAG retrieval for very short user messages', async () => {
    prismaFindFirstMock.mockImplementation(({ where }) => {
      if (where.role === 'ai') {
        return Promise.resolve({
          id: 'ai-message-id',
          sessionId: 'chat-id',
          role: 'ai',
          createdAt: new Date('2026-01-01T10:00:00Z')
        })
      }
      if (where.role === 'user') {
        return Promise.resolve({
          id: 'user-message-id',
          sessionId: 'chat-id',
          role: 'user',
          content: 'Hi',
          createdAt: new Date('2026-01-01T09:59:00Z')
        })
      }
      return Promise.resolve(null)
    })

    const req = createMockReq()
    const res = createMockRes()

    await regenerateMessage(req, res)

    expect(semanticSearchMock).not.toHaveBeenCalled()
    expect(buildContextMock).not.toHaveBeenCalled()

    expect(buildChatPromptMock).toHaveBeenCalledWith(
      'Hi',
      'Previous context',
      '',
      ''
    )

    expect(resFlushHeadersMock).toHaveBeenCalled()
    expect(resEndMock).toHaveBeenCalled()
  })

  // Edge cases & branch coverage
  it('should return 401 when user is not authenticated', async () => {
    const req = createMockReq({ userId: undefined })
    const res = createMockRes()

    await regenerateMessage(req, res)

    expect(resStatusMock).toHaveBeenCalledWith(401)
    expect(resJsonMock).toHaveBeenCalledWith({
      message: 'Bạn chưa đăng nhập'
    })
  })

  it('should return 400 when model is not supported', async () => {
    getModelByIdMock.mockReturnValue(null)

    const req = createMockReq({
      body: { modelId: 'unknown-model' }
    })
    const res = createMockRes()

    await regenerateMessage(req, res)

    expect(resStatusMock).toHaveBeenCalledWith(400)
    expect(resJsonMock).toHaveBeenCalledWith({
      message: 'AI model không được hỗ trợ: unknown-model'
    })
  })

  it('should return 404 when target AI message is not found', async () => {
    prismaFindFirstMock.mockImplementation(({ where }) => {
      if (where.role === 'ai') {
        return Promise.resolve(null)
      }
      return Promise.resolve(null)
    })

    const req = createMockReq()
    const res = createMockRes()

    await regenerateMessage(req, res)

    expect(resStatusMock).toHaveBeenCalledWith(404)
    expect(resJsonMock).toHaveBeenCalledWith({
      message: 'Không tìm thấy tin nhắn AI'
    })
  })

  it('should return 400 when previous user message is not found', async () => {
    prismaFindFirstMock.mockImplementation(({ where }) => {
      if (where.role === 'ai') {
        return Promise.resolve({
          id: 'ai-message-id',
          sessionId: 'chat-id',
          role: 'ai',
          createdAt: new Date('2026-01-01T10:00:00Z')
        })
      }
      if (where.role === 'user') {
        return Promise.resolve(null)
      }
      return Promise.resolve(null)
    })

    const req = createMockReq()
    const res = createMockRes()

    await regenerateMessage(req, res)

    expect(resStatusMock).toHaveBeenCalledWith(400)
    expect(resJsonMock).toHaveBeenCalledWith({
      message: 'Không tìm thấy tin nhắn người dùng tương ứng'
    })
  })

  it('should return 404 when chat history is not found', async () => {
    getChatHistoryMock.mockResolvedValue(null)

    const req = createMockReq()
    const res = createMockRes()

    await regenerateMessage(req, res)

    expect(resStatusMock).toHaveBeenCalledWith(404)
    expect(resJsonMock).toHaveBeenCalledWith({
      message: 'Không tìm thấy cuộc trò chuyện'
    })
  })

  it('should return 413 when prompt exceeds MAX_AI_CONTEXT_CHARS', async () => {
    buildChatPromptMock.mockReturnValue('a'.repeat(30_001))

    const req = createMockReq()
    const res = createMockRes()

    await regenerateMessage(req, res)

    expect(resStatusMock).toHaveBeenCalledWith(413)
    expect(resJsonMock).toHaveBeenCalledWith({
      message: 'Nội dung cuộc trò chuyện quá lớn để xử lý.'
    })
  })

  it('should handle AI provider failure and send SSE error event', async () => {
    createAIProviderMock.mockReturnValue({
      generateResponseStream: async function* () {
        throw new Error('AI provider streaming error')
      }
    })

    const errorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    const req = createMockReq()
    const res = createMockRes()

    await regenerateMessage(req, res)

    expect(resWriteMock).toHaveBeenCalledWith(
      `data: ${JSON.stringify({
        type: 'error',
        message: 'Đã xảy ra lỗi khi regenerate'
      })}\n\n`
    )

    expect(resEndMock).toHaveBeenCalled()
    errorSpy.mockRestore()
  })
})
