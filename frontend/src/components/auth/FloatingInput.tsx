import { useState, useId } from 'react'

interface FloatingInputProps {
  id?: string
  label: string
  type?: string
  value: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  autoComplete?: string
  required?: boolean
  error?: boolean
  focusAccent?: 'red' | 'green'
  showPasswordToggle?: boolean
  showPassword?: boolean
  onTogglePassword?: () => void
  disabled?: boolean
}

export function FloatingInput({
  id: customId,
  label,
  type = 'text',
  value,
  onChange,
  autoComplete,
  required,
  error = false,
  focusAccent = 'red',
  showPasswordToggle = false,
  showPassword = false,
  onTogglePassword,
  disabled = false,
}: FloatingInputProps) {
  const generatedId = useId()
  const inputId = customId || generatedId
  const [isFocused, setIsFocused] = useState(false)

  // Floating when focused, or when value has length > 0
  const isFloating = isFocused || (value !== undefined && value !== null && value.length > 0)

  // Determine actual type when password toggle is active
  const actualType = showPasswordToggle
    ? showPassword
      ? 'text'
      : 'password'
    : type

  const isGreen = focusAccent === 'green'

  const focusBorderClass = isGreen
    ? 'focus:border-[#1B8F3D] focus:ring-2 focus:ring-[#1B8F3D]/20'
    : 'focus:border-[#B91E2B] focus:ring-2 focus:ring-[#B91E2B]/20'

  const focusGlowClass = isGreen
    ? 'border-[#1B8F3D] ring-2 ring-[#1B8F3D]/20 shadow-[0_0_15px_rgba(27,143,61,0.15)]'
    : 'border-[#B91E2B] ring-2 ring-[#B91E2B]/20 shadow-[0_0_15px_rgba(185,30,43,0.15)]'

  const labelFocusColorClass = isGreen ? 'text-[#1B8F3D]' : 'text-[#B91E2B]'

  const peerFocusClass = isGreen
    ? 'peer-focus:text-[#1B8F3D]'
    : 'peer-focus:text-[#B91E2B]'

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          id={inputId}
          type={actualType}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder=" "
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          className={`peer w-full rounded-xl border bg-[#090D16]/90 h-12 text-sm text-white outline-none transition-all duration-200 ${
            showPasswordToggle ? 'pr-11 pl-4' : 'px-4'
          } ${
            error
              ? 'border-[#B91E2B] focus:border-[#B91E2B] focus:ring-2 focus:ring-[#B91E2B]/25'
              : isFocused
              ? focusGlowClass
              : `border-gray-700/60 hover:border-gray-600 ${focusBorderClass}`
          } disabled:cursor-not-allowed disabled:opacity-50`}
        />

        <label
          htmlFor={inputId}
          className={`pointer-events-none absolute left-3.5 select-none font-medium transition-all duration-200 ease-out z-10 ${
            isFloating
              ? `top-0 -translate-y-1/2 rounded bg-[#0D111B] px-1 text-xs ${
                  isFocused ? labelFocusColorClass : 'text-gray-300'
                }`
              : `top-1/2 -translate-y-1/2 text-sm text-gray-400 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs ${peerFocusClass} peer-focus:bg-[#0D111B] peer-focus:px-1 peer-focus:rounded peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:bg-[#0D111B] peer-[:not(:placeholder-shown)]:px-1 peer-[:not(:placeholder-shown)]:rounded`
          }`}
        >
          {label}
        </label>

        {showPasswordToggle && onTogglePassword && (
          <button
            type="button"
            onClick={onTogglePassword}
            disabled={disabled}
            className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 transition hover:bg-white/5 hover:text-white focus:outline-none focus:ring-1 cursor-pointer disabled:cursor-not-allowed ${
              isGreen ? 'focus:ring-[#1B8F3D]' : 'focus:ring-[#B91E2B]'
            }`}
            title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {showPassword ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
