import { create } from 'zustand'
import type { Message } from '../services/messageService'

interface MessageState {
  activeChatId: string | null
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

  setActiveChatId: (chatId: string | null) => void
  setMessages: (messages: Message[]) => void
  setCachedMessages: (chatId: string, messages: Message[], nextCursor?: string | null, hasMore?: boolean) => void
  getCachedMessages: (chatId: string) => Message[] | undefined
  saveScrollPosition: (chatId: string, scrollTop: number) => void
  getScrollPosition: (chatId: string) => number | undefined
  switchChat: (chatId: string) => boolean
  deleteChatCache: (chatId: string) => void

  setPagination: (chatId: string, nextCursor: string | null, hasMore: boolean) => void
  prependMessages: (chatId: string, olderMessages: Message[]) => void
  setLoadingOlder: (loading: boolean) => void
  setOlderError: (error: string | null) => void

  addMessage: (message: Message) => void
  removeMessage: (messageId: string) => void

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

    setActiveChatId: (chatId) =>
      set({
        activeChatId: chatId
      }),

    setMessages: (messages) =>
      set({
        messages
      }),

    setCachedMessages: (chatId, messages, nextCursor = null, hasMore = false) =>
      set((state) => ({
        messages: (state.activeChatId === chatId || state.activeChatId === null) ? messages : state.messages,
        activeChatId: (state.activeChatId === chatId || state.activeChatId === null) ? chatId : state.activeChatId,
        nextCursor: (state.activeChatId === chatId || state.activeChatId === null) ? nextCursor : state.nextCursor,
        hasMoreOlder: (state.activeChatId === chatId || state.activeChatId === null) ? hasMore : state.hasMoreOlder,
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
      // Fix1-B: Abort any running stream when leaving chat
      get().abortCurrentStream?.()

      const cached = get().messagesCache[chatId]
      const cachedPagination = get().paginationCache[chatId]
      if (cached) {
        set({
          activeChatId: chatId,
          messages: cached,
          nextCursor: cachedPagination?.nextCursor ?? null,
          hasMoreOlder: cachedPagination?.hasMore ?? false,
          loadingMessages: false,
          loadingOlder: false,
          messageError: null,
          olderError: null,
          streamingMessageId: null,
          abortCurrentStream: null
        })
        return true // Cache hit: Instant Render (0ms latency)
      }
      set({
        activeChatId: chatId,
        messages: [],
        nextCursor: null,
        hasMoreOlder: false,
        loadingMessages: true,
        loadingOlder: false,
        messageError: null,
        olderError: null,
        streamingMessageId: null,
        abortCurrentStream: null
      })
      return false // Cache miss: Cần tải từ server
    },

    deleteChatCache: (chatId) =>
      set((state) => {
        const isActive = state.activeChatId === chatId
        if (isActive) {
          state.abortCurrentStream?.()
        }
        const updatedCache = { ...state.messagesCache }
        delete updatedCache[chatId]
        const updatedPagination = { ...state.paginationCache }
        delete updatedPagination[chatId]
        const updatedScroll = { ...state.scrollPositions }
        delete updatedScroll[chatId]

        return {
          messages: isActive ? [] : state.messages,
          activeChatId: isActive ? null : state.activeChatId,
          nextCursor: isActive ? null : state.nextCursor,
          hasMoreOlder: isActive ? false : state.hasMoreOlder,
          loadingOlder: isActive ? false : state.loadingOlder,
          olderError: isActive ? null : state.olderError,
          streamingMessageId: isActive ? null : state.streamingMessageId,
          abortCurrentStream: isActive ? null : state.abortCurrentStream,
          messagesCache: updatedCache,
          paginationCache: updatedPagination,
          scrollPositions: updatedScroll
        }
      }),

    setPagination: (chatId, nextCursor, hasMore) =>
      set((state) => {
        const isTargetActive =
          state.activeChatId === chatId ||
          (state.activeChatId === null &&
            state.messages.length > 0 &&
            state.messages.some((m) => m.chatSessionId === chatId))

        const cacheExists = Object.prototype.hasOwnProperty.call(state.messagesCache, chatId)
        // Hardening A: If chat is neither active nor in messagesCache (deleted or never loaded), do not create orphan paginationCache entry
        if (!isTargetActive && !cacheExists) {
          return state
        }

        return {
          nextCursor: isTargetActive ? nextCursor : state.nextCursor,
          hasMoreOlder: isTargetActive ? hasMore : state.hasMoreOlder,
          paginationCache: {
            ...state.paginationCache,
            [chatId]: { nextCursor, hasMore }
          }
        }
      }),

    prependMessages: (chatId, olderMessages) =>
      set((state) => {
        const isActive =
          state.activeChatId === chatId ||
          (state.activeChatId === null &&
            state.messages.length > 0 &&
            state.messages.some((m) => m.chatSessionId === chatId))

        const cacheExists = Object.prototype.hasOwnProperty.call(state.messagesCache, chatId)
        // If not active and not cached, chat may have been deleted or not loaded; avoid resurrecting
        if (!isActive && !cacheExists) {
          return state
        }
        const targetMessages = isActive
          ? state.messages
          : (state.messagesCache[chatId] ?? [])
        const existingIds = new Set(targetMessages.map((m) => m.id))
        const uniqueOlder = olderMessages.filter((m) => !existingIds.has(m.id))
        const newChatMessages = [...uniqueOlder, ...targetMessages]
        return {
          messages: isActive ? newChatMessages : state.messages,
          messagesCache: {
            ...state.messagesCache,
            [chatId]: newChatMessages
          }
        }
      }),

    setLoadingOlder: (loading) => set({ loadingOlder: loading }),
    setOlderError: (error) => set({ olderError: error }),

    addMessage: (message) =>
      set((state) => {
        const chatId = message.chatSessionId
        const isForActiveChat = !chatId || !state.activeChatId || state.activeChatId === chatId
        const nextMessages = isForActiveChat
          ? [...state.messages, message]
          : state.messages

        const shouldUpdateCache = Boolean(
          chatId && (isForActiveChat || Object.prototype.hasOwnProperty.call(state.messagesCache, chatId))
        )

        return {
          messages: nextMessages,
          messagesCache: shouldUpdateCache && chatId
            ? {
                ...state.messagesCache,
                [chatId]: [...(state.messagesCache[chatId] ?? []), message]
              }
            : state.messagesCache
        }
      }),

    removeMessage: (messageId) =>
      set((state) => {
        const nextMessages = state.messages.filter((m) => m.id !== messageId)
        const updatedCache = { ...state.messagesCache }
        for (const [cId, msgs] of Object.entries(updatedCache)) {
          if (msgs.some((m) => m.id === messageId)) {
            updatedCache[cId] = msgs.filter((m) => m.id !== messageId)
          }
        }
        return {
          messages: nextMessages,
          messagesCache: updatedCache
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

    clearMessages: () => {
      // Fix1-B: Abort any running stream when clearing messages
      get().abortCurrentStream?.()
      set({
        activeChatId: null,
        messages: [],
        nextCursor: null,
        hasMoreOlder: false,
        loadingOlder: false,
        olderError: null,
        streamingMessageId: null,
        abortCurrentStream: null
      })
    },

    clearAll: () => {
      // Fix1-B: Abort any running stream when clearing all state
      get().abortCurrentStream?.()
      set({
        activeChatId: null,
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
      })
    },

    setLoadingMessages: (loading) =>
      set({
        loadingMessages: loading
      }),

    setMessageError: (error) =>
      set({
        messageError: error
      })
  }))