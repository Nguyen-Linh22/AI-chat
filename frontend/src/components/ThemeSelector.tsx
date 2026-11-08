import React, { useState, useRef, useEffect, useCallback, useId } from 'react'
import { useThemeStore, type Theme } from '../stores/themeStore'
import { executeThemeTransition } from '../utils/themeTransition'
import './ThemeSelector.css'

interface ThemeOption {
  value: Theme
  label: string
  subtitle: string
  badgeText?: string
  badgeColor?: string
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    value: 'light',
    label: 'Light',
    subtitle: 'Giao diện sáng rực rỡ',
    badgeText: 'Mặt trời',
    badgeColor: 'bg-amber-100 text-amber-700 border border-amber-300 dark:bg-amber-900/60 dark:text-amber-300 dark:border-amber-500/40',
  },
  {
    value: 'dark',
    label: 'Dark',
    subtitle: 'Giao diện đêm huyền ảo',
    badgeText: 'Mặt trăng',
    badgeColor: 'bg-indigo-100 text-indigo-700 border border-indigo-300 dark:bg-indigo-900/60 dark:text-indigo-300 dark:border-indigo-500/40',
  },
  {
    value: 'zyricon',
    label: 'Zyricon',
    subtitle: 'Tím neon & Cosmic Aura',
    badgeText: 'Vũ trụ',
    badgeColor: 'bg-purple-100 text-purple-700 border border-purple-300 dark:bg-purple-900/60 dark:text-purple-300 dark:border-purple-500/40 zyricon:bg-[#3B2568]/50 zyricon:text-[#C27595] zyricon:border-[#C27595]/40',
  },
]

/**
 * Mặt Trời: Inspired by Pngtree Bright Sun Symbol Clipart (ID 21192188)
 * Radiating golden-orange sunburst rays, glowing corona, specular highlight & rich warmth.
 */
function BrightSunIcon({ className = 'w-4 h-4', idPrefix = 'sun' }: { className?: string; idPrefix?: string }) {
  const coreGradId = `${idPrefix}-core-grad`
  const rayGradId = `${idPrefix}-ray-grad`
  const glowId = `${idPrefix}-glow`

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={coreGradId} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="30%" stopColor="#FDE047" />
          <stop offset="70%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </radialGradient>
        <linearGradient id={rayGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
        <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="1" floodColor="#F59E0B" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* 8 Primary Diamond Sunburst Rays */}
      <g filter={`url(#${glowId})`}>
        {/* Ray 0 deg (Top) */}
        <path d="M16 1.5 L17.6 6.5 L16 8 L14.4 6.5 Z" fill={`url(#${rayGradId})`} />
        {/* Ray 45 deg (Top-Right) */}
        <path d="M26.2 5.8 L24.3 10.4 L22.4 9.6 L23.5 7.7 Z" fill={`url(#${rayGradId})`} />
        {/* Ray 90 deg (Right) */}
        <path d="M30.5 16 L25.5 17.6 L24 16 L25.5 14.4 Z" fill={`url(#${rayGradId})`} />
        {/* Ray 135 deg (Bottom-Right) */}
        <path d="M26.2 26.2 L23.5 24.3 L22.4 22.4 L24.3 21.6 Z" fill={`url(#${rayGradId})`} />
        {/* Ray 180 deg (Bottom) */}
        <path d="M16 30.5 L14.4 25.5 L16 24 L17.6 25.5 Z" fill={`url(#${rayGradId})`} />
        {/* Ray 225 deg (Bottom-Left) */}
        <path d="M5.8 26.2 L7.7 21.6 L9.6 22.4 L8.5 24.3 Z" fill={`url(#${rayGradId})`} />
        {/* Ray 270 deg (Left) */}
        <path d="M1.5 16 L6.5 14.4 L8 16 L6.5 17.6 Z" fill={`url(#${rayGradId})`} />
        {/* Ray 315 deg (Top-Left) */}
        <path d="M5.8 5.8 L8.5 7.7 L9.6 9.6 L7.7 10.4 Z" fill={`url(#${rayGradId})`} />

        {/* Radiating sunburst dots */}
        <circle cx="21.5" cy="5.5" r="0.85" fill="#FDE047" />
        <circle cx="26.5" cy="10.5" r="0.85" fill="#FDE047" />
        <circle cx="26.5" cy="21.5" r="0.85" fill="#FDE047" />
        <circle cx="21.5" cy="26.5" r="0.85" fill="#FDE047" />
        <circle cx="10.5" cy="26.5" r="0.85" fill="#FDE047" />
        <circle cx="5.5" cy="21.5" r="0.85" fill="#FDE047" />
        <circle cx="5.5" cy="10.5" r="0.85" fill="#FDE047" />
        <circle cx="10.5" cy="5.5" r="0.85" fill="#FDE047" />
      </g>

      {/* Outer Corona Glow Ring */}
      <circle cx="16" cy="16" r="8.2" fill="#FEF08A" opacity="0.3" />

      {/* Sun Center Body */}
      <circle cx="16" cy="16" r="7.5" fill={`url(#${coreGradId})`} stroke="#F59E0B" strokeWidth="0.5" />

      {/* Specular Curved Highlight */}
      <path
        d="M11 12 C11 9.5 13 8.5 15.5 8.5 C16.2 8.5 15.2 9.5 14.2 10.2 C13 11 12.2 12.5 12 14 C11.5 13.5 11 12.8 11 12 Z"
        fill="#FFFFFF"
        opacity="0.7"
      />
    </svg>
  )
}

/**
 * Mặt Trăng: Inspired by Pinterest Celestial Crescent Moon (Pin 892416482434107357)
 * Celestial crescent moon with glowing twilight gradient, soft craters, inner arc, and sparkling starbursts.
 */
function CelestialMoonIcon({ className = 'w-4 h-4', idPrefix = 'moon' }: { className?: string; idPrefix?: string }) {
  const bodyGradId = `${idPrefix}-body-grad`
  const craterGradId = `${idPrefix}-crater-grad`
  const glowId = `${idPrefix}-glow`

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={bodyGradId} x1="15%" y1="10%" x2="85%" y2="90%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="35%" stopColor="#C7D2FE" />
          <stop offset="70%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>
        <linearGradient id={craterGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4338CA" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#312E81" stopOpacity="0.7" />
        </linearGradient>
        <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodColor="#818CF8" floodOpacity="0.6" />
        </filter>
      </defs>

      {/* Twilight ambient aura */}
      <circle cx="15" cy="16" r="11" fill="#818CF8" opacity="0.12" />

      {/* Crescent Moon Body */}
      <path
        filter={`url(#${glowId})`}
        d="M21 4.5 C14.2 5.5 9 11.2 9 18 C9 24.8 14.5 30 21.5 30.5 C16.5 28.5 13.5 23.5 13.5 18 C13.5 12.2 16.8 7 21 4.5 Z"
        fill={`url(#${bodyGradId})`}
      />

      {/* Moon Craters */}
      <circle cx="14" cy="14" r="1.4" fill={`url(#${craterGradId})`} opacity="0.6" />
      <circle cx="16.5" cy="20.5" r="1.8" fill={`url(#${craterGradId})`} opacity="0.5" />
      <circle cx="14.5" cy="24" r="1" fill={`url(#${craterGradId})`} opacity="0.55" />

      {/* Inner delicate glow arc */}
      <path
        d="M19 6.5 C15.5 8 13.5 11.5 13.5 15.5"
        stroke="#FFFFFF"
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.6"
      />

      {/* Main 4-point Celestial Sparkle */}
      <path
        d="M23.5 10 L24.3 12.2 L26.5 13 L24.3 13.8 L23.5 16 L22.7 13.8 L20.5 13 L22.7 12.2 Z"
        fill="#FDF4FF"
        stroke="#C7D2FE"
        strokeWidth="0.3"
      />

      {/* Small Star Sparkle */}
      <path
        d="M25 21 L25.5 22.3 L26.8 22.8 L25.5 23.3 L25 24.6 L24.5 23.3 L23.2 22.8 L24.5 22.3 Z"
        fill="#E0E7FF"
      />

      {/* Star Dots */}
      <circle cx="21" cy="26" r="0.8" fill="#F8FAFC" />
      <circle cx="18.5" cy="4" r="0.6" fill="#F8FAFC" />
    </svg>
  )
}

/**
 * Zyricon Cosmic Aura: Dragon & Stardust Starburst
 */
function ZyriconCosmicIcon({ className = 'w-4 h-4', idPrefix = 'zyricon' }: { className?: string; idPrefix?: string }) {
  const coreGradId = `${idPrefix}-core-grad`
  const glowId = `${idPrefix}-glow`

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={coreGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F7F3F6" />
          <stop offset="30%" stopColor="#C27595" />
          <stop offset="70%" stopColor="#98578D" />
          <stop offset="100%" stopColor="#3B2568" />
        </linearGradient>
        <filter id={glowId} x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#C27595" floodOpacity="0.75" />
        </filter>
      </defs>

      {/* Glowing Orbit Rings */}
      <ellipse
        cx="16"
        cy="16"
        rx="12"
        ry="4.5"
        transform="rotate(-25 16 16)"
        stroke="#C27595"
        strokeWidth="0.8"
        strokeDasharray="1.5 2.5"
        opacity="0.6"
      />
      <ellipse
        cx="16"
        cy="16"
        rx="12"
        ry="4.5"
        transform="rotate(35 16 16)"
        stroke="#98578D"
        strokeWidth="0.8"
        opacity="0.4"
      />

      {/* Cosmic 4-Point Emblem Core */}
      <path
        filter={`url(#${glowId})`}
        d="M16 3 L18.5 12.5 L28 15 L18.5 17.5 L16 27 L13.5 17.5 L4 15 L13.5 12.5 Z"
        fill={`url(#${coreGradId})`}
      />

      {/* Core Diamond Sparkle */}
      <circle cx="16" cy="15" r="2.5" fill="#FFFFFF" opacity="0.9" />

      {/* Cosmic Stardust particles */}
      <circle cx="24" cy="7" r="0.9" fill="#C27595" />
      <circle cx="8" cy="23" r="0.8" fill="#F7F3F6" />
      <circle cx="25" cy="23" r="0.7" fill="#C4A5B8" />
    </svg>
  )
}

function ThemeIcon({
  theme,
  className = 'w-4 h-4',
  idPrefix,
}: {
  theme: Theme
  className?: string
  idPrefix?: string
}) {
  const autoId = useId()
  const prefix = idPrefix || autoId.replace(/:/g, '')

  if (theme === 'light') {
    return <BrightSunIcon className={className} idPrefix={prefix} />
  }

  if (theme === 'dark') {
    return <CelestialMoonIcon className={className} idPrefix={prefix} />
  }

  return <ZyriconCosmicIcon className={className} idPrefix={prefix} />
}

export function ThemeSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const optionRefs = useRef<(HTMLDivElement | null)[]>([])
  const rafIdRef = useRef<number | null>(null)

  const currentTheme = useThemeStore((state) => state.theme)
  const setTheme = useThemeStore((state) => state.setTheme)

  const currentOption =
    THEME_OPTIONS.find((opt) => opt.value === currentTheme) || THEME_OPTIONS[1]

  const closeDropdown = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
    setIsOpen(false)
    setFocusedIndex(-1)
  }, [])

  const openDropdown = useCallback(
    (initialIndex?: number) => {
      setIsOpen(true)
      const activeIdx = THEME_OPTIONS.findIndex((opt) => opt.value === currentTheme)
      const targetIdx =
        initialIndex !== undefined ? initialIndex : activeIdx >= 0 ? activeIdx : 0
      setFocusedIndex(targetIdx)
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
      }
      rafIdRef.current = requestAnimationFrame(() => {
        optionRefs.current[targetIdx]?.focus()
        rafIdRef.current = null
      })
    },
    [currentTheme]
  )

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [])

  const selectTheme = useCallback(
    (theme: Theme) => {
      executeThemeTransition(() => {
        setTheme(theme)
      }, triggerRef.current)
      closeDropdown()
      triggerRef.current?.focus()
    },
    [setTheme, closeDropdown]
  )

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        closeDropdown()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, closeDropdown])

  const handleContainerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape' && isOpen) {
      e.preventDefault()
      closeDropdown()
      triggerRef.current?.focus()
    }
  }

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      openDropdown()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      openDropdown(THEME_OPTIONS.length - 1)
    }
  }

  const handleOptionKeyDown = (
    e: React.KeyboardEvent<HTMLDivElement>,
    optionValue: Theme,
    index: number
  ) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const nextIndex = (index + 1) % THEME_OPTIONS.length
      setFocusedIndex(nextIndex)
      optionRefs.current[nextIndex]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prevIndex = (index - 1 + THEME_OPTIONS.length) % THEME_OPTIONS.length
      setFocusedIndex(prevIndex)
      optionRefs.current[prevIndex]?.focus()
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      selectTheme(optionValue)
    } else if (e.key === 'Tab') {
      closeDropdown()
    }
  }

  return (
    <div
      ref={containerRef}
      onKeyDown={handleContainerKeyDown}
      className="relative inline-block text-left shrink-0 z-50"
    >
      {/* Premium Capsule Trigger Button (Harmonized with ModelSelector anatomy) */}
      <button
        id="theme-selector-btn"
        ref={triggerRef}
        type="button"
        data-theme-value={currentTheme}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls="theme-selector-listbox"
        aria-label={`Giao diện: ${currentOption.label} - Chuyển sang giao diện khác`}
        title={`Giao diện: ${currentOption.label}`}
        onClick={() => {
          if (isOpen) {
            closeDropdown()
          } else {
            openDropdown()
          }
        }}
        onKeyDown={handleTriggerKeyDown}
        className="theme-selector-trigger group relative flex h-9 items-center gap-1.5 sm:gap-2 rounded-full border border-white/20 dark:border-white/15 px-2.5 sm:px-3.5 py-1.5 text-xs font-medium text-white shadow-xs cursor-pointer select-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:focus-visible:ring-indigo-400 zyricon:focus-visible:ring-[#C27595] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#131923] zyricon:focus-visible:ring-offset-[#07040B] focus-visible:outline-none"
      >
        {/* Glow underlay blur */}
        <span className="theme-selector-glow" aria-hidden="true" />

        {/* Theme Micro Icon Badge */}
        <span
          data-testid="theme-trigger-icon"
          className="theme-selector-icon-badge relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white p-0.5 text-[11px] font-bold ring-1 ring-white/60 shadow-[0_0_8px_rgba(255,255,255,0.4)] select-none overflow-hidden"
          aria-hidden="true"
        >
          <ThemeIcon theme={currentTheme} className="w-full h-full" idPrefix="trigger" />
        </span>

        {/* Theme Label Prefix */}
        <span className="hidden sm:inline text-xs font-normal text-white/80 select-none">
          Theme:
        </span>

        {/* Selected Theme Name */}
        <span className="theme-selector-name max-w-[100px] truncate font-semibold text-white tracking-tight">
          {currentOption.label}
        </span>

        {/* Animated Smooth Chevron */}
        <svg
          className={`theme-selector-chevron h-3.5 w-3.5 text-white/90 transition-transform duration-200 ease-out motion-reduce:transition-none ${
            isOpen ? 'rotate-180 text-white' : 'group-hover:text-white'
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu Popover with Arrow */}
      {isOpen && (
        <div
          id="theme-selector-listbox"
          role="listbox"
          tabIndex={-1}
          aria-labelledby="theme-selector-btn"
          className="theme-selector-popover absolute right-0 top-full mt-3 z-50 w-72 sm:w-80 rounded-2xl border border-slate-200/90 dark:border-white/10 zyricon:border-[#694788]/35 bg-white/95 dark:bg-[#131923]/96 zyricon:bg-[#120B1C]/96 p-2 shadow-2xl backdrop-blur-xl animate-dropdown-fade origin-top-right focus:outline-none"
        >
          {/* Header Bar matching ModelSelector header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-white/[0.06] zyricon:border-[#694788]/30 mb-1 select-none">
            <div className="flex items-center gap-1.5">
              <span className="text-amber-500 dark:text-indigo-400 zyricon:text-[#C27595] text-xs">✦</span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 zyricon:text-[#C4A5B8]">
                Tùy chọn giao diện
              </span>
            </div>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 zyricon:bg-[#3B2568]/40 text-slate-600 dark:text-slate-300 zyricon:text-[#C27595]">
              3 giao diện
            </span>
          </div>

          {/* Options List */}
          <div className="space-y-1.5 p-1" role="presentation">
            {THEME_OPTIONS.map((opt, index) => {
              const isSelected = currentTheme === opt.value
              const isFocused = focusedIndex === index

              return (
                <div
                  key={opt.value}
                  id={`theme-option-${opt.value}`}
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={0}
                  onClick={() => selectTheme(opt.value)}
                  onKeyDown={(e) => handleOptionKeyDown(e, opt.value, index)}
                  onMouseEnter={() => setFocusedIndex(index)}
                  ref={(el) => {
                    optionRefs.current[index] = el
                  }}
                  className={`theme-option-card group relative flex items-center justify-between w-full p-2.5 rounded-xl border text-left cursor-pointer select-none transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-amber-500/80 dark:focus-visible:ring-indigo-400/80 zyricon:focus-visible:ring-[#C27595] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#131923] zyricon:focus-visible:ring-offset-[#120B1C] ${
                    isSelected
                      ? 'border-amber-400/80 dark:border-indigo-400/40 zyricon:border-[#C27595]/50 bg-gradient-to-r from-amber-50/95 via-orange-50/60 to-amber-50/30 dark:from-indigo-950/40 dark:to-purple-950/20 zyricon:from-[#3B2568]/50 zyricon:to-[#20103A]/70 shadow-xs'
                      : 'border-transparent hover:border-amber-300/60 dark:hover:border-white/10 zyricon:hover:border-[#694788]/30 hover:bg-amber-50/50 dark:hover:bg-white/[0.04] zyricon:hover:bg-[#3B2568]/20'
                  } ${
                    isFocused && !isSelected
                      ? 'border-amber-300/80 dark:border-white/20 zyricon:border-[#98578D]/50 bg-amber-50/40 dark:bg-white/[0.04] zyricon:bg-[#3B2568]/20 ring-1 ring-amber-400/60 dark:ring-white/20 zyricon:ring-[#98578D]/50'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Rich Micro Icon Badge */}
                    <div
                      className={`theme-card-icon relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-xs overflow-hidden ${
                        opt.value === 'light'
                          ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40'
                          : opt.value === 'dark'
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40'
                          : 'bg-purple-50 dark:bg-purple-950/40 zyricon:bg-[#1D132D] border border-purple-200 dark:border-purple-800/40 zyricon:border-[#694788]/40'
                      }`}
                    >
                      <ThemeIcon theme={opt.value} className="w-6 h-6" idPrefix={`option-${opt.value}`} />
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold text-sm leading-tight tracking-tight ${
                            isSelected
                              ? 'text-slate-900 dark:text-white zyricon:text-[#F7F3F6]'
                              : 'text-slate-800 dark:text-slate-200 zyricon:text-[#EBDDE9]'
                          }`}
                        >
                          {opt.label}
                        </span>
                        {opt.badgeText && (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${opt.badgeColor}`}>
                            {opt.badgeText}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 zyricon:text-[#C4A5B8] truncate leading-normal mt-0.5">
                        {opt.subtitle}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <span
                      data-testid={`theme-selected-${opt.value}`}
                      className="ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/15 dark:bg-indigo-400/20 zyricon:bg-[#C27595]/20 text-amber-700 dark:text-indigo-300 zyricon:text-[#C27595]"
                      aria-label="Đang chọn"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default ThemeSelector
