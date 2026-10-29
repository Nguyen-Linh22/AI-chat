import { Request, Response } from 'express'
import {
  registerUser,
  loginUser,
  getCurrentUser,
  revokeUserSessions
} from '../services/auth.service.js'
import { authenticateWithGoogle } from '../services/google-auth.service.js'
import {
  getAuthCookieOptions,
  getAuthClearCookieOptions
} from '../config/cookie.config.js'

export { getAuthCookieOptions, getAuthClearCookieOptions }

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

    res.cookie('token', accessToken, getAuthCookieOptions())

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

  res.clearCookie('token', getAuthClearCookieOptions())

  return res.status(200).json({
    message: 'Đăng xuất thành công'
  })
}

export const googleAuth = async (
  req: Request,
  res: Response
) => {
  try {
    const { credential } = req.body

    const { user, accessToken, isNewUser } = await authenticateWithGoogle(credential)

    res.cookie('token', accessToken, getAuthCookieOptions())

    return res.status(isNewUser ? 201 : 200).json({
      message: isNewUser ? 'Đăng ký tài khoản Google thành công' : 'Đăng nhập Google thành công',
      user
    })
  } catch (error: any) {
    if (error?.message === 'GOOGLE_CLIENT_ID_MISSING') {
      console.error('Google Auth configuration error: GOOGLE_CLIENT_ID is not configured on server')
      return res.status(500).json({
        message: 'Dịch vụ đăng nhập Google chưa được cấu hình'
      })
    }

    if (error?.message?.includes('Email này đã được đăng ký bằng mật khẩu')) {
      return res.status(409).json({
        message: error.message
      })
    }

    if (
      error?.message?.includes('Google ID Token') ||
      error?.message?.includes('chưa được xác minh') ||
      error?.message?.includes('audience không khớp') ||
      error?.message?.includes('không hợp lệ')
    ) {
      return res.status(401).json({
        message: error.message
      })
    }

    console.error('Google Auth unexpected error:', {
      name: error?.name,
      message: error?.message,
      code: error?.code
    })
    return res.status(500).json({
      message: 'Đã xảy ra lỗi khi xác thực với Google'
    })
  }
}
