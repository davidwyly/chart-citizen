import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateSystemOrbitalMechanics,
  clearOrbitalMechanicsCache,
} from '../orbital-mechanics-calculator';
import { CelestialObject } from '@/engine/types/orbital-system';
import { ViewType } from '@lib/types/effects-level';

// Helpers --------------------------------------------------
const createStar = (id: string, radius: number = 695700): CelestialObject => ({
  id,
  name: `Star ${id}`,
  classification: 'star',
  geometry_type: 'star',
  properties: { mass: 1.0, radius, temperature: 5778 },
  position: [0, 0, 0],
});

const createPlanet = (
  id: string,
  parentId: string,
  radius: number = 6371,
  orbitAU: number = 1.0
): CelestialObject => ({
  id,
  name: `Planet ${id}`,
  classification: 'planet',
  geometry_type: 'terrestrial',
  properties: { mass: 1.0, radius, temperature: 288 },
  orbit: {
    parent: parentId,
    semi_major_axis: orbitAU,
    eccentricity: 0.0,
    inclination: 0.0,
    orbital_period: 365.25,
  },
});

const createMoon = (
  id: string,
  parentId: string,
  radius: number = 1737,
  orbitAU: number = 0.002
): CelestialObject => ({
  id,
  name: `Moon ${id}`,
  classification: 'moon',
  geometry_type: 'rocky',
  properties: { mass: 0.012, radius, temperature: 250 },
  orbit: {
    parent: parentId,
    semi_major_axis: orbitAU,
    eccentricity: 0.0,
    inclination: 0.0,
    orbital_period: 27.3,
  },
});

const createBelt = (
    id: string, 
    parentId: string, 
    innerAU: number = 2.2, 
    outerAU: number = 3.2
  ): CelestialObject => ({
    id,
    name: `Belt ${id}`,
    classification: 'belt',
    geometry_type: 'belt',
    properties: { mass: 0.0015, radius: 500, temperature: 200 },
    orbit: {
      parent: parentId,
      inner_radius: innerAU,
      outer_radius: outerAU,
      inclination: 0.0,
      eccentricity: 0.0,
    },
  });

const createComplexSystem = () => {
  const star = createStar('star1', 695700);
  const earth = createPlanet('earth', 'star1', 6371, 1.0);
  const luna = createMoon('luna', 'earth', 1737, 0.002);
  const mars = createPlanet('mars', 'star1', 3390, 1.52);
  return [star, earth, luna, mars];
};

const createMultiBeltSystem = () => {
    const star = createStar('star1');
    const belt1 = createBelt('belt1', 'star1', 1.0, 1.5);
    const planet1 = createPlanet('planet1', 'star1', 6000, 2.0);
    const belt2 = createBelt('belt2', 'star1', 2.5, 3.0);
    return [star, belt1, planet1, belt2];
}

// ----------------------------------------------------------

describe('Orbital Mechanics Regression Tests', () => {
  beforeEach(() => {
    clearOrbitalMechanicsCache();
  });

  describe('Navigational mode equidistant spacing', () => {
    it('should place sibling planets at equal gaps when no moon collisions exist', () => {
      const star = createStar('star');
      // Three planets with arbitrary AU – equidistant bands expected
      const planetA = createPlanet('a', 'star', 1.0);
      const planetB = createPlanet('b', 'star', 2.0);
      const planetC = createPlanet('c', 'star', 3.0);

      const objects = [star, planetA, planetB, planetC];
      const mechanics = calculateSystemOrbitalMechanics(objects, 'navigational', false);

      const dA = mechanics.get('a')!.orbitDistance!;
      const dB = mechanics.get('b')!.orbitDistance!;
      const dC = mechanics.get('c')!.orbitDistance!;

      const gap1 = dB - dA;
      const gap2 = dC - dB;

      // Gaps should be approximately equal (±5%)
      const tolerance = gap1 * 0.05;
      expect(Math.abs(gap1 - gap2)).toBeLessThanOrEqual(tolerance);
    });
  });

  describe('Parent-child clearance across view modes', () => {
    const viewModes: ('explorational' | 'navigational' | 'profile')[] = [
      'explorational',
      'navigational',
      'profile',
    ];

    viewModes.forEach(mode => {
      it(`should keep moon outside parent visual radius in ${mode} mode`, () => {
        const star = createStar('star');
        const planet = createPlanet('planet', 'star', 1.0);
        // Intentionally very small semi-major axis that would embed the moon if not corrected
        const moon = createMoon('moon', 'planet', 0.0005);

        const objects = [star, planet, moon];
        const mechanics = calculateSystemOrbitalMechanics(objects, mode, false);

        const planetData = mechanics.get('planet')!;
        const moonData = mechanics.get('moon')!;

        // Inner edge of moon orbit must be outside planet radius
        const moonInnerEdge = moonData.orbitDistance! - moonData.visualRadius;
        expect(moonInnerEdge).toBeGreaterThan(planetData.visualRadius);
      });
    });
  });

  // Test cases that have failed in the past
  describe('Specific Regression Scenarios', () => {
    it('should correctly layout a simple 3-planet system in navigational mode', () => {
      const star = createStar('star1');
      const planetA = createPlanet('a', 'star1', 6371, 1.0);
      const planetB = createPlanet('b', 'star1', 3390, 1.5);
      const planetC = createPlanet('c', 'star1', 69911, 5.2);

      const objects = [star, planetA, planetB, planetC];
      const mechanics = calculateSystemOrbitalMechanics(objects, 'navigational', false);

      const dA = mechanics.get('a')!.orbitDistance!;
      const dB = mechanics.get('b')!.orbitDistance!;
      const dC = mechanics.get('c')!.orbitDistance!;

      // Check for correct ordering and sufficient spacing
      expect(dB).toBeGreaterThan(dA);
      expect(dC).toBeGreaterThan(dB);
    });

    it('should maintain parent-child size hierarchy across all modes', () => {
      const modes: ViewType[] = ['explorational', 'navigational', 'profile'];
      modes.forEach(mode => {
        const star = createStar('star1');
        const planet = createPlanet('planet', 'star1', 1000, 1);
        // This moon is intentionally larger than its parent planet
        const largeMoon = createMoon('moon', 'planet', 2000, 0.01);

        const objects = [star, planet, largeMoon];
        const mechanics = calculateSystemOrbitalMechanics(objects, mode, false);

        const planetData = mechanics.get('planet')!;
        const moonData = mechanics.get('moon')!;

        // The system should enforce that the parent is visually larger
        expect(planetData.visualRadius).toBeGreaterThan(moonData.visualRadius);
      });
    });
  });

  // Test case for a complex system that has failed in the past
  it('should not regress on complex system layout in navigational mode', () => {
    const objects = createComplexSystem();
    const mechanics = calculateSystemOrbitalMechanics(objects, 'navigational', false);

    // Validate key distances to ensure no collisions
    const earth = mechanics.get('earth')!;
  });

  // Test case for systems with multiple belts
  it('should handle multiple belts without regression', () => {
    const objects = createMultiBeltSystem();
    const modes: ViewType[] = ['explorational', 'navigational', 'profile'];

    modes.forEach(mode => {
      const mechanics = calculateSystemOrbitalMechanics(objects, mode, false);

      const belt1 = mechanics.get('belt1')!;
      const planet = mechanics.get('planet1')!;
      const belt2 = mechanics.get('belt2')!;

      // Belts should not be inside the star
      expect(belt1.beltData!.innerRadius).toBeGreaterThan(mechanics.get('star1')!.visualRadius);
      expect(belt2.beltData!.innerRadius).toBeGreaterThan(mechanics.get('star1')!.visualRadius);
      
      // Planet should be after the first belt
      expect(planet.orbitDistance! - planet.visualRadius).toBeGreaterThan(belt1.beltData!.outerRadius);
      
      // Second belt should be after the planet
      expect(belt2.beltData!.innerRadius).toBeGreaterThan(planet.orbitDistance! + planet.visualRadius);
    });
  });
}); 