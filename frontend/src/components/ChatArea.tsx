import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import {
  getMessages,
  regenerateMessage
} from '../services/messageService'
import { useAIStore } from '../stores/aiStore'
import { useChatStore } from '../stores/chatStore'
import { useMessageStore } from '../stores/messageStore'
import { useTypewriterQueue } from '../hooks/useTypewriterQueue'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'
import ModelSelector from './ModelSelector'

function ChatArea() {
  const { chatId: urlChatId } = useParams<{ chatId?: string }>()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)

  const currentChatId = useChatStore(
    (state) => state.currentChatId
  )

  const setCurrentChatId = useChatStore(
    (state) => state.setCurrentChatId
  )

  const selectedModelId = useAIStore(
    (state) => state.selectedModelId
  )

  const messages = useMessageStore(
    (state) => state.messages
  )

  const streamingMessageId = useMessageStore(
    (state) => state.streamingMessageId
  )

  const updateMessage = useMessageStore(
    (state) => state.updateMessage
  )

  const setStreamingMessageId = useMessageStore(
    (state) => state.setStreamingMessageId
  )

  const setAbortCurrentStream = useMessageStore(
    (state) => state.setAbortCurrentStream
  )

  const setCachedMessages = useMessageStore(
    (state) => state.setCachedMessages
  )

  const saveScrollPosition = useMessageStore(
    (state) => state.saveScrollPosition
  )

  const getScrollPosition = useMessageStore(
    (state) => state.getScrollPosition
  )

  const switchChat = useMessageStore(
    (state) => state.switchChat
  )

  const clearMessages = useMessageStore(
    (state) => state.clearMessages
  )

  const loadingMessages = useMessageStore(
    (state) => state.loadingMessages
  )

  const messageError = useMessageStore(
    (state) => state.messageError
  )

  const setLoadingMessages = useMessageStore(
    (state) => state.setLoadingMessages
  )

  const setMessageError = useMessageStore(
    (state) => state.setMessageError
  )

  const abortControllerRef = useRef<AbortController | null>(null)
  const isStoppingRef = useRef(false)
  const { enqueue, waitDrained, flushAll, reset: resetQueue } = useTypewriterQueue()

  // Client-Side Routing: Đồng bộ giữa URL param và currentChatId khi mở link hoặc dùng Back/Forward
  useEffect(() => {
    if (urlChatId && urlChatId !== currentChatId) {
      setCurrentChatId(urlChatId)
    }
  }, [urlChatId, currentChatId, setCurrentChatId])

  const handleRegenerate = async (
    messageId: string
  ) => {
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
          enqueue(chunk, (content) =>
            updateMessage(messageId, content)
          )
        },
        controller.signal
      )

      // Đợi typewriter drain xong mới tắt stream indicator
      await waitDrained()
    } catch (error) {
      if (isStoppingRef.current) {
        // User bấm Dừng: flushAll đã hoàn thành
      } else if (error instanceof DOMException && error.name === 'AbortError') {
        // Abort bình thường
      } else {
        resetQueue()
        console.error(
          'Không thể regenerate message:',
          error
        )
      }
    } finally {
      isStoppingRef.current = false
      setAbortCurrentStream(null)
      setStreamingMessageId(null)
      abortControllerRef.current = null
    }
  }

  // Lắng nghe sự kiện cuộn của người dùng để kích hoạt User Override và lưu vị trí cuộn
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const { scrollHeight, scrollTop, clientHeight } = container
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight

    // Ngưỡng 100px: nếu khoảng cách tới đáy < 100px coi như đang ở đáy
    const isAtBottom = distanceFromBottom < 100
    isAtBottomRef.current = isAtBottom
    setShowScrollToBottom(!isAtBottom)

    // Scroll Restoration: Lưu lại vị trí cuộn hiện tại của chat vào RAM
    if (currentChatId) {
      saveScrollPosition(currentChatId, scrollTop)
    }
  }, [currentChatId, saveScrollPosition])

  // Cuộn xuống đáy (có thể chọn hiệu ứng smooth hoặc auto)
  const scrollToBottom = useCallback((smooth = true) => {
    isAtBottomRef.current = true
    setShowScrollToBottom(false)
    const container = scrollContainerRef.current
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      })
    }
  }, [])

  // Client-Side Caching & Scroll Restoration khi chuyển đổi cuộc trò chuyện
  useEffect(() => {
    if (!currentChatId) {
      clearMessages()
      setMessageError(null)
      setLoadingMessages(false)
      return
    }

    let isCancelled = false

    // 1. Kiểm tra RAM cache: Instant Render (0ms latency)
    const isCached = switchChat(currentChatId)

    if (isCached) {
      // Dữ liệu đã có sẵn trong RAM! Khôi phục ngay vị trí cuộn (Scroll Restoration)
      requestAnimationFrame(() => {
        if (isCancelled) return
        const container = scrollContainerRef.current
        if (!container) return
        const savedScroll = getScrollPosition(currentChatId)
        if (savedScroll !== undefined) {
          container.scrollTop = savedScroll
          const atBottom =
            container.scrollHeight - savedScroll - container.clientHeight < 100
          isAtBottomRef.current = atBottom
          setShowScrollToBottom(!atBottom)
        } else {
          container.scrollTop = container.scrollHeight
          isAtBottomRef.current = true
          setShowScrollToBottom(false)
        }
      })
      return
    }

    // 2. Cache miss: hiển thị Skeleton Loading và tải từ server
    const fetchChatMessages = async () => {
      try {
        setLoadingMessages(true)
        setMessageError(null)

        const fetchedMessages = await getMessages(currentChatId)
        if (isCancelled) return
        setCachedMessages(currentChatId, fetchedMessages)

        // Khôi phục vị trí cuộn
        requestAnimationFrame(() => {
          if (isCancelled) return
          const container = scrollContainerRef.current
          if (!container) return
          const savedScroll = getScrollPosition(currentChatId)
          if (savedScroll !== undefined) {
            container.scrollTop = savedScroll
            const atBottom =
              container.scrollHeight - savedScroll - container.clientHeight < 100
            isAtBottomRef.current = atBottom
            setShowScrollToBottom(!atBottom)
          } else {
            container.scrollTop = container.scrollHeight
            isAtBottomRef.current = true
            setShowScrollToBottom(false)
          }
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
    getScrollPosition,
    clearMessages,
    setLoadingMessages,
    setMessageError
  ])

  // Smart Auto-Scroll: Tự động bám đáy khi đang ở đáy, nhường quyền (User Override) khi người dùng lướt lên
  useEffect(() => {
    const lastMsg = messages[messages.length - 1]

    // Khi người dùng vừa gửi tin nhắn mới ('user') -> luôn cuộn xuống đáy
    if (lastMsg && lastMsg.role === 'user') {
      isAtBottomRef.current = true
      setShowScrollToBottom(false)
      scrollToBottom(true)
      return
    }

    // Nếu người dùng đã cuộn lên trên để đọc tin cũ -> Hủy bám đáy (Detach Auto-Scroll)
    if (!isAtBottomRef.current) {
      return
    }

    const container = scrollContainerRef.current
    if (!container) return

    // Non-blocking UI: nếu đang streaming token từ AI, dùng requestAnimationFrame đặt trực tiếp scrollTop
    // để không khóa Main Thread, không giật màn hình và không xung đột thao tác vuốt của người dùng
    if (streamingMessageId) {
      requestAnimationFrame(() => {
        if (isAtBottomRef.current && scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop =
            scrollContainerRef.current.scrollHeight
        }
      })
    } else {
      // Khi không stream (tin nhắn đã hoàn thành hoặc tin nhắn load ban đầu), cuộn mượt
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [messages, streamingMessageId, scrollToBottom])

  return (
    <main className="relative flex min-w-0 flex-1 flex-col bg-gray-900">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-700 px-6">
        <div>
          <h1 className="text-sm font-semibold">
            AI Chat
          </h1>

          <p className="text-xs text-gray-500">
            {currentChatId
              ? `Chat ID: ${currentChatId}`
              : 'Chưa chọn chat'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ModelSelector />

          <button
            type="button"
            className="rounded-lg px-3 py-2 text-xl text-gray-400 transition hover:bg-gray-800 hover:text-white"
            title="Tùy chọn"
          >
            ⋮
          </button>
        </div>
      </header>

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-6 sm:px-6"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          {loadingMessages ? (
            /* Skeleton Loading với hiệu ứng Shimmer quét sáng sang trọng */
            <div className="flex flex-col gap-6 py-4">
              {/* User message skeleton (phía phải) */}
              <div className="flex justify-end">
                <div className="w-[60%] sm:w-[45%] rounded-2xl rounded-br-md bg-gray-800/90 p-4 space-y-2.5 border border-gray-700/50 shadow-md">
                  <div className="h-3 w-1/4 rounded skeleton-shimmer" />
                  <div className="h-3.5 w-full rounded skeleton-shimmer" />
                  <div className="h-3.5 w-3/4 rounded skeleton-shimmer" />
                </div>
              </div>

              {/* AI message skeleton (phía trái) */}
              <div className="flex justify-start">
                <div className="w-[85%] sm:w-[70%] rounded-2xl rounded-bl-md bg-gray-800/90 p-4 space-y-3 border border-gray-700/50 shadow-md">
                  <div className="h-3 w-1/5 rounded skeleton-shimmer" />
                  <div className="h-3.5 w-full rounded skeleton-shimmer" />
                  <div className="h-3.5 w-11/12 rounded skeleton-shimmer" />
                  <div className="h-3.5 w-4/5 rounded skeleton-shimmer" />
                  <div className="h-3.5 w-2/3 rounded skeleton-shimmer" />
                </div>
              </div>

              {/* User message skeleton 2 (phía phải) */}
              <div className="flex justify-end">
                <div className="w-[50%] sm:w-[35%] rounded-2xl rounded-br-md bg-gray-800/90 p-4 space-y-2.5 border border-gray-700/50 shadow-md">
                  <div className="h-3 w-1/3 rounded skeleton-shimmer" />
                  <div className="h-3.5 w-full rounded skeleton-shimmer" />
                </div>
              </div>

              {/* AI message skeleton 2 (phía trái) */}
              <div className="flex justify-start">
                <div className="w-[80%] sm:w-[65%] rounded-2xl rounded-bl-md bg-gray-800/90 p-4 space-y-3 border border-gray-700/50 shadow-md">
                  <div className="h-3 w-1/6 rounded skeleton-shimmer" />
                  <div className="h-3.5 w-full rounded skeleton-shimmer" />
                  <div className="h-3.5 w-5/6 rounded skeleton-shimmer" />
                  <div className="h-3.5 w-1/2 rounded skeleton-shimmer" />
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
            <div className="flex min-h-[300px] items-center justify-center">
              <p className="text-sm text-gray-500">
                Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện!
              </p>
            </div>
          ) : (
            /* Content Fade-in / Cross-fade: hiệu ứng chuyển cảnh mượt mà khi đổi tab chat */
            <div
              key={currentChatId ?? 'empty'}
              className="chat-cross-fade flex flex-col gap-5"
            >
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

      {/* Smart Scroll: Nút cuộn xuống dưới khi người dùng lướt lên xem tin cũ */}
      {showScrollToBottom && (
        <div className="pointer-events-none absolute bottom-24 left-0 right-0 z-20 flex justify-center">
          <button
            type="button"
            onClick={() => scrollToBottom(true)}
            className="pointer-events-auto scroll-to-bottom-btn flex items-center gap-2 rounded-full border border-gray-700 bg-gray-800/95 px-4 py-2 text-xs font-medium text-gray-200 shadow-2xl backdrop-blur-md transition-all hover:border-gray-500 hover:bg-gray-700 hover:text-white hover:shadow-blue-500/10 active:scale-95"
            title="Cuộn xuống tin nhắn mới nhất"
          >
            <span className="text-sm font-bold">↓</span>
            <span>Cuộn xuống tin nhắn mới nhất</span>
            {streamingMessageId && (
              <span className="relative ml-0.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
              </span>
            )}
          </button>
        </div>
      )}

      <ChatInput />
    </main>
  )
}

export default ChatArea