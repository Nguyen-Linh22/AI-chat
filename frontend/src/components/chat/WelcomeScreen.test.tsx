import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { WelcomeScreen } from './WelcomeScreen'
import { useThemeStore } from '../../stores/themeStore'

describe('WelcomeScreen (Light & Dark baseline)', () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: 'dark' })
  })

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

describe('WelcomeScreen (Zyricon Theme M4: Dragon Emblem AI Orb & Welcome Experience)', () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: 'zyricon' })
  })

  it('renders Zyricon AI Orb with Dragon Emblem and subtle purple neon glow', () => {
    render(<WelcomeScreen userName="Zyricon User" onSelectPrompt={vi.fn()} />)

    const orb = screen.getByTestId('zyricon-ai-orb')
    expect(orb).toBeInTheDocument()
    expect(orb).toHaveAttribute('aria-label', 'Zyricon AI Dragon Orb')

    // Contains Dragon Emblem image
    const img = orb.querySelector('img')
    expect(img).toBeInTheDocument()
    expect(img?.getAttribute('src')).toBeTruthy()
  })

  it('renders Zyricon welcome heading "Ready to Create Something New?"', () => {
    render(<WelcomeScreen userName="Zyricon User" onSelectPrompt={vi.fn()} />)

    const heading = screen.getByRole('heading', {
      level: 2,
      name: /Ready to Create Something New\?/i,
    })
    expect(heading).toBeInTheDocument()
  })

  it('renders Zyricon supporting description with personalized user name', () => {
    render(<WelcomeScreen userName="Alex" onSelectPrompt={vi.fn()} />)

    expect(
      screen.getByText(/Chào mừng, Alex! Hãy khám phá ý tưởng mới/i)
    ).toBeInTheDocument()
  })

  it('renders exactly 3 reference-inspired action chips: Create Image, Brainstorm, Make a Plan', () => {
    render(<WelcomeScreen userName="Test" onSelectPrompt={vi.fn()} />)

    const chips = screen.getAllByRole('button', { name: /^Gợi ý hành động:/i })
    expect(chips).toHaveLength(3)

    expect(screen.getByRole('button', { name: /Gợi ý hành động: Create Image/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Gợi ý hành động: Brainstorm/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Gợi ý hành động: Make a Plan/i })).toBeInTheDocument()
  })

  it('renders exactly 3 feature cards: Image Generator, AI Presentation, Dev Assistant', () => {
    render(<WelcomeScreen userName="Test" onSelectPrompt={vi.fn()} />)

    const featureCards = screen.getAllByRole('button', { name: /^Khám phá:/i })
    expect(featureCards).toHaveLength(3)

    expect(screen.getByRole('button', { name: /Khám phá: Image Generator/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Khám phá: AI Presentation/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Khám phá: Dev Assistant/i })).toBeInTheDocument()
  })

  it('dispatches prompt when an action chip is clicked', async () => {
    const user = userEvent.setup()
    const onSelectPrompt = vi.fn()

    render(<WelcomeScreen userName="Test" onSelectPrompt={onSelectPrompt} />)

    const createImgChip = screen.getByRole('button', { name: /Gợi ý hành động: Create Image/i })
    await user.click(createImgChip)

    expect(onSelectPrompt).toHaveBeenCalledTimes(1)
    expect(onSelectPrompt).toHaveBeenCalledWith(
      expect.stringContaining('Hãy tạo ý tưởng hình ảnh và viết prompt chi tiết')
    )

    const brainstormChip = screen.getByRole('button', { name: /Gợi ý hành động: Brainstorm/i })
    await user.click(brainstormChip)

    expect(onSelectPrompt).toHaveBeenCalledTimes(2)
    expect(onSelectPrompt).toHaveBeenCalledWith(
      expect.stringContaining('Hãy cùng tôi brainstorm các ý tưởng sáng tạo')
    )

    const planChip = screen.getByRole('button', { name: /Gợi ý hành động: Make a Plan/i })
    await user.click(planChip)

    expect(onSelectPrompt).toHaveBeenCalledTimes(3)
    expect(onSelectPrompt).toHaveBeenCalledWith(
      expect.stringContaining('Hãy giúp tôi lập kế hoạch hành động từng bước')
    )
  })

  it('dispatches prompt when a feature card is clicked', async () => {
    const user = userEvent.setup()
    const onSelectPrompt = vi.fn()

    render(<WelcomeScreen userName="Test" onSelectPrompt={onSelectPrompt} />)

    const devCard = screen.getByRole('button', { name: /Khám phá: Dev Assistant/i })
    await user.click(devCard)

    expect(onSelectPrompt).toHaveBeenCalledTimes(1)
    expect(onSelectPrompt).toHaveBeenCalledWith(
      expect.stringContaining('Hãy đóng vai trò Dev Assistant chuyên nghiệp')
    )

    const presentationCard = screen.getByRole('button', { name: /Khám phá: AI Presentation/i })
    await user.click(presentationCard)

    expect(onSelectPrompt).toHaveBeenCalledTimes(2)
    expect(onSelectPrompt).toHaveBeenCalledWith(
      expect.stringContaining('Hãy giúp tôi xây dựng cấu trúc bài thuyết trình chuyên nghiệp')
    )
  })

  it('supports keyboard navigation on Zyricon action chips and feature cards', async () => {
    const user = userEvent.setup()
    const onSelectPrompt = vi.fn()

    render(<WelcomeScreen userName="Test" onSelectPrompt={onSelectPrompt} />)

    const chip = screen.getByRole('button', { name: /Gợi ý hành động: Brainstorm/i })
    chip.focus()
    expect(chip).toHaveFocus()

    await user.keyboard('{Enter}')
    expect(onSelectPrompt).toHaveBeenCalledTimes(1)

    const card = screen.getByRole('button', { name: /Khám phá: Image Generator/i })
    card.focus()
    expect(card).toHaveFocus()

    await user.keyboard(' ')
    expect(onSelectPrompt).toHaveBeenCalledTimes(2)
  })

  it('preserves accessible sr-only empty state text in Zyricon theme', () => {
    render(<WelcomeScreen userName="Test" onSelectPrompt={vi.fn()} />)

    expect(
      screen.getByText('Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện!')
    ).toBeInTheDocument()
  })
})
