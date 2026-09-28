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

  it('should send message when Enter is pressed in normal composer', async () => {
    const user = userEvent.setup()

    mockStreamMessage.mockResolvedValue({
      userMessage: {
        id: 'user-1',
        chatSessionId: 'chat-123',
        createdAt: new Date().toISOString(),
        role: 'user',
        content: 'Testing enter submit',
        attachments: [],
      },
      assistantMessage: {
        id: 'assistant-1',
        chatSessionId: 'chat-123',
        createdAt: new Date().toISOString(),
        role: 'assistant',
        content: 'Received',
        attachments: [],
      },
    })

    render(<ChatInput />)

    const textarea = screen.getByPlaceholderText('Nhập tin nhắn...')
    await user.type(textarea, 'Testing enter submit{Enter}')

    expect(mockStreamMessage).toHaveBeenCalledTimes(1)
    expect(mockStreamMessage.mock.calls[0][1]).toBe('Testing enter submit')
  })

  it('should allow newline and NOT send message when Shift + Enter is pressed', async () => {
    const user = userEvent.setup()

    render(<ChatInput />)

    const textarea = screen.getByPlaceholderText('Nhập tin nhắn...')
    await user.type(textarea, 'Line 1{Shift>}{Enter}{/Shift}Line 2')

    expect(mockStreamMessage).not.toHaveBeenCalled()
    expect((textarea as HTMLTextAreaElement).value).toContain('Line 1')
    expect((textarea as HTMLTextAreaElement).value).toContain('Line 2')
  })

  it('should not send message when Enter is pressed on empty or whitespace content', async () => {
    const user = userEvent.setup()

    render(<ChatInput />)

    const textarea = screen.getByPlaceholderText('Nhập tin nhắn...')
    await user.type(textarea, '   {Enter}')

    expect(mockStreamMessage).not.toHaveBeenCalled()
  })

  it('should open ExpandedEditorModal when Expand button is clicked and synchronize draft', async () => {
    const user = userEvent.setup()

    render(<ChatInput />)

    const textarea = screen.getByPlaceholderText('Nhập tin nhắn...')
    await user.type(textarea, 'Draft before expand')

    const expandBtn = screen.getByTitle('Mở rộng trình soạn thảo')
    await user.click(expandBtn)

    // Modal should be open
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Soạn tin nhắn')).toBeInTheDocument()

    const modalTextarea = screen.getByPlaceholderText('Nhập nội dung tin nhắn chi tiết, đoạn mã, hoặc tài liệu...') as HTMLTextAreaElement
    expect(modalTextarea.value).toBe('Draft before expand')

    // Modify inside modal
    await user.type(modalTextarea, ' and updated')

    // Close modal via close button
    const closeBtn = screen.getByTitle('Đóng (Esc)')
    await user.click(closeBtn)

    // Modal closed
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    // Composer retains updated draft
    expect((screen.getByPlaceholderText('Nhập tin nhắn...') as HTMLTextAreaElement).value).toBe('Draft before expand and updated')
  })

  it('should preserve draft when Escape is pressed to close ExpandedEditorModal', async () => {
    const user = userEvent.setup()

    render(<ChatInput />)

    const textarea = screen.getByPlaceholderText('Nhập tin nhắn...')
    await user.type(textarea, 'Important draft')

    const expandBtn = screen.getByTitle('Mở rộng trình soạn thảo')
    await user.click(expandBtn)

    expect(screen.getByRole('dialog')).toBeInTheDocument()

    // Press Escape
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect((screen.getByPlaceholderText('Nhập tin nhắn...') as HTMLTextAreaElement).value).toBe('Important draft')
  })

  it('should send message via Ctrl + Enter in ExpandedEditorModal and close modal on success', async () => {
    const user = userEvent.setup()

    mockStreamMessage.mockResolvedValue({
      userMessage: {
        id: 'user-1',
        chatSessionId: 'chat-123',
        createdAt: new Date().toISOString(),
        role: 'user',
        content: 'Long prompt from modal',
        attachments: [],
      },
      assistantMessage: {
        id: 'assistant-1',
        chatSessionId: 'chat-123',
        createdAt: new Date().toISOString(),
        role: 'assistant',
        content: 'Response',
        attachments: [],
      },
    })

    render(<ChatInput />)

    const textarea = screen.getByPlaceholderText('Nhập tin nhắn...')
    await user.type(textarea, 'Long prompt from modal')

    const expandBtn = screen.getByTitle('Mở rộng trình soạn thảo')
    await user.click(expandBtn)

    const modalTextarea = screen.getByPlaceholderText('Nhập nội dung tin nhắn chi tiết, đoạn mã, hoặc tài liệu...')
    // Press Ctrl+Enter inside modal
    await user.type(modalTextarea, '{Control>}{Enter}{/Control}')

    expect(mockStreamMessage).toHaveBeenCalledTimes(1)
    expect(mockStreamMessage.mock.calls[0][1]).toBe('Long prompt from modal')

    // Modal should close on send
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should render file attachment inside composer and remove it without clearing text draft', async () => {
    const user = userEvent.setup()

    render(<ChatInput />)

    const textarea = screen.getByPlaceholderText('Nhập tin nhắn...')
    await user.type(textarea, 'Draft text before attachment')

    const file = new File(['file content'], 'sample-document.pdf', {
      type: 'application/pdf',
    })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(fileInput, file)

    // Verify file chip is rendered with name and accessible remove button
    expect(screen.getByText('sample-document.pdf')).toBeInTheDocument()
    const removeBtn = screen.getByRole('button', {
      name: 'Xóa file sample-document.pdf',
    })
    expect(removeBtn).toBeInTheDocument()
    expect(removeBtn).toHaveAttribute('title', 'Xóa file sample-document.pdf')

    // Text draft should still be intact
    expect((textarea as HTMLTextAreaElement).value).toBe('Draft text before attachment')

    // Click remove button
    await user.click(removeBtn)

    // File is removed
    expect(screen.queryByText('sample-document.pdf')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Xóa file sample-document.pdf' })).not.toBeInTheDocument()

    // Text draft remains intact after file removal
    expect((textarea as HTMLTextAreaElement).value).toBe('Draft text before attachment')
  })
})


