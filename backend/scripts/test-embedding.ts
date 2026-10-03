import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
})

async function embedText(text: string): Promise<number[]> {
  const response = await ai.models.embedContent({
    model: 'gemini-embedding-2',
    contents: text,
    config: {
      outputDimensionality: 768,
    },
  })

  const values = response.embeddings?.[0]?.values

  if (!values) {
    throw new Error('Không nhận được embedding từ Gemini.')
  }

  return values
}

const text = 'Gói Miễn phí có hạn mức 50 tin nhắn mỗi ngày.'

const embedding = await embedText(text)

console.log('Số chiều:', embedding.length)
console.log('5 giá trị đầu:', embedding.slice(0, 5))