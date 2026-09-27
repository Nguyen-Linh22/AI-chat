import { beforeEach, describe, expect, it } from 'vitest'
import { useAuthStore } from './authStore'

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
    })
  })

  it('should have the correct initial state', () => {
    const state = useAuthStore.getState()

    expect(state.user).toBeNull()
  })

  it('should set the user', () => {
    const user = {
      id: 'user-1',
      email: 'test@example.com',
    }

    useAuthStore.getState().setUser(user as any)

    expect(useAuthStore.getState().user).toEqual(user)
  })

  it('should clear the user', () => {
    const user = {
      id: 'user-1',
      email: 'test@example.com',
    }

    useAuthStore.getState().setUser(user as any)

    expect(useAuthStore.getState().user).toEqual(user)

    useAuthStore.getState().clearUser()

    expect(useAuthStore.getState().user).toBeNull()
  })
})
