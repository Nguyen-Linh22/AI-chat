function Sidebar() {
  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-gray-700 bg-gray-800 p-4">
      {/* Logo */}
      <div className="mb-6 px-2">
        <h1 className="text-xl font-bold">
          AI Chat Clone
        </h1>
      </div>

      {/* New Chat */}
      <button
        type="button"
        className="mb-6 flex w-full items-center gap-2 rounded-lg border border-gray-600 px-4 py-3 text-left text-sm font-medium transition hover:bg-gray-700"
      >
        <span className="text-lg">+</span>
        <span>Chat mới</span>
      </button>

      {/* Chat history */}
      <div className="flex-1 overflow-y-auto">
        <h2 className="mb-3 px-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Lịch sử chat
        </h2>

        <div className="space-y-1">
          <button
            type="button"
            className="w-full truncate rounded-lg px-3 py-2 text-left text-sm transition hover:bg-gray-700"
          >
            Cuộc trò chuyện 1
          </button>

          <button
            type="button"
            className="w-full truncate rounded-lg px-3 py-2 text-left text-sm transition hover:bg-gray-700"
          >
            Cuộc trò chuyện 2
          </button>

          <button
            type="button"
            className="w-full truncate rounded-lg px-3 py-2 text-left text-sm transition hover:bg-gray-700"
          >
            Cuộc trò chuyện 3
          </button>
        </div>
      </div>

      {/* User */}
      <div className="border-t border-gray-700 pt-4">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-600">
            👤
          </div>

          <div>
            <p className="text-sm font-medium">
              Người dùng
            </p>

            <p className="text-xs text-gray-400">
              Tài khoản
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar