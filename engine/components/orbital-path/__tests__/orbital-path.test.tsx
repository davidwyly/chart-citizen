import { render, screen } from '@testing-library/react';
import { OrbitalPath } from '@/engine/components/orbital-path';

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

describe('OrbitalPath', () => {
  it('renders without crashing', () => {
    render(<OrbitalPath {...mockProps} />);
    expect(screen.getByTestId('orbital-path')).toBeDefined();
  });

  it('renders with different view types', () => {
    const { rerender } = render(<OrbitalPath {...mockProps} viewType="realistic" />);
    expect(screen.getByTestId('orbital-path')).toBeDefined();

    rerender(<OrbitalPath {...mockProps} viewType="navigational" />);
    expect(screen.getByTestId('orbital-path')).toBeDefined();

    rerender(<OrbitalPath {...mockProps} viewType="profile" />);
    expect(screen.getByTestId('orbital-path')).toBeDefined();
  });

  it('renders with different orbital parameters', () => {
    const { rerender } = render(<OrbitalPath {...mockProps} eccentricity={0.5} />);
    expect(screen.getByTestId('orbital-path')).toBeDefined();

    rerender(<OrbitalPath {...mockProps} inclination={45} />);
    expect(screen.getByTestId('orbital-path')).toBeDefined();

    rerender(<OrbitalPath {...mockProps} orbitalPeriod={180} />);
    expect(screen.getByTestId('orbital-path')).toBeDefined();
  });

  it('renders with different time settings', () => {
    const { rerender } = render(<OrbitalPath {...mockProps} timeMultiplier={2} />);
    expect(screen.getByTestId('orbital-path')).toBeDefined();

    rerender(<OrbitalPath {...mockProps} isPaused={true} />);
    expect(screen.getByTestId('orbital-path')).toBeDefined();
  });
}); 