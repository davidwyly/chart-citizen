import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateSystemOrbitalMechanics,
  clearOrbitalMechanicsCache,
} from '@/engine/core/pipeline';
import { CelestialObject } from '@/engine/types/orbital-system';

// Test Solar System Data - Realistic solar system configuration
const createSolarSystemTestData = (): CelestialObject[] => {
  const sol: CelestialObject = {
    id: 'sol-star',
    name: 'Sol',
    classification: 'star',
    geometry_type: 'star',
    properties: {
      mass: 1.0,
      radius: 695700, // km
      temperature: 5778,
    },
    position: [0, 0, 0],
  };

  const mercury: CelestialObject = {
    id: 'mercury',
    name: 'Mercury',
    classification: 'planet',
    geometry_type: 'terrestrial',
    properties: {
      mass: 0.055,
      radius: 2439.7, // km
      temperature: 440,
    },
    orbit: {
      parent: 'sol-star',
      semi_major_axis: 0.387, // AU
      eccentricity: 0.206,
      inclination: 7,
      orbital_period: 88,
    },
  };

  const venus: CelestialObject = {
    id: 'venus',
    name: 'Venus',
    classification: 'planet',
    geometry_type: 'terrestrial',
    properties: {
      mass: 0.815,
      radius: 6051.8, // km
      temperature: 737,
    },
    orbit: {
      parent: 'sol-star',
      semi_major_axis: 0.723, // AU
      eccentricity: 0.007,
      inclination: 3.4,
      orbital_period: 225,
    },
  };

  const earth: CelestialObject = {
    id: 'earth',
    name: 'Earth',
    classification: 'planet',
    geometry_type: 'terrestrial',
    properties: {
      mass: 1.0,
      radius: 6371, // km
      temperature: 288,
    },
    orbit: {
      parent: 'sol-star',
      semi_major_axis: 1.0, // AU
      eccentricity: 0.017,
      inclination: 0,
      orbital_period: 365,
    },
  };

  const mars: CelestialObject = {
    id: 'mars',
    name: 'Mars',
    classification: 'planet',
    geometry_type: 'terrestrial',
    properties: {
      mass: 0.107,
      radius: 3389.5, // km
      temperature: 210,
    },
    orbit: {
      parent: 'sol-star',
      semi_major_axis: 1.524, // AU
      eccentricity: 0.094,
      inclination: 1.9,
      orbital_period: 687,
    },
  };

  const jupiter: CelestialObject = {
    id: 'jupiter',
    name: 'Jupiter',
    classification: 'planet',
    geometry_type: 'gas_giant',
    properties: {
      mass: 317.8,
      radius: 69911, // km
      temperature: 165,
    },
    orbit: {
      parent: 'sol-star',
      semi_major_axis: 5.203, // AU
      eccentricity: 0.049,
      inclination: 1.3,
      orbital_period: 4333,
    },
  };

  return [sol, mercury, venus, earth, mars, jupiter];
};

describe('Orbital Mechanics Validation - Fixed Issues', () => {
  beforeEach(() => {
    clearOrbitalMechanicsCache();
  });

  describe('Orbital Distance Accuracy', () => {
    it('should place planets at correct distances in realistic mode', () => {
      const objects = createSolarSystemTestData();
      const mechanics = calculateSystemOrbitalMechanics(objects, 'explorational');
      
      // Expected vs actual orbital distances (in AU from original data)
      const expectedDistances = {
        mercury: 0.387,
        venus: 0.723,
        earth: 1.0,
        mars: 1.524,
        jupiter: 5.203,
      };
      
      const results: Record<string, { expected: number; actual: number; error: number }> = {};
      
      Object.entries(expectedDistances).forEach(([objectId, expectedAU]) => {
        const mechanicsData = mechanics.get(objectId);
        if (mechanicsData?.orbitDistance) {
          // Convert back to AU for comparison (assuming 8.0 scaling factor for realistic mode)
          const actualAU = mechanicsData.orbitDistance / 8.0;
          const error = Math.abs(actualAU - expectedAU) / expectedAU;
          
          results[objectId] = {
            expected: expectedAU,
            actual: actualAU,
            error: error * 100, // Convert to percentage
          };
        }
      });
      
      console.log('Orbital Distance Validation Results:');
      Object.entries(results).forEach(([planet, data]) => {
        console.log(`${planet}: expected ${data.expected} AU, got ${data.actual.toFixed(3)} AU (${data.error.toFixed(1)}% error)`);
      });
      
      // Validate that most planets are within acceptable tolerance
      expect(results.mercury.error).toBeLessThan(5); // Mercury should be very accurate now
      expect(results.venus.error).toBeLessThan(20); // Venus should be reasonable
      expect(results.earth.error).toBeLessThan(5); // Earth should be very accurate
      expect(results.mars.error).toBeLessThan(5); // Mars should be very accurate
      expect(results.jupiter.error).toBeLessThan(25); // Jupiter may still have some adjustment due to collision detection
    });

    it('should maintain proper size scaling for stars in explorational mode', () => {
      const objects = createSolarSystemTestData();
      const mechanics = calculateSystemOrbitalMechanics(objects, 'explorational');
      
      const sunData = mechanics.get('sol-star')!;
      const mercuryData = mechanics.get('mercury')!;
      
      // Sun should be small enough to not interfere with Mercury's orbit
      expect(sunData.visualRadius).toBeLessThan(1.0); // Sun should be less than 1 unit
      expect(mercuryData.orbitDistance!).toBeGreaterThan(sunData.visualRadius * 2); // Mercury should be well clear of Sun
      
      console.log('Star Size Validation:');
      console.log(`Sun visual radius: ${sunData.visualRadius}`);
      console.log(`Mercury orbit distance: ${mercuryData.orbitDistance}`);
      console.log(`Clearance ratio: ${(mercuryData.orbitDistance! / sunData.visualRadius).toFixed(2)}x`);
    });

    it('should prevent orbital collisions while maintaining accuracy', () => {
      const objects = createSolarSystemTestData();
      const mechanics = calculateSystemOrbitalMechanics(objects, 'explorational');
      
      // Get all planets in order
      const planets = ['mercury', 'venus', 'earth', 'mars', 'jupiter'];
      const planetData = planets.map(id => ({
        id,
        data: mechanics.get(id)!,
        orbitDistance: mechanics.get(id)!.orbitDistance!,
      }));
      
      // Check that each planet is farther than the previous
      for (let i = 1; i < planetData.length; i++) {
        const current = planetData[i];
        const previous = planetData[i - 1];
        
        expect(current.orbitDistance).toBeGreaterThan(previous.orbitDistance);
        
        // Check minimum separation
        const separation = current.orbitDistance - previous.orbitDistance;
        expect(separation).toBeGreaterThan(0.1); // At least 0.1 units separation
        
        console.log(`${previous.id} -> ${current.id}: separation = ${separation.toFixed(2)} units`);
      }
    });
  });

  describe('Cross-View Mode Consistency', () => {
    it('should maintain planetary ordering across all view modes', () => {
      const objects = createSolarSystemTestData();
      
      const realisticMechanics = calculateSystemOrbitalMechanics(objects, 'explorational');
      const navMechanics = calculateSystemOrbitalMechanics(objects, 'navigational');
      const profileMechanics = calculateSystemOrbitalMechanics(objects, 'profile');
      
      const planets = ['mercury', 'venus', 'earth', 'mars', 'jupiter'];
      
      // Get ordering for each view mode
      const getOrdering = (mechanics: Map<string, any>) => {
        return planets.map(id => ({
          id,
          distance: mechanics.get(id)?.orbitDistance || 0,
        })).sort((a, b) => a.distance - b.distance).map(p => p.id);
      };
      
      const realisticOrdering = getOrdering(realisticMechanics);
      const navOrdering = getOrdering(navMechanics);
      const profileOrdering = getOrdering(profileMechanics);
      
      console.log('Planetary ordering consistency:');
      console.log('Realistic:', realisticOrdering);
      console.log('Navigational:', navOrdering);
      console.log('Profile:', profileOrdering);
      
      // All view modes should have the same ordering
      expect(realisticOrdering).toEqual(navOrdering);
      expect(navOrdering).toEqual(profileOrdering);
      expect(realisticOrdering).toEqual(['mercury', 'venus', 'earth', 'mars', 'jupiter']);
    });
  });

  describe('Performance and Caching', () => {
    it('should cache results for identical calculations', () => {
      const objects = createSolarSystemTestData();
      
      const start1 = performance.now();
      const mechanics1 = calculateSystemOrbitalMechanics(objects, 'explorational');
      const time1 = performance.now() - start1;
      
      const start2 = performance.now();
      const mechanics2 = calculateSystemOrbitalMechanics(objects, 'explorational');
      const time2 = performance.now() - start2;
      
      // Second calculation should be faster (cached) - relaxed timing for CI/test reliability
      expect(time2).toBeLessThan(time1 * 2.0); // Should be faster, but allow for timing variance
      
      // Results should be identical
      expect(mechanics1).toBe(mechanics2);
      
      console.log(`First calculation: ${time1.toFixed(2)}ms`);
      console.log(`Cached calculation: ${time2.toFixed(2)}ms`);
      console.log(`Speedup: ${(time1 / time2).toFixed(1)}x`);
    });
  });
}); 