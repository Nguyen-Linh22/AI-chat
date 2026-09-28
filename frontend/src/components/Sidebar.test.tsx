import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
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
  mockClearChats,
} = vi.hoisted(() => ({
  mockUseNavigate: vi.fn(),
  mockUseAuthStore: vi.fn(),
  mockUseChatStore: vi.fn(),
  mockCreateChat: vi.fn(),
  mockDeleteChat: vi.fn(),
  mockRenameChat: vi.fn(),
  mockLogout: vi.fn(),
  mockClearChats: vi.fn(),
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
        clearChats: mockClearChats,
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

  it('should rename a chat and update the store via inline edit', async () => {
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

    render(<Sidebar />)

    // Open action menu
    await user.click(screen.getByRole('button', { name: 'Thao tác với đoạn chat' }))

    // Click "Đổi tên"
    await user.click(screen.getByRole('menuitem', { name: /Đổi tên/i }))

    // Inline input appears
    const input = screen.getByLabelText('Tên cuộc trò chuyện mới')
    expect(input).toBeInTheDocument()
    expect(input).toHaveValue('Tên chat cũ')

    // Type new title and press Enter
    await user.clear(input)
    await user.type(input, 'Tên chat mới{Enter}')

    expect(mockRenameChat).toHaveBeenCalledWith('chat-1', 'Tên chat mới')
    expect(updateChat).toHaveBeenCalledWith(updatedChat)
  })

  it('should not rename a chat when inline edit is cancelled with Escape', async () => {
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

    render(<Sidebar />)

    await user.click(screen.getByRole('button', { name: 'Thao tác với đoạn chat' }))
    await user.click(screen.getByRole('menuitem', { name: /Đổi tên/i }))

    const input = screen.getByLabelText('Tên cuộc trò chuyện mới')
    expect(input).toBeInTheDocument()

    await user.keyboard('{Escape}')

    expect(screen.queryByLabelText('Tên cuộc trò chuyện mới')).not.toBeInTheDocument()
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

    render(<Sidebar />)

    await user.click(screen.getByRole('button', { name: 'Thao tác với đoạn chat' }))
    await user.click(screen.getByRole('menuitem', { name: /Đổi tên/i }))

    const input = screen.getByLabelText('Tên cuộc trò chuyện mới')
    await user.clear(input)
    await user.type(input, '     {Enter}')

    expect(screen.getByText('Tên cuộc trò chuyện không được để trống')).toBeInTheDocument()
    expect(mockRenameChat).not.toHaveBeenCalled()
    expect(updateChat).not.toHaveBeenCalled()
  })

  it('should show error and keep input open when rename API fails', async () => {
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

    mockRenameChat.mockRejectedValue(new Error('Network error'))

    render(<Sidebar />)

    await user.click(screen.getByRole('button', { name: 'Thao tác với đoạn chat' }))
    await user.click(screen.getByRole('menuitem', { name: /Đổi tên/i }))

    const input = screen.getByLabelText('Tên cuộc trò chuyện mới')
    await user.clear(input)
    await user.type(input, 'Tên mới thất bại{Enter}')

    expect(mockRenameChat).toHaveBeenCalledWith('chat-1', 'Tên mới thất bại')
    expect(await screen.findByText('Không thể đổi tên đoạn chat. Vui lòng thử lại.')).toBeInTheDocument()
    expect(input).toBeInTheDocument()
    expect(input).toHaveValue('Tên mới thất bại')
    expect(updateChat).not.toHaveBeenCalled()
  })

  it('should not delete a chat when deletion is cancelled in modal', async () => {
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

    render(<Sidebar />)

    await user.click(screen.getByRole('button', { name: 'Thao tác với đoạn chat' }))
    await user.click(screen.getByRole('menuitem', { name: /Xóa/i }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Xóa đoạn chat này?')).toBeInTheDocument()
    expect(screen.getAllByText('Tên chat cần giữ')).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: 'Hủy bỏ' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
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

    render(<Sidebar />)

    const actionButtons = screen.getAllByRole('button', { name: 'Thao tác với đoạn chat' })
    await user.click(actionButtons[1])
    await user.click(screen.getByRole('menuitem', { name: /Xóa/i }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getAllByText('Chat cần xóa')).toHaveLength(2)
    await user.click(screen.getByRole('button', { name: 'Xóa vĩnh viễn' }))

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

    render(<Sidebar />)

    const actionButtons = screen.getAllByRole('button', { name: 'Thao tác với đoạn chat' })
    await user.click(actionButtons[0])
    await user.click(screen.getByRole('menuitem', { name: /Xóa/i }))

    await user.click(screen.getByRole('button', { name: 'Xóa vĩnh viễn' }))

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

    render(<Sidebar />)

    await user.click(screen.getByRole('button', { name: 'Thao tác với đoạn chat' }))
    await user.click(screen.getByRole('menuitem', { name: /Xóa/i }))

    await user.click(screen.getByRole('button', { name: 'Xóa vĩnh viễn' }))

    expect(mockDeleteChat).toHaveBeenCalledWith('chat-1')
    expect(removeChat).toHaveBeenCalledWith('chat-1')
    expect(setCurrentChatId).toHaveBeenCalledWith(null)
    expect(navigate).toHaveBeenCalledWith('/chat')
  })

  it('should show error and keep modal open when delete API fails', async () => {
    const user = userEvent.setup()

    const removeChat = vi.fn()

    mockUseChatStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        chats: [
          {
            id: 'chat-1',
            title: 'Chat cần xóa',
          },
        ],
        addChat: vi.fn(),
        removeChat,
        updateChat: vi.fn(),
        setCurrentChatId: vi.fn(),
        currentChatId: 'chat-1',
      })
    )

    mockDeleteChat.mockRejectedValue(new Error('Delete error'))

    render(<Sidebar />)

    await user.click(screen.getByRole('button', { name: 'Thao tác với đoạn chat' }))
    await user.click(screen.getByRole('menuitem', { name: /Xóa/i }))

    await user.click(screen.getByRole('button', { name: 'Xóa vĩnh viễn' }))

    expect(await screen.findByText('Không thể xóa đoạn chat. Vui lòng thử lại.')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(removeChat).not.toHaveBeenCalled()
  })

  it('should open context menu on right click and allow renaming', async () => {
    const user = userEvent.setup()

    mockUseChatStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        chats: [
          {
            id: 'chat-1',
            title: 'Chat chuột phải',
          },
        ],
        addChat: vi.fn(),
        removeChat: vi.fn(),
        updateChat: vi.fn(),
        setCurrentChatId: vi.fn(),
        currentChatId: 'chat-1',
      })
    )

    render(<Sidebar />)

    const chatItem = screen.getByRole('button', { name: /Chat chuột phải/i })
    fireEvent.contextMenu(chatItem)

    expect(screen.getByRole('menu')).toBeInTheDocument()
    await user.click(screen.getByRole('menuitem', { name: /Đổi tên/i }))

    expect(screen.getByLabelText('Tên cuộc trò chuyện mới')).toBeInTheDocument()
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
    expect(mockClearChats).toHaveBeenCalledTimes(1)
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
    expect(mockClearChats).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith('/login')
  })

  it('should render active indicator bar for selected chat and neutral styling for inactive chat', () => {
    mockUseChatStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        chats: [
          {
            id: 'chat-1',
            title: 'Active Chat',
          },
          {
            id: 'chat-2',
            title: 'Inactive Chat',
          },
        ],
        addChat: vi.fn(),
        removeChat: vi.fn(),
        updateChat: vi.fn(),
        setCurrentChatId: vi.fn(),
        currentChatId: 'chat-1',
        clearChats: mockClearChats,
      })
    )

    const { container } = render(<Sidebar />)

    // Active indicator bar
    const indicator = container.querySelector('.bg-\\[\\#1B8F3D\\]')
    expect(indicator).toBeInTheDocument()

    // Active chat title
    const activeTitle = screen.getByText('Active Chat')
    expect(activeTitle.className).toContain('font-semibold')
    expect(activeTitle.className).toContain('dark:text-white')

    // Inactive chat title
    const inactiveTitle = screen.getByText('Inactive Chat')
    expect(inactiveTitle.className).toContain('text-gray-300')
  })
})
