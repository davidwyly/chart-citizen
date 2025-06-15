import { describe, it, expect, beforeEach } from 'vitest'
import * as THREE from 'three'
import type { CelestialObject } from '@/engine/types/orbital-system'
import { calculateSystemOrbitalMechanics, clearOrbitalMechanicsCache } from '@/engine/utils/orbital-mechanics-calculator'
import { ViewType } from '@/lib/types/effects-level'

// Import the test data factory from the existing flow test
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
      inner_radius: 2.2, // AU
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

  return [sol, mercury, earth, mars, asteroidBelt, jupiter];
};

describe('Enhanced Orbital Mechanics and Distance Validation', () => {
  beforeEach(() => {
    clearOrbitalMechanicsCache();
  });

  describe('Integration with Orbital Mechanics Calculator', () => {
    it('validates calculated orbital distances match expected astronomical values', () => {
      const objects = createSolarSystemTestData();
      const mechanics = calculateSystemOrbitalMechanics(objects, 'realistic');
      
      const earthData = mechanics.get('earth')!;
      const marsData = mechanics.get('mars')!;
      const jupiterData = mechanics.get('jupiter')!;
      
      // Test that orbital distance ratios match real astronomy
      const marsToEarthRatio = marsData.orbitDistance! / earthData.orbitDistance!;
      const jupiterToEarthRatio = jupiterData.orbitDistance! / earthData.orbitDistance!;
      
      // These should match the semi-major axis ratios from our test data
      expect(marsToEarthRatio).toBeCloseTo(1.524, 2); // Mars is 1.524 AU from Sun
      expect(jupiterToEarthRatio).toBeCloseTo(5.203, 2); // Jupiter is 5.203 AU from Sun
    });

    it('validates belt positioning calculations are geometrically correct', () => {
      const objects = createSolarSystemTestData();
      const mechanics = calculateSystemOrbitalMechanics(objects, 'realistic');
      
      const marsData = mechanics.get('mars')!;
      const beltData = mechanics.get('asteroid-belt')!;
      const jupiterData = mechanics.get('jupiter')!;
      
      expect(beltData.beltData).toBeDefined();
      const { innerRadius, outerRadius, centerRadius } = beltData.beltData!;
      
      // Validate geometric relationships
      expect(centerRadius).toBeCloseTo((innerRadius + outerRadius) / 2, 5);
      expect(outerRadius).toBeGreaterThan(innerRadius);
      
      // Validate astronomical positioning: Mars < Belt < Jupiter
      expect(marsData.orbitDistance!).toBeLessThan(innerRadius);
      expect(outerRadius).toBeLessThan(jupiterData.orbitDistance!);
      
      // Test belt width proportions
      const beltWidth = outerRadius - innerRadius;
      const originalWidth = 3.2 - 2.2; // 1.0 AU from test data
      const expectedScaling = 8.0; // realistic mode scaling
      
      // Belt width should be proportional to scaling (allowing for collision adjustments)
      expect(beltWidth).toBeGreaterThan(originalWidth * expectedScaling * 0.8);
    });
  });

  describe('Three.js Position Vector Validation', () => {
    it('converts orbital mechanics data to correct 3D positions', () => {
      const objects = createSolarSystemTestData();
      const mechanics = calculateSystemOrbitalMechanics(objects, 'realistic');
      
      // Test that we can create accurate 3D positions from the calculated data
      const earthData = mechanics.get('earth')!;
      const marsData = mechanics.get('mars')!;
      
      // Create 3D positions at different orbital phases
      const createOrbitalPosition = (distance: number, angle: number): THREE.Vector3 => {
        return new THREE.Vector3(
          distance * Math.cos(angle),
          0, // Assuming orbital plane is XZ
          distance * Math.sin(angle)
        );
      };
      
      const earthPos0 = createOrbitalPosition(earthData.orbitDistance!, 0);
      const earthPos90 = createOrbitalPosition(earthData.orbitDistance!, Math.PI / 2);
      const marsPos0 = createOrbitalPosition(marsData.orbitDistance!, 0);
      
      // Validate distances from origin
      expect(earthPos0.length()).toBeCloseTo(earthData.orbitDistance!, 5);
      expect(earthPos90.length()).toBeCloseTo(earthData.orbitDistance!, 5);
      expect(marsPos0.length()).toBeCloseTo(marsData.orbitDistance!, 5);
      
      // Validate relative distances between planets
      const earthMarsDistance = earthPos0.distanceTo(marsPos0);
      const expectedDistance = Math.abs(marsData.orbitDistance! - earthData.orbitDistance!);
      expect(earthMarsDistance).toBeCloseTo(expectedDistance, 3);
    });

    it('validates collision detection prevents overlapping orbits', () => {
      const objects = createSolarSystemTestData();
      const mechanics = calculateSystemOrbitalMechanics(objects, 'realistic');
      
      // Get all orbiting objects sorted by distance
      const orbitingObjects = objects
        .filter(obj => obj.orbit?.parent === 'sol-star')
        .map(obj => ({
          id: obj.id,
          data: mechanics.get(obj.id)!,
        }))
        .sort((a, b) => {
          const aPos = a.data.beltData ? a.data.beltData.centerRadius : a.data.orbitDistance!;
          const bPos = b.data.beltData ? b.data.beltData.centerRadius : b.data.orbitDistance!;
          return aPos - bPos;
        });
      
      // Test that no objects overlap
      for (let i = 1; i < orbitingObjects.length; i++) {
        const current = orbitingObjects[i];
        const previous = orbitingObjects[i - 1];
        
        const previousOuter = previous.data.beltData 
          ? previous.data.beltData.outerRadius
          : previous.data.orbitDistance! + previous.data.visualRadius;
          
        const currentInner = current.data.beltData
          ? current.data.beltData.innerRadius
          : current.data.orbitDistance! - current.data.visualRadius;
        
        // Ensure no overlap
        expect(currentInner).toBeGreaterThan(previousOuter);
        
        // Ensure reasonable minimum gap
        const gap = currentInner - previousOuter;
        expect(gap).toBeGreaterThan(0.1); // Minimum 0.1 unit gap
      }
    });
  });

  describe('Cross-View Mode Mathematical Consistency', () => {
    it('maintains proportional relationships across view modes', () => {
      const objects = createSolarSystemTestData();
      
      const realisticMechanics = calculateSystemOrbitalMechanics(objects, 'realistic');
      const navMechanics = calculateSystemOrbitalMechanics(objects, 'navigational');
      const profileMechanics = calculateSystemOrbitalMechanics(objects, 'profile');
      
      // Test that ratios between planets remain consistent
      const getDistanceRatio = (mechanics: Map<string, any>, id1: string, id2: string): number => {
        const obj1 = mechanics.get(id1)!;
        const obj2 = mechanics.get(id2)!;
        return obj1.orbitDistance! / obj2.orbitDistance!;
      };
      
      const marsEarthRatioRealistic = getDistanceRatio(realisticMechanics, 'mars', 'earth');
      const marsEarthRatioNav = getDistanceRatio(navMechanics, 'mars', 'earth');
      const marsEarthRatioProfile = getDistanceRatio(profileMechanics, 'mars', 'earth');
      
      // Ratios should be consistent across view modes (within tolerance)
      expect(marsEarthRatioRealistic).toBeCloseTo(marsEarthRatioNav, 1);
      expect(marsEarthRatioNav).toBeCloseTo(marsEarthRatioProfile, 1);
      
      // All should approximate the real astronomical ratio
      expect(marsEarthRatioRealistic).toBeCloseTo(1.524, 1);
    });

    it('validates view mode scaling factors are applied correctly', () => {
      const objects = createSolarSystemTestData();
      
      const realisticMechanics = calculateSystemOrbitalMechanics(objects, 'realistic');
      const navMechanics = calculateSystemOrbitalMechanics(objects, 'navigational');
      
      const earthRealistic = realisticMechanics.get('earth')!;
      const earthNav = navMechanics.get('earth')!;
      
      // Realistic mode should have larger orbital distances than navigational
      expect(earthRealistic.orbitDistance!).toBeGreaterThan(earthNav.orbitDistance!);
      
      // Test expected scaling ratios (realistic: 8.0, navigational: 0.6)
      const scalingRatio = earthRealistic.orbitDistance! / earthNav.orbitDistance!;
      const expectedRatio = 8.0 / 0.6; // ~13.33
      
      expect(scalingRatio).toBeCloseTo(expectedRatio, 1);
    });
  });

  describe('Orbital Period and Animation Validation', () => {
    it('validates orbital periods match Kepler\'s third law', () => {
      const objects = createSolarSystemTestData();
      
      // Extract orbital periods from test data
      const earth = objects.find(obj => obj.id === 'earth')!;
      const mars = objects.find(obj => obj.id === 'mars')!;
      const jupiter = objects.find(obj => obj.id === 'jupiter')!;
      
      // Calculate expected periods using Kepler's third law: T² ∝ a³
      const calculateRelativePeriod = (semiMajorAxis: number): number => {
        return Math.pow(semiMajorAxis, 1.5); // Relative to Earth (1 AU, 1 year)
      };
      
      if (mars.orbit && 'semi_major_axis' in mars.orbit) {
        const expectedMarsPeriod = calculateRelativePeriod(mars.orbit.semi_major_axis) * 365; // Convert to days
        expect(mars.orbit.orbital_period).toBeCloseTo(expectedMarsPeriod, 50); // Allow 50-day tolerance
      }
      
      if (jupiter.orbit && 'semi_major_axis' in jupiter.orbit) {
        const expectedJupiterPeriod = calculateRelativePeriod(jupiter.orbit.semi_major_axis) * 365;
        expect(jupiter.orbit.orbital_period).toBeCloseTo(expectedJupiterPeriod, 200); // Allow 200-day tolerance
      }
    });

    it('calculates correct angular velocities for animation', () => {
      const objects = createSolarSystemTestData();
      
      const earth = objects.find(obj => obj.id === 'earth')!;
      const mars = objects.find(obj => obj.id === 'mars')!;
      
      if (earth.orbit && 'orbital_period' in earth.orbit && 
          mars.orbit && 'orbital_period' in mars.orbit) {
        
        // Calculate angular velocities (radians per day)
        const earthAngularVel = (2 * Math.PI) / earth.orbit.orbital_period;
        const marsAngularVel = (2 * Math.PI) / mars.orbit.orbital_period;
        
        // Earth should orbit faster than Mars
        expect(earthAngularVel).toBeGreaterThan(marsAngularVel);
        
        // Test the ratio matches period ratio
        const velocityRatio = earthAngularVel / marsAngularVel;
        const periodRatio = mars.orbit.orbital_period / earth.orbit.orbital_period;
        
        expect(velocityRatio).toBeCloseTo(periodRatio, 2);
      }
    });
  });

  describe('Edge Case Validation', () => {
    it('handles highly eccentric orbits correctly', () => {
      // Create a test object with high eccentricity (like a comet)
      const comet: CelestialObject = {
        id: 'test-comet',
        name: 'Test Comet',
        classification: 'comet',
        geometry_type: 'rocky',
        properties: {
          mass: 0.001,
          radius: 5, // km
          temperature: 200,
        },
        orbit: {
          parent: 'sol-star',
          semi_major_axis: 10.0, // AU
          eccentricity: 0.9, // Highly eccentric
          inclination: 45,
          orbital_period: 3162, // ~31.6 years
        },
      };
      
      const sol = createSolarSystemTestData()[0]; // Get the star
      const objects = [sol, comet];
      
      const mechanics = calculateSystemOrbitalMechanics(objects, 'realistic');
      const cometData = mechanics.get('test-comet')!;
      
      // Should have valid orbital distance
      expect(cometData.orbitDistance).toBeGreaterThan(0);
      
      // Calculate periapsis and apoapsis distances
      const periapsis = comet.orbit!.semi_major_axis! * (1 - comet.orbit!.eccentricity!);
      const apoapsis = comet.orbit!.semi_major_axis! * (1 + comet.orbit!.eccentricity!);
      
      expect(periapsis).toBeCloseTo(1.0, 1); // ~1 AU at closest
      expect(apoapsis).toBeCloseTo(19.0, 1); // ~19 AU at farthest
      
      // Orbital distance should be between these extremes
      const scaledPeriapsis = periapsis * 8.0; // realistic mode scaling
      const scaledApoapsis = apoapsis * 8.0;
      
      expect(cometData.orbitDistance!).toBeGreaterThanOrEqual(scaledPeriapsis);
      expect(cometData.orbitDistance!).toBeLessThanOrEqual(scaledApoapsis);
    });

    it('validates minimum and maximum orbital distances', () => {
      const objects = createSolarSystemTestData();
      const mechanics = calculateSystemOrbitalMechanics(objects, 'realistic');
      
      // Find closest and farthest objects
      const orbitingObjects = objects
        .filter(obj => obj.orbit?.parent === 'sol-star')
        .map(obj => ({
          id: obj.id,
          distance: mechanics.get(obj.id)!.orbitDistance || 0,
        }))
        .sort((a, b) => a.distance - b.distance);
      
      const closest = orbitingObjects[0];
      const farthest = orbitingObjects[orbitingObjects.length - 1];
      
      // Mercury should be closest, Jupiter should be farthest
      expect(closest.id).toBe('mercury');
      expect(farthest.id).toBe('jupiter');
      
      // Validate reasonable distance ranges
      expect(closest.distance).toBeGreaterThan(1.0); // At least 1 unit from star
      expect(farthest.distance).toBeLessThan(100.0); // Not unreasonably far
      
      // Validate distance spread is reasonable
      const distanceRatio = farthest.distance / closest.distance;
      expect(distanceRatio).toBeGreaterThan(10); // Significant spread
      expect(distanceRatio).toBeLessThan(20); // But not excessive
    });
  });
}) 