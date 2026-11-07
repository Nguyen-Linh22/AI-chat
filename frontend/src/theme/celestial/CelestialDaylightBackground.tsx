import React from 'react';
import type { CelestialBackgroundProps } from './types';
import { SkyAtmosphere } from './SkyAtmosphere';
import { CinematicSun } from './CinematicSun';
import { CloudCanopy } from './CloudCanopy';
import './celestial.css';

/**
 * CELESTIAL DAYLIGHT BACKGROUND
 * "A brighter space to think, create and explore."
 *
 * Cinematic Realism daytime sky designed for the Light theme.
 * Pure 2D Compositor Architecture (CSS Multi-stop Gradients, Scalable SVG Vectors & Transparent WebP Canopies).
 * Zero Three.js/WebGL overhead.
 */
export const CelestialDaylightBackground: React.FC<CelestialBackgroundProps> = React.memo(
  function CelestialDaylightBackground({
    className = '',
    style,
    testId = 'celestial-daylight-bg',
    ariaHidden = true,
    showSun = true,
    showClouds = true,
  }) {
    return (
      <div
        className={`celestial-background-container ${className}`.trim()}
        style={style}
        data-testid={testId}
        aria-hidden={ariaHidden}
      >
        {/* Tier 1: Base Rayleigh Scattering Sky Atmosphere */}
        <SkyAtmosphere />

        {/* Tier 2: Cinematic Sun Core, Corona & Volumetric Beams */}
        {showSun && <CinematicSun />}

        {/* Tier 3: Three-Tier Drifting Cloud Canopy */}
        {showClouds && <CloudCanopy />}
      </div>
    );
  }
);

export default CelestialDaylightBackground;

