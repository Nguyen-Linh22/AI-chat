import { beforeEach, describe, expect, it } from 'vitest'
import { useMessageStore } from './messageStore'

describe('messageStore', () => {
  beforeEach(() => {
    useMessageStore.setState({
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
})
