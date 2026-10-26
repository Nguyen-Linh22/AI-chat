import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { AuthAlert } from '../components/auth/AuthAlert'
import { AuthLayout } from '../components/auth/AuthLayout'
import { AuthModeSwitch } from '../components/auth/AuthModeSwitch'
import { AuthOverlayBanner } from '../components/auth/AuthOverlayBanner'
import { AuthSubmitButton } from '../components/auth/AuthSubmitButton'
import { FloatingInput } from '../components/auth/FloatingInput'
import { apiClient } from '../services/apiClient'
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
  const [isShaking, setIsShaking] = useState(false)
  const summaryRef = useRef<HTMLDivElement>(null)

  const emailError = validateEmail(email)
  const passwordError = validatePassword(password)

  // Only surface a field error after the user has edited that field (or tried
  // to submit), so the autofocused empty email never starts out "invalid".
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

      // Xóa toàn bộ tin nhắn & cache RAM của tài khoản trước (nếu có)
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

  return (
    <AuthLayout
      mode="login"
      banner={<AuthOverlayBanner mode="login" />}
      bannerPosition="left"
      shake={isShaking}
    >
      <AuthModeSwitch mode="login" />

      <header className="mt-5 sm:mt-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#FCA5A5]">
          AI Chat Workspace
        </p>
        <h1 className="mt-2 text-[26px] font-bold tracking-tight text-white sm:text-[30px]">
          Đăng nhập
        </h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-gray-400">
          Tiếp tục nơi bạn đã dừng lại và mở các cuộc trò chuyện đã lưu.
        </p>
      </header>

      <form noValidate onSubmit={handleSubmit} className="mt-5 space-y-3.5 sm:mt-6 sm:space-y-4" aria-busy={loading}>
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
          <AuthAlert title="Không thể đăng nhập" message={serverError} />
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
          focusAccent="red"
          required
          autoFocus
          enterKeyHint="next"
          error={visibleEmailError}
          disabled={loading}
        />

        <FloatingInput
          id="password"
          name="password"
          label="Mật khẩu"
          type="password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value)
            setDirty((prev) => (prev.password ? prev : { ...prev, password: true }))
          }}
          onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
          autoComplete="current-password"
          leadingIcon="lock"
          focusAccent="red"
          required
          enterKeyHint="go"
          error={visiblePasswordError}
          disabled={loading}
          showPasswordToggle
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword((prev) => !prev)}
        />

        <AuthSubmitButton
          tone="login"
          label="Đăng nhập"
          loadingLabel="Đang đăng nhập..."
          loading={loading}
        />

        <p className="sr-only" role="status">
          {loading ? 'Đang đăng nhập...' : ''}
        </p>
      </form>

      <div className="mt-4 flex flex-col gap-3 sm:mt-5 sm:gap-4">
        <p className="text-center text-[13px] text-gray-400">
          Chưa có tài khoản?{' '}
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="-my-1.5 rounded py-1.5 font-semibold text-[#F87171] underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F87171]/70"
          >
            Đăng ký
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
            className="mt-px h-3.5 w-3.5 shrink-0"
            aria-hidden="true"
          >
            <path d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
          <span>Phiên đăng nhập được bảo vệ bằng cookie bảo mật.</span>
        </p>
      </div>
    </AuthLayout>
  )
}

export default LoginPage
