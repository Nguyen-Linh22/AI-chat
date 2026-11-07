/**
 * ZYRICON COSMIC ATMOSPHERE — ADAPTIVE QUALITY CONTROLLER
 *
 * Implements:
 * 1. Three quality tiers (High, Medium, Low) with tiered assets and effects.
 * 2. Hardware profile detection (hardwareConcurrency, devicePixelRatio, touch/mobile).
 * 3. Rolling FPS monitoring with hysteresis windows:
 *    - 3.0s downgrade hysteresis (prevents instantaneous dips from triggering downscales).
 *    - 5.0s upgrade hysteresis (prevents flickering between tiers).
 * 4. Zero planet culling: all three planets are preserved across all tiers.
 * 5. Manual mode override ('auto' | 'high' | 'medium' | 'low') for preview/testing.
 */

import type { QualityMode, QualityTier } from '../types';

export interface AdaptiveQualityOptions {
  initialMode?: QualityMode;
  initialTier?: QualityTier;
  onQualityChange?: (newTier: QualityTier) => void;
}

export class AdaptiveQualityController {
  private mode: QualityMode = 'auto';
  private currentTier: QualityTier = 'high';

  private readonly onQualityChange?: (newTier: QualityTier) => void;

  // FPS tracking
  private frameCount = 0;
  private lastFpsSampleTime = 0;
  private currentFps = 60;
  private currentFrameTimeMs = 16.6;

  // Hysteresis timers & thresholds
  private lowFpsDurationSec = 0;
  private highFpsDurationSec = 0;
  private readonly emergencyDowngradeThresholdFps = 18;
  private readonly emergencyDowngradeHysteresisSec = 1.5;
  private readonly downgradeThresholdFps = 32;
  private readonly downgradeHysteresisSec = 3.0;
  private readonly upgradeThresholdFps = 55;
  private readonly upgradeHysteresisSec = 5.0;

  constructor(options: AdaptiveQualityOptions = {}) {
    this.mode = options.initialMode ?? 'auto';
    this.onQualityChange = options.onQualityChange;

    if (options.initialTier) {
      this.currentTier = options.initialTier;
    } else {
      this.currentTier = this.detectHardwareDefaultTier();
    }
  }

  public getTier(): QualityTier {
    return this.currentTier;
  }

  public getMode(): QualityMode {
    return this.mode;
  }

  public getFps(): number {
    return this.currentFps;
  }

  public getFrameTimeMs(): number {
    return this.currentFrameTimeMs;
  }

  /**
   * Evaluates client environment to assign an initial conservative tier.
   */
  private detectHardwareDefaultTier(): QualityTier {
    if (typeof window === 'undefined') return 'medium';

    const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);
    const cores = navigator.hardwareConcurrency || 4;
    const dpr = window.devicePixelRatio || 1;

    if (isMobile || cores <= 2) {
      return 'low';
    }

    if (cores <= 4 || dpr > 2.5) {
      return 'medium';
    }

    return 'high';
  }

  /**
   * Sets manual mode or re-enables automatic adaptation.
   */
  public setMode(mode: QualityMode): void {
    this.mode = mode;
    this.lowFpsDurationSec = 0;
    this.highFpsDurationSec = 0;

    if (mode !== 'auto' && mode !== this.currentTier) {
      this.currentTier = mode;
      this.onQualityChange?.(this.currentTier);
    }
  }

  public setTier(tier: QualityTier): void {
    if (this.currentTier !== tier) {
      this.currentTier = tier;
      this.onQualityChange?.(this.currentTier);
    }
  }

  /**
   * Registers a rendered frame and updates rolling metrics and hysteresis state.
   */
  public recordFrame(deltaSec: number, timestamp: number): void {
    this.frameCount++;
    this.currentFrameTimeMs = deltaSec * 1000;

    if (this.lastFpsSampleTime === 0) {
      this.lastFpsSampleTime = timestamp;
      return;
    }

    const elapsed = timestamp - this.lastFpsSampleTime;
    if (elapsed >= 500) { // Sample every 500ms
      this.currentFps = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.lastFpsSampleTime = timestamp;

      // Only perform automatic tier switching if in auto mode
      if (this.mode === 'auto') {
        this.evaluateHysteresis(this.currentFps, elapsed / 1000);
      }
    }
  }

  private evaluateHysteresis(fps: number, dtSampleSec: number): void {
    if (fps < this.emergencyDowngradeThresholdFps) {
      this.lowFpsDurationSec += dtSampleSec;
      this.highFpsDurationSec = 0;

      // Emergency fast downgrade for severe slide-show lag (< 18 FPS) within 1.5s
      if (this.lowFpsDurationSec >= this.emergencyDowngradeHysteresisSec) {
        this.downgrade();
        this.lowFpsDurationSec = 0;
      }
    } else if (fps < this.downgradeThresholdFps) {
      this.lowFpsDurationSec += dtSampleSec;
      this.highFpsDurationSec = 0;

      // Standard downgrade for moderate lag (18-31 FPS) with 3.0s grace period
      if (this.lowFpsDurationSec >= this.downgradeHysteresisSec) {
        this.downgrade();
        this.lowFpsDurationSec = 0;
      }
    } else if (fps >= this.upgradeThresholdFps) {
      this.highFpsDurationSec += dtSampleSec;
      this.lowFpsDurationSec = 0;

      if (this.highFpsDurationSec >= this.upgradeHysteresisSec) {
        this.upgrade();
        this.highFpsDurationSec = 0;
      }
    } else {
      // In comfortable middle zone (32 - 54 fps), reset timers
      this.lowFpsDurationSec = 0;
      this.highFpsDurationSec = 0;
    }
  }

  private downgrade(): void {
    if (this.currentTier === 'high') {
      this.setTier('medium');
    } else if (this.currentTier === 'medium') {
      this.setTier('low');
    }
  }

  private upgrade(): void {
    if (this.currentTier === 'low') {
      this.setTier('medium');
    } else if (this.currentTier === 'medium') {
      this.setTier('high');
    }
  }
}
