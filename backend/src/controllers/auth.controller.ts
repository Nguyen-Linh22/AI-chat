import { Request, Response } from 'express'
import {
  registerUser,
  loginUser,
  getCurrentUser,
  revokeUserSessions
} from '../services/auth.service.js'

const isProduction = () => process.env.NODE_ENV === 'production'

export const register = async (
  req: Request,
  res: Response
) => {
  try {
    const { email, password } = req.body

    const user = await registerUser(email, password)

    return res.status(201).json({
      message: 'Đăng ký tài khoản thành công',
      user
    })
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'Email đã được sử dụng'
    ) {
      return res.status(409).json({
        message: error.message
      })
    }

    console.error('Register error:', error)

    return res.status(500).json({
      message: 'Đã xảy ra lỗi khi đăng ký'
    })
  }
}

export const login = async (
  req: Request,
  res: Response
) => {
  try {
    const { email, password } = req.body

    const { user, accessToken } = await loginUser(
  email,
  password
)

    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: isProduction(),
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

return res.status(200).json({
  message: 'Đăng nhập thành công',
  user
})
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'Email hoặc mật khẩu không đúng'
    ) {
      return res.status(401).json({
        message: error.message
      })
    }

    console.error('Login error:', error)

    return res.status(500).json({
      message: 'Đã xảy ra lỗi khi đăng nhập'
    })
  }
}
export const me = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.userId

    if (!userId) {
      return res.status(401).json({
        message: 'Bạn chưa đăng nhập'
      })
    }

    const user = await getCurrentUser(userId)

    return res.status(200).json({
      user
    })
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'Không tìm thấy người dùng'
    ) {
      return res.status(404).json({
        message: error.message
      })
    }

    console.error('Get current user error:', error)

    return res.status(500).json({
      message: 'Đã xảy ra lỗi khi lấy thông tin người dùng'
    })
  }
}
export const logout = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.userId

    if (userId) {
      await revokeUserSessions(userId)
    }
  } catch (error) {
    console.error('Revoke user session error on logout:', error)
  }

  res.clearCookie('token', {
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'lax',
    path: '/'
  })

  return res.status(200).json({
    message: 'Đăng xuất thành công'
  })
}