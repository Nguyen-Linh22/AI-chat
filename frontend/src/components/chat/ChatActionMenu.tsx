import { useEffect, useRef } from 'react'

interface ChatActionMenuProps {
  isOpen: boolean
  mode: 'popover' | 'context-menu'
  position?: { x: number; y: number }
  anchorRect?: { top: number; bottom: number; left: number; right: number }
  onRename: () => void
  onDelete: () => void
  onClose: () => void
}

export function ChatActionMenu({
  isOpen,
  mode,
  position,
  anchorRect,
  onRename,
  onDelete,
  onClose,
}: ChatActionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        onClose()
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
      }
    }

    const handleScrollOrResize = () => {
      onClose()
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('scroll', handleScrollOrResize, true)
    window.addEventListener('resize', handleScrollOrResize)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('scroll', handleScrollOrResize, true)
      window.removeEventListener('resize', handleScrollOrResize)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const MENU_WIDTH = 136
  const MENU_HEIGHT = 80

  let style: React.CSSProperties = {
    position: 'fixed',
    zIndex: 60,
  }

  if (mode === 'context-menu' && position) {
    const left = Math.max(
      8,
      Math.min(position.x, window.innerWidth - MENU_WIDTH - 8)
    )
    const top = Math.max(
      8,
      Math.min(position.y, window.innerHeight - MENU_HEIGHT - 8)
    )
    style = {
      ...style,
      left: `${left}px`,
      top: `${top}px`,
    }
  } else if (mode === 'popover' && anchorRect) {
    // Vertical placement: place below button, flip up if near bottom edge
    let top = anchorRect.bottom + 4
    if (top + MENU_HEIGHT > window.innerHeight - 8) {
      top = Math.max(8, anchorRect.top - MENU_HEIGHT - 4)
    }

    // Horizontal placement: align with right side of chat item / button
    let left = anchorRect.right - MENU_WIDTH + 8
    if (left + MENU_WIDTH > window.innerWidth - 8) {
      left = window.innerWidth - MENU_WIDTH - 8
    }
    if (left < 8) {
      left = 8
    }

    style = {
      ...style,
      left: `${left}px`,
      top: `${top}px`,
    }
  } else {
    style = {
      ...style,
      right: '16px',
      top: '60px',
    }
  }

  return (
    <div
      ref={menuRef}
      style={style}
      role="menu"
      aria-label="Tùy chọn đoạn chat"
      className="w-34 animate-dropdown-fade rounded-xl border border-slate-200 dark:border-white/[0.12] bg-white/95 dark:bg-[#1A2230]/95 p-1 shadow-xl backdrop-blur-2xl ring-1 ring-black/5 dark:ring-black/50"
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onClose()
          onRename()
        }}
        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-[#F1F5F9] transition hover:bg-slate-100 dark:hover:bg-[#222C3D] hover:text-slate-900 dark:hover:text-white cursor-pointer active:scale-95"
      >
        <svg className="h-3.5 w-3.5 text-slate-400 dark:text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
        <span className="font-medium">Đổi tên</span>
      </button>

      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onClose()
          onDelete()
        }}
        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-[#B91E2B] dark:text-[#ff6b78] transition hover:bg-[#B91E2B]/10 dark:hover:bg-[#B91E2B]/20 cursor-pointer active:scale-95"
      >
        <svg className="h-3.5 w-3.5 text-[#B91E2B] dark:text-[#ff6b78]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <span className="font-medium">Xóa</span>
      </button>
    </div>
  )
}

export default ChatActionMenu
