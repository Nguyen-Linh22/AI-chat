import { apiClient } from './apiClient'

export interface Message {
  id: string
  chatSessionId: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export const getMessages = async (
  chatId: string
): Promise<Message[]> => {
  const response = await apiClient.get(
    `/api/chats/${chatId}/messages`
  )

  if (!response.ok) {
    throw new Error('Không thể lấy danh sách messages')
  }

  const data = await response.json()

  return data.messages
}

export interface SendMessageResponse {
  userMessage: Message
  assistantMessage: Message
}

export const sendMessage = async (
  chatId: string,
  content: string,
  modelId: string
): Promise<SendMessageResponse> => {
  const response = await apiClient.post(
    `/api/chats/${chatId}/messages`,
    {
      content,
      modelId
    }
  )

  if (!response.ok) {
    throw new Error('Không thể gửi message')
  }

  const data = await response.json()

  return data.data
}