import { getChatHistory } from './context/chat-history.service.js'
import { buildChatContext } from './context/chat.context.js'
import { buildChatPrompt } from './prompts/chat.prompt.js'
import { generateAIResponse } from './ai.service.js'

export const generateChatResponse = async (
  chatId: string,
  userId: string,
  userMessage: string
): Promise<string | null> => {
  const history = await getChatHistory(
    chatId,
    userId
  )

  if (!history) {
    return null
  }

  const context = buildChatContext(history)

  const prompt = buildChatPrompt(
    userMessage,
    context
  )

  const response = await generateAIResponse(prompt)

  return response
}