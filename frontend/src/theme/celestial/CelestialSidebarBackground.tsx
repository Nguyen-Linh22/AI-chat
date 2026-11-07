import React from 'react';
import { CELESTIAL_ASSETS } from './celestial.config';
import './celestial.css';

export interface CelestialSidebarBackgroundProps {
  /** Optional custom CSS classes for the container */
  className?: string;
  /** Optional inline styles */
  style?: React.CSSProperties;
  /** Optional data-testid for testing (defaults to 'celestial-sidebar-bg') */
  testId?: string;
  /** Whether the background is hidden from assistive technologies (default true) */
  ariaHidden?: boolean;
}

export interface SidebarCloudConfig {
  id: string;
  name: string;
  asset: string;
  duration: number; // in seconds
  delay: number; // in seconds
  opacity: number;
  topPercent: number;
  heightPercent: number;
  zIndex: number;
}

export const CELESTIAL_SIDEBAR_CLOUDS: SidebarCloudConfig[] = [
  {
    id: 'sidebar-cirrus',
    name: 'High Cirrus',
    asset: CELESTIAL_ASSETS.CIRRUS_HIGH,
    duration: 140, // 140s slow loop
    delay: 0,
    opacity: 0.22,
    topPercent: 8,
    heightPercent: 24,
    zIndex: 2,
  },
  {
    id: 'sidebar-stratus',
    name: 'Soft Stratus',
    asset: CELESTIAL_ASSETS.STRATUS_LOW,
    duration: 180, // 180s ultra slow loop
    delay: -45, // Staggered phase offset
    opacity: 0.28,
    topPercent: 60,
    heightPercent: 35,
    zIndex: 3,
  },
];

/**
 * CELESTIAL SIDEBAR BACKGROUND
 * "A soft sky above your workspace."
 *
 * Dedicated lightweight sky atmosphere for the workspace Sidebar in Light Theme.
 * Pure 2D Compositor: Rayleigh Gradient + Directional Sunlight + 2 WebP Cloud Strips + Horizon Mist.
 * Zero Three.js / WebGL overhead. Does NOT require isCollapsed prop (auto-adapts via CSS).
 */
export const CelestialSidebarBackground: React.FC<CelestialSidebarBackgroundProps> = React.memo(
  function CelestialSidebarBackground({
    className = '',
    style,
    testId = 'celestial-sidebar-bg',
    ariaHidden = true,
  }) {
    return (
      <div
        className={`celestial-sidebar-bg ${className}`.trim()}
        style={style}
        data-testid={testId}
        aria-hidden={ariaHidden}
      >
        {/* Tier 1: Base Rayleigh Scattering Vertical Gradient with Solid Fallback */}
        <div
          className="celestial-sidebar-atmosphere"
          data-testid="celestial-sidebar-atmosphere"
          aria-hidden="true"
        />

        {/* Tier 2: Directional Sunlight & Solar Halo radiating from top-right */}
        <div
          className="celestial-sidebar-sunlight"
          data-testid="celestial-sidebar-sunlight"
          aria-hidden="true"
        />

        {/* Tier 3: Floating Cloud Layers */}
        <div
          className="celestial-sidebar-clouds"
          data-testid="celestial-sidebar-clouds"
          aria-hidden="true"
        >
          {CELESTIAL_SIDEBAR_CLOUDS.map((layer) => (
            <div
              key={layer.id}
              className={`celestial-sidebar-cloud-layer layer-${layer.id}`}
              style={{ zIndex: layer.zIndex }}
              data-testid={`celestial-sidebar-cloud-layer-${layer.id}`}
            >
              <div
                className="celestial-sidebar-cloud-strip"
                style={{
                  top: `${layer.topPercent}%`,
                  height: `${layer.heightPercent}%`,
                  opacity: layer.opacity,
                  animationDuration: `${layer.duration}s`,
                  animationDelay: `${layer.delay}s`,
                }}
                data-testid={`celestial-sidebar-cloud-strip-${layer.id}`}
              >
                {/* Segment A */}
                <div className="celestial-cloud-segment" data-segment="A">
                  <img
                    src={layer.asset}
                    alt=""
                    className="celestial-cloud-image"
                    loading="eager"
                    decoding="async"
                    draggable={false}
                  />
                </div>

                {/* Segment B */}
                <div className="celestial-cloud-segment" data-segment="B">
                  <img
                    src={layer.asset}
                    alt=""
                    className="celestial-cloud-image"
                    loading="eager"
                    decoding="async"
                    draggable={false}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tier 4: Subtle Atmospheric Horizon Mist */}
        <div
          className="celestial-sidebar-mist"
          data-testid="celestial-sidebar-mist"
          aria-hidden="true"
        />
      </div>
    );
  }
);

export default CelestialSidebarBackground;

