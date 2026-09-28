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
      className="w-34 animate-dropdown-fade rounded-xl border border-white/10 bg-[#161d2a]/95 p-1 shadow-2xl backdrop-blur-2xl ring-1 ring-black/50"
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
        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 transition hover:bg-white/10 hover:text-white cursor-pointer active:scale-95"
      >
        <span className="text-gray-400">✏</span>
        <span className="font-medium">Đổi tên</span>
      </button>

      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onClose()
          onDelete()
        }}
        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-[#B91E2B] transition hover:bg-[#B91E2B]/15 cursor-pointer active:scale-95"
      >
        <span>🗑</span>
        <span className="font-medium">Xóa</span>
      </button>
    </div>
  )
}

export default ChatActionMenu
