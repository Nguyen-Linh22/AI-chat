import {
  AI_PROVIDER,
  GEMINI_MODEL,
  type AIProviderName,
  type GeminiGenerationModel
} from './ai.config.js'

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

interface ModelPolicyOptions {
  nodeEnv?: string
  provider?: AIProviderName
  geminiModel?: GeminiGenerationModel
}

/**
 * Returns the models a client may select in the current environment.
 * Production is restricted to the configured provider; development and test
 * retain the complete registry for local provider and mock coverage.
 */
export const getVisibleAIModels = ({
  nodeEnv = process.env.NODE_ENV,
  provider = AI_PROVIDER,
  geminiModel = GEMINI_MODEL
}: ModelPolicyOptions = {}): AIModel[] => {
  if (nodeEnv !== 'production') {
    return AI_MODELS
  }

  return AI_MODELS.filter((model) => {
    if (model.provider !== provider) {
      return false
    }

    return provider !== 'gemini' || model.model === geminiModel
  })
}

export const getModelById = (
  modelId: string,
  policyOptions?: ModelPolicyOptions
): AIModel | null => {
  return (
    getVisibleAIModels(policyOptions).find(
      (model) => model.id === modelId
    ) ?? null
  )
}

export const isSupportedModelId = (
  modelId: string,
  policyOptions?: ModelPolicyOptions
): boolean => {
  return getModelById(modelId, policyOptions) !== null
}
