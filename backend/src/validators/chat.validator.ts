import { z } from 'zod'

export const renameChatSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Tên cuộc trò chuyện không được để trống')
    .max(200, 'Tên cuộc trò chuyện không được vượt quá 200 ký tự')
})