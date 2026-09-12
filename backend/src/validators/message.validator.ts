import { z } from 'zod'

export const createMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Nội dung tin nhắn không được để trống')
    .max(10000, 'Nội dung tin nhắn không được vượt quá 10000 ký tự')
})