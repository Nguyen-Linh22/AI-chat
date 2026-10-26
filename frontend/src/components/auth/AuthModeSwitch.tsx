import { Link } from 'react-router-dom'

interface AuthModeSwitchProps {
  mode: 'login' | 'register'
}

const MODES = [
  { id: 'login', to: '/login', label: 'Đăng nhập' },
  { id: 'register', to: '/register', label: 'Đăng ký' },
] as const

/**
 * Page-level mode navigation (two real links, not ARIA tabs): each option
 * navigates to its own route, so `aria-current="page"` describes it honestly.
 */
export function AuthModeSwitch({ mode }: AuthModeSwitchProps) {
  const brandRing = mode === 'login' ? 'rgba(185, 30, 43, 0.45)' : 'rgba(27, 143, 61, 0.45)'
  const brandFill = mode === 'login' ? 'rgba(185, 30, 43, 0.18)' : 'rgba(27, 143, 61, 0.18)'
  const ringClass =
    mode === 'login' ? 'focus-visible:ring-[#F87171]' : 'focus-visible:ring-[#4ADE80]'

  return (
    <nav
      aria-label="Chuyển giữa đăng nhập và đăng ký"
      className="grid w-full grid-cols-2 gap-1 rounded-2xl border border-white/[0.08] bg-black/25 p-1"
    >
      {MODES.map((item) => {
        const isActive = item.id === mode

        return (
          <Link
            key={item.id}
            to={item.to}
            aria-current={isActive ? 'page' : undefined}
            className={`flex h-11 items-center justify-center rounded-xl text-[13px] font-semibold tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F18] ${ringClass} ${
              isActive
                ? 'text-white shadow-sm'
                : 'text-gray-400 hover:bg-white/[0.05] hover:text-white'
            }`}
            style={
              isActive
                ? {
                    backgroundColor: brandFill,
                    boxShadow: `inset 0 0 0 1px ${brandRing}`,
                    color: '#FFFFFF',
                  }
                : undefined
            }
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
