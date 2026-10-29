import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import express from 'express'
import request from 'supertest'
import cookieParser from 'cookie-parser'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import {
  verifyGoogleIdToken,
  authenticateWithGoogle,
  GOOGLE_ACCOUNT_CONFLICT_ERROR
} from '../../src/services/google-auth.service.js'
import { googleAuth } from '../../src/controllers/auth.controller.js'
import { loginUser } from '../../src/services/auth.service.js'
import { googleAuthSchema } from '../../src/validators/auth.validator.js'
import { validate } from '../../src/middlewares/validate.middleware.js'

const {
  prismaUserFindUniqueMock,
  prismaUserFindFirstMock,
  prismaUserCreateMock,
  verifyIdTokenMock
} = vi.hoisted(() => ({
  prismaUserFindUniqueMock: vi.fn(),
  prismaUserFindFirstMock: vi.fn(),
  prismaUserCreateMock: vi.fn(),
  verifyIdTokenMock: vi.fn()
}))

vi.mock('../../src/lib/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: prismaUserFindUniqueMock,
      findFirst: prismaUserFindFirstMock,
      create: prismaUserCreateMock
    }
  }
}))

vi.mock('google-auth-library', () => {
  return {
    OAuth2Client: class {
      verifyIdToken = verifyIdTokenMock
    }
  }
})

describe('Google Authentication End-to-End Unit Suite', () => {
  const originalEnv = { ...process.env }
  const MOCK_CLIENT_ID = 'test-client-id.apps.googleusercontent.com'

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = {
      ...originalEnv,
      JWT_SECRET: 'test-secret-key-at-least-32-chars-long',
      GOOGLE_CLIENT_ID: MOCK_CLIENT_ID,
      NODE_ENV: 'test'
    }
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  describe('1. Google ID Token Verifier Claims & Failure Modes', () => {
    it('xác thực thành công với đầy đủ claims hợp lệ: sub, email, email_verified=true, aud khớp clientId', async () => {
      verifyIdTokenMock.mockResolvedValueOnce({
        getPayload: () => ({
          sub: 'google-sub-12345',
          email: 'user@example.com',
          email_verified: true,
          aud: MOCK_CLIENT_ID
        })
      })

      const claims = await verifyGoogleIdToken('valid-mock-token')
      expect(claims).toEqual({
        sub: 'google-sub-12345',
        email: 'user@example.com',
        emailVerified: true
      })
      expect(verifyIdTokenMock).toHaveBeenCalledWith({
        idToken: 'valid-mock-token',
        audience: MOCK_CLIENT_ID
      })
    })

    it('chuẩn hóa email về chữ thường (lowercase) và trim whitespace', async () => {
      verifyIdTokenMock.mockResolvedValueOnce({
        getPayload: () => ({
          sub: '  google-sub-12345  ',
          email: '  USER.NAME@EXAMPLE.COM  ',
          email_verified: true,
          aud: MOCK_CLIENT_ID
        })
      })

      const claims = await verifyGoogleIdToken('token-with-whitespace')
      expect(claims.sub).toBe('google-sub-12345')
      expect(claims.email).toBe('user.name@example.com')
    })

    it('từ chối khi thiếu GOOGLE_CLIENT_ID trên server', async () => {
      delete process.env.GOOGLE_CLIENT_ID

      await expect(verifyGoogleIdToken('mock-token')).rejects.toThrow(
        'GOOGLE_CLIENT_ID_MISSING'
      )
    })

    it('từ chối khi Google OAuth2Client verifyIdToken ném lỗi (chữ ký sai hoặc hết hạn)', async () => {
      verifyIdTokenMock.mockRejectedValueOnce(new Error('Invalid token signature'))

      await expect(verifyGoogleIdToken('bad-sig-token')).rejects.toThrow(
        'Xác thực Google ID Token thất bại'
      )
    })

    it('từ chối khi payload rỗng', async () => {
      verifyIdTokenMock.mockResolvedValueOnce({
        getPayload: () => null
      })

      await expect(verifyGoogleIdToken('token-no-payload')).rejects.toThrow(
        'Google ID Token không chứa dữ liệu payload'
      )
    })

    it('từ chối khi sub rỗng hoặc thiếu', async () => {
      verifyIdTokenMock.mockResolvedValueOnce({
        getPayload: () => ({
          sub: '   ',
          email: 'user@example.com',
          email_verified: true,
          aud: MOCK_CLIENT_ID
        })
      })

      await expect(verifyGoogleIdToken('token-empty-sub')).rejects.toThrow(
        'Google ID Token không chứa sub hợp lệ'
      )
    })

    it('từ chối khi email rỗng hoặc thiếu', async () => {
      verifyIdTokenMock.mockResolvedValueOnce({
        getPayload: () => ({
          sub: 'google-sub-123',
          email: '',
          email_verified: true,
          aud: MOCK_CLIENT_ID
        })
      })

      await expect(verifyGoogleIdToken('token-empty-email')).rejects.toThrow(
        'Google ID Token không chứa email hợp lệ'
      )
    })

    it('từ chối khi email_verified không phải là true', async () => {
      verifyIdTokenMock.mockResolvedValueOnce({
        getPayload: () => ({
          sub: 'google-sub-123',
          email: 'unverified@example.com',
          email_verified: false,
          aud: MOCK_CLIENT_ID
        })
      })

      await expect(verifyGoogleIdToken('token-unverified')).rejects.toThrow(
        'Email Google chưa được xác minh'
      )
    })

    it('từ chối khi audience (aud) không khớp với server clientId', async () => {
      verifyIdTokenMock.mockResolvedValueOnce({
        getPayload: () => ({
          sub: 'google-sub-123',
          email: 'user@example.com',
          email_verified: true,
          aud: 'different-client-id.apps.googleusercontent.com'
        })
      })

      await expect(verifyGoogleIdToken('token-wrong-aud')).rejects.toThrow(
        'Google ID Token audience không khớp với Client ID'
      )
    })
  })

  describe('2. Safe Account Resolution & Creation (authenticateWithGoogle)', () => {
    it('đăng nhập lặp lại (idempotent): tìm thấy theo googleId → không tạo thêm bản ghi mới', async () => {
      verifyIdTokenMock.mockResolvedValueOnce({
        getPayload: () => ({
          sub: 'google-existing-sub',
          email: 'user@example.com',
          email_verified: true,
          aud: MOCK_CLIENT_ID
        })
      })

      const existingUser = {
        id: 'user-uuid-1',
        email: 'user@example.com',
        createdAt: new Date('2026-01-01'),
        tokenVersion: 2
      }

      prismaUserFindUniqueMock.mockResolvedValueOnce(existingUser)

      const result = await authenticateWithGoogle('mock-id-token')

      expect(result.isNewUser).toBe(false)
      expect(result.user.id).toBe('user-uuid-1')
      expect(result.user.email).toBe('user@example.com')
      expect(prismaUserCreateMock).not.toHaveBeenCalled()

      // Kiểm tra JWT chứa đúng userId và tokenVersion
      const decoded = jwt.verify(result.accessToken, process.env.JWT_SECRET!) as any
      expect(decoded.userId).toBe('user-uuid-1')
      expect(decoded.tokenVersion).toBe(2)
    })

    it('tạo tài khoản mới an toàn: passwordHash=null, googleId=sub khi cả googleId và email chưa có trong DB', async () => {
      verifyIdTokenMock.mockResolvedValueOnce({
        getPayload: () => ({
          sub: 'google-new-sub',
          email: 'newuser@example.com',
          email_verified: true,
          aud: MOCK_CLIENT_ID
        })
      })

      // 1. Không tìm thấy theo googleId
      prismaUserFindUniqueMock.mockResolvedValueOnce(null)
      // 2. Không tìm thấy theo email (case-insensitive)
      prismaUserFindFirstMock.mockResolvedValueOnce(null)

      const createdUser = {
        id: 'new-user-uuid',
        email: 'newuser@example.com',
        createdAt: new Date('2026-02-01'),
        tokenVersion: 0
      }
      prismaUserCreateMock.mockResolvedValueOnce(createdUser)

      const result = await authenticateWithGoogle('mock-id-token')

      expect(result.isNewUser).toBe(true)
      expect(result.user.id).toBe('new-user-uuid')
      expect(prismaUserCreateMock).toHaveBeenCalledWith({
        data: {
          email: 'newuser@example.com',
          googleId: 'google-new-sub',
          passwordHash: null
        },
        select: {
          id: true,
          email: true,
          createdAt: true,
          tokenVersion: true
        }
      })
    })

    it('từ chối liên kết ngầm (Safe Conflict): email đã tồn tại với tài khoản mật khẩu → ném lỗi 409 giải thích rõ', async () => {
      verifyIdTokenMock.mockResolvedValueOnce({
        getPayload: () => ({
          sub: 'google-attacker-or-victim-sub',
          email: 'existing-local@example.com',
          email_verified: true,
          aud: MOCK_CLIENT_ID
        })
      })

      // 1. Không tìm thấy theo googleId
      prismaUserFindUniqueMock.mockResolvedValueOnce(null)
      // 2. Tìm thấy theo email (case-insensitive)
      prismaUserFindFirstMock.mockResolvedValueOnce({
        id: 'local-user-uuid',
        googleId: null
      })

      await expect(authenticateWithGoogle('mock-id-token')).rejects.toThrow(
        GOOGLE_ACCOUNT_CONFLICT_ERROR
      )

      expect(prismaUserCreateMock).not.toHaveBeenCalled()
    })

    it('từ chối liên kết ngầm khi email trong DB có chữ hoa/thường khác biệt (case-insensitive conflict) → 409 conflict', async () => {
      verifyIdTokenMock.mockResolvedValueOnce({
        getPayload: () => ({
          sub: 'google-case-sub',
          email: 'mixeduser@example.com',
          email_verified: true,
          aud: MOCK_CLIENT_ID
        })
      })

      // 1. Không tìm thấy theo googleId
      prismaUserFindUniqueMock.mockResolvedValueOnce(null)
      // 2. Tìm thấy theo email case-insensitive (DB lưu MixedUser@Example.COM)
      prismaUserFindFirstMock.mockResolvedValueOnce({
        id: 'existing-mixed-uuid',
        email: 'MixedUser@Example.COM',
        googleId: null
      })

      await expect(authenticateWithGoogle('mock-id-token')).rejects.toThrow(
        GOOGLE_ACCOUNT_CONFLICT_ERROR
      )

      expect(prismaUserFindFirstMock).toHaveBeenCalledWith({
        where: {
          email: {
            equals: 'mixeduser@example.com',
            mode: 'insensitive'
          }
        },
        select: {
          id: true,
          googleId: true
        }
      })
      expect(prismaUserCreateMock).not.toHaveBeenCalled()
    })

    it('xử lý race condition (P2002 duplicate key) an toàn bằng cách truy vấn lại theo googleId', async () => {
      verifyIdTokenMock.mockResolvedValueOnce({
        getPayload: () => ({
          sub: 'google-race-sub',
          email: 'race@example.com',
          email_verified: true,
          aud: MOCK_CLIENT_ID
        })
      })

      // 1. Ban đầu không thấy theo googleId
      prismaUserFindUniqueMock.mockResolvedValueOnce(null)
      // 2. Không thấy theo email
      prismaUserFindFirstMock.mockResolvedValueOnce(null)
      // 3. create() gặp race condition P2002
      prismaUserCreateMock.mockRejectedValueOnce({ code: 'P2002' })
      // 4. Fallback findUnique theo googleId tìm thấy bản ghi được tạo song song
      prismaUserFindUniqueMock.mockResolvedValueOnce({
        id: 'race-winner-uuid',
        email: 'race@example.com',
        createdAt: new Date('2026-03-01'),
        tokenVersion: 0
      })

      const result = await authenticateWithGoogle('mock-id-token')
      expect(result.user.id).toBe('race-winner-uuid')
      expect(result.isNewUser).toBe(false)
    })

    it('xử lý race condition P2002 khi email bị trùng lúc tạo: recheck sub không thấy, recheck email case-insensitive thấy → ném 409 conflict', async () => {
      verifyIdTokenMock.mockResolvedValueOnce({
        getPayload: () => ({
          sub: 'google-race-sub-2',
          email: 'race-conflict@example.com',
          email_verified: true,
          aud: MOCK_CLIENT_ID
        })
      })

      // 1. Ban đầu không thấy theo googleId
      prismaUserFindUniqueMock.mockResolvedValueOnce(null)
      // 2. Ban đầu không thấy theo email
      prismaUserFindFirstMock.mockResolvedValueOnce(null)
      // 3. create() gặp race condition P2002
      prismaUserCreateMock.mockRejectedValueOnce({ code: 'P2002' })
      // 4. Recheck sub: không thấy (không phải duplicate google request)
      prismaUserFindUniqueMock.mockResolvedValueOnce(null)
      // 5. Recheck email case-insensitive: thấy local user mới vừa tạo
      prismaUserFindFirstMock.mockResolvedValueOnce({
        id: 'race-local-user-id',
        googleId: null
      })

      await expect(authenticateWithGoogle('mock-id-token')).rejects.toThrow(
        GOOGLE_ACCOUNT_CONFLICT_ERROR
      )
    })
  })

  describe('3. Controller & HTTP Endpoint Integration', () => {
    const buildApp = () => {
      const app = express()
      app.use(express.json())
      app.use(cookieParser())
      app.post('/api/auth/google', validate(googleAuthSchema), googleAuth)
      return app
    }

    it('POST /api/auth/google thành công → trả về 201 cho tài khoản mới và thiết lập HttpOnly cookie', async () => {
      verifyIdTokenMock.mockResolvedValueOnce({
        getPayload: () => ({
          sub: 'new-google-sub',
          email: 'newbie@example.com',
          email_verified: true,
          aud: MOCK_CLIENT_ID
        })
      })

      prismaUserFindUniqueMock.mockResolvedValueOnce(null)
      prismaUserFindFirstMock.mockResolvedValueOnce(null)
      prismaUserCreateMock.mockResolvedValueOnce({
        id: 'newbie-id',
        email: 'newbie@example.com',
        createdAt: new Date('2026-04-01'),
        tokenVersion: 0
      })

      const app = buildApp()
      const res = await request(app)
        .post('/api/auth/google')
        .send({ credential: 'valid-google-id-token' })

      expect(res.status).toBe(201)
      expect(res.body.message).toBe('Đăng ký tài khoản Google thành công')
      expect(res.body.user.id).toBe('newbie-id')
      expect(res.body.user.email).toBe('newbie@example.com')

      // Kiểm tra Set-Cookie
      const cookies = res.headers['set-cookie'] as unknown as string[]
      expect(cookies).toBeDefined()
      const tokenCookie = cookies.find((c) => c.startsWith('token='))
      expect(tokenCookie).toBeDefined()
      expect(tokenCookie).toContain('HttpOnly')
      expect(tokenCookie).toContain('Path=/')
    })

    it('POST /api/auth/google thành công → trả về 200 cho tài khoản đã tồn tại', async () => {
      verifyIdTokenMock.mockResolvedValueOnce({
        getPayload: () => ({
          sub: 'existing-sub',
          email: 'returning@example.com',
          email_verified: true,
          aud: MOCK_CLIENT_ID
        })
      })

      prismaUserFindUniqueMock.mockResolvedValueOnce({
        id: 'returning-id',
        email: 'returning@example.com',
        createdAt: new Date('2026-04-01'),
        tokenVersion: 1
      })

      const app = buildApp()
      const res = await request(app)
        .post('/api/auth/google')
        .send({ credential: 'valid-returning-token' })

      expect(res.status).toBe(200)
      expect(res.body.message).toBe('Đăng nhập Google thành công')
      expect(res.body.user.id).toBe('returning-id')
    })

    it('POST /api/auth/google với credential rỗng → từ chối 400 Bad Request', async () => {
      const app = buildApp()
      const res = await request(app)
        .post('/api/auth/google')
        .send({ credential: '   ' })

      expect(res.status).toBe(400)
      expect(res.body.message).toBe('Dữ liệu không hợp lệ')
      expect(res.body.errors[0].message).toBe('Token Google không được để trống')
    })

    it('POST /api/auth/google khi gặp xung đột email → trả về 409 Conflict', async () => {
      verifyIdTokenMock.mockResolvedValueOnce({
        getPayload: () => ({
          sub: 'new-google-sub',
          email: 'conflict@example.com',
          email_verified: true,
          aud: MOCK_CLIENT_ID
        })
      })

      prismaUserFindUniqueMock.mockResolvedValueOnce(null)
      prismaUserFindFirstMock.mockResolvedValueOnce({
        id: 'local-user-id',
        googleId: null
      })

      const app = buildApp()
      const res = await request(app)
        .post('/api/auth/google')
        .send({ credential: 'conflict-token' })

      expect(res.status).toBe(409)
      expect(res.body.message).toContain('Email này đã được đăng ký bằng mật khẩu')
    })

    it('POST /api/auth/google khi token không hợp lệ → trả về 401 Unauthorized', async () => {
      verifyIdTokenMock.mockRejectedValueOnce(new Error('Invalid signature'))

      const app = buildApp()
      const res = await request(app)
        .post('/api/auth/google')
        .send({ credential: 'bad-token' })

      expect(res.status).toBe(401)
      expect(res.body.message).toContain('Xác thực Google ID Token thất bại')
    })

    it('POST /api/auth/google khi server chưa cấu hình GOOGLE_CLIENT_ID → trả về 500', async () => {
      delete process.env.GOOGLE_CLIENT_ID

      const app = buildApp()
      const res = await request(app)
        .post('/api/auth/google')
        .send({ credential: 'any-token' })

      expect(res.status).toBe(500)
      expect(res.body.message).toBe('Dịch vụ đăng nhập Google chưa được cấu hình')
    })

    it('Production Cookie: Thiết lập Secure=true, SameSite=None khi NODE_ENV=production', async () => {
      process.env.NODE_ENV = 'production'
      verifyIdTokenMock.mockResolvedValueOnce({
        getPayload: () => ({
          sub: 'prod-sub',
          email: 'prod@example.com',
          email_verified: true,
          aud: MOCK_CLIENT_ID
        })
      })

      prismaUserFindUniqueMock.mockResolvedValueOnce({
        id: 'prod-user-id',
        email: 'prod@example.com',
        createdAt: new Date('2026-05-01'),
        tokenVersion: 0
      })

      const app = buildApp()
      const res = await request(app)
        .post('/api/auth/google')
        .send({ credential: 'valid-prod-token' })

      expect(res.status).toBe(200)
      const cookies = res.headers['set-cookie'] as unknown as string[]
      const tokenCookie = cookies.find((c) => c.startsWith('token='))!
      expect(tokenCookie).toContain('HttpOnly')
      expect(tokenCookie).toContain('Secure')
      expect(tokenCookie).toMatch(/SameSite=None/i)
    })
  })

  describe('4. Regression: Password Authentication & Nullable PasswordHash Compatibility', () => {
    it('người dùng tạo tài khoản qua Google (passwordHash=null) không thể đăng nhập bằng form mật khẩu thông thường', async () => {
      prismaUserFindUniqueMock.mockResolvedValueOnce({
        id: 'google-only-user',
        email: 'google-only@example.com',
        passwordHash: null,
        tokenVersion: 0,
        createdAt: new Date()
      })

      await expect(
        loginUser('google-only@example.com', 'AnyGuessedPassword123')
      ).rejects.toThrow('Email hoặc mật khẩu không đúng')
    })

    it('người dùng có mật khẩu hợp lệ vẫn đăng nhập bình thường', async () => {
      const realPassword = 'ValidPassword123'
      const realHash = await bcrypt.hash(realPassword, 10)

      prismaUserFindUniqueMock.mockResolvedValueOnce({
        id: 'password-user',
        email: 'password-user@example.com',
        passwordHash: realHash,
        tokenVersion: 3,
        createdAt: new Date()
      })

      const result = await loginUser('password-user@example.com', realPassword)
      expect(result.user.id).toBe('password-user')
      expect(result.accessToken).toBeDefined()
    })
  })
})
