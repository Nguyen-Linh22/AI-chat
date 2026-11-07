import React from 'react'
import sidebarDragonLogo from '../../assets/sidebar-dragon-logo.webp'

export interface ZyriconAIOrbProps {
  className?: string
  size?: number
}

export const ZyriconAIOrb: React.FC<ZyriconAIOrbProps> = ({ className = '' }) => {
  return (
    <div
      data-testid="zyricon-ai-orb"
      className={`relative flex items-center justify-center select-none ${className}`}
      aria-label="Zyricon AI Dragon Orb"
      role="img"
    >
      {/* Ambient Radial Halo (Behind Orb) */}
      <div
        className="absolute -inset-4 sm:-inset-6 rounded-full bg-gradient-to-tr from-[#3B2568]/45 via-[#694788]/25 to-[#C27595]/30 blur-2xl opacity-75 pointer-events-none zyricon-orb-halo motion-reduce:opacity-50"
        aria-hidden="true"
      />

      {/* Subtle Cosmic Aura Rings */}
      <div
        className="absolute -inset-1.5 sm:-inset-2 rounded-full border border-[#98578D]/25 ring-1 ring-[#C27595]/15 pointer-events-none motion-reduce:animate-none"
        aria-hidden="true"
      />

      {/* Main Orb Sphere Container (120-140px target, responsive: 116px on mobile, 132px on desktop) */}
      <div
        className="zyricon-orb-container relative flex h-28 w-28 sm:h-32 sm:w-32 md:h-[136px] md:w-[136px] items-center justify-center rounded-full border border-[rgba(196,165,184,0.3)] bg-gradient-to-b from-[#2B1748] via-[#150E22] to-[#08040E] p-4 shadow-[0_0_35px_rgba(152,87,141,0.4),0_0_75px_rgba(105,71,136,0.2),inset_0_2px_4px_rgba(255,255,255,0.22),inset_0_-2px_6px_rgba(0,0,0,0.85)] overflow-hidden"
      >
        {/* Top Specular Curved Highlight */}
        <div
          className="absolute top-1 left-1/2 -translate-x-1/2 w-3/4 h-1/3 rounded-full bg-gradient-to-b from-white/25 via-white/5 to-transparent blur-[1px] pointer-events-none"
          aria-hidden="true"
        />

        {/* Inner Radial Purple Core Reflection */}
        <div
          className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_65%,rgba(194,117,149,0.22),rgba(59,37,104,0.25)_40%,transparent_75%)] pointer-events-none"
          aria-hidden="true"
        />

        {/* Dragon Emblem (Preserved Shape with Neon Violet/Pink Glow) */}
        <img
          src={sidebarDragonLogo}
          alt=""
          aria-hidden="true"
          className="relative z-10 h-16 w-16 sm:h-20 sm:w-20 object-contain drop-shadow-[0_0_14px_rgba(194,117,149,0.75)] drop-shadow-[0_3px_6px_rgba(0,0,0,0.9)] transition-transform duration-300 hover:scale-105 select-none"
        />
      </div>
    </div>
  )
}

export default ZyriconAIOrb

