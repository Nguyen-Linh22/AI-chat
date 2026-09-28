import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChatSession } from '../services/chatService'

interface ChatState {
  chats: ChatSession[]
  currentChatId: string | null

  setChats: (chats: ChatSession[]) => void
  setCurrentChatId: (chatId: string | null) => void

  addChat: (chat: ChatSession) => void
  updateChat: (chat: ChatSession) => void
  removeChat: (chatId: string) => void
  clearChats: () => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      chats: [],
      currentChatId: null,

      setChats: (chats) =>
        set((state) => ({
          chats,
          currentChatId:
            state.currentChatId && chats.some((item) => item.id === state.currentChatId)
              ? state.currentChatId
              : null
        })),

      setCurrentChatId: (chatId) =>
        set({
          currentChatId: chatId
        }),

      addChat: (chat) =>
        set((state) => ({
          chats: [chat, ...state.chats]
        })),

      updateChat: (chat) =>
        set((state) => ({
          chats: state.chats.map((item) =>
            item.id === chat.id
              ? chat
              : item
          )
        })),

      removeChat: (chatId) =>
        set((state) => ({
          chats: state.chats.filter(
            (chat) => chat.id !== chatId
          ),
          currentChatId:
            state.currentChatId === chatId
              ? null
              : state.currentChatId
        })),

      clearChats: () =>
        set({
          chats: [],
          currentChatId: null
        })
    }),
    {
      name: 'chat-store'
    }
  )
)