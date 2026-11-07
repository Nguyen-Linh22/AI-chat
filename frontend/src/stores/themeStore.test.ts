import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useThemeStore, applyThemeToDocument, isWorkspacePath } from './themeStore'
import { useAuthStore } from './authStore'
import { useChatStore } from './chatStore'

describe('themeStore & Zyricon theme infrastructure', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
    document.documentElement.removeAttribute('data-theme')
    window.history.pushState({}, '', '/chat')
    useThemeStore.getState().setTheme('dark')
  })

  it('1. Light theme works and sets proper classes and attributes', () => {
    useThemeStore.getState().setTheme('light')
    expect(useThemeStore.getState().theme).toBe('light')
    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.classList.contains('zyricon')).toBe(false)
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(localStorage.getItem('theme')).toBe('light')
  })

  it('2. Dark theme works and sets proper classes and attributes', () => {
    window.history.pushState({}, '', '/chat')
    useThemeStore.getState().setTheme('dark')
    expect(useThemeStore.getState().theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.classList.contains('light')).toBe(false)
    expect(document.documentElement.classList.contains('zyricon')).toBe(false)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('3. Zyricon theme can be selected through the store', () => {
    useThemeStore.getState().setTheme('zyricon')
    expect(useThemeStore.getState().theme).toBe('zyricon')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.classList.contains('zyricon')).toBe(true)
    expect(document.documentElement.classList.contains('light')).toBe(false)
    expect(document.documentElement.getAttribute('data-theme')).toBe('zyricon')
    expect(localStorage.getItem('theme')).toBe('zyricon')
  })

  it('4. Zyricon applies dual-class and data-theme via applyThemeToDocument', () => {
    applyThemeToDocument('zyricon')
    expect(document.documentElement.getAttribute('data-theme')).toBe('zyricon')
    expect(document.documentElement.classList.contains('zyricon')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.classList.contains('light')).toBe(false)
    expect(localStorage.getItem('theme')).toBe('zyricon')
  })

  it('5. applyThemeToDocument sets dark fallback when applied', () => {
    applyThemeToDocument('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.classList.contains('zyricon')).toBe(false)
    expect(document.documentElement.classList.contains('light')).toBe(false)
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('6. Theme switching does not modify unrelated application state (auth & chat)', () => {
    useAuthStore.setState({ user: { id: 'u1', email: 'test@example.com' } })
    useChatStore.setState({ currentChatId: 'chat-123' })

    useThemeStore.getState().setTheme('zyricon')
    expect(useAuthStore.getState().user?.email).toBe('test@example.com')
    expect(useChatStore.getState().currentChatId).toBe('chat-123')

    useThemeStore.getState().setTheme('light')
    expect(useAuthStore.getState().user?.email).toBe('test@example.com')
    expect(useChatStore.getState().currentChatId).toBe('chat-123')

    window.history.pushState({}, '', '/chat')
    useThemeStore.getState().setTheme('dark')
    expect(useAuthStore.getState().user?.email).toBe('test@example.com')
    expect(useChatStore.getState().currentChatId).toBe('chat-123')
  })

  it('7. Switching between all 3 themes transitions classes cleanly without lingering artifacts', () => {
    const root = document.documentElement

    // 1. Start at light
    useThemeStore.getState().setTheme('light')
    expect(root.classList.contains('light')).toBe(true)
    expect(root.classList.contains('dark')).toBe(false)
    expect(root.classList.contains('zyricon')).toBe(false)
    expect(root.getAttribute('data-theme')).toBe('light')

    // 2. Switch to dark
    window.history.pushState({}, '', '/chat')
    useThemeStore.getState().setTheme('dark')
    expect(root.classList.contains('dark')).toBe(true)
    expect(root.classList.contains('light')).toBe(false)
    expect(root.classList.contains('zyricon')).toBe(false)
    expect(root.getAttribute('data-theme')).toBe('dark')

    // 3. Switch to zyricon
    useThemeStore.getState().setTheme('zyricon')
    expect(root.classList.contains('dark')).toBe(true)
    expect(root.classList.contains('zyricon')).toBe(true)
    expect(root.classList.contains('light')).toBe(false)
    expect(root.getAttribute('data-theme')).toBe('zyricon')

    // 4. Switch back to light
    useThemeStore.getState().setTheme('light')
    expect(root.classList.contains('light')).toBe(true)
    expect(root.classList.contains('dark')).toBe(false)
    expect(root.classList.contains('zyricon')).toBe(false)
    expect(root.getAttribute('data-theme')).toBe('light')
  })
})

describe('themeStore module lifecycle & getInitialTheme() restoration', () => {
  beforeEach(() => {
    vi.resetModules()
    localStorage.clear()
    document.documentElement.className = ''
    document.documentElement.removeAttribute('data-theme')
    window.history.pushState({}, '', '/chat')
  })

  it('restores stored "zyricon" value during module/store initialization', async () => {
    localStorage.setItem('theme', 'zyricon')
    const { useThemeStore: freshStore } = await import('./themeStore')

    expect(freshStore.getState().theme).toBe('zyricon')
    expect(document.documentElement.classList.contains('zyricon')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.classList.contains('light')).toBe(false)
    expect(document.documentElement.getAttribute('data-theme')).toBe('zyricon')
  })

  it('restores stored "light" value during module/store initialization', async () => {
    localStorage.setItem('theme', 'light')
    const { useThemeStore: freshStore } = await import('./themeStore')

    expect(freshStore.getState().theme).toBe('light')
    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.classList.contains('zyricon')).toBe(false)
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('restores stored "dark" value during module/store initialization', async () => {
    localStorage.setItem('theme', 'dark')
    const { useThemeStore: freshStore } = await import('./themeStore')

    expect(freshStore.getState().theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.classList.contains('light')).toBe(false)
    expect(document.documentElement.classList.contains('zyricon')).toBe(false)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('falls back to "dark" during module/store initialization when stored value is invalid', async () => {
    localStorage.setItem('theme', 'invalid-nonexistent-theme')
    const { useThemeStore: freshStore } = await import('./themeStore')

    expect(freshStore.getState().theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.classList.contains('zyricon')).toBe(false)
    expect(document.documentElement.classList.contains('light')).toBe(false)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('falls back to "dark" during module/store initialization when stored value is missing', async () => {
    // localStorage is empty (getItem returns null)
    const { useThemeStore: freshStore } = await import('./themeStore')

    expect(freshStore.getState().theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.classList.contains('zyricon')).toBe(false)
    expect(document.documentElement.classList.contains('light')).toBe(false)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  describe('Route Isolation (Chat Workspace vs Login/Register)', () => {
    it('correctly identifies workspace routes vs auth routes', () => {
      // Valid Workspace routes
      expect(isWorkspacePath('/chat')).toBe(true)
      expect(isWorkspacePath('/chat/')).toBe(true)
      expect(isWorkspacePath('/chat/123')).toBe(true)
      expect(isWorkspacePath('/chat/c-xyz-456')).toBe(true)
      expect(isWorkspacePath('/c/123')).toBe(true)
      expect(isWorkspacePath('/c/c-abc-789')).toBe(true)

      // Invalid / non-workspace routes (must NOT match)
      expect(isWorkspacePath('/')).toBe(false)
      expect(isWorkspacePath('')).toBe(false)
      expect(isWorkspacePath('/chatty')).toBe(false)
      expect(isWorkspacePath('/chatty/123')).toBe(false)
      expect(isWorkspacePath('/c')).toBe(false)
      expect(isWorkspacePath('/c/')).toBe(false)
      expect(isWorkspacePath('/chat/123/extra')).toBe(false)
      expect(isWorkspacePath('/login')).toBe(false)
      expect(isWorkspacePath('/login/')).toBe(false)
      expect(isWorkspacePath('/register')).toBe(false)
      expect(isWorkspacePath('/register/')).toBe(false)
      expect(isWorkspacePath('/forgot-password')).toBe(false)
      expect(isWorkspacePath('/settings')).toBe(false)
    })

    it('safely renders standard Dark mode on /login when user theme is Zyricon', () => {
      applyThemeToDocument('zyricon', '/login')

      // DOM must have dark, NOT zyricon
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(document.documentElement.classList.contains('zyricon')).toBe(false)
      expect(document.documentElement.classList.contains('light')).toBe(false)
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')

      // User preference in localStorage is preserved as zyricon
      expect(localStorage.getItem('theme')).toBe('zyricon')
    })

    it('safely renders standard Dark mode on /register when user theme is Zyricon', () => {
      applyThemeToDocument('zyricon', '/register')

      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(document.documentElement.classList.contains('zyricon')).toBe(false)
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
      expect(localStorage.getItem('theme')).toBe('zyricon')
    })

    it('syncThemeForRoute dynamically switches between workspace Zyricon and auth Dark mode', () => {
      useThemeStore.getState().setTheme('zyricon')

      // 1. User navigates to /login
      useThemeStore.getState().syncThemeForRoute('/login')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(document.documentElement.classList.contains('zyricon')).toBe(false)
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
      expect(useThemeStore.getState().theme).toBe('zyricon')
      expect(localStorage.getItem('theme')).toBe('zyricon')

      // 2. User logs in and returns to /chat
      useThemeStore.getState().syncThemeForRoute('/chat')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(document.documentElement.classList.contains('zyricon')).toBe(true)
      expect(document.documentElement.getAttribute('data-theme')).toBe('zyricon')
      expect(useThemeStore.getState().theme).toBe('zyricon')
    })

    it('persisted Zyricon + direct /login initialization results in effective Dark', async () => {
      vi.resetModules()
      window.history.pushState({}, '', '/login')
      localStorage.setItem('theme', 'zyricon')

      const { useThemeStore: freshStore } = await import('./themeStore')

      // Store preference is preserved as zyricon
      expect(freshStore.getState().theme).toBe('zyricon')
      expect(localStorage.getItem('theme')).toBe('zyricon')

      // Effective DOM styling is standard Dark
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(document.documentElement.classList.contains('zyricon')).toBe(false)
      expect(document.documentElement.classList.contains('light')).toBe(false)
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    })

    it('persisted Zyricon + direct /register initialization results in effective Dark', async () => {
      vi.resetModules()
      window.history.pushState({}, '', '/register')
      localStorage.setItem('theme', 'zyricon')

      const { useThemeStore: freshStore } = await import('./themeStore')

      expect(freshStore.getState().theme).toBe('zyricon')
      expect(localStorage.getItem('theme')).toBe('zyricon')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(document.documentElement.classList.contains('zyricon')).toBe(false)
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    })

    it('persisted Zyricon + direct /chat initialization results in Zyricon', async () => {
      vi.resetModules()
      window.history.pushState({}, '', '/chat')
      localStorage.setItem('theme', 'zyricon')

      const { useThemeStore: freshStore } = await import('./themeStore')

      expect(freshStore.getState().theme).toBe('zyricon')
      expect(localStorage.getItem('theme')).toBe('zyricon')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(document.documentElement.classList.contains('zyricon')).toBe(true)
      expect(document.documentElement.getAttribute('data-theme')).toBe('zyricon')
    })

    it('persisted Zyricon + direct /chat/<id> initialization results in Zyricon', async () => {
      vi.resetModules()
      window.history.pushState({}, '', '/chat/session-987')
      localStorage.setItem('theme', 'zyricon')

      const { useThemeStore: freshStore } = await import('./themeStore')

      expect(freshStore.getState().theme).toBe('zyricon')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(document.documentElement.classList.contains('zyricon')).toBe(true)
      expect(document.documentElement.getAttribute('data-theme')).toBe('zyricon')
    })

    it('persisted Zyricon + direct /c/<id> initialization results in Zyricon', async () => {
      vi.resetModules()
      window.history.pushState({}, '', '/c/chat-abc-123')
      localStorage.setItem('theme', 'zyricon')

      const { useThemeStore: freshStore } = await import('./themeStore')

      expect(freshStore.getState().theme).toBe('zyricon')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(document.documentElement.classList.contains('zyricon')).toBe(true)
      expect(document.documentElement.getAttribute('data-theme')).toBe('zyricon')
    })

    it('persisted Zyricon + direct /chatty initialization results in Dark (not workspace)', async () => {
      vi.resetModules()
      window.history.pushState({}, '', '/chatty')
      localStorage.setItem('theme', 'zyricon')

      const { useThemeStore: freshStore } = await import('./themeStore')

      expect(freshStore.getState().theme).toBe('zyricon')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(document.documentElement.classList.contains('zyricon')).toBe(false)
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    })

    it('persisted Zyricon + direct / initialization results in effective Dark', async () => {
      vi.resetModules()
      window.history.pushState({}, '', '/')
      localStorage.setItem('theme', 'zyricon')

      const { useThemeStore: freshStore } = await import('./themeStore')

      // Store preference is preserved as zyricon
      expect(freshStore.getState().theme).toBe('zyricon')
      expect(localStorage.getItem('theme')).toBe('zyricon')

      // Effective DOM styling is standard Dark
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(document.documentElement.classList.contains('zyricon')).toBe(false)
      expect(document.documentElement.classList.contains('light')).toBe(false)
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    })

    it('navigating from / to /chat restores Zyricon', async () => {
      vi.resetModules()
      window.history.pushState({}, '', '/')
      localStorage.setItem('theme', 'zyricon')

      const { useThemeStore: freshStore } = await import('./themeStore')
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
      expect(document.documentElement.classList.contains('zyricon')).toBe(false)
      expect(localStorage.getItem('theme')).toBe('zyricon')

      // Route change to /chat restores Zyricon
      window.history.pushState({}, '', '/chat')
      freshStore.getState().syncThemeForRoute('/chat')

      expect(freshStore.getState().theme).toBe('zyricon')
      expect(localStorage.getItem('theme')).toBe('zyricon')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(document.documentElement.classList.contains('zyricon')).toBe(true)
      expect(document.documentElement.getAttribute('data-theme')).toBe('zyricon')
    })
  })

  describe('index.html inline bootstrap script (direct HTML execution)', () => {
    const htmlPath = path.resolve(__dirname, '../../index.html')
    const htmlContent = fs.readFileSync(htmlPath, 'utf8')
    const match = htmlContent.match(/<script>([\s\S]*?)<\/script>/)
    const bootstrapCode = match ? match[1] : ''

    beforeEach(() => {
      localStorage.clear()
      document.documentElement.className = ''
      document.documentElement.removeAttribute('data-theme')
    })

    function runActualBootstrap() {
      new Function(bootstrapCode)()
    }

    it('verifies inline bootstrap script exists in index.html', () => {
      expect(bootstrapCode.length).toBeGreaterThan(0)
      expect(bootstrapCode).toContain('localStorage.getItem')
    })

    it('bootstrap: applies Dark on /login when stored theme is Zyricon', () => {
      window.history.pushState({}, '', '/login')
      localStorage.setItem('theme', 'zyricon')
      runActualBootstrap()

      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(document.documentElement.classList.contains('zyricon')).toBe(false)
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
      expect(localStorage.getItem('theme')).toBe('zyricon')
    })

    it('bootstrap: applies Dark on /register when stored theme is Zyricon', () => {
      window.history.pushState({}, '', '/register')
      localStorage.setItem('theme', 'zyricon')
      runActualBootstrap()

      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(document.documentElement.classList.contains('zyricon')).toBe(false)
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    })

    it('bootstrap: applies Zyricon on /chat when stored theme is Zyricon', () => {
      window.history.pushState({}, '', '/chat')
      localStorage.setItem('theme', 'zyricon')
      runActualBootstrap()

      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(document.documentElement.classList.contains('zyricon')).toBe(true)
      expect(document.documentElement.getAttribute('data-theme')).toBe('zyricon')
    })

    it('bootstrap: applies Zyricon on /c/<id> when stored theme is Zyricon', () => {
      window.history.pushState({}, '', '/c/chat-xyz-123')
      localStorage.setItem('theme', 'zyricon')
      runActualBootstrap()

      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(document.documentElement.classList.contains('zyricon')).toBe(true)
      expect(document.documentElement.getAttribute('data-theme')).toBe('zyricon')
    })

    it('bootstrap: applies Dark on /chatty when stored theme is Zyricon', () => {
      window.history.pushState({}, '', '/chatty')
      localStorage.setItem('theme', 'zyricon')
      runActualBootstrap()

      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(document.documentElement.classList.contains('zyricon')).toBe(false)
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    })

    it('bootstrap: applies Dark on / when stored theme is Zyricon', () => {
      window.history.pushState({}, '', '/')
      localStorage.setItem('theme', 'zyricon')
      runActualBootstrap()

      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(document.documentElement.classList.contains('zyricon')).toBe(false)
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
      expect(localStorage.getItem('theme')).toBe('zyricon')
    })

    it('bootstrap: applies Light everywhere when stored theme is Light', () => {
      window.history.pushState({}, '', '/login')
      localStorage.setItem('theme', 'light')
      runActualBootstrap()

      expect(document.documentElement.classList.contains('light')).toBe(true)
      expect(document.documentElement.classList.contains('dark')).toBe(false)
      expect(document.documentElement.classList.contains('zyricon')).toBe(false)
      expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    })
  })
})
