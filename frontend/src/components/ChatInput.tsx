function ChatInput() {
  return (
    <div className="shrink-0 border-t border-gray-700 bg-gray-900 p-4">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-2 rounded-2xl border border-gray-600 bg-gray-800 p-2">
          {/* Attachment */}
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl text-gray-400 transition hover:bg-gray-700 hover:text-white"
            title="Đính kèm file"
          >
            +
          </button>

          {/* Input */}
          <input
            type="text"
            placeholder="Nhập tin nhắn..."
            className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-gray-500"
          />

          {/* Send */}
          <button
            type="button"
            className="flex h-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Gửi
          </button>
        </div>

        <p className="mt-2 text-center text-xs text-gray-500">
          AI có thể đưa ra thông tin không chính xác. Hãy kiểm tra lại thông tin quan trọng.
        </p>
      </div>
    </div>
  )
}

export default ChatInput