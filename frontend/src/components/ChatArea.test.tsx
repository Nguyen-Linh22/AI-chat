import { render, screen, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import ChatArea from './ChatArea'

const {
  useParamsMock,
  getMessagesMock,
  regenerateMessageMock,
  useChatStoreMock,
  useAIStoreMock,
  useMessageStoreMock,
  switchChatMock,
  setCachedMessagesMock,
  clearMessagesMock,
  setLoadingMessagesMock,
  setMessageErrorMock,
  updateMessageMock,
  setStreamingMessageIdMock,
  setAbortCurrentStreamMock,
  saveScrollPositionMock,
  getScrollPositionMock,
  enqueueMock,
  waitDrainedMock,
  flushAllMock,
  resetQueueMock,
} = vi.hoisted(() => ({
  useParamsMock: vi.fn(),
  getMessagesMock: vi.fn(),
  regenerateMessageMock: vi.fn(),

  useChatStoreMock: vi.fn(),
  useAIStoreMock: vi.fn(),
  useMessageStoreMock: vi.fn(),

  switchChatMock: vi.fn(),
  setCachedMessagesMock: vi.fn(),
  clearMessagesMock: vi.fn(),
  setLoadingMessagesMock: vi.fn(),
  setMessageErrorMock: vi.fn(),
  updateMessageMock: vi.fn(),
  setStreamingMessageIdMock: vi.fn(),
  setAbortCurrentStreamMock: vi.fn(),
  saveScrollPositionMock: vi.fn(),
  getScrollPositionMock: vi.fn(),

  enqueueMock: vi.fn(),
  waitDrainedMock: vi.fn(),
  flushAllMock: vi.fn(),
  resetQueueMock: vi.fn(),
}))

vi.mock('react-router-dom', () => ({
  useParams: useParamsMock,
}))

vi.mock('../services/messageService', () => ({
  getMessages: getMessagesMock,
  regenerateMessage: regenerateMessageMock,
}))

vi.mock('../stores/chatStore', () => ({
  useChatStore: useChatStoreMock,
}))

vi.mock('../stores/aiStore', () => ({
  useAIStore: useAIStoreMock,
}))

vi.mock('../stores/messageStore', () => ({
  useMessageStore: useMessageStoreMock,
}))

vi.mock('../hooks/useTypewriterQueue', () => ({
  useTypewriterQueue: () => ({
    enqueue: enqueueMock,
    waitDrained: waitDrainedMock,
    flushAll: flushAllMock,
    reset: resetQueueMock,
  }),
}))

vi.mock('./ChatInput', () => ({
  default: () => <div data-testid="chat-input">ChatInput</div>,
}))

vi.mock('./ModelSelector', () => ({
  default: () => <div data-testid="model-selector">ModelSelector</div>,
}))

vi.mock('./MessageBubble', () => ({
  default: ({
    role,
    content,
    onRegenerate,
  }: {
    role: string
    content: string
    onRegenerate?: () => void
  }) => (
    <div data-testid="message-bubble" data-role={role}>
      <span>{role}</span>
      <span>{content}</span>
      {onRegenerate && (
        <button onClick={onRegenerate}>
          Regenerate
        </button>
      )}
    </div>
  ),
}))

const createMessage = (
  id: string,
  role: 'user' | 'assistant',
  content: string
) => ({
  id,
  chatSessionId: 'chat-123',
  role,
  content,
  createdAt: '2026-09-27T00:00:00.000Z',
  attachments: [],
})

const configureStores = ({
  currentChatId = null as string | null,
  messages = [] as ReturnType<typeof createMessage>[],
  loadingMessages = false,
  messageError = null as string | null,
  selectedModelId = 'ollama-qwen3-1.7b' as string | null,
  streamingMessageId = null as string | null,
  setCurrentChatId = vi.fn(),
} = {}) => {
  useChatStoreMock.mockImplementation((selector: (state: unknown) => unknown) => {
    const state = {
      currentChatId,
      setCurrentChatId,
    }
    return selector ? selector(state) : state
  })

  useAIStoreMock.mockImplementation((selector: (state: unknown) => unknown) => {
    const state = {
      selectedModelId,
    }
    return selector ? selector(state) : state
  })

  useMessageStoreMock.mockImplementation((selector: (state: unknown) => unknown) => {
    const state = {
      messages,
      streamingMessageId,
      loadingMessages,
      messageError,

      switchChat: switchChatMock,
      setCachedMessages: setCachedMessagesMock,
      clearMessages: clearMessagesMock,
      setLoadingMessages: setLoadingMessagesMock,
      setMessageError: setMessageErrorMock,
      updateMessage: updateMessageMock,
      setStreamingMessageId: setStreamingMessageIdMock,
      setAbortCurrentStream: setAbortCurrentStreamMock,
      saveScrollPosition: saveScrollPositionMock,
      getScrollPosition: getScrollPositionMock,
    }
    return selector ? selector(state) : state
  })
}

describe('ChatArea', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    HTMLDivElement.prototype.scrollTo = vi.fn()

    useParamsMock.mockReturnValue({
      chatId: undefined,
    })

    switchChatMock.mockReturnValue(false)
    getScrollPositionMock.mockReturnValue(0)
    waitDrainedMock.mockResolvedValue(undefined)
    getMessagesMock.mockResolvedValue([])
    regenerateMessageMock.mockResolvedValue(undefined)

    configureStores()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render empty state when no chat is selected', () => {
    configureStores({
      currentChatId: null,
      messages: [],
    })

    render(<ChatArea />)

    expect(
      screen.getByText(
        'Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện!'
      )
    ).toBeInTheDocument()

    expect(screen.getByText('Chưa chọn chat')).toBeInTheDocument()
    expect(screen.getByTestId('model-selector')).toBeInTheDocument()
    expect(screen.getByTestId('chat-input')).toBeInTheDocument()

    expect(clearMessagesMock).toHaveBeenCalled()
    expect(setMessageErrorMock).toHaveBeenCalledWith(null)
    expect(setLoadingMessagesMock).toHaveBeenCalledWith(false)
  })

  it('should sync URL chatId to currentChatId', () => {
    const setCurrentChatId = vi.fn()

    useParamsMock.mockReturnValue({
      chatId: 'chat-123',
    })

    configureStores({
      currentChatId: 'chat-old',
      setCurrentChatId,
    })

    render(<ChatArea />)

    expect(setCurrentChatId).toHaveBeenCalledWith('chat-123')
  })

  it('should render cached messages immediately on cache hit', async () => {
    const messages = [
      createMessage('m1', 'user', 'Hello'),
      createMessage('m2', 'assistant', 'Hi there'),
    ]

    switchChatMock.mockReturnValue(true)

    configureStores({
      currentChatId: 'chat-123',
      messages,
    })

    render(<ChatArea />)

    expect(switchChatMock).toHaveBeenCalledWith('chat-123')

    expect(screen.getByText('Hello')).toBeInTheDocument()
    expect(screen.getByText('Hi there')).toBeInTheDocument()

    expect(getMessagesMock).not.toHaveBeenCalled()
    expect(setLoadingMessagesMock).not.toHaveBeenCalledWith(true)
  })

  it('should fetch messages when cache misses', async () => {
    const messages = [
      createMessage('m1', 'user', 'Hello'),
      createMessage('m2', 'assistant', 'Hi'),
    ]

    switchChatMock.mockReturnValue(false)
    getMessagesMock.mockResolvedValue(messages)

    configureStores({
      currentChatId: 'chat-123',
      messages: [],
    })

    render(<ChatArea />)

    await waitFor(() => {
      expect(getMessagesMock).toHaveBeenCalledWith('chat-123')
    })

    expect(setLoadingMessagesMock).toHaveBeenCalledWith(true)
    expect(setMessageErrorMock).toHaveBeenCalledWith(null)

    await waitFor(() => {
      expect(setCachedMessagesMock).toHaveBeenCalledWith(
        'chat-123',
        messages
      )
    })

    await waitFor(() => {
      expect(setLoadingMessagesMock).toHaveBeenCalledWith(false)
    })
  })

  it('should show loading skeleton while messages are loading', () => {
    configureStores({
      currentChatId: 'chat-123',
      loadingMessages: true,
    })

    render(<ChatArea />)

    const skeletons = document.querySelectorAll(
      '.skeleton-shimmer'
    )

    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('should show the message error when loading messages fails', async () => {
    switchChatMock.mockReturnValue(false)

    getMessagesMock.mockRejectedValue(
      new Error('Network error')
    )

    configureStores({
      currentChatId: 'chat-123',
      messageError:
        'Không thể tải tin nhắn. Vui lòng thử lại.',
    })

    render(<ChatArea />)

    await waitFor(() => {
      expect(getMessagesMock).toHaveBeenCalledWith('chat-123')
    })

    await waitFor(() => {
      expect(
        screen.getByText(
          'Không thể tải tin nhắn. Vui lòng thử lại.'
        )
      ).toBeInTheDocument()
    })

    expect(setLoadingMessagesMock).toHaveBeenCalledWith(false)
  })

  it('should render only the last assistant message with regenerate', () => {
    const messages = [
      createMessage('m1', 'user', 'Hello'),
      createMessage('m2', 'assistant', 'First answer'),
      createMessage('m3', 'user', 'Another question'),
      createMessage('m4', 'assistant', 'Latest answer'),
    ]

    configureStores({
      currentChatId: 'chat-123',
      messages,
    })

    switchChatMock.mockReturnValue(true)

    render(<ChatArea />)

    const buttons = screen.getAllByRole('button', { name: 'Regenerate' })
    expect(buttons).toHaveLength(1)

    const latestBubble = screen.getByText('Latest answer').closest('[data-testid="message-bubble"]')
    expect(latestBubble).toHaveTextContent('Regenerate')

    const firstBubble = screen.getByText('First answer').closest('[data-testid="message-bubble"]')
    expect(firstBubble).not.toHaveTextContent('Regenerate')
  })

  it('should regenerate the last assistant message', async () => {
    const messages = [
      createMessage('m1', 'user', 'Hello'),
      createMessage('m2', 'assistant', 'Old answer'),
    ]

    switchChatMock.mockReturnValue(true)

    configureStores({
      currentChatId: 'chat-123',
      messages,
      selectedModelId: 'ollama-qwen3-1.7b',
    })

    render(<ChatArea />)

    const regenerateButton = screen.getByRole(
      'button',
      { name: 'Regenerate' }
    )

    await act(async () => {
      regenerateButton.click()
    })

    expect(setStreamingMessageIdMock).toHaveBeenCalledWith('m2')

    expect(regenerateMessageMock).toHaveBeenCalledWith(
      'chat-123',
      'm2',
      'ollama-qwen3-1.7b',
      expect.any(Function),
      expect.any(AbortSignal)
    )

    expect(waitDrainedMock).toHaveBeenCalled()

    expect(setStreamingMessageIdMock).toHaveBeenLastCalledWith(
      null
    )

    expect(setAbortCurrentStreamMock).toHaveBeenLastCalledWith(
      null
    )
  })

  it('should not regenerate when there is no selected model', async () => {
    const messages = [
      createMessage('m1', 'user', 'Hello'),
      createMessage('m2', 'assistant', 'Answer'),
    ]

    switchChatMock.mockReturnValue(true)

    configureStores({
      currentChatId: 'chat-123',
      messages,
      selectedModelId: null,
    })

    render(<ChatArea />)

    await act(async () => {
      screen
        .getByRole('button', { name: 'Regenerate' })
        .click()
    })

    expect(regenerateMessageMock).not.toHaveBeenCalled()
    expect(setStreamingMessageIdMock).not.toHaveBeenCalledWith(
      'm2'
    )
  })

  it('should not regenerate while another message is streaming', async () => {
    const messages = [
      createMessage('m1', 'user', 'Hello'),
      createMessage('m2', 'assistant', 'Answer'),
    ]

    switchChatMock.mockReturnValue(true)

    configureStores({
      currentChatId: 'chat-123',
      messages,
      streamingMessageId: 'm2',
      selectedModelId: 'ollama-qwen3-1.7b',
    })

    render(<ChatArea />)

    await act(async () => {
      screen
        .getByRole('button', { name: 'Regenerate' })
        .click()
    })

    expect(regenerateMessageMock).not.toHaveBeenCalled()
  })
})
