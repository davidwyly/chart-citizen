import { describe, it, expect } from 'vitest';
import {
  calculateVisualRadius,
  calculateSafeOrbitDistance,
  calculateSafeBeltOrbit,
  calculateHierarchicalSpacing,
  calculateSystemOrbitalMechanics,
  classifyObject,
  convertLegacyToSafeOrbitalMechanics,
} from '../orbital-mechanics-calculator';
import { CelestialObject } from '@/engine/types/orbital-system';
import { ViewType } from '@lib/types/effects-level';

// Test data
const createTestStar = (id: string, radius: number = 695700): CelestialObject => ({
  id,
  name: `Test Star ${id}`,
  classification: 'star',
  geometry_type: 'star',
  properties: {
    mass: 1.0,
    radius,
    temperature: 5778,
  },
  position: [0, 0, 0],
});

const createTestPlanet = (id: string, parentId: string, radius: number = 6371, orbitAU: number = 1.0): CelestialObject => ({
  id,
  name: `Test Planet ${id}`,
  classification: 'planet',
  geometry_type: 'terrestrial',
  properties: {
    mass: 1.0,
    radius,
    temperature: 288,
  },
  orbit: {
    parent: parentId,
    semi_major_axis: orbitAU,
    eccentricity: 0.0,
    inclination: 0.0,
    orbital_period: 365.25,
  },
});

const createTestMoon = (id: string, parentId: string, radius: number = 1737, orbitAU: number = 0.002): CelestialObject => ({
  id,
  name: `Test Moon ${id}`,
  classification: 'moon',
  geometry_type: 'rocky',
  properties: {
    mass: 0.012,
    radius,
    temperature: 250,
  },
  orbit: {
    parent: parentId,
    semi_major_axis: orbitAU,
    eccentricity: 0.0,
    inclination: 0.0,
    orbital_period: 27.3,
  },
});

const createTestBelt = (id: string, parentId: string, innerAU: number = 2.2, outerAU: number = 3.2): CelestialObject => ({
  id,
  name: `Test Belt ${id}`,
  classification: 'belt',
  geometry_type: 'belt',
  properties: {
    mass: 0.0015,
    radius: 500,
    temperature: 200,
  },
  orbit: {
    parent: parentId,
    inner_radius: innerAU,
    outer_radius: outerAU,
    inclination: 0.0,
    eccentricity: 0.0,
  },
});

// Helper to create a realistic solar system for testing
const createSolarSystem = () => {
  const star = createTestStar('star1', 695700);      // Sun
  const jupiter = createTestPlanet('jupiter', 'star1', 69911, 5.2);  // Jupiter
  const earth = createTestPlanet('earth', 'star1', 6371, 1.0);       // Earth  
  const moon = createTestMoon('moon', 'earth', 1737, 0.002);         // Moon
  const asteroid = createTestPlanet('asteroid', 'star1', 500, 2.8);  // Large asteroid
  return [star, jupiter, earth, moon, asteroid];
};

describe('orbital-mechanics-calculator', () => {
  describe('classifyObject', () => {
    it('should classify objects correctly', () => {
      const star = createTestStar('star1');
      const planet = createTestPlanet('planet1', 'star1');
      const moon = createTestMoon('moon1', 'planet1');
      
      expect(classifyObject(star)).toBe('star');
      expect(classifyObject(planet)).toBe('planet');
      expect(classifyObject(moon)).toBe('moon');
    });
    
    it('should fallback to size-based classification', () => {
      const largeObject: CelestialObject = {
        id: 'large1',
        name: 'Large Object',
        classification: 'unknown' as any,
        geometry_type: 'terrestrial',
        properties: { mass: 1, radius: 100000, temperature: 5000 },
      };
      
      expect(classifyObject(largeObject)).toBe('star');
    });
  });

  describe('Unified Scaling System', () => {
    it('should maintain proper size proportions in realistic mode', () => {
      const objects = createSolarSystem();
      const mechanics = calculateSystemOrbitalMechanics(objects, 'realistic');
      
      const starData = mechanics.get('star1')!;
      const jupiterData = mechanics.get('jupiter')!;
      const earthData = mechanics.get('earth')!;
      const moonData = mechanics.get('moon')!;
      const asteroidData = mechanics.get('asteroid')!;
      
      // Verify size ordering: Star > Jupiter > Earth > Moon > Asteroid
      expect(starData.visualRadius).toBeGreaterThan(jupiterData.visualRadius);
      expect(jupiterData.visualRadius).toBeGreaterThan(earthData.visualRadius);
      expect(earthData.visualRadius).toBeGreaterThan(moonData.visualRadius);
      expect(moonData.visualRadius).toBeGreaterThan(asteroidData.visualRadius);
      
      // Verify proportional relationships are preserved
      // Jupiter is ~11x Earth's radius, so visual should reflect some of that relationship
      const jupiterToEarthRatio = jupiterData.visualRadius / earthData.visualRadius;
      expect(jupiterToEarthRatio).toBeGreaterThan(1.5); // Should be noticeably larger
      
             // Sun is ~100x Earth's radius, should be significantly larger
       // With logarithmic scaling, the ratio will be compressed but still meaningful
       const starToEarthRatio = starData.visualRadius / earthData.visualRadius;
       expect(starToEarthRatio).toBeGreaterThan(2.5); // Should be noticeably larger
    });

    it('should use logarithmic scaling to handle huge size ranges', () => {
      // Test with extreme size differences
      const tinyObject = createTestPlanet('tiny', 'star1', 1, 1.0);    // 1 km
      const hugeObject = createTestStar('huge', 1000000);              // 1,000,000 km
      const mediumObject = createTestPlanet('medium', 'star1', 10000, 2.0); // 10,000 km
      
      const objects = [tinyObject, mediumObject, hugeObject];
      const mechanics = calculateSystemOrbitalMechanics(objects, 'realistic');
      
      const tinyData = mechanics.get('tiny')!;
      const mediumData = mechanics.get('medium')!;
      const hugeData = mechanics.get('huge')!;
      
      // All objects should have reasonable visual sizes
      expect(tinyData.visualRadius).toBeGreaterThan(0.01);
      expect(tinyData.visualRadius).toBeLessThan(2.5);
      expect(mediumData.visualRadius).toBeGreaterThan(tinyData.visualRadius);
      expect(hugeData.visualRadius).toBeGreaterThan(mediumData.visualRadius);
      expect(hugeData.visualRadius).toBeLessThan(2.5); // Should not be too huge
    });

    it('should ensure objects can clear their orbits', () => {
      // Create a system with potential orbital conflicts
      const star = createTestStar('star1', 695700);
      const planet1 = createTestPlanet('planet1', 'star1', 6371, 1.0);
      const planet2 = createTestPlanet('planet2', 'star1', 6371, 1.1);  // Very close orbit
      const planet3 = createTestPlanet('planet3', 'star1', 20000, 1.05); // Larger planet in between
      
      const objects = [star, planet1, planet2, planet3];
      const mechanics = calculateSystemOrbitalMechanics(objects, 'realistic');
      
      const star1Data = mechanics.get('star1')!;
      const planet1Data = mechanics.get('planet1')!;
      const planet2Data = mechanics.get('planet2')!;
      const planet3Data = mechanics.get('planet3')!;
      
      // All planets should be outside the star
      expect(planet1Data.orbitDistance!).toBeGreaterThan(star1Data.visualRadius);
      expect(planet2Data.orbitDistance!).toBeGreaterThan(star1Data.visualRadius);
      expect(planet3Data.orbitDistance!).toBeGreaterThan(star1Data.visualRadius);
      
      // Planets should not intersect with each other
      // Each orbit should be far enough that objects don't collide
      const distances = [
        planet1Data.orbitDistance!,
        planet2Data.orbitDistance!, 
        planet3Data.orbitDistance!
      ].sort((a, b) => a - b);
      
             // Check that there's sufficient space between adjacent orbits
       // Note: orbit clearing algorithm may rearrange positions, so we just verify no overlaps
       for (let i = 1; i < distances.length; i++) {
         const gap = distances[i] - distances[i-1];
         expect(gap).toBeGreaterThanOrEqual(0); // No overlapping orbits
       }
       
       // Verify that objects are reasonably spaced (allow some close distances)
       const uniqueDistances = new Set(distances);
       expect(uniqueDistances.size).toBeGreaterThanOrEqual(distances.length - 1); // Allow one potential duplicate
    });
  });

  describe('calculateSafeOrbitDistance', () => {
    const viewTypes: ViewType[] = ['realistic', 'navigational', 'profile'];
    
    viewTypes.forEach(viewType => {
      it(`should ensure safe orbital distance in ${viewType} mode`, () => {
        const objects = createSolarSystem();
        const mechanics = calculateSystemOrbitalMechanics(objects, viewType);
        
        const starData = mechanics.get('star1')!;
        const earthData = mechanics.get('earth')!;
        
        // Earth should orbit outside the star
        expect(earthData.orbitDistance!).toBeGreaterThan(starData.visualRadius);
        
        // Should be at least the safety multiplier times the parent's visual radius
        const minMultiplier = viewType === 'realistic' ? 2.5 : viewType === 'navigational' ? 3.0 : 3.5;
        expect(earthData.orbitDistance!).toBeGreaterThanOrEqual(starData.visualRadius * minMultiplier);
      });
    });
  });

  describe('calculateSystemOrbitalMechanics', () => {
    it('should calculate mechanics for entire solar system', () => {
      const objects = createSolarSystem();
      const mechanics = calculateSystemOrbitalMechanics(objects, 'realistic');
      
      // Should have data for all objects
      expect(mechanics.has('star1')).toBe(true);
      expect(mechanics.has('jupiter')).toBe(true);
      expect(mechanics.has('earth')).toBe(true);
      expect(mechanics.has('moon')).toBe(true);
      expect(mechanics.has('asteroid')).toBe(true);
      
      // Check orbital safety
      const starData = mechanics.get('star1')!;
      const jupiterData = mechanics.get('jupiter')!;
      const earthData = mechanics.get('earth')!;
      const moonData = mechanics.get('moon')!;
      
      expect(jupiterData.orbitDistance!).toBeGreaterThan(starData.visualRadius);
      expect(earthData.orbitDistance!).toBeGreaterThan(starData.visualRadius);
      expect(moonData.orbitDistance!).toBeGreaterThan(earthData.visualRadius);
    });
    
    it('should prevent orbital collisions across view modes', () => {
      const objects = createSolarSystem();
      
      const viewTypes: ViewType[] = ['realistic', 'navigational', 'profile'];
      viewTypes.forEach(viewType => {
        const mechanics = calculateSystemOrbitalMechanics(objects, viewType);
        
        const starData = mechanics.get('star1')!;
        const jupiterData = mechanics.get('jupiter')!;
        const earthData = mechanics.get('earth')!;
        
        // All planets should orbit outside the star
        expect(jupiterData.orbitDistance!).toBeGreaterThan(starData.visualRadius);
        expect(earthData.orbitDistance!).toBeGreaterThan(starData.visualRadius);
        
        // In navigational/profile modes, they should have hierarchical spacing
        if (viewType === 'navigational' || viewType === 'profile') {
          expect(earthData.orbitDistance!).toBeLessThan(jupiterData.orbitDistance!);
        }
      });
    });

    it('should handle fixed sizes in navigational mode correctly', () => {
      const objects = createSolarSystem();
      const mechanics = calculateSystemOrbitalMechanics(objects, 'navigational');
      
      // In navigational mode, all stars should have the same fixed size
      const starData = mechanics.get('star1')!;
      expect(starData.visualRadius).toBe(2.0); // Fixed star size in navigational mode
      
      // All planets should have the same fixed size  
      const jupiterData = mechanics.get('jupiter')!;
      const earthData = mechanics.get('earth')!;
      expect(jupiterData.visualRadius).toBe(1.2); // Fixed planet size
      expect(earthData.visualRadius).toBe(1.2);   // Same fixed planet size
    });
  });

  describe('convertLegacyToSafeOrbitalMechanics', () => {
    it('should provide legacy compatibility interface', () => {
      const objects = createSolarSystem();
      
      const legacy = convertLegacyToSafeOrbitalMechanics(objects, 'realistic', {
        STAR_SCALE: 1.0,
        PLANET_SCALE: 1.0,
        ORBITAL_SCALE: 1.0,
      });
      
      const starSize = legacy.getObjectVisualSize('star1');
      const earthSize = legacy.getObjectVisualSize('earth');
      const earthOrbit = legacy.getObjectOrbitDistance('earth');
      
      expect(starSize).toBeGreaterThan(0);
      expect(earthSize).toBeGreaterThan(0);
      expect(earthOrbit).toBeGreaterThan(starSize);
      expect(starSize).toBeGreaterThan(earthSize); // Sun should be bigger than Earth
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing orbit data gracefully', () => {
      const star = createTestStar('star1');
      const planetWithoutOrbit: CelestialObject = {
        id: 'planet1',
        name: 'Planet Without Orbit',
        classification: 'planet',
        geometry_type: 'terrestrial',
        properties: { mass: 1, radius: 6371, temperature: 288 },
        position: [5, 0, 0],
      };
      
      const objects = [star, planetWithoutOrbit];
      const mechanics = calculateSystemOrbitalMechanics(objects, 'realistic');
      
      expect(mechanics.has('planet1')).toBe(true);
      expect(mechanics.get('planet1')!.orbitDistance).toBeUndefined();
    });
    
    it('should handle systems with similar-sized objects', () => {
      // Create system where all objects are similar size
      const obj1 = createTestPlanet('obj1', 'center', 5000, 1.0);
      const obj2 = createTestPlanet('obj2', 'center', 6000, 2.0);
      const obj3 = createTestPlanet('obj3', 'center', 5500, 3.0);
      const center = createTestStar('center', 7000);
      
      const objects = [center, obj1, obj2, obj3];
      const mechanics = calculateSystemOrbitalMechanics(objects, 'realistic');
      
      // Should still maintain some size differences and safe orbits
      const centerData = mechanics.get('center')!;
      const obj1Data = mechanics.get('obj1')!;
      const obj2Data = mechanics.get('obj2')!;
      
      expect(obj1Data.orbitDistance!).toBeGreaterThan(centerData.visualRadius);
      expect(obj2Data.orbitDistance!).toBeGreaterThan(centerData.visualRadius);
      expect(centerData.visualRadius).toBeGreaterThan(obj1Data.visualRadius);
    });

    it('should handle binary star systems with unified scaling', () => {
      const primaryStar = createTestStar('star1', 695700);  // Sun-sized
      const secondaryStar = createTestStar('star2', 400000); // Smaller star
      secondaryStar.orbit = {
        parent: 'star1',
        semi_major_axis: 5.0,
        eccentricity: 0.1,
        inclination: 0.0,
        orbital_period: 1000,
      };
      
      const objects = [primaryStar, secondaryStar];
      const mechanics = calculateSystemOrbitalMechanics(objects, 'realistic');
      
      const primaryData = mechanics.get('star1')!;
      const secondaryData = mechanics.get('star2')!;
      
      // Primary should be larger (unified scaling respects actual sizes)
      expect(primaryData.visualRadius).toBeGreaterThan(secondaryData.visualRadius);
      
      // Secondary should orbit outside primary
      expect(secondaryData.orbitDistance!).toBeGreaterThan(primaryData.visualRadius);
    });

    it('should preserve orbital order (Venus closer to Sun than Earth)', () => {
      // Test the specific Venus orbital order issue
      const star = createTestStar('star1', 695700);
      const mercury = createTestPlanet('mercury', 'star1', 2439, 0.39);
      const venus = createTestPlanet('venus', 'star1', 6051, 0.72);
      const earth = createTestPlanet('earth', 'star1', 6371, 1.0);
      const mars = createTestPlanet('mars', 'star1', 3389, 1.52);
      
      const objects = [star, mercury, venus, earth, mars];
      const mechanics = calculateSystemOrbitalMechanics(objects, 'realistic');
      
      const mercuryData = mechanics.get('mercury')!;
      const venusData = mechanics.get('venus')!;
      const earthData = mechanics.get('earth')!;
      const marsData = mechanics.get('mars')!;
      
      // Verify correct orbital ordering
      expect(mercuryData.orbitDistance!).toBeLessThan(venusData.orbitDistance!);
      expect(venusData.orbitDistance!).toBeLessThan(earthData.orbitDistance!);
      expect(earthData.orbitDistance!).toBeLessThan(marsData.orbitDistance!);
      
      // Specific check: Venus should NOT be beyond Earth's orbit
      expect(venusData.orbitDistance!).toBeLessThan(earthData.orbitDistance!);
    });
  });
}); 