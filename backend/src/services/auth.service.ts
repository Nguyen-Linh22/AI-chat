import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client.js'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!
})

const prisma = new PrismaClient({
  adapter
})
const createAccessToken = (userId: string) => {
  const jwtSecret = process.env.JWT_SECRET

  if (!jwtSecret) {
    throw new Error('JWT_SECRET chưa được cấu hình')
  }

  return jwt.sign(
    {
      userId
    },
    jwtSecret,
    {
      expiresIn: '7d'
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
    }
  })

  if (existingUser) {
    throw new Error('Email đã được sử dụng')
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash
    }
  })

  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt
  }
}
export const loginUser = async (
  email: string,
  password: string
) => {
  const user = await prisma.user.findUnique({
    where: {
      email
    }
  })

  if (!user) {
    throw new Error('Email hoặc mật khẩu không đúng')
  }

  const isPasswordCorrect = await bcrypt.compare(
    password,
    user.passwordHash
  )

  if (!isPasswordCorrect) {
    throw new Error('Email hoặc mật khẩu không đúng')
  }

  const accessToken = createAccessToken(user.id)

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
    }
  })

  if (!user) {
    throw new Error('Không tìm thấy người dùng')
  }

  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt
  }
}