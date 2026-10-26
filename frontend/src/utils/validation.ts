/**
 * Client-side auth validation.
 *
 * Mirrors the server rules in `backend/src/validators/auth.validator.ts` so the
 * user gets an inline message before a round-trip. The server stays the source
 * of truth: an empty/valid-looking payload is still validated there.
 */

/** Pragmatic email shape check (the server uses zod's `.email()`). */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 72

export function validateEmail(value: string): string | undefined {
  const email = value.trim()

  if (email.length === 0) return 'Vui lòng nhập email.'
  if (!EMAIL_PATTERN.test(email)) return 'Email không hợp lệ.'

  return undefined
}

interface PasswordOptions {
  /** Login only needs a non-empty value; register requires 8+ characters. */
  minLength?: number
}

export function validatePassword(
  value: string,
  { minLength = 1 }: PasswordOptions = {}
): string | undefined {
  if (value.length === 0) return 'Vui lòng nhập mật khẩu.'
  if (value.length < minLength) {
    return `Mật khẩu phải có ít nhất ${minLength} ký tự.`
  }
  if (value.length > PASSWORD_MAX_LENGTH) {
    return `Mật khẩu không được vượt quá ${PASSWORD_MAX_LENGTH} ký tự.`
  }

  return undefined
}

export function validateConfirmPassword(
  password: string,
  confirmation: string
): string | undefined {
  if (confirmation.length === 0) return 'Vui lòng xác nhận mật khẩu.'
  if (password !== confirmation) return 'Mật khẩu xác nhận không khớp.'

  return undefined
}

/** Field ids used for inline errors, summaries and focus management. */
export type AuthFieldId = 'email' | 'password' | 'confirmPassword'

export interface FieldError {
  id: AuthFieldId
  label: string
}

export function focusField(id: string) {
  const element = document.getElementById(id)
  if (!(element instanceof HTMLElement)) return

  element.focus()
  // jsdom has no layout engine, so guard the scroll call for unit tests.
  element.scrollIntoView?.({ block: 'center' })
}
