import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
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
})
