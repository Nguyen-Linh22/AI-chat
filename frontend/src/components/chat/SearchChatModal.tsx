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
      <mark className="rounded bg-amber-200/90 dark:bg-indigo-500/35 dark:text-indigo-200 zyricon:bg-[#98578D]/40 px-0.5 font-bold text-amber-950 zyricon:text-[#F7F3F6]">
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
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[10vh] sm:pt-[15vh] bg-black/60 dark:bg-black/75 zyricon:bg-[#07040B]/85 backdrop-blur-md transition-opacity animate-modal-fade"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Tìm kiếm cuộc trò chuyện"
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200/90 dark:border-white/[0.12] zyricon:border-[#694788]/35 bg-white/95 dark:bg-[#151D2A]/95 zyricon:bg-[#120B1C]/96 shadow-2xl zyricon:shadow-[0_12px_48px_rgba(7,4,11,0.95)] backdrop-blur-2xl ring-1 ring-black/5 dark:ring-white/[0.04] zyricon:ring-[#694788]/20 animate-modal-enter flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        onMouseMove={() => {
          if (isKeyboardNav) {
            setIsKeyboardNav(false)
          }
        }}
      >
        {/* Subtle top ambient glow border */}
        <div
          aria-hidden="true"
          className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/50 dark:via-indigo-500/60 zyricon:via-[#C27595]/70 to-transparent pointer-events-none"
        />

        {/* Search Bar Input Header */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-white/[0.06] zyricon:border-[#694788]/25 bg-slate-50/50 dark:bg-white/[0.02] zyricon:bg-[#180F26]/50">
          <div
            aria-hidden="true"
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
              cleanQuery
                ? 'text-amber-800 dark:text-indigo-300 zyricon:text-[#C27595] bg-amber-100/70 dark:bg-indigo-950/60 border border-amber-300/60 dark:border-indigo-500/30 zyricon:bg-[#3B2568]/40'
                : 'text-slate-400 dark:text-[#94A3B8] zyricon:text-[#8F7686] bg-slate-100 dark:bg-white/[0.04] zyricon:bg-[#1A102A]/60'
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
            className="w-full bg-transparent pl-3 pr-2 text-sm font-medium text-slate-900 dark:text-white zyricon:text-[#F7F3F6] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] zyricon:placeholder:text-[#8F7686] outline-none"
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                inputRef.current?.focus()
              }}
              className="mr-1.5 flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:bg-amber-100/60 hover:text-amber-900 dark:hover:bg-[#1E1B4B]/50 dark:hover:text-indigo-200 zyricon:text-[#C4A5B8] zyricon:hover:bg-[#3B2568]/50 zyricon:hover:text-[#F7F3F6] transition-all cursor-pointer active:scale-90 focus-visible:ring-2 focus-visible:ring-emerald-500/50 dark:focus-visible:ring-indigo-400/50 zyricon:focus-visible:ring-[#C27595]/50 focus-visible:outline-none"
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
            className="flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-indigo-200 dark:hover:bg-[#1E1B4B]/50 zyricon:text-[#C4A5B8] zyricon:hover:text-[#F7F3F6] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500/50 dark:focus-visible:ring-indigo-400/50 zyricon:focus-visible:ring-[#C27595]/50 focus-visible:outline-none rounded-md"
          >
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-600 dark:text-gray-400 zyricon:text-[#C4A5B8] bg-slate-100 dark:bg-white/[0.06] zyricon:bg-[#1D132D] rounded-md border border-slate-200 dark:border-white/10 zyricon:border-[#694788]/30 select-none hover:border-slate-300 dark:hover:border-white/20 zyricon:hover:border-[#694788]/50 transition-colors">
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
              <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/[0.06] zyricon:bg-[#1A102A] text-slate-400 dark:text-gray-400 zyricon:text-[#8F7686]">
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
              <p className="text-xs font-semibold text-slate-700 dark:text-gray-300 zyricon:text-[#F7F3F6]">
                Chưa có cuộc trò chuyện nào để tìm kiếm
              </p>
              <p className="mt-1 text-[11px] text-slate-600 dark:text-[#94A3B8] zyricon:text-[#C4A5B8]">
                Bắt đầu một đoạn chat mới để có thể tìm kiếm tại đây.
              </p>
            </div>
          ) : cleanQuery && displayedChats.length === 0 ? (
            /* Empty state: Search query returned 0 matches */
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center select-none">
              <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 zyricon:bg-[#3B2568]/40 text-amber-600 dark:text-amber-400 zyricon:text-[#C27595] ring-1 ring-amber-500/20 zyricon:ring-[#694788]/40">
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
              <p className="text-xs font-semibold text-slate-700 dark:text-gray-300 zyricon:text-[#F7F3F6]">
                Không tìm thấy cuộc trò chuyện nào
              </p>
              <p className="mt-1 text-[11px] text-slate-600 dark:text-[#94A3B8] zyricon:text-[#C4A5B8] max-w-xs truncate">
                Không có kết quả nào khớp với "{cleanQuery}"
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  inputRef.current?.focus()
                }}
                className="mt-3 inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-white/10 zyricon:border-[#694788]/30 bg-slate-50 dark:bg-white/[0.04] zyricon:bg-[#1D132D] px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 zyricon:text-[#C4A5B8] hover:border-amber-500/40 dark:hover:border-indigo-500/40 zyricon:hover:border-[#C27595]/50 hover:text-amber-700 dark:hover:text-indigo-300 zyricon:hover:text-[#F7F3F6] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500/50 dark:focus-visible:ring-indigo-400/50 zyricon:focus-visible:ring-[#C27595]/50 focus-visible:outline-none"
              >
                <span>Xóa tìm kiếm</span>
              </button>
            </div>
          ) : (
            /* Matching or Recent List */
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2.5 py-1 select-none">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-[#94A3B8] zyricon:text-[#C4A5B8]">
                  {cleanQuery
                    ? `Kết quả tìm kiếm (${displayedChats.length})`
                    : `Gần đây (${displayedChats.length})`}
                </span>
                <span className="text-[10px] text-slate-600 dark:text-[#94A3B8] zyricon:text-[#8F7686] font-normal">
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
                        ? 'border border-amber-500/60 dark:border-indigo-500/50 zyricon:border-[#C27595]/60 bg-amber-50 dark:bg-gradient-to-r dark:from-[rgba(49,46,129,0.45)] dark:to-[rgba(30,27,75,0.3)] zyricon:bg-[#25173D]/90 text-amber-900 dark:text-indigo-300 zyricon:text-[#C27595] shadow-2xs ring-1 ring-amber-500/30 dark:ring-indigo-500/30 zyricon:ring-[#C27595]/30'
                        : 'border border-transparent bg-transparent hover:border-amber-400/50 dark:hover:border-indigo-500/30 zyricon:hover:border-[#694788]/50 hover:bg-amber-50/50 dark:hover:bg-[#1E1B4B]/35 zyricon:hover:bg-[#1D132D]/70 text-slate-700 dark:text-gray-300 zyricon:text-[#EBDDE9] hover:text-slate-900 dark:hover:text-white zyricon:hover:text-[#F7F3F6]'
                    }`}
                  >
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-colors ${
                        isCurrent || isKeyboardSelected
                          ? 'bg-amber-100/70 dark:bg-indigo-950/60 text-amber-800 dark:text-indigo-300 zyricon:bg-[#3B2568]/50 zyricon:text-[#C27595] ring-1 ring-amber-400/40 dark:ring-indigo-500/40 zyricon:ring-[#694788]/40'
                          : 'bg-slate-100 dark:bg-white/[0.04] zyricon:bg-[#180F26] text-slate-400 dark:text-gray-400 zyricon:text-[#C4A5B8] group-hover/item:text-amber-700 dark:group-hover/item:text-indigo-300 zyricon:group-hover/item:text-[#C27595] group-hover/item:bg-amber-100/60 dark:group-hover/item:bg-indigo-950/40 zyricon:group-hover/item:bg-[#3B2568]/40'
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
                            ? 'text-slate-900 dark:text-white zyricon:text-[#F7F3F6]'
                            : 'text-slate-800 dark:text-[#F1F5F9] zyricon:text-[#EBDDE9] group-hover/item:text-slate-900 dark:group-hover/item:text-white zyricon:group-hover/item:text-[#F7F3F6]'
                        }`}
                      >
                        <HighlightMatch text={chat.title} query={cleanQuery} />
                      </p>
                      <p className="truncate text-[10px] text-slate-600 dark:text-[#94A3B8] zyricon:text-[#C4A5B8] mt-0.5">
                        {relativeTime}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isCurrent && (
                        <span className="shrink-0 rounded-md border border-emerald-500/30 dark:border-indigo-500/30 zyricon:border-[#694788]/40 bg-emerald-500/10 dark:bg-indigo-950/60 zyricon:bg-[#3B2568]/40 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-indigo-300 zyricon:text-[#C27595] select-none">
                          Đang mở
                        </span>
                      )}
                      {isKeyboardSelected ? (
                        <span
                          aria-hidden="true"
                          className="hidden sm:inline-flex items-center rounded border border-emerald-500/25 dark:border-indigo-500/30 zyricon:border-[#694788]/40 bg-emerald-500/10 dark:bg-indigo-950/40 zyricon:bg-[#3B2568]/30 px-1.5 py-0.5 text-[10px] font-mono text-[#1B8F3D] dark:text-indigo-300 zyricon:text-[#C27595] select-none"
                        >
                          ↵
                        </span>
                      ) : (
                        <span
                          aria-hidden="true"
                          className="hidden sm:group-hover/item:inline-flex items-center rounded border border-emerald-500/25 dark:border-indigo-500/30 zyricon:border-[#694788]/40 bg-emerald-500/10 dark:bg-indigo-950/40 zyricon:bg-[#3B2568]/30 px-1.5 py-0.5 text-[10px] font-mono text-[#1B8F3D] dark:text-indigo-300 zyricon:text-[#C27595] select-none"
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
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/[0.06] zyricon:border-[#694788]/25 bg-slate-50/70 dark:bg-[#131923]/60 zyricon:bg-[#180F26]/70 px-3.5 py-2 text-[11px] text-slate-500 dark:text-[#94A3B8] zyricon:text-[#C4A5B8] select-none">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-slate-200 dark:border-white/10 zyricon:border-[#694788]/30 bg-white dark:bg-[#1A2230] zyricon:bg-[#1D132D] px-1 py-0.5 text-[10px] font-mono text-slate-700 dark:text-gray-300 zyricon:text-[#EBDDE9]">
                ↑
              </kbd>
              <kbd className="rounded border border-slate-200 dark:border-white/10 zyricon:border-[#694788]/30 bg-white dark:bg-[#1A2230] zyricon:bg-[#1D132D] px-1 py-0.5 text-[10px] font-mono text-slate-700 dark:text-gray-300 zyricon:text-[#EBDDE9]">
                ↓
              </kbd>
              <span className="text-[10px] ml-0.5">Di chuyển</span>
            </span>

            <span className="flex items-center gap-1">
              <kbd className="rounded border border-slate-200 dark:border-white/10 zyricon:border-[#694788]/30 bg-white dark:bg-[#1A2230] zyricon:bg-[#1D132D] px-1.5 py-0.5 text-[10px] font-mono text-slate-700 dark:text-gray-300 zyricon:text-[#EBDDE9]">
                ↵
              </kbd>
              <span className="text-[10px]">Mở chat</span>
            </span>
          </div>

          <span className="flex items-center gap-1 text-[10px]">
            <kbd className="rounded border border-slate-200 dark:border-white/10 zyricon:border-[#694788]/30 bg-white dark:bg-[#1A2230] zyricon:bg-[#1D132D] px-1.5 py-0.5 text-[10px] font-mono text-slate-700 dark:text-gray-300 zyricon:text-[#EBDDE9]">
              Esc
            </kbd>
            <span>Đóng</span>
          </span>
        </div>
      </div>
    </div>
  )
}
