import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, act, fireEvent, createEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatInput from './ChatInput'

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

vi.mock('../services/chatService', () => ({
  createChat: mockCreateChat,
}))

vi.mock('../hooks/useTypewriterQueue', () => ({
  useTypewriterQueue: mockUseTypewriterQueue,
}))

describe('ChatInput', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete (mockUseChatStore as unknown as { getState?: unknown }).getState
    delete (mockUseMessageStore as unknown as { getState?: unknown }).getState

    mockCreateChat.mockResolvedValue({
      id: 'chat-new-1',
      title: 'New chat',
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
  it('should render the message input and send button', () => {
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

  it('should insert 4 spaces on Tab and preserve caret/draft in ExpandedEditorModal', async () => {
    const user = userEvent.setup()

    render(<ChatInput />)

    const textarea = screen.getByPlaceholderText('Nhập tin nhắn...')
    await user.type(textarea, 'Hello')

    const expandBtn = screen.getByTitle('Mở rộng trình soạn thảo')
    await user.click(expandBtn)

    const modalTextarea = screen.getByPlaceholderText('Nhập nội dung tin nhắn chi tiết, đoạn mã, hoặc tài liệu...') as HTMLTextAreaElement
    expect(modalTextarea.value).toBe('Hello')

    // Press Tab
    await user.type(modalTextarea, '{Tab}')
    expect(modalTextarea.value).toBe('Hello    ')

    // Type more
    await user.type(modalTextarea, 'world')
    expect(modalTextarea.value).toBe('Hello    world')
  })

  it('should not insert spaces and not preventDefault when Shift+Tab is pressed in ExpandedEditorModal', async () => {
    render(<ChatInput />)

    const expandBtn = screen.getByTitle('Mở rộng trình soạn thảo')
    fireEvent.click(expandBtn)

    const modalTextarea = screen.getByPlaceholderText('Nhập nội dung tin nhắn chi tiết, đoạn mã, hoặc tài liệu...') as HTMLTextAreaElement
    fireEvent.change(modalTextarea, { target: { value: 'Code block' } })

    const shiftTabEvent = createEvent.keyDown(modalTextarea, {
      key: 'Tab',
      shiftKey: true,
    })
    fireEvent(modalTextarea, shiftTabEvent)

    expect(shiftTabEvent.defaultPrevented).toBe(false)
    expect(modalTextarea.value).toBe('Code block')
  })

  it('should not dismiss ExpandedEditorModal on backdrop or dialog click, but dismiss on Hủy button or close button', async () => {
    const user = userEvent.setup()

    render(<ChatInput />)

    const textarea = screen.getByPlaceholderText('Nhập tin nhắn...')
    await user.type(textarea, 'Draft in modal')

    const expandBtn = screen.getByTitle('Mở rộng trình soạn thảo')
    await user.click(expandBtn)

    expect(screen.getByRole('dialog')).toBeInTheDocument()

    // Click backdrop - should NOT close modal
    const backdrop = screen.getByTestId('expanded-editor-backdrop')
    await user.click(backdrop)
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    // Click inside dialog - should NOT close modal
    const dialog = screen.getByRole('dialog')
    await user.click(dialog)
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    // Click Hủy button to close
    const cancelBtn = screen.getByRole('button', { name: 'Hủy' })
    await user.click(cancelBtn)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect((screen.getByPlaceholderText('Nhập tin nhắn...') as HTMLTextAreaElement).value).toBe('Draft in modal')
  })

  it('should show attachment pill in ExpandedEditorModal when file is attached and preserve file on close/edit', async () => {
    const user = userEvent.setup()

    render(<ChatInput />)

    // Upload a file
    const file = new File(['content of pdf'], 'architecture-guide.pdf', {
      type: 'application/pdf',
    })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(fileInput, file)

    // Verify attachment in composer
    expect(screen.getByText('architecture-guide.pdf')).toBeInTheDocument()

    // Open ExpandedEditorModal
    const expandBtn = screen.getByTitle('Mở rộng trình soạn thảo')
    await user.click(expandBtn)

    // Verify attachment pill inside modal
    const modalPill = screen.getByTestId('modal-attachment-pill')
    expect(modalPill).toBeInTheDocument()
    expect(modalPill).toHaveTextContent('architecture-guide.pdf')

    // Edit draft inside modal
    const modalTextarea = screen.getByPlaceholderText('Nhập nội dung tin nhắn chi tiết, đoạn mã, hoặc tài liệu...')
    await user.type(modalTextarea, 'Analysis of attached PDF')

    // Close modal via close button
    const closeBtn = screen.getByTitle('Đóng (Esc)')
    await user.click(closeBtn)

    // Modal closed, composer still has both draft and attached file intact
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect((screen.getByPlaceholderText('Nhập tin nhắn...') as HTMLTextAreaElement).value).toBe('Analysis of attached PDF')
    expect(screen.getByText('architecture-guide.pdf')).toBeInTheDocument()
  })

  it('should not show attachment pill in ExpandedEditorModal if no file is selected', async () => {
    const user = userEvent.setup()

    render(<ChatInput />)

    const expandBtn = screen.getByTitle('Mở rộng trình soạn thảo')
    await user.click(expandBtn)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.queryByTestId('modal-attachment-pill')).not.toBeInTheDocument()
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

  describe('ai-chat-prompt-select event handling', () => {
    it('should populate prompt and focus textarea when input is empty', () => {
      render(<ChatInput />)
      const textarea = screen.getByPlaceholderText('Nhập tin nhắn...')

      act(() => {
        window.dispatchEvent(
          new CustomEvent('ai-chat-prompt-select', {
            detail: 'Hãy giúp tôi tối ưu đoạn mã sau:',
          })
        )
      })

      expect((textarea as HTMLTextAreaElement).value).toBe('Hãy giúp tôi tối ưu đoạn mã sau:')
      expect(textarea).toHaveFocus()
      expect(mockStreamMessage).not.toHaveBeenCalled()
    })

    it('should not overwrite existing non-whitespace text and display a clear notification', async () => {
      const user = userEvent.setup()
      render(<ChatInput />)
      const textarea = screen.getByPlaceholderText('Nhập tin nhắn...')

      await user.type(textarea, 'Văn bản của người dùng đang gõ')

      act(() => {
        window.dispatchEvent(
          new CustomEvent('ai-chat-prompt-select', {
            detail: 'Prompt mới không được ghi đè',
          })
        )
      })

      // Value must not be overwritten
      expect((textarea as HTMLTextAreaElement).value).toBe('Văn bản của người dùng đang gõ')
      // Notification banner should be visible
      expect(
        screen.getByText('Vui lòng xóa nội dung đang soạn thảo trước khi chọn gợi ý.')
      ).toBeInTheDocument()
      // Should not auto-send
      expect(mockStreamMessage).not.toHaveBeenCalled()
    })

    it('should allow filling prompt when input only contains whitespace', async () => {
      const user = userEvent.setup()
      render(<ChatInput />)
      const textarea = screen.getByPlaceholderText('Nhập tin nhắn...')

      await user.type(textarea, '   ')

      act(() => {
        window.dispatchEvent(
          new CustomEvent('ai-chat-prompt-select', {
            detail: 'Prompt thay thế khoảng trắng',
          })
        )
      })

      expect((textarea as HTMLTextAreaElement).value).toBe('Prompt thay thế khoảng trắng')
      expect(textarea).toHaveFocus()
    })

    it('should ignore prompt selection when chat input is active (streaming or sending)', () => {
      mockUseMessageStore.mockImplementation((selector: (state: unknown) => unknown) =>
        selector({
          addMessage: vi.fn(),
          updateMessage: vi.fn(),
          streamingMessageId: 'active-stream-123',
          setStreamingMessageId: vi.fn(),
          abortCurrentStream: null,
          setAbortCurrentStream: vi.fn(),
          replaceMessage: vi.fn(),
        })
      )

      render(<ChatInput />)
      const textarea = screen.getByPlaceholderText('Nhập tin nhắn...')

      act(() => {
        window.dispatchEvent(
          new CustomEvent('ai-chat-prompt-select', {
            detail: 'Prompt này phải bị bỏ qua',
          })
        )
      })

      expect((textarea as HTMLTextAreaElement).value).toBe('')
      expect(mockStreamMessage).not.toHaveBeenCalled()
    })

    it('should clean up the event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
      const { unmount } = render(<ChatInput />)

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'ai-chat-prompt-select',
        expect.any(Function)
      )
    })
  })

  // === Fix1 Regression Tests ===
  describe('Fix1 Regression Tests', () => {
    it('Fix1-D: should remove empty assistant placeholder if request fails before receiving any chunk', async () => {
      const addMessageMock = vi.fn()
      const removeMessageMock = vi.fn()

      mockUseMessageStore.mockImplementation((selector: (state: unknown) => unknown) =>
        selector({
          addMessage: addMessageMock,
          updateMessage: vi.fn(),
          streamingMessageId: null,
          setStreamingMessageId: vi.fn(),
          abortCurrentStream: null,
          setAbortCurrentStream: vi.fn(),
          replaceMessage: vi.fn(),
          removeMessage: removeMessageMock,
        })
      )

      // Simulate streamMessage failing immediately before any chunk
      mockStreamMessage.mockRejectedValueOnce(new Error('Network failure'))

      const user = userEvent.setup()
      render(<ChatInput />)

      const textarea = screen.getByPlaceholderText('Nhập tin nhắn...')
      const sendButton = screen.getByRole('button', { name: 'Gửi' })

      await user.type(textarea, 'Test message')
      await user.click(sendButton)

      // 2 messages added: userMessage and empty assistantMessage
      expect(addMessageMock).toHaveBeenCalledTimes(2)
      const assistantMessageCall = addMessageMock.mock.calls[1][0]
      expect(assistantMessageCall.role).toBe('assistant')
      expect(assistantMessageCall.content).toBe('')

      // removeMessage must be called with assistantMessageId to clean up empty placeholder
      expect(removeMessageMock).toHaveBeenCalledWith(assistantMessageCall.id)
    })

    it('Fix1-D: should NOT remove assistant message if stream fails after chunk was already received', async () => {
      const addMessageMock = vi.fn()
      const removeMessageMock = vi.fn()

      mockUseMessageStore.mockImplementation((selector: (state: unknown) => unknown) =>
        selector({
          addMessage: addMessageMock,
          updateMessage: vi.fn(),
          streamingMessageId: null,
          setStreamingMessageId: vi.fn(),
          abortCurrentStream: null,
          setAbortCurrentStream: vi.fn(),
          replaceMessage: vi.fn(),
          removeMessage: removeMessageMock,
        })
      )

      // Simulate streamMessage receiving a chunk and then failing
      mockStreamMessage.mockImplementationOnce(
        async (_chatId, _content, _model, onChunk) => {
          onChunk('Partial content')
          throw new Error('Connection lost mid-stream')
        }
      )

      const user = userEvent.setup()
      render(<ChatInput />)

      const textarea = screen.getByPlaceholderText('Nhập tin nhắn...')
      const sendButton = screen.getByRole('button', { name: 'Gửi' })

      await user.type(textarea, 'Test message')
      await user.click(sendButton)

      // removeMessage must NOT be called since assistant already received partial content
      expect(removeMessageMock).not.toHaveBeenCalled()
    })

    it('Fix1-C: stream cleanup does not clear streamingMessageId if a different stream has taken over', async () => {
      const setStreamingMessageIdMock = vi.fn()
      const setAbortCurrentStreamMock = vi.fn()

      // When stream finishes, suppose store.streamingMessageId is now 'another-stream-id'
      mockUseMessageStore.getState = vi.fn().mockReturnValue({
        streamingMessageId: 'newer-stream-session-id',
      })

      mockUseMessageStore.mockImplementation((selector: (state: unknown) => unknown) =>
        selector({
          addMessage: vi.fn(),
          updateMessage: vi.fn(),
          streamingMessageId: null,
          setStreamingMessageId: setStreamingMessageIdMock,
          abortCurrentStream: null,
          setAbortCurrentStream: setAbortCurrentStreamMock,
          replaceMessage: vi.fn(),
          removeMessage: vi.fn(),
        })
      )

      mockStreamMessage.mockResolvedValueOnce({
        userMessage: { id: 'u1', content: 'test' },
        assistantMessage: { id: 'a1', content: 'response' },
      })

      const user = userEvent.setup()
      render(<ChatInput />)

      const textarea = screen.getByPlaceholderText('Nhập tin nhắn...')
      const sendButton = screen.getByRole('button', { name: 'Gửi' })

      await user.type(textarea, 'Test message')
      await user.click(sendButton)

      // Since another stream is active ('newer-stream-session-id'), finally should NOT reset to null
      expect(setStreamingMessageIdMock).not.toHaveBeenCalledWith(null)
      expect(setAbortCurrentStreamMock).not.toHaveBeenCalledWith(null)
    })
  })

  describe('Patch 2.3 — Unmount Hardening & Post-waitDrained Run Identity Guard', () => {
    it('aborts active controller and calls resetQueue on unmount during stream', async () => {
      let capturedSignal: AbortSignal | undefined
      const resetMock = vi.fn()
      mockUseTypewriterQueue.mockReturnValue({
        enqueue: vi.fn(),
        waitDrained: vi.fn().mockResolvedValue(undefined),
        flushAll: vi.fn(),
        reset: resetMock,
      })

      // Simulate a stream that remains pending until aborted
      mockStreamMessage.mockImplementation(
        (_chatId, _content, _model, _onChunk, signal) => {
          capturedSignal = signal
          return new Promise((_, reject) => {
            signal?.addEventListener('abort', () => {
              const err = new DOMException('The operation was aborted', 'AbortError')
              reject(err)
            })
          })
        }
      )

      const user = userEvent.setup()
      const { unmount } = render(<ChatInput />)

      const textarea = screen.getByPlaceholderText('Nhập tin nhắn...')
      const sendButton = screen.getByRole('button', { name: 'Gửi' })

      await user.type(textarea, 'Testing unmount')
      await user.click(sendButton)

      expect(capturedSignal).toBeDefined()
      expect(capturedSignal?.aborted).toBe(false)

      // Unmount while stream is still running
      unmount()

      expect(capturedSignal?.aborted).toBe(true)
      expect(resetMock).toHaveBeenCalled()
    })

    it('does NOT call replaceMessage if unmounted while waitDrained is pending', async () => {
      const replaceMessageMock = vi.fn()
      let resolveWaitDrained!: () => void
      const waitDrainedPromise = new Promise<void>((resolve) => {
        resolveWaitDrained = resolve
      })

      mockUseMessageStore.mockImplementation((selector: (state: unknown) => unknown) =>
        selector({
          addMessage: vi.fn(),
          updateMessage: vi.fn(),
          streamingMessageId: null,
          setStreamingMessageId: vi.fn(),
          abortCurrentStream: null,
          setAbortCurrentStream: vi.fn(),
          replaceMessage: replaceMessageMock,
          removeMessage: vi.fn(),
        })
      )

      mockUseTypewriterQueue.mockReturnValue({
        enqueue: vi.fn(),
        waitDrained: vi.fn().mockImplementation(() => waitDrainedPromise),
        flushAll: vi.fn(),
        reset: vi.fn().mockImplementation(() => {
          resolveWaitDrained()
        }),
      })

      mockStreamMessage.mockResolvedValueOnce({
        userMessage: { id: 'u-1', content: 'test' },
        assistantMessage: { id: 'a-1', content: 'hello' },
      })

      const user = userEvent.setup()
      const { unmount } = render(<ChatInput />)

      const textarea = screen.getByPlaceholderText('Nhập tin nhắn...')
      const sendButton = screen.getByRole('button', { name: 'Gửi' })

      await user.type(textarea, 'Unmount during drain')
      await user.click(sendButton)

      // Unmount while waitDrained is awaiting
      act(() => {
        unmount()
      })

      await waitDrainedPromise

      // Even though waitDrained resolved, replaceMessage must NOT be called
      expect(replaceMessageMock).not.toHaveBeenCalled()
    })

    it('does NOT call replaceMessage if run was invalidated while waitDrained was pending', async () => {
      const replaceMessageMock = vi.fn()
      let resolveWaitDrained!: () => void
      const waitDrainedPromise = new Promise<void>((resolve) => {
        resolveWaitDrained = resolve
      })

      mockUseMessageStore.mockImplementation((selector: (state: unknown) => unknown) =>
        selector({
          addMessage: vi.fn(),
          updateMessage: vi.fn(),
          streamingMessageId: null,
          setStreamingMessageId: vi.fn(),
          abortCurrentStream: null,
          setAbortCurrentStream: vi.fn(),
          replaceMessage: replaceMessageMock,
          removeMessage: vi.fn(),
        })
      )

      mockUseTypewriterQueue.mockReturnValue({
        enqueue: vi.fn(),
        waitDrained: vi.fn().mockImplementation(() => waitDrainedPromise),
        flushAll: vi.fn(),
        reset: vi.fn(),
      })

      mockStreamMessage.mockResolvedValueOnce({
        userMessage: { id: 'u-first', content: 'first' },
        assistantMessage: { id: 'a-first', content: 'first-response' },
      })

      const user = userEvent.setup()
      render(<ChatInput />)

      const textarea = screen.getByPlaceholderText('Nhập tin nhắn...')
      const sendButton = screen.getByRole('button', { name: 'Gửi' })

      await user.type(textarea, 'First message')
      await user.click(sendButton)

      // Suppose active chat switched while waitDrained was running
      mockUseChatStore.mockImplementation((selector: (state: unknown) => unknown) =>
        selector({
          currentChatId: 'different-chat-456',
        })
      )
      mockUseChatStore.getState = vi.fn().mockReturnValue({
        currentChatId: 'different-chat-456',
      })

      await act(async () => {
        resolveWaitDrained()
      })

      expect(replaceMessageMock).not.toHaveBeenCalled()
    })

    it('reconciles messages via replaceMessage if run is still valid after waitDrained', async () => {
      const replaceMessageMock = vi.fn()
      mockUseMessageStore.mockImplementation((selector: (state: unknown) => unknown) =>
        selector({
          addMessage: vi.fn(),
          updateMessage: vi.fn(),
          streamingMessageId: null,
          setStreamingMessageId: vi.fn(),
          abortCurrentStream: null,
          setAbortCurrentStream: vi.fn(),
          replaceMessage: replaceMessageMock,
          removeMessage: vi.fn(),
        })
      )

      const serverUserMsg = {
        id: 'server-u1',
        chatSessionId: 'chat-123',
        createdAt: '2026-09-27T00:00:00.000Z',
        role: 'user' as const,
        content: 'Hello',
        attachments: [],
      }
      const serverAssistantMsg = {
        id: 'server-a1',
        chatSessionId: 'chat-123',
        createdAt: '2026-09-27T00:00:01.000Z',
        role: 'assistant' as const,
        content: 'Hi there',
        attachments: [],
      }

      mockStreamMessage.mockResolvedValueOnce({
        userMessage: serverUserMsg,
        assistantMessage: serverAssistantMsg,
      })

      mockUseTypewriterQueue.mockReturnValue({
        enqueue: vi.fn(),
        waitDrained: vi.fn().mockResolvedValue(undefined),
        flushAll: vi.fn(),
        reset: vi.fn(),
      })

      const user = userEvent.setup()
      render(<ChatInput />)

      const textarea = screen.getByPlaceholderText('Nhập tin nhắn...')
      const sendButton = screen.getByRole('button', { name: 'Gửi' })

      await user.type(textarea, 'Hello')
      await user.click(sendButton)

      expect(replaceMessageMock).toHaveBeenCalledTimes(2)
      expect(replaceMessageMock).toHaveBeenCalledWith(expect.any(String), serverUserMsg)
      expect(replaceMessageMock).toHaveBeenCalledWith(expect.any(String), serverAssistantMsg)
    })

    it('does NOT call replaceMessage if currentChatId became null while waitDrained was pending', async () => {
      const replaceMessageMock = vi.fn()
      let resolveWaitDrained!: () => void
      const waitDrainedPromise = new Promise<void>((resolve) => {
        resolveWaitDrained = resolve
      })

      mockUseMessageStore.mockImplementation((selector: (state: unknown) => unknown) =>
        selector({
          addMessage: vi.fn(),
          updateMessage: vi.fn(),
          streamingMessageId: null,
          setStreamingMessageId: vi.fn(),
          abortCurrentStream: null,
          setAbortCurrentStream: vi.fn(),
          replaceMessage: replaceMessageMock,
          removeMessage: vi.fn(),
        })
      )

      mockUseTypewriterQueue.mockReturnValue({
        enqueue: vi.fn(),
        waitDrained: vi.fn().mockImplementation(() => waitDrainedPromise),
        flushAll: vi.fn(),
        reset: vi.fn(),
      })

      mockStreamMessage.mockResolvedValueOnce({
        userMessage: { id: 'u-null-test', content: 'hello' },
        assistantMessage: { id: 'a-null-test', content: 'world' },
      })

      // Start with active chat 'chat-123'
      mockUseChatStore.mockImplementation((selector: (state: unknown) => unknown) =>
        selector({
          currentChatId: 'chat-123',
        })
      )
      mockUseChatStore.getState = vi.fn().mockReturnValue({
        currentChatId: 'chat-123',
      })

      const user = userEvent.setup()
      render(<ChatInput />)

      const textarea = screen.getByPlaceholderText('Nhập tin nhắn...')
      const sendButton = screen.getByRole('button', { name: 'Gửi' })

      await user.type(textarea, 'Message before chat becomes null')
      await user.click(sendButton)

      // Chat was deleted or reset to null while waitDrained was pending
      mockUseChatStore.getState = vi.fn().mockReturnValue({
        currentChatId: null,
      })

      await act(async () => {
        resolveWaitDrained()
      })

      // replaceMessage must NOT be called when currentChatId is null
      expect(replaceMessageMock).not.toHaveBeenCalled()
    })

    it('AUDIT-01: does NOT call streamMessage if unmounted while createChat is pending', async () => {
      let resolveCreateChat!: (chat: { id: string; title: string; createdAt: string }) => void
      const createChatPromise = new Promise<{ id: string; title: string; createdAt: string }>((resolve) => {
        resolveCreateChat = resolve
      })
      mockCreateChat.mockReturnValueOnce(createChatPromise)

      // Start with currentChatId === null (welcome screen)
      mockUseChatStore.mockImplementation((selector: (state: unknown) => unknown) =>
        selector({
          currentChatId: null,
          addChat: vi.fn(),
          setCurrentChatId: vi.fn(),
        })
      )

      const user = userEvent.setup()
      const { unmount } = render(<ChatInput />)

      const textarea = screen.getByPlaceholderText('Nhập tin nhắn...')
      const sendButton = screen.getByRole('button', { name: 'Gửi' })

      await user.type(textarea, 'First message on empty chat')
      await user.click(sendButton)

      // Expect createChat to have been called
      expect(mockCreateChat).toHaveBeenCalled()

      // Unmount ChatInput while createChat is still pending
      act(() => {
        unmount()
      })

      // Resolve createChat after component has unmounted
      await act(async () => {
        resolveCreateChat({
          id: 'new-chat-999',
          title: 'New chat',
          createdAt: new Date().toISOString(),
        })
      })

      // streamMessage must NOT be called because component already unmounted
      expect(mockStreamMessage).not.toHaveBeenCalled()
    })
  })

  describe('M6.1 — Composer Control Island & Model Indicator', () => {
    it('should render the selected model indicator inside composer control island', () => {
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

      render(<ChatInput />)

      const indicator = screen.getByTestId('model-indicator')
      expect(indicator).toBeInTheDocument()
      expect(indicator).toHaveTextContent('Qwen 3 1.7B')
      expect(indicator).toHaveAttribute('title', 'Mô hình AI: Qwen 3 1.7B')

      // Ensure model indicator is inside the composer container alongside the textarea
      const textarea = screen.getByPlaceholderText('Nhập tin nhắn...')
      expect(indicator.parentElement).toContainElement(textarea)

      // Ensure no duplicate model indicator
      expect(screen.getAllByText('Qwen 3 1.7B')).toHaveLength(1)
    })

    it('should NOT render external model status line outside composer capsule', () => {
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

      render(<ChatInput />)

      expect(screen.queryByText(/Đang sử dụng/)).not.toBeInTheDocument()
    })

    it('should NOT render model indicator or fake hardcoded name when no model is available/selected', () => {
      mockUseAIStore.mockImplementation((selector: (state: unknown) => unknown) =>
        selector({
          selectedModelId: null,
          models: [],
        })
      )

      render(<ChatInput />)

      expect(screen.queryByTestId('model-indicator')).not.toBeInTheDocument()
      expect(screen.queryByText('Qwen 3 1.7B')).not.toBeInTheDocument()
      expect(screen.queryByText(/Đang sử dụng/)).not.toBeInTheDocument()
    })

    it('should update model indicator when a different model is selected', () => {
      mockUseAIStore.mockImplementation((selector: (state: unknown) => unknown) =>
        selector({
          selectedModelId: 'gemini-1.5-flash',
          models: [
            {
              id: 'gemini-1.5-flash',
              name: 'Gemini 1.5 Flash',
            },
          ],
        })
      )

      render(<ChatInput />)

      const indicator = screen.getByTestId('model-indicator')
      expect(indicator).toBeInTheDocument()
      expect(indicator).toHaveTextContent('Gemini 1.5 Flash')
      expect(screen.queryByText('Qwen 3 1.7B')).not.toBeInTheDocument()
    })
  })

  describe('M6.2.1 — Popover Hardening: Click-Outside, Escape & Accessibility', () => {
    it('Test 1: should open and close popover with attachment toggle button', async () => {
      const user = userEvent.setup()
      render(<ChatInput />)

      const toggleButton = screen.getByRole('button', { name: 'Đính kèm file' })
      expect(screen.queryByRole('dialog', { name: 'Đính kèm tệp' })).not.toBeInTheDocument()

      // Click to open
      await user.click(toggleButton)
      expect(screen.getByRole('dialog', { name: 'Đính kèm tệp' })).toBeInTheDocument()

      // Click again to close
      await user.click(toggleButton)
      expect(screen.queryByRole('dialog', { name: 'Đính kèm tệp' })).not.toBeInTheDocument()
    })

    it('Test 2: should close popover on click outside', async () => {
      const user = userEvent.setup()
      render(
        <div>
          <div data-testid="outside-area">Outside content</div>
          <ChatInput />
        </div>
      )

      const toggleButton = screen.getByRole('button', { name: 'Đính kèm file' })
      await user.click(toggleButton)
      expect(screen.getByRole('dialog', { name: 'Đính kèm tệp' })).toBeInTheDocument()

      // Click outside area
      fireEvent.mouseDown(screen.getByTestId('outside-area'))
      expect(screen.queryByRole('dialog', { name: 'Đính kèm tệp' })).not.toBeInTheDocument()
    })

    it('Test 3: should NOT close popover on mousedown inside popover', async () => {
      const user = userEvent.setup()
      render(<ChatInput />)

      const toggleButton = screen.getByRole('button', { name: 'Đính kèm file' })
      await user.click(toggleButton)

      const popover = screen.getByRole('dialog', { name: 'Đính kèm tệp' })
      expect(popover).toBeInTheDocument()

      // Mousedown on the popover container itself
      fireEvent.mouseDown(popover)
      expect(screen.getByRole('dialog', { name: 'Đính kèm tệp' })).toBeInTheDocument()

      // Mousedown on child inside popover
      const codeOption = screen.getByTitle('Mã nguồn')
      fireEvent.mouseDown(codeOption)
      expect(screen.getByRole('dialog', { name: 'Đính kèm tệp' })).toBeInTheDocument()

      // Now click child to ensure its action triggers cleanly
      await user.click(codeOption)
      const textarea = screen.getByPlaceholderText('Nhập tin nhắn...')
      expect(textarea).toHaveValue('```\n\n```')
      expect(screen.queryByRole('dialog', { name: 'Đính kèm tệp' })).not.toBeInTheDocument()
    })

    it('Test 4: should close popover on Escape and return focus to toggle button', async () => {
      const user = userEvent.setup()
      render(<ChatInput />)

      const toggleButton = screen.getByRole('button', { name: 'Đính kèm file' })
      await user.click(toggleButton)
      expect(screen.getByRole('dialog', { name: 'Đính kèm tệp' })).toBeInTheDocument()

      // Press Escape
      fireEvent.keyDown(document, { key: 'Escape' })

      expect(screen.queryByRole('dialog', { name: 'Đính kèm tệp' })).not.toBeInTheDocument()
      expect(toggleButton).toHaveFocus()
    })

    it('Test 5: should handle Escape gracefully when popover is closed', () => {
      render(<ChatInput />)

      expect(screen.queryByRole('dialog', { name: 'Đính kèm tệp' })).not.toBeInTheDocument()

      // Press Escape when closed - should not throw or cause side effects
      expect(() => {
        fireEvent.keyDown(document, { key: 'Escape' })
      }).not.toThrow()

      expect(screen.queryByRole('dialog', { name: 'Đính kèm tệp' })).not.toBeInTheDocument()
    })

    it('Test 6: should have correct ARIA attributes reflecting state and dialog semantics', async () => {
      const user = userEvent.setup()
      render(<ChatInput />)

      const toggleButton = screen.getByRole('button', { name: 'Đính kèm file' })

      // Initial state: closed
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false')
      expect(toggleButton).toHaveAttribute('aria-haspopup', 'dialog')
      expect(toggleButton).toHaveAttribute('aria-controls', 'attachment-popover')

      // Open state
      await user.click(toggleButton)
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true')

      const popover = screen.getByRole('dialog', { name: 'Đính kèm tệp' })
      expect(popover).toHaveAttribute('id', 'attachment-popover')
      expect(popover).toHaveAttribute('role', 'dialog')
      expect(popover).toHaveAttribute('aria-label', 'Đính kèm tệp')

      // Close state
      await user.click(toggleButton)
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false')
    })

    it('Test 7: should cleanup event listeners when unmounted while popover is open', async () => {
      const user = userEvent.setup()
      const { unmount } = render(<ChatInput />)

      const toggleButton = screen.getByRole('button', { name: 'Đính kèm file' })
      await user.click(toggleButton)
      expect(screen.getByRole('dialog', { name: 'Đính kèm tệp' })).toBeInTheDocument()

      unmount()

      // Subsequent events on document should not throw or trigger state updates
      expect(() => {
        fireEvent.mouseDown(document.body)
        fireEvent.keyDown(document, { key: 'Escape' })
      }).not.toThrow()
    })
  })

  describe('M6.2.2 — Client-Side File Validation & Label Clarity', () => {
    const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MiB

    const createMockFile = (name: string, size: number, type = '') => {
      const file = new File(['content'], name, { type })
      Object.defineProperty(file, 'size', { value: size })
      return file
    }

    it('Test 1: should accept file with size strictly less than 10 MiB limit', () => {
      const { container } = render(<ChatInput />)
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
      const file = createMockFile('sample.pdf', 5 * 1024 * 1024, 'application/pdf')
      fireEvent.change(fileInput, { target: { files: [file] } })

      expect(screen.getByText('sample.pdf')).toBeInTheDocument()
      expect(screen.queryByText(/File không được vượt quá 10 MB/)).not.toBeInTheDocument()
    })

    it('Test 2: should accept file with size exactly equal to 10 MiB limit (10,485,760 bytes)', () => {
      const { container } = render(<ChatInput />)
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
      const file = createMockFile('boundary.pdf', MAX_FILE_SIZE_BYTES, 'application/pdf')
      fireEvent.change(fileInput, { target: { files: [file] } })

      expect(screen.getByText('boundary.pdf')).toBeInTheDocument()
      expect(screen.queryByText(/File không được vượt quá 10 MB/)).not.toBeInTheDocument()
    })

    it('Test 3: should reject file with size strictly greater than 10 MiB limit', () => {
      const { container } = render(<ChatInput />)
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
      const file = createMockFile('toolarge.pdf', MAX_FILE_SIZE_BYTES + 1, 'application/pdf')
      fireEvent.change(fileInput, { target: { files: [file] } })

      expect(screen.queryByText('toolarge.pdf')).not.toBeInTheDocument()
      expect(screen.getByText('File không được vượt quá 10 MB.')).toBeInTheDocument()
    })

    it('Test 4: rejected file should NOT replace previously selected valid file in UI', () => {
      const { container } = render(<ChatInput />)
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement

      // Step 1: Select a valid file
      const validFile = createMockFile('valid-doc.pdf', 2 * 1024 * 1024, 'application/pdf')
      fireEvent.change(fileInput, { target: { files: [validFile] } })

      expect(screen.getByText('valid-doc.pdf')).toBeInTheDocument()
      expect(screen.queryByText(/File không được vượt quá 10 MB/)).not.toBeInTheDocument()

      // Step 2: Try to select an oversized file
      const overSizedFile = createMockFile('oversized.pdf', 15 * 1024 * 1024, 'application/pdf')
      fireEvent.change(fileInput, { target: { files: [overSizedFile] } })

      // Original valid file remains selected!
      expect(screen.getByText('valid-doc.pdf')).toBeInTheDocument()
      expect(screen.queryByText('oversized.pdf')).not.toBeInTheDocument()
      // Error banner is shown
      expect(screen.getByText('File không được vượt quá 10 MB.')).toBeInTheDocument()
    })

    it('Test 5: should accept valid PDF according to frontend rules', () => {
      const { container } = render(<ChatInput />)
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
      const file = createMockFile('document.pdf', 1024, 'application/pdf')
      fireEvent.change(fileInput, { target: { files: [file] } })

      expect(screen.getByText('document.pdf')).toBeInTheDocument()
    })

    it('Test 6: should accept valid TXT according to frontend rules', () => {
      const { container } = render(<ChatInput />)
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
      const file = createMockFile('notes.txt', 2048, 'text/plain')
      fireEvent.change(fileInput, { target: { files: [file] } })

      expect(screen.getByText('notes.txt')).toBeInTheDocument()
    })

    it('Test 7: should reject unsupported extensions', () => {
      const { container } = render(<ChatInput />)
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement

      const pngFile = createMockFile('image.png', 1024, 'image/png')
      fireEvent.change(fileInput, { target: { files: [pngFile] } })
      expect(screen.getByText('Chỉ hỗ trợ file tài liệu định dạng PDF hoặc TXT.')).toBeInTheDocument()
      expect(screen.queryByText('image.png')).not.toBeInTheDocument()

      const exeFile = createMockFile('malware.exe', 1024, 'application/x-msdownload')
      fireEvent.change(fileInput, { target: { files: [exeFile] } })
      expect(screen.getByText('Chỉ hỗ trợ file tài liệu định dạng PDF hoặc TXT.')).toBeInTheDocument()

      const docxFile = createMockFile('document.docx', 1024, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      fireEvent.change(fileInput, { target: { files: [docxFile] } })
      expect(screen.getByText('Chỉ hỗ trợ file tài liệu định dạng PDF hoặc TXT.')).toBeInTheDocument()
    })

    it('Test 8: should accept supported extensions with empty MIME type and reject unsupported with empty MIME', () => {
      const { container } = render(<ChatInput />)
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement

      const pdfEmptyMime = createMockFile('readme.pdf', 1024, '')
      fireEvent.change(fileInput, { target: { files: [pdfEmptyMime] } })
      expect(screen.getByText('readme.pdf')).toBeInTheDocument()

      const txtEmptyMime = createMockFile('readme.txt', 1024, '')
      fireEvent.change(fileInput, { target: { files: [txtEmptyMime] } })
      expect(screen.getByText('readme.txt')).toBeInTheDocument()

      const unknownEmptyMime = createMockFile('readme.xyz', 1024, '')
      fireEvent.change(fileInput, { target: { files: [unknownEmptyMime] } })
      expect(screen.getByText('Chỉ hỗ trợ file tài liệu định dạng PDF hoặc TXT.')).toBeInTheDocument()
      expect(screen.queryByText('readme.xyz')).not.toBeInTheDocument()
    })

    it('Test 9: should reject MIME and extension mismatch', () => {
      const { container } = render(<ChatInput />)
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement

      // .pdf extension with text/plain MIME
      const pdfWithTxtMime = createMockFile('doc.pdf', 1024, 'text/plain')
      fireEvent.change(fileInput, { target: { files: [pdfWithTxtMime] } })
      expect(screen.getByText('Định dạng MIME không khớp với file PDF.')).toBeInTheDocument()
      expect(screen.queryByText('doc.pdf')).not.toBeInTheDocument()

      // .txt extension with application/pdf MIME
      const txtWithPdfMime = createMockFile('notes.txt', 1024, 'application/pdf')
      fireEvent.change(fileInput, { target: { files: [txtWithPdfMime] } })
      expect(screen.getByText('Định dạng MIME không khớp với file TXT.')).toBeInTheDocument()
      expect(screen.queryByText('notes.txt')).not.toBeInTheDocument()
    })

    it('Test 10 & 11: invalid file does NOT start upload/stream and does NOT clear draft text', async () => {
      const user = userEvent.setup()
      const { container } = render(<ChatInput />)
      const textarea = screen.getByPlaceholderText('Nhập tin nhắn...')
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement

      await user.type(textarea, 'Preserved draft content')
      expect(textarea).toHaveValue('Preserved draft content')

      // Attempt to select an invalid file
      const invalidFile = createMockFile('photo.png', 1024, 'image/png')
      fireEvent.change(fileInput, { target: { files: [invalidFile] } })

      // Error displayed
      expect(screen.getByText('Chỉ hỗ trợ file tài liệu định dạng PDF hoặc TXT.')).toBeInTheDocument()
      // Draft is preserved intact!
      expect(textarea).toHaveValue('Preserved draft content')
      // No stream triggered
      expect(mockStreamMessage).not.toHaveBeenCalled()
    })

    it('Test 12: invalid file selection does not change currently selected file', () => {
      const { container } = render(<ChatInput />)
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement

      const initialFile = createMockFile('initial.txt', 500, 'text/plain')
      fireEvent.change(fileInput, { target: { files: [initialFile] } })
      expect(screen.getByText('initial.txt')).toBeInTheDocument()

      // Attempt to select mismatch file
      const mismatchFile = createMockFile('fake.pdf', 500, 'text/plain')
      fireEvent.change(fileInput, { target: { files: [mismatchFile] } })

      expect(screen.getByText('initial.txt')).toBeInTheDocument()
      expect(screen.queryByText('fake.pdf')).not.toBeInTheDocument()
    })

    it('Test 13: valid file can be selected, removed via delete button, or sent with message', async () => {
      const user = userEvent.setup()
      const { container } = render(<ChatInput />)
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement

      // Select valid file
      const validFile = createMockFile('guide.pdf', 2048, 'application/pdf')
      fireEvent.change(fileInput, { target: { files: [validFile] } })
      expect(screen.getByText('guide.pdf')).toBeInTheDocument()

      // Remove valid file
      const deleteButton = screen.getByTitle('Xóa file guide.pdf')
      await user.click(deleteButton)
      expect(screen.queryByText('guide.pdf')).not.toBeInTheDocument()

      // Select another valid file and send with text
      const validTxt = createMockFile('guide.txt', 1024, 'text/plain')
      fireEvent.change(fileInput, { target: { files: [validTxt] } })
      expect(screen.getByText('guide.txt')).toBeInTheDocument()

      const textarea = screen.getByPlaceholderText('Nhập tin nhắn...')
      await user.type(textarea, 'Explain this guide')
      const sendButton = screen.getByRole('button', { name: 'Gửi' })
      await user.click(sendButton)

      expect(mockStreamMessage).toHaveBeenCalledTimes(1)
      const [, , , , , sentFile] = mockStreamMessage.mock.calls[0]
      expect(sentFile).toBe(validTxt)
    })

    it('Test 14: error messages accurately reflect rejection reasons', () => {
      const { container } = render(<ChatInput />)
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement

      const emptyFile = createMockFile('empty.pdf', 0, 'application/pdf')
      fireEvent.change(fileInput, { target: { files: [emptyFile] } })
      expect(screen.getByText('File không được để rỗng.')).toBeInTheDocument()

      const overSized = createMockFile('huge.pdf', 11 * 1024 * 1024, 'application/pdf')
      fireEvent.change(fileInput, { target: { files: [overSized] } })
      expect(screen.getByText('File không được vượt quá 10 MB.')).toBeInTheDocument()

      const unsupported = createMockFile('video.mp4', 1024, 'video/mp4')
      fireEvent.change(fileInput, { target: { files: [unsupported] } })
      expect(screen.getByText('Chỉ hỗ trợ file tài liệu định dạng PDF hoặc TXT.')).toBeInTheDocument()

      const mismatch = createMockFile('mismatch.pdf', 1024, 'text/plain')
      fireEvent.change(fileInput, { target: { files: [mismatch] } })
      expect(screen.getByText('Định dạng MIME không khớp với file PDF.')).toBeInTheDocument()
    })

    it('Test 15, 16 & 17: popover choices reflect real capabilities (Tài liệu PDF/TXT exists, Hình ảnh is hidden, click triggers file picker)', async () => {
      const user = userEvent.setup()
      const { container } = render(<ChatInput />)

      // Open popover
      const toggleButton = screen.getByRole('button', { name: 'Đính kèm file' })
      await user.click(toggleButton)

      // Test 15: Document option has accurate clarified label
      const docButton = screen.getByTitle('Tài liệu (PDF, TXT)')
      expect(docButton).toBeInTheDocument()
      expect(docButton).toHaveAttribute('aria-label', 'Tài liệu (PDF, TXT)')

      // Test 16: Unsupported "Hình ảnh" button is hidden/removed to avoid misleading users
      expect(screen.queryByTitle('Hình ảnh')).not.toBeInTheDocument()

      // Code option is retained
      expect(screen.getByTitle('Mã nguồn')).toBeInTheDocument()

      // Test 17: Clicking the clarified document button triggers fileInput.click()
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
      const clickSpy = vi.spyOn(fileInput, 'click')

      await user.click(docButton)
      expect(clickSpy).toHaveBeenCalledTimes(1)
      // Popover closes after choosing document option
      expect(screen.queryByRole('dialog', { name: 'Đính kèm tệp' })).not.toBeInTheDocument()
    })
  })

  describe('M7-F05: Touch Target & Mobile Interaction Polish', () => {
    it('provides accessible touch target and focus classes on Composer action buttons', () => {
      render(<ChatInput />)

      const attachmentBtn = screen.getByRole('button', { name: 'Đính kèm file' })
      expect(attachmentBtn).toHaveClass('h-9', 'w-9')
      expect(attachmentBtn).toHaveAttribute('aria-label', 'Đính kèm file')

      const expandBtn = screen.getByRole('button', { name: 'Mở rộng trình soạn thảo' })
      expect(expandBtn).toHaveClass('h-9', 'w-9')
      expect(expandBtn).toHaveAttribute('aria-label', 'Mở rộng trình soạn thảo')

      const sendBtn = screen.getByRole('button', { name: 'Gửi' })
      expect(sendBtn).toHaveClass('h-9', 'w-9')
      expect(sendBtn).toHaveAttribute('aria-label', 'Gửi')
    })

    it('provides accessible touch target classes on attachment popover buttons', async () => {
      const user = userEvent.setup()
      render(<ChatInput />)

      await user.click(screen.getByRole('button', { name: 'Đính kèm file' }))

      const docBtn = screen.getByRole('button', { name: 'Tài liệu (PDF, TXT)' })
      expect(docBtn).toHaveClass('h-11', 'w-11')

      const codeBtn = screen.getByRole('button', { name: 'Mã nguồn' })
      expect(codeBtn).toHaveClass('h-11', 'w-11')
    })

    it('provides improved touch target on attachment pill delete button and cleanly removes file', async () => {
      const user = userEvent.setup()
      const { container } = render(<ChatInput />)

      // Attach file
      const file = new File(['content'], 'report.pdf', { type: 'application/pdf' })
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
      await user.upload(fileInput, file)

      expect(screen.getByText('report.pdf')).toBeInTheDocument()

      const deleteBtn = screen.getByRole('button', { name: 'Xóa file report.pdf' })
      expect(deleteBtn).toHaveClass('h-7', 'w-7')
      expect(deleteBtn).toHaveAttribute('title', 'Xóa file report.pdf')

      await user.click(deleteBtn)
      expect(screen.queryByText('report.pdf')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Xóa file report.pdf' })).not.toBeInTheDocument()
    })
  })
})

