import { beforeEach, describe, expect, it } from 'vitest'
import { useMessageStore } from './messageStore'

describe('messageStore', () => {
  beforeEach(() => {
    useMessageStore.setState({
      activeChatId: null,
      messages: [],
      loadingMessages: false,
      messageError: null,
      streamingMessageId: null,
      abortCurrentStream: null,
      messagesCache: {},
      paginationCache: {},
      scrollPositions: {},
      nextCursor: null,
      hasMoreOlder: false,
      loadingOlder: false,
      olderError: null,
    })
  })

  it('should have the correct initial state', () => {
    const state = useMessageStore.getState()

    expect(state.activeChatId).toBeNull()
    expect(state.messages).toEqual([])
    expect(state.loadingMessages).toBe(false)
    expect(state.messageError).toBeNull()
    expect(state.streamingMessageId).toBeNull()
    expect(state.abortCurrentStream).toBeNull()
    expect(state.messagesCache).toEqual({})
    expect(state.paginationCache).toEqual({})
    expect(state.scrollPositions).toEqual({})
    expect(state.nextCursor).toBeNull()
    expect(state.hasMoreOlder).toBe(false)
    expect(state.loadingOlder).toBe(false)
    expect(state.olderError).toBeNull()
  })

  it('should set the messages', () => {
    const messages = [
      {
        id: 'message-1',
        chatSessionId: 'chat-1',
        role: 'user' as const,
        content: 'Xin chào',
        createdAt: '2026-09-27T00:00:00.000Z',
      },
      {
        id: 'message-2',
        chatSessionId: 'chat-1',
        role: 'ai' as const,
        content: 'Xin chào! Tôi có thể giúp gì cho bạn?',
        createdAt: '2026-09-27T00:00:01.000Z',
      },
    ]

    useMessageStore.getState().setMessages(messages)

    expect(useMessageStore.getState().messages).toEqual(messages)
  })

  it('should set current messages and cache messages by chat id', () => {
    const messages = [
      {
        id: 'message-1',
        chatSessionId: 'chat-1',
        role: 'user' as const,
        content: 'Nội dung test',
        createdAt: '2026-09-27T00:00:00.000Z',
      },
    ]

    useMessageStore.getState().setCachedMessages('chat-1', messages)

    const state = useMessageStore.getState()

    expect(state.messages).toEqual(messages)
    expect(state.messagesCache).toEqual({
      'chat-1': messages,
    })
    expect(state.messagesCache['chat-1']).toEqual(messages)
  })

  it('should get cached messages by chat id', () => {
    const messages = [
      {
        id: 'message-1',
        chatSessionId: 'chat-1',
        role: 'user' as const,
        content: 'Cached message',
        createdAt: '2026-09-27T00:00:00.000Z',
      },
    ]

    useMessageStore.getState().setCachedMessages('chat-1', messages)

    expect(
      useMessageStore.getState().getCachedMessages('chat-1')
    ).toEqual(messages)

    expect(
      useMessageStore.getState().getCachedMessages('chat-not-found')
    ).toBeUndefined()
  })

  it('should save scroll positions for each chat', () => {
    useMessageStore.getState().saveScrollPosition('chat-1', 350)
    useMessageStore.getState().saveScrollPosition('chat-2', 720)

    const state = useMessageStore.getState()

    expect(state.scrollPositions).toEqual({
      'chat-1': 350,
      'chat-2': 720,
    })
  })

  it('should get scroll position by chat id', () => {
    useMessageStore.getState().saveScrollPosition('chat-1', 350)

    expect(
      useMessageStore.getState().getScrollPosition('chat-1')
    ).toBe(350)

    expect(
      useMessageStore.getState().getScrollPosition('chat-not-found')
    ).toBeUndefined()
  })

  it('should switch to a cached chat and return true', () => {
    const cachedMessages = [
      {
        id: 'message-1',
        chatSessionId: 'chat-1',
        role: 'user' as const,
        content: 'Cached message',
        createdAt: '2026-09-27T00:00:00.000Z',
      },
    ]

    useMessageStore.getState().setCachedMessages('chat-1', cachedMessages)

    useMessageStore.setState({
      loadingMessages: true,
      messageError: 'Lỗi cũ',
      streamingMessageId: 'streaming-1',
    })

    const result = useMessageStore.getState().switchChat('chat-1')

    const state = useMessageStore.getState()

    expect(result).toBe(true)
    expect(state.messages).toEqual(cachedMessages)
    expect(state.loadingMessages).toBe(false)
    expect(state.messageError).toBeNull()
    expect(state.streamingMessageId).toBeNull()
  })

  it('should switch to an uncached chat and return false', () => {
    useMessageStore.setState({
      messages: [
        {
          id: 'old-message',
          chatSessionId: 'old-chat',
          role: 'user' as const,
          content: 'Tin nhắn cũ',
          createdAt: '2026-09-27T00:00:00.000Z',
        },
      ],
      loadingMessages: false,
      messageError: 'Lỗi cũ',
      streamingMessageId: 'streaming-old',
    })

    const result = useMessageStore.getState().switchChat('chat-uncached')

    const state = useMessageStore.getState()

    expect(result).toBe(false)
    expect(state.messages).toEqual([])
    expect(state.loadingMessages).toBe(true)
    expect(state.messageError).toBeNull()
    expect(state.streamingMessageId).toBeNull()
  })

  it('should add a message to current messages and chat cache', () => {
    const existingMessage = {
      id: 'message-1',
      chatSessionId: 'chat-1',
      role: 'user' as const,
      content: 'Tin nhắn cũ',
      createdAt: '2026-09-27T00:00:00.000Z',
    }

    const newMessage = {
      id: 'message-2',
      chatSessionId: 'chat-1',
      role: 'ai' as const,
      content: 'Tin nhắn mới',
      createdAt: '2026-09-27T00:00:01.000Z',
    }

    useMessageStore.setState({
      messages: [existingMessage],
      messagesCache: {
        'chat-1': [existingMessage],
      },
    })

    useMessageStore.getState().addMessage(newMessage)

    const state = useMessageStore.getState()

    expect(state.messages).toEqual([
      existingMessage,
      newMessage,
    ])

    expect(state.messagesCache['chat-1']).toEqual([
      existingMessage,
      newMessage,
    ])
  })

  it('should add a message without chat session id without changing the cache', () => {
    const existingMessage = {
      id: 'message-1',
      chatSessionId: 'chat-1',
      role: 'user' as const,
      content: 'Tin nhắn cũ',
      createdAt: '2026-09-27T00:00:00.000Z',
    }

    const newMessage = {
      id: 'message-2',
      role: 'ai' as const,
      content: 'Tin nhắn không có chat session',
      createdAt: '2026-09-27T00:00:01.000Z',
    }

    useMessageStore.setState({
      messages: [existingMessage as any],
      messagesCache: {
        'chat-1': [existingMessage as any],
      },
    })

    useMessageStore.getState().addMessage(newMessage as any)

    const state = useMessageStore.getState()

    expect(state.messages).toEqual([
      existingMessage,
      newMessage,
    ])

    expect(state.messagesCache).toEqual({
      'chat-1': [existingMessage],
    })
  })

  it('should update a message in current messages and chat cache', () => {
    const message1 = {
      id: 'message-1',
      chatSessionId: 'chat-1',
      role: 'user' as const,
      content: 'Nội dung cũ',
      createdAt: '2026-09-27T00:00:00.000Z',
    }

    const message2 = {
      id: 'message-2',
      chatSessionId: 'chat-1',
      role: 'ai' as const,
      content: 'Nội dung AI',
      createdAt: '2026-09-27T00:00:01.000Z',
    }

    const message3 = {
      id: 'message-3',
      chatSessionId: 'chat-2',
      role: 'user' as const,
      content: 'Tin nhắn chat khác',
      createdAt: '2026-09-27T00:00:02.000Z',
    }

    useMessageStore.setState({
      messages: [message1 as any, message2 as any],
      messagesCache: {
        'chat-1': [message1 as any, message2 as any],
        'chat-2': [message3 as any],
      },
    })

    useMessageStore.getState().updateMessage(
      'message-1',
      'Nội dung đã được cập nhật'
    )

    const state = useMessageStore.getState()

    expect(state.messages).toEqual([
      {
        ...message1,
        content: 'Nội dung đã được cập nhật',
      },
      message2,
    ])

    expect(state.messagesCache).toEqual({
      'chat-1': [
        {
          ...message1,
          content: 'Nội dung đã được cập nhật',
        },
        message2,
      ],
      'chat-2': [message3],
    })
  })

  it('should not change messages when updating a non-existent message id', () => {
    const message1 = {
      id: 'message-1',
      chatSessionId: 'chat-1',
      role: 'user' as const,
      content: 'Nội dung 1',
      createdAt: '2026-09-27T00:00:00.000Z',
    }

    const message2 = {
      id: 'message-2',
      chatSessionId: 'chat-1',
      role: 'ai' as const,
      content: 'Nội dung 2',
      createdAt: '2026-09-27T00:00:01.000Z',
    }

    useMessageStore.setState({
      messages: [message1 as any, message2 as any],
      messagesCache: {
        'chat-1': [message1 as any, message2 as any],
      },
    })

    useMessageStore.getState().updateMessage(
      'message-not-found',
      'Nội dung mới'
    )

    const state = useMessageStore.getState()

    expect(state.messages).toEqual([
      message1,
      message2,
    ])

    expect(state.messagesCache).toEqual({
      'chat-1': [message1, message2],
    })
  })

  it('should replace a message id in current messages and chat cache', () => {
    const message1 = {
      id: 'temp-message-1',
      chatSessionId: 'chat-1',
      role: 'user' as const,
      content: 'Tin nhắn tạm',
      createdAt: '2026-09-27T00:00:00.000Z',
    }

    const message2 = {
      id: 'message-2',
      chatSessionId: 'chat-1',
      role: 'ai' as const,
      content: 'Phản hồi AI',
      createdAt: '2026-09-27T00:00:01.000Z',
    }

    const otherChatMessage = {
      id: 'message-3',
      chatSessionId: 'chat-2',
      role: 'user' as const,
      content: 'Chat khác',
      createdAt: '2026-09-27T00:00:02.000Z',
    }

    useMessageStore.setState({
      messages: [message1 as any, message2 as any],
      messagesCache: {
        'chat-1': [message1 as any, message2 as any],
        'chat-2': [otherChatMessage as any],
      },
    })

    useMessageStore.getState().replaceMessageId(
      'temp-message-1',
      'real-message-1'
    )

    const state = useMessageStore.getState()

    expect(state.messages).toEqual([
      {
        ...message1,
        id: 'real-message-1',
      },
      message2,
    ])

    expect(state.messagesCache).toEqual({
      'chat-1': [
        {
          ...message1,
          id: 'real-message-1',
        },
        message2,
      ],
      'chat-2': [otherChatMessage],
    })
  })

  it('should not change messages when replacing a non-existent message id', () => {
    const message1 = {
      id: 'message-1',
      chatSessionId: 'chat-1',
      role: 'user' as const,
      content: 'Tin nhắn 1',
      createdAt: '2026-09-27T00:00:00.000Z',
    }

    const message2 = {
      id: 'message-2',
      chatSessionId: 'chat-1',
      role: 'ai' as const,
      content: 'Tin nhắn 2',
      createdAt: '2026-09-27T00:00:01.000Z',
    }

    useMessageStore.setState({
      messages: [message1 as any, message2 as any],
      messagesCache: {
        'chat-1': [message1 as any, message2 as any],
      },
    })

    useMessageStore.getState().replaceMessageId(
      'message-not-found',
      'new-message-id'
    )

    const state = useMessageStore.getState()

    expect(state.messages).toEqual([
      message1,
      message2,
    ])

    expect(state.messagesCache).toEqual({
      'chat-1': [message1, message2],
    })
  })

  it('should replace a message in current messages and chat cache', () => {
    const oldMessage = {
      id: 'message-1',
      chatSessionId: 'chat-1',
      role: 'user' as const,
      content: 'Nội dung cũ',
      createdAt: '2026-09-27T00:00:00.000Z',
    }

    const otherMessage = {
      id: 'message-2',
      chatSessionId: 'chat-1',
      role: 'ai' as const,
      content: 'Phản hồi AI',
      createdAt: '2026-09-27T00:00:01.000Z',
    }

    const otherChatMessage = {
      id: 'message-3',
      chatSessionId: 'chat-2',
      role: 'user' as const,
      content: 'Chat khác',
      createdAt: '2026-09-27T00:00:02.000Z',
    }

    const newMessage = {
      id: 'message-1',
      chatSessionId: 'chat-1',
      role: 'user' as const,
      content: 'Nội dung mới hoàn toàn',
      createdAt: '2026-09-27T00:01:00.000Z',
    }

    useMessageStore.setState({
      messages: [oldMessage as any, otherMessage as any],
      messagesCache: {
        'chat-1': [oldMessage as any, otherMessage as any],
        'chat-2': [otherChatMessage as any],
      },
    })

    useMessageStore.getState().replaceMessage(
      'message-1',
      newMessage as any
    )

    const state = useMessageStore.getState()

    expect(state.messages).toEqual([
      newMessage,
      otherMessage,
    ])

    expect(state.messagesCache).toEqual({
      'chat-1': [
        newMessage,
        otherMessage,
      ],
      'chat-2': [otherChatMessage],
    })
  })

  it('should not change messages when replacing a non-existent message id', () => {
    const message1 = {
      id: 'message-1',
      chatSessionId: 'chat-1',
      role: 'user' as const,
      content: 'Nội dung 1',
      createdAt: '2026-09-27T00:00:00.000Z',
    }

    const message2 = {
      id: 'message-2',
      chatSessionId: 'chat-1',
      role: 'ai' as const,
      content: 'Nội dung 2',
      createdAt: '2026-09-27T00:00:01.000Z',
    }

    const newMessage = {
      id: 'message-not-found',
      chatSessionId: 'chat-1',
      role: 'ai' as const,
      content: 'Message mới',
      createdAt: '2026-09-27T00:01:00.000Z',
    }

    useMessageStore.setState({
      messages: [message1 as any, message2 as any],
      messagesCache: {
        'chat-1': [message1 as any, message2 as any],
      },
    })

    useMessageStore.getState().replaceMessage(
      'message-not-found',
      newMessage as any
    )

    const state = useMessageStore.getState()

    expect(state.messages).toEqual([
      message1,
      message2,
    ])

    expect(state.messagesCache).toEqual({
      'chat-1': [message1, message2],
    })
  })

  it('should set and clear the streaming message id', () => {
    useMessageStore.getState().setStreamingMessageId('message-1')

    expect(
      useMessageStore.getState().streamingMessageId
    ).toBe('message-1')

    useMessageStore.getState().setStreamingMessageId(null)

    expect(
      useMessageStore.getState().streamingMessageId
    ).toBeNull()
  })

  it('should set and clear the abort current stream callback', () => {
    const abortMock = vi.fn()

    useMessageStore.getState().setAbortCurrentStream(abortMock)

    expect(
      useMessageStore.getState().abortCurrentStream
    ).toBe(abortMock)

    useMessageStore.getState().abortCurrentStream?.()

    expect(abortMock).toHaveBeenCalledTimes(1)

    useMessageStore.getState().setAbortCurrentStream(null)

    expect(
      useMessageStore.getState().abortCurrentStream
    ).toBeNull()
  })

  it('should clear messages and reset streaming state', () => {
    const abortMock = vi.fn()

    useMessageStore.getState().setMessages([
      {
        id: 'message-1',
        chatSessionId: 'chat-1',
        role: 'user',
        content: 'Hello',
        createdAt: new Date().toISOString(),
      } as any,
    ])

    useMessageStore.getState().setStreamingMessageId('message-2')
    useMessageStore.getState().setAbortCurrentStream(abortMock)

    useMessageStore.getState().clearMessages()

    expect(useMessageStore.getState().messages).toEqual([])
    expect(
      useMessageStore.getState().streamingMessageId
    ).toBeNull()
    expect(
      useMessageStore.getState().abortCurrentStream
    ).toBeNull()
  })

  it('should set loading messages state', () => {
    useMessageStore.getState().setLoadingMessages(true)

    expect(
      useMessageStore.getState().loadingMessages
    ).toBe(true)

    useMessageStore.getState().setLoadingMessages(false)

    expect(
      useMessageStore.getState().loadingMessages
    ).toBe(false)
  })

  it('should set and clear message error', () => {
    useMessageStore.getState().setMessageError('Không thể tải tin nhắn')

    expect(
      useMessageStore.getState().messageError
    ).toBe('Không thể tải tin nhắn')

    useMessageStore.getState().setMessageError(null)

    expect(
      useMessageStore.getState().messageError
    ).toBeNull()
  })

  it('should reset all messages, caches, scroll positions, and errors on clearAll', () => {
    const abortMock = vi.fn()
    const message = {
      id: 'msg-1',
      chatSessionId: 'chat-1',
      role: 'user' as const,
      content: 'Hello',
      createdAt: '2026-09-27T00:00:00.000Z',
    }

    useMessageStore.setState({
      messages: [message as any],
      messagesCache: {
        'chat-1': [message as any],
      },
      scrollPositions: {
        'chat-1': 250,
      },
      streamingMessageId: 'stream-1',
      abortCurrentStream: abortMock,
      loadingMessages: true,
      messageError: 'Some error',
    })

    useMessageStore.getState().clearAll()

    const state = useMessageStore.getState()
    expect(state.messages).toEqual([])
    expect(state.messagesCache).toEqual({})
    expect(state.paginationCache).toEqual({})
    expect(state.scrollPositions).toEqual({})
    expect(state.streamingMessageId).toBeNull()
    expect(state.abortCurrentStream).toBeNull()
    expect(state.loadingMessages).toBe(false)
    expect(state.messageError).toBeNull()
    expect(state.nextCursor).toBeNull()
    expect(state.hasMoreOlder).toBe(false)
    expect(state.loadingOlder).toBe(false)
    expect(state.olderError).toBeNull()
  })

  it('should set pagination and cache pagination per chat', () => {
    useMessageStore.setState({
      activeChatId: 'chat-1',
      messagesCache: {
        'chat-1': [],
      },
    })

    useMessageStore.getState().setPagination('chat-1', 'cursor-abc', true)

    const state = useMessageStore.getState()
    expect(state.nextCursor).toBe('cursor-abc')
    expect(state.hasMoreOlder).toBe(true)
    expect(state.paginationCache['chat-1']).toEqual({
      nextCursor: 'cursor-abc',
      hasMore: true,
    })
  })

  it('should prepend older messages and deduplicate by id', () => {
    const existingMsg = {
      id: 'msg-2',
      chatSessionId: 'chat-1',
      role: 'user' as const,
      content: 'Current message',
      createdAt: '2026-09-27T00:00:02.000Z',
      attachments: [],
    }

    useMessageStore.setState({
      messages: [existingMsg],
      messagesCache: {
        'chat-1': [existingMsg],
      },
    })

    const olderMsg1 = {
      id: 'msg-1',
      chatSessionId: 'chat-1',
      role: 'user' as const,
      content: 'Older message 1',
      createdAt: '2026-09-27T00:00:01.000Z',
      attachments: [],
    }

    // Pass olderMsg1 and duplicate existingMsg
    useMessageStore.getState().prependMessages('chat-1', [olderMsg1, existingMsg])

    const state = useMessageStore.getState()
    expect(state.messages).toHaveLength(2)
    expect(state.messages[0]).toEqual(olderMsg1)
    expect(state.messages[1]).toEqual(existingMsg)
    expect(state.messagesCache['chat-1']).toEqual([olderMsg1, existingMsg])
  })

  it('should update loadingOlder and olderError states', () => {
    useMessageStore.getState().setLoadingOlder(true)
    expect(useMessageStore.getState().loadingOlder).toBe(true)

    useMessageStore.getState().setOlderError('Không thể tải tin nhắn cũ')
    expect(useMessageStore.getState().olderError).toBe('Không thể tải tin nhắn cũ')

    useMessageStore.getState().setLoadingOlder(false)
    useMessageStore.getState().setOlderError(null)
    expect(useMessageStore.getState().loadingOlder).toBe(false)
    expect(useMessageStore.getState().olderError).toBeNull()
  })

  // === Fix1-A Regression Tests: History Pagination Race Condition ===
  it('Fix1-A: prependMessages of chat A does not pollute active chat B when user switched chats', () => {
    const msgChatB = {
      id: 'msg-b1',
      chatSessionId: 'chat-b',
      role: 'user' as const,
      content: 'Chat B current message',
      createdAt: '2026-09-27T00:00:10.000Z',
      attachments: [],
    }

    const msgChatA = {
      id: 'msg-a2',
      chatSessionId: 'chat-a',
      role: 'user' as const,
      content: 'Chat A recent message',
      createdAt: '2026-09-27T00:00:02.000Z',
      attachments: [],
    }

    // Set up chat A and chat B in cache, and activeChat is chat-b
    useMessageStore.setState({
      activeChatId: 'chat-b',
      messages: [msgChatB],
      messagesCache: {
        'chat-a': [msgChatA],
        'chat-b': [msgChatB],
      },
    })

    const olderMsgChatA = {
      id: 'msg-a1',
      chatSessionId: 'chat-a',
      role: 'user' as const,
      content: 'Chat A older message',
      createdAt: '2026-09-27T00:00:01.000Z',
      attachments: [],
    }

    // Chat A pagination request completes late while user is looking at chat B
    useMessageStore.getState().prependMessages('chat-a', [olderMsgChatA])

    const state = useMessageStore.getState()
    // Active chat B must NOT be polluted
    expect(state.messages).toEqual([msgChatB])
    // Chat A cache must be updated properly
    expect(state.messagesCache['chat-a']).toEqual([olderMsgChatA, msgChatA])
  })

  it('Fix1-A: setPagination for chat A does not corrupt active chat B pagination state', () => {
    useMessageStore.setState({
      activeChatId: 'chat-b',
      messagesCache: {
        'chat-a': [{
          id: 'msg-a',
          chatSessionId: 'chat-a',
          role: 'user',
          content: 'Hello A',
          createdAt: '2026-09-27T00:00:00.000Z',
          attachments: [],
        }],
        'chat-b': [],
      },
      nextCursor: 'cursor-b',
      hasMoreOlder: true,
      paginationCache: {
        'chat-a': { nextCursor: 'old-cursor-a', hasMore: true },
        'chat-b': { nextCursor: 'cursor-b', hasMore: true },
      },
    })

    // Chat A pagination completes
    useMessageStore.getState().setPagination('chat-a', 'new-cursor-a', false)

    const state = useMessageStore.getState()
    // Active chat B pagination must remain intact
    expect(state.nextCursor).toBe('cursor-b')
    expect(state.hasMoreOlder).toBe(true)
    // Chat A pagination cache is updated
    expect(state.paginationCache['chat-a']).toEqual({
      nextCursor: 'new-cursor-a',
      hasMore: false,
    })
  })

  it('Fix1-Hardening-A: setPagination does NOT create paginationCache entry if chat is deleted or not in messagesCache', () => {
    useMessageStore.setState({
      activeChatId: 'chat-b',
      messagesCache: {
        'chat-b': [],
      },
      nextCursor: 'cursor-b',
      hasMoreOlder: true,
      paginationCache: {},
    })

    // Request arrives for chat-deleted (which is not active and not in messagesCache)
    useMessageStore.getState().setPagination('chat-deleted', 'new-cursor', true)

    const state = useMessageStore.getState()
    // Must NOT create orphan entry in paginationCache
    expect(state.paginationCache['chat-deleted']).toBeUndefined()
    // Active chat B pagination is not affected
    expect(state.nextCursor).toBe('cursor-b')
    expect(state.hasMoreOlder).toBe(true)
  })

  it('Fix1-Hardening-A: setPagination correctly updates pagination state for active chat', () => {
    useMessageStore.setState({
      activeChatId: 'chat-active',
      messagesCache: {
        'chat-active': [],
      },
      nextCursor: null,
      hasMoreOlder: false,
      paginationCache: {},
    })

    useMessageStore.getState().setPagination('chat-active', 'cursor-active-1', true)

    const state = useMessageStore.getState()
    expect(state.nextCursor).toBe('cursor-active-1')
    expect(state.hasMoreOlder).toBe(true)
    expect(state.paginationCache['chat-active']).toEqual({
      nextCursor: 'cursor-active-1',
      hasMore: true,
    })
  })

  it('Fix1-Final-Patch: setPagination does NOT create paginationCache when activeChatId is null and messages is empty', () => {
    useMessageStore.setState({
      activeChatId: null,
      messages: [],
      messagesCache: {},
      nextCursor: null,
      hasMoreOlder: false,
      paginationCache: {},
    })

    // Late pagination request arrives for a non-cached chat while on empty/welcome screen
    useMessageStore.getState().setPagination('chat-orphaned', 'cursor-orphan', true)

    const state = useMessageStore.getState()
    expect(state.paginationCache['chat-orphaned']).toBeUndefined()
    expect(state.nextCursor).toBeNull()
    expect(state.hasMoreOlder).toBe(false)
  })

  it('Fix1-Final-Patch: late pagination request does NOT resurrect cache after deleteChatCache on empty chat', () => {
    const msg = {
      id: 'm1',
      chatSessionId: 'chat-deleted',
      role: 'user' as const,
      content: 'Hello',
      createdAt: '2026-09-27T00:00:00.000Z',
    }

    useMessageStore.setState({
      activeChatId: 'chat-deleted',
      messages: [msg],
      messagesCache: {
        'chat-deleted': [msg],
      },
      paginationCache: {
        'chat-deleted': { nextCursor: 'c1', hasMore: true },
      },
    })

    // Chat is deleted, activeChatId becomes null and messages becomes []
    useMessageStore.getState().deleteChatCache('chat-deleted')
    expect(useMessageStore.getState().activeChatId).toBeNull()
    expect(useMessageStore.getState().messages).toEqual([])

    // Late pagination request finishes after deletion
    useMessageStore.getState().setPagination('chat-deleted', 'c2-late', true)

    const state = useMessageStore.getState()
    expect(state.paginationCache['chat-deleted']).toBeUndefined()
    expect(state.nextCursor).toBeNull()
    expect(state.hasMoreOlder).toBe(false)
  })

  // === Fix1-B Regression Tests: Abort Stream on Switch / Clear ===
  it('Fix1-B: switchChat aborts running stream', () => {
    let aborted = false
    const mockAbort = () => {
      aborted = true
    }

    useMessageStore.setState({
      activeChatId: 'chat-1',
      streamingMessageId: 'stream-1',
      abortCurrentStream: mockAbort,
    })

    useMessageStore.getState().switchChat('chat-2')

    expect(aborted).toBe(true)
    expect(useMessageStore.getState().abortCurrentStream).toBeNull()
    expect(useMessageStore.getState().streamingMessageId).toBeNull()
  })

  it('Fix1-B: clearMessages and clearAll abort running stream', () => {
    let aborted1 = false
    useMessageStore.setState({
      abortCurrentStream: () => {
        aborted1 = true
      },
    })
    useMessageStore.getState().clearMessages()
    expect(aborted1).toBe(true)

    let aborted2 = false
    useMessageStore.setState({
      abortCurrentStream: () => {
        aborted2 = true
      },
    })
    useMessageStore.getState().clearAll()
    expect(aborted2).toBe(true)
  })

  // === Fix1-D Regression Tests: Remove Message ===
  it('Fix1-D: removeMessage deletes target message from messages and all messagesCache', () => {
    const userMsg = {
      id: 'user-msg',
      chatSessionId: 'chat-1',
      role: 'user' as const,
      content: 'Hello',
      createdAt: '2026-09-27T00:00:01.000Z',
      attachments: [],
    }
    const emptyAssistantMsg = {
      id: 'assistant-empty',
      chatSessionId: 'chat-1',
      role: 'assistant' as const,
      content: '',
      createdAt: '2026-09-27T00:00:02.000Z',
      attachments: [],
    }

    useMessageStore.setState({
      activeChatId: 'chat-1',
      messages: [userMsg, emptyAssistantMsg],
      messagesCache: {
        'chat-1': [userMsg, emptyAssistantMsg],
      },
    })

    useMessageStore.getState().removeMessage('assistant-empty')

    const state = useMessageStore.getState()
    expect(state.messages).toEqual([userMsg])
    expect(state.messagesCache['chat-1']).toEqual([userMsg])
  })

  // === Fix1-E Regression Tests: Delete Chat While Streaming ===
  it('Fix1-E: deleteChatCache aborts active stream and purges cache/pagination/scroll', () => {
    let aborted = false
    const msg = {
      id: 'msg-1',
      chatSessionId: 'chat-to-delete',
      role: 'user' as const,
      content: 'Deleting this',
      createdAt: '2026-09-27T00:00:01.000Z',
      attachments: [],
    }

    useMessageStore.setState({
      activeChatId: 'chat-to-delete',
      messages: [msg],
      streamingMessageId: 'msg-1',
      abortCurrentStream: () => {
        aborted = true
      },
      messagesCache: {
        'chat-to-delete': [msg],
        'chat-keep': [],
      },
      paginationCache: {
        'chat-to-delete': { nextCursor: 'c1', hasMore: true },
        'chat-keep': { nextCursor: null, hasMore: false },
      },
      scrollPositions: {
        'chat-to-delete': 500,
        'chat-keep': 100,
      },
    })

    useMessageStore.getState().deleteChatCache('chat-to-delete')

    const state = useMessageStore.getState()
    expect(aborted).toBe(true)
    expect(state.activeChatId).toBeNull()
    expect(state.messages).toEqual([])
    expect(state.streamingMessageId).toBeNull()
    expect(state.abortCurrentStream).toBeNull()
    expect(state.messagesCache['chat-to-delete']).toBeUndefined()
    expect(state.paginationCache['chat-to-delete']).toBeUndefined()
    expect(state.scrollPositions['chat-to-delete']).toBeUndefined()
    // Other chats remain untouched
    expect(state.messagesCache['chat-keep']).toEqual([])
    expect(state.paginationCache['chat-keep']).toEqual({ nextCursor: null, hasMore: false })
    expect(state.scrollPositions['chat-keep']).toBe(100)
  })
})
