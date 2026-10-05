import { describe, expect, it } from 'vitest'
import {
  AI_MODELS,
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
    expect(models).toEqual(EXPECTED_MODELS)
    expect(models[0].id).toBe('gemini-3.6-flash')
  })

  it('exposes all 4 registry models in development and test with Gemini first', () => {
    for (const nodeEnv of ['development', 'test']) {
      const models = getVisibleAIModels({ nodeEnv })
      expect(models).toHaveLength(4)
      expect(models).toEqual(EXPECTED_MODELS)
      expect(models[0].id).toBe('gemini-3.6-flash')
    }
  })

  it('finds each of the 4 models by ID via getModelById in all environments', () => {
    for (const expected of EXPECTED_MODELS) {
      expect(getModelById(expected.id)).toEqual(expected)
      expect(
        getModelById(expected.id, {
          nodeEnv: 'production',
          provider: 'gemini',
          geminiModel: 'gemini-3.6-flash'
        })
      ).toEqual(expected)
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
})
