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
    prompt: string
  ): Promise<string> {
    const response = await this.client.responses.create({
      model: 'gpt-5-mini',
      input: prompt
    })

    return response.output_text
  }
}