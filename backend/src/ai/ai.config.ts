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

export const AI_PROVIDER: AIProviderName = validateAIProvider(
  process.env.AI_PROVIDER
)

/**
 * Thời gian chờ tối đa cho một lần sinh phản hồi AI (120 giây).
 * Áp dụng thống nhất cho cả Stream SSE và non-stream chat.
 */
export const AI_TIMEOUT_MS = process.env.AI_TIMEOUT_MS
  ? parseInt(process.env.AI_TIMEOUT_MS, 10)
  : 120_000 // 120s = 2 phút