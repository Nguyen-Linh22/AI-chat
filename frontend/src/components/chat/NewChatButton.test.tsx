import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { NewChatButton } from './NewChatButton'

describe('NewChatButton', () => {
  it('should render expanded button with text and plus icon', () => {
    const handleClick = vi.fn()
    render(<NewChatButton onClick={handleClick} isCollapsed={false} />)

    const btn = screen.getByRole('button', { name: /Chat mới/i })
    expect(btn).toBeInTheDocument()
    expect(screen.getByText('Chat mới')).toBeInTheDocument()

    fireEvent.click(btn)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should render collapsed button with title and aria-label', () => {
    const handleClick = vi.fn()
    render(<NewChatButton onClick={handleClick} isCollapsed={true} />)

    const btn = screen.getByRole('button', { name: 'Chat mới' })
    expect(btn).toBeInTheDocument()
    expect(btn).toHaveAttribute('title', 'Chat mới')
    expect(screen.queryByText('Chat mới')).not.toBeInTheDocument()

    fireEvent.click(btn)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should render decorative elements with aria-hidden="true"', () => {
    const { container } = render(<NewChatButton onClick={vi.fn()} isCollapsed={false} />)
    const decoratives = container.querySelectorAll('[aria-hidden="true"]')
    expect(decoratives.length).toBeGreaterThanOrEqual(4)
  })

  it('should have focus-visible ring indicator on expanded and collapsed buttons', () => {
    const { rerender } = render(<NewChatButton onClick={vi.fn()} isCollapsed={false} />)
    const expandedBtn = screen.getByRole('button', { name: /Chat mới/i })
    expect(expandedBtn.className).toContain('focus-visible:ring-2')
    expect(expandedBtn.className).toContain('focus-visible:ring-[#1B8F3D]/50')
    expect(expandedBtn.className).not.toContain('focus:ring-2')

    rerender(<NewChatButton onClick={vi.fn()} isCollapsed={true} />)
    const collapsedBtn = screen.getByRole('button', { name: 'Chat mới' })
    expect(collapsedBtn.className).toContain('focus-visible:ring-2')
    expect(collapsedBtn.className).toContain('focus-visible:ring-[#1B8F3D]/50')
    expect(collapsedBtn.className).not.toContain('focus:ring-2')
  })
})
