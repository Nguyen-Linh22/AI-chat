import { GoogleGenAI } from '@google/genai'
import type { AIProvider } from './ai.provider.js'

export class GeminiProvider implements AIProvider {
  private client: GoogleGenAI

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({
      apiKey
    })
  }

  async generateResponse(
    prompt: string,
    model: string,
    signal?: AbortSignal
  ): Promise<string> {
    const response =
      await this.client.models.generateContent({
        model,
        contents: prompt,
        config: {
          abortSignal: signal
        }
      })

    return response.text ?? ''
  }

  async *generateResponseStream(
    prompt: string,
    model: string,
    signal?: AbortSignal
  ): AsyncGenerator<string> {
    const stream =
      await this.client.models.generateContentStream({
        model,
        contents: prompt,
        config: {
          abortSignal: signal
        }
      })

    for await (const chunk of stream) {
      if (signal?.aborted) {
        throw new Error('This operation was aborted')
      }

      const text = chunk.text

      if (text) {
        yield text
      }
    }
  }
}