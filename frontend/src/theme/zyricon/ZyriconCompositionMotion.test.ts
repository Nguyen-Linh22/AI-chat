// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { PlanetFactory } from './planets/PlanetFactory';
import { CosmicMotionController } from './controllers/CosmicMotionController';
import { DeepSpaceScene } from './environment/DeepSpaceScene';

// Mock WebGLRenderer & TextureLoader
vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal<typeof import('three')>();
  return {
    ...actual,
    TextureLoader: class {
      load(
        _url: string,
        onLoad?: (texture: THREE.Texture) => void,
        _onProgress?: undefined,
        _onError?: undefined
      ) {
        const dummyCanvas = document.createElement('canvas');
        dummyCanvas.width = 16;
        dummyCanvas.height = 16;
        const texture = new actual.CanvasTexture(dummyCanvas);
        onLoad?.(texture);
        return texture;
      }
    },
  };
});

describe('Zyricon Refinement — Planet Composition & Motion Polish', () => {
  let camera: THREE.PerspectiveCamera;
  let controller: CosmicMotionController;
  let factory: PlanetFactory;

  beforeEach(() => {
    camera = new THREE.PerspectiveCamera(45, 1200 / 900, 0.1, 1000);
    camera.position.set(0, 0, 50);
    controller = new CosmicMotionController(camera, false);
    factory = new PlanetFactory({ qualityTier: 'high' });
  });

  it('Requirement B: Configures the new Desktop planet composition correctly', () => {
    const jupiter = factory.createJupiter();
    const saturn = factory.createSaturn();
    const mars = factory.createMars();

    controller.registerPlanets([jupiter, saturn, mars]);
    controller.setViewportMode(false); // Desktop mode

    // 1. Jupiter: large planet, near-center shifted right
    expect(jupiter.restingPosition.x).toBe(28);
    expect(jupiter.restingPosition.y).toBe(2);
    expect(jupiter.restingPosition.z).toBe(-55);
    expect(jupiter.group.scale.x).toBeCloseTo(1.05);

    // 2. Mars: small planet, upper-left
    expect(mars.restingPosition.x).toBe(-28);
    expect(mars.restingPosition.y).toBe(18);
    expect(mars.restingPosition.z).toBe(-70);
    expect(mars.group.scale.x).toBeCloseTo(0.75);

    // 3. Saturn: small planet with ring, lower-left
    expect(saturn.restingPosition.x).toBe(-22);
    expect(saturn.restingPosition.y).toBe(-18);
    expect(saturn.restingPosition.z).toBe(-70);
    expect(saturn.group.scale.x).toBeCloseTo(0.65);
  });

  it('Requirement B: Configures responsive Mobile portrait composition correctly', () => {
    const jupiter = factory.createJupiter();
    const saturn = factory.createSaturn();
    const mars = factory.createMars();

    controller.registerPlanets([jupiter, saturn, mars]);
    controller.setViewportMode(true); // Mobile portrait mode

    // Mobile: Mars top-left, Jupiter center-right, Saturn bottom-left
    expect(mars.restingPosition.x).toBe(-7);
    expect(mars.restingPosition.y).toBe(26);
    expect(mars.restingPosition.z).toBe(-75);
    expect(mars.group.scale.x).toBeCloseTo(0.65);

    expect(jupiter.restingPosition.x).toBe(6);
    expect(jupiter.restingPosition.y).toBe(4);
    expect(jupiter.restingPosition.z).toBe(-65);
    expect(jupiter.group.scale.x).toBeCloseTo(0.75);

    expect(saturn.restingPosition.x).toBe(-6);
    expect(saturn.restingPosition.y).toBe(-22);
    expect(saturn.restingPosition.z).toBe(-75);
    expect(saturn.group.scale.x).toBeCloseTo(0.55);
  });

  it('Requirement C: Planet self-rotation speeds are increased by ~18% with natural differentiation', () => {
    const jupiter = factory.createJupiter();
    const saturn = factory.createSaturn();
    const mars = factory.createMars();

    // Jupiter: ~0.026 rad/s (from 0.022, +18.2%)
    expect(jupiter.rotationSpeedRadPerSec).toBeCloseTo(0.026, 4);

    // Saturn: ~0.0212 rad/s (from 0.018, +17.8%)
    expect(saturn.rotationSpeedRadPerSec).toBeCloseTo(0.0212, 4);

    // Mars: ~0.0177 rad/s (from 0.015, +18.0%)
    expect(mars.rotationSpeedRadPerSec).toBeCloseTo(0.0177, 4);

    // Differentiation: Jupiter > Saturn > Mars
    expect(jupiter.rotationSpeedRadPerSec).toBeGreaterThan(saturn.rotationSpeedRadPerSec);
    expect(saturn.rotationSpeedRadPerSec).toBeGreaterThan(mars.rotationSpeedRadPerSec);
  });

  it('Requirement D: Starfield twinkle speeds are +20% faster within range [0.6, 3.0] rad/s', () => {
    const scene = new THREE.Scene();
    const deepSpace = new DeepSpaceScene(scene, 'high', false);

    const starfield = scene.children.find((c) => c instanceof THREE.Points) as THREE.Points;
    expect(starfield).toBeDefined();

    const twinkleAttr = starfield?.geometry.getAttribute('aTwinkle');
    expect(twinkleAttr).toBeDefined();

    if (twinkleAttr) {
      for (let i = 0; i < Math.min(100, twinkleAttr.count); i++) {
        const speed = twinkleAttr.getX(i);
        // Base was [0.5, 2.5], scaled by 1.2 is [0.6, 3.0]
        expect(speed).toBeGreaterThanOrEqual(0.60 - 0.001);
        expect(speed).toBeLessThanOrEqual(3.00 + 0.001);
      }
    }

    deepSpace.dispose();
  });

  it('Requirement C & D: Respects prefers-reduced-motion (freezes rotations, parallax, twinkle)', () => {
    const reducedController = new CosmicMotionController(camera, true);
    const jupiter = factory.createJupiter();
    reducedController.registerPlanets([jupiter]);

    const spinGroup = jupiter.group.children[0]?.children[0];
    const initialRotY = spinGroup?.rotation.y ?? 0;

    reducedController.update(0.016, 1.0);

    // No rotation occurred
    expect(spinGroup?.rotation.y).toBe(initialRotY);

    // Reduced motion starfield has uniform uReducedMotion = 1.0
    const scene = new THREE.Scene();
    const deepSpace = new DeepSpaceScene(scene, 'high', true);
    const starfield = scene.children.find((c) => c instanceof THREE.Points) as THREE.Points;
    const mat = starfield?.material as THREE.ShaderMaterial;
    expect(mat.uniforms.uReducedMotion.value).toBe(1.0);

    deepSpace.dispose();
  });
});
