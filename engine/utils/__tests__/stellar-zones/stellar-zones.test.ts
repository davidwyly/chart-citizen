import { describe, it, expect } from 'vitest';
import {
  calculateHabitableZoneInner,
  calculateHabitableZoneOuter,
  calculateSnowLine,
  getLuminosityForSpectralType,
  calculateHabitableZoneAndSnowLine,
  calculateBinarySystemZones
} from '../../stellar-zones';

describe('Stellar Zones Calculations', () => {
  describe('Luminosity Lookup', () => {
    it('should return correct luminosity for known spectral types', () => {
      expect(getLuminosityForSpectralType('G2')).toBe(1.0); // Sun
      expect(getLuminosityForSpectralType('O5')).toBe(100000);
      expect(getLuminosityForSpectralType('M8')).toBe(0.001);
    });

    it('should throw error for unknown spectral type', () => {
      expect(() => getLuminosityForSpectralType('X0')).toThrow('Unknown spectral type: X0');
    });
  });

  describe('Habitable Zone Calculations', () => {
    it('should calculate inner habitable zone correctly', () => {
      expect(calculateHabitableZoneInner(1.0)).toBeCloseTo(0.855, 2); // Sun-like star - relaxed precision for astronomical calculations
      expect(calculateHabitableZoneInner(0.1)).toBeCloseTo(0.270, 2); // Red dwarf
      expect(calculateHabitableZoneInner(10)).toBeCloseTo(2.703, 2); // Bright star
    });

    it('should calculate outer habitable zone correctly', () => {
      expect(calculateHabitableZoneOuter(1.0)).toBeCloseTo(1.026, 2); // Sun-like star
      expect(calculateHabitableZoneOuter(0.1)).toBeCloseTo(0.324, 2); // Red dwarf
      expect(calculateHabitableZoneOuter(10)).toBeCloseTo(3.244, 2); // Bright star
    });

    it('should calculate snow line correctly', () => {
      expect(calculateSnowLine(1.0)).toBeCloseTo(2.7, 2); // Sun-like star
      expect(calculateSnowLine(0.1)).toBeCloseTo(0.854, 2); // Red dwarf
      expect(calculateSnowLine(10)).toBeCloseTo(8.536, 2); // Bright star - relaxed precision
    });

    it('should calculate combined zones correctly', () => {
      const zones = calculateHabitableZoneAndSnowLine('G2');
      expect(zones.habitableZone.inner).toBeCloseTo(0.855, 2); // Relaxed precision for astronomical accuracy
      expect(zones.habitableZone.outer).toBeCloseTo(1.026, 2);
      expect(zones.snowLine).toBeCloseTo(2.7, 2);
    });
  });

  describe('Binary System Calculations', () => {
    it('should calculate binary system zones correctly', () => {
      const zones = calculateBinarySystemZones('G2', 'K0');
      expect(zones.habitableZone.inner).toBeCloseTo(1.081, 2);
      expect(zones.habitableZone.outer).toBeCloseTo(1.298, 2);
      expect(zones.snowLine).toBeCloseTo(3.413, 2); // Relaxed precision
    });

    it('should handle equal luminosity binary stars', () => {
      const zones = calculateBinarySystemZones('G2', 'G2');
      expect(zones.habitableZone.inner).toBeCloseTo(1.209, 2); // Relaxed precision
      expect(zones.habitableZone.outer).toBeCloseTo(1.451, 2);
      expect(zones.snowLine).toBeCloseTo(3.818, 2);
    });

    it('should handle very unequal binary stars', () => {
      const zones = calculateBinarySystemZones('A0', 'M5');
      expect(zones.habitableZone.inner).toBeCloseTo(7.645, 2); // Relaxed precision for large values
      expect(zones.habitableZone.outer).toBeCloseTo(9.180, 2);
      expect(zones.snowLine).toBeCloseTo(24.149, 2);
    });
  });
}); 