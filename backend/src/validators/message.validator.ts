import { z } from 'zod'
import { isSupportedModelId } from '../ai/model.registry.js'

export const modelIdSchema = z
  .string()
  .trim()
  .min(1, 'Model ID không được để trống')
  .refine((id) => isSupportedModelId(id), {
    message: 'AI model không được hỗ trợ'
  })

export const createMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Nội dung tin nhắn không được để trống')
    .max(
      10000,
      'Nội dung tin nhắn không được vượt quá 10000 ký tự'
    ),

  modelId: modelIdSchema
})

export const streamMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Nội dung tin nhắn không được để trống')
    .max(
      10000,
      'Nội dung tin nhắn không được vượt quá 10000 ký tự'
    ),

  modelId: modelIdSchema
})

export const regenerateMessageSchema = z.object({
  modelId: modelIdSchema
})