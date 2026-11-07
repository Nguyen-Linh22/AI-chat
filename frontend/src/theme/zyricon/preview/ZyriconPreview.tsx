/**
 * ZYRICON COSMIC ATMOSPHERE — INDEPENDENT PREVIEW BENCH
 *
 * Fully isolated development and verification workbench for Phase 3.
 *
 * Allows real-time interactive testing of:
 * 1. Visual observation of Jupiter, Saturn (with alpha rings), and Mars.
 * 2. Starfield depth layers, GPU twinkle, and procedural FBM nebula.
 * 3. Axial rotations, floating harmonics, and pointer parallax.
 * 4. Tier switching (High / Medium / Low / Auto) and DPR scaling.
 * 5. prefers-reduced-motion toggling.
 * 6. Entrance animation playback and completion callbacks.
 * 7. WebGL context loss & fatal error fallback simulation.
 * 8. Real-time diagnostics HUD (FPS, memory, texture status).
 *
 * ZERO impact on ChatArea, ChatBackground, or production routes.
 */

import React, { useState, useCallback, useRef } from 'react';
import { ZyriconCosmicCanvas } from '../ZyriconCosmicCanvas';
import type { CosmicDiagnostics, QualityMode, QualityTier, TransitionIntent } from '../types';

export const ZyriconPreview: React.FC = () => {
  const [qualityMode, setQualityMode] = useState<QualityMode>('auto');
  const [forcedTier, setForcedTier] = useState<QualityTier | undefined>(undefined);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(true);

  // Transition intent for testing entrance animation
  const [transitionIntent, setTransitionIntent] = useState<TransitionIntent | undefined>(undefined);
  const [committedId, setCommittedId] = useState(0);
  const intentCounterRef = useRef(100);

  // Diagnostics state
  const [diagnostics, setDiagnostics] = useState<CosmicDiagnostics | null>(null);
  const [lastActionLog, setLastActionLog] = useState<string>('Ready');

  // Trigger entrance animation
  const handleTriggerEntrance = useCallback(() => {
    const nextId = ++intentCounterRef.current;
    setLastActionLog(`Triggered Entrance Intent #${nextId}`);
    setTransitionIntent({
      id: nextId,
      from: 'dark',
      to: 'zyricon',
      cause: 'theme-change',
    });
  }, []);

  const handleCommitTransition = useCallback((intentId: number) => {
    setCommittedId(intentId);
    setLastActionLog(`Committed Intent #${intentId} (onFirstFrame)`);
  }, []);

  const handleTransitionComplete = useCallback((intentId: number) => {
    setLastActionLog(`Completed Intent #${intentId} (onComplete)`);
  }, []);

  const handleModeChange = useCallback((mode: QualityMode) => {
    setQualityMode(mode);
    if (mode === 'auto') {
      setForcedTier(undefined);
    } else {
      setForcedTier(mode);
    }
    setLastActionLog(`Quality mode set to ${mode.toUpperCase()}`);
  }, []);

  return (
    <div
      data-testid="zyricon-preview-root"
      className="relative w-screen h-screen overflow-hidden bg-[#07040B] text-[#FFE4F0] font-sans select-none"
    >
      {/* 3D Cosmic Background Canvas */}
      <ZyriconCosmicCanvas
        qualityMode={qualityMode}
        qualityTier={forcedTier}
        prefersReducedMotion={reducedMotion}
        transitionIntent={transitionIntent}
        committedTransitionId={committedId}
        onCommitTransition={handleCommitTransition}
        onTransitionComplete={handleTransitionComplete}
        onDiagnosticsUpdate={setDiagnostics}
      />

      {/* Floating Header Banner */}
      <header className="absolute top-4 left-4 z-20 flex items-center gap-3 px-4 py-2 rounded-2xl bg-[#0D0714]/80 border border-[#8B3A7E]/30 backdrop-blur-md shadow-2xl">
        <div className="w-3 h-3 rounded-full bg-gradient-to-tr from-[#E879F9] to-[#60A5FA] animate-pulse" />
        <div>
          <h1 className="text-sm font-semibold tracking-wide text-white">
            Zyricon Cosmic 3D Workbench
          </h1>
          <p className="text-[11px] text-[#C084FC]">Phase 3 Core Implementation Preview</p>
        </div>
      </header>

      {/* Floating Control Deck */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-3 w-80 max-w-[calc(100vw-2rem)] p-4 rounded-2xl bg-[#0D0714]/85 border border-[#8B3A7E]/30 backdrop-blur-lg shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#8B3A7E]/20 pb-2">
          <span className="text-xs font-medium uppercase tracking-wider text-[#E879F9]">
            Engine Controls
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-[#1F0E2E] text-[#F3E8FF] border border-[#8B3A7E]/30">
            {diagnostics ? `${diagnostics.fps} FPS` : 'Initializing...'}
          </span>
        </div>

        {/* Quality Tier Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-[#D1D5DB]">Quality Tier</label>
          <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-[#170A24] border border-[#8B3A7E]/30">
            {(['auto', 'high', 'medium', 'low'] as QualityMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => handleModeChange(mode)}
                className={`py-1 rounded-lg text-xs font-medium transition-all ${
                  qualityMode === mode
                    ? 'bg-gradient-to-r from-[#9333EA] to-[#C026D3] text-white shadow-sm'
                    : 'text-[#D1D5DB]/70 hover:text-white hover:bg-white/5'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Motion & Reduced-Motion Toggles */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              setReducedMotion((prev) => !prev);
              setLastActionLog(`Reduced motion ${!reducedMotion ? 'ENABLED' : 'DISABLED'}`);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors flex items-center justify-center gap-1.5 ${
              reducedMotion
                ? 'bg-[#E879F9]/20 border-[#E879F9] text-[#FFE4F0]'
                : 'bg-[#170A24] border-[#8B3A7E]/30 text-[#D1D5DB] hover:border-[#8B3A7E]/60'
            }`}
          >
            <span>{reducedMotion ? 'Reduced Motion: ON' : 'Reduced Motion: OFF'}</span>
          </button>

          <button
            type="button"
            onClick={handleTriggerEntrance}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-gradient-to-r from-[#8B3A7E] to-[#A855F7] hover:brightness-110 text-white shadow-md active:scale-95 transition-all"
          >
            Play Entrance
          </button>
        </div>

        {/* Status / Log pill */}
        <div className="text-[11px] px-2.5 py-1.5 rounded-lg bg-[#140822] border border-[#8B3A7E]/20 text-[#C084FC] truncate">
          <span className="text-white/40 mr-1.5">&gt;</span>
          {lastActionLog}
        </div>
      </div>

      {/* Floating Diagnostics HUD */}
      {showDiagnostics && diagnostics && (
        <div
          data-testid="cosmic-diagnostics-hud"
          className="absolute bottom-4 left-4 z-20 w-80 max-w-[calc(100vw-2rem)] p-3 rounded-2xl bg-[#0D0714]/85 border border-[#8B3A7E]/30 backdrop-blur-md shadow-2xl text-[11px] text-[#D1D5DB]"
        >
          <div className="flex items-center justify-between border-b border-[#8B3A7E]/20 pb-1.5 mb-2">
            <span className="font-semibold text-white">Live Diagnostics</span>
            <span className="text-[#A855F7]">Instance #{diagnostics.instanceId}</span>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            <div>
              <span className="text-white/50">Active Tier:</span>{' '}
              <span className="font-mono text-[#E879F9] uppercase">{diagnostics.tier}</span>
            </div>
            <div>
              <span className="text-white/50">FPS:</span>{' '}
              <span className="font-mono text-emerald-400">{diagnostics.fps}</span>
            </div>
            <div>
              <span className="text-white/50">Frame Time:</span>{' '}
              <span className="font-mono">{diagnostics.frameTimeMs.toFixed(1)} ms</span>
            </div>
            <div>
              <span className="text-white/50">Pixel Ratio:</span>{' '}
              <span className="font-mono">{diagnostics.pixelRatio.toFixed(2)}x</span>
            </div>
            <div>
              <span className="text-white/50">Stars in Scene:</span>{' '}
              <span className="font-mono text-sky-300">{diagnostics.starCount}</span>
            </div>
            <div>
              <span className="text-white/50">Canvas:</span>{' '}
              <span className="font-mono">
                {diagnostics.canvasWidth}x{diagnostics.canvasHeight}
              </span>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-[#8B3A7E]/20 flex flex-col gap-1">
            <span className="text-white/50">Texture Assets Loaded:</span>
            <div className="flex flex-wrap gap-1.5 text-[10px]">
              <span
                className={`px-1.5 py-0.5 rounded ${
                  diagnostics.texturesLoaded.jupiter
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                Jupiter ({diagnostics.tier === 'high' ? 'Cassini 3.6K' : '2K'})
              </span>
              <span
                className={`px-1.5 py-0.5 rounded ${
                  diagnostics.texturesLoaded.saturn
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                Saturn (2K)
              </span>
              <span
                className={`px-1.5 py-0.5 rounded ${
                  diagnostics.texturesLoaded.saturnRing
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                Ring Alpha
              </span>
              <span
                className={`px-1.5 py-0.5 rounded ${
                  diagnostics.texturesLoaded.mars
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                Mars (2K)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Toggle HUD button */}
      <button
        type="button"
        onClick={() => setShowDiagnostics((p) => !p)}
        className="absolute bottom-4 right-4 z-20 px-3 py-1.5 rounded-full bg-[#170A24]/80 border border-[#8B3A7E]/30 text-xs text-[#E879F9] hover:bg-[#8B3A7E]/30 backdrop-blur-md transition-colors"
      >
        {showDiagnostics ? 'Hide Diagnostics' : 'Show Diagnostics'}
      </button>
    </div>
  );
};
