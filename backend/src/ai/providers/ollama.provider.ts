import type { AIProvider } from './ai.provider.js'

export class OllamaProvider implements AIProvider {
  private baseUrl: string

  constructor() {
    this.baseUrl =
      process.env.OLLAMA_BASE_URL ||
      'http://localhost:11434'
  }

  async generateResponse(
    prompt: string,
    model: string
  ): Promise<string> {
    const response = await fetch(
      `${this.baseUrl}/api/generate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          prompt,
          stream: false
        })
      }
    )

    if (!response.ok) {
      throw new Error(
        `Ollama request failed: ${response.status}`
      )
    }

    const data = await response.json()

    return data.response
  }

  async *generateResponseStream(
    prompt: string,
    model: string,
    signal?: AbortSignal
  ): AsyncGenerator<string> {
    console.log('OLLAMA STREAM URL:', this.baseUrl)
    console.log('OLLAMA STREAM MODEL:', model)

    const response = await fetch(
      `${this.baseUrl}/api/generate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          prompt,
          stream: true
        }),
        signal
      }
    )

    if (!response.ok) {
      throw new Error(
        `Ollama request failed: ${response.status}`
      )
    }

    if (!response.body) {
      throw new Error(
        'Ollama không trả về response body'
      )
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    let buffer = ''

    while (true) {
      const { value, done } =
        await reader.read()

      if (done) {
        break
      }

      buffer += decoder.decode(value, {
        stream: true
      })

      const lines = buffer.split('\n')

      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.trim()) {
          continue
        }

        const data = JSON.parse(line)

        if (data.response) {
          yield data.response
        }

        if (data.done) {
          return
        }
      }
    }
  }
}