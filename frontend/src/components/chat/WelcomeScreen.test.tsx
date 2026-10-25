import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { WelcomeScreen } from './WelcomeScreen'

describe('WelcomeScreen', () => {
  it('renders greeting with user name and workspace subtitle', () => {
    render(<WelcomeScreen userName="Linh" onSelectPrompt={vi.fn()} />)

    expect(screen.getByRole('heading', { level: 2, name: /Chào mừng, Linh!/i })).toBeInTheDocument()
    expect(
      screen.getByText(/Hôm nay tôi có thể hỗ trợ gì cho công việc của bạn/i)
    ).toBeInTheDocument()
    expect(screen.getByText('Workspace Sẵn Sàng')).toBeInTheDocument()
  })

  it('renders accessible sr-only text for regression test suites', () => {
    render(<WelcomeScreen userName="Test" onSelectPrompt={vi.fn()} />)

    expect(
      screen.getByText('Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện!')
    ).toBeInTheDocument()
  })

  it('renders exactly 4 hero suggestion cards and 4 quick prompt chips', () => {
    render(<WelcomeScreen userName="Test" onSelectPrompt={vi.fn()} />)

    const heroButtons = screen.getAllByRole('button', { name: /^Khám phá:/i })
    expect(heroButtons).toHaveLength(4)

    const chipButtons = screen.getAllByRole('button', { name: /^Gợi ý nhanh:/i })
    expect(chipButtons).toHaveLength(4)
  })

  it('renders the correct titles for all 4 hero cards', () => {
    render(<WelcomeScreen userName="Test" onSelectPrompt={vi.fn()} />)

    expect(screen.getByText('Phân tích & tối ưu code')).toBeInTheDocument()
    expect(screen.getByText('Soạn thảo chuyên nghiệp')).toBeInTheDocument()
    expect(screen.getByText('Nghiên cứu & học tập')).toBeInTheDocument()
    expect(screen.getByText('Lên ý tưởng & lập kế hoạch')).toBeInTheDocument()
  })

  it('renders the correct labels for all 4 quick chips', () => {
    render(<WelcomeScreen userName="Test" onSelectPrompt={vi.fn()} />)

    expect(screen.getByText('Tóm tắt tài liệu')).toBeInTheDocument()
    expect(screen.getByText('Debug mã nguồn')).toBeInTheDocument()
    expect(screen.getByText('Soạn email')).toBeInTheDocument()
    expect(screen.getByText('Lên kế hoạch tuần')).toBeInTheDocument()
  })

  it('calls onSelectPrompt with the corresponding prompt when a hero card is clicked', async () => {
    const user = userEvent.setup()
    const onSelectPrompt = vi.fn()

    render(<WelcomeScreen userName="Test" onSelectPrompt={onSelectPrompt} />)

    const codeCard = screen.getByRole('button', { name: /Khám phá: Phân tích & tối ưu code/i })
    await user.click(codeCard)

    expect(onSelectPrompt).toHaveBeenCalledTimes(1)
    expect(onSelectPrompt).toHaveBeenCalledWith(
      expect.stringContaining('Hãy giúp tôi phân tích và tối ưu hóa đoạn mã sau')
    )
  })

  it('calls onSelectPrompt with the corresponding prompt when a quick chip is clicked', async () => {
    const user = userEvent.setup()
    const onSelectPrompt = vi.fn()

    render(<WelcomeScreen userName="Test" onSelectPrompt={onSelectPrompt} />)

    const debugChip = screen.getByRole('button', { name: /Gợi ý nhanh: Debug mã nguồn/i })
    await user.click(debugChip)

    expect(onSelectPrompt).toHaveBeenCalledTimes(1)
    expect(onSelectPrompt).toHaveBeenCalledWith(
      expect.stringContaining('Đoạn mã sau đang gặp lỗi hoặc hoạt động không đúng kỳ vọng')
    )
  })

  it('supports keyboard navigation and activation with Enter/Space', async () => {
    const user = userEvent.setup()
    const onSelectPrompt = vi.fn()

    render(<WelcomeScreen userName="Test" onSelectPrompt={onSelectPrompt} />)

    const chip = screen.getByRole('button', { name: /Gợi ý nhanh: Tóm tắt tài liệu/i })
    chip.focus()
    expect(chip).toHaveFocus()

    await user.keyboard('{Enter}')
    expect(onSelectPrompt).toHaveBeenCalledTimes(1)
    expect(onSelectPrompt).toHaveBeenCalledWith(
      expect.stringContaining('Hãy tóm tắt ngắn gọn các ý chính của tài liệu sau đây')
    )

    const card = screen.getByRole('button', { name: /Khám phá: Soạn thảo chuyên nghiệp/i })
    card.focus()
    expect(card).toHaveFocus()

    await user.keyboard(' ')
    expect(onSelectPrompt).toHaveBeenCalledTimes(2)
    expect(onSelectPrompt).toHaveBeenCalledWith(
      expect.stringContaining('Hãy giúp tôi soạn thảo một văn bản chuyên nghiệp')
    )
  })
})
