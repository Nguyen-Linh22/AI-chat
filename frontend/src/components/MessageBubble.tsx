import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface MessageBubbleProps {
  role: 'user' | 'ai'
  content: string
  isStreaming?: boolean
  onRegenerate?: () => void
}

function MessageBubble({
  role,
  content,
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
        <p className="mb-1 text-xs font-semibold opacity-70">
          {isUser ? 'Bạn' : 'AI'}
        </p>

        <div className="text-sm leading-6">
          {isStreaming && !content && (
            <span className="text-sm text-gray-400">
              AI đang suy nghĩ...
            </span>
          )}

          <ReactMarkdown
            components={{
              code({
                className,
                children,
                ...props
              }) {
                const match = /language-(\w+)/.exec(
                  className || ''
                )

                return match ? (
                  <div className="relative">
                    <SyntaxHighlighter
                      style={oneDark}
                      language={match[1]}
                      PreTag="div"
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>

                    <button
                      type="button"
                      onClick={() =>
                        handleCodeCopy(
                          String(children).replace(/\n$/, '')
                        )
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
                    {children}
                  </code>
                )
              }
            }}
          >
            {content}
          </ReactMarkdown>

          {isStreaming && content && (
            <span className="ml-1 inline-block animate-pulse">
              ▌
            </span>
          )}
        </div>

        {!isUser && !isStreaming && (
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="text-xs text-gray-400 hover:text-white"
            >
              {isCopied ? '✓ Copied' : 'Copy'}
            </button>

            {onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                className="text-xs text-gray-400 hover:text-white"
              >
                ↻ Regenerate
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MessageBubble