/**
 * ZYRICON COSMIC ATMOSPHERE — CORE TYPES & INTERFACES
 *
 * Types definition for Three.js cosmic background engine,
 * planet models, motion controllers, and adaptive quality system.
 */

import * as THREE from 'three';

export type QualityTier = 'high' | 'medium' | 'low';
export type QualityMode = 'auto' | 'high' | 'medium' | 'low';

export type PlanetId = 'jupiter' | 'saturn' | 'mars';

export interface PlanetMeshGroup {
  id: PlanetId;
  group: THREE.Group;
  bodyMesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>;
  ringMesh?: THREE.Mesh<THREE.RingGeometry, THREE.MeshStandardMaterial>;
  axialTiltRad: number;
  rotationSpeedRadPerSec: number;
  floatingFrequency: number;
  floatingAmplitude: number;
  floatingPhase: number;
  restingPosition: THREE.Vector3;
  entranceStartOffset: THREE.Vector3;
}

export interface CosmicEngineOptions {
  canvas: HTMLCanvasElement;
  qualityTier?: QualityTier;
  qualityMode?: QualityMode;
  prefersReducedMotion?: boolean;
  assetBasePath?: string;
  boundIntentId?: number;
  onFirstFrame?: (intentId: number) => void;
  onComplete?: (intentId: number) => void;
  onError?: (error: Error, isFatal?: boolean) => void;
  onContextLost?: () => void;
  onContextRestored?: () => void;
  onQualityChange?: (tier: QualityTier) => void;
  onDiagnosticsUpdate?: (diagnostics: CosmicDiagnostics) => void;
}

export interface EntranceAnimationConfig {
  intentId: number;
  durationMs?: number;
  onFirstFrame?: () => void;
  onComplete?: () => void;
}

export interface TexturesLoadedState {
  jupiter: boolean;
  saturn: boolean;
  saturnRing: boolean;
  mars: boolean;
}

export interface CosmicDiagnostics {
  instanceId: number;
  fps: number;
  frameTimeMs: number;
  tier: QualityTier;
  starCount: number;
  pixelRatio: number;
  canvasWidth: number;
  canvasHeight: number;
  isReducedMotion: boolean;
  isRunning: boolean;
  isDisposed: boolean;
  isContextLost: boolean;
  texturesLoaded: TexturesLoadedState;
}

export interface TransitionIntent {
  id: number;
  from: string;
  to: string;
  cause: 'theme-change' | 'retry' | 'initial-load';
}

