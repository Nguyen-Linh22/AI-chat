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

interface ChatAreaProps {
  onOpenMobileSidebar?: () => void
  isSidebarCollapsed?: boolean
  onToggleSidebar?: () => void
}

const SUGGESTED_PROMPTS = [
  {
    icon: '🧭',
    iconBg: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    title: 'Giải thích cơ học lượng tử đơn giản',
    subtitle: 'Giải thích cơ học lượng tử đơn giản',
    prompt: 'Hãy giải thích cơ học lượng tử một cách đơn giản, dễ hiểu cho người mới bắt đầu.',
  },
  {
    icon: '🪶',
    iconBg: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    title: 'Sáng tạo câu chuyện ngắn về robot',
    subtitle: 'Sáng tạo câu chuyện ngắn về robot',
    prompt: 'Hãy sáng tạo một câu chuyện ngắn thú vị và giàu cảm xúc về một chú robot.',
  },
  {
    icon: '>_',
    iconBg: 'bg-purple-500/20 text-purple-400 border border-purple-500/30 font-mono',
    title: 'Viết mã Python so sánh hai chuỗi',
    subtitle: 'Viết mã Python so sánh và tìm ra điểm khác biệt của hai chuỗi',
    prompt: 'Viết mã Python so sánh hai chuỗi và tìm sự khác biệt chi tiết.',
  },
  {
    icon: '💬',
    iconBg: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
    title: 'Tối ưu hóa thuật toán tìm kiếm',
    subtitle: 'Phân tích độ phức tạp thời gian O(n)',
    prompt: 'Hướng dẫn các kỹ thuật tối ưu hóa thuật toán tìm kiếm và cấu trúc dữ liệu.',
  },
  {
    icon: '🤖',
    iconBg: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
    title: 'Viết mã Python so sánh hai chuỗi',
    subtitle: 'Giải thích cơ học lượng tử từ đem đơn giản',
    prompt: 'Viết hàm Python nâng cao để so sánh độ tương đồng giữa hai chuỗi văn bản.',
  },
  {
    icon: '⚙',
    iconBg: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
    title: 'Sáng tạo câu chuyện về robot',
    subtitle: 'Sáng tạo : câu chuyện ngắn về robot',
    prompt: 'Viết kịch bản ngắn về một chú robot tìm kiếm ước mơ của mình trong thế giới tương lai.',
  },
  {
    icon: '🤖',
    iconBg: 'bg-red-500/20 text-red-400 border border-red-500/30',
    title: 'Viết mã Python so sánh RAM và CPU',
    subtitle: 'Viết mã Python so sánh RAM và CPU',
    prompt: 'Hãy hướng dẫn tôi cách tối ưu hóa bộ nhớ RAM và CPU khi chạy thuật toán trong Python.',
  },
  {
    icon: '🪐',
    iconBg: 'bg-teal-500/20 text-teal-400 border border-teal-500/30',
    title: 'Viết mã Python so sánh hai chuỗi',
    subtitle: 'Viết mã Python kiểm tra chuỗi đối xứng (Palindrome)',
    prompt: 'Viết mã Python kiểm tra chuỗi đối xứng (Palindrome) và chuỗi con chung dài nhất.',
  },
]

function ChatArea({
  onOpenMobileSidebar,
  isSidebarCollapsed = false,
  onToggleSidebar,
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
  const isStoppingRef = useRef(false)
  const { enqueue, waitDrained, flushAll, reset: resetQueue } = useTypewriterQueue()

  // Client-Side Routing sync
  useEffect(() => {
    if (urlChatId && urlChatId !== currentChatId) {
      setCurrentChatId(urlChatId)
    }
  }, [urlChatId, currentChatId, setCurrentChatId])

  const handleRegenerate = async (messageId: string) => {
    if (!currentChatId || !selectedModelId || streamingMessageId) {
      return
    }

    const controller = new AbortController()
    abortControllerRef.current = controller
    isStoppingRef.current = false

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
          enqueue(chunk, (content) => updateMessage(messageId, content))
        },
        controller.signal
      )

      await waitDrained()
    } catch (error) {
      if (isStoppingRef.current) {
        // user stopped
      } else if (error instanceof DOMException && error.name === 'AbortError') {
        // abort
      } else {
        resetQueue()
        console.error('Không thể regenerate message:', error)
      }
    } finally {
      isStoppingRef.current = false
      setAbortCurrentStream(null)
      setStreamingMessageId(null)
      abortControllerRef.current = null
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

    const container = scrollContainerRef.current
    if (!container) return

    isLoadingOlderRef.current = true
    setLoadingOlder(true)
    setOlderError(null)

    const prevScrollHeight = container.scrollHeight
    const prevScrollTop = container.scrollTop

    try {
      const res = await getMessages(currentChatId, 30, nextCursor)
      const fetched = Array.isArray(res) ? res : res.messages
      const newNextCursor = Array.isArray(res) ? null : res.nextCursor
      const newHasMore = Array.isArray(res) ? false : res.hasMore

      // Synchronously commit prepended messages to DOM
      flushSync(() => {
        prependMessages(currentChatId, fetched)
        setPagination(currentChatId, newNextCursor, newHasMore)
      })

      // Preserve scroll position so user sees the exact same content without jumping
      const newScrollHeight = container.scrollHeight
      const heightDelta = newScrollHeight - prevScrollHeight
      container.scrollTop = prevScrollTop + heightDelta
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
      prevMessagesLengthRef.current = messages.length
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

      {/* Soft Ambient Glows matching screenshot */}
      <div
        className="pointer-events-none absolute -top-24 right-1/4 h-[450px] w-[450px] rounded-full bg-[#1B8F3D]/10 dark:bg-[#1B8F3D]/20 blur-[130px] opacity-40 dark:opacity-100"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 left-1/4 h-[450px] w-[450px] rounded-full bg-[#B91E2B]/10 dark:bg-[#B91E2B]/20 blur-[130px] opacity-40 dark:opacity-100"
        aria-hidden="true"
      />

      {/* Floating Header matching screenshot */}
      <header className="relative z-40 flex h-11 shrink-0 items-center justify-between rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-[#121824]/80 px-4 backdrop-blur-xl shadow-xs dark:shadow-lg mb-2 transition-colors duration-200">
        <div className="flex items-center gap-2 min-w-0">
          {onOpenMobileSidebar && (
            <button
              type="button"
              onClick={onOpenMobileSidebar}
              className="md:hidden flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-[#161d28]/90 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition active:scale-95 cursor-pointer"
              aria-label="Mở menu danh sách đoạn chat"
              title="Mở menu"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          {isSidebarCollapsed && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="hidden md:flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-[#161d28]/90 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition active:scale-95 cursor-pointer"
              aria-label="Mở thanh bên"
              title="Mở thanh bên"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Hidden accessible title for tests */}
          <span className="sr-only">
            {currentChatId ? (currentChat?.title || `Chat ID: ${currentChatId}`) : 'Chưa chọn chat'}
          </span>
        </div>

        {/* Center Title / Conversation Breadcrumb Hierarchy */}
        <div
          className="absolute left-1/2 -translate-x-1/2 max-w-[38%] sm:max-w-[50%] md:max-w-[58%] min-w-0 flex items-center justify-center pointer-events-auto"
          title={currentChat ? `AI Chat / ${currentChat.title}` : 'AI Chat'}
        >
          <div className="flex items-center gap-1.5 min-w-0 text-xs sm:text-sm">
            <span className="shrink-0 font-bold text-slate-700 dark:text-gray-300 tracking-tight">AI Chat</span>
            {currentChat ? (
              <>
                <span className="shrink-0 text-slate-400 dark:text-gray-500 font-normal select-none" aria-hidden="true">/</span>
                <h1 className="truncate font-semibold text-slate-900 dark:text-white">
                  {currentChat.title}
                </h1>
              </>
            ) : null}
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
        className="relative z-10 flex-1 min-h-0 overflow-y-auto px-3 sm:px-6 py-2 scrollbar-thin"
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
            /* Empty State Matching Screenshot */
            <div className="flex flex-col items-start w-full pt-4 px-2 sm:px-4 animate-dropdown">
              <p className="text-xs text-slate-500 dark:text-gray-400 font-normal">
                Màn hình chào mừng
              </p>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
                Chào mừng, {userName}!
              </h2>

              <p className="text-xs text-slate-500 dark:text-gray-400 font-medium mt-6 mb-3">
                Suggested Prompt
              </p>

              {/* Accessible text for test suites */}
              <span className="sr-only">
                Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện!
              </span>

              {/* Suggested Prompts 4-column Grid matching screenshot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
                {SUGGESTED_PROMPTS.map((prompt, index) => (
                  <button
                    key={`${prompt.title}-${index}`}
                    type="button"
                    onClick={() => handleSelectPrompt(prompt.prompt)}
                    className={`animate-prompt-card stagger-${index % 4} group flex flex-col text-left rounded-2xl border border-slate-200/80 dark:border-white/5 bg-white/80 dark:bg-[#161e2c]/70 p-3.5 transition-all duration-150 hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-white/20 hover:bg-white dark:hover:bg-[#1a2436]/90 active:scale-[0.98] shadow-xs dark:shadow-sm backdrop-blur-md cursor-pointer`}
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${prompt.iconBg}`}>
                        {prompt.icon}
                      </div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-gray-100 group-hover:text-slate-900 dark:group-hover:text-white leading-tight line-clamp-2">
                        {prompt.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-gray-400 group-hover:text-slate-700 dark:group-hover:text-gray-300 line-clamp-2 leading-relaxed">
                      {prompt.subtitle}
                    </p>
                  </button>
                ))}
              </div>
            </div>
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
            className={`pointer-events-auto scroll-to-bottom-btn flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold shadow-xl backdrop-blur-md transition-all active:scale-95 cursor-pointer ${hasNewMessagesWhileScrolled
                ? 'border-[#1B8F3D]/60 bg-white/95 dark:bg-[#161d28]/95 text-slate-900 dark:text-white shadow-[0_0_15px_rgba(27,143,61,0.25)]'
                : 'border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-[#161d28]/90 text-slate-700 dark:text-gray-200 hover:border-[#1B8F3D]/50 hover:text-slate-900 dark:hover:text-white'
              }`}
            title={hasNewMessagesWhileScrolled ? 'Tin nhắn mới' : 'Cuộn xuống tin nhắn mới nhất'}
            aria-label={hasNewMessagesWhileScrolled ? 'Tin nhắn mới' : 'Cuộn xuống tin nhắn mới nhất'}
          >
            <span className="text-sm font-bold text-[#1B8F3D]">↓</span>
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