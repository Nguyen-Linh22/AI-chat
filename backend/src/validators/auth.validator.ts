import { z } from 'zod'

export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Email không hợp lệ'),

  password: z
    .string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
    .max(72, 'Mật khẩu không được vượt quá 72 ký tự'),
})

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Email không hợp lệ'),

  password: z
    .string()
    .min(1, 'Mật khẩu không được để trống'),
})