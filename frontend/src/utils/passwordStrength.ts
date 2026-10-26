import { BRAND_COLORS } from '../constants/theme'

export interface PasswordCriterion {
  id: 'length' | 'case' | 'number' | 'symbol'
  label: string
  met: boolean
}

export interface PasswordStrengthResult {
  score: number // 0 to 4
  label: string
  color: string
  percent: number
  criteria: PasswordCriterion[]
}

/** Criteria shown in the register checklist (aligned with the server minimum). */
export const PASSWORD_CRITERIA: ReadonlyArray<{
  id: PasswordCriterion['id']
  label: string
}> = [
  { id: 'length', label: 'Ít nhất 8 ký tự' },
  { id: 'case', label: 'Có chữ hoa và chữ thường' },
  { id: 'number', label: 'Có ít nhất 1 chữ số' },
  { id: 'symbol', label: 'Có ít nhất 1 ký tự đặc biệt' },
]

export function getPasswordCriteria(password: string): PasswordCriterion[] {
  return PASSWORD_CRITERIA.map(({ id, label }) => {
    switch (id) {
      case 'length':
        return { id, label, met: password.length >= 8 }
      case 'case':
        return { id, label, met: /[a-z]/.test(password) && /[A-Z]/.test(password) }
      case 'number':
        return { id, label, met: /[0-9]/.test(password) }
      case 'symbol':
        return { id, label, met: /[^A-Za-z0-9]/.test(password) }
    }
  })
}

/**
 * Calculates a client-side password strength indicator.
 * Not a replacement for server-side validation.
 *
 * Status colors are the light-on-dark variants so the label keeps WCAG AA
 * contrast on the auth card; the meter itself (non-text) is also >= 3:1.
 */
export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  const criteria = getPasswordCriteria(password)

  if (!password) {
    return {
      score: 0,
      label: '',
      color: 'transparent',
      percent: 0,
      criteria,
    }
  }

  const metCount = criteria.filter((criterion) => criterion.met).length

  if (metCount <= 1) {
    return {
      score: 1,
      label: 'Yếu',
      color: BRAND_COLORS.focusRed,
      percent: 25,
      criteria,
    }
  }

  if (metCount === 2) {
    return {
      score: 2,
      label: 'Trung bình',
      color: '#FBBF24',
      percent: 50,
      criteria,
    }
  }

  if (metCount === 3) {
    return {
      score: 3,
      label: 'Khá',
      color: '#60A5FA',
      percent: 75,
      criteria,
    }
  }

  return {
    score: 4,
    label: 'Mạnh',
    color: BRAND_COLORS.focusGreen,
    percent: 100,
    criteria,
  }
}
