import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useThemeStore } from '../../stores/themeStore'
import { ChatActionMenu } from './ChatActionMenu'
import { SearchChatModal } from './SearchChatModal'
import { DeleteChatModal } from './DeleteChatModal'
import ModelSelector from '../ModelSelector'
import { useAIStore } from '../../stores/aiStore'

describe('M7 — Dropdowns, Modals & Overlays (Zyricon Theme)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useThemeStore.setState({ theme: 'zyricon' })
  })

  it('renders ChatActionMenu with Zyricon dark cosmic popover styling and soft pink text', () => {
    render(
      <ChatActionMenu
        isOpen={true}
        mode="popover"
        anchorRect={{ top: 100, bottom: 130, left: 200, right: 300 }}
        onRename={() => {}}
        onDelete={() => {}}
        onClose={() => {}}
      />
    )

    const menu = screen.getByRole('menu', { name: /Tùy chọn đoạn chat/i })
    expect(menu).toBeInTheDocument()
    expect(menu.className).toContain('zyricon:border-[#694788]/35')
    expect(menu.className).toContain('zyricon:bg-[#120B1C]/96')
    expect(menu.className).toContain('zyricon:shadow-[0_8px_32px_rgba(7,4,11,0.85)]')

    const renameBtn = screen.getByRole('menuitem', { name: /Đổi tên/i })
    expect(renameBtn.className).toContain('zyricon:text-[#EBDDE9]')
    expect(renameBtn.className).toContain('zyricon:hover:bg-[#3B2568]/40')

    const deleteBtn = screen.getByRole('menuitem', { name: /Xóa/i })
    expect(deleteBtn.className).toContain('zyricon:text-[#ff6b78]')
  })

  it('renders SearchChatModal with Zyricon backdrop, cosmic dialog, and accent highlights', () => {
    const mockChats = [
      {
        id: 'chat-1',
        title: 'Thiết kế hệ thống Zyricon',
        userId: 'user-1',
        createdAt: '2026-11-06T00:00:00.000Z',
        updatedAt: '2026-11-06T00:00:00.000Z',
      },
    ]

    render(
      <SearchChatModal
        isOpen={true}
        onClose={() => {}}
        chats={mockChats}
        currentChatId="chat-1"
        onSelectChat={() => {}}
      />
    )

    const dialog = screen.getByRole('dialog', { name: /Tìm kiếm cuộc trò chuyện/i })
    expect(dialog).toBeInTheDocument()
    expect(dialog.className).toContain('zyricon:border-[#694788]/35')
    expect(dialog.className).toContain('zyricon:bg-[#120B1C]/96')
    expect(dialog.className).toContain('zyricon:shadow-[0_12px_48px_rgba(7,4,11,0.95)]')

    const input = screen.getByPlaceholderText(/Tìm kiếm theo tiêu đề cuộc trò chuyện/i)
    expect(input.className).toContain('zyricon:text-[#F7F3F6]')
    expect(input.className).toContain('zyricon:placeholder:text-[#8F7686]')

    const escKbd = screen.getByText('ESC')
    expect(escKbd.className).toContain('zyricon:bg-[#1D132D]')
    expect(escKbd.className).toContain('zyricon:border-[#694788]/30')
  })

  it('renders DeleteChatModal with Zyricon dialog, title card, and cancel button styling', () => {
    render(
      <DeleteChatModal
        isOpen={true}
        chatTitle="Đoạn chat thử nghiệm Zyricon"
        isDeleting={false}
        error={null}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    )

    const dialog = screen.getByRole('dialog', { name: /Xóa đoạn chat này\?/i })
    expect(dialog).toBeInTheDocument()
    expect(dialog.className).toContain('zyricon:border-[#694788]/35')
    expect(dialog.className).toContain('zyricon:bg-[#120B1C]/98')

    const titleCard = screen.getByText('Đoạn chat thử nghiệm Zyricon')
    expect(titleCard.className).toContain('zyricon:bg-[#1A102A]/80')
    expect(titleCard.className).toContain('zyricon:border-[#694788]/30')
    expect(titleCard.className).toContain('zyricon:text-[#EBDDE9]')

    const cancelBtn = screen.getByRole('button', { name: /Hủy bỏ/i })
    expect(cancelBtn.className).toContain('zyricon:bg-[#1D132D]')
    expect(cancelBtn.className).toContain('zyricon:text-[#C4A5B8]')
    expect(cancelBtn.className).toContain('zyricon:hover:bg-[#25173D]')
  })

  it('renders ModelSelector with Zyricon popover, badges, and option card tokens', () => {
    useAIStore.setState({
      models: [
        {
          id: 'gemini-3.6-flash',
          name: 'Gemini 3.6 Flash',
          provider: 'Google',
          available: true,
        },
        {
          id: 'ollama-qwen3-1.7b',
          name: 'Qwen 3 1.7B',
          provider: 'Ollama',
          available: true,
        },
      ],
      selectedModelId: 'gemini-3.6-flash',
    })

    render(<ModelSelector />)

    const triggerBtn = screen.getByRole('button', { name: /Mô hình AI hiện tại/i })
    expect(triggerBtn.className).toContain('zyricon:focus-visible:ring-[#C27595]')

    // Open dropdown
    fireEvent.click(triggerBtn)

    const listbox = screen.getByRole('listbox')
    expect(listbox).toBeInTheDocument()
    expect(listbox.className).toContain('zyricon:border-[#694788]/35')
    expect(listbox.className).toContain('zyricon:bg-[#120B1C]/96')

    const selectedOption = within(listbox).getByRole('option', { name: /Gemini 3\.6 Flash/i })
    expect(selectedOption.className).toContain('zyricon:border-[#C27595]/50')
  })

  it('preserves Light and Dark baseline classes across dropdowns and modals', () => {
    useThemeStore.setState({ theme: 'light' })

    const { rerender } = render(
      <ChatActionMenu
        isOpen={true}
        mode="popover"
        anchorRect={{ top: 100, bottom: 130, left: 200, right: 300 }}
        onRename={() => {}}
        onDelete={() => {}}
        onClose={() => {}}
      />
    )

    const menu = screen.getByRole('menu')
    expect(menu.className).toContain('bg-white/95')
    expect(menu.className).toContain('border-slate-200/90')

    rerender(
      <DeleteChatModal
        isOpen={true}
        chatTitle="Light theme chat"
        isDeleting={false}
        error={null}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    )

    const dialog = screen.getByRole('dialog')
    expect(dialog.className).toContain('bg-white')
    expect(dialog.className).toContain('border-slate-200')
    expect(dialog.className).toContain('dark:bg-[#1A2230]')
  })
})
