interface MessageBubbleProps {
  role: 'user' | 'ai'
  content: string
  isStreaming?: boolean
}

function MessageBubble({
  role,
  content,
  isStreaming = false
}: MessageBubbleProps) {
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

        <p className="whitespace-pre-wrap text-sm leading-6">
          {content}

          {isStreaming && (
            <span className="ml-1 inline-block animate-pulse">
              ▌
            </span>
          )}
        </p>
      </div>
    </div>
  )
}

export default MessageBubble