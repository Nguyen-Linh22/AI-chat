/**
 * ZYRICON COSMIC ATMOSPHERE — REACT 3D CANVAS COMPONENT
 *
 * Implements the verified Phase 1 architecture:
 * 1. Dual-Ref Generation Token Pattern (generationCounterRef + activeGenerationRef).
 * 2. Dual-Ref Engine Instance Pattern (engineInstanceCounterRef + activeEngineInstanceRef).
 * 3. StrictMode idempotent lifecycle: Effect 1 (Engine) and Effect 2 (Coordinator) are decoupled.
 * 4. Fallback boundary: Graceful switch to CosmicStaticFallback on hardware failure.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CosmicEngine } from './CosmicEngine';
import type { CosmicDiagnostics, QualityMode, QualityTier, TransitionIntent } from './types';
import { CosmicStaticFallback } from './CosmicStaticFallback';

export interface ZyriconCosmicCanvasProps {
  qualityTier?: QualityTier;
  qualityMode?: QualityMode;
  prefersReducedMotion?: boolean;
  transitionIntent?: TransitionIntent;
  committedTransitionId?: number;
  onCommitTransition?: (intentId: number) => void;
  onTransitionComplete?: (intentId: number) => void;
  onDiagnosticsUpdate?: (diag: CosmicDiagnostics) => void;
  className?: string;
}

export const ZyriconCosmicCanvas: React.FC<ZyriconCosmicCanvasProps> = ({
  qualityTier,
  qualityMode,
  prefersReducedMotion = false,
  transitionIntent,
  committedTransitionId = 0,
  onCommitTransition,
  onTransitionComplete,
  onDiagnosticsUpdate,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<CosmicEngine | null>(null);

  // Failure and fallback state
  const [hasFatalError, setHasFatalError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  // Dual-ref for Engine Instance Ownership (Effect 1)
  const engineInstanceCounterRef = useRef(0);
  const activeEngineInstanceRef = useRef(0);

  // Dual-ref for Entrance Animation Generation Tokens (Effect 2)
  const generationCounterRef = useRef(0);
  const activeGenerationRef = useRef(0);

  // Stable error handler
  const handleEngineError = useCallback((error: Error, isFatal?: boolean) => {
    if (isFatal) {
      setHasFatalError(true);
      setErrorMessage(error.message);
    }
  }, []);

  const handleRetry = useCallback(() => {
    setHasFatalError(false);
    setErrorMessage(undefined);
  }, []);

  // --- EFFECT 1: ENGINE HARDWARE LIFECYCLE ---
  useEffect(() => {
    if (hasFatalError || !canvasRef.current) return;

    // Allocate new engine instance sequence
    const instanceSeq = ++engineInstanceCounterRef.current;
    activeEngineInstanceRef.current = instanceSeq;

    let engine: CosmicEngine | null = null;

    try {
      engine = new CosmicEngine({
        canvas: canvasRef.current,
        qualityTier,
        qualityMode,
        prefersReducedMotion,
        boundIntentId: transitionIntent?.id,
        onError: handleEngineError,
        onDiagnosticsUpdate,
      });

      engineRef.current = engine;
      engine.start();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      queueMicrotask(() => {
        handleEngineError(error, true);
      });
    }

    return () => {
      // Invalidate active engine instance token immediately
      activeEngineInstanceRef.current = 0;

      if (engine) {
        engine.dispose();
      }
      engineRef.current = null;
    };
  }, [qualityTier, qualityMode, prefersReducedMotion, hasFatalError, handleEngineError, onDiagnosticsUpdate, transitionIntent?.id]);

  // --- EFFECT 2: ENTRANCE ANIMATION COORDINATOR ---
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !transitionIntent) return;

    const intentId = transitionIntent.id;
    const isEligible =
      transitionIntent.to === 'zyricon' &&
      transitionIntent.cause !== 'initial-load' &&
      intentId > committedTransitionId;

    if (!isEligible) {
      // Resting position when not eligible for entrance
      engine.setRestingPositions();
      return;
    }

    // Allocate generation token
    const currentGeneration = ++generationCounterRef.current;
    activeGenerationRef.current = currentGeneration;
    const capturedInstanceSeq = activeEngineInstanceRef.current;

    engine.triggerEntranceAnimation({
      intentId,
      durationMs: 1400,
      onFirstFrame: () => {
        // Double-token verification: must match both generation and engine instance
        if (activeGenerationRef.current !== currentGeneration) return;
        if (activeEngineInstanceRef.current !== capturedInstanceSeq) return;

        onCommitTransition?.(intentId);
      },
      onComplete: () => {
        if (activeGenerationRef.current !== currentGeneration) return;
        if (activeEngineInstanceRef.current !== capturedInstanceSeq) return;

        onTransitionComplete?.(intentId);
      },
    });

    return () => {
      // Invalidate active generation token
      activeGenerationRef.current = 0;
      engine.cancelEntranceAnimation();
    };
  }, [transitionIntent, committedTransitionId, onCommitTransition, onTransitionComplete]);

  if (hasFatalError) {
    return <CosmicStaticFallback errorMessage={errorMessage} onRetry={handleRetry} className={className} />;
  }

  return (
    <div
      data-testid="zyricon-cosmic-container"
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      style={{
        backgroundColor: '#07040B',
        contain: 'strict',
      }}
    >
      <canvas
        ref={canvasRef}
        data-testid="zyricon-cosmic-canvas"
        className="w-full h-full block"
        style={{
          pointerEvents: 'none',
          transform: 'translateZ(0)',
          willChange: 'contents',
        }}
      />
    </div>
  );
};
