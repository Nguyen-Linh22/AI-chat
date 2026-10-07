import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import MessageBubble from './MessageBubble'

describe('MessageBubble', () => {
  it('should render a user message', () => {
    render(
      <MessageBubble
        role="user"
        content="Xin chào"
      />
    )

    expect(screen.getByText('Xin chào')).toBeInTheDocument()
    expect(screen.getByText('Bạn')).toBeInTheDocument()
  })

  it('should render an AI message with Markdown', () => {
    render(
      <MessageBubble
        role="ai"
        content={'## Hello\n\nĐây là **nội dung AI**.'}
      />
    )

    expect(
      screen.getByRole('heading', { level: 2, name: 'Hello' })
    ).toBeInTheDocument()

    expect(screen.getByText('nội dung AI')).toBeInTheDocument()
    expect(screen.getByText('AI')).toBeInTheDocument()
  })

  it('should show streaming state for an AI message', () => {
    render(
      <MessageBubble
        role="ai"
        content="Đang trả lời"
        isStreaming
      />
    )

    expect(screen.getByText('AI')).toBeInTheDocument()
    expect(
      document.querySelector('.ai-typewriter-container')
    ).toBeInTheDocument()

    expect(
      document.querySelector('.ai-cursor')
    ).toBeInTheDocument()
  })

  it('should render attachments as links', () => {
    render(
      <MessageBubble
        role="user"
        content="File đính kèm"
        attachments={[
          {
            id: 'attachment-1',
            fileName: 'document.txt',
            fileUrl: 'https://example.com/document.txt',
            fileType: 'text/plain',
            sizeBytes: '123',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ]}
      />
    )

    const link = screen.getByRole('link', {
      name: /document\.txt/,
    })

    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute(
      'href',
      'https://example.com/document.txt'
    )
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('should copy the message content', async () => {
    const user = userEvent.setup()

    const writeTextMock = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockResolvedValue(undefined)

    render(
      <MessageBubble
        role="ai"
        content="Nội dung cần copy"
      />
    )

    await user.click(
      screen.getByRole('button', {
        name: /Copy/i,
      })
    )

    expect(writeTextMock).toHaveBeenCalledWith(
      'Nội dung cần copy'
    )

    writeTextMock.mockRestore()
  })

  it('should call onRegenerate when regenerate is clicked', async () => {
    const user = userEvent.setup()
    const onRegenerate = vi.fn()

    render(
      <MessageBubble
        role="ai"
        content="Câu trả lời AI"
        onRegenerate={onRegenerate}
      />
    )

    await user.click(
      screen.getByRole('button', {
        name: /Regenerate/i,
      })
    )

    expect(onRegenerate).toHaveBeenCalledTimes(1)
  })

  it('should copy code without Markdown syntax', async () => {
    const user = userEvent.setup()

    const writeTextMock = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockResolvedValue(undefined)

    render(
      <MessageBubble
        role="ai"
        content={'```javascript\nconst answer = 42\n```'}
      />
    )

    const buttons = screen.getAllByRole('button', {
      name: /Copy/i,
    })

    expect(buttons).toHaveLength(2)

    await user.click(buttons[0])

    expect(writeTextMock).toHaveBeenCalledWith(
      'const answer = 42'
    )

    writeTextMock.mockRestore()
  })

  it('should render a Markdown link as a clickable link with target="_blank" and rel="noopener noreferrer"', () => {
    render(
      <MessageBubble
        role="ai"
        content="[GitHub](https://github.com/Nguyen-Linh22/AI-chat)"
      />
    )

    const link = screen.getByRole('link', { name: 'GitHub' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute(
      'href',
      'https://github.com/Nguyen-Linh22/AI-chat'
    )
    expect(link).toHaveTextContent('GitHub')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('should automatically autolink a bare URL into a clickable link', () => {
    render(
      <MessageBubble
        role="ai"
        content="https://github.com/Nguyen-Linh22/AI-chat"
      />
    )

    const link = screen.getByRole('link', {
      name: 'https://github.com/Nguyen-Linh22/AI-chat',
    })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute(
      'href',
      'https://github.com/Nguyen-Linh22/AI-chat'
    )
    expect(link.textContent).toContain('https://github.com/Nguyen-Linh22/AI-chat')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('should render a Markdown link inside normal text without corrupting surrounding content', () => {
    render(
      <MessageBubble
        role="ai"
        content="Visit [Neon](https://neon.tech) for the database."
      />
    )

    expect(screen.getByText(/Visit/)).toBeInTheDocument()
    expect(screen.getByText(/for the database\./)).toBeInTheDocument()

    const link = screen.getByRole('link', { name: 'Neon' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', 'https://neon.tech')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('should render link and preserve cursor behavior during streaming', () => {
    render(
      <MessageBubble
        role="ai"
        content="Visit [Neon](https://neon.tech) for more info."
        isStreaming
      />
    )

    const link = screen.getByRole('link', { name: 'Neon' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', 'https://neon.tech')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')

    expect(document.querySelector('.ai-typewriter-container')).toBeInTheDocument()
    expect(document.querySelector('.ai-cursor')).toBeInTheDocument()
  })

  it('should render a valid Markdown image with exact src and alt', () => {
    render(
      <MessageBubble
        role="ai"
        content="![Sơ đồ kiến trúc](https://example.com/arch.png)"
      />
    )

    const img = screen.getByRole('img', { name: 'Sơ đồ kiến trúc' })
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/arch.png')
    expect(img).toHaveAttribute('alt', 'Sơ đồ kiến trúc')
  })

  it('should set security and performance attributes on valid image', () => {
    render(
      <MessageBubble
        role="ai"
        content="![Sơ đồ kiến trúc](https://example.com/arch.png)"
      />
    )

    const img = screen.getByRole('img', { name: 'Sơ đồ kiến trúc' })
    expect(img).toHaveAttribute('loading', 'lazy')
    expect(img).toHaveAttribute('decoding', 'async')
    expect(img).toHaveAttribute('referrerPolicy', 'no-referrer')
  })

  it('should apply layout and responsive classes to prevent chat overflow', () => {
    render(
      <MessageBubble
        role="ai"
        content="![Sơ đồ kiến trúc](https://example.com/arch.png)"
      />
    )

    const img = screen.getByRole('img', { name: 'Sơ đồ kiến trúc' })
    expect(img).toHaveClass('max-w-full')
    expect(img).toHaveClass('rounded-xl')
    expect(img).toHaveClass('border')
    expect(img).toHaveClass('max-h-96')
  })

  it('should not render image with unsafe scheme like javascript:', () => {
    render(
      <MessageBubble
        role="ai"
        content="![unsafe](javascript:alert(1))"
      />
    )

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('should not render image with unsupported scheme like data: URI', () => {
    render(
      <MessageBubble
        role="ai"
        content="![test](data:image/png;base64,abc)"
      />
    )

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('should fallback to default alt text when alt is empty', () => {
    render(
      <MessageBubble
        role="ai"
        content="![](https://example.com/arch.png)"
      />
    )

    const img = screen.getByRole('img', { name: 'Hình ảnh tài liệu' })
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/arch.png')
    expect(img).toHaveAttribute('alt', 'Hình ảnh tài liệu')
  })

  it('should render image and preserve cursor behavior during streaming', () => {
    render(
      <MessageBubble
        role="ai"
        content="Tài liệu tham khảo:\n\n![Sơ đồ kiến trúc](https://example.com/arch.png)"
        isStreaming
      />
    )

    const img = screen.getByRole('img', { name: 'Sơ đồ kiến trúc' })
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/arch.png')

    expect(document.querySelector('.ai-typewriter-container')).toBeInTheDocument()
    expect(document.querySelector('.ai-cursor')).toBeInTheDocument()
  })

  it('should render Image RAG response with exact URL and security attributes in conversational Markdown', () => {
    const aiContent =
      'Đây là sơ đồ:\n\n![Sơ đồ kiến trúc](https://example.com/architecture.png)'

    render(<MessageBubble role="ai" content={aiContent} />)

    const img = screen.getByRole('img', { name: 'Sơ đồ kiến trúc' })
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute(
      'src',
      'https://example.com/architecture.png'
    )
    expect(img).toHaveAttribute('alt', 'Sơ đồ kiến trúc')
    expect(img).toHaveAttribute('loading', 'lazy')
    expect(img).toHaveAttribute('decoding', 'async')
    expect(img).toHaveAttribute('referrerPolicy', 'no-referrer')
  })
})
