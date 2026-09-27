import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response } from 'express'
import { streamChatResponse } from '../../src/controllers/stream.controller.js'

const {
  createMessageMock,
  createAssistantMessageMock,
  getChatHistoryMock,
  buildChatContextMock,
  buildChatPromptMock,
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
