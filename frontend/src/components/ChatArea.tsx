import { useEffect } from 'react'
import { getMessages } from '../services/messageService'
import { useChatStore } from '../stores/chatStore'
import { useMessageStore } from '../stores/messageStore'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'

function ChatArea() {
  const currentChatId = useChatStore(
    (state) => state.currentChatId
  )

  const messages = useMessageStore(
    (state) => state.messages
  )

  const setMessages = useMessageStore(
    (state) => state.setMessages
  )

  const clearMessages = useMessageStore(
    (state) => state.clearMessages
  )

  const loadingMessages = useMessageStore(
  (state) => state.loadingMessages
)

const messageError = useMessageStore(
  (state) => state.messageError
)

const setLoadingMessages = useMessageStore(
  (state) => state.setLoadingMessages
)

const setMessageError = useMessageStore(
  (state) => state.setMessageError
)

  useEffect(() => {
  const loadMessages = async () => {
    if (!currentChatId) {
      clearMessages()
      setMessageError(null)
      setLoadingMessages(false)
      return
    }

    try {
      setLoadingMessages(true)
      setMessageError(null)
      clearMessages()

      const messages = await getMessages(currentChatId)

      setMessages(messages)
    } catch (error) {
      console.error('Không thể tải messages:', error)

      clearMessages()
      setMessageError(
        'Không thể tải tin nhắn. Vui lòng thử lại.'
      )
    } finally {
      setLoadingMessages(false)
    }
  }

  loadMessages()
}, [
  currentChatId,
  setMessages,
  clearMessages,
  setLoadingMessages,
  setMessageError
])

  return (
    <main className="flex min-w-0 flex-1 flex-col bg-gray-900">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-700 px-6">
        <div>
          <h1 className="text-sm font-semibold">
            AI Chat Clone
          </h1>

          <p className="text-xs text-gray-500">
            {currentChatId
              ? `Chat ID: ${currentChatId}`
              : 'Chưa chọn chat'}
          </p>
        </div>

        <button
          type="button"
          className="rounded-lg px-3 py-2 text-xl text-gray-400 transition hover:bg-gray-800 hover:text-white"
          title="Tùy chọn"
        >
          ⋮
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          {loadingMessages ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <p className="text-sm text-gray-500">
                Đang tải tin nhắn...
              </p>
            </div>
          ) : messageError ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <p className="text-sm text-red-400">
                {messageError}
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <p className="text-sm text-gray-500">
                Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện!
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                role={message.role === 'user' ? 'user' : 'ai'}
                content={message.content}
              />
            ))
          )}
        </div>
      </div>

      <ChatInput />
    </main>
  )
}

export default ChatArea