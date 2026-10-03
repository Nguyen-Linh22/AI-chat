import type { Message } from './messageService'
import { API_URL } from './apiClient'

interface StreamMessageResult {
  userMessage: Message
  assistantMessage: Message
}

export const streamMessage = async (
  chatId: string,
  content: string,
  modelId: string,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal,
  file?: File | null
): Promise<StreamMessageResult> => {
  const formData = new FormData()

  formData.append('content', content)
  formData.append('modelId', modelId)

  if (file) {
    formData.append('file', file)
  }

  const response = await fetch(
    `${API_URL}/api/chats/${chatId}/messages/stream`,
    {
      method: 'POST',
      credentials: 'include',
      body: formData,
      signal
    }
  )

  if (!response.ok) {
    throw new Error(
      `Streaming request failed: ${response.status}`
    )
  }

  if (!response.body) {
    throw new Error(
      'Backend không trả về response body'
    )
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()

    if (done) {
      break
    }

    buffer += decoder.decode(value, {
      stream: true
    })

    const events = buffer.split('\n\n')
    buffer = events.pop() ?? ''

    for (const event of events) {
      const line = event
        .split('\n')
        .find((line) => line.startsWith('data:'))

      if (!line) {
        continue
      }

      const data = line.replace(/^data:\s*/, '')
      const parsed = JSON.parse(data)

      if (parsed.type === 'chunk') {
        onChunk(parsed.content)
      }

      if (parsed.type === 'error') {
        throw new Error(parsed.message)
      }

      if (parsed.type === 'done') {
        const assistantMsg = parsed.message
        return {
          userMessage: parsed.userMessage,
          assistantMessage: {
            ...assistantMsg,
            role: assistantMsg.role === 'ai' ? 'assistant' : assistantMsg.role
          }
        }
      }
    }
  }

  throw new Error(
    'Stream kết thúc mà không nhận được message hoàn tất'
  )
}