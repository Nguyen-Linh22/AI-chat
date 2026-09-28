import { useRef, useState, useEffect } from 'react'
import { useChatStore } from '../stores/chatStore'
import { useAIStore } from '../stores/aiStore'
import { useMessageStore } from '../stores/messageStore'
import { streamMessage } from '../services/streamService'
import { createChat } from '../services/chatService'
import { useTypewriterQueue } from '../hooks/useTypewriterQueue'
import { ExpandedEditorModal } from './chat/ExpandedEditorModal'

function ChatInput() {
  const currentChatId = useChatStore((state) => state.currentChatId)
  const addChat = useChatStore((state) => state.addChat)
  const setCurrentChatId = useChatStore((state) => state.setCurrentChatId)
  const models = useAIStore((state) => state.models)
  const selectedModelId = useAIStore((state) => state.selectedModelId)
  const effectiveModelId = selectedModelId || (models && models.length > 0 ? models[0].id : null)
  const selectedModel = models?.find((m) => m.id === (selectedModelId || effectiveModelId)) || models?.[0]

  const addMessage = useMessageStore((state) => state.addMessage)
  const updateMessage = useMessageStore((state) => state.updateMessage)
  const streamingMessageId = useMessageStore((state) => state.streamingMessageId)
  const setStreamingMessageId = useMessageStore((state) => state.setStreamingMessageId)
  const abortCurrentStream = useMessageStore((state) => state.abortCurrentStream)
  const setAbortCurrentStream = useMessageStore((state) => state.setAbortCurrentStream)
  const replaceMessage = useMessageStore((state) => state.replaceMessage)

  const [content, setContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isCooldown, setIsCooldown] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  // true khi user chủ động bấm Dừng (phân biệt với lỗi thật sự)
  const isStoppingRef = useRef(false)
  const { enqueue, waitDrained, flushAll, reset: resetQueue } = useTypewriterQueue()

  const MAX_HEIGHT = 200

  // Auto-resize textarea theo nội dung
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = 'auto'
    const newHeight = textarea.scrollHeight

    if (newHeight > MAX_HEIGHT) {
      textarea.style.height = `${MAX_HEIGHT}px`
      textarea.style.overflowY = 'auto'
    } else {
      textarea.style.height = `${newHeight}px`
      textarea.style.overflowY = 'hidden'
    }
  }, [content])

  // Lắng nghe sự kiện click suggested prompt từ EmptyState để đưa nội dung vào composer
  useEffect(() => {
    const handlePromptSelect = (event: Event) => {
      const customEvent = event as CustomEvent<string>
      if (typeof customEvent.detail === 'string') {
        setContent(customEvent.detail)
        setSendError(null)
      }
    }

    window.addEventListener('ai-chat-prompt-select', handlePromptSelect)
    return () => {
      window.removeEventListener('ai-chat-prompt-select', handlePromptSelect)
    }
  }, [])

  const handleSelectFile = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setSendError(null)
    setSelectedFile(file)

    event.target.value = ''
  }

  const handleStop = () => {
    isStoppingRef.current = true
    // Hủy request backend (nếu còn chạy)
    abortControllerRef.current?.abort()
    // Flush ngay toàn bộ ký tự đang chờ trong queue
    flushAll()
  }

  const handleStopAction = () => {
    if (abortCurrentStream) {
      abortCurrentStream()
    } else {
      handleStop()
    }
  }

  const handleSendMessage = async () => {
    const trimmedContent = content.trim()
    const modelToUse = selectedModelId || effectiveModelId

    if (!trimmedContent || !modelToUse || isSending || isTyping || Boolean(streamingMessageId) || isCooldown) {
      return
    }

    let activeChatId = currentChatId

    try {
      setIsSending(true)
      setIsTyping(false)
      setSendError(null)

      // Nếu chưa có chat session (màn hình chào mừng hoặc URL /chat), tự động tạo chat mới
      if (!activeChatId) {
        try {
          const newChat = await createChat()
          addChat?.(newChat)
          setCurrentChatId?.(newChat.id)
          activeChatId = newChat.id
          if (typeof window !== 'undefined' && window.history) {
            window.history.pushState({}, '', `/c/${newChat.id}`)
          }
        } catch (chatError) {
          console.error('Không thể tạo đoạn chat mới:', chatError)
          setSendError('Không thể tạo đoạn chat mới. Vui lòng thử lại.')
          setIsSending(false)
          return
        }
      }

      const userMessageId = crypto.randomUUID()
      const assistantMessageId = crypto.randomUUID()

      const controller = new AbortController()
      abortControllerRef.current = controller
      setAbortCurrentStream(handleStop)

      // Thêm user message vào UI
      addMessage({
        id: userMessageId,
        chatSessionId: activeChatId,
        createdAt: new Date().toISOString(),
        role: 'user',
        content: trimmedContent,
        attachments: [],
      })

      // Tạo assistant message rỗng
      addMessage({
        id: assistantMessageId,
        chatSessionId: activeChatId,
        createdAt: new Date().toISOString(),
        role: 'assistant',
        content: '',
        attachments: [],
      })

      setStreamingMessageId(assistantMessageId)
      setIsExpanded(false)

      const result = await streamMessage(
        activeChatId,
        trimmedContent,
        modelToUse,
        (chunk) => {
          enqueue(chunk, (content) =>
            updateMessage(assistantMessageId, content)
          )
        },
        controller.signal,
        selectedFile
      )

      // Đợi typewriter drain xong rồi mới replace bằng message từ server
      setIsTyping(true)
      setIsSending(false)
      await waitDrained()
      setIsTyping(false)

      replaceMessage(
        userMessageId,
        result.userMessage
      )

      replaceMessage(
        assistantMessageId,
        result.assistantMessage
      )

      setSelectedFile(null)
      setContent('')
      setIsCooldown(true)

      setTimeout(() => {
        setIsCooldown(false)
      }, 1500)
    } catch (error) {
      if (isStoppingRef.current) {
        // User bấm Dừng: flushAll() đã được gọi, không cần reset
      } else if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('STREAM: người dùng đã dừng generation')
      } else {
        resetQueue()
        console.error('Không thể streaming message:', error)
        setSendError('Không thể gửi tin nhắn. Vui lòng thử lại.')
      }
    } finally {
      isStoppingRef.current = false
      setIsSending(false)
      setIsTyping(false)
      setStreamingMessageId(null)
      setAbortCurrentStream(null)
      abortControllerRef.current = null
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const isActive = isSending || isTyping || Boolean(streamingMessageId)
  const isDisabled = isActive || isCooldown || !effectiveModelId

  return (
    <div className="relative shrink-0 px-3 sm:px-6 pb-3 pt-1">
      <div className="relative mx-auto w-full max-w-4xl">
        {sendError && (
          <p className="mb-2 rounded-xl border border-[#B91E2B]/30 bg-[#B91E2B]/10 px-3 py-1.5 text-xs sm:text-sm text-[#B91E2B]">
            {sendError}
          </p>
        )}

        {/* Floating Attachment Menu ("Đính kèm tệp") */}
        {isAttachmentOpen && (
          <div className="absolute bottom-full left-2 mb-3 z-30 flex flex-col gap-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#18202d]/95 p-3 shadow-xl dark:shadow-2xl backdrop-blur-2xl animate-dropdown-fade">
            <span className="text-[11px] text-slate-500 dark:text-gray-400 font-medium">Đính kèm tệp</span>
            <div className="flex items-center gap-2">
              {/* File - Yellow */}
              <button
                type="button"
                onClick={() => {
                  setIsAttachmentOpen(false)
                  fileInputRef.current?.click()
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/35 hover:bg-amber-500/30 transition shadow-sm text-sm cursor-pointer"
                title="Tệp"
              >
                📄
              </button>

              {/* Image - Purple */}
              <button
                type="button"
                onClick={() => {
                  setIsAttachmentOpen(false)
                  fileInputRef.current?.click()
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/35 hover:bg-purple-500/30 transition shadow-sm text-sm cursor-pointer"
                title="Hình ảnh"
              >
                🖼
              </button>

              {/* Code - Blue */}
              <button
                type="button"
                onClick={() => {
                  setIsAttachmentOpen(false)
                  setContent((prev) => (prev ? `${prev}\n\`\`\`\n\n\`\`\`` : '```\n\n```'))
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/35 hover:bg-blue-500/30 transition shadow-sm font-mono text-xs font-bold cursor-pointer"
                title="Mã nguồn"
              >
                &lt;/&gt;
              </button>
            </div>
          </div>
        )}

        {/* Floating Capsule Composer with Dual Glow Border */}
        <div className="relative group">
          {/* Subtle Dual-Tone Ambient Glow around Composer Border */}
          <div
            className="pointer-events-none absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-[#B91E2B]/50 via-gray-700/30 to-[#1B8F3D]/50 opacity-70 blur-[1px] transition duration-200 group-focus-within:opacity-100"
            aria-hidden="true"
          />

          <div className="relative flex flex-col rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-[#131924]/90 p-1.5 sm:p-2 shadow-xl dark:shadow-2xl backdrop-blur-xl transition-all">
            {/* Attachment Area inside Composer */}
            {selectedFile && (
              <div className="flex flex-wrap items-center gap-2 px-1 pt-0.5 pb-1.5 max-h-28 overflow-y-auto scrollbar-thin">
                <div
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 dark:border-white/10 bg-slate-100/90 dark:bg-white/[0.06] px-2.5 py-1 text-xs text-slate-700 dark:text-gray-200 shadow-2xs max-w-full transition-all"
                  title={selectedFile.name}
                >
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[11px] select-none"
                    aria-hidden="true"
                  >
                    📄
                  </span>

                  <span className="truncate max-w-[180px] sm:max-w-xs md:max-w-sm font-medium">
                    {selectedFile.name}
                  </span>

                  <span className="text-[10px] text-slate-400 dark:text-gray-400 shrink-0 select-none">
                    {formatFileSize(selectedFile.size)}
                  </span>

                  {isActive ? (
                    <span className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium shrink-0 ml-0.5 select-none">
                      <svg
                        className="animate-spin h-3 w-3"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>Đang gửi...</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      disabled={isActive}
                      className="ml-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10 transition cursor-pointer text-xs disabled:cursor-not-allowed disabled:opacity-40"
                      title={`Xóa file ${selectedFile.name}`}
                      aria-label={`Xóa file ${selectedFile.name}`}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Input & Action buttons row */}
            <div className="flex items-end gap-1.5 sm:gap-2">
              {/* Attachment Button */}
              <button
                type="button"
                onClick={() => setIsAttachmentOpen((prev) => !prev)}
                disabled={isActive}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#B91E2B]/80 text-white font-bold text-base shadow-sm transition hover:bg-[#B91E2B] active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 mb-0.5"
                title="Đính kèm file"
                aria-label="Đính kèm file"
              >
                +
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,application/pdf,text/plain"
                onChange={handleSelectFile}
                className="hidden"
              />

              {/* Message Input: Auto-expanding Textarea */}
              <textarea
                ref={textareaRef}
                rows={1}
                value={content}
                onChange={(event) => {
                  setContent(event.target.value)
                  setSendError(null)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    if (event.shiftKey) {
                      // Shift + Enter -> Allow newline
                      return
                    }
                    // Enter -> Submit message
                    event.preventDefault()
                    if (!isActive && !isDisabled && content.trim()) {
                      handleSendMessage()
                    }
                  }
                }}
                disabled={isActive}
                placeholder="Nhập tin nhắn..."
                aria-label="Nội dung tin nhắn"
                className="min-w-0 flex-1 resize-none bg-transparent px-2.5 py-1.5 text-xs sm:text-sm text-slate-800 dark:text-gray-100 outline-none placeholder:text-slate-400 dark:placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50 scrollbar-thin font-sans leading-relaxed"
              />

              {/* Expand Button */}
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                disabled={isActive}
                aria-label="Mở rộng trình soạn thảo"
                title="Mở rộng trình soạn thảo"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10 transition-all duration-150 active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 mb-0.5"
              >
                <svg
                  className="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              </button>

              <button
                type="button"
                onClick={isActive ? handleStopAction : handleSendMessage}
                disabled={!isActive && (isDisabled || !content.trim())}
                aria-label={isActive ? 'Dừng' : 'Gửi'}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white transition-all duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.95] mb-0.5 ${isActive
                    ? 'bg-[#B91E2B] hover:bg-[#9E1924] shadow-md shadow-[#B91E2B]/30'
                    : 'bg-[#1B8F3D] hover:bg-[#167632] hover:scale-105 shadow-md shadow-[#1B8F3D]/30'
                  }`}
              >
                <span className="sr-only">{isActive ? 'Dừng' : 'Gửi'}</span>
                <span aria-hidden="true" className="text-xs font-bold">
                  {isActive ? '■' : '➤'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Model Status matching screenshot */}
        <p className="mt-2 text-center text-[11px] text-slate-500 dark:text-gray-400">
          Đang sử dụng{' '}
          <span className="font-semibold text-slate-700 dark:text-gray-200">
            {selectedModel?.name ?? 'Qwen 3 1.7B'}
          </span>
        </p>

        {/* Expanded Editor Modal */}
        <ExpandedEditorModal
          isOpen={isExpanded}
          content={content}
          onChange={(val) => {
            setContent(val)
            setSendError(null)
          }}
          onClose={() => {
            setIsExpanded(false)
            textareaRef.current?.focus()
          }}
          onSend={handleSendMessage}
          onStop={handleStopAction}
          isActive={isActive}
          isDisabled={isDisabled}
          error={sendError}
          modelName={selectedModel?.name}
        />
      </div>
    </div>
  )
}

export default ChatInput