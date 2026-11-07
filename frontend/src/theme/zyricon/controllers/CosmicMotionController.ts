/**
 * ZYRICON COSMIC ATMOSPHERE — COSMIC MOTION CONTROLLER
 *
 * Implements:
 * 1. Delta-time based planetary axial rotation (rad/s * dt).
 * 2. Harmonic floating motion (subtle buoyancy, distinct phase per planet).
 * 3. Smooth, clamped pointer parallax with exponential decay.
 * 4. prefers-reduced-motion compliance (freezes rotation, floating, and parallax).
 * 5. Phase 4 Entrance Animation API (cubic ease-out, onFirstFrame, onComplete, cancellable).
 */

import * as THREE from 'three';
import type { EntranceAnimationConfig, PlanetMeshGroup } from '../types';

export class CosmicMotionController {
  private planets: PlanetMeshGroup[] = [];
  private camera: THREE.PerspectiveCamera | null = null;

  private isReducedMotion = false;
  private isPaused = false;
  private isPortrait = false;
  private layoutInitialized = false;

  // Pointer Parallax state
  private targetParallax = new THREE.Vector2(0, 0);
  private currentParallax = new THREE.Vector2(0, 0);
  private readonly maxParallax = new THREE.Vector2(1.2, 0.6); // Max camera displacement

  // Entrance Animation state
  private activeEntrance: {
    intentId: number;
    startTime: number;
    durationMs: number;
    hasReportedFirstFrame: boolean;
    onFirstFrame?: () => void;
    onComplete?: () => void;
  } | null = null;

  constructor(camera: THREE.PerspectiveCamera, prefersReducedMotion = false) {
    this.camera = camera;
    this.isReducedMotion = prefersReducedMotion;
  }

  public registerPlanets(planets: PlanetMeshGroup[]): void {
    this.planets = planets;
    this.layoutInitialized = false;
    this.setViewportMode(this.isPortrait);
    this.setRestingPositions();
  }

  public setReducedMotion(reduced: boolean): void {
    this.isReducedMotion = reduced;
    if (reduced) {
      this.cancelEntranceAnimation();
      this.setRestingPositions();
      this.currentParallax.set(0, 0);
      this.targetParallax.set(0, 0);
      if (this.camera) {
        this.camera.position.set(0, 0, 50);
      }
    }
  }

  /**
   * Adapts planetary layout responsively between wide landscape and narrow mobile portrait.
   */
  public setViewportMode(isPortrait: boolean): void {
    if (this.layoutInitialized && this.isPortrait === isPortrait && this.planets.length > 0) return;
    this.isPortrait = isPortrait;
    this.layoutInitialized = true;

    for (const planet of this.planets) {
      if (isPortrait) {
        // Mobile Portrait Composition: Serpentine flow from top-left Mars, center-right Jupiter, bottom-left Saturn
        if (planet.id === 'jupiter') {
          planet.restingPosition.set(6, 4, -65);
          planet.group.scale.setScalar(0.75);
        } else if (planet.id === 'saturn') {
          planet.restingPosition.set(-6, -22, -75);
          planet.group.scale.setScalar(0.55);
        } else if (planet.id === 'mars') {
          planet.restingPosition.set(-7, 26, -75);
          planet.group.scale.setScalar(0.65);
        }
      } else {
        // Desktop Composition:
        // - Mars: small, upper-left
        // - Saturn: small with full ring, lower-left (0 clipping)
        // - Jupiter: large, near-center shifted right
        if (planet.id === 'jupiter') {
          planet.restingPosition.set(28, 2, -55);
          planet.group.scale.setScalar(1.05);
        } else if (planet.id === 'saturn') {
          planet.restingPosition.set(-22, -18, -70);
          planet.group.scale.setScalar(0.65);
        } else if (planet.id === 'mars') {
          planet.restingPosition.set(-28, 18, -70);
          planet.group.scale.setScalar(0.75);
        }
      }
    }

    if (!this.activeEntrance) {
      this.setRestingPositions();
    }
  }

  public setPaused(paused: boolean): void {
    this.isPaused = paused;
  }

  public setPointerNormalized(normX: number, normY: number): void {
    if (this.isReducedMotion) return;
    // Clamped pointer coordinates [-1, 1]
    const clampedX = Math.max(-1, Math.min(1, normX));
    const clampedY = Math.max(-1, Math.min(1, normY));
    this.targetParallax.set(clampedX * this.maxParallax.x, -clampedY * this.maxParallax.y);
  }

  public resetPointer(): void {
    this.targetParallax.set(0, 0);
  }

  /**
   * Snaps all planets directly to their calibrated resting positions.
   */
  public setRestingPositions(): void {
    for (const planet of this.planets) {
      planet.group.position.copy(planet.restingPosition);
    }
  }

  /**
   * Triggers an entrance animation.
   * Interpolates planets from restingPosition + entranceStartOffset -> restingPosition.
   */
  public triggerEntranceAnimation(config: EntranceAnimationConfig): void {
    if (this.isReducedMotion) {
      // In reduced-motion mode, immediately rest and report completion
      this.setRestingPositions();
      config.onFirstFrame?.();
      config.onComplete?.();
      return;
    }

    const durationMs = config.durationMs ?? 1400;

    this.activeEntrance = {
      intentId: config.intentId,
      startTime: performance.now(),
      durationMs,
      hasReportedFirstFrame: false,
      onFirstFrame: config.onFirstFrame,
      onComplete: config.onComplete,
    };

    // Position planets at entrance start offsets
    for (const planet of this.planets) {
      planet.group.position.copy(planet.restingPosition).add(planet.entranceStartOffset);
    }
  }

  /**
   * Cancels active entrance animation without snapping erratically.
   */
  public cancelEntranceAnimation(): void {
    if (this.activeEntrance) {
      this.activeEntrance = null;
      this.setRestingPositions();
    }
  }

  /**
   * Main per-frame update loop.
   * Calculates rotations, float harmonics, parallax lerp, and entrance easing.
   */
  public update(deltaSec: number, elapsedSec: number): void {
    if (this.isPaused) return;

    // 1. Process Entrance Animation if active
    let entranceOffsetFactor = 0.0;
    if (this.activeEntrance) {
      const now = performance.now();
      const elapsed = now - this.activeEntrance.startTime;
      const progress = Math.min(Math.max(elapsed / this.activeEntrance.durationMs, 0.0), 1.0);

      // Report first frame callback
      if (!this.activeEntrance.hasReportedFirstFrame) {
        this.activeEntrance.hasReportedFirstFrame = true;
        this.activeEntrance.onFirstFrame?.();
      }

      // Cubic ease-out: f(t) = 1 - (1 - t)^3
      // offsetFactor goes from 1.0 (start) down to 0.0 (rested)
      const easeOut = 1.0 - Math.pow(1.0 - progress, 3);
      entranceOffsetFactor = 1.0 - easeOut;

      if (progress >= 1.0) {
        const completedCb = this.activeEntrance.onComplete;
        this.activeEntrance = null;
        entranceOffsetFactor = 0.0;
        completedCb?.();
      }
    }

    // 2. Parallax camera tracking
    if (this.camera && !this.isReducedMotion) {
      const lerpSpeed = Math.min(1.0, 3.5 * deltaSec);
      this.currentParallax.lerp(this.targetParallax, lerpSpeed);
      this.camera.position.x = this.currentParallax.x;
      this.camera.position.y = this.currentParallax.y;
      this.camera.position.z = 50;
      this.camera.lookAt(0, 0, 0);
    }

    // 3. Update each planet's rotation and position
    for (const planet of this.planets) {
      // Find spinGroup (first child of tiltGroup)
      const tiltGroup = planet.group.children[0];
      const spinGroup = tiltGroup?.children[0];

      // A. Axial rotation
      if (spinGroup && !this.isReducedMotion) {
        spinGroup.rotation.y += planet.rotationSpeedRadPerSec * deltaSec;
      }

      // B. Floating calculation
      let floatY = 0;
      let floatX = 0;
      if (!this.isReducedMotion) {
        floatY = Math.sin(elapsedSec * planet.floatingFrequency + planet.floatingPhase) * planet.floatingAmplitude;
        floatX = Math.cos(elapsedSec * planet.floatingFrequency * 0.7 + planet.floatingPhase) * (planet.floatingAmplitude * 0.35);
      }

      // C. Base resting position + entrance offset + float offset
      planet.group.position.x = planet.restingPosition.x + floatX;
      planet.group.position.y = planet.restingPosition.y + floatY;
      planet.group.position.z = planet.restingPosition.z;

      if (entranceOffsetFactor > 0.0) {
        planet.group.position.x += planet.entranceStartOffset.x * entranceOffsetFactor;
        planet.group.position.y += planet.entranceStartOffset.y * entranceOffsetFactor;
        planet.group.position.z += planet.entranceStartOffset.z * entranceOffsetFactor;
      }
    }
  }

  public dispose(): void {
    this.activeEntrance = null;
    this.planets = [];
    this.camera = null;
  }
}
