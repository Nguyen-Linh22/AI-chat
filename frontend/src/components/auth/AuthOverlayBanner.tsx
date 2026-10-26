import { BRAND_COLORS } from '../../constants/theme'
import { AIVisual } from './AIVisual'

interface AuthOverlayBannerProps {
  mode: 'login' | 'register'
}

const FEATURES = [
  'Phản hồi AI trực tiếp theo thời gian thực',
  'Lưu trữ và quản lý cuộc trò chuyện thông minh',
] as const

export function AuthOverlayBanner({ mode }: AuthOverlayBannerProps) {
  const isLogin = mode === 'login'
  const primaryColor = isLogin ? BRAND_COLORS.primaryRed : BRAND_COLORS.primaryGreen

  return (
    <div
      className={`relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 p-4 shadow-2xl sm:p-5 md:min-h-[560px] md:p-7 lg:p-8 ${
        isLogin
          ? 'bg-gradient-to-br from-[#80131D] via-[#450A10] to-[#0A0E17]'
          : 'bg-gradient-to-br from-[#12662B] via-[#083818] to-[#0A0E17]'
      }`}
    >
      {/* Radial light sources */}
      <div
        className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full blur-3xl"
        style={{ backgroundColor: primaryColor, opacity: 0.35 }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-20 -right-16 h-64 w-64 rounded-full blur-3xl"
        style={{ backgroundColor: primaryColor, opacity: 0.22 }}
        aria-hidden="true"
      />

      {/* Glass texture + diagonal sheen */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:22px_22px] opacity-[0.05]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-1/3 -top-1/3 h-[420px] w-[420px] rotate-12 bg-gradient-to-b from-white/[0.09] to-transparent blur-2xl"
        aria-hidden="true"
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-2.5 py-1 backdrop-blur-md">
          <span
            className="flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-black leading-none text-white"
            style={{ backgroundColor: primaryColor }}
          >
            AI
          </span>
          <span className="text-xs font-semibold tracking-wide text-white/90">AI Chat</span>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-gray-200">
          <span
            className="h-1.5 w-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: primaryColor }}
            aria-hidden="true"
          />
          <span>{isLogin ? 'Workspace' : 'Khởi tạo'}</span>
        </div>
      </div>

      {/* Body */}
      <div className="relative z-10 my-auto py-3 sm:py-4 md:py-2">
        <div className="mx-auto hidden max-w-[200px] sm:max-w-[240px] md:block lg:max-w-[270px]">
          <AIVisual mode={mode} />
        </div>

        <div className="text-left">
          <p className="text-lg font-bold leading-snug tracking-tight text-white sm:text-xl md:mt-2 lg:text-[28px]">
            {isLogin ? 'Chào mừng trở lại với AI Chat' : 'Bắt đầu hành trình cùng AI Chat'}
          </p>

          <p className="mt-1.5 hidden max-w-sm text-xs leading-relaxed text-gray-300 sm:block sm:text-[13px] md:mt-2">
            {isLogin
              ? 'Tiếp tục cuộc trò chuyện và khám phá không gian làm việc cùng trợ lý AI.'
              : 'Tạo tài khoản và khám phá cách AI có thể hỗ trợ công việc và học tập của bạn.'}
          </p>
        </div>

        <ul className="mt-4 hidden space-y-2 md:block lg:mt-5">
          {FEATURES.map((feature) => (
            <li key={feature} className="flex items-center gap-2.5 text-xs text-gray-200">
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-white shadow-sm"
                style={{ backgroundColor: primaryColor }}
                aria-hidden="true"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                  <path
                    fillRule="evenodd"
                    d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* Product preview (decorative illustration of the chat surface) */}
        <div className="mt-5 hidden space-y-2 lg:block" aria-hidden="true">
          <div className="ml-auto w-fit max-w-[88%] rounded-2xl rounded-br-md border border-white/10 bg-white/[0.09] px-3 py-2 text-[11px] leading-relaxed text-white/90">
            Tóm tắt tài liệu này trong 5 gạch đầu dòng.
          </div>
          <div className="w-fit max-w-[92%] rounded-2xl rounded-bl-md border border-white/10 bg-black/30 px-3 py-2">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: primaryColor }}
              />
              AI Chat
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-gray-200">
              Đã tóm tắt 12 trang thành 5 ý chính kèm nguồn tham chiếu.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 hidden items-center justify-between border-t border-white/10 pt-3 text-[11px] text-gray-400 md:flex">
        <span className="font-semibold text-gray-300">AI Chat</span>
        <span>Thông minh • Đơn giản • Tối ưu</span>
      </div>
    </div>
  )
}
