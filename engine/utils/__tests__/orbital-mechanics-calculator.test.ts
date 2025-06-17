import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateSystemOrbitalMechanics,
  clearOrbitalMechanicsCache,
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
  beforeEach(() => {
    // Clear cache before each test to ensure clean state
    clearOrbitalMechanicsCache();
  });

  describe('calculateSystemOrbitalMechanics', () => {
    it('should calculate visual radii for all objects', () => {
      const objects = createSolarSystem();
      const mechanics = calculateSystemOrbitalMechanics(objects, 'explorational', false);
      
      // All objects should have visual radii
      for (const obj of objects) {
        const data = mechanics.get(obj.id);
        expect(data).toBeDefined();
        expect(data!.visualRadius).toBeGreaterThan(0);
      }
    });

    it('should maintain proper size proportions in explorational mode', () => {
      const objects = createSolarSystem();
      const mechanics = calculateSystemOrbitalMechanics(objects, 'explorational', false);
      
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
    });

    it('should prevent orbit intersections', () => {
      // Create a system with potential orbital conflicts
      const star = createTestStar('star1', 695700);
      const planet1 = createTestPlanet('planet1', 'star1', 6371, 1.0);
      const planet2 = createTestPlanet('planet2', 'star1', 6371, 1.1);  // Very close orbit
      const planet3 = createTestPlanet('planet3', 'star1', 20000, 1.05); // Larger planet in between
      
      const objects = [star, planet1, planet2, planet3];
      const mechanics = calculateSystemOrbitalMechanics(objects, 'explorational', false);
      
      const starData = mechanics.get('star1')!;
      const planet1Data = mechanics.get('planet1')!;
      const planet2Data = mechanics.get('planet2')!;
      const planet3Data = mechanics.get('planet3')!;
      
      // All planets should be outside the star
      expect(planet1Data.orbitDistance!).toBeGreaterThan(starData.visualRadius);
      expect(planet2Data.orbitDistance!).toBeGreaterThan(starData.visualRadius);
      expect(planet3Data.orbitDistance!).toBeGreaterThan(starData.visualRadius);
      
      // Planets should not intersect with each other
      const distances = [
        planet1Data.orbitDistance!,
        planet2Data.orbitDistance!, 
        planet3Data.orbitDistance!
      ].sort((a, b) => a - b);
      
      // Check that there's sufficient space between adjacent orbits
      for (let i = 1; i < distances.length; i++) {
        const gap = distances[i] - distances[i-1];
        expect(gap).toBeGreaterThan(0.1); // Minimum clearance
      }
    });

    it('should handle belt objects correctly', () => {
      const star = createTestStar('star1');
      const belt = createTestBelt('belt1', 'star1', 2.2, 3.2);
      const planet = createTestPlanet('planet1', 'star1', 6371, 4.0);
      
      const objects = [star, belt, planet];
      const mechanics = calculateSystemOrbitalMechanics(objects, 'explorational', false);
      
      const beltData = mechanics.get('belt1')!;
      const planetData = mechanics.get('planet1')!;
      
      // Belt should have belt data
      expect(beltData.beltData).toBeDefined();
      expect(beltData.beltData!.innerRadius).toBeLessThan(beltData.beltData!.outerRadius);
      
      // Planet should be placed after the belt
      expect(planetData.orbitDistance!).toBeGreaterThan(beltData.beltData!.outerRadius);
    });

    it('should account for moon systems when placing orbits', () => {
      // Create a comprehensive system: Earth with Luna, Mars with Phobos and Deimos, and Jupiter
      const star = createTestStar('star1', 695700);
      const earth = createTestPlanet('earth', 'star1', 6371, 1.0);
      const luna = createTestMoon('luna', 'earth', 1737, 0.002); // Moon orbits Earth
      const mars = createTestPlanet('mars', 'star1', 3390, 1.52); // Mars should clear Earth+Luna system
      const phobos = createTestMoon('phobos', 'mars', 22, 0.00006); // Phobos orbits Mars (very close)
      const deimos = createTestMoon('deimos', 'mars', 12, 0.00016); // Deimos orbits Mars (farther)
      const jupiter = createTestPlanet('jupiter', 'star1', 69911, 5.2); // Jupiter should clear Mars+moons system
      
      const objects = [star, earth, luna, mars, phobos, deimos, jupiter];
      const mechanics = calculateSystemOrbitalMechanics(objects, 'explorational', false);
      
      const earthData = mechanics.get('earth')!;
      const lunaData = mechanics.get('luna')!;
      const marsData = mechanics.get('mars')!;
      const phobosData = mechanics.get('phobos')!;
      const deimosData = mechanics.get('deimos')!;
      const jupiterData = mechanics.get('jupiter')!;
      
      // All should have valid orbital distances
      expect(earthData.orbitDistance).toBeGreaterThan(0);
      expect(lunaData.orbitDistance).toBeGreaterThan(0);
      expect(marsData.orbitDistance).toBeGreaterThan(0);
      expect(phobosData.orbitDistance).toBeGreaterThan(0);
      expect(deimosData.orbitDistance).toBeGreaterThan(0);
      expect(jupiterData.orbitDistance).toBeGreaterThan(0);
      
      // Calculate absolute distances from star for Earth's moon system
      const lunaAbsoluteDistance = earthData.orbitDistance! + lunaData.orbitDistance!;
      const lunaOuterEdge = lunaAbsoluteDistance + lunaData.visualRadius;
      
      // Mars should be placed beyond Earth's entire moon system
      expect(marsData.orbitDistance!).toBeGreaterThan(lunaOuterEdge);
      
      // Calculate absolute distances from star for Mars's moon system
      const phobosAbsoluteDistance = marsData.orbitDistance! + phobosData.orbitDistance!;
      const deimosAbsoluteDistance = marsData.orbitDistance! + deimosData.orbitDistance!;
      
      // Find Mars's outermost moon (should be Deimos)
      const marsOutermostMoonDistance = Math.max(
        phobosAbsoluteDistance + phobosData.visualRadius,
        deimosAbsoluteDistance + deimosData.visualRadius
      );
      
      // Jupiter should be placed beyond Mars's entire moon system
      expect(jupiterData.orbitDistance!).toBeGreaterThan(marsOutermostMoonDistance);
      
      // Verify proper clearance between systems
      const earthMarsGap = marsData.orbitDistance! - lunaOuterEdge;
      const marsJupiterGap = jupiterData.orbitDistance! - marsOutermostMoonDistance;
      
      expect(earthMarsGap).toBeGreaterThan(0.1); // Earth-Mars clearance
      expect(marsJupiterGap).toBeGreaterThanOrEqual(0.1); // Mars-Jupiter clearance
      
      // Verify moon ordering within each system
      expect(phobosData.orbitDistance!).toBeLessThan(deimosData.orbitDistance!); // Phobos closer than Deimos
    });

    it('should use fixed sizes for non-explorational modes', () => {
      const objects = createSolarSystem();
      const navigationalMechanics = calculateSystemOrbitalMechanics(objects, 'navigational', false);
      const profileMechanics = calculateSystemOrbitalMechanics(objects, 'profile', false);
      
      // Check that fixed sizes are used
      const navStarData = navigationalMechanics.get('star1')!;
      const navPlanetData = navigationalMechanics.get('earth')!;
      const navMoonData = navigationalMechanics.get('moon')!;
      
      expect(navStarData.visualRadius).toBe(2.0);  // Fixed star size
      expect(navPlanetData.visualRadius).toBe(1.2); // Fixed planet size
      expect(navMoonData.visualRadius).toBe(0.6);   // Fixed moon size
      
      const profStarData = profileMechanics.get('star1')!;
      const profPlanetData = profileMechanics.get('earth')!;
      const profMoonData = profileMechanics.get('moon')!;
      
      expect(profStarData.visualRadius).toBe(1.5);  // Fixed star size
      expect(profPlanetData.visualRadius).toBe(0.8); // Fixed planet size
      expect(profMoonData.visualRadius).toBe(0.4);   // Fixed moon size
    });

    it('should use proportional scaling for moons in explorational mode', () => {
      // Test the new proportional parent-child scaling feature
      const star = createTestStar('sol', 695700); // Sun
      const earth = createTestPlanet('earth', 'sol', 6371, 1.0); // Earth
      const luna = createTestMoon('luna', 'earth', 1737.4, 0.00257); // Luna
      const mars = createTestPlanet('mars', 'sol', 3389.5, 1.52); // Mars  
      const phobos = createTestMoon('phobos', 'mars', 22.2, 0.00006); // Phobos
      
      const objects = [star, earth, luna, mars, phobos];
      const mechanics = calculateSystemOrbitalMechanics(objects, 'explorational', false);
      
      const earthData = mechanics.get('earth')!;
      const lunaData = mechanics.get('luna')!;
      const marsData = mechanics.get('mars')!;
      const phobosData = mechanics.get('phobos')!;
      
      // Calculate visual ratios
      const earthLunaVisualRatio = lunaData.visualRadius / earthData.visualRadius;
      const marsPhobosVisualRatio = phobosData.visualRadius / marsData.visualRadius;
      
      // Calculate real physical ratios
      const earthLunaRealRatio = 1737.4 / 6371; // ≈ 0.27
      const marsPhobosRealRatio = 22.2 / 3389.5; // ≈ 0.007
      
      // Earth-Luna should have near-perfect proportional scaling
      expect(earthLunaVisualRatio).toBeCloseTo(earthLunaRealRatio, 2);
      
      // Phobos may hit minimum size constraints due to being extremely small
      // but should still be reasonably close or respect minimum visibility
      expect(phobosData.visualRadius).toBeGreaterThan(0.01); // Minimum visibility
      
      // Visual ratios should be proportional to real ratios
      expect(earthLunaVisualRatio).toBeCloseTo(earthLunaRealRatio, 1); // Luna should be proportional
      expect(marsPhobosVisualRatio).toBeGreaterThan(0.001); // Phobos should be visible
    });

    it('should handle memoization correctly for explorational mode', () => {
      const objects = createSolarSystem();
      const mechanics1 = calculateSystemOrbitalMechanics(objects, 'explorational', false);
      const mechanics2 = calculateSystemOrbitalMechanics(objects, 'explorational', false);
      expect(mechanics1).toBe(mechanics2);
    });

    it('should clear memoization cache', () => {
      const objects = createSolarSystem();
      const mechanics1 = calculateSystemOrbitalMechanics(objects, 'explorational', false);
      clearOrbitalMechanicsCache();
      const mechanics2 = calculateSystemOrbitalMechanics(objects, 'explorational', false);
      expect(mechanics1).not.toBe(mechanics2);
    });

    it('should respect moon orbital paths when placing subsequent planets in navigational mode', () => {
      const star = createTestStar('star1');
      const planet1 = createTestPlanet('planet1', 'star1', 6371, 1.0);
      const moonInner = createTestMoon('moonInner', 'planet1', 1737, 0.05); // Inner moon
      const moonOuter = createTestMoon('moonOuter', 'planet1', 1737, 0.4); // Outermost moon with sizable path
      const planet2 = createTestPlanet('planet2', 'star1', 6371, 1.05); // Initially very close to planet1

      const objects = [star, planet1, moonInner, moonOuter, planet2];
      const mechanics = calculateSystemOrbitalMechanics(objects, 'navigational', false);

      const planet1Data = mechanics.get('planet1')!;
      const moonOuterData = mechanics.get('moonOuter')!;
      const planet2Data = mechanics.get('planet2')!;

      // Calculate the outer edge of planet1's moon system
      const moonOuterAbsolute = planet1Data.orbitDistance! + moonOuterData.orbitDistance!;
      const moonOuterEdge = moonOuterAbsolute + moonOuterData.visualRadius;

      // Planet2 must be beyond the outer edge plus safety margin (0.1)
      expect(planet2Data.orbitDistance!).toBeGreaterThan(moonOuterEdge);
    });

    it('should ensure consistent object scaling across different view modes', () => {
      const objects = createSolarSystem();
      const explorationalMechanics = calculateSystemOrbitalMechanics(objects, 'explorational', false);
      const navigationalMechanics = calculateSystemOrbitalMechanics(objects, 'navigational', false);
      const profileMechanics = calculateSystemOrbitalMechanics(objects, 'profile', false);

      const starExplorational = explorationalMechanics.get('star1')!;
      const starNavigational = navigationalMechanics.get('star1')!;
      const starProfile = profileMechanics.get('star1')!;

      // Star sizes should differ based on view mode config
      expect(starExplorational.visualRadius).not.toBeCloseTo(starNavigational.visualRadius);
      expect(starNavigational.visualRadius).not.toBeCloseTo(starProfile.visualRadius);
      expect(starExplorational.visualRadius).not.toBeCloseTo(starProfile.visualRadius);

      // Confirm specific fixed sizes for navigational and profile modes
      expect(starNavigational.visualRadius).toBe(2.0);
      expect(starProfile.visualRadius).toBe(1.5);
    });

    it('should correctly calculate proportional scaling for moons in explorational mode', () => {
      const star = createTestStar('star1');
      const earth = createTestPlanet('earth', 'star1', 6371, 1.0);
      const luna = createTestMoon('luna', 'earth', 1737, 0.002);
      const objects = [star, earth, luna];

      const mechanics = calculateSystemOrbitalMechanics(objects, 'explorational', false);

      const earthData = mechanics.get('earth')!;
      const lunaData = mechanics.get('luna')!;

      // Luna's visual radius should be proportional to Earth's visual radius in explorational mode
      const expectedProportionalRadius = earthData.visualRadius * (1737 / 6371);
      expect(lunaData.visualRadius).toBeCloseTo(expectedProportionalRadius, 2);
    });

    it('should handle an empty system gracefully', () => {
      const mechanics = calculateSystemOrbitalMechanics([], 'explorational', false);
      expect(mechanics.size).toBe(0);
    });

    it('should re-calculate if isPaused changes', () => {
      const objects = createSolarSystem();
      const mechanics1 = calculateSystemOrbitalMechanics(objects, 'explorational', false);
      const mechanics2 = calculateSystemOrbitalMechanics(objects, 'explorational', true);
      expect(mechanics1).not.toBe(mechanics2);
    });
  });

  describe('edge cases', () => {
    it('should handle empty object list', () => {
      const mechanics = calculateSystemOrbitalMechanics([], 'explorational', false);
      expect(mechanics.size).toBe(0);
    });

    it('should handle objects with zero or negative radius', () => {
      const star = createTestStar('star1', 0);
      const planet = createTestPlanet('planet1', 'star1', -100, 1.0);
      
      const objects = [star, planet];
      const mechanics = calculateSystemOrbitalMechanics(objects, 'explorational', false);
      
      // Should still calculate reasonable visual radii
      expect(mechanics.get('star1')?.visualRadius).toBeGreaterThan(0);
      expect(mechanics.get('planet1')?.visualRadius).toBeGreaterThan(0);
    });

    it('should handle objects without orbits', () => {
      const star = createTestStar('star1');
      const freeFloating: CelestialObject = {
        id: 'floating',
        name: 'Free Floating Object',
        classification: 'planet',
        geometry_type: 'terrestrial',
        properties: { mass: 1, radius: 6371, temperature: 288 },
        position: [10, 0, 0],
      };
      
      const objects = [star, freeFloating];
      const mechanics = calculateSystemOrbitalMechanics(objects, 'explorational', false);
      
      // Both should have visual radii
      expect(mechanics.get('star1')?.visualRadius).toBeGreaterThan(0);
      expect(mechanics.get('floating')?.visualRadius).toBeGreaterThan(0);
      
      // Free floating object should not have orbit distance
      expect(mechanics.get('floating')?.orbitDistance).toBeUndefined();
    });
  });
}); 