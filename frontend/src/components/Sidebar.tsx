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
import { NewChatButton } from './chat/NewChatButton'
import { groupChatsByDate } from '../utils/chatDateGroups'
import {
  Sidebar as SidebarContainer,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarFooter,
} from './ui/sidebar'

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
  const activeChatRef = useRef<HTMLLIElement | null>(null)

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

  const dateGroups = groupChatsByDate(chats)

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

      <SidebarContainer isOpen={isOpen} isCollapsed={isCollapsed}>
        {/* Sidebar Header */}
        <SidebarHeader>
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-2.5 w-full py-1">
              <span className="text-[#1B8F3D] text-lg font-bold select-none" title="AI Chat">
                💬
              </span>
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-[#161d28]/90 text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10 transition active:scale-95 cursor-pointer"
                aria-label="Mở rộng thanh bên"
                title="Mở rộng thanh bên"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2.5">
                <span className="text-[#1B8F3D] text-lg font-bold select-none">
                  💬
                </span>
                <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white select-none">
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
                  title="Đóng thanh bên"
                >
                  ✕
                </button>
              </div>
            </>
          )}
        </SidebarHeader>

        {/* New Chat Button with Star Burst Effect */}
        <NewChatButton
          onClick={handleCreateChat}
          isCollapsed={isCollapsed}
        />

        {/* Sidebar Content (Chat History) */}
        <SidebarContent className={chats.length === 0 ? 'flex flex-col' : ''}>
          <span className="sr-only">Lịch sử chat</span>

          {chats.length === 0 ? (
            isCollapsed ? (
              <div
                className="my-auto flex flex-col items-center justify-center py-6 text-slate-400 dark:text-gray-500 opacity-60"
                title="Chưa có cuộc trò chuyện"
                aria-label="Chưa có cuộc trò chuyện"
              >
                <span className="text-base select-none" aria-hidden="true">
                  💬
                </span>
                <span className="sr-only">Chưa có cuộc trò chuyện</span>
              </div>
            ) : (
              <div className="my-auto flex flex-col items-center justify-center px-3 py-8 text-center text-slate-400 dark:text-gray-500 select-none">
                <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100/80 dark:bg-white/[0.04] text-base opacity-75 ring-1 ring-slate-200/70 dark:ring-white/[0.08]">
                  💬
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-gray-400">
                  Chưa có cuộc trò chuyện
                </p>
              </div>
            )
          ) : isCollapsed ? (
            /* Collapsed Icon-Only Chat History */
            <SidebarMenu className="items-center">
              {chats.map((chat) => {
                const isActive = currentChatId === chat.id
                return (
                  <SidebarMenuItem
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
                  >
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={chat.title}
                      onClick={() => handleSelectChat(chat.id)}
                      aria-label={chat.title}
                      className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-150 ${
                        isActive
                          ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-xs dark:shadow-[0_0_12px_rgba(27,143,61,0.25)] ring-1 ring-[#1B8F3D]'
                          : 'border-slate-200/70 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02] text-slate-600 dark:text-gray-400 hover:border-slate-300 dark:hover:border-white/15 hover:bg-slate-100/80 dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span className="text-xs select-none">💬</span>
                      {isActive && (
                        <div
                          className="absolute -left-1 top-2 bottom-2 w-1 rounded-r-full bg-[#1B8F3D] shadow-[0_0_6px_rgba(27,143,61,0.6)]"
                          aria-hidden="true"
                        />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          ) : (
            /* Expanded Time-Grouped Chat History */
            dateGroups.map((group) => (
              <SidebarGroup key={group.id}>
                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                <SidebarMenu>
                  {group.chats.map((chat, index) => {
                    const isActive = currentChatId === chat.id
                    const isEditing = editingChatId === chat.id
                    const isMenuOpen = activeMenuChatId === chat.id
                    const timeAgo = formatChatTime(chat.createdAt, index)

                    return (
                      <SidebarMenuItem
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
                        className={`rounded-xl border p-2.5 pl-3.5 transition-all duration-150 overflow-hidden ${
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
                            <SidebarMenuButton
                              isActive={isActive}
                              onClick={() => handleSelectChat(chat.id)}
                              className="pr-7"
                              tooltip={chat.title}
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
                            </SidebarMenuButton>

                            {/* Action "..." Button on Hover / Focus */}
                            <div className="absolute right-2 top-2.5 flex items-center">
                              <SidebarMenuAction
                                show={isMenuOpen}
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
                                title="Thao tác với đoạn chat"
                                aria-label="Thao tác với đoạn chat"
                                aria-haspopup="menu"
                                aria-expanded={isMenuOpen}
                              >
                                ⋮
                              </SidebarMenuAction>
                            </div>
                          </>
                        )}
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroup>
            ))
          )}
        </SidebarContent>

        {/* Sidebar Footer */}
        <SidebarFooter>
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-xs text-slate-700 dark:text-white ring-1 ring-slate-300 dark:ring-white/20 select-none cursor-pointer"
                title={(user as { name?: string } | null)?.name || (user?.email ? user.email : 'Tài khoản')}
              >
                👤
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100/70 dark:bg-white/[0.04] text-slate-600 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-300 hover:bg-[#B91E2B]/10 transition cursor-pointer"
                aria-label="Đăng xuất"
                title="Đăng xuất"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2.5 px-1 mb-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-xs text-slate-700 dark:text-white ring-1 ring-slate-300 dark:ring-white/20 select-none">
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
            </>
          )}
        </SidebarFooter>
      </SidebarContainer>

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