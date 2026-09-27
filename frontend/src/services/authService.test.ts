import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getCurrentUser, logout } from './authService'
import { apiClient } from './apiClient'

describe('authService', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should return current user when response is ok', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      createdAt: '2026-09-27T00:00:00.000Z',
    }

    vi.spyOn(apiClient, 'get').mockResolvedValue({
      ok: true,
      json: async () => ({ user: mockUser }),
    } as Response)

    const user = await getCurrentUser()

    expect(apiClient.get).toHaveBeenCalledWith('/api/auth/me')
    expect(user).toEqual(mockUser)
  })

  it('should return null when response is not ok', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      ok: false,
    } as Response)

    const user = await getCurrentUser()

    expect(apiClient.get).toHaveBeenCalledWith('/api/auth/me')
    expect(user).toBeNull()
  })

  it('should call logout endpoint', async () => {
    const postSpy = vi
      .spyOn(apiClient, 'post')
      .mockResolvedValue({
        ok: true,
      } as Response)

    await logout()

    expect(postSpy).toHaveBeenCalledWith('/api/auth/logout')
  })
})
