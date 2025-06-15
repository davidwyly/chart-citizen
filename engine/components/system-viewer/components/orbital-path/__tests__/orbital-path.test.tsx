import { render } from '@testing-library/react';
import { Canvas } from '@react-three/fiber';
import { OrbitalPath } from '../orbital-path';
import { describe, it, expect, vi } from 'vitest';

// Mock useFrame to prevent R3F hook errors
vi.mock('@react-three/fiber', async () => {
  const actual = await vi.importActual('@react-three/fiber');
  return {
    ...actual,
    useFrame: vi.fn(),
  };
});

const mockProps = {
  semiMajorAxis: 100,
  eccentricity: 0.1,
  inclination: 0,
  orbitalPeriod: 365,
  showOrbit: true,
  timeMultiplier: 1,
  isPaused: false,
  viewType: 'realistic' as const,
};

// Helper to render component in Canvas
const renderInCanvas = (props = {}) => {
  return render(
    <Canvas>
      <OrbitalPath {...mockProps} {...props} />
    </Canvas>
  );
};

describe('OrbitalPath', () => {
  it('renders without crashing', () => {
    const { container } = renderInCanvas();
    expect(container).toBeTruthy();
  });

  it('renders with different view types', () => {
    const { container: realistic } = renderInCanvas({ viewType: "realistic" });
    expect(realistic).toBeTruthy();

    const { container: navigational } = renderInCanvas({ viewType: "navigational" });
    expect(navigational).toBeTruthy();

    const { container: profile } = renderInCanvas({ viewType: "profile" });
    expect(profile).toBeTruthy();
  });

  it('renders with different orbital parameters', () => {
    const { container: eccentric } = renderInCanvas({ eccentricity: 0.5 });
    expect(eccentric).toBeTruthy();

    const { container: inclined } = renderInCanvas({ inclination: 45 });
    expect(inclined).toBeTruthy();

    const { container: fastOrbit } = renderInCanvas({ orbitalPeriod: 180 });
    expect(fastOrbit).toBeTruthy();
  });

  it('renders with different time settings', () => {
    const { container: fastTime } = renderInCanvas({ timeMultiplier: 2 });
    expect(fastTime).toBeTruthy();

    const { container: paused } = renderInCanvas({ isPaused: true });
    expect(paused).toBeTruthy();
  });
}); 