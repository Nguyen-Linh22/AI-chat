import { render, screen } from '@testing-library/react'
import { describe, expect, it, beforeEach } from 'vitest'
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

  it('should render theme toggle button with dark mode state by default', () => {
    render(<ThemeToggle />)

    const button = screen.getByRole('button', {
      name: 'Chuyển sang giao diện sáng',
    })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('title', 'Chuyển sang giao diện sáng')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('should toggle from dark to light mode on click', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    const button = screen.getByRole('button', {
      name: 'Chuyển sang giao diện sáng',
    })

    await user.click(button)

    expect(button).toHaveAttribute('aria-label', 'Chuyển sang giao diện tối')
    expect(button).toHaveAttribute('title', 'Chuyển sang giao diện tối')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(localStorage.getItem('theme')).toBe('light')
  })

  it('should toggle from light back to dark mode on subsequent click', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    const button = screen.getByRole('button', {
      name: 'Chuyển sang giao diện sáng',
    })

    // 1st click: dark -> light
    await user.click(button)
    expect(button).toHaveAttribute('aria-label', 'Chuyển sang giao diện tối')

    // 2nd click: light -> dark
    await user.click(button)
    expect(button).toHaveAttribute('aria-label', 'Chuyển sang giao diện sáng')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('should support keyboard focus and activation', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    const button = screen.getByRole('button', {
      name: 'Chuyển sang giao diện sáng',
    })

    button.focus()
    expect(button).toHaveFocus()

    await user.keyboard('{Enter}')
    expect(button).toHaveAttribute('aria-label', 'Chuyển sang giao diện tối')
    expect(document.documentElement.classList.contains('dark')).toBe(false)

    await user.keyboard(' ')
    expect(button).toHaveAttribute('aria-label', 'Chuyển sang giao diện sáng')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('should include id and reduced motion classes on button and icons', () => {
    const { container } = render(<ThemeToggle />)

    const button = screen.getByRole('button', {
      name: 'Chuyển sang giao diện sáng',
    })
    expect(button).toHaveAttribute('id', 'theme-toggle-btn')
    expect(button.className).toContain('motion-reduce:transition-none')

    const icons = container.querySelectorAll('svg')
    expect(icons).toHaveLength(2)
    icons.forEach((icon) => {
      expect(icon.getAttribute('class')).toContain('motion-reduce:transition-none')
      expect(icon.getAttribute('class')).toContain('transition-[transform,opacity]')
    })
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
      const button = screen.getByRole('button', { name: 'Chuyển sang giao diện sáng' })

      await user.click(button)

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

      render(<ThemeToggle />)
      const button = screen.getByRole('button', { name: 'Chuyển sang giao diện sáng' })

      // Mock button bounding rect: left: 200, top: 100, width: 36, height: 36
      // Expected center: x = 200 + 18 = 218px, y = 100 + 18 = 118px
      vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({
        left: 200,
        top: 100,
        width: 36,
        height: 36,
        right: 236,
        bottom: 136,
        x: 200,
        y: 100,
        toJSON: () => {},
      })

      // Click with arbitrary coordinates far away (e.g. clientX: 999, clientY: 888)
      await user.click(button, { clientX: 999, clientY: 888 })

      expect(document.documentElement.style.getPropertyValue('--vt-x')).toBe('218px')
      expect(document.documentElement.style.getPropertyValue('--vt-y')).toBe('118px')

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
      const button = screen.getByRole('button', { name: 'Chuyển sang giao diện sáng' })

      await user.click(button)

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
      const button = screen.getByRole('button', { name: 'Chuyển sang giao diện sáng' })

      await user.click(button)

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
      const button = screen.getByRole('button', { name: 'Chuyển sang giao diện sáng' })

      // First click: dark -> light
      await user.click(button)
      expect(document.documentElement.classList.contains('dark')).toBe(false)

      // Second click while first transition is still in-flight
      await user.click(button)
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
      const button = screen.getByRole('button', { name: 'Chuyển sang giao diện sáng' })

      // 1. First click: initiates T1
      await user.click(button)
      expect(document.documentElement.classList.contains('view-transition-active')).toBe(true)
      expect(document.documentElement.style.getPropertyValue('--vt-x')).not.toBe('')

      // 2. Second click before T1 finishes: triggers T2 and aborts T1
      await user.click(button)
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
