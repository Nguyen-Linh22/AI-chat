import type { AIProvider } from './ai.provider.js'

export class OllamaProvider implements AIProvider {
  private baseUrl: string
  private model: string

  constructor() {
    this.baseUrl =
      process.env.OLLAMA_BASE_URL ||
      'http://localhost:11434'

    this.model =
      process.env.OLLAMA_MODEL ||
      'qwen3:1.7b'
  }

  async generateResponse(
    prompt: string
  ): Promise<string> {
    const response = await fetch(
      `${this.baseUrl}/api/generate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
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
}