import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { prisma } from '../lib/prisma.js'
import { BCRYPT_SALT_ROUNDS, JWT_EXPIRES_IN } from '../config/auth.config.js'
const createAccessToken = (userId: string, tokenVersion: number) => {
  const jwtSecret = process.env.JWT_SECRET

  if (!jwtSecret) {
    throw new Error('JWT_SECRET chưa được cấu hình')
  }

  return jwt.sign(
    {
      userId,
      tokenVersion
    },
    jwtSecret,
    {
      expiresIn: JWT_EXPIRES_IN
    }
  )
}

export const registerUser = async (
  email: string,
  password: string
) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email
    },
    select: {
      id: true
    }
  })

  if (existingUser) {
    throw new Error('Email đã được sử dụng')
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS)

  try {
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash
      },
      select: {
        id: true,
        email: true,
        createdAt: true
      }
    })

    return user
  } catch (error: any) {
    if (error?.code === 'P2002') {
      throw new Error('Email đã được sử dụng')
    }
    throw error
  }
}
// Dummy hash hợp lệ để chạy bcrypt.compare() khi email không tồn tại,
// đảm bảo thời gian phản hồi đồng nhất nhằm ngăn chặn Side-Channel Timing Attack
const DUMMY_PASSWORD_HASH = bcrypt.hashSync(
  '__anti_timing_dummy_password__',
  BCRYPT_SALT_ROUNDS
)

export const loginUser = async (
  email: string,
  password: string
) => {
  const user = await prisma.user.findUnique({
    where: {
      email
    },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      tokenVersion: true,
      createdAt: true
    }
  })

  // Nếu user không tồn tại, vẫn thực hiện bcrypt.compare với dummy hash
  const hashToCompare = user ? user.passwordHash : DUMMY_PASSWORD_HASH
  const isPasswordCorrect = await bcrypt.compare(
    password,
    hashToCompare
  )

  if (!user || !isPasswordCorrect) {
    throw new Error('Email hoặc mật khẩu không đúng')
  }

  const accessToken = createAccessToken(user.id, user.tokenVersion)

    return {
        user: {
            id: user.id,
            email: user.email,
            createdAt: user.createdAt
        },
        accessToken
    }
}
export const getCurrentUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      id: true,
      email: true,
      createdAt: true
    }
  })

  if (!user) {
    throw new Error('Không tìm thấy người dùng')
  }

  return user
}

export const revokeUserSessions = async (userId: string) => {
  await prisma.user.update({
    where: {
      id: userId
    },
    data: {
      tokenVersion: {
        increment: 1
      }
    }
  })
}