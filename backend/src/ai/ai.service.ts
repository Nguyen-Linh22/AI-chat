import { AI_PROVIDER } from './ai.config.js'
import type { AIProvider } from './providers/ai.provider.js'
import { OllamaProvider } from './providers/ollama.provider.js'
import { OpenAIProvider } from './providers/openai.provider.js'

const createAIProvider = (): AIProvider => {
  switch (AI_PROVIDER) {
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
        `AI provider chưa được hỗ trợ: ${AI_PROVIDER}`
      )
  }
}

const provider = createAIProvider()

export const generateAIResponse = async (
  prompt: string
): Promise<string> => {
  return provider.generateResponse(prompt)
}