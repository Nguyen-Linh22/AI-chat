import { useEffect, useRef } from 'react'

interface DeleteChatModalProps {
  isOpen: boolean
  chatTitle: string
  isDeleting: boolean
  error: string | null
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteChatModal({
  isOpen,
  chatTitle,
  isDeleting,
  error,
  onConfirm,
  onCancel,
}: DeleteChatModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelBtnRef = useRef<HTMLButtonElement>(null)
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null)

  const isDeletingRef = useRef(isDeleting)
  const onCancelRef = useRef(onCancel)

  useEffect(() => {
    isDeletingRef.current = isDeleting
  }, [isDeleting])

  useEffect(() => {
    onCancelRef.current = onCancel
  }, [onCancel])

  useEffect(() => {
    if (!isOpen) return

    // Capture element that had focus before opening modal
    if (document.activeElement instanceof HTMLElement) {
      previouslyFocusedElementRef.current = document.activeElement
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        if (!isDeletingRef.current) {
          onCancelRef.current()
        }
        return
      }

      if (event.key === 'Tab') {
        const dialog = dialogRef.current
        if (!dialog) return

        const focusableElements = Array.from(
          dialog.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        )

        // If modal has no focusable elements, prevent keyboard focus from escaping
        if (focusableElements.length === 0) {
          event.preventDefault()
          dialog.focus?.()
          return
        }

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (event.shiftKey) {
          if (
            document.activeElement === firstElement ||
            !dialog.contains(document.activeElement)
          ) {
            event.preventDefault()
            lastElement.focus()
          }
        } else {
          if (
            document.activeElement === lastElement ||
            !dialog.contains(document.activeElement)
          ) {
            event.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    // Focus cancel button by default for safety
    const timeout = setTimeout(() => {
      cancelBtnRef.current?.focus()
    }, 50)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      clearTimeout(timeout)

      // Restore focus to opener element when modal closes or unmounts
      const prevElement = previouslyFocusedElementRef.current
      if (
        prevElement &&
        typeof prevElement.focus === 'function' &&
        document.contains(prevElement)
      ) {
        prevElement.focus()
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md animate-modal-fade"
        onClick={!isDeleting ? onCancel : undefined}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-chat-title"
        aria-describedby="delete-chat-desc"
        onClick={(e) => e.stopPropagation()}
        className={`relative z-10 w-full max-w-sm rounded-2xl border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-[#1A2230] p-5 sm:p-6 shadow-2xl backdrop-blur-2xl animate-modal-enter outline-none ${
          error ? 'animate-ui-shake' : ''
        }`}
      >
        {/* Trash Icon in circular container */}
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#B91E2B]/15 text-[#B91E2B] border border-[#B91E2B]/30 mb-4 shadow-sm">
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </div>

        {/* Modal Title */}
        <h2
          id="delete-chat-title"
          className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight"
        >
          Xóa đoạn chat này?
        </h2>

        {/* Body Text & Highlighted Chat Title */}
        <p className="mt-1 text-xs text-slate-600 dark:text-gray-300">
          Bạn sắp xóa đoạn chat:
        </p>
        <div className="my-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#131923] px-3 py-2 text-xs font-semibold text-slate-800 dark:text-[#F1F5F9] truncate shadow-2xs">
          {chatTitle}
        </div>

        {/* Permanent Warning */}
        <p
          id="delete-chat-desc"
          className="text-xs text-slate-500 dark:text-[#94A3B8] leading-relaxed"
        >
          Hành động này không thể hoàn tác. Toàn bộ lịch sử tin nhắn sẽ bị xóa vĩnh viễn.
        </p>

        {/* Error Alert if any */}
        {error && (
          <div
            role="alert"
            className="mt-3 rounded-xl border border-[#B91E2B]/30 bg-[#B91E2B]/10 px-3 py-2 text-xs font-medium text-[#B91E2B] dark:text-[#ff5c6a]"
          >
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-5 flex items-center justify-end gap-2.5">
          <button
            ref={cancelBtnRef}
            type="button"
            disabled={isDeleting}
            onClick={onCancel}
            className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-[#222C3D] px-4 py-2 text-xs font-medium text-slate-700 dark:text-[#F1F5F9] transition hover:bg-slate-200 dark:hover:bg-[#2A374C] hover:text-slate-900 dark:hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#1B8F3D]/50 focus-visible:outline-none"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="flex items-center gap-1.5 rounded-xl bg-[#B91E2B] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-[#B91E2B]/20 transition hover:bg-[#9E1924] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#B91E2B]/50 focus-visible:outline-none"
          >
            {isDeleting ? (
              <>
                <svg
                  className="h-3.5 w-3.5 animate-spin text-white"
                  viewBox="0 0 24 24"
                  fill="none"
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
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                <span>Đang xóa...</span>
              </>
            ) : (
              <span>Xóa vĩnh viễn</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteChatModal
