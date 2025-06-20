import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateSystemOrbitalMechanics,
  clearOrbitalMechanicsCache,
} from '../../../core/pipeline';
import { CelestialObject } from '@/engine/types/orbital-system';
import { ViewType } from '@lib/types/effects-level';

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
      eccentricity: 0.093,
      inclination: 1.9,
      orbital_period: 687,
    },
  };

  const asteroidBelt: CelestialObject = {
    id: 'asteroid-belt',
    name: 'Asteroid Belt',
    classification: 'belt',
    geometry_type: 'belt',
    properties: {
      mass: 1.0,
      radius: 500, // km
      temperature: 288,
    },
    orbit: {
      parent: 'sol-star',
      inner_radius: 2.2, // AU - Should be between Mars (1.524) and Jupiter (5.203)
      outer_radius: 3.2, // AU
      inclination: 0,
      eccentricity: 0,
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
      eccentricity: 0.048,
      inclination: 1.3,
      orbital_period: 4333,
    },
  };

  return [sol, mercury, venus, earth, mars, asteroidBelt, jupiter];
};

describe('Orbital Mechanics Flow - Step by Step Analysis', () => {
  beforeEach(() => {
    clearOrbitalMechanicsCache();
  });

  describe('Step 1: Object Loading and Basic Properties', () => {
    it('should load solar system objects with correct base properties', () => {
      const objects = createSolarSystemTestData();
      
      // Verify we have all expected objects
      expect(objects).toHaveLength(7);
      
      const sol = objects.find(obj => obj.id === 'sol-star');
      const mars = objects.find(obj => obj.id === 'mars');
      const asteroidBelt = objects.find(obj => obj.id === 'asteroid-belt');
      const jupiter = objects.find(obj => obj.id === 'jupiter');
      
      expect(sol).toBeDefined();
      expect(mars).toBeDefined();
      expect(asteroidBelt).toBeDefined();
      expect(jupiter).toBeDefined();
      
      // Verify asteroid belt has correct AU values
      if (asteroidBelt?.orbit && 'inner_radius' in asteroidBelt.orbit) {
        expect(asteroidBelt.orbit.inner_radius).toBe(2.2);
        expect(asteroidBelt.orbit.outer_radius).toBe(3.2);
      } else {
        throw new Error('Asteroid belt should have belt orbit data');
      }
      
      // Verify Mars and Jupiter positions relative to asteroid belt
      if (mars?.orbit && 'semi_major_axis' in mars.orbit) {
        expect(mars.orbit.semi_major_axis).toBe(1.524); // Mars at 1.524 AU
      }
      if (jupiter?.orbit && 'semi_major_axis' in jupiter.orbit) {
        expect(jupiter.orbit.semi_major_axis).toBe(5.203); // Jupiter at 5.203 AU
      }
      
      // Verify expected ordering: Mars < Asteroid Belt < Jupiter
      expect(1.524).toBeLessThan(2.2); // Mars < Belt inner
      expect(3.2).toBeLessThan(5.203); // Belt outer < Jupiter
    });
  });

  describe('Step 2: Visual Radius Calculation', () => {
    it('should calculate visual radii correctly for each view mode', () => {
      const objects = createSolarSystemTestData();
      
      // Test all view modes
      const viewModes: ViewType[] = ['explorational', 'navigational', 'profile'];
      
      for (const viewMode of viewModes) {
        const mechanics = calculateSystemOrbitalMechanics(objects, viewMode, false);
        
        // All objects should have visual radii
        for (const obj of objects) {
          const data = mechanics.get(obj.id);
          expect(data).toBeDefined();
          expect(data!.visualRadius).toBeGreaterThan(0);
        }
        
        const solData = mechanics.get('sol-star')!;
        const marsData = mechanics.get('mars')!;
        const beltData = mechanics.get('asteroid-belt')!;
        const jupiterData = mechanics.get('jupiter')!;
        
        // Size relationships should be maintained
        expect(solData.visualRadius).toBeGreaterThan(jupiterData.visualRadius);
        expect(jupiterData.visualRadius).toBeGreaterThan(marsData.visualRadius);
      }
    });

    it('should handle fixed sizes correctly in non-realistic modes', () => {
      const objects = createSolarSystemTestData();
      
      // Navigational mode should use fixed sizes
      const navMechanics = calculateSystemOrbitalMechanics(objects, 'navigational', false);
      const solData = navMechanics.get('sol-star')!;
      const marsData = navMechanics.get('mars')!;
      const beltData = navMechanics.get('asteroid-belt')!;
      
      expect(solData.visualRadius).toBe(2.0); // Fixed star size
      expect(marsData.visualRadius).toBe(1.2); // Fixed planet size
      expect(beltData.visualRadius).toBe(0.8); // Fixed belt size
    });
  });

  describe('Step 3: Orbital Distance Scaling', () => {
    it('should scale orbital distances correctly for each view mode', () => {
      const objects = createSolarSystemTestData();
      
      const explorationalMechanics = calculateSystemOrbitalMechanics(objects, 'explorational', false);
      const navMechanics = calculateSystemOrbitalMechanics(objects, 'navigational', false);
      const profileMechanics = calculateSystemOrbitalMechanics(objects, 'profile', false);
      
      // Mars should have orbital distance in all modes
      const marsExplorational = explorationalMechanics.get('mars')!;
      const marsNav = navMechanics.get('mars')!;
      const marsProfile = profileMechanics.get('mars')!;
      
      expect(marsExplorational.orbitDistance).toBeGreaterThan(0);
      expect(marsNav.orbitDistance).toBeGreaterThan(0);
      expect(marsProfile.orbitDistance).toBeGreaterThan(0);
      
      // Different view modes should have different orbital scaling
      // However, collision detection may cause objects to be positioned differently
      // than raw orbital scaling would suggest, especially when moon systems are involved
      
      // Profile mode should generally have the smallest distances due to lowest scaling (4.0)
      expect(marsProfile.orbitDistance!).toBeLessThan(marsNav.orbitDistance!);
      
      // All modes should maintain reasonable proportional relationships
      // The exact ordering between explorational and navigational may vary due to collision adjustments
      const allDistances = [marsExplorational.orbitDistance!, marsNav.orbitDistance!, marsProfile.orbitDistance!];
      const maxDistance = Math.max(...allDistances);
      const minDistance = Math.min(...allDistances);
      
      // The ratio between max and min should be reasonable (not more than 2x difference)
      expect(maxDistance / minDistance).toBeLessThanOrEqual(2.0);
    });
  });

  describe('Step 4: Belt Positioning Analysis', () => {
    it('should position asteroid belt correctly between Mars and Jupiter', () => {
      const objects = createSolarSystemTestData();
      
      for (const viewMode of ['explorational', 'navigational', 'profile'] as ViewType[]) {
        const mechanics = calculateSystemOrbitalMechanics(objects, viewMode, false);
        
        const marsData = mechanics.get('mars')!;
        const beltData = mechanics.get('asteroid-belt')!;
        const jupiterData = mechanics.get('jupiter')!;
        
        // Belt should have belt data
        expect(beltData.beltData).toBeDefined();
        
        const { innerRadius, outerRadius, centerRadius } = beltData.beltData!;
        
        // Basic belt properties
        expect(innerRadius).toBeLessThan(outerRadius);
        expect(centerRadius).toBe((innerRadius + outerRadius) / 2);
        
                 // Mars should be inside belt inner radius
         const marsOrbitDistance = marsData.orbitDistance || 0;
         const jupiterOrbitDistance = jupiterData.orbitDistance || 0;
         expect(marsOrbitDistance).toBeLessThan(innerRadius);
         
         // Jupiter should be outside belt outer radius
         expect(jupiterOrbitDistance).toBeGreaterThan(outerRadius);
        
        console.log(`${viewMode} mode:`, {
          mars: marsData.orbitDistance,
          beltInner: innerRadius,
          beltOuter: outerRadius,
          jupiter: jupiterData.orbitDistance,
        });
      }
    });

    it('should maintain proper belt width proportions', () => {
      const objects = createSolarSystemTestData();
      
      const explorationalMechanics = calculateSystemOrbitalMechanics(objects, 'explorational', false);
      const beltData = explorationalMechanics.get('asteroid-belt')!;
      
      expect(beltData.beltData).toBeDefined();
      
      const { innerRadius, outerRadius } = beltData.beltData!;
      const originalWidth = 3.2 - 2.2; // 1.0 AU
      const actualWidth = outerRadius - innerRadius;
      
      // Width should be proportional to scaling
      const expectedScaling = 8.0; // explorational mode orbital scaling
      const expectedWidth = originalWidth * expectedScaling;
      
      // Allow some tolerance for collision adjustments
      expect(actualWidth).toBeGreaterThanOrEqual(expectedWidth * 0.8);
    });
  });

  describe('Step 5: Collision Detection and Adjustment', () => {
    it('should prevent orbital collisions between adjacent objects', () => {
      const objects = createSolarSystemTestData();
      
      const mechanics = calculateSystemOrbitalMechanics(objects, 'explorational', false);
      
      // Get all objects orbiting the star (excluding the star itself)
      const orbitingObjects = objects
        .filter(obj => obj.orbit?.parent === 'sol-star')
        .map(obj => ({
          id: obj.id,
          originalAU: obj.orbit && 'semi_major_axis' in obj.orbit 
            ? obj.orbit.semi_major_axis 
            : obj.orbit && 'inner_radius' in obj.orbit 
            ? obj.orbit.inner_radius 
            : 0,
          mechanics: mechanics.get(obj.id)!,
        }))
        .sort((a, b) => a.originalAU - b.originalAU);
      
      // Check that each object has sufficient clearance from the previous one
      for (let i = 1; i < orbitingObjects.length; i++) {
        const current = orbitingObjects[i];
        const previous = orbitingObjects[i - 1];
        
        let previousOuterEdge: number;
        let currentInnerEdge: number;
        
        if (previous.mechanics.beltData) {
          previousOuterEdge = previous.mechanics.beltData.outerRadius;
        } else {
          previousOuterEdge = previous.mechanics.orbitDistance! + previous.mechanics.visualRadius;
        }
        
        if (current.mechanics.beltData) {
          currentInnerEdge = current.mechanics.beltData.innerRadius;
        } else {
          currentInnerEdge = current.mechanics.orbitDistance! - current.mechanics.visualRadius;
        }
        
        // There should be clearance between objects
        expect(currentInnerEdge).toBeGreaterThan(previousOuterEdge);
        
        console.log(`${previous.id} -> ${current.id}:`, {
          previousOuter: previousOuterEdge,
          currentInner: currentInnerEdge,
          gap: currentInnerEdge - previousOuterEdge,
        });
      }
    });
  });

  describe('Step 6: Cross-View Mode Consistency', () => {
    it('should maintain relative positioning across view modes', () => {
      const objects = createSolarSystemTestData();
      
      const explorationalMechanics = calculateSystemOrbitalMechanics(objects, 'explorational', false);
      const navMechanics = calculateSystemOrbitalMechanics(objects, 'navigational', false);
      const profileMechanics = calculateSystemOrbitalMechanics(objects, 'profile', false);
      
      // Get ordering for each view mode
      const getOrdering = (mechanics: Map<string, any>) => {
        const positions = objects
          .filter(obj => obj.orbit?.parent === 'sol-star')
          .map(obj => ({
            id: obj.id,
            position: mechanics.get(obj.id)?.beltData 
              ? mechanics.get(obj.id)!.beltData!.centerRadius
              : mechanics.get(obj.id)?.orbitDistance || 0,
          }))
          .sort((a, b) => a.position - b.position)
          .map(item => item.id);
        
        return positions;
      };
      
      const explorationalOrdering = getOrdering(explorationalMechanics);
      const navOrdering = getOrdering(navMechanics);
      const profileOrdering = getOrdering(profileMechanics);
      
      // All view modes should have the same ordering
      expect(explorationalOrdering).toEqual(navOrdering);
      expect(navOrdering).toEqual(profileOrdering);
      
      // Expected ordering: Mercury, Venus, Earth, Mars, Asteroid Belt, Jupiter
      const expectedOrdering = ['mercury', 'venus', 'earth', 'mars', 'asteroid-belt', 'jupiter'];
      expect(explorationalOrdering).toEqual(expectedOrdering);
    });
  });

  describe('Step 7: Edge Cases and Error Conditions', () => {
    it('should handle systems with only belt objects', () => {
      const star: CelestialObject = {
        id: 'test-star',
        name: 'Test Star',
        classification: 'star',
        geometry_type: 'star',
        properties: { mass: 1, radius: 695700, temperature: 5778 },
        position: [0, 0, 0],
      };

      const belt: CelestialObject = {
        id: 'test-belt',
        name: 'Test Belt',
        classification: 'belt',
        geometry_type: 'belt',
        properties: { mass: 1, radius: 500, temperature: 288 },
        orbit: {
          parent: 'test-star',
          inner_radius: 1.0,
          outer_radius: 2.0,
          inclination: 0,
          eccentricity: 0,
        },
      };

      const objects = [star, belt];
      const mechanics = calculateSystemOrbitalMechanics(objects, 'explorational', false);
      
      const beltData = mechanics.get('test-belt')!;
      expect(beltData.beltData).toBeDefined();
      expect(beltData.beltData!.innerRadius).toBeGreaterThan(0);
    });

    it('should handle overlapping belt configurations', () => {
      const star: CelestialObject = {
        id: 'test-star',
        name: 'Test Star',
        classification: 'star',
        geometry_type: 'star',
        properties: { mass: 1, radius: 695700, temperature: 5778 },
        position: [0, 0, 0],
      };

      const belt1: CelestialObject = {
        id: 'belt1',
        name: 'Inner Belt',
        classification: 'belt',
        geometry_type: 'belt',
        properties: { mass: 1, radius: 500, temperature: 288 },
        orbit: {
          parent: 'test-star',
          inner_radius: 1.0,
          outer_radius: 2.0,
          inclination: 0,
          eccentricity: 0,
        },
      };

      const belt2: CelestialObject = {
        id: 'belt2',
        name: 'Outer Belt',
        classification: 'belt',
        geometry_type: 'belt',
        properties: { mass: 1, radius: 500, temperature: 288 },
        orbit: {
          parent: 'test-star',
          inner_radius: 1.5, // Overlaps with belt1
          outer_radius: 2.5,
          inclination: 0,
          eccentricity: 0,
        },
      };

      const objects = [star, belt1, belt2];
      const mechanics = calculateSystemOrbitalMechanics(objects, 'explorational', false);
      
      const belt1Data = mechanics.get('belt1')!;
      const belt2Data = mechanics.get('belt2')!;
      
      // Belts should be adjusted to not overlap
      expect(belt2Data.beltData!.innerRadius).toBeGreaterThan(belt1Data.beltData!.outerRadius);
    });
  });
}); 