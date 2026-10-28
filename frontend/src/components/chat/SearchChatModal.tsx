import React, { useState, useEffect, useRef, useMemo } from 'react'
import type { ChatSession } from '../../services/chatService'

interface SearchChatModalProps {
  isOpen: boolean
  onClose: () => void
  chats: ChatSession[]
  currentChatId: string | null
  onSelectChat: (chatId: string) => void
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'Cuộc trò chuyện'
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime()
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (days > 0) return `${days} ngày trước`
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    if (hours > 0) return `${hours} giờ trước`
    return 'Hôm nay'
  } catch {
    return 'Cuộc trò chuyện'
  }
}

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const index = lowerText.indexOf(lowerQuery)
  if (index === -1) return <>{text}</>

  const before = text.slice(0, index)
  const match = text.slice(index, index + query.length)
  const after = text.slice(index + query.length)

  return (
    <>
      {before}
      <mark className="rounded bg-emerald-500/25 px-0.5 font-bold text-emerald-900 dark:bg-emerald-500/35 dark:text-emerald-200">
        {match}
      </mark>
      <HighlightMatch text={after} query={query} />
    </>
  )
}

export const SearchChatModal: React.FC<SearchChatModalProps> = ({
  isOpen,
  onClose,
  chats,
  currentChatId,
  onSelectChat,
}) => {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isKeyboardNav, setIsKeyboardNav] = useState(false)
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)

  const inputRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null)

  const cleanQuery = query.trim()
  const [prevCleanQuery, setPrevCleanQuery] = useState(cleanQuery)

  if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen)
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setIsKeyboardNav(false)
    }
  }

  if (prevCleanQuery !== cleanQuery) {
    setPrevCleanQuery(cleanQuery)
    setSelectedIndex(0)
    setIsKeyboardNav(false)
  }

  const displayedChats = useMemo(() => {
    if (!cleanQuery) {
      // Empty-query state: show up to 5 most recent conversations
      return chats.slice(0, 5)
    }
    const lower = cleanQuery.toLowerCase()
    return chats.filter((chat) => chat.title.toLowerCase().includes(lower))
  }, [chats, cleanQuery])

  // Focus management
  useEffect(() => {
    if (isOpen) {
      if (document.activeElement instanceof HTMLElement) {
        previouslyFocusedElementRef.current = document.activeElement
      }

      // Auto-focus input on opening
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    } else {
      if (previouslyFocusedElementRef.current?.focus) {
        previouslyFocusedElementRef.current.focus()
      }
    }
  }, [isOpen])

  // Auto-scroll highlighted result into view when using keyboard navigation
  useEffect(() => {
    if (
      isKeyboardNav &&
      selectedIndex >= 0 &&
      itemRefs.current[selectedIndex] &&
      typeof itemRefs.current[selectedIndex]?.scrollIntoView === 'function'
    ) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        block: 'nearest',
      })
    }
  }, [isKeyboardNav, selectedIndex])

  // Global escape and keydown trap within modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIsKeyboardNav(true)
      if (displayedChats.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % displayedChats.length)
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setIsKeyboardNav(true)
      if (displayedChats.length > 0) {
        setSelectedIndex(
          (prev) => (prev - 1 + displayedChats.length) % displayedChats.length
        )
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const targetIndex = selectedIndex >= 0 ? selectedIndex : 0
      if (displayedChats[targetIndex]) {
        onSelectChat(displayedChats[targetIndex].id)
        onClose()
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[10vh] sm:pt-[15vh] bg-black/60 dark:bg-black/75 backdrop-blur-md transition-opacity animate-modal-fade"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Tìm kiếm cuộc trò chuyện"
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200/90 dark:border-white/[0.12] bg-white/95 dark:bg-[#151D2A]/95 shadow-2xl backdrop-blur-2xl ring-1 ring-black/5 dark:ring-white/[0.04] animate-modal-enter flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        onMouseMove={() => {
          if (isKeyboardNav) {
            setIsKeyboardNav(false)
          }
        }}
      >
        {/* Subtle top ambient emerald glow border */}
        <div
          aria-hidden="true"
          className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/50 dark:via-emerald-400/60 to-transparent pointer-events-none"
        />

        {/* Search Bar Input Header */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02]">
          <div
            aria-hidden="true"
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
              cleanQuery
                ? 'text-[#1B8F3D] dark:text-emerald-400 bg-emerald-500/10'
                : 'text-slate-400 dark:text-[#94A3B8] bg-slate-100 dark:bg-white/[0.04]'
            }`}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm theo tiêu đề cuộc trò chuyện..."
            aria-label="Tìm kiếm cuộc trò chuyện"
            className="w-full bg-transparent pl-3 pr-2 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] outline-none"
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                inputRef.current?.focus()
              }}
              className="mr-1.5 flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/80 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white transition-all cursor-pointer active:scale-90"
              title="Xóa tìm kiếm"
              aria-label="Xóa nội dung tìm kiếm"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng tìm kiếm"
            title="Đóng (Esc)"
            className="flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
          >
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 dark:text-gray-400 bg-slate-100 dark:bg-white/[0.06] rounded-md border border-slate-200 dark:border-white/10 select-none hover:border-slate-300 dark:hover:border-white/20 transition-colors">
              ESC
            </kbd>
          </button>
        </div>

        {/* Results Container */}
        <div
          className="max-h-[340px] overflow-y-auto p-2 scrollbar-thin"
          onMouseLeave={() => {
            if (isKeyboardNav) {
              setIsKeyboardNav(false)
            }
          }}
        >
          {chats.length === 0 ? (
            /* Empty state: No chats in history */
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center select-none">
              <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/[0.06] text-slate-400 dark:text-gray-400">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-gray-300">
                Chưa có cuộc trò chuyện nào để tìm kiếm
              </p>
              <p className="mt-1 text-[11px] text-slate-400 dark:text-[#94A3B8]">
                Bắt đầu một đoạn chat mới để có thể tìm kiếm tại đây.
              </p>
            </div>
          ) : cleanQuery && displayedChats.length === 0 ? (
            /* Empty state: Search query returned 0 matches */
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center select-none">
              <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-gray-300">
                Không tìm thấy cuộc trò chuyện nào
              </p>
              <p className="mt-1 text-[11px] text-slate-400 dark:text-[#94A3B8] max-w-xs truncate">
                Không có kết quả nào khớp với "{cleanQuery}"
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  inputRef.current?.focus()
                }}
                className="mt-3 inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:border-emerald-500/40 hover:text-[#1B8F3D] dark:hover:text-emerald-400 transition-colors cursor-pointer"
              >
                <span>Xóa tìm kiếm</span>
              </button>
            </div>
          ) : (
            /* Matching or Recent List */
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2.5 py-1 select-none">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-[#94A3B8]">
                  {cleanQuery
                    ? `Kết quả tìm kiếm (${displayedChats.length})`
                    : `Gần đây (${displayedChats.length})`}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                  {cleanQuery ? 'Khớp theo tiêu đề' : 'Mới nhất'}
                </span>
              </div>

              {displayedChats.map((chat, index) => {
                const isKeyboardSelected = isKeyboardNav && selectedIndex === index
                const isCurrent = currentChatId === chat.id
                const relativeTime = formatRelativeTime(chat.createdAt)

                return (
                  <button
                    key={chat.id}
                    ref={(el) => {
                      itemRefs.current[index] = el
                    }}
                    type="button"
                    onClick={() => {
                      onSelectChat(chat.id)
                      onClose()
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`group/item flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors cursor-pointer outline-none ${
                      isKeyboardSelected
                        ? 'border border-emerald-500/50 bg-[#E2E8F0] dark:bg-[#2A374C] text-[#1B8F3D] dark:text-emerald-400 shadow-2xs ring-1 ring-[#1B8F3D]/20'
                        : 'border border-transparent bg-transparent hover:border-emerald-500/40 hover:bg-slate-100/80 dark:hover:bg-[#222C3D] text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-colors ${
                        isCurrent || isKeyboardSelected
                          ? 'bg-emerald-500/15 text-[#1B8F3D] dark:text-emerald-400 ring-1 ring-emerald-500/30'
                          : 'bg-slate-100 dark:bg-white/[0.04] text-slate-400 dark:text-gray-400 group-hover/item:text-[#1B8F3D] dark:group-hover/item:text-emerald-400 group-hover/item:bg-emerald-500/10'
                      }`}
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.8}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-xs font-semibold ${
                          isKeyboardSelected
                            ? 'text-slate-900 dark:text-white'
                            : 'text-slate-800 dark:text-[#F1F5F9] group-hover/item:text-slate-900 dark:group-hover/item:text-white'
                        }`}
                      >
                        <HighlightMatch text={chat.title} query={cleanQuery} />
                      </p>
                      <p className="truncate text-[10px] text-slate-400 dark:text-[#94A3B8] mt-0.5">
                        {relativeTime}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isCurrent && (
                        <span className="shrink-0 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 select-none">
                          Đang mở
                        </span>
                      )}
                      {isKeyboardSelected ? (
                        <span
                          aria-hidden="true"
                          className="hidden sm:inline-flex items-center rounded border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-mono text-[#1B8F3D] dark:text-emerald-300 select-none"
                        >
                          ↵
                        </span>
                      ) : (
                        <span
                          aria-hidden="true"
                          className="hidden sm:group-hover/item:inline-flex items-center rounded border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-mono text-[#1B8F3D] dark:text-emerald-300 select-none"
                        >
                          ↵
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Dialog Footer Shortcuts Bar */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/70 dark:bg-[#131923]/60 px-3.5 py-2 text-[11px] text-slate-500 dark:text-[#94A3B8] select-none">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A2230] px-1 py-0.5 text-[10px] font-mono">
                ↑
              </kbd>
              <kbd className="rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A2230] px-1 py-0.5 text-[10px] font-mono">
                ↓
              </kbd>
              <span className="text-[10px] ml-0.5">Di chuyển</span>
            </span>

            <span className="flex items-center gap-1">
              <kbd className="rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A2230] px-1.5 py-0.5 text-[10px] font-mono">
                ↵
              </kbd>
              <span className="text-[10px]">Mở chat</span>
            </span>
          </div>

          <span className="flex items-center gap-1 text-[10px]">
            <kbd className="rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A2230] px-1.5 py-0.5 text-[10px] font-mono">
              Esc
            </kbd>
            <span>Đóng</span>
          </span>
        </div>
      </div>
    </div>
  )
}
