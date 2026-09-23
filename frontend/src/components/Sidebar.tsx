import { useNavigate } from 'react-router-dom'
import {
  createChat,
  deleteChat,
  renameChat
} from '../services/chatService'
import { logout } from '../services/authService'
import { useAuthStore } from '../stores/authStore'
import { useChatStore } from '../stores/chatStore'

function Sidebar() {
  const navigate = useNavigate()

  const user = useAuthStore((state) => state.user)
  const clearUser = useAuthStore((state) => state.clearUser)

  const chats = useChatStore((state) => state.chats)
  const addChat = useChatStore((state) => state.addChat)
  const removeChat = useChatStore((state) => state.removeChat)
  const updateChat = useChatStore(
    (state) => state.updateChat
  )
  const setCurrentChatId = useChatStore(
    (state) => state.setCurrentChatId
  )
  const currentChatId = useChatStore(
    (state) => state.currentChatId
  )

  const handleCreateChat = async () => {
    try {
      const chat = await createChat()

      addChat(chat)
      setCurrentChatId(chat.id)
    } catch (error) {
      console.error('Không thể tạo chat mới:', error)
    }
  }

  const handleRenameChat = async (
    chatId: string,
    currentTitle: string
  ) => {
    const newTitle = window.prompt(
      'Nhập tên mới cho cuộc trò chuyện:',
      currentTitle
    )

    if (newTitle === null) {
      return
    }

    const trimmedTitle = newTitle.trim()

    if (!trimmedTitle) {
      return
    }

    try {
      const updatedChat = await renameChat(
        chatId,
        trimmedTitle
      )

      updateChat(updatedChat)
    } catch (error) {
      console.error('Không thể đổi tên chat:', error)
    }
  }

  const handleDeleteChat = async (chatId: string) => {
    const confirmed = window.confirm(
      'Bạn có chắc chắn muốn xóa đoạn chat này không?'
    )

    if (!confirmed) {
      return
    }

    try {
      await deleteChat(chatId)

      const remainingChats = chats.filter(
        (chat) => chat.id !== chatId
      )

      removeChat(chatId)

      if (currentChatId === chatId) {
        if (remainingChats.length > 0) {
          setCurrentChatId(remainingChats[0].id)
        } else {
          setCurrentChatId(null)
        }
      }
    } catch (error) {
      console.error('Không thể xóa chat:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      clearUser()
      navigate('/login')
    }
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-gray-700 bg-gray-800 p-4">
      <div className="mb-6 px-2">
        <h1 className="text-xl font-bold">AI Chat</h1>
      </div>

      <button
        type="button"
        onClick={handleCreateChat}
        className="mb-6 flex w-full items-center gap-2 rounded-lg border border-gray-600 px-4 py-3 text-left text-sm font-medium transition hover:bg-gray-700"
      >
        <span className="text-lg">+</span>
        <span>Chat mới</span>
      </button>

      <div className="flex-1 overflow-y-auto">
        <h2 className="mb-3 px-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Lịch sử chat
        </h2>

        <div className="space-y-1">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className="group flex items-center gap-1 rounded-lg hover:bg-gray-700"
            >
              <button
                type="button"
                onClick={() => setCurrentChatId(chat.id)}
                className={`min-w-0 flex-1 truncate rounded-lg px-3 py-2 text-left text-sm ${
                  currentChatId === chat.id
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-300'
                }`}
              >
                {chat.title}
              </button>

              <button
                type="button"
                onClick={() =>
                  handleRenameChat(chat.id, chat.title)
                }
                className="hidden rounded-md px-2 py-1 text-xs text-gray-400 hover:bg-gray-600 hover:text-white group-hover:block"
                title="Đổi tên chat"
              >
                ✎
              </button>

              <button
                type="button"
                onClick={() => handleDeleteChat(chat.id)}
                className="mr-1 hidden rounded-md px-2 py-1 text-xs text-gray-400 hover:bg-gray-600 hover:text-red-400 group-hover:block"
                title="Xóa chat"
              >
                ×
              </button>
            </div>
          ))}

          {chats.length === 0 && (
            <p className="px-3 py-2 text-sm text-gray-500">
              Chưa có cuộc trò chuyện
            </p>
          )}
        </div>
      </div>

      <div className="border-t border-gray-700 pt-4">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-600">
            👤
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {user?.email ?? 'Người dùng'}
            </p>

            <p className="text-xs text-gray-400">
              Tài khoản
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-4 w-full rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-300 transition hover:bg-gray-700 hover:text-white"
        >
          Đăng xuất
        </button>
      </div>
    </aside>
  )
}

export default Sidebar