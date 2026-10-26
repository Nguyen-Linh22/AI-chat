import type { Ref } from 'react'

interface AuthAlertProps {
  tone?: 'error' | 'success'
  title: string
  message?: string
  /** Field links rendered inside the error summary. */
  items?: ReadonlyArray<{ id: string; label: string }>
  onItemClick?: (id: string) => void
  id?: string
  ref?: Ref<HTMLDivElement>
  /** Pass -1 so the summary can receive programmatic focus after a failed submit. */
  tabIndex?: number
  className?: string
}

const TONE_STYLES = {
  error: {
    container: 'border-[#F87171]/25 bg-[#F87171]/[0.07]',
    icon: 'text-[#FCA5A5]',
    link: 'text-[#FCA5A5] hover:text-white',
  },
  success: {
    container: 'border-[#4ADE80]/25 bg-[#4ADE80]/[0.07]',
    icon: 'text-[#4ADE80]',
    link: 'text-[#4ADE80] hover:text-white',
  },
} as const

/**
 * Form-level feedback used for server errors and validation summaries.
 * Error summaries are announced assertively and can hold programmatic focus,
 * with links that move focus to the invalid field.
 */
export function AuthAlert({
  tone = 'error',
  title,
  message,
  items,
  onItemClick,
  id,
  ref,
  tabIndex,
  className = '',
}: AuthAlertProps) {
  const styles = TONE_STYLES[tone]
  const hasLinks = Boolean(items && items.length > 0)

  return (
    <div
      ref={ref}
      id={id}
      tabIndex={tabIndex}
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
      className={`rounded-xl border px-3.5 py-3 outline-none animate-auth-fade ${styles.container} ${
        tabIndex !== undefined ? 'focus-visible:ring-2 focus-visible:ring-white/40' : ''
      } ${className}`}
    >
      <div className="flex items-start gap-2.5">
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`mt-0.5 h-4 w-4 shrink-0 ${styles.icon}`}
          aria-hidden="true"
        >
          {tone === 'error' ? (
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
              clipRule="evenodd"
            />
          ) : (
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
              clipRule="evenodd"
            />
          )}
        </svg>

        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold leading-snug text-white">{title}</p>

          {message && (
            <p className="mt-1 text-xs leading-relaxed text-gray-300">{message}</p>
          )}

          {hasLinks && (
            <ul className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
              {items?.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onItemClick?.(item.id)}
                    className={`rounded text-xs font-semibold underline decoration-dotted underline-offset-4 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${styles.link}`}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
