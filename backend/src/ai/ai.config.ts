export type AIProviderName =
  | 'ollama'
  | 'gemini'
  | 'groq'
  | 'openai'

export const AI_PROVIDER: AIProviderName =
  (process.env.AI_PROVIDER as AIProviderName) ||
  'ollama'

/**
 * Thời gian chờ tối đa cho một lần sinh phản hồi AI (120 giây).
 * Áp dụng thống nhất cho cả Stream SSE và non-stream chat.
 */
export const AI_TIMEOUT_MS = process.env.AI_TIMEOUT_MS
  ? parseInt(process.env.AI_TIMEOUT_MS, 10)
  : 120_000 // 120s = 2 phút