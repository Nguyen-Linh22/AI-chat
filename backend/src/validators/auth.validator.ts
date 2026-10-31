import { z } from 'zod'

export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Email không hợp lệ'),

  password: z
    .string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .max(72, 'Mật khẩu không được vượt quá 72 ký tự'),
})

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Email không hợp lệ'),

  password: z
    .string()
    .min(1, 'Mật khẩu không được để trống')
    .max(72, 'Mật khẩu không được vượt quá 72 ký tự'),
})

export const googleAuthSchema = z.object({
  credential: z
    .string()
    .trim()
    .min(1, 'Token Google không được để trống'),
})