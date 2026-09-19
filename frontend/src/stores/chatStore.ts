import { create } from 'zustand'
import type { ChatSession } from '../services/chatService'

interface ChatState {
  chats: ChatSession[]
  currentChatId: string | null

  setChats: (chats: ChatSession[]) => void
  setCurrentChatId: (chatId: string | null) => void

  addChat: (chat: ChatSession) => void
  updateChat: (chat: ChatSession) => void
  removeChat: (chatId: string) => void
}

export const useChatStore = create<ChatState>((set) => ({
  chats: [],
  currentChatId: null,

  setChats: (chats) => set({ chats }),

  setCurrentChatId: (chatId) =>
    set({ currentChatId: chatId }),

  addChat: (chat) =>
    set((state) => ({
      chats: [chat, ...state.chats]
    })),

  updateChat: (chat) =>
    set((state) => ({
      chats: state.chats.map((item) =>
        item.id === chat.id ? chat : item
      )
    })),

  removeChat: (chatId) =>
    set((state) => ({
      chats: state.chats.filter((chat) => chat.id !== chatId),
      currentChatId:
        state.currentChatId === chatId
          ? null
          : state.currentChatId
    }))
}))