import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthOverlayBanner } from '../components/auth/AuthOverlayBanner'
import { AuthPageBackground } from '../components/auth/AuthPageBackground'
import { FloatingInput } from '../components/auth/FloatingInput'
import { BRAND_COLORS } from '../constants/theme'
import { apiClient } from '../services/apiClient'
import { calculatePasswordStrength } from '../utils/passwordStrength'

function RegisterPage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [isShaking, setIsShaking] = useState(false)

  const triggerShake = () => {
    setIsShaking(true)
    setTimeout(() => {
      setIsShaking(false)
    }, 350)
  }

  // Real-time password strength calculation
  const strength = calculatePasswordStrength(password)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      triggerShake()
      return
    }

    try {
      setLoading(true)

      const response = await apiClient.post('/api/auth/register', {
        email,
        password,
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMsg = data.message || 'Đăng ký thất bại'
        setError(errorMsg)
        triggerShake()
        return
      }

      setSuccess(true)
      navigate('/login')
    } catch {
      setError('Không thể kết nối đến server')
      triggerShake()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-[#05080E] p-4 text-white">
      {/* Extended AI Atmosphere & Distant Network Background */}
      <AuthPageBackground mode="register" />

      {/* Two-Panel Centered Auth Card */}
      <div
        className={`relative z-10 w-full max-w-[980px] min-h-[580px] lg:min-h-[620px] overflow-hidden rounded-3xl border border-white/10 bg-[#0D111B]/95 p-4 sm:p-6 md:p-8 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.8),0_15px_50px_-5px_rgba(27,143,61,0.35),0_0_80px_-10px_rgba(27,143,61,0.22)] backdrop-blur-xl transition-all duration-600 ${
          isShaking ? 'animate-auth-shake' : ''
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 items-stretch gap-6 lg:gap-8 min-h-[520px]">
          {/* Left Side (Desktop): Dark Form Panel */}
          <div className="order-2 md:order-1 flex flex-col justify-center px-2 sm:px-6 md:px-4 lg:px-6 py-2 animate-slide-form-left">
            <div className="w-full max-w-[360px] mx-auto flex flex-col justify-center">
              {/* Top Mode Switch (Section 13) */}
              <div
                className="flex items-center gap-6 border-b border-white/10 pb-3 mb-5"
                role="tablist"
                aria-label="Chuyển chế độ xác thực"
              >
                <Link
                  to="/login"
                  role="tab"
                  aria-selected="false"
                  className="pb-1 text-sm font-medium text-gray-400 hover:text-white transition-colors tracking-wide"
                >
                  Đăng nhập
                </Link>
                <span
                  role="tab"
                  aria-selected="true"
                  className="relative pb-1 text-sm font-semibold text-white tracking-wide cursor-default"
                >
                  Đăng ký
                  <span
                    className="absolute -bottom-[13px] left-0 right-0 h-0.5 rounded-full"
                    style={{ backgroundColor: BRAND_COLORS.primaryGreen }}
                  />
                </span>
              </div>

              {/* Form Heading & Brand */}
              <div className="mb-5 text-left">
                <div className="mb-3 inline-flex items-center gap-2">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black text-white shadow-md"
                    style={{ backgroundColor: BRAND_COLORS.primaryGreen }}
                  >
                    AI
                  </div>
                  <span className="text-base font-bold tracking-tight text-white">
                    AI Chat
                  </span>
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Đăng ký
                </h1>

                <p className="mt-1.5 text-xs sm:text-sm text-gray-400">
                  Tạo tài khoản và bắt đầu khám phá trợ lý AI.
                </p>
              </div>

              {/* Error Alert Box */}
              {error && (
                <div
                  role="alert"
                  className="mb-4 flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs sm:text-sm text-red-300 animate-auth-fade"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4 shrink-0 text-red-400"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Register Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <FloatingInput
                    id="email"
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    focusAccent="green"
                    error={Boolean(error)}
                    disabled={loading}
                  />
                </div>

                <div>
                  <FloatingInput
                    id="password"
                    label="Mật khẩu"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
                    focusAccent="green"
                    error={Boolean(error)}
                    showPasswordToggle={true}
                    showPassword={showPassword}
                    onTogglePassword={() => setShowPassword((prev) => !prev)}
                    disabled={loading}
                  />

                  {/* Password Strength Meter (Register only, Section 18) */}
                  {password.length > 0 && (
                    <div className="mt-2 space-y-1 animate-auth-fade">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-400">Độ mạnh mật khẩu</span>
                        <span
                          className="font-semibold transition-colors duration-200"
                          style={{ color: strength.color }}
                        >
                          {strength.label}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full rounded-full bg-gray-800/80 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            backgroundColor:
                              strength.score >= 1 ? strength.color : 'transparent',
                          }}
                        />
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            backgroundColor:
                              strength.score >= 2 ? strength.color : 'transparent',
                          }}
                        />
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            backgroundColor:
                              strength.score >= 3 ? strength.color : 'transparent',
                          }}
                        />
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            backgroundColor:
                              strength.score >= 4 ? strength.color : 'transparent',
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <FloatingInput
                    id="confirmPassword"
                    label="Xác nhận mật khẩu"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    focusAccent="green"
                    error={Boolean(error && error.includes('khớp'))}
                    showPasswordToggle={true}
                    showPassword={showConfirmPassword}
                    onTogglePassword={() =>
                      setShowConfirmPassword((prev) => !prev)
                    }
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl py-3 px-4 text-sm font-semibold text-white shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0D111B] disabled:cursor-not-allowed disabled:opacity-50 hover:brightness-110 active:scale-[0.99] cursor-pointer"
                  style={{
                    backgroundColor: BRAND_COLORS.primaryGreen,
                    boxShadow: '0 4px 16px 0 rgba(27, 143, 61, 0.4)',
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="h-4 w-4 animate-spin text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        />
                      </svg>
                      <span>Đang đăng ký...</span>
                    </span>
                  ) : success ? (
                    <span className="flex items-center justify-center gap-2 text-white">
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Đăng ký thành công!</span>
                    </span>
                  ) : (
                    'Đăng ký'
                  )}
                </button>
              </form>

              {/* Bottom Switch Link */}
              <p className="mt-5 text-center text-xs sm:text-sm text-gray-400">
                Đã có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="font-semibold transition hover:underline focus:outline-none cursor-pointer"
                  style={{ color: BRAND_COLORS.primaryGreen }}
                >
                  Đăng nhập
                </button>
              </p>
            </div>
          </div>

          {/* Right Side (Desktop): Colorful Hero AI Visual Panel */}
          <div className="order-1 md:order-2 h-full animate-slide-right flex flex-col">
            <AuthOverlayBanner mode="register" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage