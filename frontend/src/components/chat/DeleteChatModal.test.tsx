import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { useState } from 'react'
import { DeleteChatModal } from './DeleteChatModal'

describe('DeleteChatModal Focus & Accessibility (M7-F03)', () => {
  it('1. focuses cancel button inside modal by default when opened', async () => {
    vi.useFakeTimers()
    render(
      <DeleteChatModal
        isOpen={true}
        chatTitle="Cuộc trò chuyện thử nghiệm"
        isDeleting={false}
        error={null}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    const cancelBtn = screen.getByRole('button', { name: 'Hủy bỏ' })
    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(cancelBtn).toHaveFocus()
    vi.useRealTimers()
  })

  it('2. wraps Tab from last focusable element to first focusable element', async () => {
    render(
      <DeleteChatModal
        isOpen={true}
        chatTitle="Cuộc trò chuyện thử nghiệm"
        isDeleting={false}
        error={null}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    const cancelBtn = screen.getByRole('button', { name: 'Hủy bỏ' })
    const confirmBtn = screen.getByRole('button', { name: 'Xóa vĩnh viễn' })

    // Focus last element
    confirmBtn.focus()
    expect(confirmBtn).toHaveFocus()

    // Press Tab
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(cancelBtn).toHaveFocus()
  })

  it('3. wraps Shift+Tab from first focusable element to last focusable element', async () => {
    render(
      <DeleteChatModal
        isOpen={true}
        chatTitle="Cuộc trò chuyện thử nghiệm"
        isDeleting={false}
        error={null}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    const cancelBtn = screen.getByRole('button', { name: 'Hủy bỏ' })
    const confirmBtn = screen.getByRole('button', { name: 'Xóa vĩnh viễn' })

    // Focus first element
    cancelBtn.focus()
    expect(cancelBtn).toHaveFocus()

    // Press Shift+Tab
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(confirmBtn).toHaveFocus()
  })

  it('4. prevents Tab from escaping when all elements are disabled', () => {
    render(
      <DeleteChatModal
        isOpen={true}
        chatTitle="Cuộc trò chuyện thử nghiệm"
        isDeleting={true}
        error={null}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    const dialog = screen.getByRole('dialog')
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
    document.dispatchEvent(event)

    expect(preventDefaultSpy).toHaveBeenCalled()
    expect(dialog).toHaveFocus()
  })

  it('5. restores focus to the opener element when modal closes', () => {
    function TestWrapper() {
      const [isOpen, setIsOpen] = useState(false)
      return (
        <div>
          <button data-testid="opener-button" onClick={() => setIsOpen(true)}>
            Mở modal
          </button>
          <DeleteChatModal
            isOpen={isOpen}
            chatTitle="Cuộc trò chuyện thử nghiệm"
            isDeleting={false}
            error={null}
            onConfirm={vi.fn()}
            onCancel={() => setIsOpen(false)}
          />
        </div>
      )
    }

    render(<TestWrapper />)
    const opener = screen.getByTestId('opener-button')
    opener.focus()
    expect(opener).toHaveFocus()

    // Open modal
    fireEvent.click(opener)
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    // Close modal via Cancel button
    const cancelBtn = screen.getByRole('button', { name: 'Hủy bỏ' })
    fireEvent.click(cancelBtn)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
  })

  it('6. stops propagation on Escape and calls onCancel', () => {
    const onCancel = vi.fn()
    render(
      <DeleteChatModal
        isOpen={true}
        chatTitle="Cuộc trò chuyện thử nghiệm"
        isDeleting={false}
        error={null}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    )

    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    const stopPropagationSpy = vi.spyOn(event, 'stopPropagation')
    document.dispatchEvent(event)

    expect(stopPropagationSpy).toHaveBeenCalled()
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('7. stops propagation on Escape when isDeleting is true and does NOT cancel', () => {
    const onCancel = vi.fn()
    render(
      <DeleteChatModal
        isOpen={true}
        chatTitle="Cuộc trò chuyện thử nghiệm"
        isDeleting={true}
        error={null}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    )

    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    const stopPropagationSpy = vi.spyOn(event, 'stopPropagation')
    document.dispatchEvent(event)

    expect(stopPropagationSpy).toHaveBeenCalled()
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('8. removes event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')
    const { unmount } = render(
      <DeleteChatModal
        isOpen={true}
        chatTitle="Cuộc trò chuyện thử nghiệm"
        isDeleting={false}
        error={null}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    unmount()
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    removeEventListenerSpy.mockRestore()
  })
})
