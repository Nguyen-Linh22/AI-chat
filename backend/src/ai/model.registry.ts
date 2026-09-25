import type { AIProviderName } from './ai.config.js'

export interface AIModel {
  id: string
  name: string
  provider: AIProviderName
  model: string
}

export const AI_MODELS: AIModel[] = [
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
    id: 'gemini-3.6-flash',
    name: 'Gemini 3.6 Flash',
    provider: 'gemini',
    model: 'gemini-3.6-flash'
  },
    {
    id: 'groq-gpt-oss-20b',
    name: 'GPT OSS 20B (Groq)',
    provider: 'groq',
    model: 'openai/gpt-oss-20b'
  }
]

export const getModelById = (
  modelId: string
): AIModel | null => {
  return (
    AI_MODELS.find(
      (model) => model.id === modelId
    ) ?? null
  )
}

export const isSupportedModelId = (modelId: string): boolean => {
  return AI_MODELS.some((model) => model.id === modelId)
}