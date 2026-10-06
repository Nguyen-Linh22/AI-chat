import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import type { Attachment } from '../services/messageService'

interface MessageBubbleProps {
  role: 'user' | 'ai'
  content: string
  isStreaming?: boolean
  attachments?: Attachment[]
  onRegenerate?: () => void
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

function MessageBubble({
  role,
  content,
  attachments = [],
  isStreaming = false,
  onRegenerate,
}: MessageBubbleProps) {
  const [isCopied, setIsCopied] = useState(false)
  const [isCodeCopied, setIsCodeCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)

      setIsCopied(true)

      setTimeout(() => {
        setIsCopied(false)
      }, 1500)
    } catch (error) {
      console.error('Không thể copy message:', error)
    }
  }

  const handleCodeCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)

      setIsCodeCopied(true)

      setTimeout(() => {
        setIsCodeCopied(false)
      }, 1500)
    } catch (error) {
      console.error('Không thể copy code:', error)
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
        className={`rounded-2xl px-4 py-3 shadow-xs ${
          isUser
            ? 'max-w-[85%] sm:max-w-[75%] rounded-br-md bg-[#1E293B] border border-gray-700/60 text-white'
            : 'w-full rounded-bl-md bg-white dark:bg-[#111827]/95 border border-slate-200/90 dark:border-gray-800 text-slate-800 dark:text-gray-100 shadow-xs dark:shadow-none'
        }`}
      >
        {!isUser && isStreaming ? (
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-semibold opacity-70">AI</span>
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#1B8F3D]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1B8F3D] opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#1B8F3D]"></span>
              </span>
              <span>AI đang trả lời...</span>
            </span>
          </div>
        ) : (
          <p className="mb-1 text-xs font-semibold opacity-70">
            {isUser ? 'Bạn' : 'AI'}
          </p>
        )}

        {attachments.length > 0 && (
          <div className="mb-3 flex flex-col gap-2">
            {attachments.map((attachment) => (
              <a
                key={attachment.id}
                href={attachment.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-lg bg-slate-100 dark:bg-black/20 text-slate-800 dark:text-gray-200 px-3 py-2 text-sm hover:bg-slate-200 dark:hover:bg-black/30"
              >
                <span>📎</span>

                <span className="min-w-0 truncate">
                  {attachment.fileName}
                </span>
              </a>
            ))}
          </div>
        )}

        <div className={`text-sm leading-6 ${isStreaming ? 'ai-typewriter-container' : ''}`}>
          {isStreaming && !content && (
            <span className="ai-cursor text-sm text-blue-400 select-none">
              ▌
            </span>
          )}

          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a({ children, href, ...props }) {
                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 underline hover:text-blue-400"
                    {...props}
                  >
                    {renderChildrenWithCursor(children)}
                  </a>
                )
              },
              p({ children, ...props }) {
                return <p {...props}>{renderChildrenWithCursor(children)}</p>
              },
              li({ children, ...props }) {
                return <li {...props}>{renderChildrenWithCursor(children)}</li>
              },
              h1({ children, ...props }) {
                return <h1 {...props}>{renderChildrenWithCursor(children)}</h1>
              },
              h2({ children, ...props }) {
                return <h2 {...props}>{renderChildrenWithCursor(children)}</h2>
              },
              h3({ children, ...props }) {
                return <h3 {...props}>{renderChildrenWithCursor(children)}</h3>
              },
              h4({ children, ...props }) {
                return <h4 {...props}>{renderChildrenWithCursor(children)}</h4>
              },
              blockquote({ children, ...props }) {
                return <blockquote {...props}>{renderChildrenWithCursor(children)}</blockquote>
              },
              code({
                className,
                children,
                ...props
              }) {
                const match = /language-(\w+)/.exec(
                  className || ''
                )
                const contentStr = String(children).replace(/\n$/, '')
                const hasCursor = contentStr.includes('▌')
                const cleanContent = contentStr.replace(/▌/g, '')

                return match ? (
                  <div className="relative my-2">
                    <SyntaxHighlighter
                      style={oneDark}
                      language={match[1]}
                      PreTag="div"
                    >
                      {cleanContent}
                    </SyntaxHighlighter>

                    {hasCursor && (
                      <span className="ai-cursor absolute bottom-2 right-3 text-blue-400 select-none text-sm">
                        ▌
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        handleCodeCopy(cleanContent)
                      }
                      className="absolute right-2 top-2 rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 hover:text-white cursor-pointer"
                    >
                      {isCodeCopied ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                ) : (
                  <code
                    className={className}
                    {...props}
                  >
                    {renderChildrenWithCursor(children)}
                  </code>
                )
              },
            }}
          >
            {isStreaming && content ? content + ' ▌' : content}
          </ReactMarkdown>
        </div>

        {!isUser && !isStreaming && (
          <div className="mt-3 flex items-center gap-2 border-t border-slate-200/80 dark:border-gray-800/80 pt-2 opacity-90 transition-opacity duration-150 group-hover:opacity-100">
            <button
              type="button"
              onClick={handleCopy}
              title="Sao chép nội dung"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-slate-500 dark:text-gray-400 transition-all duration-150 hover:bg-slate-100 dark:hover:bg-gray-800 hover:text-slate-800 dark:hover:text-gray-200 active:scale-95 cursor-pointer"
            >
              {isCopied ? (
                <>
                  <span className="text-[#1B8F3D] font-bold">✓</span>
                  <span className="text-[#1B8F3D]">Đã copy</span>
                </>
              ) : (
                <>
                  <span>⎘</span>
                  <span>Copy</span>
                </>
              )}
            </button>

            {onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                title="Tạo lại câu trả lời"
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-slate-500 dark:text-gray-400 transition-all duration-150 hover:bg-slate-100 dark:hover:bg-gray-800 hover:text-[#1B8F3D] active:scale-95 cursor-pointer"
              >
                <span>↻</span>
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