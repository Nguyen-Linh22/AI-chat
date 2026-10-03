import type { AIProvider } from './providers/ai.provider.js'
import type { AIProviderName } from './ai.config.js'
import { OllamaProvider } from './providers/ollama.provider.js'
import { OpenAIProvider } from './providers/openai.provider.js'
import { GeminiProvider } from './providers/gemini.provider.js'
import { GroqProvider } from './providers/groq.provider.js'

export const createAIProvider = (
  providerName: AIProviderName
): AIProvider => {
  switch (providerName) {
    case 'ollama':
      if (process.env.NODE_ENV === 'production' && !process.env.OLLAMA_BASE_URL) {
        throw new Error(
          'OLLAMA_BASE_URL chưa được cấu hình cho môi trường production'
        )
      }
      return new OllamaProvider()

    case 'openai': {
      const apiKey = process.env.OPENAI_API_KEY

      if (!apiKey) {
        throw new Error(
          'OPENAI_API_KEY chưa được cấu hình'
        )
      }

      return new OpenAIProvider(apiKey)
    }

    case 'gemini': {
      const apiKey = process.env.GEMINI_API_KEY

      if (!apiKey) {
        throw new Error(
          'GEMINI_API_KEY chưa được cấu hình'
        )
      }

      return new GeminiProvider(apiKey)
    }

    case 'groq': {
      const apiKey = process.env.GROQ_API_KEY

      if (!apiKey) {
        throw new Error(
          'GROQ_API_KEY chưa được cấu hình'
        )
      }

      return new GroqProvider(apiKey)
    }

    default:
      throw new Error(
        `AI provider chưa được hỗ trợ: ${providerName}`
      )
  }
}