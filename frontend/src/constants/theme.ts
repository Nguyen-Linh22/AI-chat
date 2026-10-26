/**
 * Brand Design Tokens & Semantic Color System for AI Chat
 * - Primary Brand Red: #B91E2B (Login CTA, Active, Errors, Focus-Login)
 * - Primary Brand Green: #1B8F3D (Register accents, Success, Password Strength)
 *
 * Auth surfaces are always dark, so focus/status colors are the *lighter*
 * variants of the brand hues: they keep >= 3:1 non-text contrast against the
 * auth card (#0B0F18) and >= 4.5:1 when used as small text.
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

  /**
   * Action fill for the register CTA. White 14px semibold text on #1B8F3D only
   * reaches 4.17:1, so the button uses a slightly deeper green (5.4:1) while
   * #1B8F3D stays the brand accent for icons, rings and progress.
   */
  primaryGreenAction: '#157A33',
  primaryGreenActionHover: '#12662B',

  // Auth focus rings (light brand hues for 3:1+ non-text contrast on dark)
  focusRed: '#F87171',
  focusGreen: '#4ADE80',
  focusRedRing: 'rgba(248, 113, 113, 0.22)',
  focusGreenRing: 'rgba(74, 222, 128, 0.22)',

  // Semantic Surfaces & Neutrals
  darkBg: '#090D16',
  authCanvas: '#05080E',
  authCard: '#0B0F18',
  authField: '#080B12',
  surfaceCard: 'rgba(17, 24, 39, 0.75)',
  surfaceElevated: 'rgba(31, 41, 55, 0.85)',
  surfaceBorder: 'rgba(255, 255, 255, 0.08)',
  borderFocus: '#B91E2B',
  borderSuccess: '#1B8F3D',

  // Typography Tokens
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  textError: '#FCA5A5',

  // Status Tokens
  error: '#B91E2B',
  errorSoft: 'rgba(185, 30, 43, 0.12)',
  success: '#1B8F3D',
  successSoft: 'rgba(27, 143, 61, 0.12)',
} as const

export type AuthMode = 'login' | 'register'
