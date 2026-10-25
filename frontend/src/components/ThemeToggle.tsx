import { useThemeStore } from '../stores/themeStore'

let activeTransition: ViewTransition | null = null

function executeThemeTransition(toggleFn: () => void) {
  // Respect reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Fallback if View Transitions API is not supported or reduced motion is enabled
  if (
    prefersReducedMotion ||
    typeof document === 'undefined' ||
    !('startViewTransition' in document) ||
    typeof document.startViewTransition !== 'function'
  ) {
    toggleFn()
    return
  }

  // Cancel any active in-flight transition to prevent overlapping or race conditions
  if (activeTransition) {
    try {
      activeTransition.skipTransition()
    } catch {
      // Ignore if already completed or aborted
    }
    activeTransition = null
  }

  // 1. Get exact center of ThemeToggle button (NOT click coordinates)
  const button = document.getElementById('theme-toggle-btn')
  let centerX = window.innerWidth / 2
  let centerY = window.innerHeight / 2

  if (button) {
    const rect = button.getBoundingClientRect()
    centerX = rect.left + rect.width / 2
    centerY = rect.top + rect.height / 2
  }

  // 2. Calculate maximum radius to furthest corner of viewport
  const maxRadius = Math.hypot(
    Math.max(centerX, window.innerWidth - centerX),
    Math.max(centerY, window.innerHeight - centerY)
  )

  // 3. Set CSS custom properties on documentElement for CSS animation fallback
  const root = document.documentElement
  root.style.setProperty('--vt-x', `${centerX}px`)
  root.style.setProperty('--vt-y', `${centerY}px`)
  root.style.setProperty('--vt-r', `${maxRadius}px`)
  root.classList.add('view-transition-active')

  let didUpdate = false

  try {
    const transition = document.startViewTransition(() => {
      didUpdate = true
      toggleFn()
    })

    activeTransition = transition

    transition.ready
      .then(() => {
        let animatedWithWAAPI = false
        try {
          if (typeof root.animate === 'function') {
            root.animate(
              {
                clipPath: [
                  `circle(0px at ${centerX}px ${centerY}px)`,
                  `circle(${maxRadius}px at ${centerX}px ${centerY}px)`,
                ],
              },
              {
                duration: 500,
                easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
                pseudoElement: '::view-transition-new(root)',
              }
            )
            animatedWithWAAPI = true
          }
        } catch {
          // pseudoElement or animate failed, fallback to CSS keyframes
        }

        if (!animatedWithWAAPI) {
          root.classList.add('vt-css-fallback')
        }
      })
      .catch(() => {
        // Transition skipped or rejected; handled gracefully
      })

    const onFinished = () => {
      if (activeTransition === transition) {
        activeTransition = null
        root.classList.remove('view-transition-active', 'vt-css-fallback')
        root.style.removeProperty('--vt-x')
        root.style.removeProperty('--vt-y')
        root.style.removeProperty('--vt-r')
      }
    }

    transition.finished.then(onFinished, onFinished)
  } catch {
    // If startViewTransition threw before executing callback, ensure theme toggles
    root.classList.remove('view-transition-active', 'vt-css-fallback')
    root.style.removeProperty('--vt-x')
    root.style.removeProperty('--vt-y')
    root.style.removeProperty('--vt-r')
    activeTransition = null
    if (!didUpdate) {
      toggleFn()
    }
  }
}

export function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)

  const isDark = theme === 'dark'
  const actionLabel = isDark
    ? 'Chuyển sang giao diện sáng'
    : 'Chuyển sang giao diện tối'

  const handleToggle = () => {
    executeThemeTransition(toggleTheme)
  }

  return (
    <button
      type="button"
      id="theme-toggle-btn"
      onClick={handleToggle}
      aria-label={actionLabel}
      title={actionLabel}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/90 dark:border-white/10 bg-slate-50 dark:bg-[#1A2230] text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F1F5F9] hover:bg-slate-100 dark:hover:bg-[#222C3D] hover:border-slate-300 dark:hover:border-white/20 transition-colors duration-150 motion-reduce:transition-none active:scale-95 motion-reduce:active:scale-100 cursor-pointer shadow-xs relative overflow-hidden shrink-0 focus-visible:ring-2 focus-visible:ring-[#15803D] dark:focus-visible:ring-emerald-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#131923] focus-visible:outline-none"
    >
      {/* Sun Icon (Visible in Light Mode) */}
      <svg
        className={`h-4 w-4 transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none absolute ${
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
        className={`h-4 w-4 transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none absolute ${
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
