export interface ChatContextMessage {
  role: 'user' | 'assistant'
  content: string
}

export const buildChatContext = (
  messages: ChatContextMessage[]
): string => {
  if (messages.length === 0) {
    return ''
  }

  return messages
    .map((message) => {
      const role =
        message.role === 'user'
          ? 'User'
          : 'Assistant'

      return `${role}: ${message.content}`
    })
    .join('\n')
}