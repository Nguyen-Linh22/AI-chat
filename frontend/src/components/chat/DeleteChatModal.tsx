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
  const cancelBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isDeleting) {
        onCancel()
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
    }
  }, [isOpen, isDeleting, onCancel])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md animate-modal-fade"
        onClick={!isDeleting ? onCancel : undefined}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-chat-title"
        aria-describedby="delete-chat-desc"
        onClick={(e) => e.stopPropagation()}
        className={`relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-[#131924]/95 p-5 sm:p-6 shadow-2xl backdrop-blur-2xl animate-modal-enter ${
          error ? 'animate-ui-shake' : ''
        }`}
      >
        {/* Trash Icon in circular container */}
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#B91E2B]/15 text-[#B91E2B] border border-[#B91E2B]/30 mb-4 shadow-[0_0_15px_rgba(185,30,43,0.2)]">
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
          className="text-base sm:text-lg font-bold text-white tracking-wide"
        >
          Xóa đoạn chat này?
        </h2>

        {/* Body Text & Highlighted Chat Title */}
        <p className="mt-1 text-xs text-gray-300">
          Bạn sắp xóa đoạn chat:
        </p>
        <div className="my-2.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-gray-100 truncate shadow-inner">
          {chatTitle}
        </div>

        {/* Permanent Warning */}
        <p
          id="delete-chat-desc"
          className="text-xs text-gray-400 leading-relaxed"
        >
          Hành động này không thể hoàn tác. Toàn bộ lịch sử tin nhắn sẽ bị xóa vĩnh viễn.
        </p>

        {/* Error Alert if any */}
        {error && (
          <div
            role="alert"
            className="mt-3 rounded-xl border border-[#B91E2B]/40 bg-[#B91E2B]/15 px-3 py-2 text-xs text-[#ff5c6a]"
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
            className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-medium text-gray-300 transition hover:bg-white/10 hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="flex items-center gap-1.5 rounded-xl bg-[#B91E2B] px-4 py-2 text-xs font-semibold text-white shadow-[0_4px_16px_rgba(185,30,43,0.35)] transition hover:bg-[#a11a25] hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
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
