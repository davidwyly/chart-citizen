import { describe, it, expect } from 'vitest';
import { 
  isOrbitData, 
  isBeltOrbitData, 
  isStar, 
  isPlanet, 
  isMoon, 
  isBelt 
} from '../orbital-system';
import type { OrbitData, BeltOrbitData, CelestialObject } from '../orbital-system';

describe('Orbital System Type Guards Bug Tests', () => {
  describe('isOrbitData type guard bugs', () => {
    it('should handle non-object values gracefully', () => {
      // Functions should handle non-objects gracefully and return false
      expect(() => isOrbitData('not-an-object' as any)).not.toThrow();
      expect(() => isOrbitData(null as any)).not.toThrow();
      expect(() => isOrbitData(undefined as any)).not.toThrow();
      expect(() => isOrbitData(123 as any)).not.toThrow();
      expect(() => isOrbitData(true as any)).not.toThrow();
      
      expect(isOrbitData('not-an-object' as any)).toBe(false);
      expect(isOrbitData(null as any)).toBe(false);
      expect(isOrbitData(undefined as any)).toBe(false);
      expect(isOrbitData(123 as any)).toBe(false);
      expect(isOrbitData(true as any)).toBe(false);
    });

    it('should return false for non-orbit objects', () => {
      // These should return false, not throw
      const nonOrbitObjects = [
        {},
        { some_other_property: 'value' },
        { inner_radius: 1, outer_radius: 2 }, // Belt data, not orbit data
        []
      ];

      for (const obj of nonOrbitObjects) {
        expect(() => isOrbitData(obj as any)).not.toThrow();
        expect(isOrbitData(obj as any)).toBe(false);
      }
    });

    it('should return true for valid orbit data', () => {
      const validOrbitData: OrbitData = {
        parent: 'star1',
        semi_major_axis: 1.0,
        eccentricity: 0.0,
        inclination: 0.0,
        orbital_period: 365.25
      };

      expect(isOrbitData(validOrbitData)).toBe(true);
    });
  });

  describe('isBeltOrbitData type guard bugs', () => {
    it('should handle non-object values gracefully', () => {
      // Functions should handle non-objects gracefully and return false
      expect(() => isBeltOrbitData('not-an-object' as any)).not.toThrow();
      expect(() => isBeltOrbitData(null as any)).not.toThrow();
      expect(() => isBeltOrbitData(undefined as any)).not.toThrow();
      
      expect(isBeltOrbitData('not-an-object' as any)).toBe(false);
      expect(isBeltOrbitData(null as any)).toBe(false);
      expect(isBeltOrbitData(undefined as any)).toBe(false);
    });

    it('should return true for valid belt data', () => {
      const validBeltData: BeltOrbitData = {
        parent: 'star1',
        inner_radius: 2.2,
        outer_radius: 3.2,
        inclination: 0.0,
        eccentricity: 0.0
      };

      expect(isBeltOrbitData(validBeltData)).toBe(true);
    });
  });

  describe('celestial object type guard edge cases', () => {
    it('should handle objects with missing classification', () => {
      const objectWithoutClassification = {
        id: 'test',
        name: 'Test Object',
        // classification missing!
        geometry_type: 'star',
        properties: { mass: 1.0, radius: 695700, temperature: 5778 }
      } as any;

      // These should not crash
      expect(() => isStar(objectWithoutClassification)).not.toThrow();
      expect(() => isPlanet(objectWithoutClassification)).not.toThrow();
      expect(() => isMoon(objectWithoutClassification)).not.toThrow();
      expect(() => isBelt(objectWithoutClassification)).not.toThrow();

      // All should return false
      expect(isStar(objectWithoutClassification)).toBe(false);
      expect(isPlanet(objectWithoutClassification)).toBe(false);
      expect(isMoon(objectWithoutClassification)).toBe(false);
      expect(isBelt(objectWithoutClassification)).toBe(false);
    });

    it('should handle null and undefined celestial objects', () => {
      expect(() => isStar(null as any)).not.toThrow();
      expect(() => isPlanet(undefined as any)).not.toThrow();
      expect(() => isMoon(null as any)).not.toThrow();
      expect(() => isBelt(undefined as any)).not.toThrow();

      expect(isStar(null as any)).toBe(false);
      expect(isPlanet(undefined as any)).toBe(false);
      expect(isMoon(null as any)).toBe(false);
      expect(isBelt(undefined as any)).toBe(false);
    });

    it('should handle objects with wrong type for classification', () => {
      const objectWithNumericClassification = {
        id: 'test',
        name: 'Test',
        classification: 123, // Should be string!
        geometry_type: 'star'
      } as any;

      expect(isStar(objectWithNumericClassification)).toBe(false);
      expect(isPlanet(objectWithNumericClassification)).toBe(false);
    });
  });

  describe('edge cases in object structure', () => {
    it('should handle objects that look like celestial objects but are not', () => {
      const fakeObjects = [
        { classification: 'star' }, // Missing other required fields
        { id: 'test', classification: 'planet' }, // Missing name, geometry_type
        { classification: 'star', id: null }, // Invalid id type
        { classification: 'planet', name: 123 }, // Invalid name type
      ];

      for (const fakeObj of fakeObjects) {
        expect(() => isStar(fakeObj as any)).not.toThrow();
        expect(() => isPlanet(fakeObj as any)).not.toThrow();
        
        // These should return true based on classification alone
        // But this might indicate a design issue - should we validate the full object?
        if (fakeObj.classification === 'star') {
          expect(isStar(fakeObj as any)).toBe(true); // This might be wrong behavior
        }
        if (fakeObj.classification === 'planet') {
          expect(isPlanet(fakeObj as any)).toBe(true); // This might be wrong behavior
        }
      }
    });
  });

  describe('orbit data mixed types', () => {
    it('should handle objects that have both orbit and belt properties', () => {
      const mixedOrbitData = {
        parent: 'star1',
        semi_major_axis: 1.0, // Orbit property
        inner_radius: 2.0,    // Belt property
        outer_radius: 3.0,    // Belt property
        eccentricity: 0.0,
        inclination: 0.0,
        orbital_period: 365.25
      };

      // What should happen when object has both types of properties?
      expect(isOrbitData(mixedOrbitData)).toBe(true); // Has semi_major_axis
      expect(isBeltOrbitData(mixedOrbitData)).toBe(true); // Has inner_radius
      
      // This ambiguity could cause bugs in consuming code!
    });

    it('should handle objects with partial orbit data', () => {
      const partialOrbitData = {
        parent: 'star1',
        semi_major_axis: 1.0
        // Missing other required orbit properties
      };

      expect(isOrbitData(partialOrbitData)).toBe(true);
      // But using this as OrbitData would cause runtime errors due to missing properties!
    });
  });

  describe('property access edge cases', () => {
    it('should handle objects where properties are not objects', () => {
      const invalidPropertiesObject: CelestialObject = {
        id: 'test',
        name: 'Test',
        classification: 'star',
        geometry_type: 'star',
        properties: 'not-an-object' as any // Should be object!
      };

      expect(() => isStar(invalidPropertiesObject)).not.toThrow();
      expect(isStar(invalidPropertiesObject)).toBe(true);
      
      // But accessing properties.mass would fail at runtime
    });

    it('should handle circular references in objects', () => {
      const circularObj: any = {
        id: 'test',
        name: 'Test',
        classification: 'star',
        geometry_type: 'star'
      };
      circularObj.self = circularObj; // Circular reference

      expect(() => isStar(circularObj)).not.toThrow();
      expect(isStar(circularObj)).toBe(true);
    });
  });
});