import { describe, it, expect } from 'vitest';
import {
  calculateHabitableZoneInner,
  calculateHabitableZoneOuter,
  calculateSnowLine,
  getLuminosityForSpectralType,
  calculateHabitableZoneAndSnowLine,
  calculateBinarySystemZones
} from '../../utils/stellar-zones';

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
    it('should calculate correct habitable zone for Sun-like star (G2)', () => {
      const result = calculateHabitableZoneAndSnowLine('G2');
      
      // For Solar luminosity (L = 1):
      // Inner edge ≈ 0.855 AU
      // Outer edge ≈ 1.026 AU
      // Snow line ≈ 2.7 AU
      expect(result.habitableZone.inner).toBeCloseTo(0.855, 3);
      expect(result.habitableZone.outer).toBeCloseTo(1.026, 3);
      expect(result.snowLine).toBeCloseTo(2.7, 3);
    });

    it('should calculate correct habitable zone for a bright star (A0)', () => {
      const result = calculateHabitableZoneAndSnowLine('A0');
      
      // For L = 80:
      // Inner edge ≈ 7.644 AU
      // Outer edge ≈ 9.179 AU
      // Snow line ≈ 24.147 AU
      expect(result.habitableZone.inner).toBeCloseTo(7.644, 3);
      expect(result.habitableZone.outer).toBeCloseTo(9.179, 3);
      expect(result.snowLine).toBeCloseTo(24.147, 3);
    });

    it('should calculate correct habitable zone for a dim star (M5)', () => {
      const result = calculateHabitableZoneAndSnowLine('M5');
      
      // For L = 0.01:
      // Inner edge ≈ 0.085 AU
      // Outer edge ≈ 0.103 AU
      // Snow line ≈ 0.27 AU
      expect(result.habitableZone.inner).toBeCloseTo(0.085, 3);
      expect(result.habitableZone.outer).toBeCloseTo(0.103, 3);
      expect(result.snowLine).toBeCloseTo(0.27, 3);
    });
  });

  describe('Binary Star Calculations', () => {
    it('should calculate correct zones for binary system', () => {
      const result = calculateBinarySystemZones('G2', 'K0');
      
      // Combined luminosity = 1.0 + 0.6 = 1.6
      // Inner edge ≈ 1.081 AU
      // Outer edge ≈ 1.298 AU
      // Snow line ≈ 3.413 AU
      expect(result.habitableZone.inner).toBeCloseTo(1.081, 3);
      expect(result.habitableZone.outer).toBeCloseTo(1.298, 3);
      expect(result.snowLine).toBeCloseTo(3.413, 3);
    });

    it('should handle binary system with very different luminosities', () => {
      const result = calculateBinarySystemZones('A0', 'M5');
      
      // Combined luminosity = 80 + 0.01 ≈ 80.01
      // Should be very close to single A0 star results
      expect(result.habitableZone.inner).toBeCloseTo(7.645, 3);
      expect(result.habitableZone.outer).toBeCloseTo(9.180, 3);
      expect(result.snowLine).toBeCloseTo(24.149, 3);
    });
  });
}); 