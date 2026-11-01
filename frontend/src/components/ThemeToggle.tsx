import React from 'react'
import { useThemeStore } from '../stores/themeStore'
import './ThemeToggle.css'

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleToggle()
    }
  }

  return (
    <label
      id="theme-toggle-btn"
      htmlFor="theme-toggle-switch"
      role="button"
      tabIndex={-1}
      aria-label={actionLabel}
      title={actionLabel}
      className="theme-toggle-wrapper shrink-0"
    >
      <input
        type="checkbox"
        id="theme-toggle-switch"
        role="checkbox"
        checked={isDark}
        onChange={handleToggle}
        onKeyDown={handleKeyDown}
        aria-label={actionLabel}
        className="theme-toggle-input sr-only"
      />
      <span className="sr-only">{actionLabel}</span>
      <svg
        viewBox="0 0 69.667 44"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="theme-toggle-svg"
      >
        <g transform="translate(3.5 3.5)" data-name="Component 15 – 1" id="Component_15_1">
          {/* Background Pill / Capsule */}
          <g transform="matrix(1, 0, 0, 1, -3.5, -3.5)">
            <rect
              className="theme-toggle-container"
              fill="#83cbd8"
              transform="translate(3.5 3.5)"
              rx="17.5"
              height={35}
              width="60.667"
              data-name="container"
              id="container"
            />
          </g>

          {/* Animated Moving Button (Sun & Moon) */}
          <g transform="translate(2.333 2.333)" className="theme-toggle-button" id="button">
            {/* Sun Group */}
            <g className="theme-toggle-sun" data-name="sun" id="sun">
              <g transform="matrix(1, 0, 0, 1, -5.83, -5.83)">
                <circle
                  fill="#f8e664"
                  transform="translate(5.83 5.83)"
                  r={15.167}
                  cy={15.167}
                  cx={15.167}
                  data-name="sun-outer"
                  id="sun-outer-2"
                />
              </g>
              <g transform="matrix(1, 0, 0, 1, -5.83, -5.83)">
                <path
                  fill="rgba(246,254,247,0.29)"
                  transform="translate(9.33 9.33)"
                  d="M11.667,0A11.667,11.667,0,1,1,0,11.667,11.667,0,0,1,11.667,0Z"
                  data-name="sun"
                  id="sun-3"
                />
              </g>
              <circle
                fill="#fcf4b9"
                transform="translate(8.167 8.167)"
                r={7}
                cy={7}
                cx={7}
                id="sun-inner"
              />
            </g>

            {/* Moon Group */}
            <g className="theme-toggle-moon" data-name="moon" id="moon">
              <g transform="matrix(1, 0, 0, 1, -31.5, -5.83)">
                <circle
                  fill="#cce6ee"
                  transform="translate(31.5 5.83)"
                  r={15.167}
                  cy={15.167}
                  cx={15.167}
                  data-name="moon"
                  id="moon-3"
                />
              </g>
              <g
                className="theme-toggle-patches"
                fill="#a6cad0"
                transform="translate(-24.415 -1.009)"
                id="patches"
              >
                <circle transform="translate(43.009 4.496)" r={2} cy={2} cx={2} />
                <circle transform="translate(39.366 17.952)" r={2} cy={2} cx={2} data-name="patch" />
                <circle transform="translate(33.016 8.044)" r={1} cy={1} cx={1} data-name="patch" />
                <circle transform="translate(51.081 18.888)" r={1} cy={1} cx={1} data-name="patch" />
                <circle transform="translate(33.016 22.503)" r={1} cy={1} cx={1} data-name="patch" />
                <circle transform="translate(50.081 10.53)" r={1.5} cy={1.5} cx={1.5} data-name="patch" />
              </g>
            </g>
          </g>

          {/* Cloud Group (Light Mode) */}
          <g className="theme-toggle-cloud" transform="matrix(1, 0, 0, 1, -3.5, -3.5)">
            <path
              fill="#fff"
              transform="translate(-3466.47 -160.94)"
              d="M3512.81,173.815a4.463,4.463,0,0,1,2.243.62.95.95,0,0,1,.72-1.281,4.852,4.852,0,0,1,2.623.519c.034.02-.5-1.968.281-2.716a2.117,2.117,0,0,1,2.829-.274,1.821,1.821,0,0,1,.854,1.858c.063.037,2.594-.049,3.285,1.273s-.865,2.544-.807,2.626a12.192,12.192,0,0,1,2.278.892c.553.448,1.106,1.992-1.62,2.927a7.742,7.742,0,0,1-3.762-.3c-1.28-.49-1.181-2.65-1.137-2.624s-1.417,2.2-2.623,2.2a4.172,4.172,0,0,1-2.394-1.206,3.825,3.825,0,0,1-2.771.774c-3.429-.46-2.333-3.267-2.2-3.55A3.721,3.721,0,0,1,3512.81,173.815Z"
              data-name="cloud"
              id="cloud"
            />
          </g>

          {/* Stars Group (Dark Mode) */}
          <g
            className="theme-toggle-stars"
            fill="#def8ff"
            transform="translate(3.585 1.325)"
            id="stars"
          >
            <path
              transform="matrix(-1, 0.017, -0.017, -1, 24.231, 3.055)"
              d="M.774,0,.566.559,0,.539.458.933.25,1.492l.485-.361.458.394L1.024.953,1.509.592.943.572Z"
            />
            <path
              transform="matrix(-0.777, 0.629, -0.629, -0.777, 23.185, 12.358)"
              d="M1.341.529.836.472.736,0,.505.46,0,.4.4.729l-.231.46L.605.932l.4.326L.9.786Z"
              data-name="star"
            />
            <path
              transform="matrix(0.438, 0.899, -0.899, 0.438, 23.177, 29.735)"
              d="M.015,1.065.475.9l.285.365L.766.772l.46-.164L.745.494.751,0,.481.407,0,.293.285.658Z"
              data-name="star"
            />
            <path
              transform="translate(12.677 0.388) rotate(104)"
              d="M1.161,1.6,1.059,1,1.574.722.962.607.86,0,.613.572,0,.457.446.881.2,1.454l.516-.274Z"
              data-name="star"
            />
            <path
              transform="matrix(-0.07, 0.998, -0.998, -0.07, 11.066, 15.457)"
              d="M.873,1.648l.114-.62L1.579.945,1.03.62,1.144,0,.706.464.157.139.438.7,0,1.167l.592-.083Z"
              data-name="star"
            />
            <path
              transform="translate(8.326 28.061) rotate(11)"
              d="M.593,0,.638.724,0,.982l.7.211.045.724.36-.64.7.211L1.342.935,1.7.294,1.063.552Z"
              data-name="star"
            />
            <path
              transform="translate(5.012 5.962) rotate(172)"
              d="M.816,0,.5.455,0,.311.323.767l-.312.455.516-.215.323.456L.827.911,1.343.7.839.552Z"
              data-name="star"
            />
            <path
              transform="translate(2.218 14.616) rotate(169)"
              d="M1.261,0,.774.571.114.3.487.967,0,1.538.728,1.32l.372.662.047-.749.728-.218L1.215.749Z"
              data-name="star"
            />
          </g>
        </g>
      </svg>
    </label>
  )
}

export default ThemeToggle
