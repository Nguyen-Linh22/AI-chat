import React from 'react'

interface NewChatButtonProps {
  onClick: () => void
  isCollapsed?: boolean
  className?: string
}

export const NewChatButton: React.FC<NewChatButtonProps> = ({
  onClick,
  isCollapsed = false,
  className = '',
}) => {
  if (isCollapsed) {
    return (
      <div className={`relative mb-3 flex items-center justify-center overflow-visible group ${className}`}>
        {/* Subtle Micro-Sparkles (2 tiny sparkles) */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-1.5 -right-1 text-emerald-400 opacity-0 scale-50 transition-all duration-400 ease-out group-hover:scale-100 group-hover:opacity-90 motion-reduce:opacity-0 motion-reduce:transition-none"
        >
          <svg className="h-2.5 w-2.5 fill-current" viewBox="0 0 24 24">
            <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
          </svg>
        </span>

        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-1 -left-1 text-white opacity-0 scale-50 transition-all duration-400 delay-75 ease-out group-hover:scale-100 group-hover:opacity-85 motion-reduce:opacity-0 motion-reduce:transition-none"
        >
          <svg className="h-2 w-2 fill-current" viewBox="0 0 24 24">
            <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
          </svg>
        </span>

        {/* Collapsed Button: 36x36px Icon Button with smooth hover transition */}
        <button
          type="button"
          onClick={onClick}
          className="relative z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#1A2230] text-[#1B8F3D] dark:text-emerald-400 shadow-xs transition-all duration-200 ease-out hover:border-emerald-500/60 hover:bg-[#1B8F3D] hover:text-white hover:shadow-md hover:shadow-[#1B8F3D]/25 active:scale-95 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#1B8F3D]/50 focus-visible:outline-none"
          title="Chat mới"
          aria-label="Chat mới"
        >
          <span className="text-base font-bold leading-none select-none transition-transform duration-300 group-hover:rotate-90">
            +
          </span>
        </button>
      </div>
    )
  }

  return (
    <div className={`relative mb-3 w-full overflow-visible group ${className}`}>
      {/* Subtle Micro-Sparkles on hover (3 delicate accents) */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-1.5 right-6 text-white opacity-0 scale-50 transition-all duration-400 ease-out drop-shadow-[0_0_5px_rgba(255,255,255,0.8)] group-hover:-translate-y-1 group-hover:scale-100 group-hover:opacity-90 motion-reduce:opacity-0 motion-reduce:transition-none"
      >
        <svg className="h-2.5 w-2.5 fill-current" viewBox="0 0 24 24">
          <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
        </svg>
      </span>

      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-1.5 right-12 text-emerald-300 opacity-0 scale-50 transition-all duration-400 delay-75 ease-out drop-shadow-[0_0_4px_rgba(27,143,61,0.8)] group-hover:translate-y-1 group-hover:scale-100 group-hover:opacity-85 motion-reduce:opacity-0 motion-reduce:transition-none"
      >
        <svg className="h-2 w-2 fill-current" viewBox="0 0 24 24">
          <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
        </svg>
      </span>

      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-1 left-7 text-[#ff808d] opacity-0 scale-50 transition-all duration-400 delay-100 ease-out drop-shadow-[0_0_4px_rgba(185,30,43,0.7)] group-hover:-translate-y-1 group-hover:scale-100 group-hover:opacity-80 motion-reduce:opacity-0 motion-reduce:transition-none"
      >
        <svg className="h-2 w-2 fill-current" viewBox="0 0 10 10">
          <circle cx="5" cy="5" r="4" />
        </svg>
      </span>

      {/* Expanded Button: Elevated Primary Action */}
      <button
        type="button"
        onClick={onClick}
        className="relative z-10 flex h-9 w-full items-center overflow-hidden rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#1A2230] p-1 shadow-xs transition-all duration-200 hover:border-emerald-500/50 hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/20 active:scale-[0.98] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#1B8F3D]/50 focus-visible:outline-none"
      >
        {/* Subtle hover gradient background */}
        <span
          aria-hidden="true"
          className="absolute left-1 top-1 h-7 w-7 rounded-lg bg-emerald-500/15 dark:bg-[#1B8F3D]/20 transition-all duration-300 ease-[cubic-bezier(0.65,0,0.076,1)] group-hover:w-[calc(100%-8px)] group-hover:bg-[#1B8F3D] dark:group-hover:bg-[#1B8F3D] motion-reduce:transition-none"
        />

        {/* Plus Icon Container */}
        <span
          aria-hidden="true"
          className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center text-[#1B8F3D] dark:text-emerald-400 transition-all duration-250 ease-out group-hover:text-white group-hover:rotate-90 motion-reduce:transform-none"
        >
          <span className="text-base font-bold leading-none select-none">+</span>
        </span>

        {/* Button Text */}
        <span className="relative z-10 pl-2.5 text-xs font-semibold tracking-wide text-slate-800 dark:text-[#F1F5F9] transition-colors duration-200 ease-out group-hover:text-white select-none">
          Chat mới
        </span>

        {/* Subtle right sparkle indicator */}
        <span
          aria-hidden="true"
          className="relative z-10 ml-auto pr-2 text-slate-400 dark:text-[#94A3B8] text-xs transition-all duration-200 opacity-60 group-hover:opacity-100 group-hover:text-white group-hover:translate-x-0.5 select-none"
        >
          ✦
        </span>
      </button>
    </div>
  )
}
