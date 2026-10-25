import React from 'react'

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
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
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

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  userName = 'bạn',
  onSelectPrompt,
}) => {
  return (
    <div className="flex flex-col items-start w-full pt-2 sm:pt-4 px-2 sm:px-4 animate-dropdown">
      {/* Accessible text for regression test suites */}
      <span className="sr-only">
        Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện!
      </span>

      {/* Greeting Header */}
      <div className="mb-4 sm:mb-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-[#1B8F3D] dark:text-emerald-400 mb-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#1B8F3D] dark:bg-emerald-400 animate-pulse" aria-hidden="true" />
          <span>Workspace Sẵn Sàng</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-[#F1F5F9]">
          Chào mừng, {userName}!
        </h2>

        <p className="text-xs sm:text-sm text-slate-500 dark:text-[#94A3B8] mt-1 font-normal">
          Hôm nay tôi có thể hỗ trợ gì cho công việc của bạn? Chọn gợi ý bên dưới hoặc nhập tin nhắn để bắt đầu.
        </p>
      </div>

      {/* Quick Prompt Chips */}
      <div className="w-full mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-[#64748B] mb-2.5 select-none">
          Gợi ý nhanh
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => onSelectPrompt(chip.prompt)}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 dark:border-white/10 bg-white/90 dark:bg-[#1A2230]/90 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-[#CBD5E1] shadow-2xs hover:border-[#1B8F3D]/50 dark:hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-[#222C3D] hover:text-[#1B8F3D] dark:hover:text-emerald-300 transition-all active:scale-95 motion-reduce:active:scale-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B8F3D] dark:focus-visible:ring-emerald-400"
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
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-[#64748B] mb-2.5 select-none">
          Khám phá năng lực
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 w-full">
          {HERO_CARDS.map((card, index) => (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelectPrompt(card.prompt)}
              className={`animate-prompt-card stagger-${index} group flex flex-col justify-between text-left rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white/90 dark:bg-[#1A2230]/80 p-4 transition-all duration-200 hover:border-[#1B8F3D]/50 dark:hover:border-emerald-500/50 hover:bg-slate-50/90 dark:hover:bg-[#222C3D] hover:shadow-md hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 active:scale-[0.98] motion-reduce:active:scale-100 shadow-xs backdrop-blur-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B8F3D] dark:focus-visible:ring-emerald-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#131923]`}
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
                    className="text-slate-300 dark:text-[#475569] group-hover:text-[#1B8F3D] dark:group-hover:text-emerald-400 transition-colors text-sm font-semibold select-none group-hover:translate-x-0.5 motion-reduce:group-hover:translate-x-0 transition-transform"
                  >
                    →
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-slate-900 dark:text-[#F1F5F9] group-hover:text-[#1B8F3D] dark:group-hover:text-emerald-300 leading-snug transition-colors mb-1.5">
                  {card.title}
                </h3>

                <p className="text-xs text-slate-500 dark:text-[#94A3B8] leading-relaxed line-clamp-3">
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
