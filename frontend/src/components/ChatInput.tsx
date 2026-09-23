import { useRef, useState } from 'react'
import { useChatStore } from '../stores/chatStore'
import { useAIStore } from '../stores/aiStore'
import { useMessageStore } from '../stores/messageStore'
import { streamMessage } from '../services/streamService'

function ChatInput() {
  const currentChatId = useChatStore((state) => state.currentChatId)
  const selectedModelId = useAIStore((state) => state.selectedModelId)

  const addMessage = useMessageStore((state) => state.addMessage)
  const updateMessage = useMessageStore((state) => state.updateMessage)
  const setStreamingMessageId = useMessageStore((state) => state.setStreamingMessageId)
  const replaceMessageId = useMessageStore((state) => state.replaceMessageId)

  const [content, setContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isCooldown, setIsCooldown] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)

  const handleStop = () => {
    abortControllerRef.current?.abort()
  }

  const handleSendMessage = async () => {
    const trimmedContent = content.trim()

    if (!trimmedContent || !currentChatId || !selectedModelId || isSending || isCooldown) {
      return
    }

    const userMessageId = crypto.randomUUID()
    const assistantMessageId = crypto.randomUUID()

    try {
      setIsSending(true)
      setSendError(null)

      const controller = new AbortController()
      abortControllerRef.current = controller

      // Thêm user message vào UI
      addMessage({
        id: userMessageId,
        chatSessionId: currentChatId,
        createdAt: new Date().toISOString(),
        role: 'user',
        content: trimmedContent,
      })

      // Tạo assistant message rỗng
      addMessage({
        id: assistantMessageId,
        chatSessionId: currentChatId,
        createdAt: new Date().toISOString(),
        role: 'assistant',
        content: '',
      })

      setStreamingMessageId(assistantMessageId)

      let assistantContent = ''

      const assistantMessage = await streamMessage(
        currentChatId,
        trimmedContent,
        selectedModelId,
        (chunk) => {
          assistantContent += chunk
          updateMessage(assistantMessageId, assistantContent)
        },
        controller.signal
      )

      updateMessage(assistantMessageId, assistantMessage.content)
      replaceMessageId(assistantMessageId, assistantMessage.id)

      setContent('')
      setIsCooldown(true)

      setTimeout(() => {
        setIsCooldown(false)
      }, 1500)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('STREAM: người dùng đã dừng generation')
        return
      }

      console.error('Không thể streaming message:', error)
      setSendError('Không thể gửi tin nhắn. Vui lòng thử lại.')
    } finally {
      setIsSending(false)
      setStreamingMessageId(null)
      abortControllerRef.current = null
    }
  }

  const isDisabled = isSending || isCooldown || !selectedModelId

  return (
    <div className="shrink-0 border-t border-gray-700 bg-gray-900 p-4">
      <div className="mx-auto max-w-3xl">
        {sendError && (
          <p className="mb-2 text-sm text-red-400">
            {sendError}
          </p>
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

          {/* Send / Stop */}
          <button
            type="button"
            onClick={isSending ? handleStop : handleSendMessage}
            disabled={!isSending && isDisabled}
            className="flex h-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSending ? 'Dừng' : 'Gửi'}
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