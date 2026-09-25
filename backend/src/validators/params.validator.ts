import { z } from 'zod'

export const chatIdParamsSchema = z.object({
  id: z.string().uuid('Chat ID không hợp lệ')
})

export const chatMessageParamsSchema = z.object({
  id: z.string().uuid('Chat ID không hợp lệ'),
  messageId: z.string().uuid('Message ID không hợp lệ')
})

export const deleteMessageParamsSchema = z.object({
  chatId: z.string().uuid('Chat ID không hợp lệ'),
  messageId: z.string().uuid('Message ID không hợp lệ')
})

export const messageIdParamsSchema = z.object({
  messageId: z.string().uuid('Message ID không hợp lệ')
})
