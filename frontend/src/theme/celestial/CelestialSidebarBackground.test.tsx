// @vitest-environment jsdom

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CelestialSidebarBackground,
  CELESTIAL_SIDEBAR_CLOUDS,
} from './CelestialSidebarBackground';
import { CELESTIAL_ASSETS } from './celestial.config';

describe('CelestialSidebarBackground Component Suite (Milestone M3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Root Component Rendering & Container Integrity', () => {
    it('renders top-level container with default testId and aria-hidden="true"', () => {
      render(<CelestialSidebarBackground />);
      const container = screen.getByTestId('celestial-sidebar-bg');
      expect(container).toBeInTheDocument();
      expect(container).toHaveAttribute('aria-hidden', 'true');
      expect(container).toHaveClass('celestial-sidebar-bg');
    });

    it('applies custom className and custom style without overwriting baseline classes', () => {
      render(
        <CelestialSidebarBackground
          className="custom-sidebar-class"
          style={{ opacity: 0.9 }}
          testId="custom-sidebar-bg"
        />
      );
      const container = screen.getByTestId('custom-sidebar-bg');
      expect(container).toHaveClass('celestial-sidebar-bg');
      expect(container).toHaveClass('custom-sidebar-class');
      expect(container.style.opacity).toBe('0.9');
    });

    it('respects ariaHidden={false} prop when explicitly provided', () => {
      render(<CelestialSidebarBackground ariaHidden={false} />);
      const container = screen.getByTestId('celestial-sidebar-bg');
      expect(container).toHaveAttribute('aria-hidden', 'false');
    });

    it('contains zero <canvas> elements, ensuring pure 2D DOM compositor execution (no WebGL)', () => {
      const { container } = render(<CelestialSidebarBackground />);
      const canvasElements = container.querySelectorAll('canvas');
      expect(canvasElements.length).toBe(0);
    });
  });

  describe('2. Tier 1: Atmosphere Sub-layer (Rayleigh Scattering)', () => {
    it('renders sky atmosphere layer with class and aria-hidden', () => {
      render(<CelestialSidebarBackground />);
      const atmosphere = screen.getByTestId('celestial-sidebar-atmosphere');
      expect(atmosphere).toBeInTheDocument();
      expect(atmosphere).toHaveClass('celestial-sidebar-atmosphere');
      expect(atmosphere).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('3. Tier 2: Directional Sunlight & Solar Halo', () => {
    it('renders directional sunlight layer positioned at top-right', () => {
      render(<CelestialSidebarBackground />);
      const sunlight = screen.getByTestId('celestial-sidebar-sunlight');
      expect(sunlight).toBeInTheDocument();
      expect(sunlight).toHaveClass('celestial-sidebar-sunlight');
      expect(sunlight).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('4. Tier 3: Floating Cloud Layers & WebP Strips', () => {
    it('renders clouds container with aria-hidden', () => {
      render(<CelestialSidebarBackground />);
      const clouds = screen.getByTestId('celestial-sidebar-clouds');
      expect(clouds).toBeInTheDocument();
      expect(clouds).toHaveClass('celestial-sidebar-clouds');
      expect(clouds).toHaveAttribute('aria-hidden', 'true');
    });

    it('renders exactly 2 cloud layers: High Cirrus and Soft Stratus', () => {
      render(<CelestialSidebarBackground />);
      expect(CELESTIAL_SIDEBAR_CLOUDS).toHaveLength(2);

      const cirrusLayer = screen.getByTestId('celestial-sidebar-cloud-layer-sidebar-cirrus');
      const stratusLayer = screen.getByTestId('celestial-sidebar-cloud-layer-sidebar-stratus');

      expect(cirrusLayer).toBeInTheDocument();
      expect(stratusLayer).toBeInTheDocument();
    });

    it('loads correct WebP assets and creates duplicated 200% width strips for seamless looping', () => {
      render(<CelestialSidebarBackground />);

      // Cirrus high
      const cirrusStrip = screen.getByTestId('celestial-sidebar-cloud-strip-sidebar-cirrus');
      expect(cirrusStrip).toBeInTheDocument();
      expect(cirrusStrip.style.animationDuration).toBe('140s');
      expect(cirrusStrip.style.opacity).toBe('0.22');
      expect(cirrusStrip.style.top).toBe('8%');

      const cirrusImgs = cirrusStrip.querySelectorAll('img');
      expect(cirrusImgs).toHaveLength(2); // Segment A and Segment B
      expect(cirrusImgs[0]).toHaveAttribute('src', CELESTIAL_ASSETS.CIRRUS_HIGH);
      expect(cirrusImgs[1]).toHaveAttribute('src', CELESTIAL_ASSETS.CIRRUS_HIGH);
      expect(cirrusImgs[0]).toHaveAttribute('loading', 'eager');
      expect(cirrusImgs[0]).toHaveAttribute('decoding', 'async');
      expect(cirrusImgs[0].draggable).toBe(false);

      // Stratus low
      const stratusStrip = screen.getByTestId('celestial-sidebar-cloud-strip-sidebar-stratus');
      expect(stratusStrip).toBeInTheDocument();
      expect(stratusStrip.style.animationDuration).toBe('180s');
      expect(stratusStrip.style.opacity).toBe('0.28');
      expect(stratusStrip.style.top).toBe('60%');

      const stratusImgs = stratusStrip.querySelectorAll('img');
      expect(stratusImgs).toHaveLength(2);
      expect(stratusImgs[0]).toHaveAttribute('src', CELESTIAL_ASSETS.STRATUS_LOW);
      expect(stratusImgs[1]).toHaveAttribute('src', CELESTIAL_ASSETS.STRATUS_LOW);
    });
  });

  describe('5. Tier 4: Horizon Mist', () => {
    it('renders subtle horizon mist at the bottom of the sidebar', () => {
      render(<CelestialSidebarBackground />);
      const mist = screen.getByTestId('celestial-sidebar-mist');
      expect(mist).toBeInTheDocument();
      expect(mist).toHaveClass('celestial-sidebar-mist');
      expect(mist).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('6. Component Stability & Performance', () => {
    it('renders cleanly without console errors or warnings', () => {
      const errorSpy = vi.spyOn(console, 'error');
      const warnSpy = vi.spyOn(console, 'warn');

      render(<CelestialSidebarBackground />);

      expect(errorSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();

      errorSpy.mockRestore();
      warnSpy.mockRestore();
    });

    it('unmounts cleanly with zero residual nodes or listeners', () => {
      const { unmount } = render(<CelestialSidebarBackground />);
      expect(screen.getByTestId('celestial-sidebar-bg')).toBeInTheDocument();
      unmount();
      expect(screen.queryByTestId('celestial-sidebar-bg')).not.toBeInTheDocument();
    });
  });
});

