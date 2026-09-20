import { apiClient } from './apiClient'

export interface AIModel {
  id: string
  name: string
  provider: string
  model: string
}

export const getAIModels = async (): Promise<AIModel[]> => {
  const response = await apiClient.get('/api/ai/models')

  if (!response.ok) {
    throw new Error('Không thể lấy danh sách AI model')
  }

  const data = await response.json()

  return data.models
}