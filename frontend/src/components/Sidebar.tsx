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
      navigate(`/c/${chat.id}`)
    } catch (error) {
      console.error('Không thể tạo chat mới:', error)
    }
  }

  const handleSelectChat = (chatId: string) => {
    if (currentChatId === chatId) return
    setCurrentChatId(chatId)
    navigate(`/c/${chatId}`)
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
          navigate(`/c/${remainingChats[0].id}`)
        } else {
          setCurrentChatId(null)
          navigate('/chat')
        }
      }
    } catch (error) {
      console.error('Không thể xóa chat:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Không thể đăng xuất:', error)
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
          {chats.map((chat) => {
            const isActive = currentChatId === chat.id
            return (
              <div
                key={chat.id}
                className={`group relative flex items-center rounded-xl transition-all duration-200 ease-out ${
                  isActive
                    ? 'bg-gray-700/90 text-white shadow-sm ring-1 ring-white/10'
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                {/* Active Indicator Bar (Thanh chỉ báo đổi màu êm dịu) */}
                <div
                  className={`absolute left-1.5 h-4 w-1 rounded-full bg-blue-500 transition-all duration-200 ease-out ${
                    isActive
                      ? 'scale-y-100 opacity-100 shadow-[0_0_8px_rgba(59,130,246,0.6)]'
                      : 'scale-y-0 opacity-0'
                  }`}
                />

                <button
                  type="button"
                  onClick={() => handleSelectChat(chat.id)}
                  className="flex min-w-0 flex-1 items-center gap-2 py-2.5 pl-4 pr-1 text-left text-sm transition-colors duration-200"
                  title={chat.title}
                >
                  <span
                    className={`text-xs transition-colors duration-200 ${
                      isActive
                        ? 'text-blue-400'
                        : 'text-gray-500 group-hover:text-gray-400'
                    }`}
                  >
                    💬
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    {chat.title}
                  </span>
                </button>

                <div className="flex items-center gap-0.5 pr-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() =>
                      handleRenameChat(chat.id, chat.title)
                    }
                    className="rounded-md p-1 text-xs text-gray-400 transition hover:bg-gray-600 hover:text-white"
                    title="Đổi tên chat"
                  >
                    ✎
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteChat(chat.id)}
                    className="rounded-md p-1 text-xs text-gray-400 transition hover:bg-gray-600 hover:text-red-400"
                    title="Xóa chat"
                  >
                    ×
                  </button>
                </div>
              </div>
            )
          })}

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