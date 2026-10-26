import { useId, useState } from 'react'
import type { ChangeEvent, KeyboardEvent, Ref } from 'react'
import { BRAND_COLORS } from '../../constants/theme'

type LeadingIcon = 'mail' | 'lock'

interface FloatingInputProps {
  id: string
  label: string
  type?: string
  value: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  onBlur?: () => void
  autoComplete?: string
  required?: boolean
  /** Inline error message; presence marks the field invalid. */
  error?: string
  hint?: string
  focusAccent?: 'red' | 'green'
  showPasswordToggle?: boolean
  showPassword?: boolean
  onTogglePassword?: () => void
  disabled?: boolean
  autoFocus?: boolean
  leadingIcon?: LeadingIcon
  inputMode?: 'email' | 'text'
  name?: string
  maxLength?: number
  enterKeyHint?: 'next' | 'go' | 'done'
  inputRef?: Ref<HTMLInputElement>
}

const ICON_PATHS: Record<LeadingIcon, string> = {
  mail: 'M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75',
  lock: 'M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z',
}

/**
 * Labelled auth field with a leading icon, inline error/hint messaging,
 * Caps Lock detection and an accessible password visibility toggle.
 *
 * Labels are rendered above the input (not floating over the border) so the
 * accessible name never depends on CSS positioning and stays readable at any
 * zoom level or Dynamic Type setting.
 */
export function FloatingInput({
  id,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  autoComplete,
  required = false,
  error,
  hint,
  focusAccent = 'red',
  showPasswordToggle = false,
  showPassword = false,
  onTogglePassword,
  disabled = false,
  autoFocus = false,
  leadingIcon,
  inputMode,
  name,
  maxLength,
  enterKeyHint,
  inputRef,
}: FloatingInputProps) {
  const generatedId = useId()
  const fieldId = id || generatedId
  const hintId = `${fieldId}-hint`
  const errorId = `${fieldId}-error`
  const capsLockId = `${fieldId}-caps`

  const [isFocused, setIsFocused] = useState(false)
  const [capsLockOn, setCapsLockOn] = useState(false)

  const isGreen = focusAccent === 'green'
  const isPassword = showPasswordToggle

  const accent = isGreen
    ? {
        border: BRAND_COLORS.focusGreen,
        ring: BRAND_COLORS.focusGreenRing,
        text: BRAND_COLORS.focusGreen,
      }
    : {
        border: BRAND_COLORS.focusRed,
        ring: BRAND_COLORS.focusRedRing,
        text: BRAND_COLORS.focusRed,
      }

  const invalid = Boolean(error)

  const actualType = isPassword ? (showPassword ? 'text' : 'password') : type

  const describedBy = [error ? errorId : null, hint ? hintId : null, capsLockOn ? capsLockId : null]
    .filter(Boolean)
    .join(' ')

  const borderColor = invalid
    ? BRAND_COLORS.focusRed
    : isFocused
      ? 'rgba(255, 255, 255, 0.55)'
      : 'rgba(255, 255, 255, 0.12)'

  // Focus = neutral border + soft brand halo; error = red border + faint red fill.
  // Keeping the two visually distinct avoids "focused looks invalid".
  const boxShadow = invalid
    ? '0 0 0 3px rgba(248, 113, 113, 0.14)'
    : isFocused
      ? `0 0 0 3px ${accent.ring}`
      : 'none'

  const handleKeyUp = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!isPassword) return
    setCapsLockOn(event.getModifierState?.('CapsLock') ?? false)
  }

  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-center gap-1.5">
        <label
          htmlFor={fieldId}
          className="text-xs font-medium text-gray-300 transition-colors duration-200"
          style={{ color: isFocused ? '#F8FAFC' : undefined }}
        >
          {label}
        </label>
        {required && (
          <span aria-hidden="true" className="text-xs leading-none text-[#F87171]">
            *
          </span>
        )}
      </div>

      <div className="relative">
        {leadingIcon && (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 transition-colors duration-200"
            style={{
              color: invalid
                ? BRAND_COLORS.focusRed
                : isFocused
                  ? accent.text
                  : '#6B7280',
            }}
            aria-hidden="true"
          >
            <path d={ICON_PATHS[leadingIcon]} />
          </svg>
        )}

        <input
          ref={inputRef}
          id={fieldId}
          name={name ?? fieldId}
          type={actualType}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false)
            setCapsLockOn(false)
            onBlur?.()
          }}
          onKeyUp={handleKeyUp}
          onKeyDown={handleKeyUp}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          required={required}
          disabled={disabled}
          inputMode={inputMode}
          maxLength={maxLength}
          enterKeyHint={enterKeyHint}
          spellCheck={false}
          autoCapitalize="none"
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy || undefined}
          className={`h-12 w-full rounded-xl border bg-[#080B12] text-sm text-white caret-white outline-none transition-[border-color,box-shadow,background-color] duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
            leadingIcon ? 'pl-11' : 'pl-4'
          } ${isPassword ? 'pr-12' : 'pr-4'}`}
          style={{
            borderColor,
            boxShadow,
            backgroundColor: invalid ? 'rgba(248, 113, 113, 0.05)' : undefined,
          }}
        />

        {isPassword && onTogglePassword && (
          <button
            type="button"
            onClick={onTogglePassword}
            disabled={disabled}
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            aria-pressed={showPassword}
            title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            className={`absolute right-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition-colors duration-200 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${
              isGreen ? 'focus-visible:ring-[#4ADE80]' : 'focus-visible:ring-[#F87171]'
            }`}
          >
            {showPassword ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            )}
          </button>
        )}
      </div>

      {error ? (
        <p
          id={errorId}
          className="mt-1.5 flex items-start gap-1.5 text-xs leading-relaxed text-[#FCA5A5] animate-auth-fade"
        >
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="mt-px h-3.5 w-3.5 shrink-0"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM8.28 7.22a.75.75 0 1 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-1.5 text-xs leading-relaxed text-gray-400">
          {hint}
        </p>
      ) : null}

      {capsLockOn && (
        <p
          id={capsLockId}
          className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-300"
        >
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-3.5 w-3.5 shrink-0"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 1.5 2.5 8.25h3.75v3.5h7.5v-3.5h3.75L10 1.5Zm-3.75 12h7.5v3h-7.5v-3Z"
              clipRule="evenodd"
            />
          </svg>
          <span>Caps Lock đang bật</span>
        </p>
      )}
    </div>
  )
}
