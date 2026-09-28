import { BRAND_COLORS } from '../constants/theme'

export interface PasswordStrengthResult {
  score: number // 0 to 4
  label: string
  color: string
  percent: number
}

/**
 * Calculates client-side password strength UX indicator.
 * Not a replacement for server-side validation.
 */
export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password || password.length === 0) {
    return {
      score: 0,
      label: '',
      color: 'transparent',
      percent: 0,
    }
  }

  let criteriaCount = 0

  if (password.length >= 6) criteriaCount++
  if (password.length >= 10) criteriaCount++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) criteriaCount++
  if (/[0-9]/.test(password)) criteriaCount++
  if (/[^A-Za-z0-9]/.test(password)) criteriaCount++

  if (criteriaCount <= 1) {
    return {
      score: 1,
      label: 'Yếu',
      color: BRAND_COLORS.primaryRed,
      percent: 25,
    }
  }

  if (criteriaCount === 2) {
    return {
      score: 2,
      label: 'Trung bình',
      color: '#EAB308',
      percent: 50,
    }
  }

  if (criteriaCount === 3 || criteriaCount === 4) {
    return {
      score: 3,
      label: 'Khá',
      color: '#3B82F6',
      percent: 75,
    }
  }

  return {
    score: 4,
    label: 'Mạnh',
    color: BRAND_COLORS.primaryGreen,
    percent: 100,
  }
}
