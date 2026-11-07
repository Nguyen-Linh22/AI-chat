import type React from 'react';

export interface CelestialBackgroundProps {
  /** Optional custom CSS classes for the container */
  className?: string;
  /** Optional inline styles */
  style?: React.CSSProperties;
  /** Optional data-testid for testing (defaults to 'celestial-daylight-bg') */
  testId?: string;
  /** Whether the background is hidden from assistive technologies (default true) */
  ariaHidden?: boolean;
  /** Toggle visibility of the sun and volumetric light beams (default true) */
  showSun?: boolean;
  /** Toggle visibility of the 3 cloud canopy tiers (default true) */
  showClouds?: boolean;
}

export interface SkyAtmosphereProps {
  className?: string;
  style?: React.CSSProperties;
  testId?: string;
}

export interface CinematicSunProps {
  className?: string;
  style?: React.CSSProperties;
  testId?: string;
  /** Enable subtle 16s breathing aura animation (default true) */
  breathe?: boolean;
}

export interface CloudCanopyProps {
  className?: string;
  style?: React.CSSProperties;
  testId?: string;
}

export interface CloudLayerConfig {
  id: string;
  name: string;
  asset: string;
  duration: number; // in seconds
  delay: number; // in seconds
  opacity: number;
  topPercent: number; // Y position top%
  heightPercent: number; // Height %
  zIndex: number;
}

