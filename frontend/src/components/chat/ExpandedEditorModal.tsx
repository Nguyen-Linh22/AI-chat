import { useEffect, useRef } from 'react'

interface ExpandedEditorModalProps {
  isOpen: boolean
  content: string
  onChange: (value: string) => void
  onClose: () => void
  onSend: () => void
  onStop?: () => void
  isActive?: boolean
  isDisabled?: boolean
  error?: string | null
  modelName?: string
}

export function ExpandedEditorModal({
  isOpen,
  content,
  onChange,
  onClose,
  onSend,
  onStop,
  isActive = false,
  isDisabled = false,
  error,
  modelName,
}: ExpandedEditorModalProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  // Focus textarea when modal opens and move cursor to end of text
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        const textarea = textareaRef.current
        if (textarea) {
          textarea.focus()
          textarea.selectionStart = textarea.selectionEnd = textarea.value.length
        }
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Listen for Escape key on window to close
  useEffect(() => {
    if (!isOpen) return

    const handleWindowKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleWindowKeyDown)
    return () => window.removeEventListener('keydown', handleWindowKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Calculate character, word, and line count
  const charCount = content.length
  const trimmed = content.trim()
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0
  const lineCount = content ? content.split('\n').length : 1

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl + Enter or Cmd + Enter -> Submit
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault()
      if (!isActive && !isDisabled && trimmed) {
        onSend()
      }
      return
    }

    // Tab key -> Insert 4 spaces indent
    if (event.key === 'Tab') {
      event.preventDefault()
      const target = event.currentTarget
      const start = target.selectionStart
      const end = target.selectionEnd
      const newContent = content.substring(0, start) + '    ' + content.substring(end)
      onChange(newContent)
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4
        }
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      {/* Dark translucent backdrop with blur */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md animate-modal-fade"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Expanded Editor Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Soạn tin nhắn"
        className="relative z-10 flex flex-col w-full max-w-4xl h-[80vh] sm:h-[85vh] rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-white/10 bg-white/98 dark:bg-[#131924]/95 shadow-2xl backdrop-blur-2xl animate-modal-enter overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.08] px-4 py-3 sm:px-6 sm:py-3.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900 dark:text-white tracking-wide">
              Soạn tin nhắn
            </span>
            {modelName && (
              <span className="rounded-md border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.05] px-2 py-0.5 text-[11px] text-slate-600 dark:text-gray-400">
                {modelName}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10 transition cursor-pointer"
            aria-label="Đóng trình soạn thảo"
            title="Đóng (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Error message if send fails */}
        {error && (
          <div className="mx-4 mt-3 rounded-xl border border-[#B91E2B]/30 bg-[#B91E2B]/10 px-3.5 py-2 text-xs text-[#B91E2B] sm:mx-6">
            {error}
          </div>
        )}

        {/* Textarea Area */}
        <div className="flex-1 min-h-0 p-3 sm:p-5">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập nội dung tin nhắn chi tiết, đoạn mã, hoặc tài liệu..."
            aria-label="Nội dung tin nhắn mở rộng"
            className="h-full w-full resize-none bg-transparent text-xs sm:text-sm text-slate-800 dark:text-gray-100 placeholder:text-slate-400 dark:placeholder:text-gray-500 outline-none scrollbar-thin font-sans leading-relaxed"
          />
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0e141f]/60 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5 text-[11px] text-slate-500 dark:text-gray-400">
            <span>{charCount.toLocaleString()} ký tự</span>
            <span>•</span>
            <span>{wordCount.toLocaleString()} từ</span>
            <span>•</span>
            <span>{lineCount.toLocaleString()} dòng</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-[11px] text-slate-500 dark:text-gray-400 sm:inline">
              Ctrl + Enter để gửi
            </span>

            <button
              type="button"
              onClick={isActive ? onStop : onSend}
              disabled={!isActive && (isDisabled || !trimmed)}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-md transition-all duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 active:scale-95 ${
                isActive
                  ? 'bg-[#B91E2B] hover:bg-[#9E1924] shadow-[#B91E2B]/30'
                  : 'bg-[#1B8F3D] hover:bg-[#167632] hover:scale-105 shadow-[#1B8F3D]/30'
              }`}
            >
              <span>{isActive ? '■ Dừng' : 'Gửi ➤'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExpandedEditorModal
