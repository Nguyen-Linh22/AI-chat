import { render, screen, act } from '@testing-library/react'
import { describe, expect, it, beforeEach, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import ThemeSelector from './ThemeSelector'
import { useThemeStore } from '../stores/themeStore'

describe('ThemeSelector (M2 — 3-Theme Dropdown Selector)', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
    document.documentElement.removeAttribute('data-theme')
    window.history.pushState({}, '', '/chat')
    useThemeStore.getState().setTheme('dark')
  })

  it('1. Renders trigger button with default Dark theme label and icon', () => {
    render(<ThemeSelector />)

    const trigger = screen.getByRole('button', { name: /Giao diện: Dark/i })
    expect(trigger).toBeInTheDocument()
    expect(trigger).toHaveAttribute('id', 'theme-selector-btn')
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByText('Dark')).toBeInTheDocument()
  })

  it('2. Clicking trigger opens dropdown popover displaying all 3 theme options', async () => {
    const user = userEvent.setup()
    render(<ThemeSelector />)

    const trigger = screen.getByRole('button', { name: /Giao diện: Dark/i })
    await user.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const listbox = screen.getByRole('listbox')
    expect(listbox).toBeInTheDocument()
    expect(listbox).toHaveAttribute('id', 'theme-selector-listbox')

    // Verify all 3 options exist
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(3)
    expect(screen.getByRole('option', { name: /Light/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Dark/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Zyricon/i })).toBeInTheDocument()
  })

  it('3. Visual checkmark indicates the active theme in the dropdown', async () => {
    const user = userEvent.setup()
    render(<ThemeSelector />)

    await user.click(screen.getByRole('button', { name: /Giao diện: Dark/i }))

    const darkOption = screen.getByRole('option', { name: /Dark/i })
    expect(darkOption).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('theme-selected-dark')).toBeInTheDocument()

    const lightOption = screen.getByRole('option', { name: /Light/i })
    expect(lightOption).toHaveAttribute('aria-selected', 'false')
    expect(screen.queryByTestId('theme-selected-light')).toBeNull()

    const zyriconOption = screen.getByRole('option', { name: /Zyricon/i })
    expect(zyriconOption).toHaveAttribute('aria-selected', 'false')
    expect(screen.queryByTestId('theme-selected-zyricon')).toBeNull()
  })

  it('4. Selecting Light theme switches store, updates DOM, persists to localStorage, and closes dropdown', async () => {
    const user = userEvent.setup()
    render(<ThemeSelector />)

    await user.click(screen.getByRole('button', { name: /Giao diện: Dark/i }))
    await user.click(screen.getByRole('option', { name: /Light/i }))

    expect(useThemeStore.getState().theme).toBe('light')
    expect(localStorage.getItem('theme')).toBe('light')
    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.classList.contains('zyricon')).toBe(false)
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')

    // Dropdown closed
    expect(screen.queryByRole('listbox')).toBeNull()
    // Trigger label updated
    expect(screen.getByRole('button', { name: /Giao diện: Light/i })).toBeInTheDocument()
  })

  it('5. Selecting Zyricon theme applies dual class .dark.zyricon, data-theme="zyricon", and persists', async () => {
    const user = userEvent.setup()
    render(<ThemeSelector />)

    await user.click(screen.getByRole('button', { name: /Giao diện: Dark/i }))
    await user.click(screen.getByRole('option', { name: /Zyricon/i }))

    expect(useThemeStore.getState().theme).toBe('zyricon')
    expect(localStorage.getItem('theme')).toBe('zyricon')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.classList.contains('zyricon')).toBe(true)
    expect(document.documentElement.classList.contains('light')).toBe(false)
    expect(document.documentElement.getAttribute('data-theme')).toBe('zyricon')

    // Dropdown closed and trigger reflects Zyricon
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(screen.getByRole('button', { name: /Giao diện: Zyricon/i })).toBeInTheDocument()
  })

  it('6. Selecting Dark theme from Zyricon removes .zyricon and retains .dark', async () => {
    const user = userEvent.setup()
    useThemeStore.getState().setTheme('zyricon')
    render(<ThemeSelector />)

    await user.click(screen.getByRole('button', { name: /Giao diện: Zyricon/i }))
    await user.click(screen.getByRole('option', { name: /Dark/i }))

    expect(useThemeStore.getState().theme).toBe('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.classList.contains('zyricon')).toBe(false)
    expect(document.documentElement.classList.contains('light')).toBe(false)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('7. Keyboard navigation on trigger: ArrowDown opens dropdown', async () => {
    const user = userEvent.setup()
    render(<ThemeSelector />)

    const trigger = screen.getByRole('button', { name: /Giao diện: Dark/i })
    trigger.focus()
    await user.keyboard('{ArrowDown}')

    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('8. Keyboard navigation within options: ArrowDown, ArrowUp, and Enter to select', async () => {
    const user = userEvent.setup()
    render(<ThemeSelector />)

    const trigger = screen.getByRole('button', { name: /Giao diện: Dark/i })
    trigger.focus()
    await user.keyboard('{Enter}')

    expect(screen.getByRole('listbox')).toBeInTheDocument()

    // Currently focused on dark (index 1). ArrowDown moves to zyricon (index 2)
    const zyriconOpt = screen.getByRole('option', { name: /Zyricon/i })
    await user.keyboard('{ArrowDown}')
    expect(zyriconOpt).toHaveFocus()

    // Press Enter to select Zyricon
    await user.keyboard('{Enter}')

    expect(useThemeStore.getState().theme).toBe('zyricon')
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(trigger).toHaveFocus()
  })

  it('9. Escape key closes dropdown and restores focus to trigger button', async () => {
    const user = userEvent.setup()
    render(<ThemeSelector />)

    const trigger = screen.getByRole('button', { name: /Giao diện: Dark/i })
    await user.click(trigger)
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(trigger).toHaveFocus()
  })

  it('10. Click outside closes the dropdown without changing theme', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <div data-testid="outside-element">Outside</div>
        <ThemeSelector />
      </div>
    )

    await user.click(screen.getByRole('button', { name: /Giao diện: Dark/i }))
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    await user.click(screen.getByTestId('outside-element'))
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(useThemeStore.getState().theme).toBe('dark')
  })

  it('11. View Transitions: invokes startViewTransition when available', async () => {
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

    render(<ThemeSelector />)

    await user.click(screen.getByRole('button', { name: /Giao diện: Dark/i }))
    await user.click(screen.getByRole('option', { name: /Zyricon/i }))

    expect(startViewTransitionMock).toHaveBeenCalled()
    expect(useThemeStore.getState().theme).toBe('zyricon')
  })

  it('12. Respects prefers-reduced-motion by skipping startViewTransition', async () => {
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

    render(<ThemeSelector />)

    await user.click(screen.getByRole('button', { name: /Giao diện: Dark/i }))
    await user.click(screen.getByRole('option', { name: /Light/i }))

    expect(startViewTransitionMock).not.toHaveBeenCalled()
    expect(useThemeStore.getState().theme).toBe('light')
  })

  it('13. Synchronizes when theme store changes externally', () => {
    const { rerender } = render(<ThemeSelector />)

    expect(screen.getByRole('button', { name: /Giao diện: Dark/i })).toBeInTheDocument()

    act(() => {
      useThemeStore.getState().setTheme('zyricon')
    })
    rerender(<ThemeSelector />)

    expect(screen.getByRole('button', { name: /Giao diện: Zyricon/i })).toBeInTheDocument()
  })
})
