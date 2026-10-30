import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { AuthAlert } from '../components/auth/AuthAlert'
import { AuthLayout } from '../components/auth/AuthLayout'
import { AuthModeSwitch } from '../components/auth/AuthModeSwitch'
import { AuthOverlayBanner } from '../components/auth/AuthOverlayBanner'
import { AuthSubmitButton } from '../components/auth/AuthSubmitButton'
import { FloatingInput } from '../components/auth/FloatingInput'
import { PasswordStrengthMeter } from '../components/auth/PasswordStrengthMeter'
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
          shape: 'rectangular',
          width: googleButtonRef.current.clientWidth || 320,
        })
      })
      .catch(() => {
        if (!isMountedRef.current) return
      })

    return () => {
      isMountedRef.current = false
      unregister()
    }
  }, [handleGoogleCredential])

  return (
    <AuthLayout
      mode="register"
      banner={<AuthOverlayBanner mode="register" />}
      bannerPosition="right"
      shake={isShaking}
    >
      <AuthModeSwitch mode="register" />

      <header className="mt-5 sm:mt-6">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#86EFAC]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
          Tạo tài khoản mới
        </div>
        <h1 className="mt-2 text-[26px] font-extrabold tracking-tight text-white sm:text-[30px]">
          Đăng ký
        </h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-gray-400">
          Tạo tài khoản và bắt đầu khám phá trợ lý AI của riêng bạn.
        </p>
      </header>

      <form
        noValidate
        onSubmit={handleSubmit}
        className="mt-5 space-y-3.5 sm:mt-6 sm:space-y-4"
        aria-busy={loading || googleLoading}
      >
        {submitted && invalidFields.length > 1 && (
          <AuthAlert
            ref={summaryRef}
            tabIndex={-1}
            title="Vui lòng kiểm tra lại thông tin"
            items={invalidFields}
            onItemClick={focusField}
          />
        )}

        {serverError && (
          <AuthAlert title="Không thể đăng ký" message={serverError} />
        )}

        <FloatingInput
          id="email"
          name="email"
          label="Email"
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            setDirty((prev) => (prev.email ? prev : { ...prev, email: true }))
          }}
          onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
          autoComplete="email"
          inputMode="email"
          leadingIcon="mail"
          focusAccent="green"
          required
          autoFocus
          enterKeyHint="next"
          error={visibleEmailError}
          disabled={loading || googleLoading}
        />

        <div>
          <FloatingInput
            id="password"
            name="new-password"
            label="Mật khẩu"
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
              setDirty((prev) => (prev.password ? prev : { ...prev, password: true }))
            }}
            onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
            autoComplete="new-password"
            leadingIcon="lock"
            focusAccent="green"
            required
            enterKeyHint="next"
            error={visiblePasswordError}
            hint={password.length === 0 ? 'Tối thiểu 8 ký tự.' : undefined}
            disabled={loading || googleLoading}
            showPasswordToggle
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword((prev) => !prev)}
          />

          <PasswordStrengthMeter password={password} />
        </div>

        <FloatingInput
          id="confirmPassword"
          name="confirm-password"
          label="Xác nhận mật khẩu"
          type="password"
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
          leadingIcon="lock"
          focusAccent="green"
          required
          enterKeyHint="done"
          error={visibleConfirmPasswordError}
          disabled={loading || googleLoading}
          showPasswordToggle
          showPassword={showConfirmPassword}
          onTogglePassword={() => setShowConfirmPassword((prev) => !prev)}
        />

        <AuthSubmitButton
          tone="register"
          label="Đăng ký"
          loadingLabel={googleLoading ? 'Đang kết nối...' : 'Đang đăng ký...'}
          loading={loading || googleLoading}
        />

        <p className="sr-only" role="status">
          {loading ? 'Đang đăng ký...' : ''}
        </p>
      </form>

      {/* Alternative Social Divider */}
      <div className="relative my-4 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative bg-[#0B0F18] px-3 text-[11px] font-medium uppercase tracking-wider text-gray-400">
          Hoặc tiếp tục với
        </div>
      </div>

      {/* Social Sign-in Options */}
      <div className="flex flex-col gap-2.5">
        <div
          ref={googleButtonRef}
          data-testid="google-signin-button"
          aria-label="Tiếp tục bằng tài khoản Google"
          className="flex justify-center w-full min-h-[40px] [&>div]:!w-full [&_iframe]:!w-full overflow-hidden rounded-xl"
        />

        <button
          type="button"
          aria-label="Tiếp tục bằng tài khoản GitHub"
          onClick={() => {
            setServerError('Đăng ký GitHub sẽ sớm được kích hoạt trong phiên bản tiếp theo.')
          }}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-gray-200 transition-colors duration-200 hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          <svg className="h-4 w-4 fill-currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z"
            />
          </svg>
          <span>Tiếp tục với GitHub</span>
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:mt-5 sm:gap-4">
        <p className="text-center text-[13px] text-gray-400">
          Đã có tài khoản?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="-my-1.5 rounded py-1.5 font-semibold text-[#4ADE80] underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4ADE80]/70"
          >
            Đăng nhập
          </button>
        </p>

        <p className="flex items-start justify-center gap-1.5 text-center text-[11px] leading-relaxed text-gray-400">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mt-px h-3.5 w-3.5 shrink-0 text-emerald-400"
            aria-hidden="true"
          >
            <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <span>Mật khẩu được băm một chiều an toàn bằng chuẩn Bcrypt.</span>
        </p>
      </div>
    </AuthLayout>
  )
}

export default RegisterPage
