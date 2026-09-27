import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
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
                className="ai-cursor inline-block ml-0.5 text-blue-400 select-none align-baseline"
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
  onRegenerate
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
      className={`flex w-full ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'rounded-br-md bg-blue-600 text-white'
            : 'rounded-bl-md bg-gray-800 text-gray-100'
        }`}
      >
        {!isUser && isStreaming ? (
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-semibold opacity-70">AI</span>
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-blue-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-500"></span>
              </span>
              <span>Đang nhập...</span>
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
                className="flex items-center gap-2 rounded-lg bg-black/20 px-3 py-2 text-sm hover:bg-black/30"
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
            components={{
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
                      className="absolute right-2 top-2 rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 hover:text-white"
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
              }
            }}
          >
            {isStreaming && content ? content + ' ▌' : content}
          </ReactMarkdown>
        </div>

        {!isUser && !isStreaming && (
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              title="Sao chép nội dung"
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-gray-400 transition-all hover:bg-gray-700 hover:text-gray-100"
            >
              {isCopied ? (
                <>
                  <span>✓</span>
                  <span>Đã copy</span>
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
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-gray-400 transition-all hover:bg-gray-700 hover:text-blue-300"
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