import Groq from 'groq-sdk'
import type { AIProvider } from './ai.provider.js'

export class GroqProvider implements AIProvider {
  private client: Groq

  constructor(apiKey: string) {
    this.client = new Groq({
      apiKey
    })
  }

  async generateResponse(
    prompt: string,
    model: string
  ): Promise<string> {
    const response =
      await this.client.chat.completions.create({
        model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })

    return (
      response.choices[0]?.message?.content ??
      ''
    )
  }

  async *generateResponseStream(
    prompt: string,
    model: string,
    signal?: AbortSignal
  ): AsyncGenerator<string> {
    const stream =
    await this.client.chat.completions.create(
        {
        model,
        messages: [
            {
            role: 'user',
            content: prompt
            }
        ],
        stream: true
        },
        {
        signal
        }
    )

    for await (const chunk of stream) {
      const content =
        chunk.choices[0]?.delta?.content

      if (content) {
        yield content
      }
    }
  }
}