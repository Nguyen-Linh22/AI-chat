import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getMessages, sendMessage, regenerateMessage } from './messageService'
import { apiClient } from './apiClient'

describe('messageService', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should return messages and normalize ai role to assistant when response is ok', async () => {
    const mockMessages = [
      {
        id: 'message-1',
        chatSessionId: 'chat-1',
        role: 'user',
        content: 'Hello',
        createdAt: '2026-09-27T00:00:00.000Z',
        attachments: [],
      },
      {
        id: 'message-2',
        chatSessionId: 'chat-1',
        role: 'ai',
        content: 'Xin chào!',
        createdAt: '2026-09-27T00:00:01.000Z',
        attachments: [],
      },
    ]

    vi.spyOn(apiClient, 'get').mockResolvedValue({
      ok: true,
      json: async () => ({ messages: mockMessages }),
    } as Response)

    const messages = await getMessages('chat-1')

    expect(apiClient.get).toHaveBeenCalledWith(
      '/api/chats/chat-1/messages?limit=100'
    )
    expect(messages).toEqual([
      mockMessages[0],
      {
        ...mockMessages[1],
        role: 'assistant',
      },
    ])
  })

  it('should throw an error when get messages response is not ok', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      ok: false,
    } as Response)

    await expect(
      getMessages('chat-1')
    ).rejects.toThrow('Không thể lấy danh sách messages')

    expect(apiClient.get).toHaveBeenCalledWith(
      '/api/chats/chat-1/messages?limit=100'
    )
  })

  it('should send a message and return the created messages when response is ok', async () => {
    const mockResponse = {
      userMessage: {
        id: 'message-1',
        sessionId: 'chat-1',
        role: 'user',
        content: 'Hello',
        createdAt: '2026-09-27T00:00:00.000Z',
      },
      assistantMessage: {
        id: 'message-2',
        sessionId: 'chat-1',
        role: 'assistant',
        content: 'Xin chào!',
        createdAt: '2026-09-27T00:00:01.000Z',
      },
    }

    vi.spyOn(apiClient, 'post').mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockResponse }),
    } as Response)

    const result = await sendMessage(
      'chat-1',
      'Hello',
      'ollama-qwen3-1.7b'
    )

    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/chats/chat-1/messages',
      {
        content: 'Hello',
        modelId: 'ollama-qwen3-1.7b',
      }
    )

    expect(result).toEqual(mockResponse)
  })

  it('should throw an error when send message response is not ok', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue({
      ok: false,
    } as Response)

    await expect(
      sendMessage(
        'chat-1',
        'Hello',
        'ollama-qwen3-1.7b'
      )
    ).rejects.toThrow('Không thể gửi message')

    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/chats/chat-1/messages',
      {
        content: 'Hello',
        modelId: 'ollama-qwen3-1.7b',
      }
    )
  })

  it('should stream regenerate chunks via onChunk callback when response is ok', async () => {
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            'data: {"type":"chunk","content":"Câu trả lời"}\n\ndata: {"type":"chunk","content":" mới"}\n\ndata: {"type":"done"}\n\n'
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

    await regenerateMessage(
      'chat-1',
      'message-2',
      'ollama-qwen3-1.7b',
      onChunk
    )

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/chats/chat-1/messages/message-2/regenerate',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          modelId: 'ollama-qwen3-1.7b',
        }),
      })
    )

    expect(onChunk).toHaveBeenCalledWith('Câu trả lời')
    expect(onChunk).toHaveBeenCalledWith(' mới')
  })

  it('should throw an error when regenerate response is not ok', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
    } as Response)

    const onChunk = vi.fn()

    await expect(
      regenerateMessage(
        'chat-1',
        'message-2',
        'ollama-qwen3-1.7b',
        onChunk
      )
    ).rejects.toThrow('Không thể regenerate message')

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/chats/chat-1/messages/message-2/regenerate',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          modelId: 'ollama-qwen3-1.7b',
        }),
      })
    )

    expect(onChunk).not.toHaveBeenCalled()
  })

  it('should throw an error when response has no body', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      body: null,
    } as Response)

    const onChunk = vi.fn()

    await expect(
      regenerateMessage(
        'chat-1',
        'message-2',
        'ollama-qwen3-1.7b',
        onChunk
      )
    ).rejects.toThrow('Server không trả về stream')

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/chats/chat-1/messages/message-2/regenerate',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          modelId: 'ollama-qwen3-1.7b',
        }),
      })
    )

    expect(onChunk).not.toHaveBeenCalled()
  })

  it('should throw the server error when SSE stream returns an error event', async () => {
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            'data: {"type":"error","message":"AI provider thất bại"}\n\n'
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
      regenerateMessage(
        'chat-1',
        'message-2',
        'ollama-qwen3-1.7b',
        onChunk
      )
    ).rejects.toThrow('AI provider thất bại')

    expect(onChunk).not.toHaveBeenCalled()
  })

  it('should pass AbortSignal to fetch and ignore SSE comment lines', async () => {
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            ': keep-alive\n\n' +
            'data: {"type":"chunk","content":"Hello"}\n\n' +
            'data: {"type":"done"}\n\n'
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

    await regenerateMessage(
      'chat-1',
      'message-2',
      'ollama-qwen3-1.7b',
      onChunk,
      controller.signal
    )

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/chats/chat-1/messages/message-2/regenerate',
      expect.objectContaining({
        signal: controller.signal,
      })
    )

    expect(onChunk).toHaveBeenCalledTimes(1)
    expect(onChunk).toHaveBeenCalledWith('Hello')
  })
})
