import { useEffect, useRef, useState, useCallback } from 'react'
import { flushSync } from 'react-dom'
import { useParams } from 'react-router-dom'
import {
  getMessages,
  regenerateMessage
} from '../services/messageService'
import { useAuthStore } from '../stores/authStore'
import { useAIStore } from '../stores/aiStore'
import { useChatStore } from '../stores/chatStore'
import { useMessageStore } from '../stores/messageStore'
import { useTypewriterQueue } from '../hooks/useTypewriterQueue'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'
import ModelSelector from './ModelSelector'
import ThemeToggle from './ThemeToggle'
import ChatBackground from './chat/ChatBackground'
import WelcomeScreen from './chat/WelcomeScreen'

interface ChatAreaProps {
  onOpenMobileSidebar?: () => void
  isSidebarCollapsed?: boolean
  onToggleSidebar?: () => void
}

function ChatArea({
  onOpenMobileSidebar,
  isSidebarCollapsed: _isSidebarCollapsed = false,
  onToggleSidebar: _onToggleSidebar,
}: ChatAreaProps = {}) {
  const { chatId: urlChatId } = useParams<{ chatId?: string }>()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const [hasNewMessagesWhileScrolled, setHasNewMessagesWhileScrolled] = useState(false)

  const isLoadingOlderRef = useRef(false)
  const prevMessagesLengthRef = useRef(0)

  const user = useAuthStore((state) => state.user)
  const userName =
    (user as { name?: string } | null)?.name ||
    (user?.email ? user.email.split('@')[0] : 'Test User 2')

  const chats = useChatStore((state) => state.chats)
  const currentChatId = useChatStore((state) => state.currentChatId)
  const currentChat = chats?.find((c) => c.id === currentChatId)

  const setCurrentChatId = useChatStore((state) => state.setCurrentChatId)
  const selectedModelId = useAIStore((state) => state.selectedModelId)
  const messages = useMessageStore((state) => state.messages)
  const streamingMessageId = useMessageStore((state) => state.streamingMessageId)
  const abortCurrentStream = useMessageStore((state) => state.abortCurrentStream)
  const updateMessage = useMessageStore((state) => state.updateMessage)
  const setStreamingMessageId = useMessageStore((state) => state.setStreamingMessageId)
  const setAbortCurrentStream = useMessageStore((state) => state.setAbortCurrentStream)
  const setCachedMessages = useMessageStore((state) => state.setCachedMessages)
  const saveScrollPosition = useMessageStore((state) => state.saveScrollPosition)
  const switchChat = useMessageStore((state) => state.switchChat)
  const clearMessages = useMessageStore((state) => state.clearMessages)
  const loadingMessages = useMessageStore((state) => state.loadingMessages)
  const messageError = useMessageStore((state) => state.messageError)
  const setLoadingMessages = useMessageStore((state) => state.setLoadingMessages)
  const setMessageError = useMessageStore((state) => state.setMessageError)

  const nextCursor = useMessageStore((state) => state.nextCursor)
  const hasMoreOlder = useMessageStore((state) => state.hasMoreOlder)
  const loadingOlder = useMessageStore((state) => state.loadingOlder)
  const olderError = useMessageStore((state) => state.olderError)
  const prependMessages = useMessageStore((state) => state.prependMessages)
  const setPagination = useMessageStore((state) => state.setPagination)
  const setLoadingOlder = useMessageStore((state) => state.setLoadingOlder)
  const setOlderError = useMessageStore((state) => state.setOlderError)

  const abortControllerRef = useRef<AbortController | null>(null)
  const regenerateRunIdRef = useRef<string | null>(null)
  const isStoppingRef = useRef(false)
  const abortCurrentStreamRef = useRef(abortCurrentStream)
  useEffect(() => {
    abortCurrentStreamRef.current = abortCurrentStream
  }, [abortCurrentStream])
  const { enqueue, waitDrained, flushAll, reset: resetQueue } = useTypewriterQueue()

  // Client-Side Routing sync
  useEffect(() => {
    if (urlChatId && urlChatId !== currentChatId) {
      setCurrentChatId(urlChatId)
    }
  }, [urlChatId, currentChatId, setCurrentChatId])

  // Cleanup stream on component unmount
  useEffect(() => {
    return () => {
      abortCurrentStreamRef.current?.()
      if (
        typeof useMessageStore.getState === 'function' &&
        useMessageStore.getState().abortCurrentStream !== abortCurrentStreamRef.current
      ) {
        useMessageStore.getState().abortCurrentStream?.()
      }
    }
  }, [])

  const handleRegenerate = async (messageId: string) => {
    if (!currentChatId || !selectedModelId || streamingMessageId) {
      return
    }

    const storeState = typeof useMessageStore.getState === 'function'
      ? useMessageStore.getState()
      : null
    const currentMessages = storeState?.messages ?? messages
    const targetMessage = currentMessages.find((m) => m.id === messageId)
    if (!targetMessage) {
      return
    }

    // 5.A: Snapshot full state of target assistant message before any mutation
    const snapshot = {
      ...targetMessage,
      attachments: targetMessage.attachments ? [...targetMessage.attachments] : []
    }

    const runId = crypto.randomUUID()
    regenerateRunIdRef.current = runId

    const controller = new AbortController()
    abortControllerRef.current = controller
    isStoppingRef.current = false
    let receivedChunk = false

    const handleStopRegenerate = () => {
      isStoppingRef.current = true
      abortControllerRef.current?.abort()
      flushAll()
    }

    try {
      setStreamingMessageId(messageId)
      setAbortCurrentStream(handleStopRegenerate)

      await regenerateMessage(
        currentChatId,
        messageId,
        selectedModelId,
        (chunk) => {
          if (regenerateRunIdRef.current !== runId) return
          receivedChunk = true
          enqueue(chunk, (content) => {
            if (regenerateRunIdRef.current === runId) {
              updateMessage(messageId, content)
            }
          })
        },
        controller.signal
      )

      await waitDrained()
    } catch (error) {
      // 5.C: Run identity guard - ignore obsolete runs
      if (regenerateRunIdRef.current !== runId) {
        return
      }

      const isManualStop =
        isStoppingRef.current ||
        (error instanceof DOMException && error.name === 'AbortError')

      if (isManualStop) {
        // Tình huống 3: Người dùng chủ động dừng
        if (!receivedChunk) {
          // Dừng trước khi có chunk mới: giữ nguyên câu trả lời cũ
          updateMessage(messageId, snapshot.content)
        }
        // Nếu đã có chunk mới: giữ nguyên phần nội dung mới đã sinh ra
      } else {
        // Tình huống 2: Lỗi thực sự ngoài ý muốn (trước hoặc sau khi có chunk)
        resetQueue()
        updateMessage(messageId, snapshot.content)
        console.error('Không thể regenerate message:', error)
        setMessageError('Không thể tạo lại tin nhắn. Vui lòng thử lại.')
      }
    } finally {
      if (regenerateRunIdRef.current === runId) {
        isStoppingRef.current = false
        const activeStreamingId = typeof useMessageStore.getState === 'function'
          ? useMessageStore.getState().streamingMessageId
          : null
        if (!activeStreamingId || activeStreamingId === messageId) {
          setAbortCurrentStream(null)
          setStreamingMessageId(null)
        }
        abortControllerRef.current = null
      }
    }
  }

  // Reverse infinite scroll: fetch older messages and preserve scroll position
  const loadOlderMessages = useCallback(async () => {
    if (
      !currentChatId ||
      !nextCursor ||
      isLoadingOlderRef.current ||
      !hasMoreOlder
    ) {
      return
    }

    const targetChatId = currentChatId
    const container = scrollContainerRef.current
    if (!container) return

    isLoadingOlderRef.current = true
    setLoadingOlder(true)
    setOlderError(null)

    const prevScrollHeight = container.scrollHeight
    const prevScrollTop = container.scrollTop

    try {
      const res = await getMessages(targetChatId, 30, nextCursor)
      const fetched = Array.isArray(res) ? res : res.messages
      const newNextCursor = Array.isArray(res) ? null : res.nextCursor
      const newHasMore = Array.isArray(res) ? false : res.hasMore

      // Synchronously commit prepended messages to DOM
      flushSync(() => {
        prependMessages(targetChatId, fetched)
        setPagination(targetChatId, newNextCursor, newHasMore)
      })

      // Preserve scroll position only if user hasn't switched away
      if (container && currentChatId === targetChatId) {
        const newScrollHeight = container.scrollHeight
        const heightDelta = newScrollHeight - prevScrollHeight
        container.scrollTop = prevScrollTop + heightDelta
      }
    } catch (error) {
      console.error('Không thể tải tin nhắn cũ:', error)
      setOlderError('Không thể tải tin nhắn cũ. Thử lại')
    } finally {
      setLoadingOlder(false)
      isLoadingOlderRef.current = false
    }
  }, [
    currentChatId,
    nextCursor,
    hasMoreOlder,
    prependMessages,
    setPagination,
    setLoadingOlder,
    setOlderError
  ])

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const { scrollHeight, scrollTop, clientHeight } = container
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight

    const isAtBottom = distanceFromBottom < 100
    isAtBottomRef.current = isAtBottom

    if (isAtBottom) {
      setShowScrollToBottom(false)
      setHasNewMessagesWhileScrolled(false)
    } else {
      setShowScrollToBottom(true)
    }

    if (currentChatId) {
      saveScrollPosition(currentChatId, scrollTop)
    }

    // Trigger load older messages when user scrolls near top (threshold <= 200px)
    if (
      scrollTop <= 200 &&
      hasMoreOlder &&
      !loadingOlder &&
      !loadingMessages &&
      currentChatId &&
      nextCursor &&
      !isLoadingOlderRef.current
    ) {
      loadOlderMessages()
    }
  }, [
    currentChatId,
    saveScrollPosition,
    hasMoreOlder,
    loadingOlder,
    loadingMessages,
    nextCursor,
    loadOlderMessages
  ])

  const forceScrollToBottom = useCallback((smooth = false) => {
    isAtBottomRef.current = true
    setShowScrollToBottom(false)
    setHasNewMessagesWhileScrolled(false)
    const container = scrollContainerRef.current
    if (container) {
      if (smooth) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        })
      } else {
        container.scrollTop = container.scrollHeight
      }
    }
  }, [])

  const scrollToBottom = useCallback((smooth = true) => {
    forceScrollToBottom(smooth)
  }, [forceScrollToBottom])

  useEffect(() => {
    const handleScrollToBottomEvent = () => {
      forceScrollToBottom(true)
    }
    window.addEventListener('ai-chat-scroll-to-bottom', handleScrollToBottomEvent)
    return () => {
      window.removeEventListener('ai-chat-scroll-to-bottom', handleScrollToBottomEvent)
    }
  }, [forceScrollToBottom])

  useEffect(() => {
    if (!currentChatId) {
      clearMessages()
      setMessageError(null)
      setLoadingMessages(false)
      setHasNewMessagesWhileScrolled(false)
      prevMessagesLengthRef.current = 0
      return
    }

    let isCancelled = false
    isAtBottomRef.current = true
    setShowScrollToBottom(false)
    setHasNewMessagesWhileScrolled(false)

    const isCached = switchChat(currentChatId)

    if (isCached) {
      const activeMessages =
        typeof useMessageStore.getState === 'function'
          ? useMessageStore.getState().messages
          : undefined
      prevMessagesLengthRef.current = activeMessages ? activeMessages.length : 0
      requestAnimationFrame(() => {
        if (isCancelled) return
        forceScrollToBottom(false)
        requestAnimationFrame(() => {
          if (isCancelled) return
          forceScrollToBottom(false)
        })
      })
      return
    }

    const fetchChatMessages = async () => {
      try {
        setLoadingMessages(true)
        setMessageError(null)

        const res = await getMessages(currentChatId)
        if (isCancelled) return

        const fetchedMessages = Array.isArray(res) ? res : res.messages

        if (Array.isArray(res)) {
          setCachedMessages(currentChatId, fetchedMessages)
        } else {
          setCachedMessages(currentChatId, fetchedMessages, res.nextCursor, res.hasMore)
        }
        prevMessagesLengthRef.current = fetchedMessages.length

        requestAnimationFrame(() => {
          if (isCancelled) return
          forceScrollToBottom(false)
          requestAnimationFrame(() => {
            if (isCancelled) return
            forceScrollToBottom(false)
          })
        })
      } catch (error) {
        if (isCancelled) return
        console.error('Không thể tải messages:', error)
        setMessageError('Không thể tải tin nhắn. Vui lòng thử lại.')
      } finally {
        if (!isCancelled) {
          setLoadingMessages(false)
        }
      }
    }

    fetchChatMessages()

    return () => {
      isCancelled = true
    }
  }, [
    currentChatId,
    switchChat,
    setCachedMessages,
    clearMessages,
    setLoadingMessages,
    setMessageError,
    forceScrollToBottom
  ])

  useEffect(() => {
    const lastMsg = messages[messages.length - 1]

    if (lastMsg && lastMsg.role === 'user') {
      isAtBottomRef.current = true
      setShowScrollToBottom(false)
      setHasNewMessagesWhileScrolled(false)
      scrollToBottom(true)
      prevMessagesLengthRef.current = messages.length
      return
    }

    const isNewMessageAdded = messages.length > prevMessagesLengthRef.current
    prevMessagesLengthRef.current = messages.length

    if (!isAtBottomRef.current) {
      if (isNewMessageAdded || streamingMessageId) {
        setHasNewMessagesWhileScrolled(true)
        setShowScrollToBottom(true)
      }
      return
    }

    const container = scrollContainerRef.current
    if (!container) return

    if (streamingMessageId) {
      requestAnimationFrame(() => {
        if (isAtBottomRef.current && scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop =
            scrollContainerRef.current.scrollHeight
        }
      })
    } else {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [messages, streamingMessageId, scrollToBottom])

  const handleSelectPrompt = (promptText: string) => {
    window.dispatchEvent(
      new CustomEvent('ai-chat-prompt-select', { detail: promptText })
    )
  }

  return (
    <main className="relative flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden h-full">
      {/* Background Star Effect Layer */}
      <ChatBackground />

      {/* Docked Top Header: 56px (h-14) Premium AI Workspace Header */}
      <header className="relative z-40 flex h-14 shrink-0 items-center justify-between border-b border-slate-200/90 dark:border-white/[0.08] bg-white/95 dark:bg-[#131923]/95 backdrop-blur-md px-3.5 sm:px-6 transition-colors duration-200 shadow-xs">
        {/* Left: Mobile Navigation, Workspace Status & Breadcrumb Title */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-3 sm:mr-4">
          {onOpenMobileSidebar && (
            <button
              type="button"
              onClick={onOpenMobileSidebar}
              className="md:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1A2230] text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F1F5F9] hover:bg-slate-100 dark:hover:bg-[#222C3D] transition active:scale-95 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#15803D] dark:focus-visible:ring-emerald-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#131923] focus-visible:outline-none"
              aria-label="Mở menu danh sách đoạn chat"
              title="Mở menu"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          {/* Hidden accessible title for tests */}
          <span className="sr-only">
            {currentChatId ? (currentChat?.title || `Chat ID: ${currentChatId}`) : 'Chưa chọn chat'}
          </span>

          {/* M7-F07: Stable screen reader live region announcement during streaming */}
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
            data-testid="streaming-status-announcer"
          >
            {streamingMessageId ? 'AI đang trả lời' : ''}
          </div>

          {/* Workspace Status Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100/90 dark:bg-[#1A2230] border border-slate-200/80 dark:border-white/[0.08] text-[11px] font-semibold text-slate-700 dark:text-[#94A3B8] shrink-0 select-none">
            <span className="h-2 w-2 rounded-full bg-[#1B8F3D]" aria-hidden="true" />
            <span>AI Workspace</span>
          </div>

          <span className="hidden sm:inline shrink-0 text-slate-300 dark:text-[#64748B] font-light select-none text-sm" aria-hidden="true">›</span>

          {/* Workspace Breadcrumbs Hierarchy */}
          <div
            className="flex items-center gap-1.5 min-w-0 text-xs sm:text-sm"
            title={currentChat ? `AI Chat / ${currentChat.title}` : 'AI Chat'}
          >
            <span className="sm:hidden shrink-0 font-bold text-slate-700 dark:text-[#94A3B8] tracking-tight">AI Chat</span>
            {currentChat ? (
              <>
                <span className="sm:hidden shrink-0 text-slate-400 dark:text-[#64748B] font-normal select-none" aria-hidden="true">/</span>
                <h1 className="truncate font-semibold text-slate-900 dark:text-[#F1F5F9]">
                  {currentChat.title}
                </h1>
              </>
            ) : (
              <span className="text-slate-500 dark:text-[#94A3B8] text-xs font-normal">Đoạn chat mới</span>
            )}
          </div>
        </div>

        {/* Right side: Model Selector & Theme Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <ModelSelector />

          <ThemeToggle />
        </div>
      </header>

      {/* Main Chat Scroll Container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="relative z-10 flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4 scrollbar-thin"
      >
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 pb-8">
          {loadingMessages ? (
            /* Skeleton Loading */
            <div className="flex flex-col gap-6 py-4">
              <div className="flex justify-end">
                <div className="w-[60%] sm:w-[45%] rounded-2xl bg-gray-800/80 p-4 space-y-2.5 border border-white/10 shadow-md">
                  <div className="h-3 w-1/4 rounded skeleton-shimmer" />
                  <div className="h-3.5 w-full rounded skeleton-shimmer" />
                  <div className="h-3.5 w-3/4 rounded skeleton-shimmer" />
                </div>
              </div>
              <div className="flex justify-start">
                <div className="w-[85%] sm:w-[70%] rounded-2xl bg-gray-800/80 p-4 space-y-3 border border-white/10 shadow-md">
                  <div className="h-3 w-1/5 rounded skeleton-shimmer" />
                  <div className="h-3.5 w-full rounded skeleton-shimmer" />
                  <div className="h-3.5 w-11/12 rounded skeleton-shimmer" />
                  <div className="h-3.5 w-4/5 rounded skeleton-shimmer" />
                </div>
              </div>
            </div>
          ) : messageError ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <p className="text-sm text-red-400">
                {messageError}
              </p>
            </div>
          ) : messages.length === 0 ? (
            <WelcomeScreen
              userName={userName}
              onSelectPrompt={handleSelectPrompt}
            />
          ) : (
            /* Message List */
            <div
              key={currentChatId ?? 'empty'}
              className="chat-cross-fade flex w-full flex-col gap-4"
            >
              {/* Older Messages Loading / Error Indicator */}
              {loadingOlder && (
                <div
                  className="flex items-center justify-center py-2 text-xs text-slate-500 dark:text-gray-400 gap-2 select-none"
                  aria-live="polite"
                >
                  <span className="inline-block animate-spin text-sm">◌</span>
                  <span>Đang tải tin nhắn cũ...</span>
                </div>
              )}
              {olderError && (
                <div
                  className="flex items-center justify-center py-2 gap-2 text-xs"
                  aria-live="assertive"
                >
                  <span className="text-red-500">{olderError}</span>
                  <button
                    type="button"
                    onClick={() => loadOlderMessages()}
                    className="text-[#1B8F3D] hover:underline font-semibold cursor-pointer"
                  >
                    Thử lại
                  </button>
                </div>
              )}

              {(() => {
                const lastAssistantIdx = messages.reduce(
                  (lastIdx, msg, idx) =>
                    msg.role === 'assistant' ? idx : lastIdx,
                  -1
                )

                return messages.map((message, idx) => (
                  <MessageBubble
                    key={message.id}
                    role={message.role === 'user' ? 'user' : 'ai'}
                    content={message.content}
                    attachments={message.attachments}
                    isStreaming={message.id === streamingMessageId}
                    onRegenerate={
                      message.role === 'assistant' &&
                        idx === lastAssistantIdx
                        ? () => handleRegenerate(message.id)
                        : undefined
                    }
                  />
                ))
              })()}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Smart Scroll: Nút cuộn xuống dưới */}
      {showScrollToBottom && (
        <div className="pointer-events-none absolute bottom-24 left-0 right-0 z-20 flex justify-center animate-dropdown">
          <button
            type="button"
            onClick={() => {
              scrollToBottom(true)
              setHasNewMessagesWhileScrolled(false)
            }}
            className={`pointer-events-auto scroll-to-bottom-btn flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold shadow-xl backdrop-blur-md transition-all active:scale-95 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#1B8F3D]/50 ${hasNewMessagesWhileScrolled
                ? 'border-[#1B8F3D]/60 bg-white/95 dark:bg-[#161d28]/95 text-slate-900 dark:text-white shadow-[0_0_15px_rgba(27,143,61,0.25)]'
                : 'border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-[#161d28]/90 text-slate-700 dark:text-gray-200 hover:border-[#1B8F3D]/50 hover:text-slate-900 dark:hover:text-white'
              }`}
            title={hasNewMessagesWhileScrolled ? 'Tin nhắn mới' : 'Cuộn xuống tin nhắn mới nhất'}
            aria-label={hasNewMessagesWhileScrolled ? 'Tin nhắn mới' : 'Cuộn xuống tin nhắn mới nhất'}
          >
            <svg className="h-3.5 w-3.5 text-[#1B8F3D] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <span>{hasNewMessagesWhileScrolled ? 'Tin nhắn mới' : 'Cuộn xuống tin nhắn mới nhất'}</span>
            {(streamingMessageId || hasNewMessagesWhileScrolled) && (
              <span className="relative ml-0.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1B8F3D] opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#1B8F3D]"></span>
              </span>
            )}
          </button>
        </div>
      )}

      {/* Floating Composer */}
      <ChatInput />
    </main>
  )
}

export default ChatArea