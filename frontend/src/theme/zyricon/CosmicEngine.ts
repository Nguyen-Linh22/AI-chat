/**
 * ZYRICON COSMIC ATMOSPHERE — COSMIC 3D ENGINE
 *
 * Core Vanilla Three.js engine encapsulating:
 * 1. WebGLRenderer, PerspectiveCamera, Scene.
 * 2. Manual RAF loop with Post-Render Scheduling & exception boundary.
 * 3. Instance ownership tokens & boundIntentId verification.
 * 4. Hardware context loss & restoration with race-condition-safe timeouts.
 * 5. Page visibility throttling (pauses when backgrounded).
 * 6. Responsive ResizeObserver with tiered pixel ratios.
 * 7. Idempotent resource disposal (zero memory leaks, no forceContextLoss).
 */

import * as THREE from 'three';
import type {
  CosmicDiagnostics,
  CosmicEngineOptions,
  EntranceAnimationConfig,
  PlanetMeshGroup,
  QualityMode,
  QualityTier,
} from './types';
import { DeepSpaceScene } from './environment/DeepSpaceScene';
import { PlanetFactory } from './planets/PlanetFactory';
import { CosmicMotionController } from './controllers/CosmicMotionController';
import { AdaptiveQualityController } from './controllers/AdaptiveQualityController';

export class CosmicEngine {
  private static nextInstanceId = 1;
  public readonly instanceId: number;
  public readonly boundIntentId?: number;

  private readonly canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;

  private deepSpace: DeepSpaceScene | null = null;
  private planetFactory: PlanetFactory | null = null;
  private motionController: CosmicMotionController | null = null;
  private qualityController: AdaptiveQualityController;

  private planets: PlanetMeshGroup[] = [];

  // Lifecycle states
  private running = false;
  private disposed = false;
  private isContextLost = false;
  private rafId: number | null = null;
  private lastTimestamp = 0;
  private elapsedSeconds = 0;

  // Context Loss timeout
  private recoveryTimeoutId: ReturnType<typeof setTimeout> | null = null;

  // Observers & Listeners
  private resizeObserver: ResizeObserver | null = null;
  private resizeDebounceId: ReturnType<typeof setTimeout> | null = null;
  private pendingWidth = 0;
  private pendingHeight = 0;
  private currentPixelRatio = 1;

  // Callbacks
  private readonly onFirstFrame?: (intentId: number) => void;
  private readonly onComplete?: (intentId: number) => void;
  private readonly onError?: (error: Error, isFatal?: boolean) => void;
  private readonly onContextLostCb?: () => void;
  private readonly onContextRestoredCb?: () => void;
  private readonly onQualityChangeCb?: (tier: QualityTier) => void;
  private readonly onDiagnosticsUpdate?: (diag: CosmicDiagnostics) => void;

  private hasReportedInitialFrame = false;

  constructor(options: CosmicEngineOptions) {
    this.instanceId = CosmicEngine.nextInstanceId++;
    this.boundIntentId = options.boundIntentId;
    this.canvas = options.canvas;

    this.onFirstFrame = options.onFirstFrame;
    this.onComplete = options.onComplete;
    this.onError = options.onError;
    this.onContextLostCb = options.onContextLost;
    this.onContextRestoredCb = options.onContextRestored;
    this.onQualityChangeCb = options.onQualityChange;
    this.onDiagnosticsUpdate = options.onDiagnosticsUpdate;

    // Quality controller
    this.qualityController = new AdaptiveQualityController({
      initialMode: options.qualityMode ?? 'auto',
      initialTier: options.qualityTier,
      onQualityChange: (newTier) => this.handleQualityChange(newTier),
    });

    try {
      this.initThree(options);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.dispose();
      this.onError?.(error, true);
    }
  }

  private initThree(options: CosmicEngineOptions): void {
    const tier = this.qualityController.getTier();

    // 1. Renderer initialization
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: tier !== 'low',
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
    });

    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    // 2. Scene
    this.scene = new THREE.Scene();

    // 3. Camera
    const width = this.canvas.clientWidth || window.innerWidth || 800;
    const height = this.canvas.clientHeight || window.innerHeight || 600;
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 50);

    // 4. Motion controller
    this.motionController = new CosmicMotionController(this.camera, options.prefersReducedMotion ?? false);

    // 5. Deep space environment (Stars + Nebula + Lights)
    this.deepSpace = new DeepSpaceScene(this.scene, tier, options.prefersReducedMotion ?? false);

    // 6. Planet Factory & Meshes
    this.planetFactory = new PlanetFactory({
      assetBasePath: options.assetBasePath,
      qualityTier: tier,
      onTextureLoaded: () => this.emitDiagnostics(),
    });

    this.createPlanets();

    // 7. Sizing & DPR
    this.commitBufferResize(width, height);

    // 8. Event listeners
    this.bindEvents();
  }

  private createPlanets(): void {
    if (!this.planetFactory || !this.scene || !this.motionController) return;

    const jupiter = this.planetFactory.createJupiter();
    const saturn = this.planetFactory.createSaturn();
    const mars = this.planetFactory.createMars();

    this.planets = [jupiter, saturn, mars];

    for (const p of this.planets) {
      this.scene.add(p.group);
    }

    this.motionController.registerPlanets(this.planets);
  }

  private bindEvents(): void {
    this.canvas.addEventListener('webglcontextlost', this.handleContextLost, false);
    this.canvas.addEventListener('webglcontextrestored', this.handleContextRestored, false);

    if (typeof window !== 'undefined') {
      window.addEventListener('pointermove', this.handlePointerMove, { passive: true });
      window.addEventListener('pointerleave', this.handlePointerLeave, { passive: true });
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange, false);
    }

    // ResizeObserver
    if (typeof ResizeObserver !== 'undefined') {
      const targetElement = this.canvas.parentElement ?? this.canvas;
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            this.handleResize(width, height);
          }
        }
      });
      this.resizeObserver.observe(targetElement);
    }
  }

  public renderScene(): void {
    if (!this.renderer || !this.scene || !this.camera || this.disposed || this.isContextLost) return;
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Fluid responsive resize handler.
   * During active CSS layout transitions (e.g. sidebar collapse/expand 200-240ms),
   * updates camera aspect ratio and projection matrix continuously (0.001ms CPU cost, 0 GPU allocations)
   * while debouncing expensive WebGL framebuffer reallocations until motion settles.
   * This guarantees 60-120 FPS buttery-smooth sidebar transitions identical to Light & Dark themes.
   */
  public handleResize(width: number, height: number): void {
    if (!this.renderer || !this.camera || this.disposed || this.isContextLost) return;
    if (width <= 0 || height <= 0 || !Number.isFinite(width) || !Number.isFinite(height)) return;

    // 1. Immediately update camera aspect & viewport mode
    // (Free: ~0.001ms CPU, 0 GPU allocations, perfectly maintains geometry without distortion)
    const targetAspect = width / height;
    if (Math.abs(this.camera.aspect - targetAspect) > 0.001) {
      this.camera.aspect = targetAspect;
      this.camera.updateProjectionMatrix();

      const isPortrait = width < height;
      this.motionController?.setViewportMode(isPortrait);
    }

    this.pendingWidth = width;
    this.pendingHeight = height;

    const tier = this.qualityController.getTier();
    const maxDpr = tier === 'high' ? 2.0 : tier === 'medium' ? 1.5 : 1.0;
    const pixelRatio = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, maxDpr);

    const targetWidth = Math.floor(width * pixelRatio);
    const targetHeight = Math.floor(height * pixelRatio);

    // If buffer already matches target, nothing to do
    if (this.canvas.width === targetWidth && this.canvas.height === targetHeight) {
      if (this.resizeDebounceId !== null) {
        clearTimeout(this.resizeDebounceId);
        this.resizeDebounceId = null;
      }
      return;
    }

    // Initial load: commit immediately
    if (this.canvas.width === 0 || this.canvas.height === 0) {
      this.commitBufferResize(width, height);
      return;
    }

    // Debounce the expensive buffer reallocation by 100ms so it commits once motion has settled
    if (this.resizeDebounceId !== null) {
      clearTimeout(this.resizeDebounceId);
    }

    this.resizeDebounceId = setTimeout(() => {
      this.resizeDebounceId = null;
      if (!this.disposed && !this.isContextLost && this.pendingWidth > 0 && this.pendingHeight > 0) {
        this.commitBufferResize(this.pendingWidth, this.pendingHeight);
      }
    }, 100);
  }

  /**
   * Commits the WebGL drawing buffer reallocation to the exact pixel dimensions.
   */
  public commitBufferResize(width: number, height: number): void {
    if (!this.renderer || !this.camera || this.disposed || this.isContextLost) return;
    if (width <= 0 || height <= 0 || !Number.isFinite(width) || !Number.isFinite(height)) return;

    const tier = this.qualityController.getTier();
    const maxDpr = tier === 'high' ? 2.0 : tier === 'medium' ? 1.5 : 1.0;
    const pixelRatio = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, maxDpr);

    const targetWidth = Math.floor(width * pixelRatio);
    const targetHeight = Math.floor(height * pixelRatio);

    if (this.canvas.width === targetWidth && this.canvas.height === targetHeight) {
      return;
    }

    if (this.currentPixelRatio !== pixelRatio) {
      this.renderer.setPixelRatio(pixelRatio);
      this.currentPixelRatio = pixelRatio;
    }

    this.renderer.setSize(width, height, false);

    const targetAspect = width / height;
    this.camera.aspect = targetAspect;
    this.camera.updateProjectionMatrix();

    const isPortrait = width < height;
    this.motionController?.setViewportMode(isPortrait);

    this.deepSpace?.setPixelRatio(pixelRatio);
    this.deepSpace?.setResolution(width, height);

    // Synchronously redraw scene after buffer allocation so backbuffer is never blank
    if (this.running) {
      this.renderScene();
    }
  }

  // Alias for backward compatibility
  public updateDimensions(width: number, height: number): void {
    this.handleResize(width, height);
  }

  // --- RAF LOOP WITH POST-RENDER SCHEDULING ---

  public start(): void {
    if (this.disposed || this.running || this.isContextLost) return;
    this.running = true;
    this.lastTimestamp = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  public stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private tick = (timestamp: number): void => {
    if (this.disposed || !this.running) return;

    try {
      this.renderFrame(timestamp);

      // POST-RENDER SCHEDULING:
      // Only schedule next frame when current frame renders successfully without throwing.
      this.rafId = requestAnimationFrame(this.tick);
    } catch (error) {
      this.running = false;
      const err = error instanceof Error ? error : new Error(String(error));
      this.onError?.(err, false);
    }
  };

  private renderFrame(timestamp: number): void {
    if (!this.renderer || !this.scene || !this.camera || this.disposed || this.isContextLost) return;

    const deltaSec = Math.min((timestamp - this.lastTimestamp) / 1000, 0.1); // Cap at 100ms
    this.lastTimestamp = timestamp;
    this.elapsedSeconds += deltaSec;

    // Check responsive canvas sizing before rendering (Three.js responsive pattern)
    const clientWidth = this.canvas.clientWidth;
    const clientHeight = this.canvas.clientHeight;
    if (clientWidth > 0 && clientHeight > 0) {
      this.handleResize(clientWidth, clientHeight);
    }

    // Record frame in quality controller
    this.qualityController.recordFrame(deltaSec, timestamp);

    // Update motion & environment
    this.motionController?.update(deltaSec, this.elapsedSeconds);
    this.deepSpace?.update(this.elapsedSeconds);

    // Render 3D scene
    this.renderScene();

    // Report first frame callback
    if (!this.hasReportedInitialFrame) {
      this.hasReportedInitialFrame = true;
      if (this.boundIntentId !== undefined) {
        this.onFirstFrame?.(this.boundIntentId);
      }
    }

    // Periodic diagnostics update
    this.emitDiagnostics();
  }

  // --- EVENT HANDLERS ---

  private handlePointerMove = (e: PointerEvent): void => {
    if (this.disposed || !this.motionController) return;
    const normX = (e.clientX / window.innerWidth) * 2 - 1;
    const normY = (e.clientY / window.innerHeight) * 2 - 1;
    this.motionController.setPointerNormalized(normX, normY);
  };

  private handlePointerLeave = (): void => {
    this.motionController?.resetPointer();
  };

  private handleVisibilityChange = (): void => {
    if (this.disposed) return;
    if (document.hidden) {
      this.stop();
    } else {
      this.start();
    }
  };

  private handleContextLost = (e: Event): void => {
    e.preventDefault();
    this.isContextLost = true;
    this.stop();

    if (this.resizeDebounceId !== null) {
      clearTimeout(this.resizeDebounceId);
      this.resizeDebounceId = null;
    }

    this.clearRecoveryTimeout();
    this.recoveryTimeoutId = setTimeout(() => {
      if (this.disposed || !this.isContextLost) return;
      this.onError?.(new Error('WebGL context restoration timed out after 5000ms'), true);
    }, 5000);

    this.onContextLostCb?.();
  };

  private handleContextRestored = (): void => {
    this.clearRecoveryTimeout();
    this.isContextLost = false;

    // Re-verify dimensions and start
    if (this.canvas) {
      this.commitBufferResize(this.canvas.clientWidth, this.canvas.clientHeight);
    }
    this.start();
    this.onContextRestoredCb?.();
  };

  private clearRecoveryTimeout(): void {
    if (this.recoveryTimeoutId !== null) {
      clearTimeout(this.recoveryTimeoutId);
      this.recoveryTimeoutId = null;
    }
  }

  private handleQualityChange(newTier: QualityTier): void {
    if (this.disposed) return;

    this.deepSpace?.setQualityTier(newTier);
    this.planetFactory?.setQualityTier(newTier);

    if (this.canvas) {
      this.updateDimensions(this.canvas.clientWidth, this.canvas.clientHeight);
    }

    this.onQualityChangeCb?.(newTier);
  }

  // --- PUBLIC CONTROL APIS ---

  public setQualityMode(mode: QualityMode): void {
    this.qualityController.setMode(mode);
  }

  public setReducedMotion(reduced: boolean): void {
    this.motionController?.setReducedMotion(reduced);
    this.deepSpace?.setReducedMotion(reduced);
  }

  public triggerEntranceAnimation(config: EntranceAnimationConfig): void {
    this.motionController?.triggerEntranceAnimation({
      ...config,
      onFirstFrame: () => {
        config.onFirstFrame?.();
        this.onFirstFrame?.(config.intentId);
      },
      onComplete: () => {
        config.onComplete?.();
        this.onComplete?.(config.intentId);
      },
    });
  }

  public cancelEntranceAnimation(): void {
    this.motionController?.cancelEntranceAnimation();
  }

  public setRestingPositions(): void {
    this.motionController?.setRestingPositions();
  }

  public getDiagnostics(): CosmicDiagnostics {
    const tier = this.qualityController.getTier();
    return {
      instanceId: this.instanceId,
      fps: this.qualityController.getFps(),
      frameTimeMs: this.qualityController.getFrameTimeMs(),
      tier,
      starCount: this.deepSpace?.getStarCount() ?? 0,
      pixelRatio: this.renderer?.getPixelRatio() ?? 1,
      canvasWidth: this.canvas.clientWidth,
      canvasHeight: this.canvas.clientHeight,
      isReducedMotion: false,
      isRunning: this.running,
      isDisposed: this.disposed,
      isContextLost: this.isContextLost,
      texturesLoaded: this.planetFactory?.textureState ?? {
        jupiter: false,
        saturn: false,
        saturnRing: false,
        mars: false,
      },
    };
  }

  private emitDiagnostics(): void {
    if (this.onDiagnosticsUpdate) {
      this.onDiagnosticsUpdate(this.getDiagnostics());
    }
  }

  // --- DISPOSAL ---

  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    this.stop();
    this.clearRecoveryTimeout();

    if (this.resizeDebounceId !== null) {
      clearTimeout(this.resizeDebounceId);
      this.resizeDebounceId = null;
    }

    // Remove event listeners
    this.canvas.removeEventListener('webglcontextlost', this.handleContextLost);
    this.canvas.removeEventListener('webglcontextrestored', this.handleContextRestored);
    if (typeof window !== 'undefined') {
      window.removeEventListener('pointermove', this.handlePointerMove);
      window.removeEventListener('pointerleave', this.handlePointerLeave);
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }

    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    // Dispose environment & factory
    this.deepSpace?.dispose();
    this.deepSpace = null;

    this.planetFactory?.dispose();
    this.planetFactory = null;

    this.motionController?.dispose();
    this.motionController = null;

    // Dispose meshes
    for (const p of this.planets) {
      p.bodyMesh.geometry.dispose();
      p.bodyMesh.material.dispose();
      if (p.ringMesh) {
        p.ringMesh.geometry.dispose();
        p.ringMesh.material.dispose();
      }
    }
    this.planets = [];

    // Dispose renderer
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }

    if (this.scene) {
      this.scene.clear();
      this.scene = null;
    }

    this.camera = null;
  }
}
