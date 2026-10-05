import { describe, expect, it } from 'vitest'
import {
  getModelById,
  getVisibleAIModels,
  isSupportedModelId
} from '../../src/ai/model.registry.js'

const geminiProductionPolicy = {
  nodeEnv: 'production',
  provider: 'gemini' as const,
  geminiModel: 'gemini-3.6-flash' as const
}

describe('AI model registry production policy', () => {
  it('exposes only the configured Gemini model in production', () => {
    expect(getVisibleAIModels(geminiProductionPolicy)).toEqual([
      expect.objectContaining({
        id: 'gemini-3.6-flash',
        provider: 'gemini',
        model: 'gemini-3.6-flash'
      })
    ])
  })

  it('accepts the configured Gemini model in production', () => {
    expect(
      getModelById('gemini-3.6-flash', geminiProductionPolicy)
    ).toEqual(expect.objectContaining({ provider: 'gemini' }))
  })

  it.each([
    'ollama-qwen3-1.7b',
    'openai-gpt-5-mini',
    'groq-gpt-oss-20b',
    'unknown-model'
  ])('rejects %s in Gemini production', (modelId) => {
    expect(isSupportedModelId(modelId, geminiProductionPolicy)).toBe(false)
  })

  it('retains the multi-provider registry for development and test', () => {
    for (const nodeEnv of ['development', 'test']) {
      const models = getVisibleAIModels({ nodeEnv, provider: 'gemini' })
      expect(models).toHaveLength(4)
      expect(models.map((model) => model.provider)).toEqual([
        'ollama',
        'openai',
        'gemini',
        'groq'
      ])
    }
  })
})
