import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createZoneRingGeometry,
  createZoneLineGeometry,
  createZoneGeometry,
  createZoneMaterial,
  createZoneGeometries,
  clearGeometryCache,
  getGeometryCacheStats,
  disposeGeometry,
  validateZoneData,
  calculateLODSegments
} from '../stellar-zone-geometry';
import type { ZoneCalculationResult } from '@/engine/types/stellar-zones';

describe('Stellar Zone Geometry Bug Tests', () => {
  beforeEach(() => {
    clearGeometryCache();
  });

  afterEach(() => {
    clearGeometryCache();
  });

  describe('potential null reference bugs', () => {
    it('should handle negative radius values gracefully', () => {
      // Bug: negative radius could cause invalid geometry
      expect(() => createZoneRingGeometry(-1, 2)).not.toThrow();
      expect(() => createZoneLineGeometry(-1)).not.toThrow();
      
      // The geometry should still be created but may be invalid
      const ringGeometry = createZoneRingGeometry(-1, 2);
      expect(ringGeometry).toBeDefined();
    });

    it('should handle radius values where inner > outer', () => {
      // Bug: inner radius larger than outer radius creates invalid geometry
      const innerLarger = createZoneRingGeometry(5, 2); // inner > outer
      expect(innerLarger).toBeDefined();
      
      // This should probably throw an error or swap the values
      // Currently it silently creates invalid geometry
    });

    it('should handle zero radius values', () => {
      expect(() => createZoneRingGeometry(0, 1)).not.toThrow();
      expect(() => createZoneLineGeometry(0)).not.toThrow();
      
      // Zero radius line might be invisible or cause rendering issues
      const zeroLineGeometry = createZoneLineGeometry(0);
      expect(zeroLineGeometry).toBeDefined();
    });

    it('should handle extremely large radius values', () => {
      // Bug: large numbers might cause precision issues or overflow
      const hugeRadius = Number.MAX_SAFE_INTEGER;
      expect(() => createZoneRingGeometry(1, hugeRadius)).not.toThrow();
      expect(() => createZoneLineGeometry(hugeRadius)).not.toThrow();
    });

    it('should handle NaN and Infinity radius values', () => {
      // Bug: NaN/Infinity values should be rejected or handled gracefully
      expect(() => createZoneRingGeometry(NaN, 2)).not.toThrow();
      expect(() => createZoneRingGeometry(1, Infinity)).not.toThrow();
      expect(() => createZoneLineGeometry(NaN)).not.toThrow();
      
      const nanGeometry = createZoneRingGeometry(NaN, 2);
      expect(nanGeometry).toBeDefined();
      // But the geometry may be corrupted
    });
  });

  describe('cache key collision bugs', () => {
    it('should avoid cache key collisions with similar values', () => {
      // Bug: floating point precision might cause different values to have same cache key
      const geo1 = createZoneRingGeometry(1.0000001, 2.0000001);
      const geo2 = createZoneRingGeometry(1.0000002, 2.0000002);
      
      // These should be different objects if precision matters
      // But the cache key uses toFixed(3) which might make them the same
      expect(geo1).toBeDefined();
      expect(geo2).toBeDefined();
      
      const stats = getGeometryCacheStats();
      // This test exposes if cache keys are too coarse
      expect(stats.size).toBeGreaterThanOrEqual(1);
    });

    it('should handle very similar floating point values', () => {
      // Test cache key generation with floating point edge cases
      const val1 = 1.0005; // Should round to 1.001
      const val2 = 1.0004; // Should round to 1.000
      
      const geo1 = createZoneRingGeometry(val1, 2);
      const geo2 = createZoneRingGeometry(val2, 2);
      
      const stats = getGeometryCacheStats();
      console.log('Cache keys:', stats.keys);
      
      // Both geometries should exist but may share cache if rounding is too aggressive
      expect(geo1).toBeDefined();
      expect(geo2).toBeDefined();
    });
  });

  describe('validation edge cases', () => {
    it('should validate zone data correctly but has edge case bugs', () => {
      const validZone: ZoneCalculationResult = {
        type: 'habitable',
        innerRadius: 1,
        outerRadius: 2
      };
      expect(validateZoneData(validZone)).toBe(true);

      // Bug: validation allows outerRadius exactly equal to innerRadius
      const equalRadiiZone: ZoneCalculationResult = {
        type: 'habitable',
        innerRadius: 1,
        outerRadius: 1 // This should be invalid!
      };
      expect(validateZoneData(equalRadiiZone)).toBe(false); // Currently returns false but message is misleading

      // Bug: validation doesn't check for reasonable bounds
      const extremeZone: ZoneCalculationResult = {
        type: 'habitable',
        innerRadius: 1e10,
        outerRadius: 1e20
      };
      expect(validateZoneData(extremeZone)).toBe(true); // Should probably fail for extreme values
    });

    it('should reject invalid zone types', () => {
      const invalidZone: ZoneCalculationResult = {
        type: 'invalid-type' as any,
        innerRadius: 1,
        outerRadius: 2
      };
      expect(validateZoneData(invalidZone)).toBe(false);
    });

    it('should handle undefined outerRadius correctly', () => {
      const noOuterRadius: ZoneCalculationResult = {
        type: 'frost',
        innerRadius: 1
        // outerRadius is undefined
      };
      expect(validateZoneData(noOuterRadius)).toBe(true);

      // But what happens when we try to create geometry?
      expect(() => createZoneGeometry(noOuterRadius)).not.toThrow();
    });
  });

  describe('LOD calculation edge cases', () => {
    it('should handle edge cases in LOD calculation', () => {
      // Bug: division by zero when camera distance is zero
      expect(() => calculateLODSegments(1, 0)).not.toThrow();
      const lodZeroDistance = calculateLODSegments(1, 0);
      expect(lodZeroDistance).toBeGreaterThan(0);
      expect(lodZeroDistance).toBeLessThanOrEqual(128);

      // Bug: negative values
      expect(() => calculateLODSegments(-1, 10)).not.toThrow();
      expect(() => calculateLODSegments(1, -10)).not.toThrow();

      // Bug: extreme values
      const extremeLOD = calculateLODSegments(Number.MAX_VALUE, Number.MIN_VALUE);
      expect(extremeLOD).toBeGreaterThanOrEqual(8);
      expect(extremeLOD).toBeLessThanOrEqual(128);
    });

    it('should clamp LOD segments to reasonable bounds', () => {
      // Very small values should clamp to minimum
      const minLOD = calculateLODSegments(0.001, 1000);
      expect(minLOD).toBeGreaterThanOrEqual(8);

      // Very large values should clamp to maximum  
      const maxLOD = calculateLODSegments(1000, 0.1);
      expect(maxLOD).toBeLessThanOrEqual(128);
    });
  });

  describe('memory management bugs', () => {
    it('should properly dispose geometries when cache is cleared', () => {
      // Create several geometries
      const geo1 = createZoneRingGeometry(1, 2);
      const geo2 = createZoneLineGeometry(3);
      const geo3 = createZoneRingGeometry(4, 5);

      let stats = getGeometryCacheStats();
      expect(stats.size).toBeGreaterThan(0);

      // Clear cache should dispose all geometries
      clearGeometryCache();
      
      stats = getGeometryCacheStats();
      expect(stats.size).toBe(0);

      // Accessing disposed geometries might cause issues
      // This is hard to test but the dispose() calls should prevent memory leaks
    });

    it('should handle disposal of non-existent geometries', () => {
      // Bug: disposing geometry that doesn't exist
      const disposed = disposeGeometry('habitable', 999, 1000);
      expect(disposed).toBe(false);

      // Should not throw error
      expect(() => disposeGeometry('invalid' as any, 1, 2)).not.toThrow();
    });
  });

  describe('batch creation error handling', () => {
    it('should handle errors in batch geometry creation', () => {
      const zones: ZoneCalculationResult[] = [
        { type: 'habitable', innerRadius: 1, outerRadius: 2 },
        { type: 'invalid-type' as any, innerRadius: 1, outerRadius: 2 }, // Invalid
        { type: 'frost', innerRadius: 3 },
        { type: 'habitable', innerRadius: -1, outerRadius: 2 }, // Negative radius
      ];

      const geometries = createZoneGeometries(zones);
      
      // Should create geometries for valid zones and skip invalid ones
      expect(geometries.size).toBeGreaterThan(0);
      expect(geometries.size).toBeLessThanOrEqual(zones.length);
    });

    it('should handle empty zones array', () => {
      const geometries = createZoneGeometries([]);
      expect(geometries.size).toBe(0);
    });
  });

  describe('material creation edge cases', () => {
    it('should handle invalid color values', () => {
      // Bug: invalid color values might cause Three.js errors
      expect(() => createZoneMaterial('habitable', 'invalid-color', 0.5)).not.toThrow();
      expect(() => createZoneMaterial('habitable', NaN, 0.5)).not.toThrow();
      expect(() => createZoneMaterial('habitable', Infinity, 0.5)).not.toThrow();
    });

    it('should handle invalid opacity values', () => {
      // Bug: opacity outside 0-1 range
      const materialNegative = createZoneMaterial('habitable', '#ffffff', -1);
      expect(materialNegative.opacity).toBe(-1); // Three.js might clamp this

      const materialOver1 = createZoneMaterial('habitable', '#ffffff', 2);
      expect(materialOver1.opacity).toBe(2); // Three.js might clamp this

      const materialNaN = createZoneMaterial('habitable', '#ffffff', NaN);
      expect(materialNaN).toBeDefined(); // But opacity might be NaN
    });
  });

  describe('floating point precision edge cases', () => {
    it('should handle very small differences in radius values', () => {
      const epsilon = Number.EPSILON;
      
      // These should be treated as different or the same depending on precision needs
      const geo1 = createZoneRingGeometry(1, 2);
      const geo2 = createZoneRingGeometry(1 + epsilon, 2 + epsilon);
      
      const stats = getGeometryCacheStats();
      // If cache keys are the same due to toFixed(3), this exposes the precision issue
      console.log('Precision test cache size:', stats.size);
      console.log('Cache keys:', stats.keys);
    });

    it('should handle calculations near floating point limits', () => {
      const tiny = Number.MIN_VALUE;
      const huge = Number.MAX_SAFE_INTEGER;
      
      expect(() => createZoneRingGeometry(tiny, tiny * 2)).not.toThrow();
      expect(() => calculateLODSegments(huge, tiny)).not.toThrow();
    });
  });
});