import { describe, expect, it, beforeEach } from 'vitest'
import { useAuthStore } from '../stores/authStore'
import { useChatStore } from '../stores/chatStore'
import { useMessageStore } from '../stores/messageStore'

describe('User Account Switch Flow - Chat State Isolation', () => {
  beforeEach(() => {
    useAuthStore.getState().clearUser()
    useChatStore.getState().clearChats()
    useMessageStore.getState().clearAll()
  })

  it('completely purges account 1 chats and messages on logout so account 2 sees a clean state', () => {
    // 1. Account 1 logs in
    useAuthStore.getState().setUser({
      id: 'user-1',
      email: 'user1@example.com',
    })

    const account1Chats = [
      { id: 'chat-user1-secret', title: 'Account 1 Secret Discussion' },
    ]
    useChatStore.getState().setChats(account1Chats)
    useChatStore.getState().setCurrentChatId('chat-user1-secret')

    useMessageStore.getState().setCachedMessages('chat-user1-secret', [
      {
        id: 'msg-1',
        chatSessionId: 'chat-user1-secret',
        role: 'user',
        content: 'Account 1 confidential query',
        createdAt: '2026-09-28T00:00:00Z',
      },
      {
        id: 'msg-2',
        chatSessionId: 'chat-user1-secret',
        role: 'assistant',
        content: 'Account 1 confidential response',
        createdAt: '2026-09-28T00:00:01Z',
      },
    ])
    useMessageStore.getState().switchChat('chat-user1-secret')

    // Verify Account 1 has active conversation and cached messages
    expect(useAuthStore.getState().user?.email).toBe('user1@example.com')
    expect(useChatStore.getState().currentChatId).toBe('chat-user1-secret')
    expect(useMessageStore.getState().messages).toHaveLength(2)
    expect(useMessageStore.getState().getCachedMessages('chat-user1-secret')).toHaveLength(2)

    // 2. User 1 logs out: clear stores
    const abortCurrentStream = useMessageStore.getState().abortCurrentStream
    if (abortCurrentStream) abortCurrentStream()
    useMessageStore.getState().clearAll()
    useChatStore.getState().clearChats()
    useAuthStore.getState().clearUser()

    expect(useAuthStore.getState().user).toBeNull()
    expect(useChatStore.getState().chats).toEqual([])
    expect(useChatStore.getState().currentChatId).toBeNull()
    expect(useMessageStore.getState().messages).toEqual([])
    expect(useMessageStore.getState().getCachedMessages('chat-user1-secret')).toBeUndefined()

    // 3. User 2 logs in
    useAuthStore.getState().setUser({
      id: 'user-2',
      email: 'user2@example.com',
    })

    const account2Chats = [
      { id: 'chat-user2-public', title: 'Account 2 New Chat' },
    ]
    useMessageStore.getState().clearAll()
    useChatStore.getState().setChats(account2Chats)
    useChatStore.getState().setCurrentChatId(null)

    // 4. Assert Account 2 sees NO trace of Account 1's chats or messages
    expect(useAuthStore.getState().user?.email).toBe('user2@example.com')
    expect(useChatStore.getState().currentChatId).toBeNull()
    expect(useChatStore.getState().chats).toEqual(account2Chats)
    expect(useMessageStore.getState().messages).toEqual([])
    expect(useMessageStore.getState().getCachedMessages('chat-user1-secret')).toBeUndefined()

    // Attempting to switch to user 1's chat ID should fail cache hit
    const cacheHit = useMessageStore.getState().switchChat('chat-user1-secret')
    expect(cacheHit).toBe(false)
    expect(useMessageStore.getState().messages).toEqual([])
  })

  it('automatically invalidates currentChatId if setChats is called with another user chats', () => {
    // Suppose currentChatId was 'chat-user1'
    useChatStore.getState().setCurrentChatId('chat-user1')

    // New chats from account 2 do NOT contain 'chat-user1'
    useChatStore.getState().setChats([
      { id: 'chat-user2', title: 'User 2 conversation' },
    ])

    // currentChatId MUST automatically be reset to null to prevent leak
    expect(useChatStore.getState().currentChatId).toBeNull()
  })
})
