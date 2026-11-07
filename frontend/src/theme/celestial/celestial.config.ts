import type { CloudLayerConfig } from './types';

/**
 * CELESTIAL DAYLIGHT — VISUAL & TIMING CONFIGURATION
 *
 * All parameters derive from Phase 1 Technical Specification (PHASE_1_DESIGN.md)
 * and verified Phase 2 Assets (ASSET_MANIFEST.md).
 * Colors harmonize strictly with the Light Theme design tokens (--brand-primary: #F59E0B).
 */

export const CELESTIAL_ASSETS = {
  CIRRUS_HIGH: '/assets/celestial/clouds/cirrus-high.webp',
  CUMULUS_MID: '/assets/celestial/clouds/cumulus-mid.webp',
  STRATUS_LOW: '/assets/celestial/clouds/stratus-low.webp',
  SUN_CORONA: '/assets/celestial/sun/sun-corona.svg',
  VOLUMETRIC_RAYS: '/assets/celestial/sun/volumetric-rays.svg',
} as const;

export const CELESTIAL_COLORS = {
  // Base atmosphere fallback (prevents unpainted frame flashes during transitions)
  SKY_FALLBACK: '#C8E8FC',

  // 8-stop Rayleigh Scattering linear gradient (Zenith to Horizon)
  SKY_ZENITH: '#84C2F5',      // 0%
  SKY_ZENITH_LOWER: '#98CEF8',// 14%
  SKY_UPPER_MID: '#A6D7FA',   // 26%
  SKY_MID_TRANSITION: '#B9E0FB', // 42%
  SKY_MID: '#C8E8FC',         // 58%
  SKY_LOWER_MID: '#D7EEFD',   // 74%
  SKY_LOWER_WASH: '#E5F4FD',  // 86%
  SKY_HORIZON: '#F4FAFF',     // 100%

  // Sun Radiance (Harmonized with ThemeSelector #F59E0B / #EA580C)
  SUN_CORE: '#FFFFFF',
  SUN_CORE_EDGE: '#FFFDF0',
  SUN_CORONA_INNER: '#FFE8A3',
  SUN_CORONA_WARM: '#FFE394',
  SUN_GLOW_AMBER: '#F59E0B',
  SUN_GLOW_ORANGE: '#EA580C',

  // Cloud Tones
  CLOUD_HIGHLIGHT: '#FFFFFF',
  CLOUD_BODY: '#F0F8FF',
  CLOUD_SHADOW: '#D9E8F5',
} as const;

export const CELESTIAL_CLOUD_LAYERS: CloudLayerConfig[] = [
  {
    id: 'cirrus',
    name: 'Layer 1: High Cirrus',
    asset: CELESTIAL_ASSETS.CIRRUS_HIGH,
    duration: 160, // 160s seamless horizontal loop
    delay: 0,
    opacity: 0.38,
    topPercent: 5,
    heightPercent: 45,
    zIndex: 3,
  },
  {
    id: 'cumulus',
    name: 'Layer 2: Mid Cumulus',
    asset: CELESTIAL_ASSETS.CUMULUS_MID,
    duration: 110, // 110s seamless horizontal loop
    delay: -35, // Staggered phase offset
    opacity: 0.62,
    topPercent: 20,
    heightPercent: 68,
    zIndex: 4,
  },
  {
    id: 'stratus',
    name: 'Layer 3: Low Stratus Horizon Haze',
    asset: CELESTIAL_ASSETS.STRATUS_LOW,
    duration: 135, // 135s seamless horizontal loop
    delay: -70, // Staggered phase offset
    opacity: 0.42,
    topPercent: 58,
    heightPercent: 42,
    zIndex: 5,
  },
];

export const CELESTIAL_TIMINGS = {
  SUN_BREATHE_DURATION: 16, // 16s subtle breathing cycle
  CIRRUS_DURATION: 160,
  CUMULUS_DURATION: 110,
  STRATUS_DURATION: 135,
} as const;

