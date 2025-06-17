import { describe, it, expect } from 'vitest';
import {
  calculateHabitableZoneInner,
  calculateHabitableZoneOuter,
  calculateSnowLine,
  getLuminosityForSpectralType,
  calculateHabitableZoneAndSnowLine,
  calculateBinarySystemZones,
  SPECTRAL_TYPE_LUMINOSITY
} from '../stellar-zones';

describe('Stellar Zones Edge Cases', () => {
  describe('extreme luminosity values', () => {
    it('should handle extremely low luminosity values', () => {
      const veryLowLuminosity = 0.0001; // Ultra-cool dwarf
      
      expect(calculateHabitableZoneInner(veryLowLuminosity)).toBeCloseTo(0.0085, 4);
      expect(calculateHabitableZoneOuter(veryLowLuminosity)).toBeCloseTo(0.0103, 4);
      expect(calculateSnowLine(veryLowLuminosity)).toBeCloseTo(0.027, 3);
    });

    it('should handle extremely high luminosity values', () => {
      const hyperGiantLuminosity = 1000000; // Hypergiant star
      
      expect(calculateHabitableZoneInner(hyperGiantLuminosity)).toBeCloseTo(854.4, 0);
      expect(calculateHabitableZoneOuter(hyperGiantLuminosity)).toBeCloseTo(1026.0, 0);
      expect(calculateSnowLine(hyperGiantLuminosity)).toBeCloseTo(2700, 0);
    });

    it('should handle zero luminosity gracefully', () => {
      expect(calculateHabitableZoneInner(0)).toBe(0);
      expect(calculateHabitableZoneOuter(0)).toBe(0);
      expect(calculateSnowLine(0)).toBe(0);
    });

    it('should handle very small positive luminosity', () => {
      const microLuminosity = 1e-10; // Very small but not MIN_VALUE to avoid floating point precision issues
      
      const innerHZ = calculateHabitableZoneInner(microLuminosity);
      const outerHZ = calculateHabitableZoneOuter(microLuminosity);
      const snowLine = calculateSnowLine(microLuminosity);
      
      expect(innerHZ).toBeGreaterThan(0);
      expect(outerHZ).toBeGreaterThan(0);
      expect(snowLine).toBeGreaterThan(0);
      expect(outerHZ).toBeGreaterThan(innerHZ);
    });
  });

  describe('spectral type edge cases', () => {
    it('should handle spectral types with luminosity class suffixes', () => {
      expect(getLuminosityForSpectralType('G2V')).toBe(1.0);  // Main sequence
      expect(getLuminosityForSpectralType('G2III')).toBe(1.0); // Giant (base G2)
      expect(getLuminosityForSpectralType('G2I')).toBe(1.0);   // Supergiant (base G2)
      expect(getLuminosityForSpectralType('M5V')).toBe(0.01);  // Main sequence red dwarf
    });

    it('should throw meaningful error for completely invalid spectral types', () => {
      expect(() => getLuminosityForSpectralType('')).toThrow('Unknown spectral type: ');
      expect(() => getLuminosityForSpectralType('Z9')).toThrow('Unknown spectral type: Z9');
      expect(() => getLuminosityForSpectralType('123')).toThrow('Unknown spectral type: 123');
      expect(() => getLuminosityForSpectralType('G2.5')).toThrow('Unknown spectral type: G2.5');
    });

    it('should handle unusual but valid spectral type formats', () => {
      expect(() => getLuminosityForSpectralType('G2IV')).not.toThrow();
      expect(() => getLuminosityForSpectralType('A0VI')).not.toThrow(); // Subdwarf
      expect(() => getLuminosityForSpectralType('M8VII')).not.toThrow(); // White dwarf
    });

    it('should be case sensitive for spectral types', () => {
      expect(() => getLuminosityForSpectralType('g2')).toThrow('Unknown spectral type: g2');
      expect(() => getLuminosityForSpectralType('G2v')).toThrow('Unknown spectral type: G2v');
    });
  });

  describe('mathematical edge cases', () => {
    it('should ensure habitable zone outer edge is always beyond inner edge', () => {
      const testLuminosities = [0.001, 0.1, 1.0, 10, 100, 1000];
      
      for (const luminosity of testLuminosities) {
        const inner = calculateHabitableZoneInner(luminosity);
        const outer = calculateHabitableZoneOuter(luminosity);
        
        expect(outer).toBeGreaterThan(inner);
      }
    });

    it('should handle NaN and Infinity inputs gracefully', () => {
      expect(calculateHabitableZoneInner(NaN)).toBeNaN();
      expect(calculateHabitableZoneOuter(NaN)).toBeNaN();
      expect(calculateSnowLine(NaN)).toBeNaN();
      
      expect(calculateHabitableZoneInner(Infinity)).toBe(Infinity);
      expect(calculateHabitableZoneOuter(Infinity)).toBe(Infinity);
      expect(calculateSnowLine(Infinity)).toBe(Infinity);
    });

    it('should handle negative luminosity values', () => {
      // Negative luminosity is physically meaningless but shouldn't crash
      const result = calculateHabitableZoneInner(-1);
      expect(result).toBeNaN();
    });
  });

  describe('binary system edge cases', () => {
    it('should handle binary systems with extreme luminosity differences', () => {
      // Hypergiant + red dwarf
      const zones = calculateBinarySystemZones('O5', 'M8');
      
      expect(zones.habitableZone.inner).toBeCloseTo(270.2, 0);
      expect(zones.habitableZone.outer).toBeCloseTo(324.7, 0);
      expect(zones.snowLine).toBeCloseTo(853.8, 0);
    });

    it('should handle identical binary stars', () => {
      const spectralTypes = ['G2', 'M5', 'A0', 'K0'];
      
      for (const type of spectralTypes) {
        const zones = calculateBinarySystemZones(type, type);
        const singleZones = calculateHabitableZoneAndSnowLine(type);
        
        // Binary system with identical stars should be sqrt(2) times larger
        const scaleFactor = Math.sqrt(2);
        
        expect(zones.habitableZone.inner).toBeCloseTo(singleZones.habitableZone.inner * scaleFactor, 2);
        expect(zones.habitableZone.outer).toBeCloseTo(singleZones.habitableZone.outer * scaleFactor, 2);
        expect(zones.snowLine).toBeCloseTo(singleZones.snowLine * scaleFactor, 2);
      }
    });

    it('should throw error for invalid spectral types in binary systems', () => {
      expect(() => calculateBinarySystemZones('G2', 'INVALID')).toThrow('Unknown spectral type');
      expect(() => calculateBinarySystemZones('INVALID', 'M5')).toThrow('Unknown spectral type');
      expect(() => calculateBinarySystemZones('INVALID1', 'INVALID2')).toThrow('Unknown spectral type');
    });
  });

  describe('physical constants validation', () => {
    it('should use correct habitable zone constants from Kopparapu model', () => {
      // Test that the constants match the Kopparapu model
      const solarLuminosity = 1.0;
      
      // Inner HZ: sqrt(L/1.37) for recent Venus
      expect(calculateHabitableZoneInner(solarLuminosity)).toBeCloseTo(Math.sqrt(1.0 / 1.37), 6);
      
      // Outer HZ: sqrt(L/0.95) for early Mars  
      expect(calculateHabitableZoneOuter(solarLuminosity)).toBeCloseTo(Math.sqrt(1.0 / 0.95), 6);
    });

    it('should use reasonable snow line constant', () => {
      // Snow line should be around 2.7 AU for solar luminosity
      expect(calculateSnowLine(1.0)).toBeCloseTo(2.7, 6);
    });

    it('should have monotonically ordered luminosity values', () => {
      const types = Object.keys(SPECTRAL_TYPE_LUMINOSITY);
      const spectralOrder = ['O5', 'B0', 'B5', 'A0', 'A5', 'F0', 'F8', 'G2', 'K0', 'K5', 'M0', 'M5', 'M8'];
      
      // Check that luminosity decreases with later spectral types
      for (let i = 0; i < spectralOrder.length - 1; i++) {
        const current = SPECTRAL_TYPE_LUMINOSITY[spectralOrder[i]];
        const next = SPECTRAL_TYPE_LUMINOSITY[spectralOrder[i + 1]];
        
        expect(current).toBeGreaterThan(next);
      }
    });
  });

  describe('astronomical realism checks', () => {
    it('should produce reasonable habitable zones for known star types', () => {
      // Sun (G2) should have HZ around 0.85-1.03 AU
      const sunZones = calculateHabitableZoneAndSnowLine('G2');
      expect(sunZones.habitableZone.inner).toBeGreaterThan(0.8);
      expect(sunZones.habitableZone.inner).toBeLessThan(0.9);
      expect(sunZones.habitableZone.outer).toBeGreaterThan(1.0);
      expect(sunZones.habitableZone.outer).toBeLessThan(1.1);
      
      // Red dwarf (M5) should have very close HZ
      const redDwarfZones = calculateHabitableZoneAndSnowLine('M5');
      expect(redDwarfZones.habitableZone.outer).toBeLessThan(0.2);
      
      // Hot star (A0) should have distant HZ
      const hotStarZones = calculateHabitableZoneAndSnowLine('A0');
      expect(hotStarZones.habitableZone.inner).toBeGreaterThan(5);
    });

    it('should have snow line beyond habitable zone for all star types', () => {
      const testTypes = ['M8', 'M5', 'K5', 'G2', 'F0', 'A0', 'B5'];
      
      for (const type of testTypes) {
        const zones = calculateHabitableZoneAndSnowLine(type);
        
        expect(zones.snowLine).toBeGreaterThan(zones.habitableZone.outer);
      }
    });

    it('should scale correctly with luminosity', () => {
      // Higher luminosity should mean larger zones
      const lowLum = calculateHabitableZoneAndSnowLine('M5');   // 0.01 solar
      const midLum = calculateHabitableZoneAndSnowLine('G2');   // 1.0 solar
      const highLum = calculateHabitableZoneAndSnowLine('A0');  // 80 solar
      
      expect(lowLum.habitableZone.inner).toBeLessThan(midLum.habitableZone.inner);
      expect(midLum.habitableZone.inner).toBeLessThan(highLum.habitableZone.inner);
      
      expect(lowLum.snowLine).toBeLessThan(midLum.snowLine);
      expect(midLum.snowLine).toBeLessThan(highLum.snowLine);
    });
  });

  describe('precision and numerical stability', () => {
    it('should maintain precision for repeated calculations', () => {
      const testCases = ['G2', 'M5', 'A0'];
      
      for (const spectralType of testCases) {
        const result1 = calculateHabitableZoneAndSnowLine(spectralType);
        const result2 = calculateHabitableZoneAndSnowLine(spectralType);
        
        expect(result1.habitableZone.inner).toBe(result2.habitableZone.inner);
        expect(result1.habitableZone.outer).toBe(result2.habitableZone.outer);
        expect(result1.snowLine).toBe(result2.snowLine);
      }
    });

    it('should handle very precise luminosity values', () => {
      const preciseLuminosity = 1.23456789;
      
      const inner = calculateHabitableZoneInner(preciseLuminosity);
      const outer = calculateHabitableZoneOuter(preciseLuminosity);
      const snow = calculateSnowLine(preciseLuminosity);
      
      expect(typeof inner).toBe('number');
      expect(typeof outer).toBe('number');
      expect(typeof snow).toBe('number');
      expect(Number.isFinite(inner)).toBe(true);
      expect(Number.isFinite(outer)).toBe(true);
      expect(Number.isFinite(snow)).toBe(true);
    });
  });
});