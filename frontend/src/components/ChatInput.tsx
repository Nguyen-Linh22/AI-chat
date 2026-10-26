import { useRef, useState, useEffect } from 'react'
import { useChatStore } from '../stores/chatStore'
import { useAIStore } from '../stores/aiStore'
import { useMessageStore } from '../stores/messageStore'
import { streamMessage } from '../services/streamService'
import { createChat } from '../services/chatService'
import { useTypewriterQueue } from '../hooks/useTypewriterQueue'
import { ExpandedEditorModal } from './chat/ExpandedEditorModal'

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MiB (10,485,760 bytes)
const ALLOWED_EXTENSIONS = ['.pdf', '.txt'] as const

interface FileValidationResult {
  isValid: boolean
  error?: string
}

const validateFile = (file: File): FileValidationResult => {
  if (file.size === 0) {
    return {
      isValid: false,
      error: 'File không được để rỗng.'
    }
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: 'File không được vượt quá 10 MB.'
    }
  }

  const lastDot = file.name.lastIndexOf('.')
  const ext = lastDot !== -1 ? file.name.slice(lastDot).toLowerCase() : ''

  if (!ALLOWED_EXTENSIONS.includes(ext as (typeof ALLOWED_EXTENSIONS)[number])) {
    return {
      isValid: false,
      error: 'Chỉ hỗ trợ file tài liệu định dạng PDF hoặc TXT.'
    }
  }

  // Nếu trình duyệt cung cấp MIME type (không rỗng), kiểm tra tính tương thích với extension
  if (file.type) {
    const normalizedType = file.type.toLowerCase()
    if (ext === '.pdf' && normalizedType !== 'application/pdf') {
      return {
        isValid: false,
        error: 'Định dạng MIME không khớp với file PDF.'
      }
    }
    if (ext === '.txt' && normalizedType !== 'text/plain') {
      return {
        isValid: false,
        error: 'Định dạng MIME không khớp với file TXT.'
      }
    }
  }

  return { isValid: true }
}

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
  const removeMessage = useMessageStore((state) => state.removeMessage)

  const [content, setContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isCooldown, setIsCooldown] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const isActive = isSending || isTyping || Boolean(streamingMessageId)

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const attachmentButtonRef = useRef<HTMLButtonElement | null>(null)
  const attachmentPopoverRef = useRef<HTMLDivElement | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const currentRunIdRef = useRef<string | null>(null)
  const dragCounterRef = useRef<number>(0)
  // true khi user chủ động bấm Dừng (phân biệt với lỗi thật sự)
  const isStoppingRef = useRef(false)
  const { enqueue, waitDrained, flushAll, reset: resetQueue } = useTypewriterQueue()

  const MAX_HEIGHT = 200

  const isMountedRef = useRef(true)

  // Patch 2.3: Unmount hardening - hủy stream đang hoạt động và giải phóng typewriter queue
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      currentRunIdRef.current = null
      dragCounterRef.current = 0
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
      resetQueue()
    }
  }, [resetQueue])

  // M6.2: Ngăn trình duyệt mở file sang tab mới khi thả file ra ngoài composer
  useEffect(() => {
    const handleWindowDragOver = (event: DragEvent) => {
      if (event.dataTransfer?.types && Array.from(event.dataTransfer.types).includes('Files')) {
        event.preventDefault()
      }
    }

    const handleWindowDrop = (event: DragEvent) => {
      if (event.dataTransfer?.types && Array.from(event.dataTransfer.types).includes('Files')) {
        event.preventDefault()
      }
    }

    window.addEventListener('dragover', handleWindowDragOver)
    window.addEventListener('drop', handleWindowDrop)

    return () => {
      window.removeEventListener('dragover', handleWindowDragOver)
      window.removeEventListener('drop', handleWindowDrop)
    }
  }, [])

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

  // Lắng nghe sự kiện click suggested prompt từ EmptyState để đưa nội dung vào composer an toàn
  useEffect(() => {
    const handlePromptSelect = (event: Event) => {
      if (isActive) {
        return
      }

      const customEvent = event as CustomEvent<string>
      if (typeof customEvent.detail === 'string') {
        const promptText = customEvent.detail
        if (content.trim()) {
          setSendError('Vui lòng xóa nội dung đang soạn thảo trước khi chọn gợi ý.')
          return
        }

        setContent(promptText)
        setSendError(null)
        textareaRef.current?.focus()
      }
    }

    window.addEventListener('ai-chat-prompt-select', handlePromptSelect)
    return () => {
      window.removeEventListener('ai-chat-prompt-select', handlePromptSelect)
    }
  }, [content, isActive])

  // M6.2.1: Attachment Popover click-outside and Escape handling
  useEffect(() => {
    if (!isAttachmentOpen) return

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (
        attachmentPopoverRef.current &&
        !attachmentPopoverRef.current.contains(target) &&
        attachmentButtonRef.current &&
        !attachmentButtonRef.current.contains(target)
      ) {
        setIsAttachmentOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        setIsAttachmentOpen(false)
        attachmentButtonRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isAttachmentOpen])

  const handleSelectFile = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const validation = validateFile(file)
    if (!validation.isValid) {
      setSendError(validation.error || 'File không hợp lệ.')
      event.target.value = ''
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
    const streamRunId = crypto.randomUUID()
    currentRunIdRef.current = streamRunId
    let assistantMessageId: string | null = null
    let receivedChunk = false

    try {
      setIsSending(true)
      setIsTyping(false)
      setSendError(null)

      // Nếu chưa có chat session (màn hình chào mừng hoặc URL /chat), tự động tạo chat mới
      if (!activeChatId) {
        try {
          const newChat = await createChat()
          // AUDIT-01: Nếu component đã unmount trong lúc createChat đang pending, dừng ngay luồng gửi
          if (!isMountedRef.current) {
            return
          }
          addChat?.(newChat)
          setCurrentChatId?.(newChat.id)
          activeChatId = newChat.id
          if (typeof window !== 'undefined' && window.history) {
            window.history.pushState({}, '', `/c/${newChat.id}`)
          }
        } catch (chatError) {
          if (!isMountedRef.current) {
            return
          }
          console.error('Không thể tạo đoạn chat mới:', chatError)
          setSendError('Không thể tạo đoạn chat mới. Vui lòng thử lại.')
          setIsSending(false)
          return
        }
      }

      // AUDIT-01: Guard trước khi tạo message và khởi động stream
      if (!isMountedRef.current) {
        return
      }

      const userMessageId = crypto.randomUUID()
      const assistantMsgId = crypto.randomUUID()
      assistantMessageId = assistantMsgId

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
        id: assistantMsgId,
        chatSessionId: activeChatId,
        createdAt: new Date().toISOString(),
        role: 'assistant',
        content: '',
        attachments: [],
      })

      setStreamingMessageId(assistantMsgId)
      setIsExpanded(false)

      const result = await streamMessage(
        activeChatId,
        trimmedContent,
        modelToUse,
        (chunk) => {
          if (!isMountedRef.current || currentRunIdRef.current !== streamRunId) {
            return
          }
          receivedChunk = true
          enqueue(chunk, (content) => {
            if (!isMountedRef.current || currentRunIdRef.current !== streamRunId) {
              return
            }
            updateMessage(assistantMsgId, content)
          })
        },
        controller.signal,
        selectedFile
      )

      // Đợi typewriter drain xong rồi mới replace bằng message từ server
      setIsTyping(true)
      setIsSending(false)
      await waitDrained()

      // Patch 2.3: Guard sau waitDrained() để ngăn lượt cũ reconcile message nếu run ID đã đổi, bị hủy, unmount hoặc chat đã chuyển
      const isCurrentChatStillActive = typeof useChatStore.getState === 'function'
        ? useChatStore.getState().currentChatId === activeChatId
        : true

      if (
        !isMountedRef.current ||
        currentRunIdRef.current !== streamRunId ||
        controller.signal.aborted ||
        !isCurrentChatStillActive
      ) {
        return
      }

      setIsTyping(false)

      replaceMessage(
        userMessageId,
        result.userMessage
      )

      replaceMessage(
        assistantMsgId,
        result.assistantMessage
      )

      setSelectedFile(null)
      setContent('')
      setIsCooldown(true)

      setTimeout(() => {
        if (isMountedRef.current) {
          setIsCooldown(false)
        }
      }, 1500)
    } catch (error) {
      if (isStoppingRef.current) {
        // User bấm Dừng: flushAll() đã được gọi, không cần reset
      } else if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('STREAM: người dùng đã dừng generation')
      } else {
        resetQueue()
        console.error('Không thể streaming message:', error)
        if (isMountedRef.current && currentRunIdRef.current === streamRunId) {
          setSendError('Không thể gửi tin nhắn. Vui lòng thử lại.')
        }
      }

      // Fix1-D: Dọn placeholder rỗng nếu request stream thất bại hoặc bị abort trước khi có chunk đầu tiên
      if (!receivedChunk && assistantMessageId) {
        removeMessage(assistantMessageId)
      }
    } finally {
      // Fix1-C & Patch 2.3: Chỉ dọn dẹp nếu stream hiện tại vẫn là streamRunId này
      if (currentRunIdRef.current === streamRunId) {
        isStoppingRef.current = false
        if (isMountedRef.current) {
          setIsSending(false)
          setIsTyping(false)
        }
        const activeStreamingId = typeof useMessageStore.getState === 'function'
          ? useMessageStore.getState().streamingMessageId
          : null
        if (!activeStreamingId || activeStreamingId === assistantMessageId) {
          setStreamingMessageId(null)
          setAbortCurrentStream(null)
        }
        abortControllerRef.current = null
      }
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const isDisabled = isActive || isCooldown || !effectiveModelId

  // M6.2: Drag-and-Drop File Helpers & Handlers
  const isFileDrag = (event: React.DragEvent): boolean => {
    const types = event.dataTransfer?.types
    return Boolean(types && Array.from(types).includes('Files'))
  }

  const handleDragEnter = (event: React.DragEvent) => {
    if (!isFileDrag(event) || isActive || isDisabled) {
      return
    }
    event.preventDefault()
    dragCounterRef.current += 1
    if (dragCounterRef.current === 1) {
      setIsDragging(true)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    if (!isFileDrag(event) || isActive || isDisabled) {
      return
    }
    event.preventDefault()
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy'
    }
  }

  const handleDragLeave = (event: React.DragEvent) => {
    if (!isFileDrag(event)) {
      return
    }
    event.preventDefault()
    dragCounterRef.current -= 1
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0
      setIsDragging(false)
    }
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    dragCounterRef.current = 0
    setIsDragging(false)

    if (isActive || isDisabled) {
      return
    }

    const files = event.dataTransfer?.files
    if (!files || files.length === 0) {
      return
    }

    if (files.length > 1) {
      setSendError('Chỉ hỗ trợ đính kèm 1 file mỗi lần. Vui lòng chọn 1 file duy nhất.')
      return
    }

    const file = files[0]
    const validation = validateFile(file)
    if (!validation.isValid) {
      setSendError(validation.error || 'File không hợp lệ.')
      return
    }

    setSendError(null)
    setSelectedFile(file)
  }

  return (
    <div className="relative shrink-0 px-3 sm:px-6 pb-3 pt-1">
      <div className="relative mx-auto w-full max-w-4xl">
        {sendError && (
          <p className="mb-2 rounded-xl border border-[#B91E2B]/30 bg-[#B91E2B]/10 px-3 py-1.5 text-xs sm:text-sm text-[#B91E2B]">
            {sendError}
          </p>
        )}
        {isAttachmentOpen && (
          <div
            ref={attachmentPopoverRef}
            id="attachment-popover"
            role="dialog"
            aria-label="Đính kèm tệp"
            className="absolute bottom-full left-2 mb-3 z-30 flex flex-col gap-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#18202d]/95 p-3 shadow-xl dark:shadow-2xl backdrop-blur-2xl animate-dropdown-fade"
          >
            <span className="text-[11px] text-slate-500 dark:text-gray-400 font-medium">Đính kèm (PDF, TXT)</span>
            <div className="flex items-center gap-2">
              {/* File - Document (PDF, TXT) */}
              <button
                type="button"
                onClick={() => {
                  setIsAttachmentOpen(false)
                  fileInputRef.current?.click()
                }}
                className="flex h-11 w-11 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition shadow-2xs cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500/50"
                title="Tài liệu (PDF, TXT)"
                aria-label="Tài liệu (PDF, TXT)"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>

              {/* Code */}
              <button
                type="button"
                onClick={() => {
                  setIsAttachmentOpen(false)
                  setContent((prev) => (prev ? `${prev}\n\`\`\`\n\n\`\`\`` : '```\n\n```'))
                }}
                className="flex h-11 w-11 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-500/25 transition shadow-2xs font-mono text-xs font-bold cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500/50"
                title="Mã nguồn"
                aria-label="Mã nguồn"
              >
                &lt;/&gt;
              </button>
            </div>
          </div>
        )}

        {/* Floating Capsule Composer with Drag-and-Drop */}
        <div className="relative group">
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            data-testid="composer-drop-zone"
            className={`relative flex flex-col rounded-2xl border ${
              isDragging
                ? 'border-dashed border-[#1B8F3D] dark:border-emerald-500 ring-2 ring-[#1B8F3D]/25'
                : 'border-slate-200/90 dark:border-white/10'
            } bg-white/95 dark:bg-[#131924]/90 p-1.5 sm:p-2 shadow-lg dark:shadow-xl backdrop-blur-xl transition-all duration-200 focus-within:border-[#1B8F3D]/50 focus-within:ring-2 focus-within:ring-[#1B8F3D]/20`}
          >
            {/* Drag-and-Drop Dropzone Overlay */}
            {isDragging && (
              <div
                data-testid="drop-zone-overlay"
                className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#1B8F3D] dark:border-emerald-500 bg-white/95 dark:bg-[#131924]/95 backdrop-blur-md pointer-events-none p-3 select-none"
              >
                <div className="flex items-center gap-2 text-[#1B8F3D] dark:text-emerald-400 font-semibold text-xs sm:text-sm">
                  <svg
                    className="h-5 w-5 animate-bounce"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <span>Thả file PDF hoặc TXT vào đây</span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5">
                  Tối đa 10 MB • 1 file duy nhất
                </span>
              </div>
            )}
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
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
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
                      className="ml-1 -my-1 flex h-7 w-7 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer text-xs disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-[#B91E2B]/50 focus-visible:outline-none"
                      title={`Xóa file ${selectedFile.name}`}
                      aria-label={`Xóa file ${selectedFile.name}`}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Input & Action buttons row */}
            <div className="flex items-end gap-1.5 sm:gap-2">
              {/* Attachment Button */}
              <button
                ref={attachmentButtonRef}
                type="button"
                onClick={() => setIsAttachmentOpen((prev) => !prev)}
                disabled={isActive}
                aria-expanded={isAttachmentOpen}
                aria-haspopup="dialog"
                aria-controls="attachment-popover"
                className="flex h-9 w-9 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-[#1B8F3D]/15 dark:bg-[#1B8F3D]/25 text-[#1B8F3D] dark:text-emerald-400 font-bold text-base shadow-2xs transition hover:bg-[#1B8F3D] hover:text-white active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 mb-0.5 focus-visible:ring-2 focus-visible:ring-[#1B8F3D]/50 focus-visible:outline-none"
                title="Đính kèm file"
                aria-label="Đính kèm file"
              >
                <svg className="h-4 w-4 sm:h-3.5 sm:w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,application/pdf,text/plain"
                onChange={handleSelectFile}
                className="hidden"
              />

              {/* M6.1: Integrated Model Indicator in Control Island */}
              {selectedModel?.name && (
                <div
                  data-testid="model-indicator"
                  className="flex items-center gap-1 rounded-md border border-slate-200/80 dark:border-white/10 bg-slate-100/80 dark:bg-white/[0.05] px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-gray-300 max-w-[95px] sm:max-w-[160px] select-none shrink-0 mb-0.5"
                  title={`Mô hình AI: ${selectedModel.name}`}
                >
                  <svg
                    className="h-3 w-3 shrink-0 text-[#1B8F3D] dark:text-emerald-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                    />
                  </svg>
                  <span className="truncate">{selectedModel.name}</span>
                </div>
              )}

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
                className="flex h-9 w-9 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10 transition-all duration-150 active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 mb-0.5 focus-visible:ring-2 focus-visible:ring-[#1B8F3D]/50 focus-visible:outline-none"
              >
                <svg
                  className="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
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
                className={`flex h-9 w-9 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full text-white transition-all duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.95] mb-0.5 focus-visible:ring-2 focus-visible:outline-none ${isActive
                    ? 'bg-[#B91E2B] hover:bg-[#9E1924] shadow-md shadow-[#B91E2B]/30 focus-visible:ring-[#B91E2B]/50'
                    : 'bg-[#1B8F3D] hover:bg-[#167632] hover:scale-105 shadow-md shadow-[#1B8F3D]/30 focus-visible:ring-[#1B8F3D]/50'
                  }`}
              >
                <span className="sr-only">{isActive ? 'Dừng' : 'Gửi'}</span>
                {isActive ? (
                  <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4 sm:h-3.5 sm:w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>


        {/* Expanded Editor Modal */}
        <ExpandedEditorModal
          isOpen={isExpanded}
          content={content}
          selectedFile={selectedFile}
          onChange={(val) => {
            setContent(val)
            setSendError(null)
          }}
          onClose={(newDraft) => {
            setIsExpanded(false)
            if (typeof newDraft === 'string') {
              setContent(newDraft)
            }
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