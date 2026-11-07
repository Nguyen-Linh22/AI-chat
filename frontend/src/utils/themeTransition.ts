let activeTransition: ViewTransition | null = null

export function executeThemeTransition(
  toggleFn: () => void,
  triggerElement?: HTMLElement | null
) {
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

  // 1. Get exact center of button or provided trigger element
  const button = triggerElement || document.getElementById('theme-toggle-btn')
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

