export interface AIProvider {
  generateResponse(
    prompt: string,
    model: string
  ): Promise<string>
}