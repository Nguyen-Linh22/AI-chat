import { useState } from 'react'
import { sendMessage } from '../services/messageService'
import { useChatStore } from '../stores/chatStore'
import { useMessageStore } from '../stores/messageStore'

function ChatInput() {
  const currentChatId = useChatStore(
    (state) => state.currentChatId
  )

  const addMessage = useMessageStore(
    (state) => state.addMessage
  )

  const [content, setContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isCooldown, setIsCooldown] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  const handleSendMessage = async () => {
    const trimmedContent = content.trim()

    if (!trimmedContent) {
      return
    }

    if (!currentChatId) {
      return
    }

    if (isSending || isCooldown) {
      return
    }

    try {
      setIsSending(true)
      setSendError(null)

      const result = await sendMessage(
        currentChatId,
        trimmedContent
      )

      addMessage(result.userMessage)
      addMessage(result.assistantMessage)

      setContent('')

      setIsCooldown(true)

      setTimeout(() => {
        setIsCooldown(false)
      }, 1500)
    } catch (error) {
      console.error(
        'Không thể gửi message:',
        error
      )

      setSendError(
        'Không thể gửi tin nhắn. Vui lòng thử lại.'
      )
    } finally {
      setIsSending(false)
    }
  }

  const isDisabled =
    isSending || isCooldown

  return (
    <div className="shrink-0 border-t border-gray-700 bg-gray-900 p-4">
      <div className="mx-auto max-w-3xl">
        {sendError && (
          <div className="mb-2 text-center text-sm text-red-400">
            {sendError}
          </div>
        )}

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
            value={content}
            onChange={(event) => {
              setContent(event.target.value)
              setSendError(null)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleSendMessage()
              }
            }}
            disabled={isSending}
            placeholder="Nhập tin nhắn..."
            className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
          />

          {/* Send */}
          <button
            type="button"
            onClick={handleSendMessage}
            disabled={isDisabled}
            className="flex h-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSending ? 'Đang gửi...' : 'Gửi'}
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