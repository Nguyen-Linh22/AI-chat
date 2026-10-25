import React, { createContext, useContext, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import type { Attachment } from '../services/messageService'
import { useThemeStore } from '../stores/themeStore'

interface MessageBubbleProps {
  role: 'user' | 'ai'
  content: string
  isStreaming?: boolean
  attachments?: Attachment[]
  onRegenerate?: () => void
}

const PreContext = createContext(false)

interface CodeBlockProps {
  language?: string
  content: string
  hasCursor?: boolean
}

function CodeBlock({ language, content, hasCursor }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const theme = useThemeStore((state) => state.theme)
  const isDark = theme === 'dark'

  const handleCopy = async () => {
    try {
      const cleanContent = content.replace(/\s?▌/g, '')
      await navigator.clipboard.writeText(cleanContent)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
      }, 1500)
    } catch (error) {
      console.error('Không thể copy code:', error)
    }
  }

  const displayLang = language ? language.toLowerCase() : 'Code'

  return (
    <div
      data-testid="code-block"
      data-theme={theme}
      className="relative my-3 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-xs bg-[#fafafa] dark:bg-[#282c34]"
    >
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-100/90 dark:bg-[#21252b] border-b border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-gray-300 select-none">
        <span
          data-testid="code-language-badge"
          className="font-mono font-medium text-[11px] tracking-wide text-slate-600 dark:text-gray-300"
        >
          {displayLang}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          title="Sao chép mã"
          className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/10 transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-[#1B8F3D]/50 focus-visible:outline-none"
        >
          {copied ? (
            <>
              <svg className="h-3.5 w-3.5 text-[#1B8F3D] dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-[#1B8F3D] dark:text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
        <span className="sr-only" aria-live="polite">
          {copied ? 'Đã sao chép mã vào khay nhớ tạm' : ''}
        </span>
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

      {hasCursor && (
        <span className="ai-cursor absolute bottom-2 right-3 text-[#1B8F3D] select-none text-sm">
          ▌
        </span>
      )}
    </div>
  )
}

/**
 * Đệ quy thay thế ký tự '▌' bằng component con trỏ nhấp nháy <span className="ai-cursor">
 * Giữ nguyên cấu trúc AST Markdown, không làm vỡ styling in đậm, nghiêng, code inline...
 */
function renderChildrenWithCursor(children: React.ReactNode): React.ReactNode {
  if (typeof children === 'string') {
    if (!children.includes('▌')) return children

    const parts = children.split('▌')
    return (
      <>
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            {part}
            {index < parts.length - 1 && (
              <span
                className="ai-cursor inline-block ml-0.5 text-[#1B8F3D] select-none align-baseline"
                aria-hidden="true"
              >
                ▌
              </span>
            )}
          </React.Fragment>
        ))}
      </>
    )
  }

  if (Array.isArray(children)) {
    return children.map((child, index) => (
      <React.Fragment key={index}>
        {renderChildrenWithCursor(child)}
      </React.Fragment>
    ))
  }

  if (React.isValidElement(children)) {
    const element = children as React.ReactElement<{ children?: React.ReactNode }>
    if (element.props && element.props.children) {
      return React.cloneElement(
        element,
        undefined,
        renderChildrenWithCursor(element.props.children)
      )
    }
  }

  return children
}

function MarkdownCode({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<'code'>) {
  const isBlock = useContext(PreContext)
  const match = /language-(\w+)/.exec(className || '')

  if (isBlock || match) {
    const contentStr = String(children).replace(/\n$/, '')
    const hasCursor = contentStr.includes('▌')
    const cleanContent = contentStr.replace(/\s?▌/g, '')

    return (
      <CodeBlock
        language={match ? match[1] : undefined}
        content={cleanContent}
        hasCursor={hasCursor}
      />
    )
  }

  return (
    <code
      className="rounded-md bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 text-xs font-mono font-medium text-emerald-700 dark:text-emerald-300 border border-slate-200/80 dark:border-white/10 break-words"
      {...props}
    >
      {renderChildrenWithCursor(children)}
    </code>
  )
}

function MessageBubble({
  role,
  content,
  attachments = [],
  isStreaming = false,
  onRegenerate,
}: MessageBubbleProps) {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = async () => {
    try {
      const cleanContent = content.replace(/\s?▌/g, '')
      await navigator.clipboard.writeText(cleanContent)

      setIsCopied(true)

      setTimeout(() => {
        setIsCopied(false)
      }, 1500)
    } catch (error) {
      console.error('Không thể copy message:', error)
    }
  }

  const isUser = role === 'user'

  return (
    <div
      className={`chat-message-enter group flex w-full ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`rounded-2xl px-4 py-3 shadow-xs transition-colors duration-150 ${
          isUser
            ? 'max-w-[85%] sm:max-w-[75%] rounded-br-sm bg-slate-900 dark:bg-[#1A2436] border border-slate-800 dark:border-white/10 text-white shadow-xs'
            : 'w-full rounded-bl-sm bg-white dark:bg-[#121824]/90 border border-slate-200/90 dark:border-white/[0.08] text-slate-800 dark:text-gray-100 shadow-xs'
        }`}
      >
        {!isUser ? (
          <div className="mb-2.5 pb-2 flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div
                data-testid="ai-avatar"
                aria-label="AI Avatar"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-[#1B8F3D] dark:text-emerald-400 border border-emerald-500/20 shadow-2xs select-none"
              >
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-gray-300">AI</span>
            </div>
            {isStreaming && (
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#1B8F3D] dark:text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1B8F3D] opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#1B8F3D]"></span>
                </span>
                <span>AI đang trả lời...</span>
              </span>
            )}
          </div>
        ) : (
          <div className="mb-2.5 pb-2 flex items-center justify-end gap-2 border-b border-white/10">
            <span className="text-xs font-semibold text-slate-200">Bạn</span>
            <div
              data-testid="user-avatar"
              aria-label="User Avatar"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/90 border border-white/15 shadow-2xs select-none"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        )}

        {attachments.length > 0 && (
          <div className="mb-3 flex flex-col gap-2">
            {attachments.map((attachment) => (
              <a
                key={attachment.id}
                href={attachment.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-800 dark:text-gray-200 px-3 py-2 text-xs font-medium hover:bg-slate-200 dark:hover:bg-white/10 transition border border-slate-200/80 dark:border-white/10"
              >
                <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>

                <span className="min-w-0 truncate">
                  {attachment.fileName}
                </span>
              </a>
            ))}
          </div>
        )}

        <div className={`text-sm leading-6 ${isStreaming ? 'ai-typewriter-container' : ''}`}>
          {isStreaming && !content && (
            <span className="ai-cursor text-sm text-[#1B8F3D] select-none">
              ▌
            </span>
          )}

          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              img({ src, alt }) {
                if (typeof src !== 'string') {
                  return null
                }

                if (!src.startsWith('https://') && !src.startsWith('http://')) {
                  return null
                }

                return (
                  <span className="my-2.5 block">
                    <img
                      src={src}
                      alt={alt && alt.trim() !== '' ? alt : 'Hình ảnh tài liệu'}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="max-h-96 max-w-full rounded-xl border border-slate-200 object-contain shadow-xs dark:border-gray-800"
                    />
                  </span>
                )
              },
              a({ children, href, ...props }) {
                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 dark:text-emerald-400 underline underline-offset-2 hover:opacity-85"
                    {...props}
                  >
                    {renderChildrenWithCursor(children)}
                  </a>
                )
              },
              p({ children, ...props }) {
                return (
                  <p className="mb-2.5 last:mb-0 leading-relaxed text-sm" {...props}>
                    {renderChildrenWithCursor(children)}
                  </p>
                )
              },
              ul({ children, ...props }) {
                return (
                  <ul className="my-2 ml-5 list-disc space-y-1 text-sm leading-relaxed" {...props}>
                    {renderChildrenWithCursor(children)}
                  </ul>
                )
              },
              ol({ children, ...props }) {
                return (
                  <ol className="my-2 ml-5 list-decimal space-y-1 text-sm leading-relaxed" {...props}>
                    {renderChildrenWithCursor(children)}
                  </ol>
                )
              },
              li({ children, ...props }) {
                return (
                  <li className="pl-0.5 leading-relaxed" {...props}>
                    {renderChildrenWithCursor(children)}
                  </li>
                )
              },
              h1({ children, ...props }) {
                return (
                  <h1 className="text-xl sm:text-2xl font-bold mt-4 mb-2 tracking-tight leading-snug" {...props}>
                    {renderChildrenWithCursor(children)}
                  </h1>
                )
              },
              h2({ children, ...props }) {
                return (
                  <h2 className="text-lg sm:text-xl font-bold mt-3.5 mb-1.5 tracking-tight leading-snug" {...props}>
                    {renderChildrenWithCursor(children)}
                  </h2>
                )
              },
              h3({ children, ...props }) {
                return (
                  <h3 className="text-base sm:text-lg font-semibold mt-3 mb-1 tracking-tight leading-snug" {...props}>
                    {renderChildrenWithCursor(children)}
                  </h3>
                )
              },
              h4({ children, ...props }) {
                return (
                  <h4 className="text-sm sm:text-base font-semibold mt-2.5 mb-1 tracking-tight leading-snug" {...props}>
                    {renderChildrenWithCursor(children)}
                  </h4>
                )
              },
              blockquote({ children, ...props }) {
                return (
                  <blockquote className="my-2.5 border-l-3 border-[#1B8F3D]/60 dark:border-emerald-500/60 pl-3.5 italic text-slate-600 dark:text-gray-400 bg-slate-50/50 dark:bg-white/[0.02] py-1 rounded-r-lg" {...props}>
                    {renderChildrenWithCursor(children)}
                  </blockquote>
                )
              },
              table({ children, ...props }) {
                return (
                  <div
                    data-testid="table-container"
                    className="my-3.5 w-full max-w-full overflow-x-auto rounded-xl border border-slate-200/90 dark:border-white/10 shadow-2xs"
                  >
                    <table className="w-full min-w-full border-collapse text-left text-sm" {...props}>
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
                  <th className="px-3.5 py-2.5 text-xs font-semibold tracking-wider text-slate-700 dark:text-gray-200" {...props}>
                    {renderChildrenWithCursor(children)}
                  </th>
                )
              },
              td({ children, ...props }) {
                return (
                  <td className="px-3.5 py-2.5 text-sm text-slate-700 dark:text-gray-300 align-middle leading-relaxed" {...props}>
                    {renderChildrenWithCursor(children)}
                  </td>
                )
              },
              pre({ children }) {
                return <PreContext.Provider value={true}>{children}</PreContext.Provider>
              },
              code: MarkdownCode,
            }}
          >
            {isStreaming && content ? content + ' ▌' : content}
          </ReactMarkdown>
        </div>

        {!isUser && !isStreaming && (
          <div className="mt-3 flex items-center gap-2 border-t border-slate-200/80 dark:border-white/[0.08] pt-2 opacity-90 transition-opacity duration-150 group-hover:opacity-100">
            <button
              type="button"
              onClick={handleCopy}
              title="Sao chép nội dung"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-slate-500 dark:text-gray-400 transition-all duration-150 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-800 dark:hover:text-gray-200 active:scale-95 cursor-pointer focus-visible:ring-1 focus-visible:ring-[#1B8F3D]/50 focus-visible:outline-none"
            >
              {isCopied ? (
                <>
                  <svg className="h-3.5 w-3.5 text-[#1B8F3D]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-[#1B8F3D] font-medium">Đã copy</span>
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Copy</span>
                </>
              )}
            </button>
            <span className="sr-only" aria-live="polite">
              {isCopied ? 'Đã sao chép nội dung vào khay nhớ tạm' : ''}
            </span>

            {onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                title="Tạo lại câu trả lời"
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-slate-500 dark:text-gray-400 transition-all duration-150 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-[#1B8F3D] active:scale-95 cursor-pointer focus-visible:ring-1 focus-visible:ring-[#1B8F3D]/50 focus-visible:outline-none"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Regenerate</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MessageBubble