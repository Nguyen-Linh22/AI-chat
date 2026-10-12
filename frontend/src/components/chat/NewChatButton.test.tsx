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
})
