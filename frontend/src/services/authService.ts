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

export interface GoogleAuthResponse {
  message: string
  user: User
}

export const loginWithGoogle = async (
  credential: string
): Promise<GoogleAuthResponse> => {
  const response = await apiClient.post('/api/auth/google', { credential })
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Đăng nhập Google thất bại')
  }

  return data
}