import { OAuth2Client } from 'google-auth-library'
import { prisma } from '../lib/prisma.js'
import { createAccessToken } from './auth.service.js'
import { getGoogleClientId } from '../config/auth.config.js'

export interface VerifiedGoogleClaims {
  sub: string
  email: string
  emailVerified: boolean
}

export interface GoogleAuthResult {
  user: {
    id: string
    email: string
    createdAt: Date
  }
  accessToken: string
  isNewUser: boolean
}

export const GOOGLE_ACCOUNT_CONFLICT_ERROR =
  'Email này đã được đăng ký bằng mật khẩu. Vui lòng đăng nhập bằng mật khẩu hiện tại (tính năng liên kết tài khoản hiện chưa khả dụng).'

/**
 * Xác thực Google ID Token với thư viện google-auth-library chính thức.
 * Kiểm tra đầy đủ: chữ ký mật mã, issuer, hạn dùng (exp), audience (GOOGLE_CLIENT_ID),
 * sự tồn tại của sub (non-empty) và trạng thái email_verified = true.
 */
export const verifyGoogleIdToken = async (
  idToken: string,
  clientId?: string,
  customClient?: OAuth2Client
): Promise<VerifiedGoogleClaims> => {
  const effectiveClientId = clientId || getGoogleClientId()

  if (!effectiveClientId) {
    throw new Error('GOOGLE_CLIENT_ID_MISSING')
  }

  const client = customClient || new OAuth2Client(effectiveClientId)

  let ticket
  try {
    ticket = await client.verifyIdToken({
      idToken,
      audience: effectiveClientId
    })
  } catch (error: any) {
    throw new Error('Xác thực Google ID Token thất bại: Chữ ký hoặc thời hạn token không hợp lệ')
  }

  const payload = ticket?.getPayload()
  if (!payload) {
    throw new Error('Google ID Token không chứa dữ liệu payload')
  }

  const { sub, email, email_verified, aud } = payload

  if (!sub || typeof sub !== 'string' || sub.trim() === '') {
    throw new Error('Google ID Token không chứa sub hợp lệ')
  }

  if (!email || typeof email !== 'string' || email.trim() === '') {
    throw new Error('Google ID Token không chứa email hợp lệ')
  }

  if (email_verified !== true) {
    throw new Error('Email Google chưa được xác minh')
  }

  if (aud !== effectiveClientId) {
    throw new Error('Google ID Token audience không khớp với Client ID')
  }

  return {
    sub: sub.trim(),
    email: email.trim().toLowerCase(),
    emailVerified: email_verified
  }
}

/**
 * Xử lý xác thực người dùng Google:
 * 1. Xác thực Google ID Token.
 * 2. Tìm người dùng theo googleId duy nhất.
 * 3. Nếu tìm thấy: đăng nhập thành công và cấp JWT phiên làm việc (Idempotent).
 * 4. Nếu chưa có tài khoản liên kết googleId:
 *    - Kiểm tra xem email đã tồn tại trong hệ thống chưa.
 *    - Nếu email đã tồn tại (đăng ký qua email/mật khẩu): Từ chối liên kết ngầm dựa trên email (Safe Conflict)
 *      nhằm ngăn chặn Account Takeover, yêu cầu người dùng đăng nhập bằng mật khẩu trước.
 *    - Nếu email chưa tồn tại: Tạo tài khoản mới an toàn (passwordHash = null, googleId = sub).
 */
export const authenticateWithGoogle = async (
  idToken: string,
  clientId?: string,
  customClient?: OAuth2Client
): Promise<GoogleAuthResult> => {
  const claims = await verifyGoogleIdToken(idToken, clientId, customClient)

  // 1. Tìm user theo googleId duy nhất
  const userByGoogleId = await prisma.user.findUnique({
    where: {
      googleId: claims.sub
    },
    select: {
      id: true,
      email: true,
      createdAt: true,
      tokenVersion: true
    }
  })

  if (userByGoogleId) {
    const accessToken = createAccessToken(userByGoogleId.id, userByGoogleId.tokenVersion)
    return {
      user: {
        id: userByGoogleId.id,
        email: userByGoogleId.email,
        createdAt: userByGoogleId.createdAt
      },
      accessToken,
      isNewUser: false
    }
  }

  // 2. Kiểm tra xung đột email không phân biệt chữ hoa/thường (case-insensitive) với tài khoản mật khẩu hiện có
  const existingUserByEmail = await prisma.user.findFirst({
    where: {
      email: {
        equals: claims.email,
        mode: 'insensitive'
      }
    },
    select: {
      id: true,
      googleId: true
    }
  })

  if (existingUserByEmail) {
    throw new Error(GOOGLE_ACCOUNT_CONFLICT_ERROR)
  }

  // 3. Tạo tài khoản Google mới an toàn (idempotent, passwordHash = null)
  try {
    const newUser = await prisma.user.create({
      data: {
        email: claims.email,
        googleId: claims.sub,
        passwordHash: null
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
        tokenVersion: true
      }
    })

    const accessToken = createAccessToken(newUser.id, newUser.tokenVersion)

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        createdAt: newUser.createdAt
      },
      accessToken,
      isNewUser: true
    }
  } catch (error: any) {
    // Xử lý race condition nếu có 2 request đồng thời tạo cùng 1 googleId hoặc email
    if (error?.code === 'P2002') {
      // Recheck Google sub trước (idempotent duplicate request)
      const raceUser = await prisma.user.findUnique({
        where: {
          googleId: claims.sub
        },
        select: {
          id: true,
          email: true,
          createdAt: true,
          tokenVersion: true
        }
      })

      if (raceUser) {
        const accessToken = createAccessToken(raceUser.id, raceUser.tokenVersion)
        return {
          user: {
            id: raceUser.id,
            email: raceUser.email,
            createdAt: raceUser.createdAt
          },
          accessToken,
          isNewUser: false
        }
      }

      // Recheck email không phân biệt hoa thường nếu có local user vừa tạo tranh chấp
      const raceUserByEmail = await prisma.user.findFirst({
        where: {
          email: {
            equals: claims.email,
            mode: 'insensitive'
          }
        },
        select: {
          id: true,
          googleId: true
        }
      })

      if (raceUserByEmail) {
        throw new Error(GOOGLE_ACCOUNT_CONFLICT_ERROR)
      }
    }
    throw error
  }
}
