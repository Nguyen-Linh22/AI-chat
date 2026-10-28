import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { SearchChatButton } from './SearchChatButton'

describe('SearchChatButton', () => {
  it('should render expanded button with label and shortcut hint', () => {
    const handleClick = vi.fn()
    render(<SearchChatButton onClick={handleClick} isCollapsed={false} />)

    const btn = screen.getByRole('button', { name: /Tìm kiếm cuộc trò chuyện/i })
    expect(btn).toBeInTheDocument()
    expect(screen.getByText('Tìm kiếm cuộc trò chuyện')).toBeInTheDocument()

    fireEvent.click(btn)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should render collapsed button with icon, title, and aria-label', () => {
    const handleClick = vi.fn()
    render(<SearchChatButton onClick={handleClick} isCollapsed={true} />)

    const btn = screen.getByRole('button', { name: 'Tìm kiếm cuộc trò chuyện' })
    expect(btn).toBeInTheDocument()
    expect(btn).toHaveAttribute('title', expect.stringContaining('Tìm kiếm cuộc trò chuyện'))
    expect(screen.queryByText('Tìm kiếm cuộc trò chuyện')).not.toBeInTheDocument()

    fireEvent.click(btn)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should have focus-visible ring classes on both states', () => {
    const { rerender } = render(<SearchChatButton onClick={vi.fn()} isCollapsed={false} />)
    const expandedBtn = screen.getByRole('button', { name: /Tìm kiếm cuộc trò chuyện/i })
    expect(expandedBtn.className).toContain('focus-visible:ring-2')
    expect(expandedBtn.className).toContain('focus-visible:ring-[#1B8F3D]/50')

    rerender(<SearchChatButton onClick={vi.fn()} isCollapsed={true} />)
    const collapsedBtn = screen.getByRole('button', { name: 'Tìm kiếm cuộc trò chuyện' })
    expect(collapsedBtn.className).toContain('focus-visible:ring-2')
    expect(collapsedBtn.className).toContain('focus-visible:ring-[#1B8F3D]/50')
  })
})
