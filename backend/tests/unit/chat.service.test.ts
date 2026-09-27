import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateChatResponse } from '../../src/ai/chat.service.js'

const { generateAIResponseMock } = vi.hoisted(() => ({
  generateAIResponseMock: vi.fn()
}))

vi.mock('../../src/ai/ai.service.js', () => ({
  generateAIResponse: generateAIResponseMock
}))

vi.mock('../../src/ai/context/chat-history.service.js', () => ({
  getChatHistory: vi.fn().mockResolvedValue([
    {
      role: 'user',
      content: 'Previous message'
    }
  ])
}))

describe('Chat Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should generate AI response using the selected model', async () => {
    generateAIResponseMock.mockResolvedValue('AI response')

    const response = await generateChatResponse(
      'chat-id',
      'user-id',
      'Hello',
      'ollama-qwen3-1.7b'
    )

    expect(response).toBe('AI response')

    expect(generateAIResponseMock).toHaveBeenCalledWith(
      expect.stringContaining('Hello'),
      'qwen3:1.7b',
      'ollama',
      undefined
    )
  })

  it('should forward AbortSignal to AI service', async () => {
    generateAIResponseMock.mockResolvedValue('AI response')

    const controller = new AbortController()

    await generateChatResponse(
      'chat-id',
      'user-id',
      'Cancel test',
      'ollama-qwen3-1.7b',
      controller.signal
    )

    expect(generateAIResponseMock).toHaveBeenCalledWith(
      expect.stringContaining('Cancel test'),
      'qwen3:1.7b',
      'ollama',
      controller.signal
    )
  })

  it('should return null when chat history is not found', async () => {
    const { getChatHistory } =
      await import('../../src/ai/context/chat-history.service.js')

    vi.mocked(getChatHistory).mockResolvedValueOnce(null)

    const response = await generateChatResponse(
      'missing-chat',
      'user-id',
      'Hello',
      'ollama-qwen3-1.7b'
    )

    expect(response).toBeNull()
    expect(generateAIResponseMock).not.toHaveBeenCalled()
  })
})
