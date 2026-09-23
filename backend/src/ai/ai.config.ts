export type AIProviderName =
  | 'ollama'
  | 'gemini'
  | 'groq'
  | 'openai'

export const AI_PROVIDER: AIProviderName =
  (process.env.AI_PROVIDER as AIProviderName) ||
  'ollama'