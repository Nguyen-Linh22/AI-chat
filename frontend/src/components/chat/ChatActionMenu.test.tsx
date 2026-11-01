import { useState, useRef } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ChatActionMenu } from './ChatActionMenu'

describe('ChatActionMenu Component', () => {
  const defaultProps = {
    isOpen: true,
    mode: 'popover' as const,
    anchorRect: { top: 100, bottom: 130, left: 200, right: 230 },
    onRename: vi.fn(),
    onDelete: vi.fn(),
    onClose: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Test Harness to verify focus restoration
  function ActionMenuTestHarness({
    initialOpen = false,
    removeTriggerOnClose = false,
  }: {
    initialOpen?: boolean
    removeTriggerOnClose?: boolean
  }) {
    const [isOpen, setIsOpen] = useState(initialOpen)
    const [triggerMounted, setTriggerMounted] = useState(true)
    const triggerRef = useRef<HTMLButtonElement | null>(null)

    const handleOpen = () => {
      setIsOpen(true)
    }

    const handleClose = () => {
      if (removeTriggerOnClose) {
        setTriggerMounted(false)
      }
      setIsOpen(false)
    }

    return (
      <div>
        {triggerMounted && (
          <button
            ref={triggerRef}
            type="button"
            data-testid="chat-item-trigger-btn"
            onClick={handleOpen}
          >
            Thao tác chat
          </button>
        )}
        <ChatActionMenu
          {...defaultProps}
          isOpen={isOpen}
          onClose={handleClose}
          triggerRef={triggerRef}
        />
      </div>
    )
  }

  it('1. moves focus to the first enabled menu item when menu opens', async () => {
    vi.useFakeTimers()
    const { unmount } = render(<ActionMenuTestHarness initialOpen={false} />)

    const trigger = screen.getByTestId('chat-item-trigger-btn')
    trigger.focus()
    expect(document.activeElement).toBe(trigger)

    fireEvent.click(trigger)

    act(() => {
      vi.advanceTimersByTime(50)
    })

    const renameItem = screen.getByRole('menuitem', { name: /Đổi tên/i })
    expect(document.activeElement).toBe(renameItem)

    vi.useRealTimers()
    unmount()
  })

  it('2. navigates to next menu item on ArrowDown', async () => {
    vi.useFakeTimers()
    const { unmount } = render(<ActionMenuTestHarness initialOpen={false} />)

    const trigger = screen.getByTestId('chat-item-trigger-btn')
    trigger.focus()
    fireEvent.click(trigger)

    act(() => {
      vi.advanceTimersByTime(50)
    })

    const renameItem = screen.getByRole('menuitem', { name: /Đổi tên/i })
    const deleteItem = screen.getByRole('menuitem', { name: /Xóa/i })
    expect(document.activeElement).toBe(renameItem)

    fireEvent.keyDown(renameItem, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(deleteItem)

    vi.useRealTimers()
    unmount()
  })

  it('3. navigates to previous menu item on ArrowUp', async () => {
    vi.useFakeTimers()
    const { unmount } = render(<ActionMenuTestHarness initialOpen={false} />)

    const trigger = screen.getByTestId('chat-item-trigger-btn')
    trigger.focus()
    fireEvent.click(trigger)

    act(() => {
      vi.advanceTimersByTime(50)
    })

    const renameItem = screen.getByRole('menuitem', { name: /Đổi tên/i })
    const deleteItem = screen.getByRole('menuitem', { name: /Xóa/i })

    // Move to delete
    fireEvent.keyDown(renameItem, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(deleteItem)

    // Move back to rename
    fireEvent.keyDown(deleteItem, { key: 'ArrowUp' })
    expect(document.activeElement).toBe(renameItem)

    vi.useRealTimers()
    unmount()
  })

  it('4. wraps focus at both ends (ArrowDown from last -> first, ArrowUp from first -> last)', async () => {
    vi.useFakeTimers()
    const { unmount } = render(<ActionMenuTestHarness initialOpen={false} />)

    const trigger = screen.getByTestId('chat-item-trigger-btn')
    trigger.focus()
    fireEvent.click(trigger)

    act(() => {
      vi.advanceTimersByTime(50)
    })

    const renameItem = screen.getByRole('menuitem', { name: /Đổi tên/i })
    const deleteItem = screen.getByRole('menuitem', { name: /Xóa/i })

    // Focus first element, ArrowUp wraps to last element
    expect(document.activeElement).toBe(renameItem)
    fireEvent.keyDown(renameItem, { key: 'ArrowUp' })
    expect(document.activeElement).toBe(deleteItem)

    // ArrowDown from last element wraps to first element
    fireEvent.keyDown(deleteItem, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(renameItem)

    vi.useRealTimers()
    unmount()
  })

  it('5. navigates to first item on Home and last item on End', async () => {
    vi.useFakeTimers()
    const { unmount } = render(<ActionMenuTestHarness initialOpen={false} />)

    const trigger = screen.getByTestId('chat-item-trigger-btn')
    trigger.focus()
    fireEvent.click(trigger)

    act(() => {
      vi.advanceTimersByTime(50)
    })

    const renameItem = screen.getByRole('menuitem', { name: /Đổi tên/i })
    const deleteItem = screen.getByRole('menuitem', { name: /Xóa/i })

    expect(document.activeElement).toBe(renameItem)

    // Press End -> focuses deleteItem
    fireEvent.keyDown(renameItem, { key: 'End' })
    expect(document.activeElement).toBe(deleteItem)

    // Press Home -> focuses renameItem
    fireEvent.keyDown(deleteItem, { key: 'Home' })
    expect(document.activeElement).toBe(renameItem)

    vi.useRealTimers()
    unmount()
  })

  it('6. skips disabled items during arrow navigation and wrapping', async () => {
    render(<ChatActionMenu {...defaultProps} />)
    const renameBtn = screen.getByRole('menuitem', { name: /Đổi tên/i })
    const deleteBtn = screen.getByRole('menuitem', { name: /Xóa/i })

    // Disable the delete button
    deleteBtn.setAttribute('disabled', 'true')
    ;(deleteBtn as HTMLButtonElement).disabled = true

    renameBtn.focus()
    expect(document.activeElement).toBe(renameBtn)

    // ArrowDown from renameBtn skips the disabled deleteBtn and wraps back to renameBtn
    fireEvent.keyDown(renameBtn, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(renameBtn)

    // ArrowUp from renameBtn also wraps back to renameBtn
    fireEvent.keyDown(renameBtn, { key: 'ArrowUp' })
    expect(document.activeElement).toBe(renameBtn)

    // End also focuses the only enabled item (renameBtn)
    fireEvent.keyDown(renameBtn, { key: 'End' })
    expect(document.activeElement).toBe(renameBtn)
  })

  it('7. activates focused item on Enter key', async () => {
    const onRename = vi.fn()
    const onDelete = vi.fn()
    const onClose = vi.fn()

    render(
      <ChatActionMenu
        {...defaultProps}
        onRename={onRename}
        onDelete={onDelete}
        onClose={onClose}
      />
    )

    const renameBtn = screen.getByRole('menuitem', { name: /Đổi tên/i })
    const deleteBtn = screen.getByRole('menuitem', { name: /Xóa/i })

    // Focus rename and press Enter
    renameBtn.focus()
    fireEvent.keyDown(renameBtn, { key: 'Enter' })
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onRename).toHaveBeenCalledTimes(1)

    // Focus delete and press Enter
    deleteBtn.focus()
    fireEvent.keyDown(deleteBtn, { key: 'Enter' })
    expect(onClose).toHaveBeenCalledTimes(2)
    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('8. activates focused item on Space key and prevents page scrolling', async () => {
    const onRename = vi.fn()
    const onDelete = vi.fn()
    const onClose = vi.fn()

    render(
      <ChatActionMenu
        {...defaultProps}
        onRename={onRename}
        onDelete={onDelete}
        onClose={onClose}
      />
    )

    const renameBtn = screen.getByRole('menuitem', { name: /Đổi tên/i })
    const deleteBtn = screen.getByRole('menuitem', { name: /Xóa/i })

    // Focus rename and press Space
    renameBtn.focus()
    const spaceEvent = new KeyboardEvent('keydown', {
      key: ' ',
      bubbles: true,
      cancelable: true,
    })
    renameBtn.dispatchEvent(spaceEvent)
    expect(spaceEvent.defaultPrevented).toBe(true)
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onRename).toHaveBeenCalledTimes(1)

    // Focus delete and press Space
    deleteBtn.focus()
    const spaceEvent2 = new KeyboardEvent('keydown', {
      key: ' ',
      bubbles: true,
      cancelable: true,
    })
    deleteBtn.dispatchEvent(spaceEvent2)
    expect(spaceEvent2.defaultPrevented).toBe(true)
    expect(onClose).toHaveBeenCalledTimes(2)
    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('9. closes menu and restores focus to trigger on Escape', async () => {
    vi.useFakeTimers()
    const { unmount } = render(<ActionMenuTestHarness initialOpen={false} />)

    const trigger = screen.getByTestId('chat-item-trigger-btn')
    trigger.focus()
    expect(document.activeElement).toBe(trigger)

    fireEvent.click(trigger)

    act(() => {
      vi.advanceTimersByTime(50)
    })

    const renameItem = screen.getByRole('menuitem', { name: /Đổi tên/i })
    expect(document.activeElement).toBe(renameItem)

    // Press Escape
    fireEvent.keyDown(document, { key: 'Escape' })

    // Focus is restored to trigger
    expect(document.activeElement).toBe(trigger)

    vi.useRealTimers()
    unmount()
  })

  it('10. does not throw when trigger is unmounted before Escape', async () => {
    vi.useFakeTimers()
    const { unmount } = render(<ActionMenuTestHarness initialOpen={false} removeTriggerOnClose={true} />)

    const trigger = screen.getByTestId('chat-item-trigger-btn')
    trigger.focus()
    fireEvent.click(trigger)

    act(() => {
      vi.advanceTimersByTime(50)
    })

    expect(() => {
      fireEvent.keyDown(document, { key: 'Escape' })
    }).not.toThrow()

    expect(screen.queryByTestId('chat-item-trigger-btn')).not.toBeInTheDocument()

    vi.useRealTimers()
    unmount()
  })

  it('11. closes menu on outside click without preventing normal event propagation', async () => {
    const onClose = vi.fn()
    render(
      <div>
        <button type="button" data-testid="outside-button">Outside</button>
        <ChatActionMenu {...defaultProps} onClose={onClose} />
      </div>
    )

    const outsideBtn = screen.getByTestId('outside-button')
    fireEvent.mouseDown(outsideBtn)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('12. preserves existing Rename and Delete callbacks on mouse click', async () => {
    const onRename = vi.fn()
    const onDelete = vi.fn()
    const onClose = vi.fn()

    render(
      <ChatActionMenu
        {...defaultProps}
        onRename={onRename}
        onDelete={onDelete}
        onClose={onClose}
      />
    )

    const renameBtn = screen.getByRole('menuitem', { name: /Đổi tên/i })
    const deleteBtn = screen.getByRole('menuitem', { name: /Xóa/i })

    fireEvent.click(renameBtn)
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onRename).toHaveBeenCalledTimes(1)

    fireEvent.click(deleteBtn)
    expect(onClose).toHaveBeenCalledTimes(2)
    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('13. closes menu when Tab key is pressed to let user tab away naturally', async () => {
    const onClose = vi.fn()
    render(<ChatActionMenu {...defaultProps} onClose={onClose} />)

    const renameBtn = screen.getByRole('menuitem', { name: /Đổi tên/i })
    renameBtn.focus()

    fireEvent.keyDown(renameBtn, { key: 'Tab' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('14. ignores arrow keys when focus is outside the menu', async () => {
    render(
      <div>
        <button type="button" data-testid="outside-btn">Outside</button>
        <ChatActionMenu {...defaultProps} />
      </div>
    )

    const outsideBtn = screen.getByTestId('outside-btn')
    outsideBtn.focus()

    // Arrow down while outside does not move focus into menu
    fireEvent.keyDown(document, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(outsideBtn)
  })
})
