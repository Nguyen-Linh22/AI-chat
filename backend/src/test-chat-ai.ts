import 'dotenv/config'
import { generateChatResponse } from './ai/chat.service.js'

const main = async () => {
  try {
    const chatId = '3652dfcf-5f19-4674-bd05-13564f6bcfd6'
    const userId = '065a9fc1-0a29-43c5-9cbc-ec5b95975e0e'

    const response = await generateChatResponse(
      chatId,
      userId,
      'Hãy giải thích ngắn gọn GROUP BY trong SQL.',
      'ollama-qwen3-1.7b'
    )

    console.log('\nAI response:')
    console.log(response)
  } catch (error) {
    console.error('Chat AI test error:', error)
  }
}

main()