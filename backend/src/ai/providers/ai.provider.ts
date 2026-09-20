export interface AIProvider {
  generateResponse(
    prompt: string
  ): Promise<string>
}