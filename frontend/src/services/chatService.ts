import { apiClient } from './apiClient'

export interface ChatSession {
  id: string
  userId: string
  title: string
  createdAt: string
  updatedAt: string
}

export const getChats = async (): Promise<ChatSession[]> => {
  const response = await apiClient.get('/api/chats')

  if (!response.ok) {
    throw new Error('Không thể lấy danh sách chat')
  }

  const data = await response.json()

  return data.chats
}

export const createChat = async (): Promise<ChatSession> => {
  const response = await apiClient.post('/api/chats')

  if (!response.ok) {
    throw new Error('Không thể tạo chat mới')
  }

  const data = await response.json()

  return data.chat
}

export const deleteChat = async (chatId: string): Promise<void> => {
  const response = await apiClient.delete(`/api/chats/${chatId}`)

  if (!response.ok) {
    throw new Error('Không thể xóa chat')
  }
}