import { create } from 'zustand'

export type Theme = 'dark' | 'light' | 'zyricon'

interface ThemeState {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  syncThemeForRoute: (pathname?: string) => void
}

function getInitialTheme(): Theme {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('theme')
      if (saved === 'light' || saved === 'dark' || saved === 'zyricon') {
        return saved
      }
    } catch {
      // Ignore localStorage access errors
    }
  }
  return 'dark'
}

export function isWorkspacePath(pathname?: string): boolean {
  const path =
    typeof pathname === 'string'
      ? pathname
      : typeof window !== 'undefined' && window.location
        ? window.location.pathname
        : ''

  const clean = path.split('?')[0].split('#')[0].replace(/\/+/g, '/')

  if (/^\/chat(?:\/[^/]+)?\/?$/.test(clean)) {
    return true
  }

  if (/^\/c\/[^/]+\/?$/.test(clean)) {
    return true
  }

  return false
}

export function applyThemeToDocument(theme: Theme, pathname?: string) {
  if (typeof document !== 'undefined') {
    const root = document.documentElement
    const effectiveTheme: Theme =
      theme === 'zyricon' && !isWorkspacePath(pathname) ? 'dark' : theme

    if (effectiveTheme === 'zyricon') {
      root.classList.add('dark', 'zyricon')
      root.classList.remove('light')
    } else if (effectiveTheme === 'dark') {
      root.classList.add('dark')
      root.classList.remove('light', 'zyricon')
    } else {
      root.classList.remove('dark', 'zyricon')
      root.classList.add('light')
    }
    root.setAttribute('data-theme', effectiveTheme)
    try {
      localStorage.setItem('theme', theme)
    } catch {
      // Ignore localStorage access errors
    }
  }
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const initialTheme = getInitialTheme()
  applyThemeToDocument(initialTheme)

  return {
    theme: initialTheme,
    toggleTheme: () =>
      set((state) => {
        const nextTheme: Theme = state.theme === 'dark' ? 'light' : 'dark'
        applyThemeToDocument(nextTheme)
        return { theme: nextTheme }
      }),
    setTheme: (nextTheme) => {
      applyThemeToDocument(nextTheme)
      set({ theme: nextTheme })
    },
    syncThemeForRoute: (pathname?: string) => {
      applyThemeToDocument(get().theme, pathname)
    },
  }
})
