interface AuthSubmitButtonProps {
  tone: 'login' | 'register'
  label: string
  loadingLabel: string
  loading: boolean
}

const TONE = {
  login: {
    backgroundImage: 'linear-gradient(135deg, #D32532 0%, #B91E2B 55%, #8A121C 100%)',
    shadowClass:
      'shadow-[0_14px_34px_-10px_rgba(185,30,43,0.8)] hover:shadow-[0_18px_40px_-10px_rgba(185,30,43,0.95)]',
    ringClass: 'focus-visible:ring-[#F87171]',
  },
  register: {
    // Lightest stop is 4.96:1 against white text, so the CTA keeps WCAG AA.
    backgroundImage: 'linear-gradient(135deg, #198E40 0%, #157A33 55%, #0E5223 100%)',
    shadowClass:
      'shadow-[0_14px_34px_-10px_rgba(27,143,61,0.8)] hover:shadow-[0_18px_40px_-10px_rgba(27,143,61,0.95)]',
    ringClass: 'focus-visible:ring-[#4ADE80]',
  },
} as const

export function AuthSubmitButton({
  tone,
  label,
  loadingLabel,
  loading,
}: AuthSubmitButtonProps) {
  const styles = TONE[tone]

  return (
    <button
      type="submit"
      disabled={loading}
      aria-busy={loading}
      className={`group relative mt-2 flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl text-sm font-bold tracking-wide text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F18] ${styles.shadowClass} ${styles.ringClass}`}
      style={{ backgroundImage: styles.backgroundImage }}
    >
      {/* Light sweep shimmer on hover */}
      <div
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-in-out group-hover:translate-x-full"
        aria-hidden="true"
      />

      {loading ? (
        <>
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              className="opacity-30"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-90"
              fill="currentColor"
              d="M12 2a10 10 0 0 1 10 10h-3a7 7 0 0 0-7-7V2Z"
            />
          </svg>
          <span>{loadingLabel}</span>
        </>
      ) : (
        <>
          <span>{label}</span>
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
              clipRule="evenodd"
            />
          </svg>
        </>
      )}
    </button>
  )
}
