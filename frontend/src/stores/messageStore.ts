import { create } from 'zustand'
import type { Message } from '../services/messageService'

interface MessageState {
  messages: Message[]
  loadingMessages: boolean
  messageError: string | null
  streamingMessageId: string | null
  abortCurrentStream: (() => void) | null

  // Pagination state for reverse infinite scroll
  nextCursor: string | null
  hasMoreOlder: boolean
  loadingOlder: boolean
  olderError: string | null
  paginationCache: Record<string, { nextCursor: string | null; hasMore: boolean }>

  // In-Memory RAM Cache cho từng cuộc trò chuyện (0ms latency khi chuyển tab)
  messagesCache: Record<string, Message[]>
  // Vị trí cuộn đã lưu cho mỗi chat (Scroll Restoration)
  scrollPositions: Record<string, number>

  setMessages: (messages: Message[]) => void
  setCachedMessages: (chatId: string, messages: Message[], nextCursor?: string | null, hasMore?: boolean) => void
  getCachedMessages: (chatId: string) => Message[] | undefined
  saveScrollPosition: (chatId: string, scrollTop: number) => void
  getScrollPosition: (chatId: string) => number | undefined
  switchChat: (chatId: string) => boolean

  setPagination: (chatId: string, nextCursor: string | null, hasMore: boolean) => void
  prependMessages: (chatId: string, olderMessages: Message[]) => void
  setLoadingOlder: (loading: boolean) => void
  setOlderError: (error: string | null) => void

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
  clearAll: () => void

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
    paginationCache: {},
    scrollPositions: {},
    nextCursor: null,
    hasMoreOlder: false,
    loadingOlder: false,
    olderError: null,

    setMessages: (messages) =>
      set({
        messages
      }),

    setCachedMessages: (chatId, messages, nextCursor = null, hasMore = false) =>
      set((state) => ({
        messages,
        nextCursor,
        hasMoreOlder: hasMore,
        messagesCache: {
          ...state.messagesCache,
          [chatId]: messages
        },
        paginationCache: {
          ...state.paginationCache,
          [chatId]: { nextCursor, hasMore }
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
      const cachedPagination = get().paginationCache[chatId]
      if (cached) {
        set({
          messages: cached,
          nextCursor: cachedPagination?.nextCursor ?? null,
          hasMoreOlder: cachedPagination?.hasMore ?? false,
          loadingMessages: false,
          loadingOlder: false,
          messageError: null,
          olderError: null,
          streamingMessageId: null
        })
        return true // Cache hit: Instant Render (0ms latency)
      }
      set({
        messages: [],
        nextCursor: null,
        hasMoreOlder: false,
        loadingMessages: true,
        loadingOlder: false,
        messageError: null,
        olderError: null,
        streamingMessageId: null
      })
      return false // Cache miss: Cần tải từ server
    },

    setPagination: (chatId, nextCursor, hasMore) =>
      set((state) => ({
        nextCursor,
        hasMoreOlder: hasMore,
        paginationCache: {
          ...state.paginationCache,
          [chatId]: { nextCursor, hasMore }
        }
      })),

    prependMessages: (chatId, olderMessages) =>
      set((state) => {
        const existingIds = new Set(state.messages.map((m) => m.id))
        const uniqueOlder = olderMessages.filter((m) => !existingIds.has(m.id))
        const newMessages = [...uniqueOlder, ...state.messages]
        return {
          messages: newMessages,
          messagesCache: {
            ...state.messagesCache,
            [chatId]: newMessages
          }
        }
      }),

    setLoadingOlder: (loading) => set({ loadingOlder: loading }),
    setOlderError: (error) => set({ olderError: error }),

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
        nextCursor: null,
        hasMoreOlder: false,
        loadingOlder: false,
        olderError: null,
        streamingMessageId: null,
        abortCurrentStream: null
      }),

    clearAll: () =>
      set({
        messages: [],
        messagesCache: {},
        paginationCache: {},
        scrollPositions: {},
        nextCursor: null,
        hasMoreOlder: false,
        loadingOlder: false,
        olderError: null,
        streamingMessageId: null,
        abortCurrentStream: null,
        loadingMessages: false,
        messageError: null
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