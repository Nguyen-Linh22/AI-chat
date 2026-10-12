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
          className="relative z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-100/80 dark:bg-white/[0.04] text-emerald-600 dark:text-emerald-400 shadow-xs transition-all duration-250 ease-out hover:border-emerald-500/50 hover:bg-[#1B8F3D] hover:text-white hover:shadow-[0_0_15px_rgba(27,143,61,0.35)] hover:scale-105 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1B8F3D]/50"
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
        className="pointer-events-none absolute -top-1.5 right-6 text-white opacity-0 scale-50 transition-all duration-500 ease-out drop-shadow-[0_0_5px_rgba(255,255,255,0.8)] group-hover:-translate-y-1 group-hover:scale-100 group-hover:opacity-90 motion-reduce:opacity-0 motion-reduce:transition-none"
      >
        <svg className="h-2.5 w-2.5 fill-current" viewBox="0 0 24 24">
          <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
        </svg>
      </span>

      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-1.5 right-12 text-emerald-300 opacity-0 scale-50 transition-all duration-500 delay-100 ease-out drop-shadow-[0_0_4px_rgba(27,143,61,0.8)] group-hover:translate-y-1 group-hover:scale-100 group-hover:opacity-85 motion-reduce:opacity-0 motion-reduce:transition-none"
      >
        <svg className="h-2 w-2 fill-current" viewBox="0 0 24 24">
          <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
        </svg>
      </span>

      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-1 left-7 text-[#ff808d] opacity-0 scale-50 transition-all duration-450 delay-75 ease-out drop-shadow-[0_0_4px_rgba(185,30,43,0.7)] group-hover:-translate-y-1 group-hover:scale-100 group-hover:opacity-80 motion-reduce:opacity-0 motion-reduce:transition-none"
      >
        <svg className="h-2 w-2 fill-current" viewBox="0 0 10 10">
          <circle cx="5" cy="5" r="4" />
        </svg>
      </span>

      {/* Expanded Button: Expanding Circle ("learn-more" style) inside Sleek Glass Container */}
      <button
        type="button"
        onClick={onClick}
        className="relative z-10 flex h-9 w-full items-center overflow-hidden rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-100/70 dark:bg-white/[0.04] p-1 backdrop-blur-md shadow-xs transition-all duration-300 hover:border-emerald-500/40 hover:shadow-[0_0_16px_rgba(27,143,61,0.25)] active:scale-[0.98] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1B8F3D]/50"
      >
        {/* Expanding Circle Background Layer */}
        <span
          aria-hidden="true"
          className="absolute left-1 top-1 h-7 w-7 rounded-lg bg-emerald-600/15 dark:bg-[#1B8F3D]/25 transition-all duration-350 ease-[cubic-bezier(0.65,0,0.076,1)] group-hover:w-[calc(100%-8px)] group-hover:bg-gradient-to-r group-hover:from-emerald-600 group-hover:to-[#167632] dark:group-hover:from-[#1B8F3D] dark:group-hover:to-[#125827] group-hover:shadow-xs motion-reduce:transition-none"
        />

        {/* Plus Icon Container */}
        <span
          aria-hidden="true"
          className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center text-emerald-600 dark:text-emerald-400 transition-all duration-300 ease-out group-hover:text-white group-hover:rotate-90 motion-reduce:transform-none"
        >
          <span className="text-base font-bold leading-none select-none">+</span>
        </span>

        {/* Button Text */}
        <span className="relative z-10 pl-2.5 text-xs font-semibold tracking-wide text-slate-800 dark:text-slate-100 transition-colors duration-250 ease-out group-hover:text-white select-none">
          Chat mới
        </span>

        {/* Subtle right chevron / micro sparkle indicator */}
        <span
          aria-hidden="true"
          className="relative z-10 ml-auto pr-2 text-slate-400 dark:text-gray-400 text-xs transition-all duration-300 opacity-60 group-hover:opacity-100 group-hover:text-white group-hover:translate-x-0.5 select-none"
        >
          ✦
        </span>
      </button>
    </div>
  )
}
