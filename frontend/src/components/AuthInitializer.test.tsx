import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import AuthInitializer from './AuthInitializer'

const {
  getCurrentUserMock,
  getChatsMock,
  getAIModelsMock,
  setUserMock,
  clearUserMock,
  setChatsMock,
  setCurrentChatIdMock,
  setModelsMock,
  setSelectedModelIdMock,
  getAIStoreStateMock,
  getChatStoreStateMock,
} = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  getChatsMock: vi.fn(),
  getAIModelsMock: vi.fn(),
  setUserMock: vi.fn(),
  clearUserMock: vi.fn(),
  setChatsMock: vi.fn(),
  setCurrentChatIdMock: vi.fn(),
  setModelsMock: vi.fn(),
  setSelectedModelIdMock: vi.fn(),
  getAIStoreStateMock: vi.fn(),
  getChatStoreStateMock: vi.fn(),
}))

vi.mock('../services/authService', () => ({
  getCurrentUser: getCurrentUserMock,
}))

vi.mock('../services/chatService', () => ({
  getChats: getChatsMock,
}))

vi.mock('../services/aiService', () => ({
  getAIModels: getAIModelsMock,
}))

vi.mock('../stores/authStore', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({
      setUser: setUserMock,
      clearUser: clearUserMock,
    }),
}))

vi.mock('../stores/chatStore', () => ({
  useChatStore: Object.assign(
    (selector: (state: unknown) => unknown) =>
      selector({
        setChats: setChatsMock,
        setCurrentChatId: setCurrentChatIdMock,
      }),
    {
      getState: getChatStoreStateMock,
    }
  ),
}))

vi.mock('../stores/aiStore', () => ({
  useAIStore: Object.assign(
    (selector: (state: unknown) => unknown) =>
      selector({
        setModels: setModelsMock,
        setSelectedModelId: setSelectedModelIdMock,
      }),
    {
      getState: getAIStoreStateMock,
    }
  ),
}))

describe('AuthInitializer', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    getAIModelsMock.mockResolvedValue([])
    getCurrentUserMock.mockResolvedValue(null)
    getChatsMock.mockResolvedValue([])

    getAIStoreStateMock.mockReturnValue({
      selectedModelId: null,
    })

    getChatStoreStateMock.mockReturnValue({
      currentChatId: null,
    })

    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loads AI models and selects the first model when no model is selected', async () => {
    const models = [
      { id: 'gpt-1', name: 'GPT 1' },
      { id: 'gpt-2', name: 'GPT 2' },
    ]

    getAIModelsMock.mockResolvedValue(models)

    render(<AuthInitializer />)

    await waitFor(() => {
      expect(setModelsMock).toHaveBeenCalledWith(models)
    })

    expect(setSelectedModelIdMock).toHaveBeenCalledWith('gpt-1')
  })

  it('keeps the existing selected model', async () => {
    const models = [
      { id: 'gpt-1', name: 'GPT 1' },
      { id: 'gpt-2', name: 'GPT 2' },
    ]

    getAIModelsMock.mockResolvedValue(models)

    getAIStoreStateMock.mockReturnValue({
      selectedModelId: 'gpt-2',
    })

    render(<AuthInitializer />)

    await waitFor(() => {
      expect(setModelsMock).toHaveBeenCalledWith(models)
    })

    expect(setSelectedModelIdMock).not.toHaveBeenCalled()
  })

  it('normalizes a selected model that is absent from the fetched list', async () => {
    const models = [
      { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash' },
      { id: 'gpt-2', name: 'GPT 2' },
    ]

    getAIModelsMock.mockResolvedValue(models)
    getAIStoreStateMock.mockReturnValue({
      selectedModelId: 'ollama-qwen3-1.7b',
    })

    render(<AuthInitializer />)

    await waitFor(() => {
      expect(setModelsMock).toHaveBeenCalledWith(models)
    })

    expect(setSelectedModelIdMock).toHaveBeenCalledWith('gemini-3.6-flash')
  })

  it('handles an empty AI model list', async () => {
    getAIModelsMock.mockResolvedValue([])

    render(<AuthInitializer />)

    await waitFor(() => {
      expect(setModelsMock).toHaveBeenCalledWith([])
    })

    expect(setSelectedModelIdMock).not.toHaveBeenCalled()
  })

  it('continues auth initialization when loading AI models fails', async () => {
    const user = {
      id: 'user-1',
      email: 'test@example.com',
    }

    getAIModelsMock.mockRejectedValue(new Error('AI service unavailable'))
    getCurrentUserMock.mockResolvedValue(user)
    getChatsMock.mockResolvedValue([])

    render(<AuthInitializer />)

    await waitFor(() => {
      expect(getCurrentUserMock).toHaveBeenCalledTimes(1)
    })

    expect(setUserMock).toHaveBeenCalledWith(user)
  })

  it('clears auth and chat state when there is no authenticated user', async () => {
    getCurrentUserMock.mockResolvedValue(null)

    render(<AuthInitializer />)

    await waitFor(() => {
      expect(clearUserMock).toHaveBeenCalledTimes(1)
    })

    expect(setChatsMock).toHaveBeenCalledWith([])
    expect(setCurrentChatIdMock).toHaveBeenCalledWith(null)
    expect(getChatsMock).not.toHaveBeenCalled()
  })

  it('sets user and loads chats when authenticated', async () => {
    const user = {
      id: 'user-1',
      email: 'test@example.com',
    }

    const chats = [
      {
        id: 'chat-1',
        title: 'Chat 1',
      },
    ]

    getCurrentUserMock.mockResolvedValue(user)
    getChatsMock.mockResolvedValue(chats)

    render(<AuthInitializer />)

    await waitFor(() => {
      expect(setUserMock).toHaveBeenCalledWith(user)
      expect(setChatsMock).toHaveBeenCalledWith(chats)
    })

    expect(getChatsMock).toHaveBeenCalledTimes(1)
  })

  it('selects the first chat when the current chat no longer exists', async () => {
    const user = {
      id: 'user-1',
      email: 'test@example.com',
    }

    const chats = [
      {
        id: 'chat-1',
        title: 'Chat 1',
      },
      {
        id: 'chat-2',
        title: 'Chat 2',
      },
    ]

    getCurrentUserMock.mockResolvedValue(user)
    getChatsMock.mockResolvedValue(chats)

    getChatStoreStateMock.mockReturnValue({
      currentChatId: 'deleted-chat',
    })

    render(<AuthInitializer />)

    await waitFor(() => {
      expect(setCurrentChatIdMock).toHaveBeenCalledWith('chat-1')
    })
  })

  it('clears current chat when the user has no chats', async () => {
    const user = {
      id: 'user-1',
      email: 'test@example.com',
    }

    getCurrentUserMock.mockResolvedValue(user)
    getChatsMock.mockResolvedValue([])

    getChatStoreStateMock.mockReturnValue({
      currentChatId: 'deleted-chat',
    })

    render(<AuthInitializer />)

    await waitFor(() => {
      expect(setChatsMock).toHaveBeenCalledWith([])
      expect(setCurrentChatIdMock).toHaveBeenCalledWith(null)
    })
  })

  it('keeps the current chat when it still exists', async () => {
    const user = {
      id: 'user-1',
      email: 'test@example.com',
    }

    const chats = [
      {
        id: 'chat-1',
        title: 'Chat 1',
      },
      {
        id: 'chat-2',
        title: 'Chat 2',
      },
    ]

    getCurrentUserMock.mockResolvedValue(user)
    getChatsMock.mockResolvedValue(chats)

    getChatStoreStateMock.mockReturnValue({
      currentChatId: 'chat-2',
    })

    render(<AuthInitializer />)

    await waitFor(() => {
      expect(setChatsMock).toHaveBeenCalledWith(chats)
    })

    expect(setCurrentChatIdMock).not.toHaveBeenCalled()
  })

  it('clears auth and chat state when auth initialization fails', async () => {
    getCurrentUserMock.mockRejectedValue(new Error('Server error'))

    render(<AuthInitializer />)

    await waitFor(() => {
      expect(clearUserMock).toHaveBeenCalledTimes(1)
    })

    expect(setChatsMock).toHaveBeenCalledWith([])
    expect(setCurrentChatIdMock).toHaveBeenCalledWith(null)
  })

  it('does not update state after unmount during AI model loading', async () => {
    let resolveModels!: (models: unknown[]) => void

    const modelsPromise = new Promise<unknown[]>((resolve) => {
      resolveModels = resolve
    })

    getAIModelsMock.mockReturnValue(modelsPromise)

    const { unmount } = render(<AuthInitializer />)

    unmount()

    resolveModels([
      {
        id: 'gpt-1',
        name: 'GPT 1',
      },
    ])

    await waitFor(() => {
      expect(getAIModelsMock).toHaveBeenCalledTimes(1)
    })

    expect(setModelsMock).not.toHaveBeenCalled()
    expect(setSelectedModelIdMock).not.toHaveBeenCalled()
  })
})
