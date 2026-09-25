export interface AIProvider {
  generateResponse(
    prompt: string,
    model: string,
    signal?: AbortSignal
  ): Promise<string>

  generateResponseStream(
    prompt: string,
    model: string,
    signal?: AbortSignal
  ): AsyncGenerator<string>
}