import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createChat,
  deleteChat,
  renameChat,
  type ChatSession,
} from '../services/chatService'
import { logout } from '../services/authService'
import { useAuthStore } from '../stores/authStore'
import { useChatStore } from '../stores/chatStore'
import { useMessageStore } from '../stores/messageStore'
import { ChatActionMenu } from './chat/ChatActionMenu'
import { DeleteChatModal } from './chat/DeleteChatModal'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}



function formatChatTime(dateStr?: string, index = 0): string {
  if (!dateStr) {
    const days = [18, 10, 7, 3, 1]
    return `${days[index % days.length]} days ago`
  }
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime()
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (days > 0) return `${days} days ago`
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    if (hours > 0) return `${hours}h ago`
    return 'Hôm nay'
  } catch {
    return '18 days ago'
  }
}

function Sidebar({
  isOpen = false,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const navigate = useNavigate()

  const user = useAuthStore((state) => state.user)
  const clearUser = useAuthStore((state) => state.clearUser)

  const chats = useChatStore((state) => state.chats)
  const addChat = useChatStore((state) => state.addChat)
  const removeChat = useChatStore((state) => state.removeChat)
  const updateChat = useChatStore((state) => state.updateChat)
  const setCurrentChatId = useChatStore((state) => state.setCurrentChatId)
  const currentChatId = useChatStore((state) => state.currentChatId)
  const clearChats = useChatStore((state) => state.clearChats)

  // Auto-scroll active chat into viewport
  const activeChatRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (currentChatId && activeChatRef.current) {
      if (typeof activeChatRef.current.scrollIntoView === 'function') {
        activeChatRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        })
      }
    }
  }, [currentChatId])

  // Action Menu & Context Menu State
  const [activeMenuChatId, setActiveMenuChatId] = useState<string | null>(null)
  const [menuMode, setMenuMode] = useState<'popover' | 'context-menu'>('popover')
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | undefined>(undefined)
  const [popoverAnchor, setPopoverAnchor] = useState<{ top: number; bottom: number; left: number; right: number } | undefined>(undefined)

  // Inline Rename State
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [renameTitle, setRenameTitle] = useState('')
  const [renameLoading, setRenameLoading] = useState(false)
  const [renameError, setRenameError] = useState<string | null>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)

  // Delete Confirmation Modal State
  const [deleteTargetChat, setDeleteTargetChat] = useState<ChatSession | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleCreateChat = async () => {
    try {
      const chat = await createChat()
      addChat(chat)
      setCurrentChatId(chat.id)
      navigate(`/c/${chat.id}`)
      onClose?.()
    } catch (error) {
      console.error('Không thể tạo chat mới:', error)
    }
  }

  const handleSelectChat = (chatId: string) => {
    if (currentChatId === chatId) {
      window.dispatchEvent(new CustomEvent('ai-chat-scroll-to-bottom'))
      onClose?.()
      return
    }
    setCurrentChatId(chatId)
    navigate(`/c/${chatId}`)
    onClose?.()
  }

  // --- Rename Handlers ---
  const handleStartRename = (chat: ChatSession) => {
    setActiveMenuChatId(null)
    setEditingChatId(chat.id)
    setRenameTitle(chat.title)
    setRenameError(null)
  }

  const handleCancelRename = () => {
    setEditingChatId(null)
    setRenameTitle('')
    setRenameError(null)
  }

  const handleRenameSubmit = async (chatId: string, currentTitle: string) => {
    const trimmedTitle = renameTitle.trim()

    if (!trimmedTitle) {
      setRenameError('Tên cuộc trò chuyện không được để trống')
      return
    }

    if (trimmedTitle.length > 50) {
      setRenameError('Tên cuộc trò chuyện không được vượt quá 50 ký tự')
      return
    }

    if (trimmedTitle === currentTitle) {
      handleCancelRename()
      return
    }

    try {
      setRenameLoading(true)
      setRenameError(null)
      const updatedChat = await renameChat(chatId, trimmedTitle)
      updateChat(updatedChat)
      handleCancelRename()
    } catch (error) {
      console.error('Không thể đổi tên chat:', error)
      setRenameError('Không thể đổi tên đoạn chat. Vui lòng thử lại.')
    } finally {
      setRenameLoading(false)
    }
  }

  useEffect(() => {
    if (editingChatId && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [editingChatId])

  // --- Delete Handlers ---
  const handleStartDelete = (chat: ChatSession) => {
    setActiveMenuChatId(null)
    setDeleteTargetChat(chat)
    setDeleteError(null)
  }

  const handleCancelDelete = () => {
    if (isDeleting) return
    setDeleteTargetChat(null)
    setDeleteError(null)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTargetChat || isDeleting) return

    const chatId = deleteTargetChat.id

    try {
      setIsDeleting(true)
      setDeleteError(null)
      await deleteChat(chatId)
      removeChat(chatId)

      if (currentChatId === chatId) {
        const remainingChats = chats.filter((c) => c.id !== chatId)
        if (remainingChats.length > 0) {
          setCurrentChatId(remainingChats[0].id)
          navigate(`/c/${remainingChats[0].id}`)
        } else {
          setCurrentChatId(null)
          navigate('/chat')
        }
      }

      setDeleteTargetChat(null)
    } catch (error) {
      console.error('Không thể xóa chat:', error)
      setDeleteError('Không thể xóa đoạn chat. Vui lòng thử lại.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Không thể đăng xuất:', error)
    } finally {
      const abortCurrentStream =
        useMessageStore.getState().abortCurrentStream
      if (abortCurrentStream) {
        abortCurrentStream()
      }

      useMessageStore.getState().clearAll()
      clearChats?.()
      clearUser()
      navigate('/login')
    }
  }

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full max-w-[85vw] shrink-0 flex-col rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/90 dark:bg-[#121824]/80 shadow-xl dark:shadow-2xl backdrop-blur-xl transition-all duration-200 ease-in-out md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${
          isCollapsed
            ? 'w-[228px] p-3 md:w-0 md:max-w-0 md:p-0 md:border-0 md:opacity-0 md:pointer-events-none md:overflow-hidden'
            : 'w-[228px] p-3 md:w-[228px] md:opacity-100'
        }`}
      >
        <div className="flex flex-col h-full w-[204px] min-w-[204px]">
          {/* Brand Header */}
          <div className="mb-4 flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <span className="text-[#1B8F3D] text-lg font-bold">
                💬
              </span>
              <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                AI Chat
              </h1>
            </div>

            <div className="flex items-center gap-1">
              {/* Desktop collapse button */}
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-[#161d28]/90 text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10 transition active:scale-95 cursor-pointer"
                aria-label="Thu gọn thanh bên"
                title="Thu gọn thanh bên"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Mobile close button */}
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white md:hidden cursor-pointer"
                aria-label="Đóng thanh bên"
              >
                ✕
              </button>
            </div>
          </div>

        {/* Chat New Pill Button Matching Screenshot */}
        <button
          type="button"
          onClick={handleCreateChat}
          className="group mb-4 flex w-full items-center justify-between rounded-full border border-white/10 bg-gradient-to-r from-[#B91E2B]/80 via-[#3d1a1d] to-[#122e1c] p-1 shadow-md transition-all duration-150 hover:brightness-110 active:scale-[0.97] cursor-pointer"
        >
          <span className="pl-3.5 text-xs font-semibold text-white">
            Chat mới
          </span>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1B8F3D] text-sm font-bold text-white shadow-sm transition-transform duration-150 group-hover:scale-105">
            +
          </span>
        </button>

        {/* Conversation List Cards */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-0.5 scrollbar-thin">
          <span className="sr-only">Lịch sử chat</span>

          {chats.map((chat, index) => {
            const isActive = currentChatId === chat.id
            const isEditing = editingChatId === chat.id
            const isMenuOpen = activeMenuChatId === chat.id
            const timeAgo = formatChatTime(chat.createdAt, index)

            return (
              <div
                key={chat.id}
                ref={isActive ? activeChatRef : undefined}
                onContextMenu={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleCancelRename()
                  setMenuMode('context-menu')
                  setContextMenuPos({ x: e.clientX, y: e.clientY })
                  setActiveMenuChatId(chat.id)
                }}
                className={`group relative rounded-xl border p-2.5 pl-3.5 transition-all duration-150 overflow-hidden ${
                  isActive
                    ? 'border-slate-300 dark:border-white/15 bg-slate-100/90 dark:bg-white/[0.08] shadow-xs dark:shadow-[0_0_15px_rgba(27,143,61,0.08)]'
                    : 'border-slate-200/70 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02] hover:border-slate-300 dark:hover:border-white/[0.12] hover:bg-slate-100/80 dark:hover:bg-white/[0.06] hover:-translate-y-0.5'
                }`}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <div
                    className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#1B8F3D] shadow-[0_0_8px_rgba(27,143,61,0.6)]"
                    aria-hidden="true"
                  />
                )}

                {isEditing ? (
                  <div
                    className={`w-full ${renameError ? 'animate-ui-shake' : ''}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs shrink-0 select-none opacity-80" aria-hidden="true">
                        💬
                      </span>
                      <input
                        ref={renameInputRef}
                        type="text"
                        value={renameTitle}
                        maxLength={50}
                        disabled={renameLoading}
                        onChange={(e) => {
                          setRenameTitle(e.target.value)
                          setRenameError(null)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleRenameSubmit(chat.id, chat.title)
                          } else if (e.key === 'Escape') {
                            e.preventDefault()
                            handleCancelRename()
                          }
                        }}
                        className="w-full rounded-lg border border-[#1B8F3D] bg-[#0c121d] px-2 py-1 text-xs font-semibold text-white outline-none shadow-[0_0_10px_rgba(27,143,61,0.2)] focus:ring-1 focus:ring-[#1B8F3D]"
                        aria-label="Tên cuộc trò chuyện mới"
                      />
                      <button
                        type="button"
                        onClick={() => handleRenameSubmit(chat.id, chat.title)}
                        disabled={renameLoading}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#1B8F3D] text-xs font-bold text-white hover:bg-[#167632] transition cursor-pointer disabled:opacity-50"
                        title="Lưu tên"
                        aria-label="Lưu tên"
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelRename}
                        disabled={renameLoading}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 text-xs text-gray-400 hover:text-white transition cursor-pointer disabled:opacity-50"
                        title="Hủy"
                        aria-label="Hủy đổi tên"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[9px] pl-5">
                      <span className="text-gray-400">
                        {renameTitle.length}/50
                      </span>
                      {renameError && (
                        <span className="text-[#ff5c6a] truncate max-w-[140px]" title={renameError}>
                          {renameError}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSelectChat(chat.id)}
                      className="w-full text-left cursor-pointer focus:outline-none pr-7"
                      title={chat.title}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs shrink-0 select-none opacity-80" aria-hidden="true">
                          💬
                        </span>
                        <p
                          className={`truncate text-xs ${
                            isActive
                              ? 'font-semibold text-slate-900 dark:text-white'
                              : 'font-medium text-slate-700 dark:text-gray-300 group-hover:text-slate-900 dark:group-hover:text-white'
                          }`}
                        >
                          {chat.title}
                        </p>
                      </div>
                      <p
                        className={`truncate text-[10px] mt-1 pl-5 ${
                          isActive
                            ? 'text-slate-600 dark:text-gray-300 font-normal'
                            : 'text-slate-500 dark:text-gray-400 group-hover:text-slate-600 dark:group-hover:text-gray-300'
                        }`}
                      >
                        {chat.title.length > 24
                          ? `${chat.title.slice(0, 24)}...`
                          : 'Đoạn hội thoại...'}
                      </p>
                      <div className="flex items-center justify-between mt-1 pl-5">
                        <span
                          className={`text-[9px] ml-auto ${
                            isActive ? 'text-slate-500 dark:text-gray-400' : 'text-slate-400 dark:text-gray-500'
                          }`}
                        >
                          {timeAgo}
                        </span>
                      </div>
                    </button>

                    {/* Action "..." Button on Hover / Focus */}
                    <div className="absolute right-2 top-2.5 flex items-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (isMenuOpen && menuMode === 'popover') {
                            setActiveMenuChatId(null)
                          } else {
                            handleCancelRename()
                            const rect = e.currentTarget.getBoundingClientRect()
                            setPopoverAnchor({
                              top: rect.top,
                              bottom: rect.bottom,
                              left: rect.left,
                              right: rect.right,
                            })
                            setMenuMode('popover')
                            setActiveMenuChatId(chat.id)
                          }
                        }}
                        className={`flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-[#161d28]/90 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/20 transition-all duration-150 active:scale-95 cursor-pointer text-xs ${
                          isMenuOpen
                            ? 'opacity-100 ring-1 ring-slate-300 dark:ring-white/20 text-slate-900 dark:text-white'
                            : isActive
                            ? 'opacity-70 group-hover:opacity-100 group-focus-within:opacity-100'
                            : 'opacity-30 group-hover:opacity-100 group-focus-within:opacity-100'
                        }`}
                        title="Thao tác với đoạn chat"
                        aria-label="Thao tác với đoạn chat"
                        aria-haspopup="menu"
                        aria-expanded={isMenuOpen}
                      >
                        ⋮
                      </button>
                    </div>
                  </>
                )}
              </div>
            )
          })}

          {chats.length === 0 && (
            <p className="px-2 py-3 text-[11px] text-gray-400 italic text-center">
              Chưa có cuộc trò chuyện
            </p>
          )}
        </div>

        {/* User Account Section Matching Screenshot */}
        <div className="border-t border-slate-200/80 dark:border-white/[0.08] pt-2.5 mt-2 shrink-0">
          <div className="flex items-center gap-2.5 px-1 mb-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-xs text-slate-700 dark:text-white ring-1 ring-slate-300 dark:ring-white/20">
              👤
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-800 dark:text-gray-100">
                {(user as { name?: string } | null)?.name || (user?.email ? user.email.split('@')[0] : 'Test User 2')}
              </p>
              <p className="truncate text-[10px] text-slate-500 dark:text-gray-400">
                {user?.email ?? 'testuser2@ai.com'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLogout}
              className="flex-1 rounded-full border border-slate-200 dark:border-white/10 bg-slate-100/70 dark:bg-white/[0.04] py-1.5 text-xs font-medium text-slate-600 dark:text-gray-300 transition hover:bg-[#B91E2B]/10 dark:hover:bg-[#B91E2B]/20 hover:border-[#B91E2B]/40 hover:text-red-600 dark:hover:text-red-300 text-center cursor-pointer"
              aria-label="Đăng xuất"
              title="Đăng xuất"
            >
              Đăng xuất
            </button>

            <button
              type="button"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1B8F3D] text-xs text-white shadow-sm hover:bg-[#1B8F3D]/90 transition cursor-pointer"
              title="Cài đặt"
              aria-label="Cài đặt"
            >
              ⚙
            </button>
          </div>
        </div>
      </div>
    </aside>

      {/* Floating Action Menu (Popover or Context Menu) */}
      {activeMenuChatId && (() => {
        const targetChat = chats.find((c) => c.id === activeMenuChatId)
        if (!targetChat) return null
        return (
          <ChatActionMenu
            isOpen={true}
            mode={menuMode}
            position={contextMenuPos}
            anchorRect={popoverAnchor}
            onRename={() => handleStartRename(targetChat)}
            onDelete={() => handleStartDelete(targetChat)}
            onClose={() => setActiveMenuChatId(null)}
          />
        )
      })()}

      {/* Delete Confirmation Modal */}
      {deleteTargetChat && (
        <DeleteChatModal
          isOpen={true}
          chatTitle={deleteTargetChat.title}
          isDeleting={isDeleting}
          error={deleteError}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </>
  )
}

export default Sidebar