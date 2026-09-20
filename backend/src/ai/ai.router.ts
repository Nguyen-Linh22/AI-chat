import type { AIProvider } from './providers/ai.provider.js'
import type { AIProviderName } from './ai.config.js'
import { OllamaProvider } from './providers/ollama.provider.js'
import { OpenAIProvider } from './providers/openai.provider.js'

export const createAIProvider = (
  providerName: AIProviderName
): AIProvider => {
  switch (providerName) {
    case 'ollama':
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

    default:
      throw new Error(
        `AI provider chưa được hỗ trợ: ${providerName}`
      )
  }
}