import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { AuthAlert } from '../components/auth/AuthAlert'
import { PasswordStrengthMeter } from '../components/auth/PasswordStrengthMeter'
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
  PASSWORD_MIN_LENGTH,
  focusField,
  validateConfirmPassword,
  validateEmail,
  validatePassword,
  type FieldError,
} from '../utils/validation'

function RegisterPage() {
  const navigate = useNavigate()

  const setUser = useAuthStore((state) => state.setUser)
  const setChats = useChatStore((state) => state.setChats)
  const setCurrentChatId = useChatStore((state) => state.setCurrentChatId)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [touched, setTouched] = useState({
    email: false,
    password: false,
    confirmPassword: false,
  })
  const [dirty, setDirty] = useState({
    email: false,
    password: false,
    confirmPassword: false,
  })
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [isShaking, setIsShaking] = useState(false)
  const summaryRef = useRef<HTMLDivElement>(null)
  const googleButtonRef = useRef<HTMLDivElement>(null)
  const isMountedRef = useRef(true)

  const emailError = validateEmail(email)
  const passwordError = validatePassword(password, { minLength: PASSWORD_MIN_LENGTH })
  const confirmPasswordError = validateConfirmPassword(password, confirmPassword)

  // Errors appear only after the user edited that field (or tried to submit),
  // so autofocus/blur alone never marks an untouched field as invalid.
  const visibleEmailError =
    submitted || (touched.email && dirty.email) ? emailError : undefined
  const visiblePasswordError =
    submitted || (touched.password && dirty.password)
      ? passwordError
      : undefined
  const visibleConfirmPasswordError =
    submitted || (touched.confirmPassword && dirty.confirmPassword)
      ? confirmPasswordError
      : undefined

  const invalidFields: FieldError[] = []
  if (emailError) invalidFields.push({ id: 'email', label: 'Email' })
  if (passwordError) invalidFields.push({ id: 'password', label: 'Mật khẩu' })
  if (confirmPasswordError) {
    invalidFields.push({ id: 'confirmPassword', label: 'Xác nhận mật khẩu' })
  }

  const triggerShake = () => {
    setIsShaking(true)
    window.setTimeout(() => setIsShaking(false), 360)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setServerError('')

    if (invalidFields.length > 0) {
      // Render the inline errors first, then move focus to the best target.
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

      const response = await apiClient.post('/api/auth/register', {
        email: email.trim(),
        password,
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMsg = data.message || 'Đăng ký thất bại'
        setServerError(errorMsg)
        triggerShake()
        return
      }

      navigate('/login')
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
        setServerError(err.message || 'Đăng ký Google thất bại')
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
          text: 'signup_with',
          shape: 'pill',
          width: googleButtonRef.current.clientWidth || 320,
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
      data-testid="register-page-root"
      className="register-page-root min-h-screen min-h-[100dvh] w-full flex flex-col justify-between items-center text-white relative overflow-x-hidden"
      style={{ backgroundColor: '#212121' }}
    >
      {/* Centered Registration Card matching Login Page Visual Style */}
      <main className="login-form-wrapper register-form-wrapper flex-1 flex items-center justify-center my-auto py-6 px-4 w-full">
        <div className={`container register-container ${isShaking ? 'shake' : ''}`}>
          <div className="login-box register-box">
            <form className="form" noValidate onSubmit={handleSubmit} aria-busy={loading || googleLoading}>
              {/* Decorative Avatar Logo */}
              <div className="logo" aria-hidden="true" />

              {/* Header Title & Subtitle */}
              <h1 className="header">Create Account</h1>
              <p className="sub-header">Create your account and start your AI journey.</p>

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
                  <AuthAlert title="Không thể đăng ký" message={serverError} />
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
                    name="new-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    aria-label="Mật khẩu"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value)
                      setDirty((prev) => (prev.password ? prev : { ...prev, password: true }))
                    }}
                    onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                    autoComplete="new-password"
                    required
                    disabled={loading || googleLoading}
                    aria-invalid={Boolean(visiblePasswordError)}
                    aria-describedby={
                      visiblePasswordError
                        ? 'password-error'
                        : password.length === 0
                        ? 'password-hint'
                        : undefined
                    }
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
                {visiblePasswordError ? (
                  <p id="password-error" className="input-error-msg">
                    {visiblePasswordError}
                  </p>
                ) : password.length === 0 ? (
                  <p id="password-hint" className="text-[11px] text-gray-400 pl-1">
                    Tối thiểu 8 ký tự.
                  </p>
                ) : null}

                {/* Password Strength Meter */}
                <PasswordStrengthMeter password={password} />
              </div>

              {/* Confirm Password Input */}
              <div className="input-field-wrapper">
                <label htmlFor="confirmPassword" className="sr-only">
                  Xác nhận mật khẩu
                </label>
                <div className="input-container">
                  <input
                    id="confirmPassword"
                    name="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm Password"
                    aria-label="Xác nhận mật khẩu"
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value)
                      setDirty((prev) =>
                        prev.confirmPassword ? prev : { ...prev, confirmPassword: true }
                      )
                    }}
                    onBlur={() =>
                      setTouched((prev) => ({ ...prev, confirmPassword: true }))
                    }
                    autoComplete="new-password"
                    required
                    disabled={loading || googleLoading}
                    aria-invalid={Boolean(visibleConfirmPasswordError)}
                    aria-describedby={visibleConfirmPasswordError ? 'confirm-password-error' : undefined}
                    className="input"
                    style={{ paddingRight: '36px' }}
                  />
                  <button
                    type="button"
                    aria-label={showConfirmPassword ? 'Ẩn xác nhận mật khẩu' : 'Hiện xác nhận mật khẩu'}
                    aria-pressed={showConfirmPassword}
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="password-toggle"
                  >
                    {showConfirmPassword ? (
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
                {visibleConfirmPasswordError && (
                  <p id="confirm-password-error" className="input-error-msg">
                    {visibleConfirmPasswordError}
                  </p>
                )}
              </div>

              {/* Primary Submit Button */}
              <button
                type="submit"
                disabled={loading || googleLoading}
                aria-busy={loading}
                aria-label="Đăng ký tài khoản - Create Account"
                className="button sign-in"
              >
                {loading ? 'Đang đăng ký...' : 'Create Account'}
              </button>

              {/* Official Google Sign-In Slot */}
              <div
                ref={googleButtonRef}
                data-testid="google-signin-button"
                aria-label="Tiếp tục bằng tài khoản Google"
                className="google-sign-in-slot"
              />

              {/* Footer with Login Navigation */}
              <p className="footer">
                Already have an account?{' '}
                <Link
                  to="/login"
                  role="button"
                  aria-label="Đã có tài khoản? Đăng nhập - Sign in"
                  className="link"
                  onClick={() => navigate('/login')}
                >
                  Sign in
                </Link>
              </p>
            </form>
          </div>
        </div>
      </main>

      {/* Bottom Security Note */}
      <footer className="relative z-20 pb-4 text-center text-[11px] text-gray-400 bg-transparent">
        <span>Mật khẩu được băm một chiều an toàn bằng chuẩn Bcrypt.</span>
      </footer>
    </div>
  )
}

export default RegisterPage
