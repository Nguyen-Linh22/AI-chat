import React from 'react';
import type { CloudCanopyProps } from './types';
import { CELESTIAL_CLOUD_LAYERS } from './celestial.config';

export const CloudCanopy: React.FC<CloudCanopyProps> = React.memo(function CloudCanopy({
  className = '',
  style,
  testId = 'celestial-cloud-canopy',
}) {
  return (
    <div
      className={`celestial-cloud-canopy ${className}`.trim()}
      style={style}
      data-testid={testId}
      aria-hidden="true"
    >
      {CELESTIAL_CLOUD_LAYERS.map((layer) => (
        <div
          key={layer.id}
          className={`celestial-cloud-layer layer-${layer.id}`}
          style={{ zIndex: layer.zIndex }}
          data-testid={`celestial-cloud-layer-${layer.id}`}
        >
          {/* Duplicated 200% width strip for seamless horizontal translation */}
          <div
            className="celestial-cloud-strip"
            style={{
              top: `${layer.topPercent}%`,
              height: `${layer.heightPercent}%`,
              opacity: layer.opacity,
              animationDuration: `${layer.duration}s`,
              animationDelay: `${layer.delay}s`,
            }}
            data-testid={`celestial-cloud-strip-${layer.id}`}
          >
            {/* Segment A (0% to 50% of strip width) */}
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

            {/* Segment B (50% to 100% of strip width: identical clone) */}
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
  );
});

