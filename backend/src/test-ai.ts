import 'dotenv/config'
import { generateAIResponse } from './ai/ai.service.js'
import { buildChatContext } from './ai/context/chat.context.js'
import { buildChatPrompt } from './ai/prompts/chat.prompt.js'

const main = async () => {
  try {
    const context = buildChatContext([
      {
        role: 'user',
        content: 'Tôi đang học SQL.'
      },
      {
        role: 'assistant',
        content:
          'Rất tốt. SQL là ngôn ngữ dùng để làm việc với cơ sở dữ liệu.'
      },
      {
        role: 'user',
        content: 'Tôi đang học GROUP BY và HAVING.'
      },
      {
        role: 'assistant',
        content:
          'GROUP BY dùng để gom các dòng thành nhóm, còn HAVING dùng để lọc các nhóm.'
      }
    ])

    const prompt = buildChatPrompt(
      'Vậy HAVING khác WHERE như thế nào?',
      context
    )

    console.log('Context:')
    console.log(context)

    console.log('\nPrompt:')
    console.log(prompt)

    const response = await generateAIResponse(
      prompt,
      'qwen3:1.7b',
      'ollama'
    )

    console.log('\nAI response:')
    console.log(response)
  } catch (error) {
    console.error('AI test error:', error)
  }
}

main()