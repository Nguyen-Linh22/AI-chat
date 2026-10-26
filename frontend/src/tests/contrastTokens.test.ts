import { describe, it, expect } from 'vitest'

function sRGBtoLin(colorChannel: number): number {
  const c = colorChannel / 255
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

function getLuminance(r: number, g: number, b: number): number {
  return 0.2126 * sRGBtoLin(r) + 0.7152 * sRGBtoLin(g) + 0.0722 * sRGBtoLin(b)
}

function hexToRgb(hex: string): [number, number, number] {
  hex = hex.replace('#', '')
  if (hex.length === 3) {
    hex = hex.split('').map((x) => x + x).join('')
  }
  const num = parseInt(hex, 16)
  return [num >> 16, (num >> 8) & 255, num & 255]
}

function getContrast(hex1: string, hex2: string): number {
  const [r1, g1, b1] = hexToRgb(hex1)
  const [r2, g2, b2] = hexToRgb(hex2)
  const L1 = getLuminance(r1, g1, b1)
  const L2 = getLuminance(r2, g2, b2)
  const lighter = Math.max(L1, L2)
  const darker = Math.min(L1, L2)
  return (lighter + 0.05) / (darker + 0.05)
}

describe('M7 Design Tokens Contrast Compliance (WCAG 2.1 AA)', () => {
  describe('Light Mode Tokens', () => {
    const canvas = '#F8FAFC'
    const surface = '#FFFFFF'
    const textPrimary = '#0F172A'
    const textSecondary = '#475569'
    const textMuted = '#64748B'
    const brandDanger = '#B91E2B'
    const brandPrimary = '#1B8F3D'

    it('text-primary meets WCAG AAA (>= 7.0:1) on white surface and canvas', () => {
      expect(getContrast(textPrimary, surface)).toBeGreaterThanOrEqual(7.0)
      expect(getContrast(textPrimary, canvas)).toBeGreaterThanOrEqual(7.0)
    })

    it('text-secondary meets WCAG AA (>= 4.5:1) on white surface and canvas', () => {
      expect(getContrast(textSecondary, surface)).toBeGreaterThanOrEqual(4.5)
      expect(getContrast(textSecondary, canvas)).toBeGreaterThanOrEqual(4.5)
    })

    it('text-muted meets WCAG AA (>= 4.5:1) on white surface and canvas', () => {
      expect(getContrast(textMuted, surface)).toBeGreaterThanOrEqual(4.5)
      expect(getContrast(textMuted, canvas)).toBeGreaterThanOrEqual(4.5)
    })

    it('white text on brand-danger button meets WCAG AA (>= 4.5:1)', () => {
      expect(getContrast('#FFFFFF', brandDanger)).toBeGreaterThanOrEqual(4.5)
    })

    it('white text on brand-primary button meets UI / bold text standard (>= 3.0:1)', () => {
      expect(getContrast('#FFFFFF', brandPrimary)).toBeGreaterThanOrEqual(3.0)
    })
  })

  describe('Dark Mode Tokens', () => {
    const darkCanvas = '#0B0F17'
    const darkSurface = '#1A2230'
    const darkTextPrimary = '#F1F5F9'
    const darkTextSecondary = '#94A3B8'
    const darkTextMuted = '#94A3B8'
    const brandDanger = '#B91E2B'
    const brandPrimary = '#1B8F3D'

    it('dark text-primary meets WCAG AAA (>= 7.0:1) on dark surface and canvas', () => {
      expect(getContrast(darkTextPrimary, darkSurface)).toBeGreaterThanOrEqual(7.0)
      expect(getContrast(darkTextPrimary, darkCanvas)).toBeGreaterThanOrEqual(7.0)
    })

    it('dark text-secondary meets WCAG AA (>= 4.5:1) on dark surface and canvas', () => {
      expect(getContrast(darkTextSecondary, darkSurface)).toBeGreaterThanOrEqual(4.5)
      expect(getContrast(darkTextSecondary, darkCanvas)).toBeGreaterThanOrEqual(4.5)
    })

    it('dark text-muted meets WCAG AA (>= 4.5:1) on dark surface and canvas', () => {
      expect(getContrast(darkTextMuted, darkSurface)).toBeGreaterThanOrEqual(4.5)
      expect(getContrast(darkTextMuted, darkCanvas)).toBeGreaterThanOrEqual(4.5)
    })

    it('white text on brand-danger meets WCAG AA (>= 4.5:1)', () => {
      expect(getContrast('#FFFFFF', brandDanger)).toBeGreaterThanOrEqual(4.5)
    })

    it('brand-primary on dark canvas meets UI standard (>= 3.0:1)', () => {
      expect(getContrast(brandPrimary, darkCanvas)).toBeGreaterThanOrEqual(3.0)
    })
  })
})
