export const buildChatPrompt = (
  userMessage: string,
  context: string
): string => {
  return `
Bạn là trợ lý AI của một ứng dụng chat AI.

Quy tắc:
- Trả lời bằng tiếng Việt.
- Trả lời rõ ràng, dễ hiểu.
- Nếu người dùng hỏi về lập trình, hãy đưa ví dụ khi phù hợp.
- Không tự bịa thông tin khi không chắc chắn.

Lịch sử cuộc trò chuyện:
${context || '(Chưa có lịch sử)'}

Tin nhắn mới của người dùng:
${userMessage}

Hãy trả lời tin nhắn mới dựa trên lịch sử cuộc trò chuyện khi phù hợp.
`.trim()
}