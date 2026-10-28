import { Link } from 'react-router-dom'

interface AuthModeSwitchProps {
  mode: 'login' | 'register'
}

const MODES = [
  { id: 'login', to: '/login', label: 'Đăng nhập', icon: 'login' },
  { id: 'register', to: '/register', label: 'Đăng ký', icon: 'register' },
] as const

/**
 * Page-level mode navigation (two real links, not ARIA tabs): each option
 * navigates to its own route, so `aria-current="page"` describes it honestly.
 */
export function AuthModeSwitch({ mode }: AuthModeSwitchProps) {
  const isLogin = mode === 'login'
  const brandRing = isLogin ? 'rgba(185, 30, 43, 0.45)' : 'rgba(27, 143, 61, 0.45)'
  const brandFill = isLogin ? 'rgba(185, 30, 43, 0.22)' : 'rgba(27, 143, 61, 0.22)'
  const ringClass = isLogin
    ? 'focus-visible:ring-[#F87171]'
    : 'focus-visible:ring-[#4ADE80]'

  return (
    <nav
      aria-label="Chuyển giữa đăng nhập và đăng ký"
      className="grid w-full grid-cols-2 gap-1.5 rounded-2xl border border-white/10 bg-black/40 p-1.5 backdrop-blur-xl shadow-inner"
    >
      {MODES.map((item) => {
        const isActive = item.id === mode

        return (
          <Link
            key={item.id}
            to={item.to}
            aria-current={isActive ? 'page' : undefined}
            className={`flex h-11 items-center justify-center gap-2 rounded-xl text-[13px] font-semibold tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F18] ${ringClass} ${
              isActive
                ? 'text-white shadow-md'
                : 'text-gray-400 hover:bg-white/[0.06] hover:text-white'
            }`}
            style={
              isActive
                ? {
                    backgroundColor: brandFill,
                    boxShadow: `inset 0 0 0 1px ${brandRing}, 0 2px 8px -2px rgba(0,0,0,0.5)`,
                    color: '#FFFFFF',
                  }
                : undefined
            }
          >
            {item.icon === 'login' ? (
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className={`h-4 w-4 ${isActive ? (isLogin ? 'text-[#FCA5A5]' : 'text-white') : 'text-gray-400'}`}
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z"
                  clipRule="evenodd"
                />
                <path
                  fillRule="evenodd"
                  d="M19 10a.75.75 0 0 0-.75-.75H8.704l1.048-.943a.75.75 0 1 0-1.004-1.114l-2.5 2.25a.75.75 0 0 0 0 1.114l2.5 2.25a.75.75 0 1 0 1.004-1.114l-1.048-.943h9.546A.75.75 0 0 0 19 10Z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className={`h-4 w-4 ${isActive ? (!isLogin ? 'text-[#86EFAC]' : 'text-white') : 'text-gray-400'}`}
                aria-hidden="true"
              >
                <path d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM2.615 16.428a1.224 1.224 0 0 1-.569-1.175 6.002 6.002 0 0 1 11.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 0 1 8 18a9.953 9.953 0 0 1-5.385-1.572ZM16.25 5.75a.75.75 0 0 0-1.5 0v2h-2a.75.75 0 0 0 0 1.5h2v2a.75.75 0 0 0 1.5 0v-2h2a.75.75 0 0 0 0-1.5h-2v-2Z" />
              </svg>
            )}
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
