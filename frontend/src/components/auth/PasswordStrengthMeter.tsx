import { calculatePasswordStrength } from '../../utils/passwordStrength'

interface PasswordStrengthMeterProps {
  password: string
  id?: string
}

/**
 * Password strength: a 4-segment meter plus a criteria checklist, so the
 * requirement is never communicated by color alone. The visible label is the
 * live region; the meter itself is decorative for assistive tech.
 */
export function PasswordStrengthMeter({ password, id }: PasswordStrengthMeterProps) {
  const strength = calculatePasswordStrength(password)

  if (!password) return null

  return (
    <div
      id={id}
      className="mt-2.5 rounded-xl border border-white/5 bg-black/25 p-2.5 space-y-2 animate-auth-fade"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">
          Độ mạnh mật khẩu
        </span>
        <span
          className="text-xs font-bold transition-colors duration-200"
          style={{ color: strength.color }}
          aria-live="polite"
        >
          {strength.label}
        </span>
      </div>

      <div className="flex h-1.5 w-full gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4].map((segment) => {
          const isFilled = strength.score >= segment
          return (
            <span
              key={segment}
              className="h-full flex-1 rounded-full transition-all duration-300"
              style={{
                backgroundColor: isFilled ? strength.color : 'rgba(148, 163, 184, 0.16)',
                boxShadow: isFilled ? `0 0 8px ${strength.color}66` : 'none',
              }}
            />
          )
        })}
      </div>

      <ul className="grid grid-cols-1 gap-x-3 gap-y-1.5 pt-1 sm:grid-cols-2">
        {strength.criteria.map((criterion) => (
          <li
            key={criterion.id}
            className={`flex items-center gap-1.5 text-[11px] font-medium leading-snug transition-colors duration-200 ${
              criterion.met ? 'text-[#86EFAC]' : 'text-gray-400'
            }`}
          >
            {criterion.met ? (
              <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-3 w-3"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            ) : (
              <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-white/5 text-gray-500">
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-2 w-2"
                  aria-hidden="true"
                >
                  <circle cx="10" cy="10" r="3" />
                </svg>
              </span>
            )}
            <span>
              {criterion.label}
              <span className="sr-only">
                {criterion.met ? ' (đã đạt)' : ' (chưa đạt)'}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
