/**
 * ZYRICON COSMIC ATMOSPHERE — STATIC CSS FALLBACK
 *
 * Lightweight, GPU-free, pure CSS/HTML cosmic backdrop displayed when:
 * 1. WebGL is unavailable on the client.
 * 2. Hardware context loss recovery timed out.
 * 3. Fatal render exception occurred.
 *
 * Fully compliant with Zyricon dark cosmic styling & WCAG AA contrast.
 */

import React from 'react';

export interface CosmicStaticFallbackProps {
  errorMessage?: string;
  onRetry?: () => void;
  className?: string;
}

export const CosmicStaticFallback: React.FC<CosmicStaticFallbackProps> = ({
  errorMessage,
  onRetry,
  className = '',
}) => {
  return (
    <div
      data-testid="cosmic-static-fallback"
      role="img"
      aria-label="Cosmic deep space atmosphere fallback"
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className}`}
      style={{
        background: `
          radial-gradient(ellipse 60% 50% at 80% 25%, rgba(68, 20, 80, 0.40) 0%, transparent 70%),
          radial-gradient(ellipse 50% 60% at 20% 70%, rgba(32, 12, 48, 0.55) 0%, transparent 70%),
          radial-gradient(circle at 50% 50%, rgba(13, 7, 20, 0.70) 0%, transparent 80%),
          linear-gradient(145deg, #07040B 0%, #0D0714 45%, #180A26 100%)
        `,
      }}
    >
      {/* Subtle CSS star field layer */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(1.5px 1.5px at 15% 20%, #f9fafb 50%, transparent 100%),
            radial-gradient(1px 1px at 35% 80%, #93c5fd 50%, transparent 100%),
            radial-gradient(2px 2px at 70% 30%, #c084fc 50%, transparent 100%),
            radial-gradient(1px 1px at 85% 75%, #fde68a 50%, transparent 100%),
            radial-gradient(1.5px 1.5px at 50% 15%, #ffffff 50%, transparent 100%),
            radial-gradient(1px 1px at 60% 65%, #d1d5db 50%, transparent 100%),
            radial-gradient(1.5px 1.5px at 25% 45%, #e879f9 50%, transparent 100%)
          `,
          backgroundSize: '240px 240px',
        }}
      />

      {/* Optional graceful retry pill if failure occurred */}
      {(errorMessage || onRetry) && (
        <div className="absolute bottom-4 right-4 z-10 pointer-events-auto flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#170B24]/85 border border-[#8B3A7E]/40 backdrop-blur-md shadow-lg text-xs text-[#FFE4F0]">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>{errorMessage || 'WebGL 3D Fallback Mode'}</span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="ml-1 px-2 py-0.5 rounded bg-[#8B3A7E]/30 hover:bg-[#8B3A7E]/60 text-[#FFE4F0] transition-colors focus:outline-none focus:ring-1 focus:ring-[#E879F9]"
            >
              Retry 3D
            </button>
          )}
        </div>
      )}
    </div>
  );
};

