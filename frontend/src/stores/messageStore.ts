import { create } from 'zustand'
import type { Message } from '../services/messageService'

interface MessageState {
  messages: Message[]
  loadingMessages: boolean
  messageError: string | null

  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  clearMessages: () => void

  setLoadingMessages: (loading: boolean) => void
  setMessageError: (error: string | null) => void
}

export const useMessageStore = create<MessageState>((set) => ({
  messages: [],
  loadingMessages: false,
  messageError: null,

  setMessages: (messages) =>
    set({
      messages
    }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message]
    })),

  clearMessages: () =>
    set({
      messages: []
    }),

  setLoadingMessages: (loading) =>
    set({
      loadingMessages: loading
    }),

  setMessageError: (error) =>
    set({
      messageError: error
    })
}))