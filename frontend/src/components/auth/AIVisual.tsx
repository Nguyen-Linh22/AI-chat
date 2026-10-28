interface AIVisualProps {
  mode: 'login' | 'register'
}

export function AIVisual({ mode }: AIVisualProps) {
  const isLogin = mode === 'login'
  const primaryColor = isLogin ? '#B91E2B' : '#1B8F3D'
  const secondaryColor = isLogin ? '#F87171' : '#4ADE80'
  const glowId = isLogin ? 'redGlow' : 'greenGlow'
  const gradId = isLogin ? 'redGradient' : 'greenGradient'

  return (
    <div className="relative flex w-full items-center justify-center py-2 select-none">
      <svg
        viewBox="0 0 320 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full max-w-[270px] h-auto drop-shadow-[0_12px_24px_rgba(0,0,0,0.5)]"
        aria-hidden="true"
      >
        <defs>
          {/* Radial glow for central core */}
          <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={secondaryColor} stopOpacity="0.5" />
            <stop offset="50%" stopColor={primaryColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0" />
          </radialGradient>

          {/* Linear gradient for connection lines and shapes */}
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primaryColor} />
            <stop offset="100%" stopColor={secondaryColor} />
          </linearGradient>

          {/* Node glow filter */}
          <filter id="subtle-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ambient background glow ring */}
        <circle
          cx="160"
          cy="110"
          r="75"
          fill={`url(#${glowId})`}
          className="animate-pulse"
          style={{ animationDuration: '4s' }}
        />

        {/* Outer orbital rings */}
        <ellipse
          cx="160"
          cy="110"
          rx="115"
          ry="56"
          transform="rotate(-15 160 110)"
          stroke={primaryColor}
          strokeWidth="1.2"
          strokeDasharray="4 6"
          strokeOpacity="0.45"
        />
        <ellipse
          cx="160"
          cy="110"
          rx="135"
          ry="68"
          transform="rotate(22 160 110)"
          stroke={secondaryColor}
          strokeWidth="1"
          strokeDasharray="5 7"
          strokeOpacity="0.35"
        />

        {/* Neural Network Connection Lines */}
        <line
          x1="160"
          y1="110"
          x2="75"
          y2="65"
          stroke={`url(#${gradId})`}
          strokeWidth="1.5"
          strokeOpacity="0.6"
          strokeDasharray="2 3"
        />
        <line
          x1="160"
          y1="110"
          x2="245"
          y2="65"
          stroke={`url(#${gradId})`}
          strokeWidth="1.5"
          strokeOpacity="0.6"
          strokeDasharray="2 3"
        />
        <line
          x1="160"
          y1="110"
          x2="60"
          y2="145"
          stroke={`url(#${gradId})`}
          strokeWidth="1.5"
          strokeOpacity="0.5"
        />
        <line
          x1="160"
          y1="110"
          x2="260"
          y2="145"
          stroke={`url(#${gradId})`}
          strokeWidth="1.5"
          strokeOpacity="0.5"
        />
        <line
          x1="160"
          y1="110"
          x2="160"
          y2="35"
          stroke={`url(#${gradId})`}
          strokeWidth="1.5"
          strokeOpacity="0.4"
          strokeDasharray="3 3"
        />
        <line
          x1="160"
          y1="110"
          x2="160"
          y2="185"
          stroke={`url(#${gradId})`}
          strokeWidth="1.5"
          strokeOpacity="0.4"
        />

        {/* Lateral cross-connections */}
        <line
          x1="75"
          y1="65"
          x2="60"
          y2="145"
          stroke={primaryColor}
          strokeWidth="1"
          strokeOpacity="0.3"
          strokeDasharray="2 4"
        />
        <line
          x1="245"
          y1="65"
          x2="260"
          y2="145"
          stroke={primaryColor}
          strokeWidth="1"
          strokeOpacity="0.3"
          strokeDasharray="2 4"
        />

        {/* Peripheral Nodes */}
        {/* Node 1: Top-Left (Conversation) */}
        <g transform="translate(75, 65)">
          <circle r="14" fill="#0A0E17" stroke={primaryColor} strokeWidth="1.5" />
          <circle r="4.5" fill={secondaryColor} />
          <circle r="18" stroke={primaryColor} strokeWidth="1" strokeOpacity="0.25" />
        </g>

        {/* Node 2: Top-Right (Models) */}
        <g transform="translate(245, 65)">
          <circle r="14" fill="#0A0E17" stroke={primaryColor} strokeWidth="1.5" />
          <circle r="4.5" fill={secondaryColor} />
          <circle r="18" stroke={primaryColor} strokeWidth="1" strokeOpacity="0.25" />
        </g>

        {/* Node 3: Bottom-Left (Streaming) */}
        <g transform="translate(60, 145)">
          <circle r="11" fill="#0A0E17" stroke={secondaryColor} strokeWidth="1.2" />
          <circle r="3.5" fill={primaryColor} />
        </g>

        {/* Node 4: Bottom-Right (Security / Data) */}
        <g transform="translate(260, 145)">
          <circle r="11" fill="#0A0E17" stroke={secondaryColor} strokeWidth="1.2" />
          <circle r="3.5" fill={primaryColor} />
        </g>

        {/* Node 5: Top Peak */}
        <g transform="translate(160, 35)">
          <circle r="7.5" fill="#0A0E17" stroke={primaryColor} strokeWidth="1.2" />
          <circle r="3" fill={secondaryColor} />
        </g>

        {/* Node 6: Bottom Anchor */}
        <g transform="translate(160, 185)">
          <circle r="7.5" fill="#0A0E17" stroke={primaryColor} strokeWidth="1.2" />
          <circle r="3" fill={secondaryColor} />
        </g>

        {/* Central AI Core */}
        <g transform="translate(160, 110)">
          {/* Rotating outer diamond */}
          <rect
            x="-26"
            y="-26"
            width="52"
            height="52"
            rx="12"
            transform="rotate(45)"
            fill={`url(#${gradId})`}
            fillOpacity="0.2"
            stroke={`url(#${gradId})`}
            strokeWidth="1.5"
          />

          {/* Core inner circular container */}
          <circle r="21" fill="#080C14" stroke={secondaryColor} strokeWidth="1.5" />

          {/* Central AI Glyph */}
          <text
            x="0"
            y="5"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="12"
            fontWeight="800"
            fontFamily="system-ui, -apple-system, sans-serif"
            letterSpacing="0.8"
          >
            AI
          </text>
        </g>

        {/* Floating micro constellation sparkles */}
        <circle cx="110" cy="40" r="1.5" fill="#FFFFFF" opacity="0.7" />
        <circle cx="210" cy="40" r="1.5" fill="#FFFFFF" opacity="0.7" />
        <circle cx="40" cy="100" r="1.5" fill={secondaryColor} opacity="0.6" />
        <circle cx="280" cy="100" r="1.5" fill={secondaryColor} opacity="0.6" />
        <circle cx="115" cy="180" r="1.5" fill="#FFFFFF" opacity="0.5" />
        <circle cx="205" cy="180" r="1.5" fill="#FFFFFF" opacity="0.5" />
      </svg>
    </div>
  )
}
