import React from 'react';
import type { SkyAtmosphereProps } from './types';

export const SkyAtmosphere: React.FC<SkyAtmosphereProps> = React.memo(function SkyAtmosphere({
  className = '',
  style,
  testId = 'celestial-sky-atmosphere',
}) {
  return (
    <div
      className={`celestial-sky-atmosphere ${className}`.trim()}
      style={style}
      data-testid={testId}
      aria-hidden="true"
    />
  );
});

