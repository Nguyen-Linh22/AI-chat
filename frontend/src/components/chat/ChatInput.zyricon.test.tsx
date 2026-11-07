import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ChatInput from '../ChatInput'
import { useThemeStore } from '../../stores/themeStore'

const {
  mockUseChatStore,
  mockUseAIStore,
  mockUseMessageStore,
  mockStreamMessage,
  mockUseTypewriterQueue,
  mockCreateChat,
} = vi.hoisted(() => ({
  mockUseChatStore: vi.fn(),
  mockUseAIStore: vi.fn(),
  mockUseMessageStore: vi.fn(),
  mockStreamMessage: vi.fn(),
  mockUseTypewriterQueue: vi.fn(),
  mockCreateChat: vi.fn(),
}))

vi.mock('../../stores/chatStore', () => ({
  useChatStore: mockUseChatStore,
}))

vi.mock('../../stores/aiStore', () => ({
  useAIStore: mockUseAIStore,
}))

vi.mock('../../stores/messageStore', () => ({
  useMessageStore: mockUseMessageStore,
}))

vi.mock('../../services/streamService', () => ({
  streamMessage: mockStreamMessage,
}))

vi.mock('../../services/chatService', () => ({
  createChat: mockCreateChat,
}))

vi.mock('../../hooks/useTypewriterQueue', () => ({
  useTypewriterQueue: mockUseTypewriterQueue,
}))

describe('ChatInput — Zyricon Theme (Milestone M5)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useThemeStore.setState({ theme: 'zyricon' })

    mockCreateChat.mockResolvedValue({
      id: 'chat-zyricon-1',
      title: 'Zyricon Chat',
      createdAt: new Date().toISOString(),
    })

    mockUseChatStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        currentChatId: 'chat-123',
      })
    )

    mockUseAIStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        selectedModelId: 'ollama-qwen3-1.7b',
        models: [
          {
            id: 'ollama-qwen3-1.7b',
            name: 'Qwen 3 1.7B',
          },
        ],
      })
    )

    mockUseMessageStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        addMessage: vi.fn(),
        updateMessage: vi.fn(),
        streamingMessageId: null,
        setStreamingMessageId: vi.fn(),
        abortCurrentStream: null,
        setAbortCurrentStream: vi.fn(),
        replaceMessage: vi.fn(),
        removeMessage: vi.fn(),
      })
    )

    mockUseTypewriterQueue.mockReturnValue({
      enqueue: vi.fn(),
      waitDrained: vi.fn().mockResolvedValue(undefined),
      flushAll: vi.fn(),
      reset: vi.fn(),
    })
  })

  it('renders Zyricon composer container with dark purple background, purple border, and focus glow', () => {
    render(<ChatInput />)

    const textarea = screen.getByPlaceholderText('Nhập tin nhắn...')
    const composerCard = textarea.closest('div.relative.rounded-2xl')

    expect(composerCard).toBeInTheDocument()
    // Verify Zyricon surface & border classes
    expect(composerCard?.className).toContain('bg-[#140E20]/95')
    expect(composerCard?.className).toContain('border-[#694788]/35')
    expect(composerCard?.className).toContain('focus-within:border-[#C27595]/70')
    expect(composerCard?.className).toContain('focus-within:shadow-[0_0_24px_rgba(152,87,141,0.28)]')
  })

  it('renders Zyricon textarea with light violet text and muted placeholder', () => {
    render(<ChatInput />)

    const textarea = screen.getByPlaceholderText('Nhập tin nhắn...')
    expect(textarea.className).toContain('text-[#F7F3F6]')
    expect(textarea.className).toContain('placeholder:text-[#8F7686]')
  })

  it('renders two-tiered layout with dedicated lower toolbar row', () => {
    render(<ChatInput />)

    const attachBtn = screen.getByRole('button', { name: 'Đính kèm file' })
    const modelBadge = screen.getByTestId('model-indicator')
    const expandBtn = screen.getByRole('button', { name: 'Mở rộng trình soạn thảo' })
    const sendBtn = screen.getByRole('button', { name: 'Gửi' })

    // All controls should be rendered
    expect(attachBtn).toBeInTheDocument()
    expect(modelBadge).toBeInTheDocument()
    expect(expandBtn).toBeInTheDocument()
    expect(sendBtn).toBeInTheDocument()

    // Zyricon toolbar container surrounds these controls
    const toolbar = attachBtn.closest('div.flex.items-center.justify-between')
    expect(toolbar).toBeInTheDocument()
    expect(toolbar?.className).toContain('border-t')
    expect(toolbar?.className).toContain('border-[#694788]/20')
  })

  it('renders Zyricon model indicator badge with purple pill styling', () => {
    render(<ChatInput />)

    const modelBadge = screen.getByTestId('model-indicator')
    expect(modelBadge).toHaveTextContent('Qwen 3 1.7B')
    expect(modelBadge.className).toContain('bg-[#1D152D]')
    expect(modelBadge.className).toContain('text-[#E4D7EE]')
    expect(modelBadge.className).toContain('border-[#694788]/30')
  })

  it('renders Zyricon send button with violet-to-pink gradient', () => {
    render(<ChatInput />)

    const sendBtn = screen.getByRole('button', { name: 'Gửi' })
    expect(sendBtn.className).toContain('bg-gradient-to-r')
    expect(sendBtn.className).toContain('from-[#98578D]')
    expect(sendBtn.className).toContain('to-[#C27595]')
  })

  it('renders Zyricon attachment button with purple button styling', () => {
    render(<ChatInput />)

    const attachBtn = screen.getByRole('button', { name: 'Đính kèm file' })
    expect(attachBtn.className).toContain('bg-[#1D152D]')
    expect(attachBtn.className).toContain('border-[#694788]/30')
    expect(attachBtn.className).toContain('text-[#C27595]')
  })

  it('renders emergency stop button with red styling when stream is active in Zyricon', () => {
    mockUseMessageStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        addMessage: vi.fn(),
        updateMessage: vi.fn(),
        streamingMessageId: 'msg-stream-1',
        setStreamingMessageId: vi.fn(),
        abortCurrentStream: vi.fn(),
        setAbortCurrentStream: vi.fn(),
        replaceMessage: vi.fn(),
        removeMessage: vi.fn(),
      })
    )

    render(<ChatInput />)

    const stopBtn = screen.getByRole('button', { name: 'Dừng' })
    expect(stopBtn).toBeInTheDocument()
    expect(stopBtn.className).toContain('bg-[#B91E2B]')
    expect(stopBtn.className).toContain('text-white')
  })

  it('renders attachment popover with Zyricon dark purple card styling and options', () => {
    render(<ChatInput />)

    const attachBtn = screen.getByRole('button', { name: 'Đính kèm file' })
    fireEvent.click(attachBtn)

    const popover = screen.getByRole('dialog', { name: 'Đính kèm tệp' })
    expect(popover).toBeInTheDocument()
    expect(popover.className).toContain('bg-[#140E20]/95')
    expect(popover.className).toContain('border-[#694788]/40')

    const docBtn = screen.getByRole('button', { name: 'Tài liệu (PDF, TXT)' })
    expect(docBtn).toBeInTheDocument()
    expect(docBtn.className).toContain('text-[#C27595]')

    const codeBtn = screen.getByRole('button', { name: 'Mã nguồn' })
    expect(codeBtn).toBeInTheDocument()
    expect(codeBtn.className).toContain('text-[#C4A5B8]')
  })

  it('preserves Light theme baseline single-row layout with green send button', () => {
    useThemeStore.setState({ theme: 'light' })
    render(<ChatInput />)

    const textarea = screen.getByPlaceholderText('Nhập tin nhắn...')
    const composerCard = textarea.closest('div.relative.rounded-2xl')

    expect(composerCard).toBeInTheDocument()
    expect(composerCard?.className).not.toContain('bg-[#140E20]/95')
    expect(composerCard?.className).not.toContain('border-[#694788]/35')

    const sendBtn = screen.getByRole('button', { name: 'Gửi' })
    expect(sendBtn.className).not.toContain('from-[#98578D]')
    expect(sendBtn.className).toContain('from-[#D97706]')
  })

  it('preserves Dark theme baseline single-row layout with distinct send button', () => {
    useThemeStore.setState({ theme: 'dark' })
    render(<ChatInput />)

    const textarea = screen.getByPlaceholderText('Nhập tin nhắn...')
    const composerCard = textarea.closest('div.relative.rounded-2xl')

    expect(composerCard).toBeInTheDocument()
    expect(composerCard?.className).not.toContain('bg-[#140E20]/95')
    expect(composerCard?.className).not.toContain('border-[#694788]/35')

    const sendBtn = screen.getByRole('button', { name: 'Gửi' })
    expect(sendBtn.className).not.toContain('from-[#98578D]')
    expect(sendBtn.className).toContain('dark:from-[#4F46E5]')
  })
})
