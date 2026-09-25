import OpenAI from 'openai'
import type { AIProvider } from './ai.provider.js'

export class OpenAIProvider implements AIProvider {
  private client: OpenAI

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey
    })
  }

  async generateResponse(
    prompt: string,
    model: string,
    signal?: AbortSignal
  ): Promise<string> {
    const response = await this.client.responses.create(
      {
        model,
        input: prompt
      },
      { signal }
    )

    return response.output_text
  }

  async *generateResponseStream(
    prompt: string,
    model: string,
    signal?: AbortSignal
  ): AsyncGenerator<string> {
    const stream = await this.client.responses.create(
      {
        model,
        input: prompt,
        stream: true
      },
      { signal }
    )

    for await (const event of stream) {
      if (signal?.aborted) {
        throw new Error('This operation was aborted')
      }

      if (
        event.type ===
        'response.output_text.delta'
      ) {
        yield event.delta
      }
    }
  }
}