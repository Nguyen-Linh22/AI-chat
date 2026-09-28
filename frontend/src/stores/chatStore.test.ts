import { beforeEach, describe, expect, it } from 'vitest'
import { useChatStore } from './chatStore'

describe('chatStore', () => {
  beforeEach(() => {
    useChatStore.setState({
      chats: [],
      currentChatId: null,
    })
  })

  it('should have the correct initial state', () => {
    const state = useChatStore.getState()

    expect(state.chats).toEqual([])
    expect(state.currentChatId).toBeNull()
  })

  it('should set the chat list', () => {
    const chats = [
      {
        id: 'chat-1',
        title: 'Cuộc trò chuyện 1',
      },
      {
        id: 'chat-2',
        title: 'Cuộc trò chuyện 2',
      },
    ]

    useChatStore.getState().setChats(chats)

    const state = useChatStore.getState()

    expect(state.chats).toEqual(chats)
  })

  it('should set the current chat id', () => {
    useChatStore.getState().setCurrentChatId('chat-1')

    expect(useChatStore.getState().currentChatId).toBe('chat-1')

    useChatStore.getState().setCurrentChatId(null)

    expect(useChatStore.getState().currentChatId).toBeNull()
  })

  it('should add a new chat to the beginning of the chat list', () => {
    const existingChat = {
      id: 'chat-1',
      title: 'Chat cũ',
    }

    const newChat = {
      id: 'chat-2',
      title: 'Chat mới',
    }

    useChatStore.getState().setChats([existingChat])

    useChatStore.getState().addChat(newChat)

    expect(useChatStore.getState().chats).toEqual([
      newChat,
      existingChat,
    ])
  })

  it('should update only the chat with the matching id', () => {
    const chat1 = {
      id: 'chat-1',
      title: 'Tiêu đề cũ',
    }

    const chat2 = {
      id: 'chat-2',
      title: 'Chat thứ hai',
    }

    const updatedChat1 = {
      id: 'chat-1',
      title: 'Tiêu đề mới',
    }

    useChatStore.getState().setChats([chat1, chat2])

    useChatStore.getState().updateChat(updatedChat1)

    expect(useChatStore.getState().chats).toEqual([
      updatedChat1,
      chat2,
    ])
  })

  it('should remove a non-active chat and keep the current chat id', () => {
    const chat1 = {
      id: 'chat-1',
      title: 'Chat đang active',
    }

    const chat2 = {
      id: 'chat-2',
      title: 'Chat sẽ bị xóa',
    }

    useChatStore.getState().setChats([chat1, chat2])
    useChatStore.getState().setCurrentChatId('chat-1')

    useChatStore.getState().removeChat('chat-2')

    const state = useChatStore.getState()

    expect(state.chats).toEqual([chat1])
    expect(state.currentChatId).toBe('chat-1')
  })

  it('should remove the active chat and set current chat id to null', () => {
    const chat1 = {
      id: 'chat-1',
      title: 'Chat đang active',
    }

    const chat2 = {
      id: 'chat-2',
      title: 'Chat còn lại',
    }

    useChatStore.getState().setChats([chat1, chat2])
    useChatStore.getState().setCurrentChatId('chat-1')

    useChatStore.getState().removeChat('chat-1')

    const state = useChatStore.getState()

    expect(state.chats).toEqual([chat2])
    expect(state.currentChatId).toBeNull()
  })

  it('should reset currentChatId to null when setChats is called and currentChatId is not in the new chat list', () => {
    useChatStore.getState().setCurrentChatId('old-chat-id')

    useChatStore.getState().setChats([
      {
        id: 'new-chat-id',
        title: 'New user chat',
      },
    ])

    const state = useChatStore.getState()
    expect(state.currentChatId).toBeNull()
    expect(state.chats).toEqual([
      {
        id: 'new-chat-id',
        title: 'New user chat',
      },
    ])
  })

  it('should keep currentChatId when setChats is called and currentChatId is in the new chat list', () => {
    useChatStore.getState().setCurrentChatId('chat-1')

    useChatStore.getState().setChats([
      {
        id: 'chat-1',
        title: 'Chat 1',
      },
      {
        id: 'chat-2',
        title: 'Chat 2',
      },
    ])

    const state = useChatStore.getState()
    expect(state.currentChatId).toBe('chat-1')
  })

  it('should clear all chats and currentChatId on clearChats', () => {
    useChatStore.getState().setChats([
      {
        id: 'chat-1',
        title: 'Chat 1',
      },
    ])
    useChatStore.getState().setCurrentChatId('chat-1')

    useChatStore.getState().clearChats()

    const state = useChatStore.getState()
    expect(state.chats).toEqual([])
    expect(state.currentChatId).toBeNull()
  })
})
