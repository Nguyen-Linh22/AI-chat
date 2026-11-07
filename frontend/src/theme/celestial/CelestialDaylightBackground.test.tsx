// @vitest-environment jsdom

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CelestialDaylightBackground } from './CelestialDaylightBackground';
import { SkyAtmosphere } from './SkyAtmosphere';
import { CinematicSun } from './CinematicSun';
import { CloudCanopy } from './CloudCanopy';
import { CELESTIAL_ASSETS, CELESTIAL_CLOUD_LAYERS } from './celestial.config';

describe('CelestialDaylightBackground Component Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Root Component Rendering & Container Integrity', () => {
    it('renders top-level container with default testId and aria-hidden attributes', () => {
      render(<CelestialDaylightBackground />);
      const container = screen.getByTestId('celestial-daylight-bg');
      expect(container).toBeInTheDocument();
      expect(container).toHaveAttribute('aria-hidden', 'true');
      expect(container).toHaveClass('celestial-background-container');
    });

    it('applies custom className and custom style without overwriting baseline classes', () => {
      render(
        <CelestialDaylightBackground
          className="custom-workspace-class"
          style={{ opacity: 0.95 }}
          testId="custom-celestial-bg"
        />
      );
      const container = screen.getByTestId('custom-celestial-bg');
      expect(container).toHaveClass('celestial-background-container');
      expect(container).toHaveClass('custom-workspace-class');
      expect(container.style.opacity).toBe('0.95');
    });

    it('contains zero <canvas> elements, ensuring pure 2D DOM compositor execution (no WebGL)', () => {
      const { container } = render(<CelestialDaylightBackground />);
      const canvasElements = container.querySelectorAll('canvas');
      expect(canvasElements.length).toBe(0);
    });
  });

  describe('2. SkyAtmosphere Subcomponent', () => {
    it('renders sky atmosphere layer with solid fallback class and multi-stop gradient', () => {
      render(<SkyAtmosphere />);
      const sky = screen.getByTestId('celestial-sky-atmosphere');
      expect(sky).toBeInTheDocument();
      expect(sky).toHaveClass('celestial-sky-atmosphere');
      expect(sky).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('3. CinematicSun Subcomponent', () => {
    it('renders solar container with volumetric rays and corona SVGs', () => {
      render(<CinematicSun />);
      const sunContainer = screen.getByTestId('celestial-cinematic-sun');
      expect(sunContainer).toBeInTheDocument();
      expect(sunContainer).toHaveClass('celestial-sun-container');

      const rays = screen.getByTestId('celestial-volumetric-rays');
      expect(rays).toBeInTheDocument();
      const raysImg = rays.querySelector('img');
      expect(raysImg).toHaveAttribute('src', CELESTIAL_ASSETS.VOLUMETRIC_RAYS);

      const corona = screen.getByTestId('celestial-sun-corona');
      expect(corona).toBeInTheDocument();
      const coronaImg = corona.querySelector('img');
      expect(coronaImg).toHaveAttribute('src', CELESTIAL_ASSETS.SUN_CORONA);
    });

    it('supports disabling breathing animation via breathe={false}', () => {
      render(<CinematicSun breathe={false} />);
      const corona = screen.getByTestId('celestial-sun-corona');
      expect(corona.style.animation).toBe('none');
    });
  });

  describe('4. CloudCanopy & 3-Tier Layer Architecture', () => {
    it('renders all three cloud layers independently (Cirrus, Cumulus, Stratus)', () => {
      render(<CloudCanopy />);
      const canopy = screen.getByTestId('celestial-cloud-canopy');
      expect(canopy).toBeInTheDocument();

      for (const layer of CELESTIAL_CLOUD_LAYERS) {
        const layerEl = screen.getByTestId(`celestial-cloud-layer-${layer.id}`);
        expect(layerEl).toBeInTheDocument();
        expect(layerEl).toHaveClass(`layer-${layer.id}`);
        expect(layerEl.style.zIndex).toBe(String(layer.zIndex));
      }
    });

    it('implements the duplicated 200% strip with Segment A and Segment B for every layer', () => {
      render(<CloudCanopy />);

      for (const layer of CELESTIAL_CLOUD_LAYERS) {
        const strip = screen.getByTestId(`celestial-cloud-strip-${layer.id}`);
        expect(strip).toBeInTheDocument();
        expect(strip).toHaveClass('celestial-cloud-strip');

        // Check independent timing and offsets
        expect(strip.style.animationDuration).toBe(`${layer.duration}s`);
        expect(strip.style.animationDelay).toBe(`${layer.delay}s`);
        expect(strip.style.opacity).toBe(String(layer.opacity));

        // Exactly 2 segments per layer (A and B)
        const segments = strip.querySelectorAll('.celestial-cloud-segment');
        expect(segments.length).toBe(2);
        expect(segments[0]).toHaveAttribute('data-segment', 'A');
        expect(segments[1]).toHaveAttribute('data-segment', 'B');

        // Both segments reference the identical WebP asset
        const imgA = segments[0].querySelector('img');
        const imgB = segments[1].querySelector('img');
        expect(imgA).toHaveAttribute('src', layer.asset);
        expect(imgB).toHaveAttribute('src', layer.asset);
      }
    });

    it('renders a total of 6 cloud image elements (2 per tier)', () => {
      const { container } = render(<CloudCanopy />);
      const cloudImages = container.querySelectorAll('.celestial-cloud-image');
      expect(cloudImages.length).toBe(6);
    });
  });

  describe('5. Visibility Toggles', () => {
    it('hides sun when showSun={false}', () => {
      render(<CelestialDaylightBackground showSun={false} />);
      expect(screen.queryByTestId('celestial-cinematic-sun')).not.toBeInTheDocument();
      expect(screen.getByTestId('celestial-sky-atmosphere')).toBeInTheDocument();
      expect(screen.getByTestId('celestial-cloud-canopy')).toBeInTheDocument();
    });

    it('hides clouds when showClouds={false}', () => {
      render(<CelestialDaylightBackground showClouds={false} />);
      expect(screen.queryByTestId('celestial-cloud-canopy')).not.toBeInTheDocument();
      expect(screen.getByTestId('celestial-sky-atmosphere')).toBeInTheDocument();
      expect(screen.getByTestId('celestial-cinematic-sun')).toBeInTheDocument();
    });
  });
});

