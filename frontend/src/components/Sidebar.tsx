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
import { SearchChatButton } from './chat/SearchChatButton'
import { SearchChatModal } from './chat/SearchChatModal'
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
        const prefersReducedMotion =
          typeof window !== 'undefined' &&
          typeof window.matchMedia === 'function' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches

        activeChatRef.current.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          block: 'nearest',
        })
      }
    }
  }, [currentChatId])

  // Search Modal State
  const [isSearchOpen, setIsSearchOpen] = useState(false)

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

  // Global Shortcut: Ctrl+K / Cmd+K to open conversation search
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        // Do not intercept if delete modal or rename is active
        if (deleteTargetChat || editingChatId) return

        event.preventDefault()
        setIsSearchOpen((prev) => !prev)
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown)
    }
  }, [deleteTargetChat, editingChatId])

  // M7-F04: Close mobile sidebar drawer on Escape and restore focus to opener button
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (event.defaultPrevented) return

      // Do not close mobile drawer if modal, menu, rename, or search is active
      if (deleteTargetChat || activeMenuChatId || editingChatId || isSearchOpen) {
        return
      }

      // Only close if in mobile viewport (desktop sidebar is static)
      const isMobile = () => {
        if (typeof window === 'undefined') return false
        if (typeof window.matchMedia === 'function') {
          const mql = window.matchMedia('(min-width: 768px)')
          if (typeof mql?.matches === 'boolean') {
            return !mql.matches
          }
        }
        return typeof window.innerWidth === 'number' && window.innerWidth < 768
      }

      if (!isMobile()) return

      event.preventDefault()
      onClose?.()

      // Restore focus to the mobile menu open button if present
      const openButton = document.querySelector<HTMLElement>(
        'button[aria-label="Mở menu danh sách đoạn chat"]'
      )
      if (openButton && document.contains(openButton) && typeof openButton.focus === 'function') {
        openButton.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose, deleteTargetChat, activeMenuChatId, editingChatId, isSearchOpen])

  const handleCreateChat = async () => {
    try {
      useMessageStore.getState().abortCurrentStream?.()
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
    useMessageStore.getState().abortCurrentStream?.()
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

      // If the target chat is actively streaming, abort its stream early
      const store = useMessageStore.getState()
      if (store.activeChatId === chatId) {
        store.abortCurrentStream?.()
      }

      await deleteChat(chatId)

      // Hardening B: Purge cache and remove chat only after successful deletion on server
      useMessageStore.getState().deleteChatCache(chatId)
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
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity duration-200 ease-out md:hidden motion-reduce:transition-none ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <SidebarContainer isOpen={isOpen} isCollapsed={isCollapsed}>
        {/* Sidebar Header */}
        <SidebarHeader>
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="group/logo relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 dark:from-emerald-500/25 dark:to-emerald-950/40 text-[#1B8F3D] dark:text-emerald-400 select-none shadow-xs border border-emerald-500/30 ring-1 ring-emerald-500/10 hover:border-emerald-500/60 hover:shadow-md hover:shadow-emerald-500/20 active:scale-95 transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#1B8F3D]/50 focus-visible:outline-none"
              title={isCollapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
              aria-label={isCollapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
            >
              <svg className={`h-4 w-4 transition-transform duration-300 ${isCollapsed ? 'group-hover/logo:scale-110' : 'group-hover/logo:scale-95'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {/* Status Dot */}
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#131923]" aria-hidden="true" />
            </button>

            {/* Title & subtitle container */}
            <div
              className={`flex flex-col min-w-0 select-none overflow-hidden transition-[opacity,max-width] duration-200 ease-out motion-reduce:transition-none ${
                isCollapsed
                  ? 'max-w-0 opacity-0 pointer-events-none'
                  : 'max-w-[140px] opacity-100'
              }`}
            >
              <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white leading-none truncate">
                AI Chat
              </h1>
              <span className="text-[10px] text-slate-500 dark:text-[#94A3B8] font-medium mt-1 flex items-center gap-1 truncate">
                <span className="inline-block h-1 w-1 rounded-full bg-emerald-500/70 shrink-0" />
                Workspace
              </span>
            </div>
          </div>

          {/* Mobile close button (only visible on mobile screens) */}
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-[#94A3B8] dark:hover:bg-[#1A2230] dark:hover:text-[#F1F5F9] md:hidden cursor-pointer focus-visible:ring-2 focus-visible:ring-[#1B8F3D]/50 focus-visible:outline-none ml-auto shrink-0"
            aria-label="Đóng thanh bên"
            title="Đóng thanh bên"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </SidebarHeader>

        {/* Search Chat Button */}
        <SearchChatButton
          onClick={() => setIsSearchOpen(true)}
          isCollapsed={isCollapsed}
        />

        {/* New Chat Button */}
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
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="sr-only">Chưa có cuộc trò chuyện</span>
              </div>
            ) : (
              <div className="my-auto flex flex-col items-center justify-center px-3 py-8 text-center text-slate-400 dark:text-gray-500 select-none">
                <div className="relative mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-b from-slate-100 to-slate-200/50 dark:from-white/[0.06] dark:to-white/[0.02] text-slate-500 dark:text-emerald-400/80 ring-1 ring-slate-200/80 dark:ring-white/[0.08] shadow-xs">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-xs font-semibold text-slate-700 dark:text-gray-400">
                  Chưa có cuộc trò chuyện
                </p>
                <p className="mt-1 text-[11px] text-slate-400 dark:text-[#94A3B8] max-w-[170px] leading-tight">
                  Nhấn "Chat mới" để bắt đầu cuộc trò chuyện
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
                      className={`relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-150 ${
                        isActive
                          ? 'border-emerald-500/50 bg-[#E2E8F0] dark:bg-[#2A374C] text-[#1B8F3D] dark:text-emerald-400 shadow-xs ring-1 ring-[#1B8F3D]'
                          : 'border-transparent bg-transparent hover:bg-slate-100/80 dark:hover:bg-[#222C3D]/80 text-slate-600 dark:text-[#94A3B8] hover:border-slate-300 dark:hover:border-white/[0.08] hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
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
                        className={`relative rounded-xl border p-2.5 pl-3 transition-all duration-150 overflow-hidden ${
                          isActive
                            ? 'border-slate-300/80 dark:border-white/[0.14] bg-[#E2E8F0]/90 dark:bg-[#2A374C] shadow-xs'
                            : 'border-transparent hover:border-slate-200 dark:hover:border-white/[0.08] bg-transparent hover:bg-slate-100/80 dark:hover:bg-[#222C3D]/80'
                        }`}
                      >
                        {/* Active Indicator Bar */}
                        {isActive && (
                          <div
                            className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#1B8F3D] shadow-[0_0_8px_rgba(27,143,61,0.5)]"
                            aria-hidden="true"
                          />
                        )}

                        {isEditing ? (
                          <div
                            className={`w-full ${renameError ? 'animate-ui-shake' : ''}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center gap-1.5">
                              <svg className="h-4 w-4 shrink-0 text-[#1B8F3D]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
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
                                    e.stopPropagation()
                                    handleCancelRename()
                                  }
                                }}
                                className="w-full rounded-lg border border-[#1B8F3D] bg-white dark:bg-[#0B0F17] px-2 py-1 text-xs font-semibold text-slate-900 dark:text-white outline-none shadow-xs focus:ring-1 focus:ring-[#1B8F3D]"
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
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelRename}
                                disabled={renameLoading}
                                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer disabled:opacity-50"
                                title="Hủy"
                                aria-label="Hủy đổi tên"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>

                            <div className="mt-1 flex items-center justify-between text-[11px] pl-5">
                              <span className="text-slate-400 dark:text-gray-400">
                                {renameTitle.length}/50
                              </span>
                              {renameError && (
                                <span className="text-[#B91E2B] dark:text-[#ff5c6a] truncate max-w-[140px] font-medium" title={renameError}>
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
                              <div className="flex items-center gap-2 min-w-0">
                                <svg
                                  className={`h-4 w-4 shrink-0 transition-colors duration-150 ${
                                    isActive
                                      ? 'text-[#1B8F3D] dark:text-emerald-400'
                                      : 'text-slate-400 dark:text-gray-400 group-hover:text-slate-600 dark:group-hover:text-gray-300'
                                  }`}
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={1.75}
                                  aria-hidden="true"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <p
                                  className={`truncate text-xs ${
                                    isActive
                                      ? 'font-semibold text-slate-900 dark:text-white'
                                      : 'font-medium text-slate-700 text-gray-300 group-hover:text-slate-900 dark:group-hover:text-white'
                                  }`}
                                >
                                  {chat.title}
                                </p>
                              </div>
                              <div className="flex items-center justify-between mt-1 pl-6 min-w-0">
                                <span
                                  className={`truncate text-[11px] ${
                                    isActive
                                      ? 'text-emerald-700/80 dark:text-emerald-300/80 font-medium'
                                      : 'text-slate-500 dark:text-[#94A3B8]'
                                  }`}
                                >
                                  Cuộc trò chuyện
                                </span>
                                <span
                                  className={`text-[11px] shrink-0 font-mono tracking-tight ${
                                    isActive ? 'text-slate-600 dark:text-gray-300' : 'text-slate-500 dark:text-[#94A3B8]'
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
                                <svg className="h-3.5 w-3.5 text-slate-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                  <circle cx="12" cy="5" r="1.75" />
                                  <circle cx="12" cy="12" r="1.75" />
                                  <circle cx="12" cy="19" r="1.75" />
                                </svg>
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
                className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-gradient-to-br dark:from-[#1E2837] dark:to-[#131923] text-slate-700 dark:text-[#F1F5F9] ring-1 ring-slate-200 dark:ring-white/[0.1] select-none cursor-pointer hover:ring-emerald-500/40 transition"
                title={(user as { name?: string } | null)?.name || (user?.email ? user.email : 'Tài khoản')}
              >
                <svg className="h-4 w-4 text-slate-600 dark:text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-1.5 ring-white dark:ring-[#131923]" aria-hidden="true" />
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-100/70 dark:bg-[#1A2230] text-slate-600 hover:text-[#B91E2B] dark:text-[#94A3B8] dark:hover:text-[#ff6b78] hover:bg-[#B91E2B]/10 dark:hover:bg-[#B91E2B]/15 hover:border-[#B91E2B]/30 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#B91E2B]/50 focus-visible:outline-none"
                aria-label="Đăng xuất"
                title="Đăng xuất"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2.5 px-1 mb-2.5">
                <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-gradient-to-br dark:from-[#1E2837] dark:to-[#131923] text-slate-700 dark:text-[#F1F5F9] ring-1 ring-slate-200 dark:ring-white/[0.1] select-none">
                  <svg className="h-4 w-4 text-slate-500 dark:text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-1.5 ring-white dark:ring-[#131923]" aria-hidden="true" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-800 dark:text-[#F1F5F9]">
                    {(user as { name?: string } | null)?.name || (user?.email ? user.email.split('@')[0] : 'Test User 2')}
                  </p>
                  <p className="truncate text-[11px] text-slate-500 dark:text-[#94A3B8]">
                    {user?.email ?? 'testuser2@ai.com'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex-1 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-100/70 dark:bg-[#1A2230] py-1.5 text-xs font-medium text-slate-700 dark:text-[#94A3B8] transition-all hover:bg-[#B91E2B]/10 dark:hover:bg-[#B91E2B]/20 hover:border-[#B91E2B]/40 hover:text-[#B91E2B] dark:hover:text-[#ff6b78] text-center cursor-pointer active:scale-95 focus-visible:ring-2 focus-visible:ring-[#B91E2B]/50 focus-visible:outline-none"
                  aria-label="Đăng xuất"
                  title="Đăng xuất"
                >
                  Đăng xuất
                </button>

                <button
                  type="button"
                  className="group flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-100/70 dark:bg-[#1A2230] text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F1F5F9] hover:bg-slate-200/80 dark:hover:bg-[#222C3D] hover:border-slate-300 dark:hover:border-white/[0.14] transition-all cursor-pointer active:scale-95 focus-visible:ring-2 focus-visible:ring-[#1B8F3D]/50 focus-visible:outline-none"
                  title="Cài đặt"
                  aria-label="Cài đặt"
                >
                  <svg className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
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

      {/* Search Chat Modal */}
      <SearchChatModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
      />
    </>
  )
}

export default Sidebar
