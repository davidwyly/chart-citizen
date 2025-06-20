import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateSystemOrbitalMechanics,
  clearOrbitalMechanicsCache,
} from '@/engine/core/pipeline';
import { CelestialObject } from '@/engine/types/orbital-system';
import { ViewType } from '@lib/types/effects-level';

// Test Earth-Moon System Data
const createEarthMoonSystemData = (): CelestialObject[] => {
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

  const moon: CelestialObject = {
    id: 'luna',
    name: 'Luna',
    classification: 'moon',
    geometry_type: 'terrestrial',
    properties: {
      mass: 0.012, // Earth masses
      radius: 1737, // km
      temperature: 250,
    },
    orbit: {
      parent: 'earth',
      semi_major_axis: 0.00257, // AU (384,400 km converted to AU)
      eccentricity: 0.055,
      inclination: 5.1,
      orbital_period: 27.3,
    },
  };

  return [sol, earth, moon];
};

// Test Jupiter System Data with multiple moons
const createJupiterSystemData = (): CelestialObject[] => {
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

  const io: CelestialObject = {
    id: 'io',
    name: 'Io',
    classification: 'moon',
    geometry_type: 'terrestrial',
    properties: {
      mass: 0.015, // Earth masses
      radius: 1821.6, // km
      temperature: 130,
    },
    orbit: {
      parent: 'jupiter',
      semi_major_axis: 0.00282, // AU (421,700 km)
      eccentricity: 0.004,
      inclination: 0.05,
      orbital_period: 1.77,
    },
  };

  const europa: CelestialObject = {
    id: 'europa',
    name: 'Europa',
    classification: 'moon',
    geometry_type: 'terrestrial',
    properties: {
      mass: 0.008, // Earth masses
      radius: 1560.8, // km
      temperature: 102,
    },
    orbit: {
      parent: 'jupiter',
      semi_major_axis: 0.00449, // AU (671,034 km)
      eccentricity: 0.009,
      inclination: 0.47,
      orbital_period: 3.55,
    },
  };

  const ganymede: CelestialObject = {
    id: 'ganymede',
    name: 'Ganymede',
    classification: 'moon',
    geometry_type: 'terrestrial',
    properties: {
      mass: 0.025, // Earth masses
      radius: 2634.1, // km
      temperature: 110,
    },
    orbit: {
      parent: 'jupiter',
      semi_major_axis: 0.00716, // AU (1,070,412 km)
      eccentricity: 0.001,
      inclination: 0.2,
      orbital_period: 7.15,
    },
  };

  const callisto: CelestialObject = {
    id: 'callisto',
    name: 'Callisto',
    classification: 'moon',
    geometry_type: 'terrestrial',
    properties: {
      mass: 0.018, // Earth masses
      radius: 2410.3, // km
      temperature: 134,
    },
    orbit: {
      parent: 'jupiter',
      semi_major_axis: 0.01259, // AU (1,882,709 km)
      eccentricity: 0.007,
      inclination: 0.19,
      orbital_period: 16.69,
    },
  };

  return [sol, jupiter, io, europa, ganymede, callisto];
};

describe('Moon Orbital Mechanics Validation', () => {
  beforeEach(() => {
    clearOrbitalMechanicsCache();
  });

  describe('Earth-Moon System Validation', () => {
    it('should position Luna correctly relative to Earth in all view modes', () => {
      const objects = createEarthMoonSystemData();
      const viewModes: ViewType[] = ['explorational', 'navigational', 'profile'];
      
      viewModes.forEach(viewMode => {
        const mechanics = calculateSystemOrbitalMechanics(objects, viewMode);
        
        const earthData = mechanics.get('earth')!;
        const moonData = mechanics.get('luna')!;
        
        // Moon should have orbital distance
        expect(moonData.orbitDistance).toBeGreaterThan(0);
        
        // Moon should be positioned outside Earth's visual radius
        const earthVisualRadius = earthData.visualRadius;
        const moonOrbitDistance = moonData.orbitDistance!;
        
        expect(moonOrbitDistance).toBeGreaterThan(earthVisualRadius);
        
        // Moon should be visible (not too small)
        expect(moonData.visualRadius).toBeGreaterThan(0.01);
        
        console.log(`${viewMode} mode - Earth-Moon:`, {
          earthRadius: earthVisualRadius,
          moonOrbitDistance: moonOrbitDistance,
          moonRadius: moonData.visualRadius,
          clearanceRatio: (moonOrbitDistance / earthVisualRadius).toFixed(2),
        });
        
        // Validate clearance ratios for visual interpretation
        if (viewMode === 'explorational') {
          // In explorational mode, maintain some proportionality but ensure visibility
          expect(moonOrbitDistance / earthVisualRadius).toBeGreaterThan(2.0); // At least 2x clearance
        } else if (viewMode === 'navigational') {
          // In navigational mode, focus on clear separation for navigation
          expect(moonOrbitDistance / earthVisualRadius).toBeGreaterThanOrEqual(3.0); // Allow exactly 3.0 clearance for navigation
        } else if (viewMode === 'profile') {
          // In profile mode, optimize for hierarchy understanding
          expect(moonOrbitDistance / earthVisualRadius).toBeGreaterThan(2.5); // Good separation for hierarchy
        }
      });
    });

    it('should maintain moon-planet size relationships across view modes', () => {
      const objects = createEarthMoonSystemData();
      const viewModes: ViewType[] = ['explorational', 'navigational', 'profile'];
      
      viewModes.forEach(viewMode => {
        const mechanics = calculateSystemOrbitalMechanics(objects, viewMode);
        
        const earthData = mechanics.get('earth')!;
        const moonData = mechanics.get('luna')!;
        
        if (viewMode === 'explorational') {
          // In explorational mode, maintain some proportionality
          // Earth should be larger than Moon, but Moon should still be visible
          expect(earthData.visualRadius).toBeGreaterThan(moonData.visualRadius);
          expect(moonData.visualRadius).toBeGreaterThan(0.02); // Minimum visibility
        } else {
          // In navigational and profile modes, use standardized sizes
          // Both should be visible and appropriately sized for their classification
          expect(earthData.visualRadius).toBeGreaterThan(0);
          expect(moonData.visualRadius).toBeGreaterThan(0);
          
          // In these modes, the size difference might be standardized
          const sizeRatio = earthData.visualRadius / moonData.visualRadius;
          expect(sizeRatio).toBeGreaterThan(1.0); // Planet should still be larger
          expect(sizeRatio).toBeLessThan(10.0); // But not so large as to make moon invisible
        }
        
        console.log(`${viewMode} mode - Size relationship:`, {
          earthRadius: earthData.visualRadius,
          moonRadius: moonData.visualRadius,
          ratio: (earthData.visualRadius / moonData.visualRadius).toFixed(2),
        });
      });
    });
  });

  describe('Jupiter System Validation', () => {
    it('should position Galilean moons correctly relative to Jupiter', () => {
      const objects = createJupiterSystemData();
      const mechanics = calculateSystemOrbitalMechanics(objects, 'explorational');
      
      const jupiterData = mechanics.get('jupiter')!;
      const ioData = mechanics.get('io')!;
      const europaData = mechanics.get('europa')!;
      const ganymedeData = mechanics.get('ganymede')!;
      const callistoData = mechanics.get('callisto')!;
      
      // All moons should have orbital distances
      expect(ioData.orbitDistance).toBeGreaterThan(0);
      expect(europaData.orbitDistance).toBeGreaterThan(0);
      expect(ganymedeData.orbitDistance).toBeGreaterThan(0);
      expect(callistoData.orbitDistance).toBeGreaterThan(0);
      
      // Moons should be positioned outside Jupiter's visual radius
      const jupiterRadius = jupiterData.visualRadius;
      expect(ioData.orbitDistance!).toBeGreaterThan(jupiterRadius);
      expect(europaData.orbitDistance!).toBeGreaterThan(jupiterRadius);
      expect(ganymedeData.orbitDistance!).toBeGreaterThan(jupiterRadius);
      expect(callistoData.orbitDistance!).toBeGreaterThan(jupiterRadius);
      
      // Moons should be in correct order: Io < Europa < Ganymede < Callisto
      expect(ioData.orbitDistance!).toBeLessThan(europaData.orbitDistance!);
      expect(europaData.orbitDistance!).toBeLessThan(ganymedeData.orbitDistance!);
      expect(ganymedeData.orbitDistance!).toBeLessThan(callistoData.orbitDistance!);
      
      console.log('Jupiter system moon ordering:', {
        jupiter: jupiterRadius,
        io: ioData.orbitDistance,
        europa: europaData.orbitDistance,
        ganymede: ganymedeData.orbitDistance,
        callisto: callistoData.orbitDistance,
      });
    });

    it('should maintain proper spacing between Jupiter moons for visual clarity', () => {
      const objects = createJupiterSystemData();
      const viewModes: ViewType[] = ['explorational', 'navigational', 'profile'];
      
      viewModes.forEach(viewMode => {
        const mechanics = calculateSystemOrbitalMechanics(objects, viewMode);
        
        const moons = ['io', 'europa', 'ganymede', 'callisto'];
        const moonData = moons.map(id => ({
          id,
          data: mechanics.get(id)!,
          orbitDistance: mechanics.get(id)!.orbitDistance!,
        }));
        
        // Check spacing between adjacent moons
        for (let i = 1; i < moonData.length; i++) {
          const current = moonData[i];
          const previous = moonData[i - 1];
          
          const separation = current.orbitDistance - previous.orbitDistance;
          const minSeparation = Math.max(current.data.visualRadius, previous.data.visualRadius) * 2;
          
          expect(separation).toBeGreaterThan(minSeparation);
          
          console.log(`${viewMode} - ${previous.id} to ${current.id}:`, {
            separation: separation.toFixed(3),
            minRequired: minSeparation.toFixed(3),
            ratio: (separation / minSeparation).toFixed(2),
          });
        }
      });
    });
  });

  describe('Moon System Multiplier Validation', () => {
    it('should apply system multiplier consistently to moon orbits', () => {
      const objects = createEarthMoonSystemData();
      const mechanics = calculateSystemOrbitalMechanics(objects, 'explorational');
      
      const moonData = mechanics.get('luna')!;
      const originalSemiMajorAxis = 0.00257; // AU
      const expectedScaling = 8.0; // Explorational mode orbital scaling
      
      // The moon's orbit should be scaled by the system multiplier
      // But also adjusted for minimum visibility requirements
      const scaledDistance = originalSemiMajorAxis * expectedScaling;
      
      // Moon should be at least at the scaled distance or adjusted for visibility
      expect(moonData.orbitDistance!).toBeGreaterThanOrEqual(scaledDistance * 0.5); // Allow for adjustments
      
      console.log('Moon system multiplier validation:', {
        originalAU: originalSemiMajorAxis,
        expectedScaled: scaledDistance,
        actualDistance: moonData.orbitDistance,
        scalingFactor: (moonData.orbitDistance! / originalSemiMajorAxis).toFixed(2),
      });
    });

    it('should ensure moons are visible and interpretable in all view modes', () => {
      const objects = createJupiterSystemData();
      const viewModes: ViewType[] = ['explorational', 'navigational', 'profile'];
      
      viewModes.forEach(viewMode => {
        const mechanics = calculateSystemOrbitalMechanics(objects, viewMode);
        
        const jupiterData = mechanics.get('jupiter')!;
        const moons = ['io', 'europa', 'ganymede', 'callisto'];
        
        moons.forEach(moonId => {
          const moonData = mechanics.get(moonId)!;
          
          // Moon should be visible
          expect(moonData.visualRadius).toBeGreaterThan(0.01);
          
          // Moon should be clearly outside parent planet
          const clearanceRatio = moonData.orbitDistance! / jupiterData.visualRadius;
          
          if (viewMode === 'explorational') {
            // Explorational mode: some proportionality but ensure visibility
            expect(clearanceRatio).toBeGreaterThan(1.5);
          } else if (viewMode === 'navigational') {
            // Navigational mode: optimize for navigation clarity
            expect(clearanceRatio).toBeGreaterThan(2.0);
          } else if (viewMode === 'profile') {
            // Profile mode: optimize for hierarchy understanding
            expect(clearanceRatio).toBeGreaterThan(1.8);
          }
          
          console.log(`${viewMode} - ${moonId} visibility:`, {
            moonRadius: moonData.visualRadius,
            orbitDistance: moonData.orbitDistance,
            clearanceRatio: clearanceRatio.toFixed(2),
            isVisible: moonData.visualRadius > 0.01 ? 'Yes' : 'No',
          });
        });
      });
    });
  });

  describe('Moon Collision Detection and Adjustment', () => {
    it('should prevent moon-planet collisions while maintaining orbital hierarchy', () => {
      const objects = createJupiterSystemData();
      const mechanics = calculateSystemOrbitalMechanics(objects, 'explorational');
      
      const jupiterData = mechanics.get('jupiter')!;
      const moons = ['io', 'europa', 'ganymede', 'callisto'];
      
      moons.forEach(moonId => {
        const moonData = mechanics.get(moonId)!;
        
        // Moon should not collide with parent planet
        const planetOuterEdge = jupiterData.visualRadius;
        const moonInnerEdge = moonData.orbitDistance! - moonData.visualRadius;
        
        expect(moonInnerEdge).toBeGreaterThan(planetOuterEdge);
        
        console.log(`${moonId} collision check:`, {
          planetOuterEdge: planetOuterEdge.toFixed(3),
          moonInnerEdge: moonInnerEdge.toFixed(3),
          clearance: (moonInnerEdge - planetOuterEdge).toFixed(3),
        });
      });
    });

    it('should prevent moon-moon collisions while maintaining correct ordering', () => {
      const objects = createJupiterSystemData();
      const mechanics = calculateSystemOrbitalMechanics(objects, 'explorational');
      
      const moons = ['io', 'europa', 'ganymede', 'callisto'];
      const moonData = moons.map(id => ({
        id,
        data: mechanics.get(id)!,
      }));
      
      // Check adjacent moon pairs for collisions
      for (let i = 1; i < moonData.length; i++) {
        const current = moonData[i];
        const previous = moonData[i - 1];
        
        const previousOuterEdge = previous.data.orbitDistance! + previous.data.visualRadius;
        const currentInnerEdge = current.data.orbitDistance! - current.data.visualRadius;
        
        expect(currentInnerEdge).toBeGreaterThan(previousOuterEdge);
        
        console.log(`${previous.id} -> ${current.id} collision check:`, {
          previousOuter: previousOuterEdge.toFixed(3),
          currentInner: currentInnerEdge.toFixed(3),
          clearance: (currentInnerEdge - previousOuterEdge).toFixed(3),
        });
      }
    });
  });

  describe('View Mode Specific Moon Requirements', () => {
    it('should optimize moon positioning for explorational mode interpretation', () => {
      const objects = createEarthMoonSystemData();
      const mechanics = calculateSystemOrbitalMechanics(objects, 'explorational');
      
      const earthData = mechanics.get('earth')!;
      const moonData = mechanics.get('luna')!;
      
      // In explorational mode, show size variation but ensure visibility
      const sizeRatio = earthData.visualRadius / moonData.visualRadius;
      expect(sizeRatio).toBeGreaterThan(1.0); // Earth larger than Moon
      expect(sizeRatio).toBeLessThan(20.0); // But Moon still visible
      
      // Orbital distance should show some proportionality
      const orbitRatio = moonData.orbitDistance! / earthData.visualRadius;
      expect(orbitRatio).toBeGreaterThan(2.0); // Clear separation
      expect(orbitRatio).toBeLessThan(50.0); // But not too far for context
    });

    it('should optimize moon positioning for navigational mode clarity', () => {
      const objects = createJupiterSystemData();
      const mechanics = calculateSystemOrbitalMechanics(objects, 'navigational');
      
      const jupiterData = mechanics.get('jupiter')!;
      const moons = ['io', 'europa', 'ganymede', 'callisto'];
      
      // In navigational mode, prioritize clear separation and navigation utility
      moons.forEach(moonId => {
        const moonData = mechanics.get(moonId)!;
        
        // Moons should be clearly separated from planet for navigation
        const clearanceRatio = moonData.orbitDistance! / jupiterData.visualRadius;
        expect(clearanceRatio).toBeGreaterThan(2.0);
        
        // Moons should be reasonably sized for selection/navigation
        expect(moonData.visualRadius).toBeGreaterThan(0.05);
      });
    });

    it('should optimize moon positioning for profile mode hierarchy understanding', () => {
      const objects = createJupiterSystemData();
      const mechanics = calculateSystemOrbitalMechanics(objects, 'profile');
      
      const jupiterData = mechanics.get('jupiter')!;
      const moons = ['io', 'europa', 'ganymede', 'callisto'];
      
      // In profile mode, optimize for hierarchy visualization and quick identification
      const moonDistances = moons.map(id => mechanics.get(id)!.orbitDistance!);
      
      // Moons should have good spacing for hierarchy understanding
      for (let i = 1; i < moonDistances.length; i++) {
        const spacing = moonDistances[i] - moonDistances[i - 1];
        const minSpacing = jupiterData.visualRadius * 0.5; // Reasonable spacing relative to planet
        
        expect(spacing).toBeGreaterThan(minSpacing);
      }
    });
  });
}); 