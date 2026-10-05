import { describe, expect, it } from 'vitest'
import {
  AI_MODELS,
  checkProviderAvailability,
  getModelById,
  getVisibleAIModels,
  isSupportedModelId
} from '../../src/ai/model.registry.js'

const EXPECTED_MODELS = [
  {
    id: 'gemini-3.6-flash',
    name: 'Gemini 3.6 Flash',
    provider: 'gemini',
    model: 'gemini-3.6-flash'
  },
  {
    id: 'ollama-qwen3-1.7b',
    name: 'Qwen 3 1.7B',
    provider: 'ollama',
    model: 'qwen3:1.7b'
  },
  {
    id: 'openai-gpt-5-mini',
    name: 'GPT-5 Mini',
    provider: 'openai',
    model: 'gpt-5-mini'
  },
  {
    id: 'groq-gpt-oss-20b',
    name: 'GPT OSS 20B (Groq)',
    provider: 'groq',
    model: 'openai/gpt-oss-20b'
  }
]

describe('AI model registry policy', () => {
  it('places Gemini 3.6 Flash at index 0 as the production default model', () => {
    expect(AI_MODELS[0].id).toBe('gemini-3.6-flash')
    expect(AI_MODELS[0].provider).toBe('gemini')

    const prodModels = getVisibleAIModels({ nodeEnv: 'production' })
    expect(prodModels[0].id).toBe('gemini-3.6-flash')
  })

  it('exposes all 4 registry models in production with Gemini first', () => {
    const models = getVisibleAIModels({
      nodeEnv: 'production',
      provider: 'gemini',
      geminiModel: 'gemini-3.6-flash'
    })
    expect(models).toHaveLength(4)
    expect(models).toMatchObject(EXPECTED_MODELS)
    expect(models.every((m) => typeof m.available === 'boolean')).toBe(true)
    expect(models[0].id).toBe('gemini-3.6-flash')
  })

  it('exposes all 4 registry models in development and test with Gemini first', () => {
    for (const nodeEnv of ['development', 'test']) {
      const models = getVisibleAIModels({ nodeEnv })
      expect(models).toHaveLength(4)
      expect(models).toMatchObject(EXPECTED_MODELS)
      expect(models.every((m) => typeof m.available === 'boolean')).toBe(true)
      expect(models[0].id).toBe('gemini-3.6-flash')
    }
  })

  it('finds each of the 4 models by ID via getModelById in all environments', () => {
    for (const expected of EXPECTED_MODELS) {
      const model = getModelById(expected.id)
      expect(model).toMatchObject(expected)
      expect(typeof model?.available).toBe('boolean')

      const prodModel = getModelById(expected.id, {
        nodeEnv: 'production',
        provider: 'gemini',
        geminiModel: 'gemini-3.6-flash'
      })
      expect(prodModel).toMatchObject(expected)
      expect(typeof prodModel?.available).toBe('boolean')

      expect(isSupportedModelId(expected.id)).toBe(true)
    }
  })

  it('does NOT contain DeepSeek in registry or supported models', () => {
    const deepseekModels = AI_MODELS.filter(
      (m) =>
        m.id.toLowerCase().includes('deepseek') ||
        m.name.toLowerCase().includes('deepseek') ||
        (m.provider as string).toLowerCase().includes('deepseek') ||
        m.model.toLowerCase().includes('deepseek')
    )
    expect(deepseekModels).toHaveLength(0)
    expect(getModelById('deepseek')).toBeNull()
    expect(isSupportedModelId('deepseek')).toBe(false)
  })

  it('rejects unsupported or unknown model IDs', () => {
    expect(getModelById('unknown-model')).toBeNull()
    expect(isSupportedModelId('unknown-model')).toBe(false)
  })

  it('keeps isSupportedModelId independent of availability status', () => {
    // Both available and disabled models should be supported IDs
    expect(isSupportedModelId('gemini-3.6-flash')).toBe(true)
    expect(isSupportedModelId('openai-gpt-5-mini')).toBe(true)
    expect(isSupportedModelId('ollama-qwen3-1.7b')).toBe(true)
    expect(isSupportedModelId('groq-gpt-oss-20b')).toBe(true)
  })
})

describe('checkProviderAvailability policy', () => {
  it('correctly handles Ollama availability between local and production', () => {
    const originalOllamaUrl = process.env.OLLAMA_BASE_URL
    try {
      delete process.env.OLLAMA_BASE_URL

      // In development, Ollama is always available locally
      expect(checkProviderAvailability('ollama', 'development')).toEqual({
        available: true
      })
      expect(checkProviderAvailability('ollama', 'test')).toEqual({
        available: true
      })

      // In production without OLLAMA_BASE_URL, Ollama is disabled
      expect(checkProviderAvailability('ollama', 'production')).toEqual({
        available: false,
        disabledReason: 'Chỉ khả dụng ở môi trường Local'
      })

      // In production with OLLAMA_BASE_URL, Ollama becomes available
      process.env.OLLAMA_BASE_URL = 'https://ollama.internal'
      expect(checkProviderAvailability('ollama', 'production')).toEqual({
        available: true
      })
    } finally {
      process.env.OLLAMA_BASE_URL = originalOllamaUrl
    }
  })

  it('correctly handles Gemini, Groq, and OpenAI API key availability', () => {
    const originalGemini = process.env.GEMINI_API_KEY
    const originalGroq = process.env.GROQ_API_KEY
    const originalOpenAI = process.env.OPENAI_API_KEY

    try {
      // Gemini
      delete process.env.GEMINI_API_KEY
      expect(checkProviderAvailability('gemini')).toEqual({
        available: false,
        disabledReason: 'Chưa cấu hình Gemini API key'
      })
      process.env.GEMINI_API_KEY = 'mock-key'
      expect(checkProviderAvailability('gemini')).toEqual({
        available: true
      })

      // Groq
      delete process.env.GROQ_API_KEY
      expect(checkProviderAvailability('groq')).toEqual({
        available: false,
        disabledReason: 'Chưa cấu hình Groq API key'
      })
      process.env.GROQ_API_KEY = 'mock-key'
      expect(checkProviderAvailability('groq')).toEqual({
        available: true
      })

      // OpenAI
      delete process.env.OPENAI_API_KEY
      expect(checkProviderAvailability('openai')).toEqual({
        available: false,
        disabledReason: 'Chưa cấu hình OpenAI API key'
      })
      process.env.OPENAI_API_KEY = 'mock-key'
      expect(checkProviderAvailability('openai')).toEqual({
        available: true
      })
    } finally {
      process.env.GEMINI_API_KEY = originalGemini
      process.env.GROQ_API_KEY = originalGroq
      process.env.OPENAI_API_KEY = originalOpenAI
    }
  })
})

