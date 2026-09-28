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
})
