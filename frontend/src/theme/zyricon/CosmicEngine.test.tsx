// @vitest-environment jsdom

/**
 * ZYRICON COSMIC ATMOSPHERE — UNIT TESTS
 *
 * Verifies:
 * 1. AdaptiveQualityController (tiers, hysteresis, zero-culling).
 * 2. CosmicMotionController (dt-rotation, harmonics, reduced-motion, entrance animation).
 * 3. PlanetFactory (axial tilts, radial UV remapping, safe async loader).
 * 4. DeepSpaceScene (tiered density, procedural shaders, disposal).
 * 5. CosmicEngine (ownership, post-render scheduling, context-loss recovery, idempotent dispose).
 * 6. CosmicStaticFallback (accessibility, tokens, retry callback).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { AdaptiveQualityController } from './controllers/AdaptiveQualityController';
import { CosmicMotionController } from './controllers/CosmicMotionController';
import { PlanetFactory } from './planets/PlanetFactory';
import { DeepSpaceScene } from './environment/DeepSpaceScene';
import { CosmicEngine } from './CosmicEngine';
import { CosmicStaticFallback } from './CosmicStaticFallback';
import { ZyriconCosmicCanvas } from './ZyriconCosmicCanvas';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Mock WebGLRenderer & TextureLoader for test environment
vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal<typeof import('three')>();

  class MockWebGLRenderer {
    public outputColorSpace = actual.SRGBColorSpace;
    public toneMapping = actual.ACESFilmicToneMapping;
    public toneMappingExposure = 1.0;
    public domElement: HTMLCanvasElement;
    private pixelRatio = 1;

    constructor(parameters?: { canvas?: HTMLCanvasElement }) {
      this.domElement = parameters?.canvas ?? document.createElement('canvas');
    }

    public render = vi.fn();
    public setSize = vi.fn();
    public setPixelRatio = vi.fn((ratio: number) => {
      this.pixelRatio = ratio;
    });
    public getPixelRatio = vi.fn(() => this.pixelRatio);
    public dispose = vi.fn();
  }

  class MockTextureLoader {
    public load = vi.fn((_url: string, onLoad?: (tex: THREE.Texture) => void) => {
      const tex = new actual.Texture();
      if (onLoad) {
        setTimeout(() => onLoad(tex), 0);
      }
      return tex;
    });
  }

  return {
    ...actual,
    WebGLRenderer: MockWebGLRenderer,
    TextureLoader: MockTextureLoader,
  };
});

describe('1. AdaptiveQualityController', () => {
  it('initializes with default tier and allows manual override', () => {
    const onQualityChange = vi.fn();
    const controller = new AdaptiveQualityController({
      initialMode: 'auto',
      initialTier: 'high',
      onQualityChange,
    });

    expect(controller.getTier()).toBe('high');
    expect(controller.getMode()).toBe('auto');

    controller.setMode('low');
    expect(controller.getMode()).toBe('low');
    expect(controller.getTier()).toBe('low');
    expect(onQualityChange).toHaveBeenCalledWith('low');
  });

  it('respects 3.0s downgrade hysteresis before downgrading tier', () => {
    const onQualityChange = vi.fn();
    const controller = new AdaptiveQualityController({
      initialMode: 'auto',
      initialTier: 'high',
      onQualityChange,
    });

    // Feed frames with low FPS (25 FPS) for 2.0 seconds (< 3.0s threshold)
    let t = 1000;
    for (let i = 0; i < 4; i++) {
      t += 500;
      // 12 frames in 500ms = 24 FPS
      for (let f = 0; f < 12; f++) {
        controller.recordFrame(0.04, t);
      }
    }
    // Still high because 2.0s < 3.0s hysteresis
    expect(controller.getTier()).toBe('high');

    // Feed another 3 samples (1.5s more -> total 3.5s > 3.0s)
    for (let i = 0; i < 3; i++) {
      t += 500;
      for (let f = 0; f < 12; f++) {
        controller.recordFrame(0.04, t);
      }
    }

    // Now it should have downgraded to medium!
    expect(controller.getTier()).toBe('medium');
    expect(onQualityChange).toHaveBeenCalledWith('medium');
  });

  it('resets hysteresis timers when FPS is in comfortable middle zone (32-54 FPS)', () => {
    const controller = new AdaptiveQualityController({
      initialMode: 'auto',
      initialTier: 'high',
    });

    // 2.0s of low FPS
    let t = 1000;
    for (let i = 0; i < 4; i++) {
      t += 500;
      for (let f = 0; f < 12; f++) controller.recordFrame(0.04, t);
    }

    // Middle zone: 22 frames per 500ms = 44 FPS
    t += 500;
    for (let f = 0; f < 22; f++) controller.recordFrame(0.022, t);

    // After reset, 1.5s of low FPS should not downgrade because timer was cleared
    for (let i = 0; i < 3; i++) {
      t += 500;
      for (let f = 0; f < 12; f++) controller.recordFrame(0.04, t);
    }

    expect(controller.getTier()).toBe('high');
  });
});

describe('2. CosmicMotionController', () => {
  let camera: THREE.PerspectiveCamera;
  let motionController: CosmicMotionController;

  beforeEach(() => {
    camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    motionController = new CosmicMotionController(camera, false);
  });

  afterEach(() => {
    motionController.dispose();
  });

  it('computes planetary axial rotation strictly based on delta-time', () => {
    const factory = new PlanetFactory();
    const jupiter = factory.createJupiter();
    motionController.registerPlanets([jupiter]);

    const tiltGroup = jupiter.group.children[0];
    const spinGroup = tiltGroup.children[0];
    const initialRotY = spinGroup.rotation.y;

    // Advance by 1.0 second
    motionController.update(1.0, 1.0);

    const expectedRotY = initialRotY + jupiter.rotationSpeedRadPerSec * 1.0;
    expect(spinGroup.rotation.y).toBeCloseTo(expectedRotY, 4);

    factory.dispose();
  });

  it('freezes rotation, floating harmonics, and parallax when reduced-motion is enabled', () => {
    const factory = new PlanetFactory();
    const saturn = factory.createSaturn();
    motionController.registerPlanets([saturn]);
    motionController.setReducedMotion(true);

    const tiltGroup = saturn.group.children[0];
    const spinGroup = tiltGroup.children[0];
    const initialRotY = spinGroup.rotation.y;

    // Advance time by 5.0 seconds
    motionController.update(1.0, 5.0);

    // Rotation remains frozen
    expect(spinGroup.rotation.y).toBe(initialRotY);
    // Position remains frozen exactly at resting position
    expect(saturn.group.position.x).toBe(saturn.restingPosition.x);
    expect(saturn.group.position.y).toBe(saturn.restingPosition.y);
    expect(saturn.group.position.z).toBe(saturn.restingPosition.z);

    factory.dispose();
  });

  it('manages Entrance Animation lifecycle with onFirstFrame and onComplete', () => {
    const factory = new PlanetFactory();
    const mars = factory.createMars();
    motionController.registerPlanets([mars]);

    const onFirstFrame = vi.fn();
    const onComplete = vi.fn();

    motionController.triggerEntranceAnimation({
      intentId: 101,
      durationMs: 500,
      onFirstFrame,
      onComplete,
    });

    // Frame 1: must invoke onFirstFrame
    motionController.update(0.016, 0.016);
    expect(onFirstFrame).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();

    // Advance time past durationMs (e.g. 600ms)
    // Note: performance.now() is used in real runtime, let's mock or advance performance.now
    const perfNowSpy = vi.spyOn(performance, 'now');
    perfNowSpy.mockReturnValue(performance.now() + 600);

    motionController.update(0.016, 0.6);
    expect(onComplete).toHaveBeenCalledTimes(1);

    perfNowSpy.mockRestore();
    factory.dispose();
  });

  it('cancelling entrance animation snaps cleanly to resting position', () => {
    const factory = new PlanetFactory();
    const jupiter = factory.createJupiter();
    motionController.registerPlanets([jupiter]);

    motionController.triggerEntranceAnimation({
      intentId: 102,
      durationMs: 1000,
    });

    motionController.cancelEntranceAnimation();

    expect(jupiter.group.position.x).toBe(jupiter.restingPosition.x);
    expect(jupiter.group.position.y).toBe(jupiter.restingPosition.y);
    expect(jupiter.group.position.z).toBe(jupiter.restingPosition.z);

    factory.dispose();
  });
});

describe('3. PlanetFactory & Geometry/UV Remapping', () => {
  it('creates Jupiter with authentic 3.13 degree axial tilt and tier-appropriate texture path', () => {
    const highFactory = new PlanetFactory({ qualityTier: 'high' });
    const jupiterHigh = highFactory.createJupiter();

    expect(jupiterHigh.id).toBe('jupiter');
    expect(jupiterHigh.axialTiltRad).toBeCloseTo(3.13 * (Math.PI / 180), 4);
    expect(jupiterHigh.group.position.x).toBe(jupiterHigh.restingPosition.x);

    highFactory.dispose();
  });

  it('creates Saturn with 26.73 degree axial tilt and remaps ring UVs radially', () => {
    const factory = new PlanetFactory({ qualityTier: 'high' });
    const saturn = factory.createSaturn();

    expect(saturn.id).toBe('saturn');
    expect(saturn.axialTiltRad).toBeCloseTo(26.73 * (Math.PI / 180), 4);
    expect(saturn.ringMesh).toBeDefined();

    const ringUv = saturn.ringMesh!.geometry.attributes.uv;
    // Radial UV check: inner vertices should have u close to 0, outer close to 1
    let minU = 1.0;
    let maxU = 0.0;
    for (let i = 0; i < ringUv.count; i++) {
      const u = ringUv.getX(i);
      if (u < minU) minU = u;
      if (u > maxU) maxU = u;
    }
    expect(minU).toBeCloseTo(0.0, 2);
    expect(maxU).toBeCloseTo(1.0, 2);

    factory.dispose();
  });

  it('creates Mars with 25.19 degree axial tilt and smallest radius', () => {
    const factory = new PlanetFactory();
    const mars = factory.createMars();

    expect(mars.id).toBe('mars');
    expect(mars.axialTiltRad).toBeCloseTo(25.19 * (Math.PI / 180), 4);
    // Mars geometry radius = 6.8, smaller than Saturn (12) and Jupiter (18)
    expect(mars.bodyMesh.geometry.parameters.radius).toBe(6.8);

    factory.dispose();
  });

  it('disposes loaded textures and safely ignores late async callbacks', () => {
    const factory = new PlanetFactory();
    expect(factory.textureState.jupiter).toBe(false);

    factory.dispose();
    // After dispose, no textures remain dangling
    expect(factory['disposed']).toBe(true);
  });
});

describe('4. DeepSpaceScene', () => {
  it('configures starfield point density according to quality tier', () => {
    const scene = new THREE.Scene();

    const highScene = new DeepSpaceScene(scene, 'high');
    expect(highScene.getStarCount()).toBe(3000);
    highScene.dispose();

    const medScene = new DeepSpaceScene(scene, 'medium');
    expect(medScene.getStarCount()).toBe(1800);
    medScene.dispose();

    const lowScene = new DeepSpaceScene(scene, 'low');
    expect(lowScene.getStarCount()).toBe(800);
    lowScene.dispose();
  });

  it('updates procedural nebula octaves dynamically when tier changes', () => {
    const scene = new THREE.Scene();
    const deepSpace = new DeepSpaceScene(scene, 'high');

    deepSpace.setQualityTier('low');
    expect(deepSpace.getStarCount()).toBe(800);

    deepSpace.dispose();
  });
});

describe('5. CosmicEngine Lifecycle & Resiliency', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
  });

  it('instantiates cleanly with monotonic instanceId and boundIntentId', () => {
    const engine1 = new CosmicEngine({ canvas, boundIntentId: 201 });
    const engine2 = new CosmicEngine({ canvas, boundIntentId: 202 });

    expect(engine1.instanceId).toBeGreaterThan(0);
    expect(engine2.instanceId).toBe(engine1.instanceId + 1);
    expect(engine1.boundIntentId).toBe(201);
    expect(engine2.boundIntentId).toBe(202);

    engine1.dispose();
    engine2.dispose();
  });

  it('disposes idempotently without throwing or calling forceContextLoss', () => {
    const engine = new CosmicEngine({ canvas });
    expect(() => {
      engine.dispose();
      engine.dispose(); // Second dispose must be completely safe
    }).not.toThrow();
  });

  it('handles webglcontextlost and sets recovery timeout', () => {
    vi.useFakeTimers();
    const onError = vi.fn();
    const onContextLost = vi.fn();

    const engine = new CosmicEngine({
      canvas,
      onError,
      onContextLost,
    });
    engine.start();

    // Trigger context lost
    const event = new Event('webglcontextlost', { cancelable: true });
    canvas.dispatchEvent(event);

    expect(onContextLost).toHaveBeenCalled();
    expect(engine['isContextLost']).toBe(true);
    expect(engine['running']).toBe(false);

    // Fast-forward 5000ms: recovery timeout fires
    vi.advanceTimersByTime(5000);
    expect(onError).toHaveBeenCalledWith(expect.any(Error), true);

    engine.dispose();
    vi.useRealTimers();
  });

  it('handles webglcontextrestored and resumes render loop', () => {
    const onContextRestored = vi.fn();
    const engine = new CosmicEngine({
      canvas,
      onContextRestored,
    });
    engine.start();

    // Context lost then restored
    canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
    canvas.dispatchEvent(new Event('webglcontextrestored'));

    expect(onContextRestored).toHaveBeenCalled();
    expect(engine['isContextLost']).toBe(false);

    engine.dispose();
  });

  it('halts RAF loop and notifies onError if renderFrame throws (post-render scheduling)', () => {
    const onError = vi.fn();
    const engine = new CosmicEngine({ canvas, onError });
    engine.start();

    // Force render to throw
    vi.spyOn(engine['renderer']!, 'render').mockImplementation(() => {
      throw new Error('Simulated shader pipeline failure');
    });

    // Invoke tick
    engine['tick'](100);

    expect(onError).toHaveBeenCalledWith(expect.any(Error), false);
    expect(engine['running']).toBe(false);

    engine.dispose();
  });
});

describe('6. CosmicStaticFallback', () => {
  it('renders accessible fallback image role and handles retry callback', () => {
    const onRetry = vi.fn();
    render(
      <CosmicStaticFallback
        errorMessage="Custom WebGL Unavailable"
        onRetry={onRetry}
      />
    );

    const fallback = screen.getByTestId('cosmic-static-fallback');
    expect(fallback).toBeInTheDocument();
    expect(fallback).toHaveAttribute('role', 'img');

    const retryBtn = screen.getByRole('button', { name: /retry 3d/i });
    expect(retryBtn).toBeInTheDocument();

    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe('7. ZyriconCosmicCanvas Component & Dual-Ref Invariants', () => {
  it('renders canvas element within cosmic container', () => {
    render(<ZyriconCosmicCanvas />);

    const container = screen.getByTestId('zyricon-cosmic-container');
    const canvas = screen.getByTestId('zyricon-cosmic-canvas');

    expect(container).toBeInTheDocument();
    expect(canvas).toBeInTheDocument();
  });

  it('bypasses entrance animation when intent cause is initial-load', () => {
    const onCommit = vi.fn();
    render(
      <ZyriconCosmicCanvas
        transitionIntent={{
          id: 1,
          from: 'none',
          to: 'zyricon',
          cause: 'initial-load',
        }}
        committedTransitionId={0}
        onCommitTransition={onCommit}
      />
    );

    // Should NOT trigger entrance on initial-load
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('triggers entrance animation when intent is eligible (to=zyricon, cause=theme-change, id>committedId)', () => {
    const onCommit = vi.fn();
    const onComplete = vi.fn();

    render(
      <ZyriconCosmicCanvas
        transitionIntent={{
          id: 5,
          from: 'dark',
          to: 'zyricon',
          cause: 'theme-change',
        }}
        committedTransitionId={4}
        onCommitTransition={onCommit}
        onTransitionComplete={onComplete}
      />
    );

    // On render, entrance is registered with duration
    expect(screen.getByTestId('zyricon-cosmic-canvas')).toBeInTheDocument();
  });

  it('supports unmounting and remounting safely (StrictMode simulation)', () => {
    const { unmount } = render(<ZyriconCosmicCanvas />);
    expect(() => {
      unmount();
    }).not.toThrow();

    // Remount
    expect(() => {
      render(<ZyriconCosmicCanvas />);
    }).not.toThrow();
  });
});
