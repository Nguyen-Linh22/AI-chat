import { describe, it, expect, vi, beforeEach } from 'vitest'
import { streamMessage } from './streamService'

describe('streamService', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should stream chunks and complete successfully', async () => {
    const encoder = new TextEncoder()

    const mockUserMessage = {
      id: 'user-msg-1',
      chatSessionId: 'chat-1',
      role: 'user',
      content: 'Hello',
      createdAt: '2026-09-27T00:00:00.000Z',
      attachments: [],
    }

    const mockAssistantMessage = {
      id: 'assistant-msg-1',
      chatSessionId: 'chat-1',
      role: 'assistant',
      content: 'Hello world',
      createdAt: '2026-09-27T00:00:01.000Z',
      attachments: [],
    }

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            'data: {"type":"chunk","content":"Hello"}\n\n' +
            'data: {"type":"chunk","content":" world"}\n\n' +
            `data: ${JSON.stringify({
              type: 'done',
              userMessage: mockUserMessage,
              message: mockAssistantMessage,
            })}\n\n`
          )
        )
        controller.close()
      },
    })

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      body: stream,
    } as unknown as Response)

    const onChunk = vi.fn()

    const result = await streamMessage(
      'chat-1',
      'Hello',
      'ollama-qwen3-1.7b',
      onChunk
    )

    expect(globalThis.fetch).toHaveBeenCalled()

    expect(onChunk).toHaveBeenNthCalledWith(1, 'Hello')
    expect(onChunk).toHaveBeenNthCalledWith(2, ' world')

    expect(result).toEqual({
      userMessage: mockUserMessage,
      assistantMessage: mockAssistantMessage,
    })
  })

  it('should send the correct request to the stream endpoint', async () => {
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            'data: {"type":"done","userMessage":{"id":"user-1","role":"user","content":"Hello"},"message":{"id":"ai-1","role":"ai","content":"Hi"}}\n\n'
          )
        )
        controller.close()
      },
    })

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      body: stream,
    } as unknown as Response)

    const onChunk = vi.fn()
    const controller = new AbortController()

    await streamMessage(
      'chat-123',
      'Hello world',
      'ollama-qwen3-1.7b',
      onChunk,
      controller.signal
    )

    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [url, options] = fetchMock.mock.calls[0]

    expect(url).toBe(
      'http://localhost:3000/api/chats/chat-123/messages/stream'
    )

    expect(options?.method).toBe('POST')
    expect(options?.credentials).toBe('include')
    expect(options?.signal).toBe(controller.signal)

    expect(options?.body).toBeInstanceOf(FormData)

    const formData = options?.body as FormData

    expect(formData.get('content')).toBe('Hello world')
    expect(formData.get('modelId')).toBe('ollama-qwen3-1.7b')
    expect(formData.get('file')).toBeNull()
  })

  it('should include the attachment file in FormData', async () => {
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            'data: {"type":"done","userMessage":{"id":"user-1","role":"user","content":"Hello"},"message":{"id":"ai-1","role":"ai","content":"Hi"}}\n\n'
          )
        )
        controller.close()
      },
    })

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      body: stream,
    } as unknown as Response)

    const file = new File(['test content'], 'test.txt', {
      type: 'text/plain',
    })

    await streamMessage(
      'chat-123',
      'Hello',
      'ollama-qwen3-1.7b',
      vi.fn(),
      undefined,
      file
    )

    const [, options] = fetchMock.mock.calls[0]

    expect(options?.body).toBeInstanceOf(FormData)

    const formData = options?.body as FormData

    expect(formData.get('content')).toBe('Hello')
    expect(formData.get('modelId')).toBe('ollama-qwen3-1.7b')
    expect(formData.get('file')).toBe(file)
  })

  it('should throw when the HTTP response is not ok', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      body: null,
    } as unknown as Response)

    await expect(
      streamMessage(
        'chat-123',
        'Hello',
        'ollama-qwen3-1.7b',
        vi.fn()
      )
    ).rejects.toThrow()
  })

  it('should throw when the response has no body', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      body: null,
    } as unknown as Response)

    await expect(
      streamMessage(
        'chat-123',
        'Hello',
        'ollama-qwen3-1.7b',
        vi.fn()
      )
    ).rejects.toThrow('Backend không trả về response body')
  })

  it('should throw when the SSE stream contains an error event', async () => {
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            'data: {"type":"error","message":"AI provider failed"}\n\n'
          )
        )
        controller.close()
      },
    })

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      body: stream,
    } as unknown as Response)

    await expect(
      streamMessage(
        'chat-123',
        'Hello',
        'ollama-qwen3-1.7b',
        vi.fn()
      )
    ).rejects.toThrow('AI provider failed')
  })

  it('should throw when the stream ends without a done event', async () => {
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            'data: {"type":"chunk","content":"Hello"}\n\n'
          )
        )
        controller.close()
      },
    })

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      body: stream,
    } as unknown as Response)

    const onChunk = vi.fn()

    await expect(
      streamMessage(
        'chat-123',
        'Hello',
        'ollama-qwen3-1.7b',
        onChunk
      )
    ).rejects.toThrow()

    expect(onChunk).toHaveBeenCalledWith('Hello')
  })

  it('should normalize ai role to assistant in the done message', async () => {
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            'data: {"type":"done","userMessage":{"id":"user-1","role":"user","content":"Hello"},"message":{"id":"ai-1","role":"ai","content":"Hi"}}\n\n'
          )
        )
        controller.close()
      },
    })

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      body: stream,
    } as unknown as Response)

    const result = await streamMessage(
      'chat-123',
      'Hello',
      'ollama-qwen3-1.7b',
      vi.fn()
    )

    expect(result.assistantMessage.role).toBe('assistant')
    expect(result.assistantMessage.id).toBe('ai-1')
    expect(result.assistantMessage.content).toBe('Hi')
  })
})
