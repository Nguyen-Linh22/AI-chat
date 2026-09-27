import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Sidebar from './Sidebar'

const {
  mockUseNavigate,
  mockUseAuthStore,
  mockUseChatStore,
  mockCreateChat,
  mockDeleteChat,
  mockRenameChat,
  mockLogout,
} = vi.hoisted(() => ({
  mockUseNavigate: vi.fn(),
  mockUseAuthStore: vi.fn(),
  mockUseChatStore: vi.fn(),
  mockCreateChat: vi.fn(),
  mockDeleteChat: vi.fn(),
  mockRenameChat: vi.fn(),
  mockLogout: vi.fn(),
}))

vi.mock('react-router-dom', () => ({
  useNavigate: mockUseNavigate,
}))

vi.mock('../stores/authStore', () => ({
  useAuthStore: mockUseAuthStore,
}))

vi.mock('../stores/chatStore', () => ({
  useChatStore: mockUseChatStore,
}))

vi.mock('../services/chatService', () => ({
  createChat: mockCreateChat,
  deleteChat: mockDeleteChat,
  renameChat: mockRenameChat,
}))

vi.mock('../services/authService', () => ({
  logout: mockLogout,
}))

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUseNavigate.mockReturnValue(vi.fn())

    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        user: {
          email: 'test@example.com',
        },
        clearUser: vi.fn(),
      })
    )

    mockUseChatStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        chats: [
          {
            id: 'chat-1',
            title: 'Cuộc trò chuyện thứ nhất',
          },
          {
            id: 'chat-2',
            title: 'Cuộc trò chuyện thứ hai',
          },
        ],
        addChat: vi.fn(),
        removeChat: vi.fn(),
        updateChat: vi.fn(),
        setCurrentChatId: vi.fn(),
        currentChatId: 'chat-1',
      })
    )
  })

  it('should render chat list and current user email', () => {
    render(<Sidebar />)

    expect(
      screen.getByText('Cuộc trò chuyện thứ nhất')
    ).toBeInTheDocument()

    expect(
      screen.getByText('Cuộc trò chuyện thứ hai')
    ).toBeInTheDocument()

    expect(
      screen.getByText('test@example.com')
    ).toBeInTheDocument()

    expect(
      screen.getByText('Lịch sử chat')
    ).toBeInTheDocument()

    expect(
      screen.getByRole('button', { name: /Chat mới/i })
    ).toBeInTheDocument()

    expect(
      screen.getByRole('button', { name: 'Đăng xuất' })
    ).toBeInTheDocument()
  })

  it('should show empty state when there are no chats', () => {
    mockUseChatStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        chats: [],
        addChat: vi.fn(),
        removeChat: vi.fn(),
        updateChat: vi.fn(),
        setCurrentChatId: vi.fn(),
        currentChatId: null,
      })
    )

    render(<Sidebar />)

    expect(
      screen.getByText('Chưa có cuộc trò chuyện')
    ).toBeInTheDocument()

    expect(
      screen.queryByText('Cuộc trò chuyện thứ nhất')
    ).not.toBeInTheDocument()

    expect(
      screen.queryByText('Cuộc trò chuyện thứ hai')
    ).not.toBeInTheDocument()
  })

  it('should create a new chat and navigate to it', async () => {
    const user = userEvent.setup()

    const newChat = {
      id: 'chat-new',
      title: 'Đoạn chat mới',
    }

    const addChat = vi.fn()
    const setCurrentChatId = vi.fn()
    const navigate = vi.fn()

    mockUseChatStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        chats: [],
        addChat,
        removeChat: vi.fn(),
        updateChat: vi.fn(),
        setCurrentChatId,
        currentChatId: null,
      })
    )

    mockUseNavigate.mockReturnValue(navigate)

    mockCreateChat.mockResolvedValue(newChat)

    render(<Sidebar />)

    await user.click(
      screen.getByRole('button', { name: /Chat mới/i })
    )

    expect(mockCreateChat).toHaveBeenCalledTimes(1)

    expect(addChat).toHaveBeenCalledWith(newChat)

    expect(setCurrentChatId).toHaveBeenCalledWith('chat-new')

    expect(navigate).toHaveBeenCalledWith('/c/chat-new')
  })

  it('should select a chat and navigate to it', async () => {
    const user = userEvent.setup()

    const setCurrentChatId = vi.fn()
    const navigate = vi.fn()

    mockUseChatStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        chats: [
          {
            id: 'chat-1',
            title: 'Cuộc trò chuyện thứ nhất',
          },
          {
            id: 'chat-2',
            title: 'Cuộc trò chuyện thứ hai',
          },
        ],
        addChat: vi.fn(),
        removeChat: vi.fn(),
        updateChat: vi.fn(),
        setCurrentChatId,
        currentChatId: 'chat-1',
      })
    )

    mockUseNavigate.mockReturnValue(navigate)

    render(<Sidebar />)

    await user.click(
      screen.getByRole('button', {
        name: /Cuộc trò chuyện thứ hai/i,
      })
    )

    expect(setCurrentChatId).toHaveBeenCalledWith('chat-2')

    expect(navigate).toHaveBeenCalledWith('/c/chat-2')
  })

  it('should not navigate when selecting the active chat', async () => {
    const user = userEvent.setup()

    const setCurrentChatId = vi.fn()
    const navigate = vi.fn()

    mockUseChatStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        chats: [
          {
            id: 'chat-1',
            title: 'Cuộc trò chuyện thứ nhất',
          },
          {
            id: 'chat-2',
            title: 'Cuộc trò chuyện thứ hai',
          },
        ],
        addChat: vi.fn(),
        removeChat: vi.fn(),
        updateChat: vi.fn(),
        setCurrentChatId,
        currentChatId: 'chat-1',
      })
    )

    mockUseNavigate.mockReturnValue(navigate)

    render(<Sidebar />)

    await user.click(
      screen.getByRole('button', {
        name: /Cuộc trò chuyện thứ nhất/i,
      })
    )

    expect(setCurrentChatId).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('should rename a chat and update the store', async () => {
    const user = userEvent.setup()

    const updateChat = vi.fn()
    const navigate = vi.fn()

    const updatedChat = {
      id: 'chat-1',
      title: 'Tên chat mới',
    }

    mockUseChatStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        chats: [
          {
            id: 'chat-1',
            title: 'Tên chat cũ',
          },
        ],
        addChat: vi.fn(),
        removeChat: vi.fn(),
        updateChat,
        setCurrentChatId: vi.fn(),
        currentChatId: 'chat-1',
      })
    )

    mockUseNavigate.mockReturnValue(navigate)

    mockRenameChat.mockResolvedValue(updatedChat)

    vi.spyOn(window, 'prompt').mockReturnValue(
      '   Tên chat mới   '
    )

    render(<Sidebar />)

    await user.click(
      screen.getByTitle('Đổi tên chat')
    )

    expect(window.prompt).toHaveBeenCalledWith(
      'Nhập tên mới cho cuộc trò chuyện:',
      'Tên chat cũ'
    )

    expect(mockRenameChat).toHaveBeenCalledWith(
      'chat-1',
      'Tên chat mới'
    )

    expect(updateChat).toHaveBeenCalledWith(updatedChat)
  })

  it('should not rename a chat when prompt is cancelled', async () => {
    const user = userEvent.setup()

    const updateChat = vi.fn()

    mockUseChatStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        chats: [
          {
            id: 'chat-1',
            title: 'Tên chat cũ',
          },
        ],
        addChat: vi.fn(),
        removeChat: vi.fn(),
        updateChat,
        setCurrentChatId: vi.fn(),
        currentChatId: 'chat-1',
      })
    )

    vi.spyOn(window, 'prompt').mockReturnValue(null)

    render(<Sidebar />)

    await user.click(
      screen.getByTitle('Đổi tên chat')
    )

    expect(window.prompt).toHaveBeenCalledWith(
      'Nhập tên mới cho cuộc trò chuyện:',
      'Tên chat cũ'
    )

    expect(mockRenameChat).not.toHaveBeenCalled()
    expect(updateChat).not.toHaveBeenCalled()
  })

  it('should not rename a chat when the new title is empty after trimming', async () => {
    const user = userEvent.setup()

    const updateChat = vi.fn()

    mockUseChatStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        chats: [
          {
            id: 'chat-1',
            title: 'Tên chat cũ',
          },
        ],
        addChat: vi.fn(),
        removeChat: vi.fn(),
        updateChat,
        setCurrentChatId: vi.fn(),
        currentChatId: 'chat-1',
      })
    )

    vi.spyOn(window, 'prompt').mockReturnValue('     ')

    render(<Sidebar />)

    await user.click(
      screen.getByTitle('Đổi tên chat')
    )

    expect(window.prompt).toHaveBeenCalledWith(
      'Nhập tên mới cho cuộc trò chuyện:',
      'Tên chat cũ'
    )

    expect(mockRenameChat).not.toHaveBeenCalled()
    expect(updateChat).not.toHaveBeenCalled()
  })

  it('should not delete a chat when deletion is cancelled', async () => {
    const user = userEvent.setup()

    const removeChat = vi.fn()
    const navigate = vi.fn()

    mockUseChatStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        chats: [
          {
            id: 'chat-1',
            title: 'Tên chat cần giữ',
          },
        ],
        addChat: vi.fn(),
        removeChat,
        updateChat: vi.fn(),
        setCurrentChatId: vi.fn(),
        currentChatId: 'chat-1',
      })
    )

    mockUseNavigate.mockReturnValue(navigate)

    vi.spyOn(window, 'confirm').mockReturnValue(false)

    render(<Sidebar />)

    await user.click(
      screen.getByTitle('Xóa chat')
    )

    expect(window.confirm).toHaveBeenCalledWith(
      'Bạn có chắc chắn muốn xóa đoạn chat này không?'
    )

    expect(mockDeleteChat).not.toHaveBeenCalled()
    expect(removeChat).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('should delete an inactive chat without navigating', async () => {
    const user = userEvent.setup()

    const removeChat = vi.fn()
    const setCurrentChatId = vi.fn()
    const navigate = vi.fn()

    mockUseChatStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        chats: [
          {
            id: 'chat-1',
            title: 'Chat đang active',
          },
          {
            id: 'chat-2',
            title: 'Chat cần xóa',
          },
        ],
        addChat: vi.fn(),
        removeChat,
        updateChat: vi.fn(),
        setCurrentChatId,
        currentChatId: 'chat-1',
      })
    )

    mockUseNavigate.mockReturnValue(navigate)

    mockDeleteChat.mockResolvedValue(undefined)

    vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(<Sidebar />)

    const deleteButtons = screen.getAllByTitle('Xóa chat')

    await user.click(deleteButtons[1])

    expect(window.confirm).toHaveBeenCalledWith(
      'Bạn có chắc chắn muốn xóa đoạn chat này không?'
    )

    expect(mockDeleteChat).toHaveBeenCalledWith('chat-2')

    expect(removeChat).toHaveBeenCalledWith('chat-2')

    expect(setCurrentChatId).not.toHaveBeenCalled()

    expect(navigate).not.toHaveBeenCalled()
  })

  it('should delete the active chat and navigate to the remaining chat', async () => {
    const user = userEvent.setup()

    const removeChat = vi.fn()
    const setCurrentChatId = vi.fn()
    const navigate = vi.fn()

    mockUseChatStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        chats: [
          {
            id: 'chat-1',
            title: 'Chat đang active',
          },
          {
            id: 'chat-2',
            title: 'Chat còn lại',
          },
        ],
        addChat: vi.fn(),
        removeChat,
        updateChat: vi.fn(),
        setCurrentChatId,
        currentChatId: 'chat-1',
      })
    )

    mockUseNavigate.mockReturnValue(navigate)

    mockDeleteChat.mockResolvedValue(undefined)

    vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(<Sidebar />)

    const deleteButtons = screen.getAllByTitle('Xóa chat')

    await user.click(deleteButtons[0])

    expect(mockDeleteChat).toHaveBeenCalledWith('chat-1')

    expect(removeChat).toHaveBeenCalledWith('chat-1')

    expect(setCurrentChatId).toHaveBeenCalledWith('chat-2')

    expect(navigate).toHaveBeenCalledWith('/c/chat-2')
  })

  it('should delete the active last chat and navigate to the chat home', async () => {
    const user = userEvent.setup()

    const removeChat = vi.fn()
    const setCurrentChatId = vi.fn()
    const navigate = vi.fn()

    mockUseChatStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        chats: [
          {
            id: 'chat-1',
            title: 'Chat cuối cùng',
          },
        ],
        addChat: vi.fn(),
        removeChat,
        updateChat: vi.fn(),
        setCurrentChatId,
        currentChatId: 'chat-1',
      })
    )

    mockUseNavigate.mockReturnValue(navigate)

    mockDeleteChat.mockResolvedValue(undefined)

    vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(<Sidebar />)

    await user.click(
      screen.getByTitle('Xóa chat')
    )

    expect(mockDeleteChat).toHaveBeenCalledWith('chat-1')

    expect(removeChat).toHaveBeenCalledWith('chat-1')

    expect(setCurrentChatId).toHaveBeenCalledWith(null)

    expect(navigate).toHaveBeenCalledWith('/chat')
  })

  it('should logout, clear user, and navigate to login', async () => {
    const user = userEvent.setup()

    const clearUser = vi.fn()
    const navigate = vi.fn()

    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        user: { email: 'test@example.com' },
        clearUser,
      })
    )

    mockUseNavigate.mockReturnValue(navigate)

    mockLogout.mockResolvedValue(undefined)

    render(<Sidebar />)

    await user.click(screen.getByRole('button', { name: 'Đăng xuất' }))

    expect(mockLogout).toHaveBeenCalledTimes(1)
    expect(clearUser).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith('/login')
  })

  it('should clear user and navigate to login even when logout API fails', async () => {
    const user = userEvent.setup()

    const clearUser = vi.fn()
    const navigate = vi.fn()

    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        user: { email: 'test@example.com' },
        clearUser,
      })
    )

    mockUseNavigate.mockReturnValue(navigate)

    mockLogout.mockRejectedValue(new Error('Logout API failed'))

    render(<Sidebar />)

    await user.click(screen.getByRole('button', { name: 'Đăng xuất' }))

    expect(mockLogout).toHaveBeenCalledTimes(1)
    expect(clearUser).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith('/login')
  })
})
