import { create } from 'zustand'
import type { Message } from '../services/messageService'

interface MessageState {
  messages: Message[]
  loadingMessages: boolean
  messageError: string | null
  streamingMessageId: string | null

  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  updateMessage: (
    messageId: string,
    content: string
  ) => void
  setStreamingMessageId: (
    messageId: string | null
  ) => void
  clearMessages: () => void

  setLoadingMessages: (loading: boolean) => void
  setMessageError: (error: string | null) => void
}

export const useMessageStore = create<MessageState>(
  (set) => ({
    messages: [],
    loadingMessages: false,
    messageError: null,
    streamingMessageId: null,

    setMessages: (messages) =>
      set({
        messages
      }),

    addMessage: (message) =>
      set((state) => ({
        messages: [...state.messages, message]
      })),

    updateMessage: (messageId, content) =>
      set((state) => ({
        messages: state.messages.map((message) =>
          message.id === messageId
            ? {
                ...message,
                content
              }
            : message
        )
      })),

    setStreamingMessageId: (messageId) =>
      set({
        streamingMessageId: messageId
      }),

    clearMessages: () =>
      set({
        messages: [],
        streamingMessageId: null
      }),

    setLoadingMessages: (loading) =>
      set({
        loadingMessages: loading
      }),

    setMessageError: (error) =>
      set({
        messageError: error
      })
  })
)