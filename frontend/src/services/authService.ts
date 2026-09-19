import { apiClient } from './apiClient'

export interface User {
  id: string
  email: string
  createdAt: string
}

export const getCurrentUser = async (): Promise<User | null> => {
  const response = await apiClient.get('/api/auth/me')

  if (!response.ok) {
    return null
  }

  const data = await response.json()

  return data.user
}

export const logout = async (): Promise<void> => {
  await apiClient.post('/api/auth/logout')
}