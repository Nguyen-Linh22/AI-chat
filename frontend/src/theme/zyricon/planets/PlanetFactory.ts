/**
 * ZYRICON COSMIC ATMOSPHERE — PLANETARY MESH FACTORY
 *
 * Constructs 3D models for:
 * 1. Jupiter (High-res Cassini 3.6K on High tier, 2K on Medium/Low tier).
 * 2. Saturn (2K body + authentic radial alpha ring with hardware depth testing).
 * 3. Mars (2K surface, smallest scale, distinct focal position).
 *
 * Implements:
 * - Proper axial tilts and transform hierarchy (tilt group -> spin group -> mesh).
 * - Radial UV mapping for Saturn ring alpha strip.
 * - Safe asynchronous texture loader with disposal cancellation.
 * - Tiered geometry detail (LOD) without removing any planet.
 */

import * as THREE from 'three';
import type { PlanetId, PlanetMeshGroup, QualityTier, TexturesLoadedState } from '../types';

export interface PlanetFactoryOptions {
  assetBasePath?: string;
  qualityTier?: QualityTier;
  onTextureLoaded?: (planetId: PlanetId, isRing?: boolean) => void;
  onTextureError?: (planetId: PlanetId, error: unknown) => void;
}

export class PlanetFactory {
  private readonly assetBasePath: string;
  private qualityTier: QualityTier;
  private readonly textureLoader: THREE.TextureLoader;
  private disposed = false;
  private loadedTextures: THREE.Texture[] = [];

  private readonly onTextureLoaded?: (planetId: PlanetId, isRing?: boolean) => void;
  private readonly onTextureError?: (planetId: PlanetId, error: unknown) => void;

  private jupiterGroup: PlanetMeshGroup | null = null;

  public readonly textureState: TexturesLoadedState = {
    jupiter: false,
    saturn: false,
    saturnRing: false,
    mars: false,
  };

  constructor(options: PlanetFactoryOptions = {}) {
    this.assetBasePath = options.assetBasePath ?? '/assets/cosmic';
    this.qualityTier = options.qualityTier ?? 'high';
    this.textureLoader = new THREE.TextureLoader();
    this.onTextureLoaded = options.onTextureLoaded;
    this.onTextureError = options.onTextureError;
  }

  public setQualityTier(tier: QualityTier): void {
    if (this.qualityTier === tier || this.disposed) return;
    const oldTier = this.qualityTier;
    this.qualityTier = tier;

    // Dynamically hot-swap Jupiter texture when transitioning across High tier
    if (this.jupiterGroup && (oldTier === 'high' || tier === 'high')) {
      const textureFile =
        tier === 'high'
          ? `${this.assetBasePath}/planets/jupiter/jupiter_cassini_3.6k.jpg`
          : `${this.assetBasePath}/planets/jupiter/jupiter_2k.jpg`;

      this.loadTextureSafely(
        textureFile,
        (tex) => {
          this.jupiterGroup!.bodyMesh.material.map = tex;
          this.jupiterGroup!.bodyMesh.material.needsUpdate = true;
        },
        'jupiter'
      );
    }
  }

  /**
   * Safe asynchronous texture loading with disposal guard.
   */
  private loadTextureSafely(
    url: string,
    onSuccess: (tex: THREE.Texture) => void,
    planetId: PlanetId,
    isRing = false
  ): void {
    if (this.disposed) return;

    this.textureLoader.load(
      url,
      (texture) => {
        if (this.disposed) {
          texture.dispose();
          return;
        }

        texture.colorSpace = THREE.SRGBColorSpace;
        this.loadedTextures.push(texture);

        if (planetId === 'jupiter') this.textureState.jupiter = true;
        else if (planetId === 'saturn') {
          if (isRing) this.textureState.saturnRing = true;
          else this.textureState.saturn = true;
        } else if (planetId === 'mars') this.textureState.mars = true;

        onSuccess(texture);
        this.onTextureLoaded?.(planetId, isRing);
      },
      undefined,
      (err) => {
        if (this.disposed) return;
        this.onTextureError?.(planetId, err);
      }
    );
  }

  /**
   * JUPITER
   * Largest focal gas giant.
   * Axial tilt: 3.13 deg (0.05463 rad)
   */
  public createJupiter(): PlanetMeshGroup {
    const radius = 18.0;
    const segs = this.qualityTier === 'high' ? 64 : this.qualityTier === 'medium' ? 48 : 32;
    const geom = new THREE.SphereGeometry(radius, segs, Math.round(segs / 2));

    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.82,
      metalness: 0.05,
    });

    const bodyMesh = new THREE.Mesh(geom, mat);
    bodyMesh.castShadow = false;
    bodyMesh.receiveShadow = false;

    // Transform hierarchy
    const rootGroup = new THREE.Group();
    const tiltGroup = new THREE.Group();
    const spinGroup = new THREE.Group();

    const axialTiltRad = 3.13 * (Math.PI / 180);
    tiltGroup.rotation.z = axialTiltRad;

    spinGroup.add(bodyMesh);
    tiltGroup.add(spinGroup);
    rootGroup.add(tiltGroup);

    const restingPosition = new THREE.Vector3(28, 2, -55);
    rootGroup.position.copy(restingPosition);

    // Texture selection based on tier
    const textureFile =
      this.qualityTier === 'high'
        ? `${this.assetBasePath}/planets/jupiter/jupiter_cassini_3.6k.jpg`
        : `${this.assetBasePath}/planets/jupiter/jupiter_2k.jpg`;

    this.loadTextureSafely(
      textureFile,
      (tex) => {
        mat.map = tex;
        mat.needsUpdate = true;
      },
      'jupiter'
    );

    const jupiterGroup: PlanetMeshGroup = {
      id: 'jupiter',
      group: rootGroup,
      bodyMesh,
      axialTiltRad,
      rotationSpeedRadPerSec: 0.026, // +18.2% from 0.022
      floatingFrequency: 0.22,
      floatingAmplitude: 0.55,
      floatingPhase: 0.0,
      restingPosition,
      entranceStartOffset: new THREE.Vector3(45, 20, 25),
    };

    this.jupiterGroup = jupiterGroup;
    return jupiterGroup;
  }

  /**
   * SATURN
   * Ringed gas giant with authentic concentric alpha ring.
   * Axial tilt: 26.73 deg (0.4665 rad)
   */
  public createSaturn(): PlanetMeshGroup {
    const radius = 12.0;
    const segs = this.qualityTier === 'high' ? 64 : this.qualityTier === 'medium' ? 48 : 32;
    const bodyGeom = new THREE.SphereGeometry(radius, segs, Math.round(segs / 2));

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xf3e5ab,
      roughness: 0.85,
      metalness: 0.04,
    });

    const bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);

    // Ring Geometry & Radial UV remap
    const innerRadius = 15.0;
    const outerRadius = 28.5;
    const ringThetaSegs = this.qualityTier === 'high' ? 64 : this.qualityTier === 'medium' ? 48 : 32;
    const ringGeom = new THREE.RingGeometry(innerRadius, outerRadius, ringThetaSegs, 4);

    // Remap planar UVs to radial 1D coordinates so saturn_ring_alpha.png maps cleanly
    // Row 0 has authentic radial alpha profile; in Three.js (flipY=true), row 0 center is at v = 0.996
    const pos = ringGeom.attributes.position;
    const uv = ringGeom.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const r = Math.sqrt(x * x + y * y);
      const radialU = Math.min(Math.max((r - innerRadius) / (outerRadius - innerRadius), 0.0), 1.0);
      uv.setXY(i, radialU, 0.996);
    }
    uv.needsUpdate = true;

    // Ring Material: transparent with depthWrite: true and alphaTest: 0.02
    // Resolves intersection with planet body via GPU depth buffer without z-fighting
    const ringMat = new THREE.MeshStandardMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      alphaTest: 0.03,
      depthWrite: true,
      depthTest: true,
      roughness: 0.85,
      metalness: 0.05,
      color: 0xe2d7b5,
    });

    ringMat.customProgramCacheKey = () => 'saturn_ring_alpha_v1';
    ringMat.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        /* glsl */ `
        #ifdef USE_MAP
          vec4 ringSample = texture2D( map, vMapUv );
          diffuseColor.a *= ringSample.a;
          // Authentic celestial ice-gold tone weighted by alpha density
          diffuseColor.rgb = vec3(0.91, 0.84, 0.70) * (0.35 + 0.65 * ringSample.a);
        #endif
        `
      );
    };

    const ringMesh = new THREE.Mesh(ringGeom, ringMat);
    // Align ring with planet equatorial plane (XZ plane)
    ringMesh.rotation.x = Math.PI / 2;

    // Transform hierarchy
    const rootGroup = new THREE.Group();
    const tiltGroup = new THREE.Group();
    const spinGroup = new THREE.Group();

    // Tilt Saturn and its rings towards the camera for iconic visible elliptical disk
    // Combined pitch (X) and roll (Z) creating true 3D orbital perspective
    const axialTiltRad = 26.73 * (Math.PI / 180);
    tiltGroup.rotation.x = 0.48; // ~27.5 degrees pitch towards viewer
    tiltGroup.rotation.z = 0.36; // ~20.6 degrees roll

    spinGroup.add(bodyMesh);
    spinGroup.add(ringMesh);
    tiltGroup.add(spinGroup);
    rootGroup.add(tiltGroup);

    const restingPosition = new THREE.Vector3(-22, -18, -70);
    rootGroup.position.copy(restingPosition);

    // Load body texture
    const bodyTextureFile = `${this.assetBasePath}/planets/saturn/saturn_2k.jpg`;
    this.loadTextureSafely(
      bodyTextureFile,
      (tex) => {
        bodyMat.map = tex;
        bodyMat.needsUpdate = true;
      },
      'saturn'
    );

    // Load ring alpha texture
    const ringTextureFile = `${this.assetBasePath}/rings/saturn_ring_alpha.png`;
    this.loadTextureSafely(
      ringTextureFile,
      (tex) => {
        // Prevent mipmap downsampling from filtering 1D radial scanlines to zero
        tex.generateMipmaps = false;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        ringMat.map = tex;
        ringMat.needsUpdate = true;
      },
      'saturn',
      true
    );

    return {
      id: 'saturn',
      group: rootGroup,
      bodyMesh,
      ringMesh,
      axialTiltRad,
      rotationSpeedRadPerSec: 0.0212, // +17.8% from 0.018
      floatingFrequency: 0.18,
      floatingAmplitude: 0.75,
      floatingPhase: 2.1,
      restingPosition,
      entranceStartOffset: new THREE.Vector3(-50, -25, 30),
    };
  }

  /**
   * MARS
   * Terrestrial red planet.
   * Axial tilt: 25.19 deg (0.4396 rad)
   */
  public createMars(): PlanetMeshGroup {
    const radius = 6.8;
    const segs = this.qualityTier === 'high' ? 48 : this.qualityTier === 'medium' ? 36 : 24;
    const geom = new THREE.SphereGeometry(radius, segs, Math.round(segs / 2));

    const mat = new THREE.MeshStandardMaterial({
      color: 0xdd6644,
      roughness: 0.88,
      metalness: 0.08,
    });

    const bodyMesh = new THREE.Mesh(geom, mat);

    // Transform hierarchy
    const rootGroup = new THREE.Group();
    const tiltGroup = new THREE.Group();
    const spinGroup = new THREE.Group();

    const axialTiltRad = 25.19 * (Math.PI / 180);
    tiltGroup.rotation.z = axialTiltRad;

    spinGroup.add(bodyMesh);
    tiltGroup.add(spinGroup);
    rootGroup.add(tiltGroup);

    const restingPosition = new THREE.Vector3(-28, 18, -70);
    rootGroup.position.copy(restingPosition);

    const textureFile = `${this.assetBasePath}/planets/mars/mars_2k.jpg`;
    this.loadTextureSafely(
      textureFile,
      (tex) => {
        mat.map = tex;
        mat.needsUpdate = true;
      },
      'mars'
    );

    return {
      id: 'mars',
      group: rootGroup,
      bodyMesh,
      axialTiltRad,
      rotationSpeedRadPerSec: 0.0177, // +18.0% from 0.015
      floatingFrequency: 0.32,
      floatingAmplitude: 0.45,
      floatingPhase: 4.3,
      restingPosition,
      entranceStartOffset: new THREE.Vector3(-20, 35, 20),
    };
  }

  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.jupiterGroup = null;

    for (const tex of this.loadedTextures) {
      tex.dispose();
    }
    this.loadedTextures = [];
  }
}
