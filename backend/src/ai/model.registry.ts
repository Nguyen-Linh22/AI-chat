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

export interface VisibleAIModel extends AIModel {
  available: boolean
  disabledReason?: string
}

export const AI_MODELS: AIModel[] = [
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

export interface ModelPolicyOptions {
  nodeEnv?: string
  provider?: AIProviderName
  geminiModel?: GeminiGenerationModel
}

export const checkProviderAvailability = (
  provider: AIProviderName,
  nodeEnv = process.env.NODE_ENV
): { available: boolean; disabledReason?: string } => {
  switch (provider) {
    case 'gemini':
      return process.env.GEMINI_API_KEY
        ? { available: true }
        : {
            available: false,
            disabledReason: 'Chưa cấu hình Gemini API key'
          }

    case 'groq':
      return process.env.GROQ_API_KEY
        ? { available: true }
        : {
            available: false,
            disabledReason: 'Chưa cấu hình Groq API key'
          }

    case 'openai':
      return process.env.OPENAI_API_KEY
        ? { available: true }
        : {
            available: false,
            disabledReason: 'Chưa cấu hình OpenAI API key'
          }

    case 'ollama':
      if (nodeEnv === 'production' && !process.env.OLLAMA_BASE_URL) {
        return {
          available: false,
          disabledReason: 'Chỉ khả dụng ở môi trường Local'
        }
      }

      return { available: true }

    default:
      return {
        available: false,
        disabledReason: 'Provider không được hỗ trợ'
      }
  }
}

/**
 * Returns the models a client may see in the current environment.
 *
 * All registered models remain visible across environments.
 * Availability is calculated from the current provider configuration.
 */
export const getVisibleAIModels = ({
  nodeEnv = process.env.NODE_ENV,
  provider = AI_PROVIDER,
  geminiModel = GEMINI_MODEL
}: ModelPolicyOptions = {}): VisibleAIModel[] => {
  void provider
  void geminiModel

  return AI_MODELS.map((model) => ({
    ...model,
    ...checkProviderAvailability(model.provider, nodeEnv)
  }))
}

export const getModelById = (
  modelId: string,
  policyOptions?: ModelPolicyOptions
): VisibleAIModel | null => {
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