import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { AuthAlert } from '../components/auth/AuthAlert'
import '../components/auth/LoginFormDesign.css'
import { apiClient } from '../services/apiClient'
import { loginWithGoogle } from '../services/authService'
import {
  getGoogleClientId,
  loadGoogleScript,
  initGoogleIdentityServices,
  renderGoogleButton,
  registerGoogleCredentialCallback,
} from '../services/googleAuth'
import { getChats } from '../services/chatService'
import { useAuthStore } from '../stores/authStore'
import { useChatStore } from '../stores/chatStore'
import { useMessageStore } from '../stores/messageStore'
import {
  focusField,
  validateEmail,
  validatePassword,
  type FieldError,
} from '../utils/validation'

function LoginPage() {
  const navigate = useNavigate()

  const setUser = useAuthStore((state) => state.setUser)
  const setChats = useChatStore((state) => state.setChats)
  const setCurrentChatId = useChatStore((state) => state.setCurrentChatId)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [touched, setTouched] = useState({ email: false, password: false })
  const [dirty, setDirty] = useState({ email: false, password: false })
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [isShaking, setIsShaking] = useState(false)
  const summaryRef = useRef<HTMLDivElement>(null)
  const googleButtonRef = useRef<HTMLDivElement>(null)
  const isMountedRef = useRef(true)

  const emailError = validateEmail(email)
  const passwordError = validatePassword(password)

  const visibleEmailError =
    submitted || (touched.email && dirty.email) ? emailError : undefined
  const visiblePasswordError =
    submitted || (touched.password && dirty.password)
      ? passwordError
      : undefined

  const invalidFields: FieldError[] = []
  if (emailError) invalidFields.push({ id: 'email', label: 'Email' })
  if (passwordError) invalidFields.push({ id: 'password', label: 'Mật khẩu' })

  const triggerShake = () => {
    setIsShaking(true)
    window.setTimeout(() => setIsShaking(false), 360)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setServerError('')

    if (invalidFields.length > 0) {
      flushSync(() => setSubmitted(true))
      triggerShake()

      if (invalidFields.length > 1) {
        summaryRef.current?.focus()
      } else {
        focusField(invalidFields[0].id)
      }
      return
    }

    try {
      setLoading(true)

      const response = await apiClient.post('/api/auth/login', {
        email: email.trim(),
        password,
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMsg = data.message || 'Đăng nhập thất bại'
        setServerError(errorMsg)
        triggerShake()
        return
      }

      setUser(data.user)
      useMessageStore.getState().clearAll()

      const chats = await getChats()
      setChats(chats)
      setCurrentChatId?.(null)

      navigate('/chat')
    } catch {
      setServerError('Không thể kết nối đến server')
      triggerShake()
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleCredential = useCallback(
    async (credential: string) => {
      if (!isMountedRef.current) return
      try {
        setGoogleLoading(true)
        setServerError('')

        const data = await loginWithGoogle(credential)
        if (!isMountedRef.current) return

        setUser(data.user)
        useMessageStore.getState().clearAll()

        const chats = await getChats()
        if (!isMountedRef.current) return
        setChats(chats)
        setCurrentChatId?.(null)

        navigate('/chat')
      } catch (err: any) {
        if (!isMountedRef.current) return
        setServerError(err.message || 'Đăng nhập Google thất bại')
        triggerShake()
      } finally {
        if (isMountedRef.current) {
          setGoogleLoading(false)
        }
      }
    },
    [navigate, setChats, setCurrentChatId, setUser]
  )

  useEffect(() => {
    isMountedRef.current = true
    const clientId = getGoogleClientId()
    if (!clientId) return

    const unregister = registerGoogleCredentialCallback(async (response) => {
      if (!isMountedRef.current) return
      if (response?.credential) {
        await handleGoogleCredential(response.credential)
      } else {
        setServerError('Không nhận được token xác thực từ Google. Vui lòng thử lại.')
        triggerShake()
      }
    })

    loadGoogleScript()
      .then(() => {
        if (!isMountedRef.current || !googleButtonRef.current) return

        initGoogleIdentityServices({
          clientId,
        })

        renderGoogleButton(googleButtonRef.current, {
          theme: 'filled_black',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          width: googleButtonRef.current.clientWidth || 280,
        })
      })
      .catch(() => {
        if (!isMountedRef.current) return
        setServerError('Không thể tải dịch vụ xác thực Google. Vui lòng thử lại sau.')
      })

    return () => {
      isMountedRef.current = false
      unregister()
    }
  }, [handleGoogleCredential])

  // Đồng bộ màu nền #212121 lên body để tránh khoảng hở / viền khi zoom hoặc overscroll
  useEffect(() => {
    const originalBg = document.body.style.backgroundColor
    document.body.style.backgroundColor = '#212121'
    return () => {
      document.body.style.backgroundColor = originalBg
    }
  }, [])

  return (
    <div
      data-testid="login-page-root"
      className="login-page-root min-h-screen min-h-[100dvh] w-full flex flex-col justify-between items-center text-white relative overflow-x-hidden"
      style={{ backgroundColor: '#212121' }}
    >
      {/* Centered Login Card exactly matching supplied design */}
      <main className="login-form-wrapper flex-1 flex items-center justify-center my-auto py-6 px-4 w-full">
        <div className={`container ${isShaking ? 'shake' : ''}`}>
          <div className="login-box">
            <form className="form" noValidate onSubmit={handleSubmit} aria-busy={loading || googleLoading}>
              {/* User Avatar Logo from Reference Design */}
              <div className="logo" aria-hidden="true" />

              {/* Header Title */}
              <h1 className="header">Welcome Back!</h1>

              {/* Accessibility Error Alerts */}
              {submitted && invalidFields.length > 1 && (
                <div className="w-full">
                  <AuthAlert
                    ref={summaryRef}
                    tabIndex={-1}
                    title="Vui lòng kiểm tra lại thông tin"
                    items={invalidFields}
                    onItemClick={focusField}
                  />
                </div>
              )}

              {serverError && (
                <div className="w-full">
                  <AuthAlert title="Không thể đăng nhập" message={serverError} />
                </div>
              )}

              {/* Email Input */}
              <div className="input-field-wrapper">
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <div className="input-container">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Email"
                    aria-label="Email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value)
                      setDirty((prev) => (prev.email ? prev : { ...prev, email: true }))
                    }}
                    onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                    autoComplete="email"
                    inputMode="email"
                    required
                    autoFocus
                    disabled={loading || googleLoading}
                    aria-invalid={Boolean(visibleEmailError)}
                    aria-describedby={visibleEmailError ? 'email-error' : undefined}
                    className="input"
                  />
                </div>
                {visibleEmailError && (
                  <p id="email-error" className="input-error-msg">
                    {visibleEmailError}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div className="input-field-wrapper">
                <label htmlFor="password" className="sr-only">
                  Mật khẩu
                </label>
                <div className="input-container">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    aria-label="Mật khẩu"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value)
                      setDirty((prev) => (prev.password ? prev : { ...prev, password: true }))
                    }}
                    onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                    autoComplete="current-password"
                    required
                    disabled={loading || googleLoading}
                    aria-invalid={Boolean(visiblePasswordError)}
                    aria-describedby={visiblePasswordError ? 'password-error' : undefined}
                    className="input"
                    style={{ paddingRight: '36px' }}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="password-toggle"
                  >
                    {showPassword ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {visiblePasswordError && (
                  <p id="password-error" className="input-error-msg">
                    {visiblePasswordError}
                  </p>
                )}
              </div>

              {/* Primary Submit Button */}
              <button
                type="submit"
                disabled={loading || googleLoading}
                aria-busy={loading}
                aria-label="Đăng nhập"
                className="button sign-in"
              >
                {loading ? 'Đang đăng nhập...' : 'Sign In'}
              </button>

              {/* Official Google Sign-In Slot */}
              <div
                ref={googleButtonRef}
                data-testid="google-signin-button"
                aria-label="Tiếp tục với Google"
                className="google-sign-in-slot"
              />

              {/* Footer with Registration and Password Links */}
              <p className="footer">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  role="button"
                  aria-label="Đăng ký tài khoản - Sign up, it's free!"
                  className="link"
                  onClick={() => navigate('/register')}
                >
                  Sign up, it's free!
                </Link>
                <br />
                <button
                  type="button"
                  onClick={() => setServerError('Tính năng quên mật khẩu đang được phát triển.')}
                  className="link"
                >
                  Forgot password?
                </button>
              </p>
            </form>
          </div>
        </div>
      </main>

      {/* Bottom Security Note */}
      <footer className="relative z-20 pb-4 text-center text-[11px] text-gray-400 bg-transparent">
        <span>Phiên đăng nhập được bảo vệ bởi HttpOnly Cookie & TLS 1.3.</span>
      </footer>
    </div>
  )
}

export default LoginPage
