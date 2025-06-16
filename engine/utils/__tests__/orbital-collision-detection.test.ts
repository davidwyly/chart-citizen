import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateSystemOrbitalMechanics,
  clearOrbitalMechanicsCache,
} from '../orbital-mechanics-calculator';
import { CelestialObject, isOrbitData, isBeltOrbitData } from '@/engine/types/orbital-system';
import { ViewType } from '@lib/types/effects-level';

// Helper functions to create test objects
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
  orbitAU: number = 1.0,
  geometryType: 'terrestrial' | 'gas_giant' = 'terrestrial'
): CelestialObject => ({
  id,
  name: `Planet ${id}`,
  classification: 'planet',
  geometry_type: geometryType,
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

// Helper to calculate the absolute position of an object from the system center
function calculateAbsolutePosition(
  objectId: string,
  objects: CelestialObject[],
  mechanics: Map<string, any>
): number {
  const obj = objects.find(o => o.id === objectId);
  if (!obj || !obj.orbit?.parent) {
    return 0; // Root object (star) is at position 0
  }

  const parentAbsolutePosition = calculateAbsolutePosition(obj.orbit.parent, objects, mechanics);
  const mechanicsData = mechanics.get(objectId);
  
  if (!mechanicsData) return parentAbsolutePosition;

  // For belts, use centerRadius; for regular objects, use orbitDistance
  const objectOrbitDistance = mechanicsData.beltData 
    ? mechanicsData.beltData.centerRadius 
    : mechanicsData.orbitDistance || 0;

  return parentAbsolutePosition + objectOrbitDistance;
}

// Helper to calculate the effective radius of an object's system (including all moons)
function calculateSystemEffectiveRadius(
  objectId: string,
  objects: CelestialObject[],
  mechanics: Map<string, any>
): { innerRadius: number; outerRadius: number } {
  const mechanicsData = mechanics.get(objectId);
  if (!mechanicsData) return { innerRadius: 0, outerRadius: 0 };

  const objectVisualRadius = mechanicsData.visualRadius;
  
  // Handle belts specially
  if (mechanicsData.beltData) {
    const beltWidth = mechanicsData.beltData.outerRadius - mechanicsData.beltData.innerRadius;
    return {
      innerRadius: beltWidth / 2, // Half the belt width inward from center
      outerRadius: beltWidth / 2,  // Half the belt width outward from center
    };
  }

  // Find all direct children (moons) of this object
  const children = objects.filter(child => child.orbit?.parent === objectId);
  
  if (children.length === 0) {
    // No children, just the object's own radius
    return { innerRadius: objectVisualRadius, outerRadius: objectVisualRadius };
  }

  // Find the innermost and outermost edges of the moon system
  let innermostEdge = objectVisualRadius; // At minimum, the object's own radius
  let outermostEdge = objectVisualRadius;

  for (const child of children) {
    const childMechanics = mechanics.get(child.id);
    if (!childMechanics) continue;

    const childOrbitDistance = childMechanics.orbitDistance || 0;
    const childVisualRadius = childMechanics.visualRadius || 0;

    // Calculate the child's inner and outer edges relative to the parent
    const childInnerEdge = Math.max(childOrbitDistance - childVisualRadius, 0);
    const childOuterEdge = childOrbitDistance + childVisualRadius;

    // Recursively calculate the child's own system radius (in case moons have sub-moons)
    const childSystemRadius = calculateSystemEffectiveRadius(child.id, objects, mechanics);
    const childSystemOuterEdge = childOrbitDistance + childSystemRadius.outerRadius;

    innermostEdge = Math.min(innermostEdge, childInnerEdge);
    outermostEdge = Math.max(outermostEdge, childSystemOuterEdge);
  }

  return { innerRadius: innermostEdge, outerRadius: outermostEdge };
}

// Helper to validate that two objects don't collide
function validateNoCollision(
  object1Id: string,
  object2Id: string,
  objects: CelestialObject[],
  mechanics: Map<string, any>,
  viewMode: ViewType
): { hasCollision: boolean; details: string; gap: number } {
  const obj1 = objects.find(o => o.id === object1Id);
  const obj2 = objects.find(o => o.id === object2Id);
  
  if (!obj1 || !obj2) {
    return { hasCollision: false, details: 'Objects not found', gap: 0 };
  }

  // Check if this is a parent-child relationship
  const isParentChild = (obj1.orbit?.parent === object2Id) || (obj2.orbit?.parent === object1Id);
  
  if (isParentChild) {
    // Parent-child collision: child should orbit outside parent's visual radius
    const [parent, child] = obj1.orbit?.parent === object2Id 
      ? [obj2, obj1] 
      : [obj1, obj2];
    
    const parentData = mechanics.get(parent.id);
    const childData = mechanics.get(child.id);
    
    if (!parentData || !childData) {
      return { hasCollision: false, details: 'Mechanics data not found', gap: 0 };
    }
    
    const parentVisualRadius = parentData.visualRadius;
    const childOrbitDistance = childData.orbitDistance || 0;
    const childVisualRadius = childData.visualRadius;
    
    // The child's inner edge (closest point to parent) should be outside parent's visual radius
    const childInnerEdge = childOrbitDistance - childVisualRadius;
    const gap = childInnerEdge - parentVisualRadius;
    const hasCollision = gap < 0;
    
    const details = `${viewMode} mode: ${parent.id} visual radius ${parentVisualRadius.toFixed(3)}, ${child.id} inner edge at ${childInnerEdge.toFixed(3)}, gap: ${gap.toFixed(3)}`;
    
    return { hasCollision, details, gap };
  } else {
    // Sibling collision: two objects orbiting the same parent should not overlap
    const obj1AbsolutePos = calculateAbsolutePosition(object1Id, objects, mechanics);
    const obj2AbsolutePos = calculateAbsolutePosition(object2Id, objects, mechanics);
    
    const obj1SystemRadius = calculateSystemEffectiveRadius(object1Id, objects, mechanics);
    const obj2SystemRadius = calculateSystemEffectiveRadius(object2Id, objects, mechanics);

    // Determine which object is closer to the center
    const [innerObj, outerObj, innerPos, outerPos, innerRadius, outerRadius] = 
      obj1AbsolutePos < obj2AbsolutePos 
        ? [object1Id, object2Id, obj1AbsolutePos, obj2AbsolutePos, obj1SystemRadius, obj2SystemRadius]
        : [object2Id, object1Id, obj2AbsolutePos, obj1AbsolutePos, obj2SystemRadius, obj1SystemRadius];

    // Calculate the outer edge of the inner object's system
    const innerOuterEdge = innerPos + innerRadius.outerRadius;
    
    // Calculate the inner edge of the outer object's system  
    const outerInnerEdge = outerPos - outerRadius.innerRadius;

    // Check for collision
    const gap = outerInnerEdge - innerOuterEdge;
    const hasCollision = gap < 0;

    const details = `${viewMode} mode: ${innerObj} outer edge at ${innerOuterEdge.toFixed(3)}, ${outerObj} inner edge at ${outerInnerEdge.toFixed(3)}, gap: ${gap.toFixed(3)}`;

    return { hasCollision, details, gap };
  }
}

// Test data generators
const createSimpleSystem = () => {
  const star = createStar('star1', 695700);
  const planet1 = createPlanet('planet1', 'star1', 6371, 1.0);
  const planet2 = createPlanet('planet2', 'star1', 6371, 2.0);
  return [star, planet1, planet2];
};

const createSystemWithMoons = () => {
  const star = createStar('star1', 695700);
  const earth = createPlanet('earth', 'star1', 6371, 1.0);
  const luna = createMoon('luna', 'earth', 1737, 0.002);
  const mars = createPlanet('mars', 'star1', 3390, 1.52);
  const phobos = createMoon('phobos', 'mars', 22, 0.00006);
  const deimos = createMoon('deimos', 'mars', 12, 0.00016);
  return [star, earth, luna, mars, phobos, deimos];
};

const createComplexSystem = () => {
  const star = createStar('star1', 695700);
  const innerPlanet = createPlanet('inner', 'star1', 2440, 0.4); // Mercury-like
  const earthLike = createPlanet('earth', 'star1', 6371, 1.0);
  const earthMoon = createMoon('moon', 'earth', 1737, 0.002);
  const gasGiant = createPlanet('jupiter', 'star1', 69911, 5.2, 'gas_giant');
  const jupiterMoon1 = createMoon('io', 'jupiter', 1822, 0.003);
  const jupiterMoon2 = createMoon('europa', 'jupiter', 1561, 0.004);
  const jupiterMoon3 = createMoon('ganymede', 'jupiter', 2634, 0.007);
  const jupiterMoon4 = createMoon('callisto', 'jupiter', 2410, 0.013);
  const belt = createBelt('belt1', 'star1', 2.2, 3.2);
  const outerPlanet = createPlanet('saturn', 'star1', 58232, 9.5, 'gas_giant');
  const saturnMoon = createMoon('titan', 'saturn', 2574, 0.008);
  
  return [star, innerPlanet, earthLike, earthMoon, belt, gasGiant, 
          jupiterMoon1, jupiterMoon2, jupiterMoon3, jupiterMoon4, 
          outerPlanet, saturnMoon];
};

const createNestedMoonSystem = () => {
  const star = createStar('star1', 695700);
  const planet = createPlanet('planet1', 'star1', 25000, 3.0); // Large planet
  const innerMoon = createMoon('moon1', 'planet1', 1000, 0.001);
  const middleMoon = createMoon('moon2', 'planet1', 1500, 0.005);
  const outerMoon = createMoon('moon3', 'planet1', 800, 0.02);
  const veryOuterMoon = createMoon('moon4', 'planet1', 600, 0.1); // Very distant moon
  
  return [star, planet, innerMoon, middleMoon, outerMoon, veryOuterMoon];
};

describe('Comprehensive Orbital Collision Detection', () => {
  beforeEach(() => {
    clearOrbitalMechanicsCache();
  });

  const viewModes: ViewType[] = ['realistic', 'navigational', 'profile'];

  describe('Basic Parent-Child Collision Prevention', () => {
    viewModes.forEach(viewMode => {
      it(`should prevent planets from orbiting inside stars in ${viewMode} mode`, () => {
        const objects = createSimpleSystem();
        const mechanics = calculateSystemOrbitalMechanics(objects, viewMode, false);

        const starData = mechanics.get('star1')!;
        const planet1Data = mechanics.get('planet1')!;
        const planet2Data = mechanics.get('planet2')!;

        // Planets should be outside the star's visual radius
        expect(planet1Data.orbitDistance!).toBeGreaterThan(starData.visualRadius);
        expect(planet2Data.orbitDistance!).toBeGreaterThan(starData.visualRadius);

        // Validate using our collision detection helper
        const collision1 = validateNoCollision('star1', 'planet1', objects, mechanics, viewMode);
        const collision2 = validateNoCollision('star1', 'planet2', objects, mechanics, viewMode);

        expect(collision1.hasCollision).toBe(false);
        expect(collision2.hasCollision).toBe(false);

        if (collision1.hasCollision) console.error(collision1.details);
        if (collision2.hasCollision) console.error(collision2.details);
      });

      it(`should prevent moons from orbiting inside planets in ${viewMode} mode`, () => {
        const objects = createSystemWithMoons();
        const mechanics = calculateSystemOrbitalMechanics(objects, viewMode, false);

        // Check Earth-Luna system
        const earthData = mechanics.get('earth')!;
        const lunaData = mechanics.get('luna')!;
        expect(lunaData.orbitDistance!).toBeGreaterThan(earthData.visualRadius);

        // Check Mars-Phobos system
        const marsData = mechanics.get('mars')!;
        const phobosData = mechanics.get('phobos')!;
        expect(phobosData.orbitDistance!).toBeGreaterThan(marsData.visualRadius);

        // Check Mars-Deimos system
        const deimosData = mechanics.get('deimos')!;
        expect(deimosData.orbitDistance!).toBeGreaterThan(marsData.visualRadius);

        // Validate using collision detection helper
        const earthLunaCollision = validateNoCollision('earth', 'luna', objects, mechanics, viewMode);
        const marsPhobosCollision = validateNoCollision('mars', 'phobos', objects, mechanics, viewMode);
        const marsDeimosCollision = validateNoCollision('mars', 'deimos', objects, mechanics, viewMode);

        expect(earthLunaCollision.hasCollision).toBe(false);
        expect(marsPhobosCollision.hasCollision).toBe(false);
        expect(marsDeimosCollision.hasCollision).toBe(false);

        if (earthLunaCollision.hasCollision) console.error(earthLunaCollision.details);
        if (marsPhobosCollision.hasCollision) console.error(marsPhobosCollision.details);
        if (marsDeimosCollision.hasCollision) console.error(marsDeimosCollision.details);
      });
    });
  });

  describe('Sibling Object Collision Prevention', () => {
    viewModes.forEach(viewMode => {
      it(`should prevent planets from colliding with each other in ${viewMode} mode`, () => {
        const objects = createSystemWithMoons();
        const mechanics = calculateSystemOrbitalMechanics(objects, viewMode, false);

        // Earth and Mars should not collide (including their moon systems)
        const collision = validateNoCollision('earth', 'mars', objects, mechanics, viewMode);
        
        expect(collision.hasCollision).toBe(false);
        expect(collision.gap).toBeGreaterThan(0);

        if (collision.hasCollision) {
          console.error(`COLLISION DETECTED: ${collision.details}`);
        } else {
          console.log(`✓ ${collision.details}`);
        }
      });

      it(`should prevent moons from colliding with each other in ${viewMode} mode`, () => {
        const objects = createSystemWithMoons();
        const mechanics = calculateSystemOrbitalMechanics(objects, viewMode, false);

        // Phobos and Deimos should not collide
        const collision = validateNoCollision('phobos', 'deimos', objects, mechanics, viewMode);
        
        expect(collision.hasCollision).toBe(false);
        expect(collision.gap).toBeGreaterThan(0);

        if (collision.hasCollision) {
          console.error(`COLLISION DETECTED: ${collision.details}`);
        } else {
          console.log(`✓ ${collision.details}`);
        }
      });
    });
  });

  describe('Complex System Collision Prevention', () => {
    viewModes.forEach(viewMode => {
      it(`should prevent all collisions in complex multi-moon system in ${viewMode} mode`, () => {
        const objects = createComplexSystem();
        const mechanics = calculateSystemOrbitalMechanics(objects, viewMode, false);

        // Get all objects that orbit the star
        const starOrbiters = objects.filter(obj => obj.orbit?.parent === 'star1');
        
        // Check all pairs of star orbiters for collisions
        const collisions: string[] = [];
        
        for (let i = 0; i < starOrbiters.length; i++) {
          for (let j = i + 1; j < starOrbiters.length; j++) {
            const obj1 = starOrbiters[i];
            const obj2 = starOrbiters[j];
            
            const collision = validateNoCollision(obj1.id, obj2.id, objects, mechanics, viewMode);
            
            if (collision.hasCollision) {
              collisions.push(collision.details);
            } else {
              console.log(`✓ ${collision.details}`);
            }
          }
        }

        // Also check that all moons are outside their parent planets
        const moonParentPairs = [
          ['moon', 'earth'],
          ['io', 'jupiter'],
          ['europa', 'jupiter'],
          ['ganymede', 'jupiter'],
          ['callisto', 'jupiter'],
          ['titan', 'saturn'],
        ];

        for (const [moonId, planetId] of moonParentPairs) {
          const collision = validateNoCollision(planetId, moonId, objects, mechanics, viewMode);
          
          if (collision.hasCollision) {
            collisions.push(collision.details);
          } else {
            console.log(`✓ ${collision.details}`);
          }
        }

        // Report all collisions
        if (collisions.length > 0) {
          console.error(`COLLISIONS DETECTED in ${viewMode} mode:`);
          collisions.forEach(collision => console.error(`  - ${collision}`));
        }

        expect(collisions).toHaveLength(0);
      });

      it(`should handle belt objects correctly in ${viewMode} mode`, () => {
        const objects = createComplexSystem();
        const mechanics = calculateSystemOrbitalMechanics(objects, viewMode, false);

        const beltData = mechanics.get('belt1')!;
        expect(beltData.beltData).toBeDefined();

        // Belt should not collide with adjacent objects
        const earthBeltCollision = validateNoCollision('earth', 'belt1', objects, mechanics, viewMode);
        const beltJupiterCollision = validateNoCollision('belt1', 'jupiter', objects, mechanics, viewMode);

        expect(earthBeltCollision.hasCollision).toBe(false);
        expect(beltJupiterCollision.hasCollision).toBe(false);

        if (earthBeltCollision.hasCollision) console.error(earthBeltCollision.details);
        if (beltJupiterCollision.hasCollision) console.error(beltJupiterCollision.details);
      });
    });
  });

  describe('Nested Moon System Collision Prevention', () => {
    viewModes.forEach(viewMode => {
      it(`should prevent collisions in systems with many moons in ${viewMode} mode`, () => {
        const objects = createNestedMoonSystem();
        const mechanics = calculateSystemOrbitalMechanics(objects, viewMode, false);

        // Get all moons
        const moons = objects.filter(obj => obj.classification === 'moon');
        const collisions: string[] = [];

        // Check all moon pairs for collisions
        for (let i = 0; i < moons.length; i++) {
          for (let j = i + 1; j < moons.length; j++) {
            const moon1 = moons[i];
            const moon2 = moons[j];
            
            const collision = validateNoCollision(moon1.id, moon2.id, objects, mechanics, viewMode);
            
            if (collision.hasCollision) {
              collisions.push(collision.details);
            }
          }
        }

        // Check that all moons are outside the planet
        for (const moon of moons) {
          const collision = validateNoCollision('planet1', moon.id, objects, mechanics, viewMode);
          
          if (collision.hasCollision) {
            collisions.push(collision.details);
          }
        }

        // Report all collisions
        if (collisions.length > 0) {
          console.error(`COLLISIONS DETECTED in ${viewMode} mode:`);
          collisions.forEach(collision => console.error(`  - ${collision}`));
        }

        expect(collisions).toHaveLength(0);
      });
    });
  });

  describe('Edge Cases and Stress Tests', () => {
    viewModes.forEach(viewMode => {
      it(`should handle very close initial orbits without collisions in ${viewMode} mode`, () => {
        // Create planets with very close initial orbits to stress-test collision detection
        const star = createStar('star1', 695700);
        const planet1 = createPlanet('planet1', 'star1', 6371, 1.0);
        const planet2 = createPlanet('planet2', 'star1', 6371, 1.001); // Very close
        const planet3 = createPlanet('planet3', 'star1', 6371, 1.002); // Very close
        
        const objects = [star, planet1, planet2, planet3];
        const mechanics = calculateSystemOrbitalMechanics(objects, viewMode, false);

        const collisions: string[] = [];
        const planets = [planet1, planet2, planet3];

        // Check all planet pairs
        for (let i = 0; i < planets.length; i++) {
          for (let j = i + 1; j < planets.length; j++) {
            const collision = validateNoCollision(planets[i].id, planets[j].id, objects, mechanics, viewMode);
            
            if (collision.hasCollision) {
              collisions.push(collision.details);
            }
          }
        }

        expect(collisions).toHaveLength(0);
      });

      it(`should handle very large moons without collisions in ${viewMode} mode`, () => {
        // Create a system with a moon that's almost as large as its parent
        const star = createStar('star1', 695700);
        const planet = createPlanet('planet1', 'star1', 10000, 2.0);
        const largeMoon = createMoon('largeMoon', 'planet1', 8000, 0.01); // Very large moon
        
        const objects = [star, planet, largeMoon];
        const mechanics = calculateSystemOrbitalMechanics(objects, viewMode, false);

        const collision = validateNoCollision('planet1', 'largeMoon', objects, mechanics, viewMode);
        
        expect(collision.hasCollision).toBe(false);
        
        if (collision.hasCollision) {
          console.error(`COLLISION DETECTED: ${collision.details}`);
        }
      });

      it(`should handle systems with extreme size differences in ${viewMode} mode`, () => {
        // Create a system with extreme size differences
        const hugeStar = createStar('hugeStar', 10000000); // Very large star
        const tinyPlanet = createPlanet('tinyPlanet', 'hugeStar', 100, 0.1); // Very small planet, close orbit
        const normalPlanet = createPlanet('normalPlanet', 'hugeStar', 6371, 1.0);
        
        const objects = [hugeStar, tinyPlanet, normalPlanet];
        const mechanics = calculateSystemOrbitalMechanics(objects, viewMode, false);

        const starTinyCollision = validateNoCollision('hugeStar', 'tinyPlanet', objects, mechanics, viewMode);
        const starNormalCollision = validateNoCollision('hugeStar', 'normalPlanet', objects, mechanics, viewMode);
        const planetCollision = validateNoCollision('tinyPlanet', 'normalPlanet', objects, mechanics, viewMode);

        expect(starTinyCollision.hasCollision).toBe(false);
        expect(starNormalCollision.hasCollision).toBe(false);
        expect(planetCollision.hasCollision).toBe(false);
      });
    });
  });

  describe('Cross-View Mode Consistency', () => {
    it('should maintain collision-free arrangements across all view modes', () => {
      const objects = createComplexSystem();
      
      const realisticMechanics = calculateSystemOrbitalMechanics(objects, 'realistic', false);
      const navMechanics = calculateSystemOrbitalMechanics(objects, 'navigational', false);
      const profileMechanics = calculateSystemOrbitalMechanics(objects, 'profile', false);

      const mechanicsMap = {
        realistic: realisticMechanics,
        navigational: navMechanics,
        profile: profileMechanics,
      };

      // Get all objects that orbit the star
      const starOrbiters = objects.filter(obj => obj.orbit?.parent === 'star1');
      
      Object.entries(mechanicsMap).forEach(([viewMode, mechanics]) => {
        const collisions: string[] = [];
        
        // Check all pairs of star orbiters
        for (let i = 0; i < starOrbiters.length; i++) {
          for (let j = i + 1; j < starOrbiters.length; j++) {
            const obj1 = starOrbiters[i];
            const obj2 = starOrbiters[j];
            
            const collision = validateNoCollision(obj1.id, obj2.id, objects, mechanics, viewMode as ViewType);
            
            if (collision.hasCollision) {
              collisions.push(collision.details);
            }
          }
        }

        if (collisions.length > 0) {
          console.error(`COLLISIONS in ${viewMode}:`);
          collisions.forEach(c => console.error(`  - ${c}`));
        }

        expect(collisions).toHaveLength(0);
      });
    });
  });
}); 