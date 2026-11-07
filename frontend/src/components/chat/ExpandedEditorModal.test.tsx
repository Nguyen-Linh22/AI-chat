import { useState } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act, createEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExpandedEditorModal } from './ExpandedEditorModal'
import { useThemeStore } from '../../stores/themeStore'

describe('ExpandedEditorModal Component', () => {
  const defaultProps = {
    isOpen: true,
    content: '# Tiêu đề chính\n\nNội dung Markdown với **in đậm** và *in nghiêng*.',
    onChange: vi.fn(),
    onClose: vi.fn(),
    onSend: vi.fn(),
    onStop: vi.fn(),
    isActive: false,
    isDisabled: false,
    error: null,
    modelName: 'Gemini 3.8 Flash',
    selectedFile: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useThemeStore.setState({ theme: 'dark' })
  })

  it('1. should open by default in "Soạn thảo" (edit) mode with textarea and stats', () => {
    render(<ExpandedEditorModal {...defaultProps} />)

    // Verify dialog role
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    // Verify tablist and selected tab
    const editTab = screen.getByRole('tab', { name: /Soạn thảo/i })
    const previewTab = screen.getByRole('tab', { name: /Xem trước/i })

    expect(editTab).toHaveAttribute('aria-selected', 'true')
    expect(previewTab).toHaveAttribute('aria-selected', 'false')

    // Verify textarea is displayed
    const textarea = screen.getByPlaceholderText('Nhập nội dung tin nhắn chi tiết, đoạn mã, hoặc tài liệu...') as HTMLTextAreaElement
    expect(textarea).toBeInTheDocument()
    expect(textarea.value).toBe(defaultProps.content)

    // Verify footer stats
    expect(screen.getByText(/ký tự/)).toBeInTheDocument()
    expect(screen.getByText(/từ/)).toBeInTheDocument()
    expect(screen.getByText(/dòng/)).toBeInTheDocument()
  })

  it('2. should switch to "Xem trước" (preview) mode and render markdown elements', async () => {
    const user = userEvent.setup()
    render(<ExpandedEditorModal {...defaultProps} />)

    const previewTab = screen.getByRole('tab', { name: /Xem trước/i })
    await user.click(previewTab)

    expect(previewTab).toHaveAttribute('aria-selected', 'true')

    // Textarea should not be displayed in preview panel
    expect(screen.queryByPlaceholderText('Nhập nội dung tin nhắn chi tiết, đoạn mã, hoặc tài liệu...')).not.toBeInTheDocument()

    // Preview panel should be in DOM
    const previewPanel = screen.getByTestId('markdown-preview-panel')
    expect(previewPanel).toBeInTheDocument()

    // Headings and formatted text rendered
    expect(screen.getByRole('heading', { level: 1, name: 'Tiêu đề chính' })).toBeInTheDocument()
    expect(screen.getByText('in đậm')).toBeInTheDocument()
  })

  it('3. should preserve draft when switching back and forth between edit and preview tabs', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    let currentContent = 'Văn bản gốc'

    render(
      <ExpandedEditorModal
        {...defaultProps}
        content={currentContent}
        onChange={(val) => {
          currentContent = val
          handleChange(val)
        }}
      />
    )

    // Switch to preview
    await user.click(screen.getByRole('tab', { name: /Xem trước/i }))
    expect(screen.getByText('Văn bản gốc')).toBeInTheDocument()

    // Switch back to edit
    await user.click(screen.getByRole('tab', { name: /Soạn thảo/i }))
    const textarea = screen.getByPlaceholderText('Nhập nội dung tin nhắn chi tiết, đoạn mã, hoặc tài liệu...') as HTMLTextAreaElement
    expect(textarea.value).toBe('Văn bản gốc')

    // Verify no send was triggered on tab switch
    expect(defaultProps.onSend).not.toHaveBeenCalled()
  })

  it('4. should render headings, lists, blockquotes, code blocks, tables and links in preview', async () => {
    const user = userEvent.setup()
    const richMarkdown = `
# Tiêu đề 1
## Tiêu đề 2
- Mục 1
- Mục 2

> Đây là trích dẫn

| Cột A | Cột B |
|---|---|
| Dữ liệu 1 | Dữ liệu 2 |

\`\`\`javascript
const greeting = "Xin chào";
\`\`\`

\`inline code\`

[Trang chủ](https://example.com)
`
    render(<ExpandedEditorModal {...defaultProps} content={richMarkdown} />)

    // Switch to preview
    await user.click(screen.getByRole('tab', { name: /Xem trước/i }))

    expect(screen.getByRole('heading', { level: 1, name: 'Tiêu đề 1' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Tiêu đề 2' })).toBeInTheDocument()
    expect(screen.getByText('Mục 1')).toBeInTheDocument()
    expect(screen.getByText('Mục 2')).toBeInTheDocument()
    expect(screen.getByText('Đây là trích dẫn')).toBeInTheDocument()

    // Table elements
    expect(screen.getByTestId('preview-table-container')).toBeInTheDocument()
    expect(screen.getByText('Cột A')).toBeInTheDocument()
    expect(screen.getByText('Dữ liệu 1')).toBeInTheDocument()

    // Code block
    expect(screen.getByTestId('preview-code-block')).toBeInTheDocument()
    expect(screen.getByText('javascript')).toBeInTheDocument()

    // Safe link
    const link = screen.getByRole('link', { name: 'Trang chủ' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', 'https://example.com')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('5. should correctly render Vietnamese Unicode and emojis in preview', async () => {
    const user = userEvent.setup()
    const vnMarkdown = 'Hà Nội mùa thu 🍂 🇻🇳 — Chúc bạn một ngày tốt lành! ✨'

    render(<ExpandedEditorModal {...defaultProps} content={vnMarkdown} />)
    await user.click(screen.getByRole('tab', { name: /Xem trước/i }))

    expect(screen.getByText(/Hà Nội mùa thu 🍂 🇻🇳 — Chúc bạn một ngày tốt lành! ✨/)).toBeInTheDocument()
  })

  it('6. should NOT execute or render raw HTML <script> tags in preview', async () => {
    const user = userEvent.setup()
    const maliciousInput = '<script>window.pwned = true;</script>Nội dung an toàn'

    render(<ExpandedEditorModal {...defaultProps} content={maliciousInput} />)
    await user.click(screen.getByRole('tab', { name: /Xem trước/i }))

    // Script tag must not exist in DOM as an executable HTML script element
    expect(document.querySelector('script:not([src])')).toBeNull()
    expect(screen.getByText(/Nội dung an toàn/)).toBeInTheDocument()
  })

  it('7. should neutralize dangerous javascript: links in preview', async () => {
    const user = userEvent.setup()
    const xssLink = '[Bấm vào đây](javascript:alert("XSS"))'

    render(<ExpandedEditorModal {...defaultProps} content={xssLink} />)
    await user.click(screen.getByRole('tab', { name: /Xem trước/i }))

    // Dangerous link must not be an active <a> element with javascript: href
    expect(screen.queryByRole('link', { name: 'Bấm vào đây' })).not.toBeInTheDocument()

    // It should be neutralized into a harmless span
    const neutralized = screen.getByTestId('unsafe-link-neutralized')
    expect(neutralized).toBeInTheDocument()
    expect(neutralized).toHaveTextContent('Bấm vào đây')
  })

  it('8. should support keyboard navigation between tabs using Arrow keys (WAI-ARIA pattern)', () => {
    render(<ExpandedEditorModal {...defaultProps} />)

    const editTab = screen.getByRole('tab', { name: /Soạn thảo/i })
    const previewTab = screen.getByRole('tab', { name: /Xem trước/i })

    // Focus on edit tab
    editTab.focus()
    expect(document.activeElement).toBe(editTab)

    // Press ArrowRight to move to Preview tab
    fireEvent.keyDown(editTab, { key: 'ArrowRight' })
    expect(previewTab).toHaveAttribute('aria-selected', 'true')
    expect(document.activeElement).toBe(previewTab)

    // Press ArrowLeft to move back to Edit tab
    fireEvent.keyDown(previewTab, { key: 'ArrowLeft' })
    expect(editTab).toHaveAttribute('aria-selected', 'true')
    expect(document.activeElement).toBe(editTab)
  })

  it('9. should allow sending via Ctrl+Enter from preview tab', async () => {
    const user = userEvent.setup()
    render(<ExpandedEditorModal {...defaultProps} content="Draft to send from preview" />)

    // Switch to preview
    await user.click(screen.getByRole('tab', { name: /Xem trước/i }))

    // Press Ctrl+Enter on window / panel
    await user.keyboard('{Control>}{Enter}{/Control}')

    expect(defaultProps.onSend).toHaveBeenCalledTimes(1)
  })

  it('10. should allow closing via Escape from preview tab', async () => {
    const user = userEvent.setup()
    render(<ExpandedEditorModal {...defaultProps} content="Draft to keep" />)

    // Switch to preview
    await user.click(screen.getByRole('tab', { name: /Xem trước/i }))

    // Press Escape
    await user.keyboard('{Escape}')

    expect(defaultProps.onClose).toHaveBeenCalledWith('Draft to keep')
  })

  it('11. should display attachment pill in both Edit and Preview tabs when file is attached', async () => {
    const user = userEvent.setup()
    const mockFile = new File(['content'], 'tai-lieu-bao-mat.pdf', { type: 'application/pdf' })

    render(<ExpandedEditorModal {...defaultProps} selectedFile={mockFile} />)

    // Edit tab: attachment pill present
    expect(screen.getByTestId('modal-attachment-pill')).toHaveTextContent('tai-lieu-bao-mat.pdf')

    // Switch to preview tab: attachment pill still present
    await user.click(screen.getByRole('tab', { name: /Xem trước/i }))
    expect(screen.getByTestId('modal-attachment-pill')).toHaveTextContent('tai-lieu-bao-mat.pdf')
  })

  it('12. should show empty placeholder in preview when content is empty or whitespace', async () => {
    const user = userEvent.setup()
    render(<ExpandedEditorModal {...defaultProps} content="   " />)

    await user.click(screen.getByRole('tab', { name: /Xem trước/i }))

    expect(screen.getByText('Chưa có nội dung để xem trước')).toBeInTheDocument()
  })

  it('13. should support copying code block content via button in preview', async () => {
    const user = userEvent.setup()
    const codeMarkdown = '```python\nprint("Hello World")\n```'

    const writeTextMock = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockResolvedValue(undefined)

    render(<ExpandedEditorModal {...defaultProps} content={codeMarkdown} />)
    await user.click(screen.getByRole('tab', { name: /Xem trước/i }))

    const copyBtn = screen.getByRole('button', { name: /Sao chép/i })
    await user.click(copyBtn)

    expect(writeTextMock).toHaveBeenCalledWith('print("Hello World")')
    expect(screen.getByText('Đã chép')).toBeInTheDocument()
    writeTextMock.mockRestore()
  })

  it('14. should keep Preview tab active even after 50ms focus timer fires (no race condition regression)', () => {
    vi.useFakeTimers()
    render(<ExpandedEditorModal {...defaultProps} />)

    const previewTab = screen.getByRole('tab', { name: /Xem trước/i })
    fireEvent.click(previewTab)

    expect(previewTab).toHaveAttribute('aria-selected', 'true')

    // Fast-forward past the 50ms timer
    act(() => {
      vi.advanceTimersByTime(100)
    })

    // Must still be Preview tab, NOT reset to Edit
    expect(previewTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('markdown-preview-panel')).toBeInTheDocument()

    vi.useRealTimers()
  })

  it('15. should reset to Editor tab when modal is closed and reopened', () => {
    const { rerender } = render(<ExpandedEditorModal {...defaultProps} isOpen={true} />)

    // Switch to preview
    const previewTab = screen.getByRole('tab', { name: /Xem trước/i })
    fireEvent.click(previewTab)
    expect(previewTab).toHaveAttribute('aria-selected', 'true')

    // Close modal
    rerender(<ExpandedEditorModal {...defaultProps} isOpen={false} />)
    expect(screen.queryByRole('dialog')).toBeNull()

    // Reopen modal
    rerender(<ExpandedEditorModal {...defaultProps} isOpen={true} />)
    const editTab = screen.getByRole('tab', { name: /Soạn thảo/i })
    const newPreviewTab = screen.getByRole('tab', { name: /Xem trước/i })
    expect(editTab).toHaveAttribute('aria-selected', 'true')
    expect(newPreviewTab).toHaveAttribute('aria-selected', 'false')
  })

  it('16. should cleanup focus timer if modal is closed before 50ms expires', () => {
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout')
    const { rerender } = render(<ExpandedEditorModal {...defaultProps} isOpen={true} />)

    // Close modal immediately before 50ms
    rerender(<ExpandedEditorModal {...defaultProps} isOpen={false} />)

    expect(clearTimeoutSpy).toHaveBeenCalled()
    clearTimeoutSpy.mockRestore()
  })

  it('17. Tab key inserts 4 spaces at caret and allows immediate subsequent typing without caret jump', async () => {
    const user = userEvent.setup()
    function ControlledModal() {
      const [val, setVal] = useState('Hello')
      return <ExpandedEditorModal {...defaultProps} content={val} onChange={setVal} />
    }
    render(<ControlledModal />)

    const textarea = screen.getByPlaceholderText('Nhập nội dung tin nhắn chi tiết, đoạn mã, hoặc tài liệu...') as HTMLTextAreaElement
    expect(textarea.value).toBe('Hello')

    // Press Tab
    await user.type(textarea, '{Tab}')
    expect(textarea.value).toBe('Hello    ')
    expect(textarea.selectionStart).toBe(9)
    expect(textarea.selectionEnd).toBe(9)

    // Immediate subsequent typing
    await user.type(textarea, 'world')
    expect(textarea.value).toBe('Hello    world')
    expect(textarea.selectionStart).toBe(14)
  })

  it('18. Tab key inserts 4 spaces in the middle of text and preserves surrounding content', () => {
    function ControlledModal() {
      const [val, setVal] = useState('Helloworld')
      return <ExpandedEditorModal {...defaultProps} content={val} onChange={setVal} />
    }
    render(<ControlledModal />)

    const textarea = screen.getByPlaceholderText('Nhập nội dung tin nhắn chi tiết, đoạn mã, hoặc tài liệu...') as HTMLTextAreaElement
    // Set caret between "Hello" and "world"
    textarea.selectionStart = textarea.selectionEnd = 5

    fireEvent.keyDown(textarea, { key: 'Tab' })

    expect(textarea.value).toBe('Hello    world')
    expect(textarea.selectionStart).toBe(9)
    expect(textarea.selectionEnd).toBe(9)
  })

  it('19. Tab key replaces selected text range with 4 spaces and updates caret', () => {
    function ControlledModal() {
      const [val, setVal] = useState('Hello [REPLACE_ME] world')
      return <ExpandedEditorModal {...defaultProps} content={val} onChange={setVal} />
    }
    render(<ControlledModal />)

    const textarea = screen.getByPlaceholderText('Nhập nội dung tin nhắn chi tiết, đoạn mã, hoặc tài liệu...') as HTMLTextAreaElement
    // Select "[REPLACE_ME]" (from index 6 to 18)
    textarea.selectionStart = 6
    textarea.selectionEnd = 18

    fireEvent.keyDown(textarea, { key: 'Tab' })

    expect(textarea.value).toBe('Hello      world')
    expect(textarea.selectionStart).toBe(10)
    expect(textarea.selectionEnd).toBe(10)
  })

  it('20. Shift+Tab does not insert spaces and does not prevent default', () => {
    const onChange = vi.fn()
    render(<ExpandedEditorModal {...defaultProps} content="Existing text" onChange={onChange} />)

    const textarea = screen.getByPlaceholderText('Nhập nội dung tin nhắn chi tiết, đoạn mã, hoặc tài liệu...') as HTMLTextAreaElement
    const shiftTabEvent = createEvent.keyDown(textarea, {
      key: 'Tab',
      shiftKey: true,
    })
    fireEvent(textarea, shiftTabEvent)

    expect(shiftTabEvent.defaultPrevented).toBe(false)
    expect(onChange).not.toHaveBeenCalled()
    expect(textarea.value).toBe('Existing text')
  })

  it('21. should have focus-visible ring indicator on footer buttons', () => {
    render(<ExpandedEditorModal {...defaultProps} content="Existing text" />)

    const cancelBtn = screen.getByRole('button', { name: 'Hủy' })
    const sendBtn = screen.getByRole('button', { name: 'Gửi' })

    expect(cancelBtn.className).toContain('focus-visible:ring-2')
    expect(cancelBtn.className).toContain('focus-visible:ring-amber-500/60')
    expect(sendBtn.className).toContain('focus-visible:ring-2')
    expect(sendBtn.className).toContain('focus-visible:ring-amber-600')
  })

  it('22. should display PDF-specific styling, accessible name, and rich metadata title for PDF attachments', () => {
    const mockFile = new File(['%PDF-1.4 test content'], 'financial-report.pdf', {
      type: 'application/pdf',
    })
    render(<ExpandedEditorModal {...defaultProps} selectedFile={mockFile} />)

    const pill = screen.getByTestId('modal-attachment-pill')
    expect(pill).toBeInTheDocument()
    expect(pill).toHaveAttribute(
      'aria-label',
      `Tệp đính kèm: financial-report.pdf, kích thước: ${mockFile.size} B`
    )
    expect(pill).toHaveAttribute('title', `financial-report.pdf (${mockFile.size} B)`)

    const badge = screen.getByTestId('modal-attachment-type-badge')
    expect(badge.className).toContain('bg-rose-500/15')
    expect(badge.className).toContain('text-rose-600')

    expect(screen.getByText('financial-report.pdf')).toBeInTheDocument()
    const sizeSpan = screen.getByText(`${mockFile.size} B`)
    expect(sizeSpan).toHaveClass('font-mono')
  })

  it('23. should display TXT-specific styling, accessible name, and rich metadata title for TXT attachments', () => {
    const mockFile = new File(['plaintext content'], 'meeting-notes.txt', {
      type: 'text/plain',
    })
    render(<ExpandedEditorModal {...defaultProps} selectedFile={mockFile} />)

    const pill = screen.getByTestId('modal-attachment-pill')
    expect(pill).toBeInTheDocument()
    expect(pill).toHaveAttribute(
      'aria-label',
      `Tệp đính kèm: meeting-notes.txt, kích thước: ${mockFile.size} B`
    )
    expect(pill).toHaveAttribute('title', `meeting-notes.txt (${mockFile.size} B)`)

    const badge = screen.getByTestId('modal-attachment-type-badge')
    expect(badge.className).toContain('bg-sky-500/15')
    expect(badge.className).toContain('text-sky-600')

    expect(screen.getByText('meeting-notes.txt')).toBeInTheDocument()
    const sizeSpan = screen.getByText(`${mockFile.size} B`)
    expect(sizeSpan).toHaveClass('font-mono')
  })

  describe('Focus Management & Restoration', () => {
    function FocusTestHarness({
      initialOpen = false,
      removeOpenerOnClose = false,
    }: {
      initialOpen?: boolean
      removeOpenerOnClose?: boolean
    }) {
      const [isOpen, setIsOpen] = useState(initialOpen)
      const [openerMounted, setOpenerMounted] = useState(true)

      const handleClose = () => {
        if (removeOpenerOnClose) {
          setOpenerMounted(false)
        }
        setIsOpen(false)
      }

      return (
        <div>
          {openerMounted && (
            <button
              type="button"
              data-testid="test-opener-btn"
              onClick={() => setIsOpen(true)}
            >
              Mở editor
            </button>
          )}
          <ExpandedEditorModal
            {...defaultProps}
            isOpen={isOpen}
            onClose={handleClose}
          />
        </div>
      )
    }

    it('24. moves focus into textarea when modal opens', async () => {
      vi.useFakeTimers()
      const { unmount } = render(<FocusTestHarness initialOpen={false} />)

      const openerBtn = screen.getByTestId('test-opener-btn')
      openerBtn.focus()
      expect(document.activeElement).toBe(openerBtn)

      fireEvent.click(openerBtn)

      // Fast-forward past 50ms textarea focus timer
      act(() => {
        vi.advanceTimersByTime(100)
      })

      const textarea = screen.getByPlaceholderText('Nhập nội dung tin nhắn chi tiết, đoạn mã, hoặc tài liệu...')
      expect(document.activeElement).toBe(textarea)

      vi.useRealTimers()
      unmount()
    })

    it('25. restores focus to opener element when closed via Escape', async () => {
      vi.useFakeTimers()
      const { unmount } = render(<FocusTestHarness initialOpen={false} />)

      const openerBtn = screen.getByTestId('test-opener-btn')
      openerBtn.focus()
      expect(document.activeElement).toBe(openerBtn)

      fireEvent.click(openerBtn)

      act(() => {
        vi.advanceTimersByTime(100)
      })

      const textarea = screen.getByPlaceholderText('Nhập nội dung tin nhắn chi tiết, đoạn mã, hoặc tài liệu...')
      expect(document.activeElement).toBe(textarea)

      // Press Escape on window
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      })

      expect(document.activeElement).toBe(openerBtn)

      vi.useRealTimers()
      unmount()
    })

    it('26. restores focus to opener element when closed via Hủy button', async () => {
      vi.useFakeTimers()
      const { unmount } = render(<FocusTestHarness initialOpen={false} />)

      const openerBtn = screen.getByTestId('test-opener-btn')
      openerBtn.focus()
      expect(document.activeElement).toBe(openerBtn)

      fireEvent.click(openerBtn)

      act(() => {
        vi.advanceTimersByTime(100)
      })

      const cancelBtn = screen.getByRole('button', { name: 'Hủy' })
      act(() => {
        fireEvent.click(cancelBtn)
      })

      expect(document.activeElement).toBe(openerBtn)

      vi.useRealTimers()
      unmount()
    })

    it('27. restores focus to opener element when closed via X (Đóng) button', async () => {
      vi.useFakeTimers()
      const { unmount } = render(<FocusTestHarness initialOpen={false} />)

      const openerBtn = screen.getByTestId('test-opener-btn')
      openerBtn.focus()
      expect(document.activeElement).toBe(openerBtn)

      fireEvent.click(openerBtn)

      act(() => {
        vi.advanceTimersByTime(100)
      })

      const closeBtn = screen.getByRole('button', { name: /Đóng trình soạn thảo/i })
      act(() => {
        fireEvent.click(closeBtn)
      })

      expect(document.activeElement).toBe(openerBtn)

      vi.useRealTimers()
      unmount()
    })

    it('28. does not throw or fail when opener is unmounted or removed from DOM before close', async () => {
      vi.useFakeTimers()
      const { unmount } = render(<FocusTestHarness initialOpen={false} removeOpenerOnClose={true} />)

      const openerBtn = screen.getByTestId('test-opener-btn')
      openerBtn.focus()
      expect(document.activeElement).toBe(openerBtn)

      fireEvent.click(openerBtn)

      act(() => {
        vi.advanceTimersByTime(100)
      })

      const cancelBtn = screen.getByRole('button', { name: 'Hủy' })
      expect(() => {
        act(() => {
          fireEvent.click(cancelBtn)
        })
      }).not.toThrow()

      expect(screen.queryByTestId('test-opener-btn')).not.toBeInTheDocument()

      vi.useRealTimers()
      unmount()
    })
    it('29. close button in header has visible focus-visible indicator', () => {
      render(<ExpandedEditorModal {...defaultProps} />)
      const closeBtn = screen.getByRole('button', { name: /Đóng trình soạn thảo/i })

      expect(closeBtn.className).toContain('focus-visible:ring-2')
      expect(closeBtn.className).toContain('focus-visible:ring-amber-500/60')
      expect(closeBtn.className).toContain('focus-visible:outline-none')
    })

    it('30. wraps focus from last focusable element to first focusable element on Tab', () => {
      render(<ExpandedEditorModal {...defaultProps} content="Sample content" />)

      const sendBtn = screen.getByRole('button', { name: /Gửi/i })
      const editTab = screen.getByRole('tab', { name: /Soạn thảo/i })

      sendBtn.focus()
      expect(document.activeElement).toBe(sendBtn)

      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      })
      window.dispatchEvent(tabEvent)

      expect(document.activeElement).toBe(editTab)
      expect(tabEvent.defaultPrevented).toBe(true)
    })

    it('31. wraps focus from first focusable element to last focusable element on Shift+Tab', () => {
      render(<ExpandedEditorModal {...defaultProps} content="Sample content" />)

      const sendBtn = screen.getByRole('button', { name: /Gửi/i })
      const editTab = screen.getByRole('tab', { name: /Soạn thảo/i })

      editTab.focus()
      expect(document.activeElement).toBe(editTab)

      const shiftTabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      })
      window.dispatchEvent(shiftTabEvent)

      expect(document.activeElement).toBe(sendBtn)
      expect(shiftTabEvent.defaultPrevented).toBe(true)
    })

    it('32. wraps focus in preview mode between active preview tab and send button', async () => {
      const user = userEvent.setup()
      render(<ExpandedEditorModal {...defaultProps} content="Markdown content" />)

      const previewTab = screen.getByRole('tab', { name: /Xem trước/i })
      await user.click(previewTab)
      expect(previewTab).toHaveAttribute('aria-selected', 'true')

      const sendBtn = screen.getByRole('button', { name: /Gửi/i })
      sendBtn.focus()
      expect(document.activeElement).toBe(sendBtn)

      // Tab on last element wraps to preview tab (since edit tab has tabIndex -1)
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      })
      window.dispatchEvent(tabEvent)

      expect(document.activeElement).toBe(previewTab)
      expect(tabEvent.defaultPrevented).toBe(true)

      // Shift+Tab on preview tab wraps to send button
      const shiftTabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      })
      window.dispatchEvent(shiftTabEvent)

      expect(document.activeElement).toBe(sendBtn)
      expect(shiftTabEvent.defaultPrevented).toBe(true)
    })

    it('33. pulls focus into modal when Tab or Shift+Tab is pressed with focus outside', () => {
      render(<ExpandedEditorModal {...defaultProps} content="Sample content" />)

      const editTab = screen.getByRole('tab', { name: /Soạn thảo/i })
      const sendBtn = screen.getByRole('button', { name: /Gửi/i })

      // Focus body (outside dialog)
      document.body.focus()
      expect(document.activeElement).toBe(document.body)

      // Forward Tab pulls to first focusable element
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      })
      window.dispatchEvent(tabEvent)

      expect(document.activeElement).toBe(editTab)
      expect(tabEvent.defaultPrevented).toBe(true)

      // Focus body again
      document.body.focus()

      // Backward Tab pulls to last focusable element
      const shiftTabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      })
      window.dispatchEvent(shiftTabEvent)

      expect(document.activeElement).toBe(sendBtn)
      expect(shiftTabEvent.defaultPrevented).toBe(true)
    })

    it('34. wraps to Hủy button when Send button is disabled', () => {
      // Empty content means Send button is disabled
      render(<ExpandedEditorModal {...defaultProps} content="" />)

      const editTab = screen.getByRole('tab', { name: /Soạn thảo/i })
      const cancelBtn = screen.getByRole('button', { name: 'Hủy' })
      const sendBtn = screen.getByRole('button', { name: /Gửi/i })

      expect(sendBtn).toBeDisabled()

      cancelBtn.focus()
      expect(document.activeElement).toBe(cancelBtn)

      // Tab on cancel button wraps to edit tab (since send is disabled)
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      })
      window.dispatchEvent(tabEvent)

      expect(document.activeElement).toBe(editTab)
      expect(tabEvent.defaultPrevented).toBe(true)

      // Shift+Tab on edit tab wraps to cancel button
      const shiftTabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      })
      window.dispatchEvent(shiftTabEvent)

      expect(document.activeElement).toBe(cancelBtn)
      expect(shiftTabEvent.defaultPrevented).toBe(true)
    })

    it('35. does not trap focus when modal is closed', () => {
      render(<ExpandedEditorModal {...defaultProps} isOpen={false} />)

      const externalButton = document.createElement('button')
      document.body.appendChild(externalButton)
      externalButton.focus()
      expect(document.activeElement).toBe(externalButton)

      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      })
      window.dispatchEvent(tabEvent)

      expect(tabEvent.defaultPrevented).toBe(false)
      expect(document.activeElement).toBe(externalButton)

      document.body.removeChild(externalButton)
    })

  })
});
