import React from 'react';
import type { CinematicSunProps } from './types';
import { CELESTIAL_ASSETS } from './celestial.config';

export const CinematicSun: React.FC<CinematicSunProps> = React.memo(function CinematicSun({
  className = '',
  style,
  testId = 'celestial-cinematic-sun',
  breathe = true,
}) {
  return (
    <div
      className={`celestial-sun-container ${className}`.trim()}
      style={style}
      data-testid={testId}
      aria-hidden="true"
    >
      {/* Directional Volumetric Crepuscular Sun Rays (God Rays) */}
      <div className="celestial-sun-rays" data-testid="celestial-volumetric-rays">
        <img
          src={CELESTIAL_ASSETS.VOLUMETRIC_RAYS}
          alt=""
          width={800}
          height={600}
          loading="eager"
          decoding="async"
          draggable={false}
        />
      </div>

      {/* Concentric Photosphere, Chromosphere, Corona & Breathing Aura */}
      <div
        className="celestial-sun-corona"
        style={breathe ? undefined : { animation: 'none' }}
        data-testid="celestial-sun-corona"
      >
        <img
          src={CELESTIAL_ASSETS.SUN_CORONA}
          alt=""
          width={560}
          height={560}
          loading="eager"
          decoding="async"
          draggable={false}
        />
      </div>
    </div>
  );
});

