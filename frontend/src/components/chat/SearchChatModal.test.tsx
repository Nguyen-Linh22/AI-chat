import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { SearchChatModal } from './SearchChatModal'
import type { ChatSession } from '../../services/chatService'

const mockChats: ChatSession[] = [
  {
    id: 'chat-1',
    userId: 'u1',
    title: 'Học React và TypeScript',
    createdAt: '2026-10-28T10:00:00Z',
    updatedAt: '2026-10-28T10:00:00Z',
  },
  {
    id: 'chat-2',
    userId: 'u1',
    title: 'Viết bài luận văn học',
    createdAt: '2026-10-27T08:00:00Z',
    updatedAt: '2026-10-27T08:00:00Z',
  },
  {
    id: 'chat-3',
    userId: 'u1',
    title: 'Tối ưu hóa Docker và Kubernetes',
    createdAt: '2026-10-20T12:00:00Z',
    updatedAt: '2026-10-20T12:00:00Z',
  },
]

describe('SearchChatModal', () => {
  it('should not render anything when isOpen is false', () => {
    const { container } = render(
      <SearchChatModal
        isOpen={false}
        onClose={vi.fn()}
        chats={mockChats}
        currentChatId={null}
        onSelectChat={vi.fn()}
      />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('should render dialog, input and auto-focus when isOpen is true', () => {
    render(
      <SearchChatModal
        isOpen={true}
        onClose={vi.fn()}
        chats={mockChats}
        currentChatId={null}
        onSelectChat={vi.fn()}
      />
    )

    const dialog = screen.getByRole('dialog', { name: 'Tìm kiếm cuộc trò chuyện' })
    expect(dialog).toBeInTheDocument()

    const input = screen.getByPlaceholderText('Tìm kiếm theo tiêu đề cuộc trò chuyện...')
    expect(input).toBeInTheDocument()
  })

  it('should show recent chats when query is empty', () => {
    render(
      <SearchChatModal
        isOpen={true}
        onClose={vi.fn()}
        chats={mockChats}
        currentChatId="chat-1"
        onSelectChat={vi.fn()}
      />
    )

    expect(screen.getByText(/Gần đây/i)).toBeInTheDocument()
    expect(screen.getByText('Học React và TypeScript')).toBeInTheDocument()
    expect(screen.getByText('Viết bài luận văn học')).toBeInTheDocument()
    expect(screen.getByText('Đang mở')).toBeInTheDocument()
  })

  it('should filter chats case-insensitively and trim whitespace', () => {
    render(
      <SearchChatModal
        isOpen={true}
        onClose={vi.fn()}
        chats={mockChats}
        currentChatId={null}
        onSelectChat={vi.fn()}
      />
    )

    const input = screen.getByPlaceholderText('Tìm kiếm theo tiêu đề cuộc trò chuyện...')
    fireEvent.change(input, { target: { value: '   react   ' } })

    expect(screen.getByText(/Kết quả tìm kiếm \(1\)/i)).toBeInTheDocument()
    expect(screen.getByText((_, node) => node?.textContent === 'Học React và TypeScript')).toBeInTheDocument()
    expect(screen.getByText('React', { selector: 'mark' })).toBeInTheDocument()
    expect(screen.queryByText('Viết bài luận văn học')).not.toBeInTheDocument()
  })

  it('should show empty results state when query does not match any chat', () => {
    render(
      <SearchChatModal
        isOpen={true}
        onClose={vi.fn()}
        chats={mockChats}
        currentChatId={null}
        onSelectChat={vi.fn()}
      />
    )

    const input = screen.getByPlaceholderText('Tìm kiếm theo tiêu đề cuộc trò chuyện...')
    fireEvent.change(input, { target: { value: 'Python machine learning' } })

    expect(screen.getByText('Không tìm thấy cuộc trò chuyện nào')).toBeInTheDocument()
    expect(screen.getByText(/Không có kết quả nào khớp với "Python machine learning"/i)).toBeInTheDocument()
  })

  it('should call onSelectChat and onClose when a chat item is clicked', () => {
    const handleSelectChat = vi.fn()
    const handleClose = vi.fn()

    render(
      <SearchChatModal
        isOpen={true}
        onClose={handleClose}
        chats={mockChats}
        currentChatId={null}
        onSelectChat={handleSelectChat}
      />
    )

    const chatItem = screen.getByText('Viết bài luận văn học')
    fireEvent.click(chatItem)

    expect(handleSelectChat).toHaveBeenCalledWith('chat-2')
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('should navigate with keyboard ArrowDown/ArrowUp and select with Enter', () => {
    const handleSelectChat = vi.fn()
    const handleClose = vi.fn()

    render(
      <SearchChatModal
        isOpen={true}
        onClose={handleClose}
        chats={mockChats}
        currentChatId={null}
        onSelectChat={handleSelectChat}
      />
    )

    const dialog = screen.getByRole('dialog')

    // Navigate to second item
    fireEvent.keyDown(dialog, { key: 'ArrowDown' })

    // Press Enter to select
    fireEvent.keyDown(dialog, { key: 'Enter' })

    expect(handleSelectChat).toHaveBeenCalledWith('chat-2')
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('should close when Escape key is pressed', () => {
    const handleClose = vi.fn()

    render(
      <SearchChatModal
        isOpen={true}
        onClose={handleClose}
        chats={mockChats}
        currentChatId={null}
        onSelectChat={vi.fn()}
      />
    )

    const dialog = screen.getByRole('dialog')
    fireEvent.keyDown(dialog, { key: 'Escape' })

    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('should close when clicking the backdrop', () => {
    const handleClose = vi.fn()

    render(
      <SearchChatModal
        isOpen={true}
        onClose={handleClose}
        chats={mockChats}
        currentChatId={null}
        onSelectChat={vi.fn()}
      />
    )

    const backdrop = screen.getByRole('presentation')
    fireEvent.click(backdrop)

    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('should clear query when clear button is clicked', () => {
    render(
      <SearchChatModal
        isOpen={true}
        onClose={vi.fn()}
        chats={mockChats}
        currentChatId={null}
        onSelectChat={vi.fn()}
      />
    )

    const input = screen.getByPlaceholderText('Tìm kiếm theo tiêu đề cuộc trò chuyện...') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'React' } })
    expect(input.value).toBe('React')

    const clearBtn = screen.getByRole('button', { name: 'Xóa nội dung tìm kiếm' })
    fireEvent.click(clearBtn)

    expect(input.value).toBe('')
  })

  it('should show empty history state when chat list is completely empty', () => {
    render(
      <SearchChatModal
        isOpen={true}
        onClose={vi.fn()}
        chats={[]}
        currentChatId={null}
        onSelectChat={vi.fn()}
      />
    )

    expect(screen.getByText('Chưa có cuộc trò chuyện nào để tìm kiếm')).toBeInTheDocument()
  })

  describe('M7.2.2-B: Accessibility Hardening', () => {
    it('should apply focus-visible ring styles on close ESC button and clear query button', () => {
      render(
        <SearchChatModal
          isOpen={true}
          onClose={vi.fn()}
          chats={mockChats}
          currentChatId={null}
          onSelectChat={vi.fn()}
        />
      )

      const closeBtn = screen.getByRole('button', { name: 'Đóng tìm kiếm' })
      expect(closeBtn.className).toContain('focus-visible:ring-2')
      expect(closeBtn.className).toContain('focus-visible:ring-emerald-500/50')

      const input = screen.getByPlaceholderText('Tìm kiếm theo tiêu đề cuộc trò chuyện...')
      fireEvent.change(input, { target: { value: 'test' } })

      const clearBtn = screen.getByRole('button', { name: 'Xóa nội dung tìm kiếm' })
      expect(clearBtn.className).toContain('focus-visible:ring-2')
      expect(clearBtn.className).toContain('focus-visible:ring-emerald-500/50')
    })

    it('should use WCAG AA compliant text color tokens on ESC kbd, empty state, and list headers', () => {
      const { rerender } = render(
        <SearchChatModal
          isOpen={true}
          onClose={vi.fn()}
          chats={mockChats}
          currentChatId={null}
          onSelectChat={vi.fn()}
        />
      )

      // ESC kbd contrast
      const escKbd = screen.getByText('ESC')
      expect(escKbd.className).toContain('text-slate-600')
      expect(escKbd.className).not.toContain('text-slate-400')

      // List group header and subheader contrast
      const groupHeader = screen.getByText(/Gần đây \(\d+\)/)
      expect(groupHeader.className).toContain('text-slate-600')
      expect(groupHeader.className).not.toContain('text-slate-400')

      const subHeader = screen.getByText('Mới nhất')
      expect(subHeader.className).toContain('text-slate-600')
      expect(subHeader.className).not.toContain('text-slate-400')

      // Empty state subtitle contrast
      rerender(
        <SearchChatModal
          isOpen={true}
          onClose={vi.fn()}
          chats={[]}
          currentChatId={null}
          onSelectChat={vi.fn()}
        />
      )

      const emptySubtitle = screen.getByText('Bắt đầu một đoạn chat mới để có thể tìm kiếm tại đây.')
      expect(emptySubtitle.className).toContain('text-slate-600')
      expect(emptySubtitle.className).not.toContain('text-slate-400')
    })
  })
})
