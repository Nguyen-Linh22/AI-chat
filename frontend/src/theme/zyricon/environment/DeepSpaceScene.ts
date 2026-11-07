/**
 * ZYRICON COSMIC ATMOSPHERE — DEEP SPACE SCENE ENVIRONMENT
 *
 * Implements:
 * 1. 3D Procedural Starfield with depth layers and GPU twinkling.
 * 2. Procedural GPU Nebula with FBM noise and Zyricon deep navy/violet palette.
 * 3. Cinematic multi-point lighting (Solar Key + Cosmic Fill + Subtle Rim).
 * 4. Adaptive quality scaling and full resource disposal.
 */

import * as THREE from 'three';
import type { QualityTier } from '../types';

const NEBULA_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const NEBULA_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform vec2 uResolution;
  uniform int uOctaves;
  uniform float uOpacity;
  varying vec2 vUv;

  // 2D Hash function
  vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  // 2D Perlin-style gradient noise
  float noise2d(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(
      mix(dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
          dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
      mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
          dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  // Fractional Brownian Motion (fbm)
  float fbm(vec2 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 4; i++) {
      if (i >= octaves) break;
      value += amplitude * noise2d(p * frequency);
      frequency *= 2.02;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    
    // Animate coordinates slowly
    vec2 p = uv * 1.8 + vec2(uTime * 0.008, uTime * 0.005);
    
    float n1 = fbm(p, uOctaves);
    float n2 = fbm(p + vec2(n1 * 1.5, n1 * 1.2) + vec2(3.2, 1.7), uOctaves);
    float n3 = fbm(p + vec2(n2 * 2.0, -n2 * 1.6), uOctaves);

    // Deep Zyricon palette
    vec3 cBg      = vec3(0.027, 0.016, 0.043); // #07040B
    vec3 cDeep    = vec3(0.051, 0.027, 0.078); // #0D0714
    vec3 cViolet  = vec3(0.125, 0.047, 0.188); // #200C30
    vec3 cAura    = vec3(0.243, 0.071, 0.275); // #3E1246
    vec3 cCyanDust= vec3(0.035, 0.118, 0.196); // #091E32

    vec3 col = cBg;
    col = mix(col, cDeep, clamp(n1 * 0.5 + 0.5, 0.0, 1.0));
    col = mix(col, cViolet, clamp(n2 * 0.6 + 0.3, 0.0, 1.0) * 0.85);
    col = mix(col, cAura, clamp(pow(max(n3 + 0.2, 0.0), 2.2), 0.0, 1.0) * 0.45);
    col = mix(col, cCyanDust, clamp(n1 * n2 * 1.2, 0.0, 1.0) * 0.35);

    // Vignette to keep viewport center comfortable for text readability
    float dist = length(uv);
    float vignette = smoothstep(1.5, 0.3, dist);

    gl_FragColor = vec4(col, uOpacity * vignette);
  }
`;

const STAR_VERTEX_SHADER = /* glsl */ `
  attribute float aSize;
  attribute vec2 aTwinkle; // x: speed, y: phase
  attribute vec3 aColor;

  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uReducedMotion;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = aColor;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Size attenuation based on distance
    gl_PointSize = aSize * uPixelRatio * (300.0 / -mvPosition.z);

    // Twinkle calculation (disabled if reduced motion)
    float twinkle = 1.0;
    if (uReducedMotion < 0.5) {
      twinkle = 0.65 + 0.35 * sin(uTime * aTwinkle.x + aTwinkle.y);
    }
    vAlpha = clamp(twinkle, 0.2, 1.0);
  }
`;

const STAR_FRAGMENT_SHADER = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // Make circular soft star point
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;

    // Soft gaussian-like falloff
    float intensity = exp(-dist * dist * 10.0);
    gl_FragColor = vec4(vColor, vAlpha * intensity);
  }
`;

export class DeepSpaceScene {
  private readonly scene: THREE.Scene;
  private starfieldMesh: THREE.Points | null = null;
  private starfieldGeometry: THREE.BufferGeometry | null = null;
  private starfieldMaterial: THREE.ShaderMaterial | null = null;

  private nebulaMesh: THREE.Mesh | null = null;
  private nebulaGeometry: THREE.PlaneGeometry | null = null;
  private nebulaMaterial: THREE.ShaderMaterial | null = null;

  private ambientLight: THREE.AmbientLight | null = null;
  private solarLight: THREE.DirectionalLight | null = null;
  private cosmicRimLight: THREE.DirectionalLight | null = null;

  private currentTier: QualityTier = 'high';
  private starCount = 3000;
  private isReducedMotion = false;
  private disposed = false;

  constructor(scene: THREE.Scene, initialTier: QualityTier = 'high', prefersReducedMotion = false) {
    this.scene = scene;
    this.currentTier = initialTier;
    this.isReducedMotion = prefersReducedMotion;

    this.setupLighting();
    this.setupNebula();
    this.setupStarfield();
  }

  public getStarCount(): number {
    return this.starCount;
  }

  private setupLighting(): void {
    // Ambient cosmic fill - deep violet/navy preventing pitch black silhouettes
    this.ambientLight = new THREE.AmbientLight(0x1a1228, 0.45);
    this.scene.add(this.ambientLight);

    // Key solar directional light - warm stellar tone for high-contrast planetary crescents
    this.solarLight = new THREE.DirectionalLight(0xfff5e6, 1.7);
    this.solarLight.position.set(65, 45, 80);
    this.scene.add(this.solarLight);

    // Fill / Rim directional light - cool celestial purple from rear lower angle
    this.cosmicRimLight = new THREE.DirectionalLight(0x4a2360, 0.55);
    this.cosmicRimLight.position.set(-60, -40, -50);
    this.scene.add(this.cosmicRimLight);
  }

  private setupNebula(): void {
    // Rendered on a large distant plane behind the planets (z = -460)
    this.nebulaGeometry = new THREE.PlaneGeometry(380, 260);

    const octaves = this.currentTier === 'high' ? 3 : this.currentTier === 'medium' ? 2 : 1;

    const width = typeof window !== 'undefined' ? window.innerWidth : 800;
    const height = typeof window !== 'undefined' ? window.innerHeight : 600;

    this.nebulaMaterial = new THREE.ShaderMaterial({
      vertexShader: NEBULA_VERTEX_SHADER,
      fragmentShader: NEBULA_FRAGMENT_SHADER,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(width, height) },
        uOctaves: { value: octaves },
        uOpacity: { value: 0.95 },
      },
      transparent: true,
      depthWrite: false,
      depthTest: true,
    });

    this.nebulaMesh = new THREE.Mesh(this.nebulaGeometry, this.nebulaMaterial);
    this.nebulaMesh.position.set(0, 0, -460);
    this.scene.add(this.nebulaMesh);
  }

  private setupStarfield(): void {
    if (this.starfieldMesh) {
      this.scene.remove(this.starfieldMesh);
      this.starfieldGeometry?.dispose();
      this.starfieldMaterial?.dispose();
      this.starfieldMesh = null;
      this.starfieldGeometry = null;
      this.starfieldMaterial = null;
    }

    const counts: Record<QualityTier, number> = {
      high: 3000,
      medium: 1800,
      low: 800,
    };
    this.starCount = counts[this.currentTier];

    const positions = new Float32Array(this.starCount * 3);
    const colors = new Float32Array(this.starCount * 3);
    const sizes = new Float32Array(this.starCount);
    const twinkles = new Float32Array(this.starCount * 2);

    const colorPalette = [
      new THREE.Color(0xd1d5db), // 60% celestial silver
      new THREE.Color(0xf9fafb),
      new THREE.Color(0x93c5fd), // 20% blue
      new THREE.Color(0x38bdf8),
      new THREE.Color(0xc084fc), // 15% violet
      new THREE.Color(0xa855f7),
      new THREE.Color(0xfde68a), // 5% warm gold
    ];

    for (let i = 0; i < this.starCount; i++) {
      const idx3 = i * 3;
      const idx2 = i * 2;

      // 3D distribution across deep cosmic volume
      positions[idx3] = (Math.random() - 0.5) * 360;
      positions[idx3 + 1] = (Math.random() - 0.5) * 240;
      positions[idx3 + 2] = -450 + Math.random() * 480; // Z from -450 to +30

      // Color selection
      const rand = Math.random();
      let selectedColor: THREE.Color;
      if (rand < 0.60) {
        selectedColor = colorPalette[Math.floor(Math.random() * 2)];
      } else if (rand < 0.80) {
        selectedColor = colorPalette[2 + Math.floor(Math.random() * 2)];
      } else if (rand < 0.95) {
        selectedColor = colorPalette[4 + Math.floor(Math.random() * 2)];
      } else {
        selectedColor = colorPalette[6];
      }

      colors[idx3] = selectedColor.r;
      colors[idx3 + 1] = selectedColor.g;
      colors[idx3 + 2] = selectedColor.b;

      // Size distribution (most stars are tiny, few are brighter)
      sizes[i] = 1.0 + Math.random() * (Math.random() < 0.08 ? 3.0 : 1.5);

      // Twinkle speed & phase: +20% faster frequency (range [0.6, 3.0] rad/s)
      twinkles[idx2] = (0.5 + Math.random() * 2.0) * 1.20; // speed (rad/s)
      twinkles[idx2 + 1] = Math.random() * Math.PI * 2; // phase
    }

    this.starfieldGeometry = new THREE.BufferGeometry();
    this.starfieldGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.starfieldGeometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    this.starfieldGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    this.starfieldGeometry.setAttribute('aTwinkle', new THREE.BufferAttribute(twinkles, 2));

    this.starfieldMaterial = new THREE.ShaderMaterial({
      vertexShader: STAR_VERTEX_SHADER,
      fragmentShader: STAR_FRAGMENT_SHADER,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1 },
        uReducedMotion: { value: this.isReducedMotion ? 1.0 : 0.0 },
      },
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
    });

    this.starfieldMesh = new THREE.Points(this.starfieldGeometry, this.starfieldMaterial);
    this.scene.add(this.starfieldMesh);
  }

  public setQualityTier(tier: QualityTier): void {
    if (this.currentTier === tier || this.disposed) return;
    this.currentTier = tier;

    // Update nebula octaves
    if (this.nebulaMaterial) {
      const octaves = tier === 'high' ? 3 : tier === 'medium' ? 2 : 1;
      this.nebulaMaterial.uniforms.uOctaves.value = octaves;
    }

    // Rebuild starfield with updated density
    this.setupStarfield();
  }

  public setReducedMotion(reduced: boolean): void {
    this.isReducedMotion = reduced;
    if (this.starfieldMaterial) {
      this.starfieldMaterial.uniforms.uReducedMotion.value = reduced ? 1.0 : 0.0;
    }
  }

  public setPixelRatio(ratio: number): void {
    if (this.starfieldMaterial) {
      this.starfieldMaterial.uniforms.uPixelRatio.value = ratio;
    }
  }

  public setResolution(width: number, height: number): void {
    if (this.nebulaMaterial) {
      this.nebulaMaterial.uniforms.uResolution.value.set(width, height);
    }
  }

  public update(elapsedSec: number): void {
    if (this.disposed) return;

    const time = this.isReducedMotion ? 0 : elapsedSec;

    if (this.nebulaMaterial) {
      this.nebulaMaterial.uniforms.uTime.value = time;
    }

    if (this.starfieldMaterial) {
      this.starfieldMaterial.uniforms.uTime.value = time;
    }
  }

  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    if (this.starfieldMesh) {
      this.scene.remove(this.starfieldMesh);
      this.starfieldMesh = null;
    }
    this.starfieldGeometry?.dispose();
    this.starfieldGeometry = null;
    this.starfieldMaterial?.dispose();
    this.starfieldMaterial = null;

    if (this.nebulaMesh) {
      this.scene.remove(this.nebulaMesh);
      this.nebulaMesh = null;
    }
    this.nebulaGeometry?.dispose();
    this.nebulaGeometry = null;
    this.nebulaMaterial?.dispose();
    this.nebulaMaterial = null;

    if (this.ambientLight) {
      this.scene.remove(this.ambientLight);
      this.ambientLight.dispose();
      this.ambientLight = null;
    }
    if (this.solarLight) {
      this.scene.remove(this.solarLight);
      this.solarLight.dispose();
      this.solarLight = null;
    }
    if (this.cosmicRimLight) {
      this.scene.remove(this.cosmicRimLight);
      this.cosmicRimLight.dispose();
      this.cosmicRimLight = null;
    }
  }
}
