import React from 'react'

interface SearchChatButtonProps {
  onClick: () => void
  isCollapsed?: boolean
  className?: string
}

export const SearchChatButton: React.FC<SearchChatButtonProps> = ({
  onClick,
  isCollapsed = false,
  className = '',
}) => {
  const isMac =
    typeof navigator !== 'undefined' &&
    /Mac|iPod|iPhone|iPad/.test(navigator.platform || '')
  const shortcutHint = isMac ? '⌘K' : 'Ctrl K'

  if (isCollapsed) {
    return (
      <div
        className={`relative mb-2 flex items-center justify-center overflow-visible group ${className}`}
      >
        {/* Subtle ambient hover pulse / glow */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -m-1 rounded-2xl bg-emerald-500/0 blur-md transition-all duration-300 group-hover:bg-emerald-500/15 dark:group-hover:bg-emerald-500/20 motion-reduce:hidden"
        />

        {/* Collapsed Button: 36x36px Icon Button centered at x=32px */}
        <button
          type="button"
          onClick={onClick}
          className="relative z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#1A2230] text-slate-600 dark:text-[#94A3B8] shadow-xs transition-all duration-200 ease-out hover:border-emerald-500/60 hover:text-[#1B8F3D] dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-[#222C3D] hover:shadow-sm hover:shadow-emerald-500/10 active:scale-95 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#1B8F3D]/50 focus-visible:outline-none"
          title={`Tìm kiếm cuộc trò chuyện (${shortcutHint})`}
          aria-label="Tìm kiếm cuộc trò chuyện"
        >
          <svg
            className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110 motion-reduce:transform-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div className={`relative mb-2 w-full overflow-visible group ${className}`}>
      {/* Subtle ambient hover glow */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -m-0.5 rounded-xl bg-emerald-500/0 blur-sm transition-all duration-300 group-hover:bg-emerald-500/10 dark:group-hover:bg-emerald-500/15 motion-reduce:hidden"
      />

      <button
        type="button"
        onClick={onClick}
        className="relative z-10 flex h-9 w-full items-center overflow-hidden rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#1A2230] px-2.5 shadow-xs transition-all duration-200 hover:border-emerald-500/50 hover:bg-slate-50/90 dark:hover:bg-[#222C3D] hover:shadow-sm hover:shadow-emerald-500/5 active:scale-[0.98] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#1B8F3D]/50 focus-visible:outline-none text-left"
        title={`Tìm kiếm cuộc trò chuyện (${shortcutHint})`}
        aria-label="Tìm kiếm cuộc trò chuyện"
      >
        <span
          aria-hidden="true"
          className="flex h-5 w-5 shrink-0 items-center justify-center text-slate-500 dark:text-[#94A3B8] transition-all duration-200 group-hover:text-[#1B8F3D] dark:group-hover:text-emerald-400 group-hover:scale-105 motion-reduce:transform-none"
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
        </span>

        <span className="truncate pl-2 text-xs font-medium text-slate-600 dark:text-[#94A3B8] transition-colors duration-200 group-hover:text-slate-900 dark:group-hover:text-[#F1F5F9] select-none">
          Tìm kiếm cuộc trò chuyện
        </span>

        <kbd
          aria-hidden="true"
          className="ml-auto inline-flex items-center gap-0.5 text-[10px] font-mono font-medium text-slate-400 dark:text-gray-400 bg-slate-100 dark:bg-white/[0.06] px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-white/10 shadow-2xs group-hover:border-emerald-500/30 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors select-none"
        >
          {shortcutHint}
        </kbd>
      </button>
    </div>
  )
}
