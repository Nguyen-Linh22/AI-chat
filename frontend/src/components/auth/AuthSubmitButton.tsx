interface AuthSubmitButtonProps {
  tone: 'login' | 'register'
  label: string
  loadingLabel: string
  loading: boolean
}

const TONE = {
  login: {
    backgroundImage: 'linear-gradient(180deg, #C0222E 0%, #9E1924 100%)',
    shadowClass:
      'shadow-[0_12px_30px_-12px_rgba(185,30,43,0.75)] hover:shadow-[0_16px_36px_-12px_rgba(185,30,43,0.9)]',
    ringClass: 'focus-visible:ring-[#F87171]',
  },
  register: {
    // Lightest stop is 4.96:1 against white text, so the CTA keeps WCAG AA.
    backgroundImage: 'linear-gradient(180deg, #17813A 0%, #12662B 100%)',
    shadowClass:
      'shadow-[0_12px_30px_-12px_rgba(27,143,61,0.75)] hover:shadow-[0_16px_36px_-12px_rgba(27,143,61,0.9)]',
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
      className={`mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-[transform,box-shadow] duration-200 hover:-translate-y-px active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F18] ${styles.shadowClass} ${styles.ringClass}`}
      style={{ backgroundImage: styles.backgroundImage }}
    >
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
        <span>{label}</span>
      )}
    </button>
  )
}
