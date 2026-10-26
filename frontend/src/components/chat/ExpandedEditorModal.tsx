import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useThemeStore } from '../../stores/themeStore'

const PreContext = createContext(false)

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface PreviewCodeBlockProps {
  language?: string
  content: string
}

function PreviewCodeBlock({ language, content }: PreviewCodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const theme = useThemeStore((state) => state.theme)
  const isDark = theme === 'dark'

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      console.error('Không thể sao chép mã:', err)
    }
  }

  const displayLang = language ? language.toLowerCase() : 'code'

  return (
    <div
      data-testid="preview-code-block"
      className="relative my-3 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-xs bg-[#fafafa] dark:bg-[#282c34]"
    >
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-100/90 dark:bg-[#21252b] border-b border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-gray-300 select-none">
        <span
          data-testid="preview-code-language-badge"
          className="font-mono font-medium text-[11px] tracking-wide text-slate-600 dark:text-gray-300"
        >
          {displayLang}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          title="Sao chép mã"
          className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-lg text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/10 transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-[#1B8F3D]/50 focus-visible:outline-none"
        >
          {copied ? 'Đã chép' : 'Sao chép'}
        </button>
      </div>

      <div className="overflow-x-auto text-[13px]">
        <SyntaxHighlighter
          style={isDark ? oneDark : oneLight}
          language={language || 'text'}
          PreTag="div"
          customStyle={{
            margin: 0,
            padding: '0.875rem 1rem',
            background: 'transparent',
            fontSize: '0.8125rem',
            lineHeight: 1.6,
          }}
        >
          {content}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}

function PreviewCode({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<'code'>) {
  const isBlock = useContext(PreContext)
  const match = /language-(\w+)/.exec(className || '')

  if (isBlock || match) {
    const contentStr = String(children).replace(/\n$/, '')
    return (
      <PreviewCodeBlock
        language={match ? match[1] : undefined}
        content={contentStr}
      />
    )
  }

  return (
    <code
      className="rounded-md bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 text-xs font-mono font-medium text-emerald-700 dark:text-emerald-300 border border-slate-200/80 dark:border-white/10 break-words"
      {...props}
    >
      {children}
    </code>
  )
}

interface ExpandedEditorModalProps {
  isOpen: boolean
  content: string
  onChange: (value: string) => void
  onClose: (currentValue?: string) => void
  onSend: () => void
  onStop?: () => void
  isActive?: boolean
  isDisabled?: boolean
  error?: string | null
  modelName?: string
  selectedFile?: File | null
}

export function ExpandedEditorModal({
  isOpen,
  content,
  onChange,
  onClose,
  onSend,
  onStop,
  isActive = false,
  isDisabled = false,
  error,
  modelName,
  selectedFile,
}: ExpandedEditorModalProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)
  if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen)
    if (isOpen) {
      setActiveTab('edit')
    }
  }

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const editTabRef = useRef<HTMLButtonElement | null>(null)
  const previewTabRef = useRef<HTMLButtonElement | null>(null)

  // Focus textarea when modal opens and move cursor to end of text
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        const textarea = textareaRef.current
        if (textarea) {
          textarea.focus()
          textarea.selectionStart = textarea.selectionEnd = textarea.value.length
        }
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Listen for Escape key on window to close and Ctrl/Cmd+Enter to send across both tabs
  useEffect(() => {
    if (!isOpen) return

    const handleWindowKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose(content)
      } else if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        // If focus is in textarea, handleKeyDown handles it
        if (event.target === textareaRef.current) {
          return
        }
        event.preventDefault()
        if (!isActive && !isDisabled && content.trim()) {
          onSend()
        }
      }
    }

    window.addEventListener('keydown', handleWindowKeyDown)
    return () => window.removeEventListener('keydown', handleWindowKeyDown)
  }, [isOpen, onClose, onSend, isActive, isDisabled, content])

  if (!isOpen) return null

  // Calculate character, word, and line count
  const charCount = content.length
  const trimmed = content.trim()
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0
  const lineCount = content ? content.split('\n').length : 1

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl + Enter or Cmd + Enter -> Submit
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault()
      event.stopPropagation()
      if (!isActive && !isDisabled && trimmed) {
        onSend()
      }
      return
    }

    // Tab key -> Insert 4 spaces indent ONLY when Shift is not pressed
    if (event.key === 'Tab') {
      if (event.shiftKey) {
        // Allow default browser behavior to move focus backwards without trapping
        return
      }
      event.preventDefault()
      const target = event.currentTarget
      const start = target.selectionStart
      const end = target.selectionEnd

      if (typeof target.setRangeText === 'function') {
        target.setRangeText('    ', start, end, 'end')
        onChange(target.value)
      } else {
        const newContent = content.substring(0, start) + '    ' + content.substring(end)
        target.value = newContent
        target.selectionStart = target.selectionEnd = start + 4
        onChange(newContent)
      }
    }
  }

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveTab('preview')
      previewTabRef.current?.focus()
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveTab('edit')
      editTabRef.current?.focus()
    } else if (event.key === 'Home') {
      event.preventDefault()
      setActiveTab('edit')
      editTabRef.current?.focus()
    } else if (event.key === 'End') {
      event.preventDefault()
      setActiveTab('preview')
      previewTabRef.current?.focus()
    }
  }

  const handleSwitchTab = (tab: 'edit' | 'preview') => {
    setActiveTab(tab)
    if (tab === 'edit') {
      requestAnimationFrame(() => {
        textareaRef.current?.focus()
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      {/* Dark translucent backdrop with blur - Click outside does not dismiss modal */}
      <div
        data-testid="expanded-editor-backdrop"
        className="fixed inset-0 bg-black/80 backdrop-blur-md animate-modal-fade"
        aria-hidden="true"
      />

      {/* Expanded Editor Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Soạn tin nhắn"
        className="relative z-10 flex flex-col w-full max-w-4xl h-[80vh] sm:h-[85vh] rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-white/10 bg-white/98 dark:bg-[#131924]/95 shadow-2xl backdrop-blur-2xl animate-modal-enter overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Segmented Control Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-white/[0.08] px-4 py-2.5 sm:px-6 sm:py-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-semibold text-slate-900 dark:text-white tracking-wide truncate">
              Soạn tin nhắn
            </span>
            {modelName && (
              <span className="hidden sm:inline-block rounded-md border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.05] px-2 py-0.5 text-[11px] text-slate-600 dark:text-gray-400 truncate max-w-[140px]">
                {modelName}
              </span>
            )}
          </div>

          {/* Segmented Control Tabs (WAI-ARIA Tablist Pattern) */}
          <div
            role="tablist"
            aria-label="Chế độ soạn thảo"
            className="flex items-center rounded-xl bg-slate-100 dark:bg-white/[0.06] p-0.5 border border-slate-200/80 dark:border-white/10"
          >
            <button
              ref={editTabRef}
              id="tab-edit"
              role="tab"
              type="button"
              aria-selected={activeTab === 'edit'}
              aria-controls="panel-edit"
              tabIndex={activeTab === 'edit' ? 0 : -1}
              onClick={() => handleSwitchTab('edit')}
              onKeyDown={handleTabKeyDown}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg transition-all cursor-pointer font-medium focus-visible:ring-2 focus-visible:ring-[#1B8F3D]/50 focus-visible:outline-none ${
                activeTab === 'edit'
                  ? 'bg-white dark:bg-[#1A2436] text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Soạn thảo</span>
            </button>

            <button
              ref={previewTabRef}
              id="tab-preview"
              role="tab"
              type="button"
              aria-selected={activeTab === 'preview'}
              aria-controls="panel-preview"
              tabIndex={activeTab === 'preview' ? 0 : -1}
              onClick={() => handleSwitchTab('preview')}
              onKeyDown={handleTabKeyDown}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg transition-all cursor-pointer font-medium focus-visible:ring-2 focus-visible:ring-[#1B8F3D]/50 focus-visible:outline-none ${
                activeTab === 'preview'
                  ? 'bg-white dark:bg-[#1A2436] text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>Xem trước</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => onClose(content)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10 transition cursor-pointer"
            aria-label="Đóng trình soạn thảo"
            title="Đóng (Esc)"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error message if send fails */}
        {error && (
          <div className="mx-4 mt-3 rounded-xl border border-[#B91E2B]/30 bg-[#B91E2B]/10 px-3.5 py-2 text-xs text-[#B91E2B] sm:mx-6">
            {error}
          </div>
        )}

        {/* Attached file pill (read-only informational pill) */}
        {selectedFile && (
          <div className="flex items-center gap-2 px-4 py-2 sm:px-6 border-b border-slate-100 dark:border-white/[0.04] bg-slate-50/50 dark:bg-white/[0.02]">
            <div
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 dark:border-white/10 bg-slate-100/90 dark:bg-white/[0.06] px-2.5 py-1 text-xs text-slate-700 dark:text-gray-200 shadow-2xs max-w-full"
              title={selectedFile.name}
              data-testid="modal-attachment-pill"
            >
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[11px] select-none"
                aria-hidden="true"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>

              <span className="truncate max-w-[200px] sm:max-w-md font-medium">
                {selectedFile.name}
              </span>

              <span className="text-[10px] text-slate-400 dark:text-gray-400 shrink-0 select-none">
                {formatFileSize(selectedFile.size)}
              </span>
            </div>
          </div>
        )}

        {/* Tab 1: Editor Textarea Area */}
        {activeTab === 'edit' && (
          <div
            id="panel-edit"
            role="tabpanel"
            aria-labelledby="tab-edit"
            className="flex-1 min-h-0 p-3 sm:p-5 flex flex-col"
          >
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập nội dung tin nhắn chi tiết, đoạn mã, hoặc tài liệu..."
              aria-label="Nội dung tin nhắn mở rộng"
              className="h-full w-full resize-none bg-transparent text-xs sm:text-sm text-slate-800 dark:text-gray-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 outline-none scrollbar-thin font-sans leading-relaxed"
            />
          </div>
        )}

        {/* Tab 2: Markdown Preview Area */}
        {activeTab === 'preview' && (
          <div
            id="panel-preview"
            role="tabpanel"
            aria-labelledby="tab-preview"
            tabIndex={0}
            className="flex-1 min-h-0 p-4 sm:p-6 overflow-y-auto scrollbar-thin text-xs sm:text-sm text-slate-800 dark:text-gray-100 leading-relaxed outline-none focus-visible:ring-1 focus-visible:ring-[#1B8F3D]/30"
            data-testid="markdown-preview-panel"
          >
            {content.trim() ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  img({ src, alt }) {
                    if (typeof src !== 'string') return null
                    if (!src.startsWith('https://') && !src.startsWith('http://') && !src.startsWith('/')) {
                      return null
                    }
                    return (
                      <span className="my-2.5 block">
                        <img
                          src={src}
                          alt={alt && alt.trim() !== '' ? alt : 'Hình ảnh xem trước'}
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          className="max-h-96 max-w-full rounded-xl border border-slate-200 object-contain shadow-xs dark:border-white/10"
                        />
                      </span>
                    )
                  },
                  a({ children, href, ...props }) {
                    const isSafeUrl = typeof href === 'string' && (
                      href.startsWith('http://') ||
                      href.startsWith('https://') ||
                      href.startsWith('mailto:') ||
                      href.startsWith('#') ||
                      href.startsWith('/')
                    )

                    if (!isSafeUrl) {
                      return (
                        <span
                          data-testid="unsafe-link-neutralized"
                          className="text-slate-400 dark:text-gray-500 underline underline-offset-2 cursor-not-allowed"
                          title="Liên kết không an toàn bị vô hiệu hóa"
                        >
                          {children}
                        </span>
                      )
                    }

                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#1B8F3D] dark:text-emerald-400 underline underline-offset-2 hover:opacity-85 font-medium break-all"
                        {...props}
                      >
                        {children}
                      </a>
                    )
                  },
                  p({ children, ...props }) {
                    return (
                      <p className="mb-2.5 last:mb-0 leading-relaxed text-xs sm:text-sm text-slate-700 dark:text-gray-200 break-words" {...props}>
                        {children}
                      </p>
                    )
                  },
                  ul({ children, ...props }) {
                    return (
                      <ul className="my-2 ml-5 list-disc space-y-1 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-gray-200" {...props}>
                        {children}
                      </ul>
                    )
                  },
                  ol({ children, ...props }) {
                    return (
                      <ol className="my-2 ml-5 list-decimal space-y-1 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-gray-200" {...props}>
                        {children}
                      </ol>
                    )
                  },
                  li({ children, ...props }) {
                    return (
                      <li className="pl-0.5 leading-relaxed" {...props}>
                        {children}
                      </li>
                    )
                  },
                  h1({ children, ...props }) {
                    return (
                      <h1 className="text-xl sm:text-2xl font-bold mt-4 mb-2 tracking-tight leading-snug text-slate-900 dark:text-white border-b border-slate-200/60 dark:border-white/[0.08] pb-1" {...props}>
                        {children}
                      </h1>
                    )
                  },
                  h2({ children, ...props }) {
                    return (
                      <h2 className="text-lg sm:text-xl font-bold mt-3.5 mb-1.5 tracking-tight leading-snug text-slate-900 dark:text-white border-b border-slate-200/40 dark:border-white/[0.05] pb-0.5" {...props}>
                        {children}
                      </h2>
                    )
                  },
                  h3({ children, ...props }) {
                    return (
                      <h3 className="text-base sm:text-lg font-semibold mt-3 mb-1 tracking-tight leading-snug text-slate-800 dark:text-gray-100" {...props}>
                        {children}
                      </h3>
                    )
                  },
                  h4({ children, ...props }) {
                    return (
                      <h4 className="text-sm sm:text-base font-semibold mt-2.5 mb-1 tracking-tight leading-snug text-slate-800 dark:text-gray-200" {...props}>
                        {children}
                      </h4>
                    )
                  },
                  blockquote({ children, ...props }) {
                    return (
                      <blockquote className="my-2.5 border-l-3 border-[#1B8F3D]/60 dark:border-emerald-500/60 pl-3.5 italic text-slate-600 dark:text-gray-400 bg-slate-50/50 dark:bg-white/[0.02] py-1 rounded-r-lg" {...props}>
                        {children}
                      </blockquote>
                    )
                  },
                  hr({ ...props }) {
                    return <hr className="my-4 border-slate-200 dark:border-white/10" {...props} />
                  },
                  table({ children, ...props }) {
                    return (
                      <div
                        data-testid="preview-table-container"
                        className="my-3.5 w-full max-w-full overflow-x-auto rounded-xl border border-slate-200/90 dark:border-white/10 shadow-2xs"
                      >
                        <table className="w-full min-w-full border-collapse text-left text-xs sm:text-sm" {...props}>
                          {children}
                        </table>
                      </div>
                    )
                  },
                  thead({ children, ...props }) {
                    return (
                      <thead className="bg-slate-50 dark:bg-white/[0.04] border-b border-slate-200/90 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-gray-200 uppercase tracking-wider" {...props}>
                        {children}
                      </thead>
                    )
                  },
                  tbody({ children, ...props }) {
                    return (
                      <tbody className="divide-y divide-slate-200/70 dark:divide-white/[0.06] bg-white/40 dark:bg-transparent" {...props}>
                        {children}
                      </tbody>
                    )
                  },
                  tr({ children, ...props }) {
                    return (
                      <tr className="transition-colors hover:bg-slate-50/70 dark:hover:bg-white/[0.02]" {...props}>
                        {children}
                      </tr>
                    )
                  },
                  th({ children, ...props }) {
                    return (
                      <th className="px-3.5 py-2 text-xs font-semibold tracking-wider text-slate-700 dark:text-gray-200" {...props}>
                        {children}
                      </th>
                    )
                  },
                  td({ children, ...props }) {
                    return (
                      <td className="px-3.5 py-2 text-xs sm:text-sm text-slate-700 dark:text-gray-300 align-middle leading-relaxed" {...props}>
                        {children}
                      </td>
                    )
                  },
                  pre({ children }) {
                    return <PreContext.Provider value={true}>{children}</PreContext.Provider>
                  },
                  code: PreviewCode,
                }}
              >
                {content}
              </ReactMarkdown>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-12 text-slate-400 dark:text-gray-500 select-none">
                <svg className="w-10 h-10 mb-2 stroke-current opacity-60" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <p className="text-xs font-medium">Chưa có nội dung để xem trước</p>
                <p className="text-[11px] mt-0.5 text-slate-400 dark:text-gray-500">Chuyển sang tab "Soạn thảo" để nhập nội dung Markdown</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0e141f]/60 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5 text-[11px] text-slate-500 dark:text-gray-400">
            <span>{charCount.toLocaleString()} ký tự</span>
            <span>•</span>
            <span>{wordCount.toLocaleString()} từ</span>
            <span>•</span>
            <span>{lineCount.toLocaleString()} dòng</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-[11px] text-slate-500 dark:text-gray-400 sm:inline">
              Ctrl + Enter để gửi
            </span>

            <button
              type="button"
              onClick={() => onClose(content)}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/10 rounded-xl transition cursor-pointer focus-visible:ring-2 focus-visible:ring-[#1B8F3D]/50 focus-visible:outline-none"
            >
              Hủy
            </button>

            <button
              type="button"
              onClick={isActive ? onStop : onSend}
              disabled={!isActive && (isDisabled || !trimmed)}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-md transition-all duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 active:scale-95 focus-visible:ring-2 focus-visible:outline-none ${
                isActive
                  ? 'bg-[#B91E2B] hover:bg-[#9E1924] shadow-[#B91E2B]/30 focus-visible:ring-[#B91E2B]/50'
                  : 'bg-[#1B8F3D] hover:bg-[#167632] hover:scale-105 shadow-[#1B8F3D]/30 focus-visible:ring-[#1B8F3D]/50'
              }`}
            >
              {isActive ? (
                <>
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="5" y="5" width="14" height="14" rx="2" />
                  </svg>
                  <span>Dừng</span>
                </>
              ) : (
                <>
                  <span>Gửi</span>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExpandedEditorModal
