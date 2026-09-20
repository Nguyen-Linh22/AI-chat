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
    id: 'ollama-qwen3-8b',
    name: 'Qwen 3 8B',
    provider: 'ollama',
    model: 'qwen3:8b'
  },
  {
    id: 'openai-gpt-5-mini',
    name: 'GPT-5 Mini',
    provider: 'openai',
    model: 'gpt-5-mini'
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