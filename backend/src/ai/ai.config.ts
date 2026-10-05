export type AIProviderName =
  | 'ollama'
  | 'gemini'
  | 'groq'
  | 'openai'

export const VALID_AI_PROVIDERS: readonly AIProviderName[] = [
  'ollama',
  'gemini',
  'groq',
  'openai'
] as const

/** Gemini text-generation models approved for this application. */
export const VALID_GEMINI_GENERATION_MODELS = [
  'gemini-3.6-flash'
] as const

export type GeminiGenerationModel =
  (typeof VALID_GEMINI_GENERATION_MODELS)[number]

export const validateAIProvider = (
  provider?: string,
  nodeEnv = process.env.NODE_ENV
): AIProviderName => {
  if (nodeEnv === 'production') {
    if (!provider) {
      throw new Error(
        'AI_PROVIDER chưa được cấu hình cho môi trường production'
      )
    }

    if (!VALID_AI_PROVIDERS.includes(provider as AIProviderName)) {
      throw new Error(
        `AI_PROVIDER không hợp lệ: "${provider}". Các giá trị hợp lệ: ${VALID_AI_PROVIDERS.join(', ')}`
      )
    }

    return provider as AIProviderName
  }

  return provider && VALID_AI_PROVIDERS.includes(provider as AIProviderName)
    ? (provider as AIProviderName)
    : 'ollama'
}

export const validateGeminiModel = (
  model: string | undefined,
  provider: AIProviderName,
  nodeEnv = process.env.NODE_ENV
): GeminiGenerationModel | undefined => {
  if (nodeEnv !== 'production' || provider !== 'gemini') {
    return undefined
  }

  if (!model) {
    throw new Error(
      'GEMINI_MODEL chưa được cấu hình cho môi trường production khi AI_PROVIDER=gemini'
    )
  }

  if (!VALID_GEMINI_GENERATION_MODELS.includes(model as GeminiGenerationModel)) {
    throw new Error(
      `GEMINI_MODEL không hợp lệ: "${model}". Các giá trị hợp lệ: ${VALID_GEMINI_GENERATION_MODELS.join(', ')}`
    )
  }

  return model as GeminiGenerationModel
}

export const AI_PROVIDER: AIProviderName = validateAIProvider(
  process.env.AI_PROVIDER
)

export const GEMINI_MODEL = validateGeminiModel(
  process.env.GEMINI_MODEL,
  AI_PROVIDER
)

/**
 * Thời gian chờ tối đa cho một lần sinh phản hồi AI (120 giây).
 * Áp dụng thống nhất cho cả Stream SSE và non-stream chat.
 */
export const AI_TIMEOUT_MS = process.env.AI_TIMEOUT_MS
  ? parseInt(process.env.AI_TIMEOUT_MS, 10)
  : 120_000 // 120s = 2 phút
