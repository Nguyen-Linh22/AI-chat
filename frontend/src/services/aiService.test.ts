import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getAIModels } from './aiService'
import { apiClient } from './apiClient'

describe('aiService', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should return AI models when response is ok', async () => {
    const mockModels = [
      {
        id: 'ollama-qwen3-1.7b',
        name: 'Qwen 3 1.7B',
        provider: 'ollama',
        model: 'qwen3:1.7b',
      },
      {
        id: 'openai-gpt-5-mini',
        name: 'GPT-5 Mini',
        provider: 'openai',
        model: 'gpt-5-mini',
      },
    ]

    vi.spyOn(apiClient, 'get').mockResolvedValue({
      ok: true,
      json: async () => ({ models: mockModels }),
    } as Response)

    const models = await getAIModels()

    expect(apiClient.get).toHaveBeenCalledWith('/api/ai/models')
    expect(models).toEqual(mockModels)
  })

  it('should throw an error when response is not ok', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      ok: false,
    } as Response)

    await expect(getAIModels()).rejects.toThrow(
      'Không thể lấy danh sách AI model'
    )

    expect(apiClient.get).toHaveBeenCalledWith('/api/ai/models')
  })
})
