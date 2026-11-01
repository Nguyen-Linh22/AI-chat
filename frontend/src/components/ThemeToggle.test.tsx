import { render, screen, act } from '@testing-library/react'
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import ThemeToggle from './ThemeToggle'
import { useThemeStore } from '../stores/themeStore'

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    document.documentElement.removeAttribute('data-theme')
    // Reset store to default dark mode
    useThemeStore.getState().setTheme('dark')
  })

  it('1. Light theme renders unchecked switch', () => {
    useThemeStore.getState().setTheme('light')
    render(<ThemeToggle />)

    const checkbox = screen.getByRole('checkbox', {
      name: 'Chuyển sang giao diện tối',
    })
    expect(checkbox).toBeInTheDocument()
    expect(checkbox).not.toBeChecked()
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('2. Dark theme renders checked switch', () => {
    useThemeStore.getState().setTheme('dark')
    render(<ThemeToggle />)

    const checkbox = screen.getByRole('checkbox', {
      name: 'Chuyển sang giao diện sáng',
    })
    expect(checkbox).toBeInTheDocument()
    expect(checkbox).toBeChecked()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('3 & 4. Clicking switches Dark to Light and Light to Dark', async () => {
    const user = userEvent.setup()
    useThemeStore.getState().setTheme('dark')
    render(<ThemeToggle />)

    const checkbox = screen.getByRole('checkbox', {
      name: 'Chuyển sang giao diện sáng',
    })

    // 1st click: Dark -> Light
    await user.click(checkbox)
    expect(checkbox).not.toBeChecked()
    expect(checkbox).toHaveAttribute('aria-label', 'Chuyển sang giao diện tối')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(localStorage.getItem('theme')).toBe('light')
    expect(useThemeStore.getState().theme).toBe('light')

    // 2nd click: Light -> Dark
    await user.click(checkbox)
    expect(checkbox).toBeChecked()
    expect(checkbox).toHaveAttribute('aria-label', 'Chuyển sang giao diện sáng')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
    expect(useThemeStore.getState().theme).toBe('dark')
  })

  it('5. State stays synchronized with the existing theme store', () => {
    const { rerender } = render(<ThemeToggle />)

    const checkbox = screen.getByRole('checkbox', {
      name: 'Chuyển sang giao diện sáng',
    })
    expect(checkbox).toBeChecked()

    // External store update
    act(() => {
      useThemeStore.getState().setTheme('light')
    })
    rerender(<ThemeToggle />)

    expect(checkbox).not.toBeChecked()
    expect(checkbox).toHaveAttribute('aria-label', 'Chuyển sang giao diện tối')
  })

  it('6. Keyboard Space and Enter activation works', async () => {
    const user = userEvent.setup()
    useThemeStore.getState().setTheme('dark')
    render(<ThemeToggle />)

    const checkbox = screen.getByRole('checkbox', {
      name: 'Chuyển sang giao diện sáng',
    })

    checkbox.focus()
    expect(checkbox).toHaveFocus()

    // Press Space: dark -> light
    await user.keyboard(' ')
    expect(checkbox).not.toBeChecked()
    expect(document.documentElement.classList.contains('dark')).toBe(false)

    // Press Enter: light -> dark
    await user.keyboard('{Enter}')
    expect(checkbox).toBeChecked()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('7. Accessible label exists and native checkbox is not display:none', () => {
    const { container } = render(<ThemeToggle />)

    const checkbox = screen.getByRole('checkbox', {
      name: 'Chuyển sang giao diện sáng',
    })
    expect(checkbox).toBeInTheDocument()
    expect(checkbox).toHaveAttribute('aria-label', 'Chuyển sang giao diện sáng')
    expect(checkbox.classList.contains('sr-only')).toBe(true)
    // Confirm not using inaccessible display:none inline
    expect(checkbox).not.toHaveStyle({ display: 'none' })

    const label = container.querySelector('#theme-toggle-btn')
    expect(label).toBeInTheDocument()
    expect(label).toHaveAttribute('title', 'Chuyển sang giao diện sáng')
  })

  it('8. Existing theme persistence remains unchanged', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    const checkbox = screen.getByRole('checkbox', {
      name: 'Chuyển sang giao diện sáng',
    })

    await user.click(checkbox)
    expect(localStorage.getItem('theme')).toBe('light')

    await user.click(checkbox)
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('9. SVG visual structure and reduced motion elements are present', () => {
    const { container } = render(<ThemeToggle />)

    const svg = container.querySelector('svg.theme-toggle-svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute('viewBox', '0 0 69.667 44')

    // Animated elements are present
    expect(container.querySelector('.theme-toggle-container')).toBeInTheDocument()
    expect(container.querySelector('.theme-toggle-button')).toBeInTheDocument()
    expect(container.querySelector('.theme-toggle-sun')).toBeInTheDocument()
    expect(container.querySelector('.theme-toggle-moon')).toBeInTheDocument()
    expect(container.querySelector('.theme-toggle-cloud')).toBeInTheDocument()
    expect(container.querySelector('.theme-toggle-stars')).toBeInTheDocument()
    expect(container.querySelector('.theme-toggle-patches')).toBeInTheDocument()
  })

  describe('Experiment B — Circular Reveal View Transitions', () => {
    afterEach(() => {
      vi.restoreAllMocks()
      delete (document as { startViewTransition?: unknown }).startViewTransition
      delete (window as { matchMedia?: unknown }).matchMedia
      document.documentElement.classList.remove('view-transition-active', 'vt-css-fallback')
      document.documentElement.style.removeProperty('--vt-x')
      document.documentElement.style.removeProperty('--vt-y')
      document.documentElement.style.removeProperty('--vt-r')
    })

    it('should invoke startViewTransition and update theme when API is supported', async () => {
      const user = userEvent.setup()
      let callbackExecuted = false
      const startViewTransitionMock = vi.fn((cb?: () => void) => {
        if (cb) {
          cb()
          callbackExecuted = true
        }
        return {
          ready: Promise.resolve(),
          finished: Promise.resolve(),
          updateCallbackDone: Promise.resolve(),
          skipTransition: vi.fn(),
        } as unknown as ViewTransition
      })
      document.startViewTransition = startViewTransitionMock

      render(<ThemeToggle />)
      const checkbox = screen.getByRole('checkbox', { name: 'Chuyển sang giao diện sáng' })

      await user.click(checkbox)

      expect(startViewTransitionMock).toHaveBeenCalledTimes(1)
      expect(callbackExecuted).toBe(true)
      expect(document.documentElement.classList.contains('dark')).toBe(false)
      expect(document.documentElement.getAttribute('data-theme')).toBe('light')
      expect(localStorage.getItem('theme')).toBe('light')
    })

    it('should calculate circular reveal center from button center, ignoring click coordinates', async () => {
      const user = userEvent.setup()
      let resolveFinished: () => void
      const finishedPromise = new Promise<void>((resolve) => {
        resolveFinished = resolve
      })

      const startViewTransitionMock = vi.fn((cb?: () => void) => {
        cb?.()
        return {
          ready: Promise.resolve(),
          finished: finishedPromise,
          updateCallbackDone: Promise.resolve(),
          skipTransition: vi.fn(),
        } as unknown as ViewTransition
      })
      document.startViewTransition = startViewTransitionMock

      const { container } = render(<ThemeToggle />)
      const label = container.querySelector('#theme-toggle-btn') as HTMLElement
      const checkbox = screen.getByRole('checkbox', { name: 'Chuyển sang giao diện sáng' })

      // Mock label bounding rect: left: 200, top: 100, width: 51, height: 32
      // Expected center: x = 200 + 25.5 = 225.5px, y = 100 + 16 = 116px
      vi.spyOn(label, 'getBoundingClientRect').mockReturnValue({
        left: 200,
        top: 100,
        width: 51,
        height: 32,
        right: 251,
        bottom: 132,
        x: 200,
        y: 100,
        toJSON: () => {},
      })

      // Click with arbitrary coordinates far away (e.g. clientX: 999, clientY: 888)
      await user.click(checkbox, { clientX: 999, clientY: 888 })

      expect(document.documentElement.style.getPropertyValue('--vt-x')).toBe('225.5px')
      expect(document.documentElement.style.getPropertyValue('--vt-y')).toBe('116px')

      resolveFinished!()
    })

    it('should not call startViewTransition and switch theme immediately when prefers-reduced-motion is enabled', async () => {
      const user = userEvent.setup()
      const startViewTransitionMock = vi.fn((cb?: () => void) => {
        cb?.()
        return {
          ready: Promise.resolve(),
          finished: Promise.resolve(),
          updateCallbackDone: Promise.resolve(),
          skipTransition: vi.fn(),
        } as unknown as ViewTransition
      })
      document.startViewTransition = startViewTransitionMock

      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))

      render(<ThemeToggle />)
      const checkbox = screen.getByRole('checkbox', { name: 'Chuyển sang giao diện sáng' })

      await user.click(checkbox)

      expect(startViewTransitionMock).not.toHaveBeenCalled()
      expect(document.documentElement.classList.contains('dark')).toBe(false)
      expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    })

    it('should handle startViewTransition errors gracefully without double toggling', async () => {
      const user = userEvent.setup()
      document.startViewTransition = vi.fn(() => {
        throw new Error('View transition failed')
      })

      render(<ThemeToggle />)
      const checkbox = screen.getByRole('checkbox', { name: 'Chuyển sang giao diện sáng' })

      await user.click(checkbox)

      // Verify theme was toggled exactly once to light
      expect(document.documentElement.classList.contains('dark')).toBe(false)
      expect(document.documentElement.getAttribute('data-theme')).toBe('light')
      expect(document.documentElement.classList.contains('view-transition-active')).toBe(false)
    })

    it('should call skipTransition on active transition when toggled rapidly', async () => {
      const user = userEvent.setup()
      const skipSpy = vi.fn()
      let resolveFinished: () => void
      const finishedPromise = new Promise<void>((resolve) => {
        resolveFinished = resolve
      })

      document.startViewTransition = vi.fn((cb?: () => void) => {
        cb?.()
        return {
          ready: Promise.resolve(),
          finished: finishedPromise,
          updateCallbackDone: Promise.resolve(),
          skipTransition: skipSpy,
        } as unknown as ViewTransition
      })

      render(<ThemeToggle />)
      const checkbox = screen.getByRole('checkbox', { name: 'Chuyển sang giao diện sáng' })

      // First click: dark -> light
      await user.click(checkbox)
      expect(document.documentElement.classList.contains('dark')).toBe(false)

      // Second click while first transition is still in-flight
      await user.click(checkbox)
      expect(skipSpy).toHaveBeenCalledTimes(1)
      expect(document.documentElement.classList.contains('dark')).toBe(true)

      resolveFinished!()
    })

    it('should not allow an aborted transition cleanup to remove active transition classes and CSS variables (F-01)', async () => {
      const user = userEvent.setup()
      const skipSpy = vi.fn()

      let resolveT1Finished: () => void
      const t1FinishedPromise = new Promise<void>((resolve) => {
        resolveT1Finished = resolve
      })

      let resolveT2Finished: () => void
      const t2FinishedPromise = new Promise<void>((resolve) => {
        resolveT2Finished = resolve
      })

      let transitionCallCount = 0

      document.startViewTransition = vi.fn((cb?: () => void) => {
        transitionCallCount++
        cb?.()
        if (transitionCallCount === 1) {
          return {
            ready: Promise.resolve(),
            finished: t1FinishedPromise,
            updateCallbackDone: Promise.resolve(),
            skipTransition: skipSpy,
          } as unknown as ViewTransition
        }
        return {
          ready: Promise.resolve(),
          finished: t2FinishedPromise,
          updateCallbackDone: Promise.resolve(),
          skipTransition: vi.fn(),
        } as unknown as ViewTransition
      })

      render(<ThemeToggle />)
      const checkbox = screen.getByRole('checkbox', { name: 'Chuyển sang giao diện sáng' })

      // 1. First click: initiates T1
      await user.click(checkbox)
      expect(document.documentElement.classList.contains('view-transition-active')).toBe(true)
      expect(document.documentElement.style.getPropertyValue('--vt-x')).not.toBe('')

      // 2. Second click before T1 finishes: triggers T2 and aborts T1
      await user.click(checkbox)
      expect(skipSpy).toHaveBeenCalledTimes(1)
      // T2 has set its variables and class
      expect(document.documentElement.classList.contains('view-transition-active')).toBe(true)
      expect(document.documentElement.style.getPropertyValue('--vt-x')).not.toBe('')

      // 3. T1 finishes (aborted) before T2 finishes
      resolveT1Finished!()
      await Promise.resolve() // let T1 finished microtask run

      // 4. Verify T1 cleanup did NOT remove T2's class and CSS variables
      expect(document.documentElement.classList.contains('view-transition-active')).toBe(true)
      expect(document.documentElement.style.getPropertyValue('--vt-x')).not.toBe('')
      expect(document.documentElement.style.getPropertyValue('--vt-y')).not.toBe('')
      expect(document.documentElement.style.getPropertyValue('--vt-r')).not.toBe('')

      // 5. T2 finishes
      resolveT2Finished!()
      await Promise.resolve() // let T2 finished microtask run

      // 6. Verify T2 final cleanup removed class and CSS variables completely
      expect(document.documentElement.classList.contains('view-transition-active')).toBe(false)
      expect(document.documentElement.style.getPropertyValue('--vt-x')).toBe('')
      expect(document.documentElement.style.getPropertyValue('--vt-y')).toBe('')
      expect(document.documentElement.style.getPropertyValue('--vt-r')).toBe('')
    })
  })
})
