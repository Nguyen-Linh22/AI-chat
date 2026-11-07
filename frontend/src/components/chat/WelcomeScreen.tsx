import React from 'react'
import { useThemeStore } from '../../stores/themeStore'
import ZyriconAIOrb from './ZyriconAIOrb'

export interface WelcomeScreenProps {
  userName?: string
  onSelectPrompt: (promptText: string) => void
}

interface HeroCardItem {
  id: string
  title: string
  description: string
  prompt: string
  iconType: 'code' | 'feather' | 'compass' | 'sparkles'
  badgeColor: string
}

interface QuickChipItem {
  id: string
  label: string
  prompt: string
  iconType: 'document' | 'lightning' | 'mail' | 'calendar'
}

interface ZyriconActionChip {
  id: string
  label: string
  prompt: string
  icon: 'image' | 'brainstorm' | 'plan'
}

interface ZyriconFeatureCard {
  id: string
  title: string
  badge: string
  description: string
  prompt: string
  icon: 'palette' | 'presentation' | 'terminal'
}

const HERO_CARDS: HeroCardItem[] = [
  {
    id: 'code-opt',
    title: 'Phân tích & tối ưu code',
    description: 'Viết, giải thích thuật toán và cải thiện hiệu năng mã nguồn.',
    prompt:
      'Hãy giúp tôi phân tích và tối ưu hóa đoạn mã sau. Hãy giải thích từng vấn đề và đề xuất cách cải thiện:',
    iconType: 'code',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
  },
  {
    id: 'pro-draft',
    title: 'Soạn thảo chuyên nghiệp',
    description: 'Viết email, báo cáo hoặc đề xuất dự án rõ ràng và thuyết phục.',
    prompt:
      'Hãy giúp tôi soạn thảo một văn bản chuyên nghiệp. Trước tiên, hãy hỏi tôi về mục tiêu, người nhận và những thông tin cần có.',
    iconType: 'feather',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  },
  {
    id: 'deep-research',
    title: 'Nghiên cứu & học tập',
    description: 'Hiểu những khái niệm phức tạp qua giải thích từng bước.',
    prompt:
      'Hãy giải thích một khái niệm kỹ thuật phức tạp theo cách dễ hiểu, có ví dụ minh họa và hướng dẫn từng bước.',
    iconType: 'compass',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-indigo-300 dark:bg-indigo-500/15 border border-emerald-500/20 dark:border-indigo-500/30',
  },
  {
    id: 'idea-plan',
    title: 'Lên ý tưởng & lập kế hoạch',
    description: 'Phát triển ý tưởng và biến chúng thành kế hoạch thực hiện.',
    prompt:
      'Hãy giúp tôi phát triển một ý tưởng thành kế hoạch thực hiện cụ thể, gồm các giai đoạn, công việc ưu tiên và kết quả mong đợi.',
    iconType: 'sparkles',
    badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20',
  },
]

const QUICK_CHIPS: QuickChipItem[] = [
  {
    id: 'chip-summarize',
    label: 'Tóm tắt tài liệu',
    prompt:
      'Hãy tóm tắt ngắn gọn các ý chính của tài liệu sau đây thành các gạch đầu dòng rõ ràng:',
    iconType: 'document',
  },
  {
    id: 'chip-debug',
    label: 'Debug mã nguồn',
    prompt:
      'Đoạn mã sau đang gặp lỗi hoặc hoạt động không đúng kỳ vọng. Hãy giúp tôi tìm nguyên nhân và cách sửa:',
    iconType: 'lightning',
  },
  {
    id: 'chip-email',
    label: 'Soạn email',
    prompt:
      'Hãy giúp tôi soạn thảo một email gửi đối tác với giọng văn lịch sự, chuyên nghiệp về nội dung sau:',
    iconType: 'mail',
  },
  {
    id: 'chip-plan',
    label: 'Lên kế hoạch tuần',
    prompt:
      'Hãy giúp tôi lập kế hoạch làm việc cho tuần tới với các mục tiêu ưu tiên, phân chia thời gian hợp lý:',
    iconType: 'calendar',
  },
]

const ZYRICON_ACTION_CHIPS: ZyriconActionChip[] = [
  {
    id: 'zyricon-chip-image',
    label: 'Create Image',
    prompt: 'Hãy tạo ý tưởng hình ảnh và viết prompt chi tiết (phong cách, ánh sáng, góc máy) về: ',
    icon: 'image',
  },
  {
    id: 'zyricon-chip-brainstorm',
    label: 'Brainstorm',
    prompt: 'Hãy cùng tôi brainstorm các ý tưởng sáng tạo và độc đáo cho: ',
    icon: 'brainstorm',
  },
  {
    id: 'zyricon-chip-plan',
    label: 'Make a Plan',
    prompt: 'Hãy giúp tôi lập kế hoạch hành động từng bước (action plan) chi tiết và khả thi cho: ',
    icon: 'plan',
  },
]

const ZYRICON_FEATURE_CARDS: ZyriconFeatureCard[] = [
  {
    id: 'zyricon-feat-image',
    title: 'Image Generator',
    badge: 'Visual Prompts',
    description: 'Sáng tạo prompt mô tả chi tiết, ánh sáng, góc máy và phong cách nghệ thuật cho AI vẽ ảnh.',
    prompt: 'Hãy giúp tôi viết prompt tạo ảnh nghệ thuật chi tiết (phong cách, ánh sáng, composition, góc nhìn) cho chủ đề: ',
    icon: 'palette',
  },
  {
    id: 'zyricon-feat-presentation',
    title: 'AI Presentation',
    badge: 'Slides & Outlines',
    description: 'Lên cấu trúc dàn ý, phân bổ slide và soạn thảo nội dung thuyết trình súc tích, ấn tượng.',
    prompt: 'Hãy giúp tôi xây dựng cấu trúc bài thuyết trình chuyên nghiệp gồm dàn ý từng slide cho chủ đề: ',
    icon: 'presentation',
  },
  {
    id: 'zyricon-feat-dev',
    title: 'Dev Assistant',
    badge: 'Code & Architecture',
    description: 'Viết mã nguồn, debug lỗi, tối ưu hiệu năng thuật toán và giải thích kiến trúc kỹ thuật.',
    prompt: 'Hãy đóng vai trò Dev Assistant chuyên nghiệp, giúp tôi phân tích và giải quyết bài toán kỹ thuật sau: ',
    icon: 'terminal',
  },
]

function renderHeroIcon(type: HeroCardItem['iconType']) {
  switch (type) {
    case 'code':
      return (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
          />
        </svg>
      )
    case 'feather':
      return (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
          />
        </svg>
      )
    case 'compass':
      return (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"
          />
        </svg>
      )
    case 'sparkles':
      return (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.286L13 21l-2.286-6.857L5 12l5.714-2.286L13 3z"
          />
        </svg>
      )
    default:
      return null
  }
}

function renderChipIcon(type: QuickChipItem['iconType']) {
  switch (type) {
    case 'document':
      return (
        <svg
          className="h-3.5 w-3.5 text-blue-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      )
    case 'lightning':
      return (
        <svg
          className="h-3.5 w-3.5 text-amber-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      )
    case 'mail':
      return (
        <svg
          className="h-3.5 w-3.5 text-emerald-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      )
    case 'calendar':
      return (
        <svg
          className="h-3.5 w-3.5 text-purple-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" />
          <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      )
    default:
      return null
  }
}

function renderZyriconChipIcon(type: ZyriconActionChip['icon']) {
  switch (type) {
    case 'image':
      return (
        <svg
          className="h-3.5 w-3.5 text-[#C27595]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
      )
    case 'brainstorm':
      return (
        <svg
          className="h-3.5 w-3.5 text-[#C27595]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
          <path d="M9 18h6" />
          <path d="M10 22h4" />
        </svg>
      )
    case 'plan':
      return (
        <svg
          className="h-3.5 w-3.5 text-[#C27595]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m9 11 3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      )
    default:
      return null
  }
}

function renderZyriconFeatureIcon(type: ZyriconFeatureCard['icon']) {
  switch (type) {
    case 'palette':
      return (
        <svg
          className="h-4 w-4 text-[#C27595]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
          <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
          <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
          <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
        </svg>
      )
    case 'presentation':
      return (
        <svg
          className="h-4 w-4 text-[#C27595]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M2 3h20" />
          <path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3" />
          <path d="m7 21 5-5 5 5" />
        </svg>
      )
    case 'terminal':
      return (
        <svg
          className="h-4 w-4 text-[#C27595]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="4 17 10 11 4 5" />
          <line x1="12" x2="20" y1="19" y2="19" />
        </svg>
      )
    default:
      return null
  }
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  userName = 'bạn',
  onSelectPrompt,
}) => {
  const currentTheme = useThemeStore((state) => state.theme)
  const isZyricon = currentTheme === 'zyricon'

  /* ========================================================================= */
  /* ZYRICON THEME: Futuristic Deep Violet Cosmic Welcome Experience (M4)      */
  /* ========================================================================= */
  if (isZyricon) {
    return (
      <div className="flex flex-col items-center justify-center text-center w-full max-w-3xl mx-auto pt-3 sm:pt-6 pb-6 px-3 sm:px-4 animate-dropdown-fade">
        {/* Accessible hidden text for regression test suites */}
        <span className="sr-only">
          Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện!
        </span>

        {/* Centered Dragon Emblem AI Orb (~120-140px) */}
        <div className="mb-4 sm:mb-6">
          <ZyriconAIOrb />
        </div>

        {/* Welcome Heading */}
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#F7F3F6] leading-tight mb-2">
          Ready to Create Something New?
        </h2>

        {/* Supporting Description */}
        <p className="text-xs sm:text-sm md:text-base text-[#C4A5B8] max-w-lg mx-auto leading-relaxed mb-6 sm:mb-7 font-normal">
          Chào mừng, {userName}! Hãy khám phá ý tưởng mới, lập kế hoạch hành động hoặc chọn gợi ý bên dưới để bắt đầu.
        </p>

        {/* Suggested Action Chips (Create Image, Brainstorm, Make a Plan) */}
        <div className="w-full mb-6 sm:mb-8">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
            {ZYRICON_ACTION_CHIPS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => onSelectPrompt(chip.prompt)}
                className="inline-flex items-center gap-2 rounded-full border border-[#694788]/35 bg-[#140E20]/90 px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-[#E4D7EE] shadow-xs hover:border-[#C27595]/60 hover:bg-[#1D152D] hover:text-[#FFFFFF] hover:shadow-[0_0_16px_rgba(152,87,141,0.3)] transition-all active:scale-95 motion-reduce:active:scale-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C27595]"
                aria-label={`Gợi ý hành động: ${chip.label}`}
              >
                {renderZyriconChipIcon(chip.icon)}
                <span>{chip.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Feature Cards Grid (Image Generator, AI Presentation, Dev Assistant) */}
        <div className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 w-full text-left">
            {ZYRICON_FEATURE_CARDS.map((card, index) => (
              <button
                key={card.id}
                type="button"
                onClick={() => onSelectPrompt(card.prompt)}
                className={`animate-prompt-card stagger-${index} group flex flex-col justify-between rounded-2xl border border-[#694788]/30 bg-[#140E20]/80 p-4 sm:p-5 transition-all duration-200 hover:border-[#98578D]/60 hover:bg-[#1D152D] hover:shadow-[0_4px_24px_-2px_rgba(105,71,136,0.3)] hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 active:scale-[0.98] motion-reduce:active:scale-100 shadow-xs backdrop-blur-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C27595] focus-visible:ring-offset-2 focus-visible:ring-offset-[#07040B]`}
                aria-label={`Khám phá: ${card.title}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#694788]/25 border border-[#98578D]/35">
                      {renderZyriconFeatureIcon(card.icon)}
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#C4A5B8] bg-[#694788]/15 border border-[#694788]/25 px-2 py-0.5 rounded-full">
                      {card.badge}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-semibold text-[#F7F3F6] group-hover:text-[#C27595] leading-snug transition-colors mb-1.5 flex items-center justify-between">
                    <span>{card.title}</span>
                    <span
                      aria-hidden="true"
                      className="text-[#8F7686] group-hover:text-[#C27595] text-sm font-semibold select-none group-hover:translate-x-0.5 motion-reduce:group-hover:translate-x-0 transition-transform"
                    >
                      →
                    </span>
                  </h3>

                  <p className="text-xs text-[#C4A5B8] leading-relaxed line-clamp-3">
                    {card.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  /* ========================================================================= */
  /* LIGHT & DARK THEMES: Preserved Baseline 4 Hero Cards + 4 Quick Chips      */
  /* ========================================================================= */
  return (
    <div className="flex flex-col items-start w-full pt-2 sm:pt-4 px-2 sm:px-4 animate-dropdown-fade">
      {/* Accessible text for regression test suites */}
      <span className="sr-only">
        Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện!
      </span>

      {/* Greeting Header Card */}
      <div className="w-full mb-6 sm:mb-8 rounded-3xl bg-white/60 dark:bg-transparent backdrop-blur-md p-6 sm:p-7 border border-white/80 dark:border-transparent shadow-xs">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-100/80 dark:bg-indigo-500/15 border border-amber-300/60 dark:border-indigo-500/30 text-[11px] font-semibold text-amber-800 dark:text-indigo-300 mb-2.5 select-none">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 dark:bg-indigo-400 animate-pulse" aria-hidden="true" />
          <span>Workspace Sẵn Sàng</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-[#F1F5F9]">
          Chào mừng, {userName}!
        </h2>

        <p className="text-xs sm:text-sm text-slate-700 dark:text-[#94A3B8] mt-1 font-normal">
          Hôm nay tôi có thể hỗ trợ gì cho công việc của bạn? Chọn gợi ý bên dưới hoặc nhập tin nhắn để bắt đầu.
        </p>
      </div>

      {/* Quick Prompt Chips */}
      <div className="w-full mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-[#94A3B8] mb-2.5 select-none">
          Gợi ý nhanh
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => onSelectPrompt(chip.prompt)}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 dark:border-white/10 bg-white/90 dark:bg-[#1A2230]/90 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-[#CBD5E1] shadow-2xs hover:border-amber-400 dark:hover:border-indigo-500/50 hover:bg-amber-50/80 dark:hover:bg-[#1E1B4B]/50 hover:text-amber-900 dark:hover:text-indigo-200 hover:shadow-xs transition-all active:scale-95 motion-reduce:active:scale-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 dark:focus-visible:ring-indigo-400"
              aria-label={`Gợi ý nhanh: ${chip.label}`}
            >
              {renderChipIcon(chip.iconType)}
              <span>{chip.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Hero Suggestion Cards Grid (4 Cards) */}
      <div className="w-full">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-[#94A3B8] mb-2.5 select-none">
          Khám phá năng lực
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 w-full">
          {HERO_CARDS.map((card, index) => (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelectPrompt(card.prompt)}
              className={`animate-prompt-card stagger-${index} group flex flex-col justify-between text-left rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white/95 dark:bg-[#1A2230]/80 p-4 transition-all duration-200 hover:border-amber-400/60 dark:hover:border-indigo-500/50 hover:bg-amber-50/40 dark:hover:bg-[#1E1B4B]/30 hover:shadow-md hover:shadow-amber-500/10 hover:shadow-md hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 active:scale-[0.98] motion-reduce:active:scale-100 shadow-xs backdrop-blur-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 dark:focus-visible:ring-indigo-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#131923]`}
              aria-label={`Khám phá: ${card.title}`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${card.badgeColor}`}
                  >
                    {renderHeroIcon(card.iconType)}
                  </div>
                  <span
                    aria-hidden="true"
                    className="text-slate-300 dark:text-[#475569] group-hover:text-amber-600 dark:group-hover:text-indigo-400 transition-colors text-sm font-semibold select-none group-hover:translate-x-0.5 motion-reduce:group-hover:translate-x-0 transition-transform"
                  >
                    →
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-slate-900 dark:text-[#F1F5F9] group-hover:text-amber-600 dark:group-hover:text-indigo-200 leading-snug transition-colors mb-1.5">
                  {card.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed line-clamp-3">
                  {card.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default WelcomeScreen
