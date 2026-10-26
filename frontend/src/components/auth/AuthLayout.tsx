import type { ReactNode } from 'react'
import { AuthPageBackground } from './AuthPageBackground'

interface AuthLayoutProps {
  mode: 'login' | 'register'
  banner: ReactNode
  /** Desktop placement of the visual banner; mobile always shows it first. */
  bannerPosition?: 'left' | 'right'
  /** Shake the card after a failed submit (suppressed by prefers-reduced-motion). */
  shake?: boolean
  children: ReactNode
}

/**
 * Shared shell for the login and register screens.
 *
 * The page owns the scroll (body stays `overflow: hidden`), so short viewports
 * and on-screen keyboards never clip the submit button or the switch links.
 */
export function AuthLayout({
  mode,
  banner,
  bannerPosition = 'left',
  shake = false,
  children,
}: AuthLayoutProps) {
  const isLogin = mode === 'login'
  const glow = isLogin
    ? 'radial-gradient(circle at 30% 20%, rgba(185, 30, 43, 0.35), transparent 60%)'
    : 'radial-gradient(circle at 70% 20%, rgba(27, 143, 61, 0.35), transparent 60%)'

  return (
    <div className="auth-scroll relative h-[100dvh] w-full overflow-y-auto overflow-x-hidden bg-[#05080E] text-white">
      <div className="pointer-events-none fixed inset-0" aria-hidden="true">
        <AuthPageBackground mode={mode} />
      </div>

      <div className="relative z-10 flex min-h-full w-full items-center justify-center px-3 py-5 sm:px-6 sm:py-8">
        <main className="relative w-full max-w-[1000px]">
          {/* Ambient halo behind the card, tinted per mode */}
          <div
            className="pointer-events-none absolute -inset-8 rounded-[48px] blur-3xl"
            style={{ background: glow, opacity: 0.55 }}
            aria-hidden="true"
          />

          <div
            className={`relative overflow-hidden rounded-[26px] border border-white/[0.09] bg-[#0B0F18]/92 p-3 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl sm:p-4 md:p-5 ${
              shake ? 'animate-auth-shake' : ''
            }`}
          >
            <div className="grid items-stretch gap-4 md:grid-cols-2 md:gap-5 lg:gap-6">
              <div
                className={`flex min-h-0 flex-col ${
                  bannerPosition === 'left'
                    ? 'auth-reveal-banner-right order-1 md:order-1'
                    : 'auth-reveal-banner-left order-1 md:order-2'
                }`}
              >
                {banner}
              </div>

              <div
                className={`order-2 flex flex-col justify-center px-1 py-2 sm:px-4 md:px-3 md:py-6 lg:px-5 ${
                  bannerPosition === 'left'
                    ? 'auth-reveal-form-left md:order-2'
                    : 'auth-reveal-form-right md:order-1'
                }`}
              >
                <div className="mx-auto flex w-full max-w-[380px] flex-col">
                  {children}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
