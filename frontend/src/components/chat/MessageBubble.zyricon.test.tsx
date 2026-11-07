import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import MessageBubble from '../MessageBubble'
import { useThemeStore } from '../../stores/themeStore'

describe('MessageBubble — Zyricon Theme (Milestone M6)', () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: 'zyricon' })
  })

  it('renders Zyricon User message bubble with dark purple gradient and purple border', () => {
    render(
      <MessageBubble
        role="user"
        content="Thiết kế giao diện Zyricon mới"
      />
    )

    const userText = screen.getByText('Thiết kế giao diện Zyricon mới')
    const bubble = userText.closest('.rounded-2xl')

    expect(bubble).toBeInTheDocument()
    expect(bubble?.className).toContain('from-[#3B2568]/80')
    expect(bubble?.className).toContain('via-[#2D1B4E]/90')
    expect(bubble?.className).toContain('to-[#20103A]/95')
    expect(bubble?.className).toContain('border-[#694788]/40')
    expect(bubble?.className).toContain('text-[#F7F3F6]')

    // User avatar
    const userAvatar = screen.getByTestId('user-avatar')
    expect(userAvatar.className).toContain('bg-[#3B2568]/50')
    expect(userAvatar.className).toContain('border-[#694788]/40')

    // User label
    const userLabel = screen.getByText('Bạn')
    expect(userLabel.className).toContain('text-[#C4A5B8]')
  })

  it('renders Zyricon AI message bubble with deep background and cosmic AI avatar', () => {
    render(
      <MessageBubble
        role="ai"
        content="Xin chào! Tôi là trợ lý ảo trong không gian Zyricon."
      />
    )

    const aiText = screen.getByText(/Xin chào! Tôi là trợ lý ảo trong không gian Zyricon./i)
    const bubble = aiText.closest('.rounded-2xl')

    expect(bubble).toBeInTheDocument()
    expect(bubble?.className).toContain('bg-[#120B1C]/92')
    expect(bubble?.className).toContain('border-[#694788]/25')
    expect(bubble?.className).toContain('text-[#EBDDE9]')

    // AI avatar
    const aiAvatar = screen.getByTestId('ai-avatar')
    expect(aiAvatar.className).toContain('bg-[#3B2568]/40')
    expect(aiAvatar.className).toContain('text-[#C27595]')
    expect(aiAvatar.className).toContain('border-[#694788]/40')

    // AI label
    const aiLabel = screen.getByText('AI')
    expect(aiLabel.className).toContain('text-[#C4A5B8]')
  })

  it('renders streaming state with Zyricon accent pink indicator and cursor', () => {
    render(
      <MessageBubble
        role="ai"
        content="Đang sinh phản hồi"
        isStreaming
      />
    )

    const statusText = screen.getByText('AI đang trả lời...')
    expect(statusText.parentElement?.className).toContain('text-[#C27595]')

    const cursor = document.querySelector('.ai-cursor')
    expect(cursor).toBeInTheDocument()
    expect(cursor?.className).toContain('text-[#C27595]')
  })

  it('renders Zyricon code block with dark cosmic surface, purple border, and language badge', () => {
    render(
      <MessageBubble
        role="ai"
        content={'```typescript\nconst theme = "zyricon";\nconsole.log(theme);\n```'}
      />
    )

    const codeBlock = screen.getByTestId('code-block')
    expect(codeBlock).toBeInTheDocument()
    expect(codeBlock.className).toContain('bg-[#0C0615]')
    expect(codeBlock.className).toContain('border-[#694788]/35')

    const langBadge = screen.getByTestId('code-language-badge')
    expect(langBadge).toHaveTextContent('typescript')
    expect(langBadge.className).toContain('text-[#C4A5B8]')

    const copyBtn = screen.getByTitle('Sao chép mã')
    expect(copyBtn.className).toContain('text-[#C4A5B8]')
  })

  it('renders Zyricon inline code with muted purple background and soft pink text', () => {
    render(
      <MessageBubble
        role="ai"
        content="Sử dụng biến `themeStore` để quản lý giao diện."
      />
    )

    const inlineCode = screen.getByText('themeStore')
    expect(inlineCode.tagName.toLowerCase()).toBe('code')
    expect(inlineCode.className).toContain('bg-[#1D132D]')
    expect(inlineCode.className).toContain('text-[#E4A9C4]')
    expect(inlineCode.className).toContain('border-[#694788]/40')
  })

  it('renders Zyricon attachment links with dark purple card and accent icon', () => {
    render(
      <MessageBubble
        role="user"
        content="Gửi kèm tài liệu kế hoạch"
        attachments={[
          {
            id: 'att-zyricon-1',
            fileName: 'ke-hoach-zyricon.pdf',
            fileUrl: 'https://example.com/ke-hoach-zyricon.pdf',
            fileType: 'application/pdf',
            sizeBytes: '2048',
            createdAt: '2026-11-06T00:00:00.000Z',
          },
        ]}
      />
    )

    const link = screen.getByRole('link', { name: /ke-hoach-zyricon\.pdf/i })
    expect(link).toBeInTheDocument()
    expect(link.className).toContain('bg-[#1A102A]/80')
    expect(link.className).toContain('border-[#694788]/30')
    expect(link.className).toContain('text-[#EBDDE9]')
  })

  it('renders Zyricon blockquote and link elements with theme colors', () => {
    render(
      <MessageBubble
        role="ai"
        content={'> Đây là trích dẫn hướng dẫn.\n\nTham khảo thêm tại [Tài liệu Zyricon](https://example.com).'}
      />
    )

    const blockquote = screen.getByText(/Đây là trích dẫn hướng dẫn./i).closest('blockquote')
    expect(blockquote).toBeInTheDocument()
    expect(blockquote?.className).toContain('border-[#98578D]')
    expect(blockquote?.className).toContain('bg-[#180F26]/60')

    const link = screen.getByRole('link', { name: 'Tài liệu Zyricon' })
    expect(link.className).toContain('text-[#C27595]')
  })

  it('renders Zyricon table with themed container, header, and border dividers', () => {
    render(
      <MessageBubble
        role="ai"
        content={'| Tính năng | Trạng thái |\n|---|---|\n| M5 Composer | Hoàn thành |\n| M6 Messages | Đang thực hiện |'}
      />
    )

    const tableContainer = screen.getByTestId('table-container')
    expect(tableContainer.className).toContain('border-[#694788]/30')
    expect(tableContainer.className).toContain('bg-[#120B1C]/60')

    const thead = tableContainer.querySelector('thead')
    expect(thead?.className).toContain('bg-[#1C122C]/90')
    expect(thead?.className).toContain('text-[#C4A5B8]')
  })

  it('renders AI action buttons (Copy & Regenerate) with Zyricon styling', () => {
    render(
      <MessageBubble
        role="ai"
        content="Nội dung câu trả lời hoàn tất."
        onRegenerate={() => {}}
      />
    )

    const copyBtn = screen.getByTitle('Sao chép nội dung')
    expect(copyBtn.className).toContain('text-[#C4A5B8]')

    const regenBtn = screen.getByTitle('Tạo lại câu trả lời')
    expect(regenBtn.className).toContain('text-[#C4A5B8]')
    expect(regenBtn.className).toContain('hover:text-[#C27595]')
  })

  it('preserves Light theme baseline user and AI message styling', () => {
    useThemeStore.setState({ theme: 'light' })

    const { rerender } = render(
      <MessageBubble
        role="user"
        content="Tin nhắn người dùng"
      />
    )

    const userText = screen.getByText('Tin nhắn người dùng')
    const userBubble = userText.closest('.rounded-2xl')
    expect(userBubble?.className).toContain('bg-slate-900')
    expect(userBubble?.className).not.toContain('from-[#3B2568]/80')

    rerender(
      <MessageBubble
        role="ai"
        content="Tin nhắn AI"
        isStreaming
      />
    )

    const aiText = screen.getByText('Tin nhắn AI')
    const aiBubble = aiText.closest('.rounded-2xl')
    expect(aiBubble?.className).toContain('bg-white')
    expect(aiBubble?.className).not.toContain('bg-[#120B1C]/92')

    const cursor = document.querySelector('.ai-cursor')
    expect(cursor?.className).toContain('text-amber-500')
  })

  it('preserves Dark theme baseline user and AI message styling', () => {
    useThemeStore.setState({ theme: 'dark' })

    const { rerender } = render(
      <MessageBubble
        role="user"
        content="Tin nhắn dark user"
      />
    )

    const userText = screen.getByText('Tin nhắn dark user')
    const userBubble = userText.closest('.rounded-2xl')
    expect(userBubble?.className).toContain('dark:bg-[#1A2436]')
    expect(userBubble?.className).not.toContain('from-[#3B2568]/80')

    rerender(
      <MessageBubble
        role="ai"
        content="Tin nhắn dark AI"
        isStreaming
      />
    )

    const aiText = screen.getByText('Tin nhắn dark AI')
    const aiBubble = aiText.closest('.rounded-2xl')
    expect(aiBubble?.className).toContain('dark:bg-[#121824]/90')
    expect(aiBubble?.className).not.toContain('bg-[#120B1C]/92')

    const cursor = document.querySelector('.ai-cursor')
    expect(cursor?.className).toContain('dark:text-indigo-400')
  })
})
