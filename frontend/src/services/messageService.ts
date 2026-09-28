import { apiClient } from './apiClient'

export interface Attachment {
  id: string
  fileName: string
  fileUrl: string
  fileType: string
  sizeBytes: string
  createdAt: string
}

export interface Message {
  id: string
  chatSessionId: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  attachments: Attachment[]
}

export interface GetMessagesResponse {
  messages: Message[]
  nextCursor: string | null
  hasMore: boolean
}

export const getMessages = async (
  chatId: string,
  limit: number = 30,
  before?: string
): Promise<GetMessagesResponse> => {
  const params = new URLSearchParams()
  params.set('limit', limit.toString())
  if (before) {
    params.set('before', before)
  }

  const response = await apiClient.get(
    `/api/chats/${chatId}/messages?${params.toString()}`
  )

  if (!response.ok) {
    throw new Error('Không thể lấy danh sách messages')
  }

  const data = await response.json()

  const normalizedMessages = (data.messages as Message[]).map((msg) => ({
    ...msg,
    role: msg.role === ('ai' as string) ? 'assistant' : msg.role
  })) as Message[]

  return {
    messages: normalizedMessages,
    nextCursor: data.nextCursor ?? null,
    hasMore: Boolean(data.hasMore)
  }
}

export interface SendMessageResponse {
  userMessage: Message
  assistantMessage: Message
}

export const sendMessage = async (
  chatId: string,
  content: string,
  modelId: string
): Promise<SendMessageResponse> => {
  const response = await apiClient.post(
    `/api/chats/${chatId}/messages`,
    {
      content,
      modelId
    }
  )

  if (!response.ok) {
    throw new Error('Không thể gửi message')
  }

  const data = await response.json()

  return data.data
}

export const regenerateMessage = async (
  chatId: string,
  messageId: string,
  modelId: string,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal
): Promise<void> => {
  const response = await fetch(
    `http://localhost:3000/api/chats/${chatId}/messages/${messageId}/regenerate`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        modelId
      }),
      signal
    }
  )

  if (!response.ok) {
    throw new Error(
      'Không thể regenerate message'
    )
  }

  if (!response.body) {
    throw new Error(
      'Server không trả về stream'
    )
  }

  const reader =
    response.body.getReader()

  const decoder =
    new TextDecoder()

  let buffer = ''

  while (true) {
    const { value, done } =
      await reader.read()

    if (done) {
      break
    }

    buffer += decoder.decode(
      value,
      { stream: true }
    )

    const events =
      buffer.split('\n\n')

    buffer =
      events.pop() ?? ''

    for (const event of events) {
      if (!event.startsWith('data: ')) {
        continue
      }

      const data = JSON.parse(
        event.slice(6)
      )

      if (data.type === 'chunk') {
        onChunk(data.content)
      }

      if (data.type === 'error') {
        throw new Error(
          data.message ||
            'Regenerate thất bại'
        )
      }

      if (data.type === 'done') {
        return
      }
    }
  }
}