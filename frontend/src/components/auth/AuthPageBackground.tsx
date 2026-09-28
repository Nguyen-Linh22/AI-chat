import { BRAND_COLORS } from '../../constants/theme'

interface AuthPageBackgroundProps {
  mode: 'login' | 'register'
}

export function AuthPageBackground({ mode }: AuthPageBackgroundProps) {
  const isLogin = mode === 'login'

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden select-none bg-[#05080E]"
      aria-hidden="true"
    >
      {/* =========================================================================
          LOGIN ENVIRONMENT: RED ATMOSPHERE (#B91E2B)
          Derived directly from the Login visual panel (#80131D -> #450A10 -> #0A0E17)
         ========================================================================= */}
      <div
        className={`absolute inset-0 transition-opacity duration-600 ease-in-out ${
          isLogin ? 'opacity-100 z-10' : 'opacity-0 z-0'
        }`}
      >
        {/* Base Gradient: Same color family and direction as Login panel */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#4d0b12] via-[#240508] to-[#05080E]" />

        {/* Ambient Glows: Red atmospheric lighting casting out around card */}
        {/* Primary Glow on Left (where Red panel sits) */}
        <div
          className="absolute -left-20 top-[15%] h-[680px] w-[680px] rounded-full blur-[140px] animate-aurora-1"
          style={{
            backgroundColor: BRAND_COLORS.primaryRed,
            opacity: 0.35,
          }}
        />

        {/* Behind-Card Glow centered toward the left */}
        <div
          className="absolute left-[36%] top-1/2 -translate-x-1/2 -translate-y-1/2 h-[650px] w-[850px] rounded-full blur-[160px]"
          style={{
            backgroundColor: BRAND_COLORS.primaryRed,
            opacity: 0.28,
          }}
        />

        {/* Secondary atmospheric glow in bottom-right */}
        <div
          className="absolute -bottom-24 -right-24 h-[600px] w-[600px] rounded-full blur-[150px] animate-aurora-2"
          style={{
            backgroundColor: '#80131D',
            opacity: 0.25,
          }}
        />

        {/* Texture: Exact same micro-grid texture as visual panel */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.04]" />

        {/* Red Themed Distant AI Neural Network Pattern */}
        <div className="absolute inset-0 w-full h-full opacity-[0.07] animate-network-drift">
          <svg
            viewBox="0 0 1600 1000"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid slice"
            className="w-full h-full"
          >
            {/* Top-Left Cluster (High red affinity) */}
            <line x1="120" y1="140" x2="280" y2="200" stroke={BRAND_COLORS.primaryRed} strokeWidth="1" />
            <line x1="280" y1="200" x2="420" y2="130" stroke="#F87171" strokeWidth="0.8" strokeDasharray="4 6" />
            <line x1="280" y1="200" x2="220" y2="340" stroke={BRAND_COLORS.primaryRed} strokeWidth="1.2" />
            <line x1="120" y1="140" x2="220" y2="340" stroke="#EF4444" strokeWidth="0.8" />
            <line x1="420" y1="130" x2="560" y2="220" stroke={BRAND_COLORS.primaryRed} strokeWidth="0.8" />
            <line x1="220" y1="340" x2="380" y2="400" stroke="#F87171" strokeWidth="0.8" strokeDasharray="3 5" />
            <line x1="560" y1="220" x2="380" y2="400" stroke={BRAND_COLORS.primaryRed} strokeWidth="0.8" />

            {/* Top-Right Cluster */}
            <line x1="1080" y1="120" x2="1240" y2="180" stroke="#991B1B" strokeWidth="0.8" />
            <line x1="1240" y1="180" x2="1420" y2="110" stroke={BRAND_COLORS.primaryRed} strokeWidth="0.8" />
            <line x1="1240" y1="180" x2="1320" y2="300" stroke="#F87171" strokeWidth="0.8" strokeDasharray="4 6" />
            <line x1="1420" y1="110" x2="1520" y2="240" stroke="#991B1B" strokeWidth="0.8" />
            <line x1="1320" y1="300" x2="1520" y2="240" stroke={BRAND_COLORS.primaryRed} strokeWidth="0.8" />
            <line x1="1080" y1="120" x2="1180" y2="280" stroke="#EF4444" strokeWidth="0.8" />
            <line x1="1180" y1="280" x2="1320" y2="300" stroke="#991B1B" strokeWidth="0.8" />

            {/* Bottom-Left Cluster */}
            <line x1="160" y1="680" x2="300" y2="740" stroke={BRAND_COLORS.primaryRed} strokeWidth="0.8" strokeDasharray="4 6" />
            <line x1="300" y1="740" x2="210" y2="880" stroke="#F87171" strokeWidth="0.8" />
            <line x1="160" y1="680" x2="210" y2="880" stroke={BRAND_COLORS.primaryRed} strokeWidth="0.8" />
            <line x1="300" y1="740" x2="450" y2="800" stroke="#991B1B" strokeWidth="0.8" />
            <line x1="450" y1="800" x2="520" y2="690" stroke="#EF4444" strokeWidth="0.8" strokeDasharray="3 5" />
            <line x1="220" y1="340" x2="160" y2="680" stroke="#991B1B" strokeWidth="0.6" strokeDasharray="6 8" />

            {/* Bottom-Right Cluster */}
            <line x1="1120" y1="720" x2="1280" y2="670" stroke={BRAND_COLORS.primaryRed} strokeWidth="0.8" />
            <line x1="1280" y1="670" x2="1440" y2="760" stroke="#F87171" strokeWidth="0.8" />
            <line x1="1120" y1="720" x2="1200" y2="860" stroke="#991B1B" strokeWidth="0.8" strokeDasharray="4 6" />
            <line x1="1200" y1="860" x2="1360" y2="890" stroke={BRAND_COLORS.primaryRed} strokeWidth="0.8" />
            <line x1="1360" y1="890" x2="1440" y2="760" stroke="#EF4444" strokeWidth="0.8" />
            <line x1="1320" y1="300" x2="1280" y2="670" stroke="#991B1B" strokeWidth="0.6" strokeDasharray="6 8" />

            {/* Cross-Canvas Distant Bridges */}
            <line x1="560" y1="220" x2="1080" y2="120" stroke="#991B1B" strokeWidth="0.6" strokeDasharray="5 9" />
            <line x1="450" y1="800" x2="1120" y2="720" stroke="#991B1B" strokeWidth="0.6" strokeDasharray="5 9" />

            {/* Nodes */}
            <circle cx="120" cy="140" r="3" fill="#EF4444" />
            <circle cx="280" cy="200" r="4" fill={BRAND_COLORS.primaryRed} />
            <circle cx="280" cy="200" r="8" stroke={BRAND_COLORS.primaryRed} strokeWidth="0.75" strokeOpacity="0.6" />
            <circle cx="420" cy="130" r="3" fill="#F87171" />
            <circle cx="220" cy="340" r="3.5" fill={BRAND_COLORS.primaryRed} />
            <circle cx="560" cy="220" r="3.5" fill="#EF4444" />
            <circle cx="380" cy="400" r="3" fill="#F87171" />

            <circle cx="1080" cy="120" r="3.5" fill={BRAND_COLORS.primaryRed} />
            <circle cx="1240" cy="180" r="4" fill="#F87171" />
            <circle cx="1240" cy="180" r="8" stroke="#F87171" strokeWidth="0.75" strokeOpacity="0.6" />
            <circle cx="1420" cy="110" r="3" fill="#EF4444" />
            <circle cx="1320" cy="300" r="3.5" fill={BRAND_COLORS.primaryRed} />
            <circle cx="1520" cy="240" r="3" fill="#F87171" />
            <circle cx="1180" cy="280" r="3" fill="#991B1B" />

            <circle cx="160" cy="680" r="3" fill="#EF4444" />
            <circle cx="300" cy="740" r="4" fill={BRAND_COLORS.primaryRed} />
            <circle cx="210" cy="880" r="3.5" fill="#F87171" />
            <circle cx="450" cy="800" r="3" fill="#991B1B" />
            <circle cx="520" cy="690" r="3" fill="#EF4444" />

            <circle cx="1120" cy="720" r="3.5" fill={BRAND_COLORS.primaryRed} />
            <circle cx="1280" cy="670" r="4" fill="#F87171" />
            <circle cx="1280" cy="670" r="8" stroke={BRAND_COLORS.primaryRed} strokeWidth="0.75" strokeOpacity="0.6" />
            <circle cx="1440" cy="760" r="3" fill="#EF4444" />
            <circle cx="1200" cy="860" r="3" fill="#991B1B" />
            <circle cx="1360" cy="890" r="3.5" fill={BRAND_COLORS.primaryRed} />

            {/* Sparkles */}
            <circle cx="700" cy="180" r="1.8" fill="#FCA5A5" opacity="0.8" />
            <circle cx="920" cy="230" r="1.8" fill="#FCA5A5" opacity="0.8" />
            <circle cx="670" cy="780" r="1.8" fill="#FCA5A5" opacity="0.8" />
            <circle cx="950" cy="830" r="1.8" fill="#FCA5A5" opacity="0.8" />
          </svg>
        </div>
      </div>

      {/* =========================================================================
          REGISTER ENVIRONMENT: GREEN ATMOSPHERE (#1B8F3D)
          Derived directly from the Register visual panel (#12662B -> #083818 -> #0A0E17)
         ========================================================================= */}
      <div
        className={`absolute inset-0 transition-opacity duration-600 ease-in-out ${
          !isLogin ? 'opacity-100 z-10' : 'opacity-0 z-0'
        }`}
      >
        {/* Base Gradient: Same color family and direction as Register panel */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0c3e1b] via-[#051f0d] to-[#05080E]" />

        {/* Ambient Glows: Green atmospheric lighting casting out around card */}
        {/* Primary Glow on Right (where Green panel sits) */}
        <div
          className="absolute -right-20 top-[15%] h-[680px] w-[680px] rounded-full blur-[140px] animate-aurora-1"
          style={{
            backgroundColor: BRAND_COLORS.primaryGreen,
            opacity: 0.35,
          }}
        />

        {/* Behind-Card Glow centered toward the right */}
        <div
          className="absolute left-[64%] top-1/2 -translate-x-1/2 -translate-y-1/2 h-[650px] w-[850px] rounded-full blur-[160px]"
          style={{
            backgroundColor: BRAND_COLORS.primaryGreen,
            opacity: 0.28,
          }}
        />

        {/* Secondary atmospheric glow in bottom-left */}
        <div
          className="absolute -bottom-24 -left-24 h-[600px] w-[600px] rounded-full blur-[150px] animate-aurora-2"
          style={{
            backgroundColor: '#12662B',
            opacity: 0.25,
          }}
        />

        {/* Texture: Exact same micro-grid texture as visual panel */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.04]" />

        {/* Green Themed Distant AI Neural Network Pattern */}
        <div className="absolute inset-0 w-full h-full opacity-[0.07] animate-network-drift">
          <svg
            viewBox="0 0 1600 1000"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid slice"
            className="w-full h-full"
          >
            {/* Top-Left Cluster */}
            <line x1="120" y1="140" x2="280" y2="200" stroke="#14532D" strokeWidth="0.8" />
            <line x1="280" y1="200" x2="420" y2="130" stroke="#4ADE80" strokeWidth="0.8" strokeDasharray="4 6" />
            <line x1="280" y1="200" x2="220" y2="340" stroke={BRAND_COLORS.primaryGreen} strokeWidth="1" />
            <line x1="120" y1="140" x2="220" y2="340" stroke="#16A34A" strokeWidth="0.8" />
            <line x1="420" y1="130" x2="560" y2="220" stroke={BRAND_COLORS.primaryGreen} strokeWidth="0.8" />
            <line x1="220" y1="340" x2="380" y2="400" stroke="#4ADE80" strokeWidth="0.8" strokeDasharray="3 5" />
            <line x1="560" y1="220" x2="380" y2="400" stroke={BRAND_COLORS.primaryGreen} strokeWidth="0.8" />

            {/* Top-Right Cluster (High green affinity) */}
            <line x1="1080" y1="120" x2="1240" y2="180" stroke={BRAND_COLORS.primaryGreen} strokeWidth="1" />
            <line x1="1240" y1="180" x2="1420" y2="110" stroke="#4ADE80" strokeWidth="1.2" />
            <line x1="1240" y1="180" x2="1320" y2="300" stroke={BRAND_COLORS.primaryGreen} strokeWidth="1" strokeDasharray="4 6" />
            <line x1="1420" y1="110" x2="1520" y2="240" stroke="#16A34A" strokeWidth="0.8" />
            <line x1="1320" y1="300" x2="1520" y2="240" stroke="#4ADE80" strokeWidth="0.8" />
            <line x1="1080" y1="120" x2="1180" y2="280" stroke={BRAND_COLORS.primaryGreen} strokeWidth="0.8" />
            <line x1="1180" y1="280" x2="1320" y2="300" stroke="#16A34A" strokeWidth="0.8" />

            {/* Bottom-Left Cluster */}
            <line x1="160" y1="680" x2="300" y2="740" stroke={BRAND_COLORS.primaryGreen} strokeWidth="0.8" strokeDasharray="4 6" />
            <line x1="300" y1="740" x2="210" y2="880" stroke="#4ADE80" strokeWidth="0.8" />
            <line x1="160" y1="680" x2="210" y2="880" stroke={BRAND_COLORS.primaryGreen} strokeWidth="0.8" />
            <line x1="300" y1="740" x2="450" y2="800" stroke="#16A34A" strokeWidth="0.8" />
            <line x1="450" y1="800" x2="520" y2="690" stroke="#22C55E" strokeWidth="0.8" strokeDasharray="3 5" />
            <line x1="220" y1="340" x2="160" y2="680" stroke="#14532D" strokeWidth="0.6" strokeDasharray="6 8" />

            {/* Bottom-Right Cluster */}
            <line x1="1120" y1="720" x2="1280" y2="670" stroke={BRAND_COLORS.primaryGreen} strokeWidth="1" />
            <line x1="1280" y1="670" x2="1440" y2="760" stroke="#4ADE80" strokeWidth="0.8" />
            <line x1="1120" y1="720" x2="1200" y2="860" stroke="#16A34A" strokeWidth="0.8" strokeDasharray="4 6" />
            <line x1="1200" y1="860" x2="1360" y2="890" stroke={BRAND_COLORS.primaryGreen} strokeWidth="0.8" />
            <line x1="1360" y1="890" x2="1440" y2="760" stroke="#22C55E" strokeWidth="0.8" />
            <line x1="1320" y1="300" x2="1280" y2="670" stroke="#14532D" strokeWidth="0.6" strokeDasharray="6 8" />

            {/* Cross-Canvas Distant Bridges */}
            <line x1="560" y1="220" x2="1080" y2="120" stroke="#16A34A" strokeWidth="0.6" strokeDasharray="5 9" />
            <line x1="450" y1="800" x2="1120" y2="720" stroke="#16A34A" strokeWidth="0.6" strokeDasharray="5 9" />

            {/* Nodes */}
            <circle cx="120" cy="140" r="3" fill="#16A34A" />
            <circle cx="280" cy="200" r="3.5" fill={BRAND_COLORS.primaryGreen} />
            <circle cx="420" cy="130" r="3" fill="#4ADE80" />
            <circle cx="220" cy="340" r="3.5" fill="#14532D" />
            <circle cx="560" cy="220" r="3.5" fill={BRAND_COLORS.primaryGreen} />
            <circle cx="380" cy="400" r="3" fill="#4ADE80" />

            <circle cx="1080" cy="120" r="3.5" fill="#16A34A" />
            <circle cx="1240" cy="180" r="4.5" fill={BRAND_COLORS.primaryGreen} />
            <circle cx="1240" cy="180" r="9" stroke={BRAND_COLORS.primaryGreen} strokeWidth="0.75" strokeOpacity="0.6" />
            <circle cx="1420" cy="110" r="3" fill="#4ADE80" />
            <circle cx="1320" cy="300" r="4" fill={BRAND_COLORS.primaryGreen} />
            <circle cx="1520" cy="240" r="3" fill="#22C55E" />
            <circle cx="1180" cy="280" r="3" fill="#16A34A" />

            <circle cx="160" cy="680" r="3" fill="#16A34A" />
            <circle cx="300" cy="740" r="4" fill={BRAND_COLORS.primaryGreen} />
            <circle cx="210" cy="880" r="3.5" fill="#4ADE80" />
            <circle cx="450" cy="800" r="3" fill="#14532D" />
            <circle cx="520" cy="690" r="3" fill="#22C55E" />

            <circle cx="1120" cy="720" r="3.5" fill="#16A34A" />
            <circle cx="1280" cy="670" r="4" fill={BRAND_COLORS.primaryGreen} />
            <circle cx="1280" cy="670" r="8" stroke={BRAND_COLORS.primaryGreen} strokeWidth="0.75" strokeOpacity="0.6" />
            <circle cx="1440" cy="760" r="3" fill="#4ADE80" />
            <circle cx="1200" cy="860" r="3" fill="#14532D" />
            <circle cx="1360" cy="890" r="3.5" fill={BRAND_COLORS.primaryGreen} />

            {/* Sparkles */}
            <circle cx="700" cy="180" r="1.8" fill="#86EFAC" opacity="0.8" />
            <circle cx="920" cy="230" r="1.8" fill="#86EFAC" opacity="0.8" />
            <circle cx="670" cy="780" r="1.8" fill="#86EFAC" opacity="0.8" />
            <circle cx="950" cy="830" r="1.8" fill="#86EFAC" opacity="0.8" />
          </svg>
        </div>
      </div>

      {/* Subtle depth vignette around edges */}
      <div className="pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(circle_at_center,_transparent_45%,_rgba(5,8,14,0.65)_100%)]" />
    </div>
  )
}
