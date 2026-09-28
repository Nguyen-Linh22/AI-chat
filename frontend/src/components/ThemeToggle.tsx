import { useThemeStore } from '../stores/themeStore'

export function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)

  const isDark = theme === 'dark'
  const actionLabel = isDark
    ? 'Chuyển sang giao diện sáng'
    : 'Chuyển sang giao diện tối'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={actionLabel}
      title={actionLabel}
      className="flex h-7 w-7 items-center justify-center rounded-xl border border-slate-200/90 dark:border-white/10 bg-white/90 dark:bg-[#161d28]/90 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1a2332] hover:border-slate-300 dark:hover:border-white/20 transition-all duration-150 active:scale-95 cursor-pointer shadow-xs dark:shadow-sm relative overflow-hidden shrink-0"
    >
      {/* Sun Icon (Visible in Light Mode) */}
      <svg
        className={`h-4 w-4 transition-all duration-200 ease-out absolute ${
          isDark
            ? '-rotate-90 scale-0 opacity-0'
            : 'rotate-0 scale-100 opacity-100 text-amber-500'
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
        />
      </svg>

      {/* Moon Icon (Visible in Dark Mode) */}
      <svg
        className={`h-4 w-4 transition-all duration-200 ease-out absolute ${
          isDark
            ? 'rotate-0 scale-100 opacity-100 text-teal-300'
            : 'rotate-90 scale-0 opacity-0'
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
        />
      </svg>
    </button>
  )
}

export default ThemeToggle
