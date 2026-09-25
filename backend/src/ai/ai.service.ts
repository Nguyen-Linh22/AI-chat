import type { AIProviderName } from './ai.config.js'
import { createAIProvider } from './ai.router.js'

export const generateAIResponse = async (
  prompt: string,
  model: string,
  providerName: AIProviderName,
  signal?: AbortSignal
): Promise<string> => {
  const provider = createAIProvider(
    providerName
  )

  return provider.generateResponse(
    prompt,
    model,
    signal
  )
}