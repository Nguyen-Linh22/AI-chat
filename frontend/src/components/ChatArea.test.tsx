import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
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
  abortCurrentStreamMock,
  enqueueMock,
  waitDrainedMock,
  flushAllMock,
  resetQueueMock,
  prependMessagesMock,
  setPaginationMock,
  setLoadingOlderMock,
  setOlderErrorMock,
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
  abortCurrentStreamMock: vi.fn(),

  enqueueMock: vi.fn(),
  waitDrainedMock: vi.fn(),
  flushAllMock: vi.fn(),
  resetQueueMock: vi.fn(),

  prependMessagesMock: vi.fn(),
  setPaginationMock: vi.fn(),
  setLoadingOlderMock: vi.fn(),
  setOlderErrorMock: vi.fn(),
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
  chats = [] as { id: string; title: string }[],
  messages = [] as ReturnType<typeof createMessage>[],
  loadingMessages = false,
  messageError = null as string | null,
  selectedModelId = 'ollama-qwen3-1.7b' as string | null,
  streamingMessageId = null as string | null,
  nextCursor = null as string | null,
  hasMoreOlder = false,
  loadingOlder = false,
  olderError = null as string | null,
  prependMessages = prependMessagesMock,
  setPagination = setPaginationMock,
  setLoadingOlder = setLoadingOlderMock,
  setOlderError = setOlderErrorMock,
  setCurrentChatId = vi.fn(),
  abortCurrentStream = abortCurrentStreamMock as (() => void) | null,
} = {}) => {
  useChatStoreMock.mockImplementation((selector: (state: unknown) => unknown) => {
    const state = {
      currentChatId,
      setCurrentChatId,
      chats,
    }
    return selector ? selector(state) : state
  })

  useAIStoreMock.mockImplementation((selector: (state: unknown) => unknown) => {
    const state = {
      selectedModelId,
      models: [
        {
          id: 'gemini-3.6-flash',
          name: 'Gemini 3.6 Flash',
          provider: 'gemini',
          model: 'gemini-3.6-flash',
          available: true,
        },
        {
          id: 'ollama-qwen3-1.7b',
          name: 'Qwen 3 1.7B',
          provider: 'ollama',
          model: 'qwen3:1.7b',
          available: true,
        },
      ],
      setSelectedModelId: vi.fn(),
      setModels: vi.fn(),
    }
    return selector ? selector(state) : state
  })

  useMessageStoreMock.mockImplementation((selector: (state: unknown) => unknown) => {
    const state = {
      messages,
      streamingMessageId,
      abortCurrentStream,
      loadingMessages,
      messageError,
      nextCursor,
      hasMoreOlder,
      loadingOlder,
      olderError,

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
      prependMessages,
      setPagination,
      setLoadingOlder,
      setOlderError,
    }
    return selector ? selector(state) : state
  })
}

describe('ChatArea', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    HTMLDivElement.prototype.scrollTo = vi.fn()
    Element.prototype.scrollIntoView = vi.fn()

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

  it('should render WelcomeScreen with 4 hero cards and dispatch event on prompt click', () => {
    const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent')
    configureStores({
      currentChatId: null,
      messages: [],
    })

    render(<ChatArea />)

    expect(screen.getByText('Phân tích & tối ưu code')).toBeInTheDocument()
    expect(screen.getByText('Tóm tắt tài liệu')).toBeInTheDocument()

    const heroCard = screen.getByRole('button', { name: /Khám phá: Phân tích & tối ưu code/i })
    fireEvent.click(heroCard)

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ai-chat-prompt-select',
      })
    )
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

  it('should render brand and active chat title in header breadcrumb', () => {
    configureStores({
      currentChatId: 'chat-1',
      chats: [
        {
          id: 'chat-1',
          title: 'Cơ học lượng tử',
        },
      ],
      messages: [],
    })

    render(<ChatArea />)

    expect(screen.getByText('AI Chat')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Cơ học lượng tử' })
    ).toBeInTheDocument()
  })

  it('should render top loading indicator when loading older messages', () => {
    switchChatMock.mockReturnValue(true)

    configureStores({
      currentChatId: 'chat-123',
      messages: [
        createMessage('m1', 'user', 'Hello'),
        createMessage('m2', 'assistant', 'World'),
      ],
      loadingOlder: true,
    })

    render(<ChatArea />)

    expect(screen.getByText('Đang tải tin nhắn cũ...')).toBeInTheDocument()
  })

  it('should render older messages error banner with retry button', () => {
    switchChatMock.mockReturnValue(true)

    configureStores({
      currentChatId: 'chat-123',
      messages: [
        createMessage('m1', 'user', 'Hello'),
        createMessage('m2', 'assistant', 'World'),
      ],
      olderError: 'Không thể tải tin nhắn cũ.',
    })

    render(<ChatArea />)

    expect(screen.getByText('Không thể tải tin nhắn cũ.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument()
  })

  it('should render ChatBackground with pointer-events-none and aria-hidden', () => {
    configureStores()
    render(<ChatArea />)

    const bg = screen.getByTestId('chat-background')
    expect(bg).toBeInTheDocument()
    expect(bg).toHaveAttribute('aria-hidden', 'true')
    expect(bg).toHaveClass('pointer-events-none')
  })

  it('should not render duplicate desktop open sidebar button in ChatArea', () => {
    configureStores()
    render(<ChatArea isSidebarCollapsed={true} />)

    expect(screen.queryByRole('button', { name: 'Mở thanh bên' })).not.toBeInTheDocument()
  })

  it('should render mobile menu button and trigger onOpenMobileSidebar', () => {
    const onOpenMobileSidebar = vi.fn()
    configureStores()
    render(<ChatArea onOpenMobileSidebar={onOpenMobileSidebar} />)

    const menuBtn = screen.getByRole('button', { name: 'Mở menu danh sách đoạn chat' })
    expect(menuBtn).toBeInTheDocument()
    fireEvent.click(menuBtn)
    expect(onOpenMobileSidebar).toHaveBeenCalledTimes(1)
  })

  it('should render model selector and theme toggle in the chat header', () => {
    configureStores()
    render(<ChatArea />)

    expect(screen.getByTestId('model-selector')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Chuyển sang giao diện/i })).toBeInTheDocument()
  })

  // === Fix1 Regression Tests ===
  it('Fix1-B: should call abortCurrentStream when ChatArea unmounts', () => {
    const mockAbort = vi.fn()
    configureStores({
      abortCurrentStream: mockAbort,
    })

    const { unmount } = render(<ChatArea />)
    unmount()

    expect(mockAbort).toHaveBeenCalledTimes(1)
  })

  // === Patch 2.2 Regression Tests: Regenerate Snapshot & Rollback Safety ===
  it('Patch 2.2: Test 1 - should rollback to original content and show error when stream fails before first chunk', async () => {
    const messages = [
      createMessage('m1', 'user', 'What is AI?'),
      createMessage('m2', 'assistant', 'Original complete answer'),
    ]

    switchChatMock.mockReturnValue(true)
    regenerateMessageMock.mockRejectedValueOnce(new Error('500 Server Internal Error'))

    configureStores({
      currentChatId: 'chat-123',
      messages,
      selectedModelId: 'ollama-qwen3-1.7b',
    })

    render(<ChatArea />)

    await act(async () => {
      screen.getByRole('button', { name: 'Regenerate' }).click()
    })

    // Must rollback to original snapshot content
    expect(updateMessageMock).toHaveBeenCalledWith('m2', 'Original complete answer')
    // Must show user-facing error message
    expect(setMessageErrorMock).toHaveBeenCalledWith('Không thể tạo lại tin nhắn. Vui lòng thử lại.')
    // Must clean up streaming state
    expect(setStreamingMessageIdMock).toHaveBeenLastCalledWith(null)
    expect(setAbortCurrentStreamMock).toHaveBeenLastCalledWith(null)
  })

  it('Patch 2.2: Test 2 - should rollback to original content and clear queue when stream fails after partial chunks', async () => {
    const messages = [
      createMessage('m1', 'user', 'Tell me a story'),
      createMessage('m2', 'assistant', 'Once upon a time in a faraway kingdom...'),
    ]

    switchChatMock.mockReturnValue(true)
    enqueueMock.mockImplementation((chunk: string, cb: (content: string) => void) => cb(chunk))
    regenerateMessageMock.mockImplementationOnce(async (_chatId, _msgId, _modelId, onChunk) => {
      onChunk('Once upon a time there was')
      throw new Error('Stream connection terminated unexpectedly')
    })

    configureStores({
      currentChatId: 'chat-123',
      messages,
      selectedModelId: 'ollama-qwen3-1.7b',
    })

    render(<ChatArea />)

    await act(async () => {
      screen.getByRole('button', { name: 'Regenerate' }).click()
    })

    // Queue must be reset on failure to stop pending timers
    expect(resetQueueMock).toHaveBeenCalled()
    // Target message must be rolled back to original complete snapshot, not truncated text
    expect(updateMessageMock).toHaveBeenLastCalledWith('m2', 'Once upon a time in a faraway kingdom...')
    // Error feedback must be provided
    expect(setMessageErrorMock).toHaveBeenCalledWith('Không thể tạo lại tin nhắn. Vui lòng thử lại.')
    // Streaming state must be cleaned up
    expect(setStreamingMessageIdMock).toHaveBeenLastCalledWith(null)
  })

  it('Patch 2.2: Test 3 - should keep newly generated content and not rollback on successful regenerate', async () => {
    const messages = [
      createMessage('m1', 'user', 'Calculate 2+2'),
      createMessage('m2', 'assistant', 'Old answer 4'),
    ]

    switchChatMock.mockReturnValue(true)
    enqueueMock.mockImplementation((chunk: string, cb: (content: string) => void) => cb(chunk))
    regenerateMessageMock.mockImplementationOnce(async (_chatId, _msgId, _modelId, onChunk) => {
      onChunk('The result of 2 + 2 is 4.')
    })

    configureStores({
      currentChatId: 'chat-123',
      messages,
      selectedModelId: 'ollama-qwen3-1.7b',
    })

    render(<ChatArea />)

    await act(async () => {
      screen.getByRole('button', { name: 'Regenerate' }).click()
    })

    expect(updateMessageMock).toHaveBeenCalledWith('m2', 'The result of 2 + 2 is 4.')
    // Must NOT restore old answer on success
    expect(updateMessageMock).not.toHaveBeenCalledWith('m2', 'Old answer 4')
    // No error shown
    expect(setMessageErrorMock).not.toHaveBeenCalled()
  })

  it('Patch 2.2: Test 4 - should restore old answer and not show fake error when user manually stops before first chunk', async () => {
    const messages = [
      createMessage('m1', 'user', 'Explain quantum physics'),
      createMessage('m2', 'assistant', 'Original quantum explanation'),
    ]

    switchChatMock.mockReturnValue(true)
    let abortCallback: (() => void) | null = null
    setAbortCurrentStreamMock.mockImplementation((fn: (() => void) | null) => {
      if (fn) abortCallback = fn
    })

    regenerateMessageMock.mockImplementationOnce(async () => {
      // Simulate user immediately clicking Stop before any chunk arrives
      abortCallback?.()
      const abortError = new DOMException('The user aborted a request.', 'AbortError')
      throw abortError
    })

    configureStores({
      currentChatId: 'chat-123',
      messages,
      selectedModelId: 'ollama-qwen3-1.7b',
    })

    render(<ChatArea />)

    await act(async () => {
      screen.getByRole('button', { name: 'Regenerate' }).click()
    })

    // Must preserve original answer
    expect(updateMessageMock).toHaveBeenCalledWith('m2', 'Original quantum explanation')
    // Must NOT show fake error for manual user stop
    expect(setMessageErrorMock).not.toHaveBeenCalled()
    // Streaming state must be cleaned up
    expect(setStreamingMessageIdMock).toHaveBeenLastCalledWith(null)
  })

  it('Patch 2.2: Test 5 - should keep partial new content and not rollback when user stops after receiving chunks', async () => {
    const messages = [
      createMessage('m1', 'user', 'Write a poem'),
      createMessage('m2', 'assistant', 'Old poem'),
    ]

    switchChatMock.mockReturnValue(true)
    let abortCallback: (() => void) | null = null
    setAbortCurrentStreamMock.mockImplementation((fn: (() => void) | null) => {
      if (fn) abortCallback = fn
    })
    enqueueMock.mockImplementation((chunk: string, cb: (content: string) => void) => cb(chunk))

    regenerateMessageMock.mockImplementationOnce(async (_chatId, _msgId, _modelId, onChunk) => {
      // Emit chunks first
      onChunk('Roses are red, violets are blue,')
      // Then user clicks stop
      abortCallback?.()
      const abortError = new DOMException('The user aborted a request.', 'AbortError')
      throw abortError
    })

    configureStores({
      currentChatId: 'chat-123',
      messages,
      selectedModelId: 'ollama-qwen3-1.7b',
    })

    render(<ChatArea />)

    await act(async () => {
      screen.getByRole('button', { name: 'Regenerate' }).click()
    })

    // Must have received partial new content
    expect(updateMessageMock).toHaveBeenCalledWith('m2', 'Roses are red, violets are blue,')
    // Must NOT rollback to Old poem when user stopped after chunks
    expect(updateMessageMock).not.toHaveBeenCalledWith('m2', 'Old poem')
    // Must NOT show error
    expect(setMessageErrorMock).not.toHaveBeenCalled()
  })

  it('Patch 2.2: Test 6 - obsolete regenerate run should not rollback or clear streaming state of a new run', async () => {
    const messages = [
      createMessage('m1', 'user', 'First question'),
      createMessage('m2', 'assistant', 'Initial answer'),
    ]

    switchChatMock.mockReturnValue(true)

    let rejectOldStream: (err: Error) => void = () => {}

    const oldStreamPromise = new Promise<void>((_, rej) => {
      rejectOldStream = rej
    })

    regenerateMessageMock.mockReturnValueOnce(oldStreamPromise)

    configureStores({
      currentChatId: 'chat-123',
      messages,
      selectedModelId: 'ollama-qwen3-1.7b',
    })

    render(<ChatArea />)

    // Trigger run 1
    await act(async () => {
      screen.getByRole('button', { name: 'Regenerate' }).click()
    })

    // Now user switches chats or starts new stream: trigger next regenerate
    regenerateMessageMock.mockResolvedValueOnce(undefined)
    await act(async () => {
      screen.getByRole('button', { name: 'Regenerate' }).click()
    })

    updateMessageMock.mockClear()
    setMessageErrorMock.mockClear()

    // Now late failure of run 1 arrives
    await act(async () => {
      rejectOldStream(new Error('Late network failure of old run'))
    })

    // Obsolete run must be dropped: no rollback, no error message
    expect(updateMessageMock).not.toHaveBeenCalledWith('m2', 'Initial answer')
    expect(setMessageErrorMock).not.toHaveBeenCalled()
  })

  it('Patch 2.2: Test 7 - should only restore the target message and leave other messages unchanged', async () => {
    const messages = [
      createMessage('m1', 'user', 'Question 1'),
      createMessage('m2', 'assistant', 'Answer 1'),
      createMessage('m3', 'user', 'Question 2'),
      createMessage('m4', 'assistant', 'Target answer 2'),
    ]

    switchChatMock.mockReturnValue(true)
    regenerateMessageMock.mockRejectedValueOnce(new Error('Service unavailable'))

    configureStores({
      currentChatId: 'chat-123',
      messages,
      selectedModelId: 'ollama-qwen3-1.7b',
    })

    render(<ChatArea />)

    await act(async () => {
      screen.getByRole('button', { name: 'Regenerate' }).click()
    })

    // Only target message m4 must be updated/restored
    expect(updateMessageMock).toHaveBeenCalledWith('m4', 'Target answer 2')
    expect(updateMessageMock).not.toHaveBeenCalledWith('m1', expect.anything())
    expect(updateMessageMock).not.toHaveBeenCalledWith('m2', expect.anything())
    expect(updateMessageMock).not.toHaveBeenCalledWith('m3', expect.anything())
  })

  describe('M7-F07: Accessible announcement when AI starts streaming', () => {
    it('announces "AI đang trả lời" in role="status" aria-live="polite" region when streaming starts', () => {
      configureStores({
        currentChatId: 'chat-123',
        streamingMessageId: 'msg-stream-1',
      })

      render(<ChatArea />)

      const statusRegion = screen.getByTestId('streaming-status-announcer')
      expect(statusRegion).toBeInTheDocument()
      expect(statusRegion).toHaveAttribute('role', 'status')
      expect(statusRegion).toHaveAttribute('aria-live', 'polite')
      expect(statusRegion).toHaveAttribute('aria-atomic', 'true')
      expect(statusRegion).toHaveClass('sr-only')
      expect(statusRegion).toHaveTextContent('AI đang trả lời')
    })

    it('remains stable across chunk updates without altering status content', () => {
      configureStores({
        currentChatId: 'chat-123',
        streamingMessageId: 'msg-stream-1',
        messages: [createMessage('msg-stream-1', 'assistant', 'Chunk 1')],
      })
      const { rerender } = render(<ChatArea />)

      const statusRegion = screen.getByTestId('streaming-status-announcer')
      expect(statusRegion).toHaveTextContent('AI đang trả lời')

      // Chunk 2 arrives (same streamingMessageId, updated message content)
      configureStores({
        currentChatId: 'chat-123',
        streamingMessageId: 'msg-stream-1',
        messages: [createMessage('msg-stream-1', 'assistant', 'Chunk 1 and Chunk 2')],
      })
      rerender(<ChatArea />)

      expect(statusRegion).toHaveTextContent('AI đang trả lời')
    })

    it('does not announce when streamingMessageId is null', () => {
      configureStores({
        currentChatId: 'chat-123',
        streamingMessageId: null,
      })

      render(<ChatArea />)

      const statusRegion = screen.getByTestId('streaming-status-announcer')
      expect(statusRegion).toBeInTheDocument()
      expect(statusRegion).toHaveTextContent('')
    })

    it('clears announcement when streaming finishes or is aborted', () => {
      configureStores({
        currentChatId: 'chat-123',
        streamingMessageId: 'msg-stream-1',
      })

      const { rerender } = render(<ChatArea />)
      const statusRegion = screen.getByTestId('streaming-status-announcer')
      expect(statusRegion).toHaveTextContent('AI đang trả lời')

      // Stream ends/aborts
      configureStores({
        currentChatId: 'chat-123',
        streamingMessageId: null,
      })
      rerender(<ChatArea />)

      expect(statusRegion).toHaveTextContent('')
    })
  })
})

