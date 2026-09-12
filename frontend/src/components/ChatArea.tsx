import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'

function ChatArea() {
  return (
    <main className="flex min-w-0 flex-1 flex-col bg-gray-900">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-700 px-6">
        <h1 className="text-sm font-semibold">
          AI Chat Clone
        </h1>

        <button
          type="button"
          className="rounded-lg px-3 py-2 text-xl text-gray-400 transition hover:bg-gray-800 hover:text-white"
          title="Tùy chọn"
        >
          ⋮
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          <MessageBubble
            role="user"
            content="Xin chào, tôi cần giúp đỡ!"
          />

          <MessageBubble
            role="ai"
            content="Chào bạn! 👋 Tôi có thể giúp gì cho bạn hôm nay?"
          />

          <MessageBubble
            role="user"
            content="Tôi đang xây dựng một AI Chat Clone."
          />

          <MessageBubble
            role="ai"
            content="Tuyệt vời! Tôi có thể hướng dẫn bạn từng bước xây dựng ứng dụng."
          />
        </div>
      </div>

      {/* Input */}
      <ChatInput />
    </main>
  )
}

export default ChatArea