import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import MessageBubble from './MessageBubble'
import { useThemeStore } from '../stores/themeStore'

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

  describe('M5.1 — Layout, Avatar & Accessibility', () => {
    it('should render AI avatar and sender label for assistant messages', () => {
      render(<MessageBubble role="ai" content="AI message" />)

      const avatar = screen.getByTestId('ai-avatar')
      expect(avatar).toBeInTheDocument()
      expect(avatar).toHaveAttribute('aria-label', 'AI Avatar')
      expect(screen.getByText('AI')).toBeInTheDocument()
      expect(screen.queryByTestId('user-avatar')).not.toBeInTheDocument()
    })

    it('should render User avatar and sender label for user messages', () => {
      render(<MessageBubble role="user" content="User message" />)

      const avatar = screen.getByTestId('user-avatar')
      expect(avatar).toBeInTheDocument()
      expect(avatar).toHaveAttribute('aria-label', 'User Avatar')
      expect(screen.getByText('Bạn')).toBeInTheDocument()
      expect(screen.queryByTestId('ai-avatar')).not.toBeInTheDocument()
    })

    it('should render markdown typography elements (headings, lists, blockquotes) with proper hierarchy', () => {
      const markdown = `# Title 1\n\n## Title 2\n\n### Title 3\n\n#### Title 4\n\n> Trích dẫn mẫu\n\n- Danh sách không thứ tự\n\n1. Danh sách có thứ tự`

      render(<MessageBubble role="ai" content={markdown} />)

      expect(screen.getByRole('heading', { level: 1, name: 'Title 1' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 2, name: 'Title 2' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3, name: 'Title 3' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 4, name: 'Title 4' })).toBeInTheDocument()
      expect(screen.getByText('Trích dẫn mẫu')).toBeInTheDocument()
      expect(screen.getByText('Danh sách không thứ tự')).toBeInTheDocument()
      expect(screen.getByText('Danh sách có thứ tự')).toBeInTheDocument()
    })

    it('should provide accessible live announcement when copy action succeeds', async () => {
      const user = userEvent.setup()
      const writeTextMock = vi
        .spyOn(navigator.clipboard, 'writeText')
        .mockResolvedValue(undefined)

      render(<MessageBubble role="ai" content="Nội dung kiểm tra a11y" />)

      const copyBtn = screen.getByRole('button', { name: /Copy/i })
      await user.click(copyBtn)

      const announcement = screen.getByText('Đã sao chép nội dung vào khay nhớ tạm')
      expect(announcement).toBeInTheDocument()
      expect(announcement).toHaveAttribute('aria-live', 'polite')
      expect(screen.getByText('Đã copy')).toBeInTheDocument()

      writeTextMock.mockRestore()
    })

    it('should strip streaming cursor symbol from copied clipboard text', async () => {
      const user = userEvent.setup()
      const writeTextMock = vi
        .spyOn(navigator.clipboard, 'writeText')
        .mockResolvedValue(undefined)

      render(<MessageBubble role="ai" content="Nội dung đang sinh ▌" />)

      const copyBtn = screen.getByRole('button', { name: /Copy/i })
      await user.click(copyBtn)

      expect(writeTextMock).toHaveBeenCalledWith('Nội dung đang sinh')

      writeTextMock.mockRestore()
    })
  })

  describe('M5.2 — Markdown Rendering, Code Blocks & Tables', () => {
    describe('Markdown Tables', () => {
      const sampleTable = `| Ngôn ngữ | Loại hình | Năm ra đời |\n| :--- | :--- | :--- |\n| TypeScript | Typed JS | 2012 |\n| Python | Dynamic | 1991 |`

      it('should render GFM table with thead, tbody, rows, and columns correctly', () => {
        render(<MessageBubble role="ai" content={sampleTable} />)

        expect(screen.getByRole('table')).toBeInTheDocument()
        expect(screen.getByText('Ngôn ngữ')).toBeInTheDocument()
        expect(screen.getByText('Loại hình')).toBeInTheDocument()
        expect(screen.getByText('Năm ra đời')).toBeInTheDocument()
        expect(screen.getByText('TypeScript')).toBeInTheDocument()
        expect(screen.getByText('Python')).toBeInTheDocument()
      })

      it('should wrap table in container with overflow-x-auto and max-w-full', () => {
        render(<MessageBubble role="ai" content={sampleTable} />)

        const container = screen.getByTestId('table-container')
        expect(container).toBeInTheDocument()
        expect(container).toHaveClass('overflow-x-auto')
        expect(container).toHaveClass('max-w-full')
      })

      it('should apply appropriate styling classes to header and cells', () => {
        render(<MessageBubble role="ai" content={sampleTable} />)

        const headerCell = screen.getByText('Ngôn ngữ')
        expect(headerCell.tagName).toBe('TH')
        expect(headerCell).toHaveClass('font-semibold')

        const bodyCell = screen.getByText('TypeScript')
        expect(bodyCell.tagName).toBe('TD')
        expect(bodyCell).toHaveClass('align-middle')
      })

      it('should preserve all content and formatting in wide tables with many columns', () => {
        const wideTable = `| C1 | C2 | C3 | C4 | C5 | C6 |\n| --- | --- | --- | --- | --- | --- |\n| V1 [Link](https://example.com) | V2 **Bold** | V3 *Italic* | V4 \`code\` | V5 | V6 Long Content |`

        render(<MessageBubble role="ai" content={wideTable} />)

        expect(screen.getByText('V1')).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Link' })).toHaveAttribute('href', 'https://example.com')
        expect(screen.getByText('Bold')).toBeInTheDocument()
        expect(screen.getByText('Italic')).toBeInTheDocument()
        expect(screen.getByText('code')).toBeInTheDocument()
        expect(screen.getByText('V6 Long Content')).toBeInTheDocument()
      })
    })

    describe('Code Blocks', () => {
      it('should display language badge with python', () => {
        render(
          <MessageBubble
            role="ai"
            content={'```python\nprint("Hello Python")\n```'}
          />
        )

        const badge = screen.getByTestId('code-language-badge')
        expect(badge).toBeInTheDocument()
        expect(badge).toHaveTextContent('python')
      })

      it('should display language badge with typescript', () => {
        render(
          <MessageBubble
            role="ai"
            content={'```typescript\nconst message: string = "Hello TS"\n```'}
          />
        )

        const badge = screen.getByTestId('code-language-badge')
        expect(badge).toBeInTheDocument()
        expect(badge).toHaveTextContent('typescript')
      })

      it('should display neutral "Code" badge when no language metadata is provided', () => {
        render(
          <MessageBubble
            role="ai"
            content={'```\nplain text code block\n```'}
          />
        )

        const badge = screen.getByTestId('code-language-badge')
        expect(badge).toBeInTheDocument()
        expect(badge).toHaveTextContent('Code')
      })

      it('should copy source code correctly without header or buttons', async () => {
        const user = userEvent.setup()
        const writeTextMock = vi
          .spyOn(navigator.clipboard, 'writeText')
          .mockResolvedValue(undefined)

        render(
          <MessageBubble
            role="ai"
            content={'```python\ndef greet():\n    return "hi"\n```'}
          />
        )

        const copyButtons = screen.getAllByRole('button', { name: /Copy/i })
        // First copy button is on the code block header
        await user.click(copyButtons[0])

        expect(writeTextMock).toHaveBeenCalledWith('def greet():\n    return "hi"')
        expect(screen.getByText('Copied')).toBeInTheDocument()

        writeTextMock.mockRestore()
      })

      it('should not include streaming cursor ▌ in copied code block text', async () => {
        const user = userEvent.setup()
        const writeTextMock = vi
          .spyOn(navigator.clipboard, 'writeText')
          .mockResolvedValue(undefined)

        render(
          <MessageBubble
            role="ai"
            content={'```javascript\nconst streamed = true ▌\n```'}
          />
        )

        const copyButtons = screen.getAllByRole('button', { name: /Copy/i })
        await user.click(copyButtons[0])

        expect(writeTextMock).toHaveBeenCalledWith('const streamed = true')

        writeTextMock.mockRestore()
      })
    })

    describe('Dark/Light Mode Syntax Highlighting', () => {
      it('should render code block with dark theme when dark mode is active', () => {
        useThemeStore.getState().setTheme('dark')

        render(
          <MessageBubble
            role="ai"
            content={'```python\nprint("dark mode")\n```'}
          />
        )

        const codeBlock = screen.getByTestId('code-block')
        expect(codeBlock).toHaveAttribute('data-theme', 'dark')
      })

      it('should render code block with light theme when light mode is active', () => {
        useThemeStore.getState().setTheme('light')

        render(
          <MessageBubble
            role="ai"
            content={'```python\nprint("light mode")\n```'}
          />
        )

        const codeBlock = screen.getByTestId('code-block')
        expect(codeBlock).toHaveAttribute('data-theme', 'light')
      })

      it('should switch theme without losing code content', () => {
        useThemeStore.getState().setTheme('dark')

        const { rerender } = render(
          <MessageBubble
            role="ai"
            content={'```typescript\nconst status = "preserved"\n```'}
          />
        )

        expect(screen.getByTestId('code-block')).toHaveAttribute('data-theme', 'dark')
        expect(screen.getByTestId('code-block')).toHaveTextContent('const status = "preserved"')

        act(() => {
          useThemeStore.getState().setTheme('light')
        })

        rerender(
          <MessageBubble
            role="ai"
            content={'```typescript\nconst status = "preserved"\n```'}
          />
        )

        expect(screen.getByTestId('code-block')).toHaveAttribute('data-theme', 'light')
        expect(screen.getByTestId('code-block')).toHaveTextContent('const status = "preserved"')
      })
    })

    describe('Inline Code & Differentiation', () => {
      it('should render inline code with distinct monospace styling', () => {
        render(
          <MessageBubble
            role="ai"
            content="Sử dụng lệnh `npm run dev` để khởi chạy."
          />
        )

        const inlineCode = screen.getByText('npm run dev')
        expect(inlineCode.tagName).toBe('CODE')
        expect(inlineCode).toHaveClass('font-mono')
        expect(inlineCode).toHaveClass('rounded-md')
      })

      it('should not confuse inline code with code block or render code header for inline code', () => {
        render(
          <MessageBubble
            role="ai"
            content="Biến `apiKey` là cần thiết."
          />
        )

        expect(screen.queryByTestId('code-block')).not.toBeInTheDocument()
        expect(screen.queryByTestId('code-language-badge')).not.toBeInTheDocument()
        expect(screen.getByText('apiKey').tagName).toBe('CODE')
      })
    })
  })
})
