import { describe, it, expect, vi } from 'vitest'
import { generateAIResponse } from '../../src/ai/ai.service.js'

const generateResponseMock = vi.fn()

vi.mock('../../src/ai/ai.router.js', () => ({
  createAIProvider: vi.fn(() => ({
    generateResponse: generateResponseMock,
    generateResponseStream: vi.fn()
  }))
}))

describe('AI Service', () => {
  it('should generate AI response with the correct prompt, model and provider', async () => {
    generateResponseMock.mockResolvedValue('Hello from AI')

    const response = await generateAIResponse(
      'Hello',
      'qwen3:1.7b',
      'ollama'
    )

    expect(response).toBe('Hello from AI')

    expect(generateResponseMock).toHaveBeenCalledWith(
      'Hello',
      'qwen3:1.7b',
      undefined
    )
  })

  it('should forward AbortSignal to the AI provider', async () => {
    generateResponseMock.mockResolvedValue('Response')

    const controller = new AbortController()

    await generateAIResponse(
      'Test cancellation',
      'qwen3:1.7b',
      'ollama',
      controller.signal
    )

    expect(generateResponseMock).toHaveBeenCalledWith(
      'Test cancellation',
      'qwen3:1.7b',
      controller.signal
    )
  })

  it('should propagate AI provider errors', async () => {
    const error = new Error('AI provider failed')

    generateResponseMock.mockRejectedValue(error)

    await expect(
      generateAIResponse(
        'Test error',
        'qwen3:1.7b',
        'ollama'
      )
    ).rejects.toThrow('AI provider failed')
  })
})
