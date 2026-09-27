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
})
