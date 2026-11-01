import type { ReactNode } from 'react'
import { AuthPageBackground } from './AuthPageBackground'
import ThemeToggle from '../ThemeToggle'
import './AuthCard.css'

interface AuthLayoutProps {
  mode: 'login' | 'register'
  banner?: ReactNode
  bannerPosition?: 'left' | 'right'
  shake?: boolean
  children: ReactNode
}

/**
 * Shared shell for the login and register screens.
 * Features an animated conic-gradient glowing border, glassmorphic depth,
 * and responsive centering for all screen sizes.
 */
export function AuthLayout({
  mode,
  banner: _banner,
  bannerPosition: _bannerPosition = 'left',
  shake = false,
  children,
}: AuthLayoutProps) {
  const isLogin = mode === 'login'
  const glow = isLogin
    ? 'radial-gradient(circle at 50% 30%, rgba(225, 29, 72, 0.35), transparent 70%)'
    : 'radial-gradient(circle at 50% 30%, rgba(16, 185, 129, 0.35), transparent 70%)'

  return (
    <div className="auth-scroll relative min-h-screen h-[100dvh] w-full overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-[#05080E] text-slate-900 dark:text-white transition-colors duration-300">
      {/* Background Atmosphere */}
      <div className="pointer-events-none fixed inset-0" aria-hidden="true">
        <AuthPageBackground mode={mode} />
      </div>

      {/* Top Floating Controls: Brand Pill + Theme Toggle */}
      <header className="relative z-20 flex w-full items-center justify-between px-4 py-3 sm:px-8 sm:py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-[#6e8efb] to-[#a777e3] shadow-md shadow-indigo-500/20">
            <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
            </svg>
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white select-none">
            AI Chat Workspace
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Centered Auth Card Container */}
      <div className="relative z-10 flex min-h-[calc(100%-68px)] w-full items-center justify-center px-3.5 py-6 sm:px-6 sm:py-10">
        <main className="relative w-full max-w-[460px]">
          {/* Ambient halo behind the card */}
          <div
            className="pointer-events-none absolute -inset-8 rounded-[48px] blur-3xl opacity-70 dark:opacity-60"
            style={{ background: glow }}
            aria-hidden="true"
          />

          {/* Animated Conic Border Container */}
          <div
            className={`auth-card-container w-full ${
              shake ? 'animate-auth-shake' : ''
            }`}
          >
            <div className="auth-card-inner p-6 sm:p-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
