import { describe, expect, it } from 'vitest'
import { registerSchema, loginSchema } from '../../src/validators/auth.validator.js'
import { paginationQuerySchema } from '../../src/validators/pagination.validator.js'
import { chatIdParamsSchema } from '../../src/validators/params.validator.js'
import { streamMessageSchema } from '../../src/validators/message.validator.js'

describe('15.2-A — Unit Test Validation', () => {
  describe('Register validation (registerSchema)', () => {
    it('email hợp lệ → PASS', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: 'ValidPassword123'
      })
      expect(result.success).toBe(true)
    })

    it('email sai định dạng → FAIL', () => {
      const invalidEmails = ['invalid-email', 'user@', '@domain.com', 'user@.com']
      for (const email of invalidEmails) {
        const result = registerSchema.safeParse({
          email,
          password: 'ValidPassword123'
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Email không hợp lệ')
        }
      }
    })

    it('password < 8 ký tự → FAIL', () => {
      const shortPasswords = ['123', '12345', '1234567']
      for (const password of shortPasswords) {
        const result = registerSchema.safeParse({
          email: 'user@example.com',
          password
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Mật khẩu phải có ít nhất 8 ký tự')
        }
      }
    })

    it('password > 72 ký tự → FAIL', () => {
      const longPassword = 'a'.repeat(73)
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: longPassword
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Mật khẩu không được vượt quá 72 ký tự')
      }
    })

    it('password 8–72 ký tự → PASS', () => {
      const valid8 = 'a'.repeat(8)
      const valid72 = 'a'.repeat(72)
      const validMid = 'a'.repeat(32)

      expect(registerSchema.safeParse({ email: 'user@example.com', password: valid8 }).success).toBe(true)
      expect(registerSchema.safeParse({ email: 'user@example.com', password: valid72 }).success).toBe(true)
      expect(registerSchema.safeParse({ email: 'user@example.com', password: validMid }).success).toBe(true)
    })
  })

  describe('Login validation (loginSchema)', () => {
    it('email hợp lệ + password → PASS', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'my-password'
      })
      expect(result.success).toBe(true)
    })

    it('email sai → FAIL', () => {
      const result = loginSchema.safeParse({
        email: 'bad-email',
        password: 'my-password'
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Email không hợp lệ')
      }
    })

    it('password rỗng → FAIL', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: ''
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Mật khẩu không được để trống')
      }
    })
  })

  describe('Pagination validation (paginationQuerySchema)', () => {
    it('page hợp lệ → PASS (và coerce thành số)', () => {
      const result = paginationQuerySchema.safeParse({ page: 2, limit: 10 })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(2)
        expect(result.data.limit).toBe(10)
      }

      // Hỗ trợ coerce string number từ query string
      const fromQuery = paginationQuerySchema.safeParse({ page: '5', limit: '25' })
      expect(fromQuery.success).toBe(true)
      if (fromQuery.success) {
        expect(fromQuery.data.page).toBe(5)
        expect(fromQuery.data.limit).toBe(25)
      }
    })

    it('limit hợp lệ → PASS', () => {
      const resMin = paginationQuerySchema.safeParse({ page: 1, limit: 1 })
      const resMax = paginationQuerySchema.safeParse({ page: 1, limit: 100 })
      expect(resMin.success).toBe(true)
      expect(resMax.success).toBe(true)
    })

    it('page âm hoặc 0 → FAIL', () => {
      expect(paginationQuerySchema.safeParse({ page: 0 }).success).toBe(false)
      expect(paginationQuerySchema.safeParse({ page: -1 }).success).toBe(false)
    })

    it('limit âm hoặc 0 → FAIL', () => {
      expect(paginationQuerySchema.safeParse({ limit: 0 }).success).toBe(false)
      expect(paginationQuerySchema.safeParse({ limit: -5 }).success).toBe(false)
    })

    it('limit vượt maximum (100) → FAIL', () => {
      const result = paginationQuerySchema.safeParse({ limit: 101 })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Limit phải là số nguyên từ 1 đến 100')
      }
    })

    it('giá trị không phải số → FAIL', () => {
      expect(paginationQuerySchema.safeParse({ page: 'abc' }).success).toBe(false)
      expect(paginationQuerySchema.safeParse({ limit: 'xyz' }).success).toBe(false)
    })
  })

  describe('UUID validation (chatIdParamsSchema)', () => {
    it('UUID hợp lệ → PASS', () => {
      const validUuids = [
        '123e4567-e89b-12d3-a456-426614174000',
        'c9a646d3-9c61-4cb7-bf7d-b2f61800c5e7'
      ]
      for (const id of validUuids) {
        const result = chatIdParamsSchema.safeParse({ id })
        expect(result.success).toBe(true)
      }
    })

    it('UUID sai → FAIL', () => {
      const invalidUuids = [
        'not-a-uuid',
        '12345',
        '123e4567-e89b-12d3-a456',
        ''
      ]
      for (const id of invalidUuids) {
        const result = chatIdParamsSchema.safeParse({ id })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Chat ID không hợp lệ')
        }
      }
    })
  })

  describe('Stream content validation (streamMessageSchema)', () => {
    it('content hợp lệ + model hợp lệ → PASS', () => {
      const result = streamMessageSchema.safeParse({
        content: 'Xin chào, đây là tin nhắn hợp lệ!',
        modelId: 'gemini-3.6-flash'
      })
      expect(result.success).toBe(true)
    })

    it('content rỗng hoặc chỉ có khoảng trắng → FAIL', () => {
      const resultEmpty = streamMessageSchema.safeParse({
        content: '',
        modelId: 'gemini-3.6-flash'
      })
      expect(resultEmpty.success).toBe(false)

      const resultWhitespace = streamMessageSchema.safeParse({
        content: '   ',
        modelId: 'gemini-3.6-flash'
      })
      expect(resultWhitespace.success).toBe(false)
    })

    it('content > 10,000 ký tự → FAIL', () => {
      const longContent = 'A'.repeat(10001)
      const result = streamMessageSchema.safeParse({
        content: longContent,
        modelId: 'gemini-3.6-flash'
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Nội dung tin nhắn không được vượt quá 10000 ký tự')
      }
    })
  })
})
