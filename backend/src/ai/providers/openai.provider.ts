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
    model: string
  ): Promise<string> {
    const response = await this.client.responses.create({
      model,
      input: prompt
    })

    return response.output_text
  }

  async *generateResponseStream(
    prompt: string,
    model: string
  ): AsyncGenerator<string> {
    const stream = await this.client.responses.create({
      model,
      input: prompt,
      stream: true
    })

    for await (const event of stream) {
      if (
        event.type ===
        'response.output_text.delta'
      ) {
        yield event.delta
      }
    }
  }
}