import { useRef, useState } from 'react'
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
  const [isShaking, setIsShaking] = useState(false)
  const summaryRef = useRef<HTMLDivElement>(null)

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

  return (
    <AuthLayout
      mode="register"
      banner={<AuthOverlayBanner mode="register" />}
      bannerPosition="right"
      shake={isShaking}
    >
      <AuthModeSwitch mode="register" />

      <header className="mt-5 sm:mt-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#86EFAC]">
          Tạo tài khoản mới
        </p>
        <h1 className="mt-2 text-[26px] font-bold tracking-tight text-white sm:text-[30px]">
          Đăng ký
        </h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-gray-400">
          Tạo tài khoản và bắt đầu khám phá trợ lý AI của riêng bạn.
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
          disabled={loading}
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
            disabled={loading}
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
          disabled={loading}
          showPasswordToggle
          showPassword={showConfirmPassword}
          onTogglePassword={() => setShowConfirmPassword((prev) => !prev)}
        />

        <AuthSubmitButton
          tone="register"
          label="Đăng ký"
          loadingLabel="Đang đăng ký..."
          loading={loading}
        />

        <p className="sr-only" role="status">
          {loading ? 'Đang đăng ký...' : ''}
        </p>
      </form>

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
            className="mt-px h-3.5 w-3.5 shrink-0"
            aria-hidden="true"
          >
            <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <span>Mật khẩu được băm một chiều trước khi lưu trữ.</span>
        </p>
      </div>
    </AuthLayout>
  )
}

export default RegisterPage
