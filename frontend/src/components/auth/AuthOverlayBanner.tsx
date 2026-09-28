import { BRAND_COLORS } from '../../constants/theme'
import { AIVisual } from './AIVisual'

interface AuthOverlayBannerProps {
  mode: 'login' | 'register'
}

export function AuthOverlayBanner({ mode }: AuthOverlayBannerProps) {
  const isLogin = mode === 'login'
  const primaryColor = isLogin ? BRAND_COLORS.primaryRed : BRAND_COLORS.primaryGreen

  return (
    <div
      className={`relative flex h-full min-h-[220px] sm:min-h-[260px] md:min-h-[540px] flex-col justify-between overflow-hidden rounded-2xl md:rounded-3xl p-5 sm:p-6 md:p-8 lg:p-10 shadow-2xl transition-all duration-500 ${
        isLogin
          ? 'bg-gradient-to-br from-[#80131D] via-[#450A10] to-[#0A0E17]'
          : 'bg-gradient-to-br from-[#12662B] via-[#083818] to-[#0A0E17]'
      } border border-white/10`}
    >
      {/* Background radial glow accents */}
      <div
        className="pointer-events-none absolute -left-12 -top-12 h-64 w-64 rounded-full blur-3xl transition-colors duration-500"
        style={{
          backgroundColor: primaryColor,
          opacity: 0.35,
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full blur-3xl transition-colors duration-500"
        style={{
          backgroundColor: primaryColor,
          opacity: 0.25,
        }}
        aria-hidden="true"
      />

      {/* Decorative ambient subtle grid or orbit line */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.04]"
        aria-hidden="true"
      />

      {/* Top Header: Brand Badge & Platform status */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-3 py-1 backdrop-blur-md">
          <span
            className="flex h-4.5 w-4.5 items-center justify-center rounded-full text-[10px] font-black text-white"
            style={{ backgroundColor: primaryColor }}
          >
            AI
          </span>
          <span className="text-xs font-semibold tracking-wide text-white/90">
            AI Chat
          </span>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-gray-300">
          <span
            className="h-1.5 w-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: primaryColor }}
          />
          <span>{isLogin ? 'Workspace' : 'Khởi tạo'}</span>
        </div>
      </div>

      {/* Central Hero: Abstract AI Network Vector Illustration */}
      <div className="relative z-10 my-auto py-1 sm:py-2">
        <div className="max-w-[180px] sm:max-w-[220px] md:max-w-[280px] mx-auto">
          <AIVisual mode={mode} />
        </div>

        <div className="text-center md:text-left mt-1 sm:mt-2">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white lg:text-3xl leading-snug">
            {isLogin ? 'Chào mừng trở lại với AI Chat' : 'Bắt đầu hành trình cùng AI Chat'}
          </h2>

          <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm leading-relaxed text-gray-300/90 max-w-sm hidden sm:block">
            {isLogin
              ? 'Tiếp tục cuộc trò chuyện và khám phá không gian làm việc cùng trợ lý AI.'
              : 'Tạo tài khoản và khám phá cách AI có thể hỗ trợ công việc và học tập của bạn.'}
          </p>
        </div>

        {/* Honest, concise feature highlights - visible on desktop and tablet */}
        <div className="mt-4 sm:mt-5 space-y-2 hidden md:block">
          <div className="flex items-center gap-2.5 text-xs text-gray-200">
            <div
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-white shadow-sm"
              style={{ backgroundColor: primaryColor }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-3.5 w-3.5"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span>Phản hồi AI trực tiếp thời gian thực</span>
          </div>

          <div className="flex items-center gap-2.5 text-xs text-gray-200">
            <div
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-white shadow-sm"
              style={{ backgroundColor: primaryColor }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-3.5 w-3.5"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span>Lưu trữ và quản lý cuộc trò chuyện thông minh</span>
          </div>
        </div>
      </div>

      {/* Bottom Footer Quote */}
      <div className="relative z-10 border-t border-white/10 pt-3.5 flex items-center justify-between text-xs text-gray-400">
        <span>AI Chat</span>
        <span>Thông minh • Đơn giản • Tối ưu</span>
      </div>
    </div>
  )
}
