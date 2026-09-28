/**
 * Brand Design Tokens & Semantic Color System for AI Chat
 * - Primary Brand Red: #B91E2B (Login CTA, Active, Errors, Focus-Login)
 * - Primary Brand Green: #1B8F3D (Register CTA, Success, Password Strength, Focus-Register)
 */
export const BRAND_COLORS = {
  // Brand Accents
  primaryRed: '#B91E2B',
  primaryRedHover: '#9E1924',
  primaryRedSoft: 'rgba(185, 30, 43, 0.12)',
  primaryRedGlow: 'rgba(185, 30, 43, 0.25)',

  primaryGreen: '#1B8F3D',
  primaryGreenHover: '#167632',
  primaryGreenSoft: 'rgba(27, 143, 61, 0.12)',
  primaryGreenGlow: 'rgba(27, 143, 61, 0.25)',

  // Semantic Surfaces & Neutrals
  darkBg: '#090D16',
  surfaceCard: 'rgba(17, 24, 39, 0.75)',
  surfaceElevated: 'rgba(31, 41, 55, 0.85)',
  surfaceBorder: 'rgba(255, 255, 255, 0.08)',
  borderFocus: '#B91E2B',
  borderSuccess: '#1B8F3D',

  // Typography Tokens
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',

  // Status Tokens
  error: '#B91E2B',
  errorSoft: 'rgba(185, 30, 43, 0.12)',
  success: '#1B8F3D',
  successSoft: 'rgba(27, 143, 61, 0.12)',
} as const
