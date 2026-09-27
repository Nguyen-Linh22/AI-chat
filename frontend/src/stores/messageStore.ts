import { create } from 'zustand'
import type { Message } from '../services/messageService'

interface MessageState {
  messages: Message[]
  loadingMessages: boolean
  messageError: string | null
  streamingMessageId: string | null
  abortCurrentStream: (() => void) | null

  // In-Memory RAM Cache cho từng cuộc trò chuyện (0ms latency khi chuyển tab)
  messagesCache: Record<string, Message[]>
  // Vị trí cuộn đã lưu cho mỗi chat (Scroll Restoration)
  scrollPositions: Record<string, number>

  setMessages: (messages: Message[]) => void
  setCachedMessages: (chatId: string, messages: Message[]) => void
  getCachedMessages: (chatId: string) => Message[] | undefined
  saveScrollPosition: (chatId: string, scrollTop: number) => void
  getScrollPosition: (chatId: string) => number | undefined
  switchChat: (chatId: string) => boolean

  addMessage: (message: Message) => void

  updateMessage: (
    messageId: string,
    content: string
  ) => void

  replaceMessageId: (
    oldMessageId: string,
    newMessageId: string
  ) => void

  replaceMessage: (
    oldMessageId: string,
    newMessage: Message
  ) => void

  setStreamingMessageId: (
    messageId: string | null
  ) => void

  setAbortCurrentStream: (
    abort: (() => void) | null
  ) => void

  clearMessages: () => void

  setLoadingMessages: (
    loading: boolean
  ) => void

  setMessageError: (
    error: string | null
  ) => void
}

export const useMessageStore =
  create<MessageState>((set, get) => ({
    messages: [],
    loadingMessages: false,
    messageError: null,
    streamingMessageId: null,
    abortCurrentStream: null,
    messagesCache: {},
    scrollPositions: {},

    setMessages: (messages) =>
      set({
        messages
      }),

    setCachedMessages: (chatId, messages) =>
      set((state) => ({
        messages,
        messagesCache: {
          ...state.messagesCache,
          [chatId]: messages
        }
      })),

    getCachedMessages: (chatId) => get().messagesCache[chatId],

    saveScrollPosition: (chatId, scrollTop) =>
      set((state) => ({
        scrollPositions: {
          ...state.scrollPositions,
          [chatId]: scrollTop
        }
      })),

    getScrollPosition: (chatId) => get().scrollPositions[chatId],

    switchChat: (chatId) => {
      const cached = get().messagesCache[chatId]
      if (cached) {
        set({
          messages: cached,
          loadingMessages: false,
          messageError: null,
          streamingMessageId: null
        })
        return true // Cache hit: Instant Render (0ms latency)
      }
      set({
        messages: [],
        loadingMessages: true,
        messageError: null,
        streamingMessageId: null
      })
      return false // Cache miss: Cần tải từ server
    },

    addMessage: (message) =>
      set((state) => {
        const nextMessages = [...state.messages, message]
        const chatId = message.chatSessionId
        return {
          messages: nextMessages,
          messagesCache: chatId
            ? {
                ...state.messagesCache,
                [chatId]: [...(state.messagesCache[chatId] ?? []), message]
              }
            : state.messagesCache
        }
      }),

    updateMessage: (messageId, content) =>
      set((state) => {
        const nextMessages = state.messages.map((message) =>
          message.id === messageId
            ? { ...message, content }
            : message
        )
        const updatedCache = { ...state.messagesCache }
        for (const [cId, msgs] of Object.entries(updatedCache)) {
          if (msgs.some((m) => m.id === messageId)) {
            updatedCache[cId] = msgs.map((m) =>
              m.id === messageId ? { ...m, content } : m
            )
          }
        }
        return {
          messages: nextMessages,
          messagesCache: updatedCache
        }
      }),

    replaceMessageId: (oldMessageId, newMessageId) =>
      set((state) => {
        const nextMessages = state.messages.map((message) =>
          message.id === oldMessageId
            ? { ...message, id: newMessageId }
            : message
        )
        const updatedCache = { ...state.messagesCache }
        for (const [cId, msgs] of Object.entries(updatedCache)) {
          if (msgs.some((m) => m.id === oldMessageId)) {
            updatedCache[cId] = msgs.map((m) =>
              m.id === oldMessageId ? { ...m, id: newMessageId } : m
            )
          }
        }
        return {
          messages: nextMessages,
          messagesCache: updatedCache
        }
      }),

    replaceMessage: (oldMessageId, newMessage) =>
      set((state) => {
        const nextMessages = state.messages.map((message) =>
          message.id === oldMessageId ? newMessage : message
        )
        const updatedCache = { ...state.messagesCache }
        for (const [cId, msgs] of Object.entries(updatedCache)) {
          if (msgs.some((m) => m.id === oldMessageId)) {
            updatedCache[cId] = msgs.map((m) =>
              m.id === oldMessageId ? newMessage : m
            )
          }
        }
        return {
          messages: nextMessages,
          messagesCache: updatedCache
        }
      }),

    setStreamingMessageId: (messageId) =>
      set({
        streamingMessageId: messageId
      }),

    setAbortCurrentStream: (abort) =>
      set({
        abortCurrentStream: abort
      }),

    clearMessages: () =>
      set({
        messages: [],
        streamingMessageId: null,
        abortCurrentStream: null
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