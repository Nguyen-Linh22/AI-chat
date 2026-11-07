import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ZyriconAIOrb } from './ZyriconAIOrb'

describe('ZyriconAIOrb Component (M4)', () => {
  it('renders the orb with role="img" and accessible aria-label', () => {
    render(<ZyriconAIOrb />)

    const orb = screen.getByTestId('zyricon-ai-orb')
    expect(orb).toBeInTheDocument()
    expect(orb).toHaveAttribute('role', 'img')
    expect(orb).toHaveAttribute('aria-label', 'Zyricon AI Dragon Orb')
  })

  it('renders the Dragon Emblem inside the orb container', () => {
    render(<ZyriconAIOrb />)

    const orb = screen.getByTestId('zyricon-ai-orb')
    const img = orb.querySelector('img')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('aria-hidden', 'true')
  })

  it('contains the orb glow container and halo layers', () => {
    const { container } = render(<ZyriconAIOrb />)

    const orbContainer = container.querySelector('.zyricon-orb-container')
    expect(orbContainer).toBeInTheDocument()

    const halo = container.querySelector('.zyricon-orb-halo')
    expect(halo).toBeInTheDocument()
  })

  it('accepts custom className props', () => {
    render(<ZyriconAIOrb className="custom-test-orb" />)

    const orb = screen.getByTestId('zyricon-ai-orb')
    expect(orb).toHaveClass('custom-test-orb')
  })
})

