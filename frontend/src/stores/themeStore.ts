import { create } from 'zustand'

export type Theme = 'dark' | 'light'

interface ThemeState {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

function getInitialTheme(): Theme {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('theme')
      if (saved === 'light' || saved === 'dark') {
        return saved
      }
    } catch {
      // Ignore localStorage access errors
    }
  }
  return 'dark'
}

export function applyThemeToDocument(theme: Theme) {
  if (typeof document !== 'undefined') {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.remove('dark')
      root.classList.add('light')
    }
    root.setAttribute('data-theme', theme)
    try {
      localStorage.setItem('theme', theme)
    } catch {
      // Ignore localStorage access errors
    }
  }
}

export const useThemeStore = create<ThemeState>((set) => {
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
  }
})
