import { BRAND_COLORS } from '../../constants/theme'
import { AIVisual } from './AIVisual'

interface AuthOverlayBannerProps {
  mode: 'login' | 'register'
}

interface FeatureItem {
  title: string
  desc: string
  icon: 'zap' | 'shield' | 'sparkles'
}

const FEATURES: readonly FeatureItem[] = [
  {
    title: 'Streaming thời gian thực',
    desc: 'Phản hồi siêu tốc từng token với độ trễ thấp',
    icon: 'zap',
  },
  {
    title: 'Bảo mật & Quyền riêng tư',
    desc: 'Mã hóa phiên làm việc, không chia sẻ dữ liệu hội thoại',
    icon: 'shield',
  },
  {
    title: 'Đa mô hình AI thông minh',
    desc: 'Linh hoạt chuyển đổi GPT-4o, Claude 3.5, Gemini Pro',
    icon: 'sparkles',
  },
] as const

export function AuthOverlayBanner({ mode }: AuthOverlayBannerProps) {
  const isLogin = mode === 'login'
  const primaryColor = isLogin ? BRAND_COLORS.primaryRed : BRAND_COLORS.primaryGreen
  const secondaryColor = isLogin ? '#F87171' : '#4ADE80'

  return (
    <div
      className={`relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-white/10 p-5 shadow-2xl sm:p-6 md:min-h-[580px] md:p-7 lg:p-8 ${
        isLogin
          ? 'bg-gradient-to-br from-[#85131F] via-[#480A10] to-[#0A0E17]'
          : 'bg-gradient-to-br from-[#136C2F] via-[#093D1B] to-[#0A0E17]'
      }`}
    >
      {/* Radial ambient glow orbs */}
      <div
        className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full blur-3xl animate-pulse"
        style={{ backgroundColor: primaryColor, opacity: 0.38, animationDuration: '6s' }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-20 h-80 w-80 rounded-full blur-3xl"
        style={{ backgroundColor: secondaryColor, opacity: 0.22 }}
        aria-hidden="true"
      />

      {/* Glass texture + subtle cyber grid */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.06]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-1/4 -top-1/4 h-[460px] w-[460px] rotate-12 bg-gradient-to-b from-white/[0.08] to-transparent blur-2xl"
        aria-hidden="true"
      />

      {/* Header Bar */}
      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
          <span
            className="flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-black leading-none text-white shadow-sm"
            style={{ backgroundColor: primaryColor }}
          >
            AI
          </span>
          <span className="text-xs font-bold tracking-wider text-white">AI CHAT</span>
          <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white/80">
            PRO
          </span>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-[11px] font-medium text-gray-200 backdrop-blur-md">
          <span
            className="h-1.5 w-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: secondaryColor }}
            aria-hidden="true"
          />
          <span>{isLogin ? 'Workspace v2.4' : 'Khởi tạo Workspace'}</span>
        </div>
      </div>

      {/* Main Body */}
      <div className="relative z-10 my-auto py-3 sm:py-4 md:py-2">
        {/* Dynamic AI Visual */}
        <div className="mx-auto hidden max-w-[210px] sm:max-w-[240px] md:block lg:max-w-[270px]">
          <AIVisual mode={mode} />
        </div>

        {/* Headline & Subtitle */}
        <div className="text-left">
          <p className="text-lg font-extrabold leading-snug tracking-tight text-white sm:text-xl md:mt-2 lg:text-[28px]">
            {isLogin ? 'Chào mừng trở lại với AI Chat' : 'Bắt đầu hành trình cùng AI Chat'}
          </p>

          <p className="mt-1.5 hidden max-w-md text-xs leading-relaxed text-gray-300 sm:block sm:text-[13px] md:mt-2">
            {isLogin
              ? 'Tiếp tục cuộc trò chuyện và khai phóng sức mạnh AI với tốc độ streaming thời gian thực.'
              : 'Tạo tài khoản và khám phá cách AI có thể nâng tầm hiệu suất làm việc và học tập của bạn.'}
          </p>
        </div>

        {/* Feature List */}
        <ul className="mt-4 hidden space-y-2.5 md:block lg:mt-5" aria-label="Tính năng nổi bật">
          {FEATURES.map((feature) => (
            <li
              key={feature.title}
              className="group flex items-start gap-3 rounded-xl border border-white/5 bg-black/20 p-2.5 transition-colors duration-200 hover:border-white/15 hover:bg-black/35"
            >
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-white shadow-sm transition-transform duration-200 group-hover:scale-105"
                style={{ backgroundColor: primaryColor }}
                aria-hidden="true"
              >
                {feature.icon === 'zap' && (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                    <path d="M11.983 1.907a.75.75 0 0 0-1.292-.657l-8.5 9.5A.75.75 0 0 0 2.75 12h6.5l-1.233 6.093a.75.75 0 0 0 1.292.657l8.5-9.5A.75.75 0 0 0 17.25 8h-6.5l1.233-6.093Z" />
                  </svg>
                )}
                {feature.icon === 'shield' && (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                    <path
                      fillRule="evenodd"
                      d="M10 1a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 1Zm0 18a.75.75 0 0 1-.75-.75v-1.5a.75.75 0 0 1 1.5 0v1.5A.75.75 0 0 1 10 19ZM3.343 4.343a.75.75 0 0 1 1.061 0l1.06 1.061a.75.75 0 0 1-1.06 1.06l-1.06-1.06a.75.75 0 0 1 0-1.061Zm12.253 12.253a.75.75 0 0 1 1.06 0l1.061 1.06a.75.75 0 0 1-1.06 1.061l-1.061-1.06a.75.75 0 0 1 0-1.061ZM1 10a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 10 1Zm18 0a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 19 10ZM4.404 16.657a.75.75 0 0 1 0-1.06l1.06-1.061a.75.75 0 1 1 1.061 1.06l-1.06 1.061a.75.75 0 0 1-1.061 0Zm12.253-12.253a.75.75 0 0 1 0 1.06l-1.06 1.061a.75.75 0 1 1-1.061-1.06l1.06-1.061a.75.75 0 0 1 1.061 0Z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {feature.icon === 'sparkles' && (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                    <path d="M15.98 1.804a1 1 0 0 0-1.96 0l-.24 1.192a8.001 8.001 0 0 1-6.19 6.19l-1.192.238a1 1 0 0 0 0 1.952l1.192.238a8.001 8.001 0 0 1 6.19 6.19l.24 1.192a1 1 0 0 0 1.96 0l.238-1.192a8.001 8.001 0 0 1 6.19-6.19l1.192-.238a1 1 0 0 0 0-1.952l-1.192-.238a8.001 8.001 0 0 1-6.19-6.19l-.238-1.192Z" />
                  </svg>
                )}
              </span>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-[12px] font-semibold text-white/95">{feature.title}</p>
                <p className="text-[11px] leading-relaxed text-gray-300">{feature.desc}</p>
              </div>
            </li>
          ))}
        </ul>

        {/* Interactive Chat Showcase Card */}
        <div className="mt-4 hidden space-y-2 lg:block" aria-hidden="true">
          <div className="ml-auto w-fit max-w-[88%] rounded-2xl rounded-br-md border border-white/10 bg-white/[0.09] px-3.5 py-2 text-[11px] leading-relaxed text-white/95 backdrop-blur-md shadow-sm">
            Tóm tắt tài liệu này trong 5 gạch đầu dòng.
          </div>
          <div className="w-fit max-w-[95%] rounded-2xl rounded-bl-md border border-white/10 bg-black/40 p-3 backdrop-blur-lg shadow-lg">
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/80">
                <span
                  className="h-1.5 w-1.5 rounded-full animate-pulse"
                  style={{ backgroundColor: secondaryColor }}
                />
                AI Chat · GPT-4o
              </p>
              <span className="rounded bg-white/10 px-1 py-0.2 text-[9px] font-mono text-gray-300">
                18ms latency
              </span>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-gray-200">
              Đã tóm tắt 12 trang thành 5 ý chính kèm nguồn tham chiếu.
              <span className="ai-cursor ml-1">|</span>
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Trust & Footer Bar */}
      <div className="relative z-10 hidden border-t border-white/10 pt-3 md:block">
        <div className="flex items-center justify-between text-[11px] text-gray-300">
          <span className="flex items-center gap-1 font-semibold text-gray-200">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-emerald-400">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                clipRule="evenodd"
              />
            </svg>
            AI Chat v2.4
          </span>
          <span className="text-[10px] tracking-wide text-gray-400">
            Thông minh • Đơn giản • Tối ưu
          </span>
        </div>
      </div>
    </div>
  )
}
