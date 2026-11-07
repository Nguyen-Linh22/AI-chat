// @vitest-environment jsdom
import { render, screen, act, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ChatBackground } from './ChatBackground'
import { useThemeStore } from '../../stores/themeStore'

describe('ChatBackground — Zyricon 3D Integration & Theme Switching', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
    document.documentElement.removeAttribute('data-theme')
    // Set window.location.pathname to workspace
    Object.defineProperty(window, 'location', {
      value: { pathname: '/chat', search: '', hash: '' },
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    act(() => {
      useThemeStore.getState().setTheme('dark')
    })
  })

  it('renders with accessibility and non-blocking pointer-events attributes', () => {
    act(() => {
      useThemeStore.getState().setTheme('dark')
    })

    render(<ChatBackground />)

    const bg = screen.getByTestId('chat-background')
    expect(bg).toBeInTheDocument()
    expect(bg).toHaveAttribute('aria-hidden', 'true')
    expect(bg).toHaveClass('pointer-events-none')
  })

  it('renders 3 CSS star layers in Dark theme', () => {
    act(() => {
      useThemeStore.getState().setTheme('dark')
    })

    const { container } = render(<ChatBackground />)

    expect(container.querySelector('.chat-stars-layer-1')).toBeInTheDocument()
    expect(container.querySelector('.chat-stars-layer-2')).toBeInTheDocument()
    expect(container.querySelector('.chat-stars-layer-3')).toBeInTheDocument()
  })

  it('renders Celestial Daylight background in Light theme', () => {
    act(() => {
      useThemeStore.getState().setTheme('light')
    })

    const { container } = render(<ChatBackground />)

    expect(screen.getByTestId('celestial-daylight-bg')).toBeInTheDocument()
    expect(container.querySelector('.chat-stars-layer-1')).not.toBeInTheDocument()
    expect(container.querySelector('.chat-stars-layer-2')).not.toBeInTheDocument()
    expect(container.querySelector('.chat-stars-layer-3')).not.toBeInTheDocument()
  })

  it('renders Zyricon cosmic fallback or lazy canvas when in Zyricon theme in workspace', async () => {
    act(() => {
      useThemeStore.getState().setTheme('zyricon')
    })

    const { container } = render(<ChatBackground />)

    // In Zyricon mode, CSS stars layers must NOT be rendered
    expect(container.querySelector('.chat-stars-layer-1')).not.toBeInTheDocument()
    expect(container.querySelector('.chat-stars-layer-2')).not.toBeInTheDocument()
    expect(container.querySelector('.chat-stars-layer-3')).not.toBeInTheDocument()

    // Must show either CosmicStaticFallback (Suspense fallback) or the lazy-loaded canvas container
    await waitFor(() => {
      const hasCosmicElement =
        container.querySelector('[data-testid="cosmic-static-fallback"]') !== null ||
        container.querySelector('[data-testid="zyricon-cosmic-container"]') !== null
      expect(hasCosmicElement).toBe(true)
    })
  })

  it('switches between CSS stars and Cosmic canvas dynamically when toggling themes', async () => {
    const { container, rerender } = render(<ChatBackground />)

    // Initial Dark: CSS stars
    act(() => {
      useThemeStore.getState().setTheme('dark')
    })
    rerender(<ChatBackground />)
    expect(container.querySelector('.chat-stars-layer-1')).toBeInTheDocument()

    // Switch to Zyricon: no CSS stars
    act(() => {
      useThemeStore.getState().setTheme('zyricon')
    })
    rerender(<ChatBackground />)
    expect(container.querySelector('.chat-stars-layer-1')).not.toBeInTheDocument()

    // Switch back to Light: Celestial Daylight returns
    act(() => {
      useThemeStore.getState().setTheme('light')
    })
    rerender(<ChatBackground />)
    expect(screen.getByTestId('celestial-daylight-bg')).toBeInTheDocument()
    expect(container.querySelector('.chat-stars-layer-1')).not.toBeInTheDocument()
  })

  it('does not render 3D canvas when on a non-workspace route like /login', () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/login', search: '', hash: '' },
      writable: true,
      configurable: true,
    })

    act(() => {
      useThemeStore.getState().setTheme('zyricon')
    })

    const { container } = render(<ChatBackground />)

    // Non-workspace path keeps classic CSS stars rather than heavy 3D canvas
    expect(container.querySelector('.chat-stars-layer-1')).toBeInTheDocument()
  })

  it('keeps the exact same container and does not remount on parent re-renders or className updates', async () => {
    act(() => {
      useThemeStore.getState().setTheme('zyricon')
    })

    const { rerender } = render(<ChatBackground className="test-initial" />)
    const initialBg = screen.getByTestId('chat-background')

    // Simulate sidebar collapse toggle re-rendering ChatArea
    rerender(<ChatBackground className="test-updated" />)
    const updatedBg = screen.getByTestId('chat-background')

    expect(updatedBg).toBe(initialBg)
  })
})
