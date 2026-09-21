export const streamMessage = async (
  chatId: string,
  content: string,
  modelId: string,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal
): Promise<void> => {
  const response = await fetch(
    `http://localhost:3000/api/chats/${chatId}/messages/stream`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        content,
        modelId
      }),
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

    buffer += decoder.decode(value, {
      stream: true
    })

    const events =
      buffer.split('\n\n')

    buffer =
      events.pop() ?? ''

    for (const event of events) {
      const line =
        event
          .split('\n')
          .find((line) =>
            line.startsWith('data:')
          )

      if (!line) {
        continue
      }

      const data = line
        .replace(/^data:\s*/, '')

      const parsed =
        JSON.parse(data)

      if (parsed.type === 'chunk') {
        onChunk(parsed.content)
      }

      if (parsed.type === 'error') {
        throw new Error(
          parsed.message
        )
      }

      if (parsed.type === 'done') {
        return
      }
    }
  }
}