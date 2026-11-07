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

describe('M8 — Zyricon Design Tokens Accessibility & Contrast Compliance (WCAG 2.1 AA)', () => {
  const zyriconCanvas = '#07040B'
  const zyriconSurface = '#120B1C'
  const zyriconSidebar = '#0C0814'

  const zyriconTextPrimary = '#F7F3F6'
  const zyriconTextSecondary = '#EBDDE9'
  const zyriconTextMuted = '#C4A5B8'
  const zyriconSubtleText = '#8F7686'

  const zyriconPinkAccent = '#C27595'
  const zyriconOrchidButton = '#98578D'
  const zyriconDanger = '#B91E2B'

  it('Zyricon primary text (#F7F3F6) meets WCAG AAA (>= 7.0:1) on canvas, surface, and sidebar', () => {
    expect(getContrast(zyriconTextPrimary, zyriconCanvas)).toBeGreaterThanOrEqual(7.0)
    expect(getContrast(zyriconTextPrimary, zyriconSurface)).toBeGreaterThanOrEqual(7.0)
    expect(getContrast(zyriconTextPrimary, zyriconSidebar)).toBeGreaterThanOrEqual(7.0)
  })

  it('Zyricon secondary text (#EBDDE9) meets WCAG AAA (>= 7.0:1) on canvas and surface', () => {
    expect(getContrast(zyriconTextSecondary, zyriconCanvas)).toBeGreaterThanOrEqual(7.0)
    expect(getContrast(zyriconTextSecondary, zyriconSurface)).toBeGreaterThanOrEqual(7.0)
  })

  it('Zyricon soft pink text (#C4A5B8) meets WCAG AA (>= 4.5:1) on canvas and surface', () => {
    expect(getContrast(zyriconTextMuted, zyriconCanvas)).toBeGreaterThanOrEqual(4.5)
    expect(getContrast(zyriconTextMuted, zyriconSurface)).toBeGreaterThanOrEqual(4.5)
  })

  it('Zyricon subtle text (#8F7686) meets WCAG AA (>= 4.5:1) on dark canvas', () => {
    expect(getContrast(zyriconSubtleText, zyriconCanvas)).toBeGreaterThanOrEqual(4.5)
  })

  it('Zyricon accent pink (#C27595) meets WCAG 2.1 Non-text contrast (>= 3.0:1) for UI controls and focus rings', () => {
    expect(getContrast(zyriconPinkAccent, zyriconCanvas)).toBeGreaterThanOrEqual(3.0)
    expect(getContrast(zyriconPinkAccent, zyriconSurface)).toBeGreaterThanOrEqual(3.0)
  })

  it('White text on Zyricon Orchid button (#98578D) meets WCAG AA (>= 4.5:1)', () => {
    expect(getContrast('#FFFFFF', zyriconOrchidButton)).toBeGreaterThanOrEqual(4.5)
  })

  it('White text on danger button (#B91E2B) meets WCAG AA (>= 4.5:1)', () => {
    expect(getContrast('#FFFFFF', zyriconDanger)).toBeGreaterThanOrEqual(4.5)
  })
})

