import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatInput from './ChatInput'

const {
  mockUseChatStore,
  mockUseAIStore,
  mockUseMessageStore,
  mockStreamMessage,
  mockUseTypewriterQueue,
} = vi.hoisted(() => ({
  mockUseChatStore: vi.fn(),
  mockUseAIStore: vi.fn(),
  mockUseMessageStore: vi.fn(),
  mockStreamMessage: vi.fn(),
  mockUseTypewriterQueue: vi.fn(),
}))

vi.mock('../stores/chatStore', () => ({
  useChatStore: mockUseChatStore,
}))

vi.mock('../stores/aiStore', () => ({
  useAIStore: mockUseAIStore,
}))

vi.mock('../stores/messageStore', () => ({
  useMessageStore: mockUseMessageStore,
}))

vi.mock('../services/streamService', () => ({
  streamMessage: mockStreamMessage,
}))

vi.mock('../hooks/useTypewriterQueue', () => ({
  useTypewriterQueue: mockUseTypewriterQueue,
}))

describe('ChatInput', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUseChatStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        currentChatId: 'chat-123',
      })
    )

    mockUseAIStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        selectedModelId: 'ollama-qwen3-1.7b',
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
      })
    )

    mockUseTypewriterQueue.mockReturnValue({
      enqueue: vi.fn(),
      waitDrained: vi.fn().mockResolvedValue(undefined),
      flushAll: vi.fn(),
      reset: vi.fn(),
    })
  })
  it('should render the message input and send button', () => {
    mockUseChatStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        currentChatId: 'chat-123',
      })
    )

    mockUseAIStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        selectedModelId: 'ollama-qwen3-1.7b',
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
      })
    )

    mockUseTypewriterQueue.mockReturnValue({
      enqueue: vi.fn(),
      waitDrained: vi.fn(),
      flushAll: vi.fn(),
      reset: vi.fn(),
    })

    render(<ChatInput />)

    expect(
      screen.getByPlaceholderText('Nhập tin nhắn...')
    ).toBeInTheDocument()

    expect(
      screen.getByRole('button', {
        name: 'Gửi',
      })
    ).toBeInTheDocument()
  })

  it('should disable the send button when no model is selected', () => {
    mockUseChatStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        currentChatId: 'chat-123',
      })
    )

    mockUseAIStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        selectedModelId: null,
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
      })
    )

    mockUseTypewriterQueue.mockReturnValue({
      enqueue: vi.fn(),
      waitDrained: vi.fn(),
      flushAll: vi.fn(),
      reset: vi.fn(),
    })

    render(<ChatInput />)

    expect(
      screen.getByRole('button', {
        name: 'Gửi',
      })
    ).toBeDisabled()
  })

  it('should send the message with the correct parameters', async () => {
    const user = userEvent.setup()

    mockStreamMessage.mockResolvedValue({
      userMessage: {
        id: 'user-1',
        chatSessionId: 'chat-123',
        createdAt: new Date().toISOString(),
        role: 'user',
        content: 'Hello AI',
        attachments: [],
      },
      assistantMessage: {
        id: 'assistant-1',
        chatSessionId: 'chat-123',
        createdAt: new Date().toISOString(),
        role: 'assistant',
        content: 'Hello from AI',
        attachments: [],
      },
    })

    render(<ChatInput />)

    const input = screen.getByPlaceholderText('Nhập tin nhắn...')

    await user.type(input, '   Hello AI   ')

    await user.click(
      screen.getByRole('button', {
        name: 'Gửi',
      })
    )

    expect(mockStreamMessage).toHaveBeenCalledTimes(1)

    const [
      chatId,
      content,
      modelId,
      onChunk,
      signal,
      selectedFile,
    ] = mockStreamMessage.mock.calls[0]

    expect(chatId).toBe('chat-123')
    expect(content).toBe('Hello AI')
    expect(modelId).toBe('ollama-qwen3-1.7b')
    expect(onChunk).toEqual(expect.any(Function))
    expect(signal).toBeInstanceOf(AbortSignal)
    expect(selectedFile).toBeNull()
  })

  it('should not send when the message contains only whitespace', async () => {
    const user = userEvent.setup()

    render(<ChatInput />)

    const input = screen.getByPlaceholderText('Nhập tin nhắn...')

    await user.type(input, '     ')

    await user.click(
      screen.getByRole('button', {
        name: 'Gửi',
      })
    )

    expect(mockStreamMessage).not.toHaveBeenCalled()
  })

  it('should send the selected file with the message', async () => {
    const user = userEvent.setup()

    mockStreamMessage.mockResolvedValue({
      userMessage: {
        id: 'user-1',
        chatSessionId: 'chat-123',
        createdAt: new Date().toISOString(),
        role: 'user',
        content: 'Hello with file',
        attachments: [],
      },
      assistantMessage: {
        id: 'assistant-1',
        chatSessionId: 'chat-123',
        createdAt: new Date().toISOString(),
        role: 'assistant',
        content: 'File received',
        attachments: [],
      },
    })

    render(<ChatInput />)

    const file = new File(
      ['Hello from test file'],
      'test.txt',
      { type: 'text/plain' }
    )

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement

    await user.upload(fileInput, file)

    expect(screen.getByText(/test\.txt/)).toBeInTheDocument()

    const input = screen.getByPlaceholderText('Nhập tin nhắn...')

    await user.type(input, 'Hello with file')

    await user.click(
      screen.getByRole('button', {
        name: 'Gửi',
      })
    )

    expect(mockStreamMessage).toHaveBeenCalledTimes(1)

    const [
      chatId,
      content,
      modelId,
      onChunk,
      signal,
      selectedFile,
    ] = mockStreamMessage.mock.calls[0]

    expect(chatId).toBe('chat-123')
    expect(content).toBe('Hello with file')
    expect(modelId).toBe('ollama-qwen3-1.7b')
    expect(onChunk).toEqual(expect.any(Function))
    expect(signal).toBeInstanceOf(AbortSignal)
    expect(selectedFile).toBe(file)
  })

  it('should show stop state and disable input while streaming', () => {
    mockUseMessageStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        addMessage: vi.fn(),
        updateMessage: vi.fn(),
        streamingMessageId: 'assistant-123',
        setStreamingMessageId: vi.fn(),
        abortCurrentStream: vi.fn(),
        setAbortCurrentStream: vi.fn(),
        replaceMessage: vi.fn(),
      })
    )

    render(<ChatInput />)

    expect(
      screen.getByRole('button', {
        name: 'Dừng',
      })
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('button', {
        name: 'Gửi',
      })
    ).not.toBeInTheDocument()

    expect(
      screen.getByPlaceholderText('Nhập tin nhắn...')
    ).toBeDisabled()

    expect(
      screen.getByTitle('Đính kèm file')
    ).toBeDisabled()
  })

  it('should abort the current stream when stop is clicked', async () => {
    const user = userEvent.setup()
    const abortCurrentStream = vi.fn()

    mockUseMessageStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        addMessage: vi.fn(),
        updateMessage: vi.fn(),
        streamingMessageId: 'assistant-123',
        setStreamingMessageId: vi.fn(),
        abortCurrentStream,
        setAbortCurrentStream: vi.fn(),
        replaceMessage: vi.fn(),
      })
    )

    render(<ChatInput />)

    await user.click(
      screen.getByRole('button', {
        name: 'Dừng',
      })
    )

    expect(abortCurrentStream).toHaveBeenCalledTimes(1)
  })

  it('should abort the internal controller and flush the queue when no abort action is provided', async () => {
    const user = userEvent.setup()
    const flushAll = vi.fn()

    let resolveStream: () => void = () => {}

    mockStreamMessage.mockImplementation(
      (
        _chatId: string,
        _content: string,
        _modelId: string,
        _onChunk: (chunk: string) => void,
        _signal: AbortSignal,
        _file: File | null
      ) =>
        new Promise((resolve) => {
          resolveStream = () => {
            resolve({
              userMessage: {
                id: 'user-1',
                chatSessionId: 'chat-123',
                createdAt: new Date().toISOString(),
                role: 'user',
                content: 'Hello',
                attachments: [],
              },
              assistantMessage: {
                id: 'assistant-1',
                chatSessionId: 'chat-123',
                createdAt: new Date().toISOString(),
                role: 'assistant',
                content: 'Hello from AI',
                attachments: [],
              },
            })
          }
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
      })
    )

    mockUseTypewriterQueue.mockReturnValue({
      enqueue: vi.fn(),
      waitDrained: vi.fn().mockResolvedValue(undefined),
      flushAll,
      reset: vi.fn(),
    })

    render(<ChatInput />)

    const input = screen.getByPlaceholderText('Nhập tin nhắn...')

    await user.type(input, 'Hello')

    await user.click(
      screen.getByRole('button', {
        name: 'Gửi',
      })
    )

    expect(
      screen.getByRole('button', {
        name: 'Dừng',
      })
    ).toBeInTheDocument()

    const [, , , , signal] = mockStreamMessage.mock.calls[0]

    expect(signal).toBeInstanceOf(AbortSignal)
    expect(signal.aborted).toBe(false)

    await user.click(
      screen.getByRole('button', {
        name: 'Dừng',
      })
    )

    expect(signal.aborted).toBe(true)
    expect(flushAll).toHaveBeenCalledTimes(1)

    resolveStream()
  })
})
