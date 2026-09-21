export interface AIProvider {
  generateResponse(
    prompt: string,
    model: string
  ): Promise<string>

  generateResponseStream(
    prompt: string,
    model: string,
    signal?: AbortSignal
  ): AsyncGenerator<string>
}