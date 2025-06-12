import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSystemStore } from '../../src/core/mode-system/mode-system';
import { systemLoader } from '../../lib/system-loader';
import { SystemData } from '../../lib/system-loader';

// Test data
const mockSolSystem: SystemData = {
  id: 'sol',
  name: 'Sol System',
  description: 'Our solar system',
  barycenter: [0, 0, 0],
  stars: [
    {
      id: 'sol-star',
      catalog_ref: 'g2v-main-sequence',
      name: 'Sol',
      position: [0, 0, 0]
    }
  ],
  planets: [
    {
      id: 'earth',
      catalog_ref: 'earth',
      name: 'Earth',
      position: [1, 0, 0],
      orbit: {
        parent: 'sol-star',
        semi_major_axis: 1,
        eccentricity: 0.0167,
        inclination: 0,
        orbital_period: 1
      }
    }
  ],
  moons: [
    {
      id: 'luna',
      catalog_ref: 'luna',
      name: 'Luna',
      position: [1.00257, 0, 0],
      orbit: {
        parent: 'earth',
        semi_major_axis: 0.00257,
        eccentricity: 0.0549,
        inclination: 5.145,
        orbital_period: 0.0748
      }
    }
  ],
  belts: [
    {
      id: 'main-belt',
      catalog_ref: 'main-belt',
      name: 'Main Asteroid Belt',
      position: [2.7, 0, 0],
      orbit: {
        parent: 'sol-star',
        semi_major_axis: 2.7,
        eccentricity: 0.1,
        inclination: 0,
        orbital_period: 4.6
      }
    }
  ],
  jump_points: [
    {
      id: 'sol-alpha-centauri',
      name: 'Sol - Alpha Centauri',
      position: [10, 0, 0],
      destination: 'alpha-centauri',
      status: 'active'
    }
  ],
  lighting: {
    primary_star: 'sol-star',
    ambient_level: 0.1,
    stellar_influence_radius: 100
  }
};

describe('System Validation', () => {
  beforeEach(() => {
    useSystemStore.getState().reset();
  });

  it('should validate required fields', () => {
    const checkFields = (obj: any, fields: string[]) => {
      fields.forEach(field => {
        expect(obj).toHaveProperty(field);
        expect(obj[field]).not.toBeUndefined();
      });
    };

    // Check star fields
    mockSolSystem.stars.forEach(star => {
      checkFields(star, ['id', 'catalog_ref', 'name', 'position']);
    });

    // Check planet fields
    mockSolSystem.planets?.forEach(planet => {
      checkFields(planet, ['id', 'catalog_ref', 'name', 'position', 'orbit']);
      checkFields(planet.orbit, ['parent', 'semi_major_axis', 'eccentricity', 'inclination', 'orbital_period']);
    });

    // Check moon fields
    mockSolSystem.moons?.forEach(moon => {
      checkFields(moon, ['id', 'catalog_ref', 'name', 'position', 'orbit']);
      checkFields(moon.orbit, ['parent', 'semi_major_axis', 'eccentricity', 'inclination', 'orbital_period']);
    });

    // Check belt fields
    mockSolSystem.belts?.forEach(belt => {
      checkFields(belt, ['id', 'catalog_ref', 'name', 'position', 'orbit']);
      checkFields(belt.orbit, ['parent', 'semi_major_axis', 'eccentricity', 'inclination', 'orbital_period']);
    });

    // Check jump point fields
    mockSolSystem.jump_points?.forEach(jumpPoint => {
      checkFields(jumpPoint, ['id', 'name', 'position', 'destination', 'status']);
    });
  });

  it('should validate orbit parameters', () => {
    const checkOrbit = (obj: any) => {
      expect(obj.orbit.semi_major_axis).toBeGreaterThan(0);
      expect(obj.orbit.eccentricity).toBeGreaterThanOrEqual(0);
      expect(obj.orbit.eccentricity).toBeLessThan(1);
      expect(obj.orbit.inclination).toBeGreaterThanOrEqual(0);
      expect(obj.orbit.inclination).toBeLessThanOrEqual(180);
      expect(obj.orbit.orbital_period).toBeGreaterThan(0);
    };

    mockSolSystem.planets?.forEach(checkOrbit);
    mockSolSystem.moons?.forEach(checkOrbit);
    mockSolSystem.belts?.forEach(checkOrbit);
  });

  it('should validate parent references', () => {
    const checkParent = (obj: any) => {
      const getById = (id: string) =>
        mockSolSystem.stars.find(o => o.id === id) ||
        mockSolSystem.planets?.find(o => o.id === id) ||
        mockSolSystem.moons?.find(o => o.id === id) ||
        mockSolSystem.belts?.find(o => o.id === id);

      const parent = getById(obj.orbit.parent);
      expect(parent).toBeDefined();
      expect(parent).not.toBeNull();
    };

    mockSolSystem.planets?.forEach(checkParent);
    mockSolSystem.moons?.forEach(checkParent);
    mockSolSystem.belts?.forEach(checkParent);
  });

  it('should prevent self-orbiting objects', () => {
    const checkNoSelfOrbit = (obj: any) => {
      expect(obj.orbit.parent).not.toBe(obj.id);
    };

    mockSolSystem.planets?.forEach(checkNoSelfOrbit);
    mockSolSystem.moons?.forEach(checkNoSelfOrbit);
    mockSolSystem.belts?.forEach(checkNoSelfOrbit);
  });

  it('should validate orbital positions', () => {
    const getById = (id: string) =>
      mockSolSystem.stars.find(o => o.id === id) ||
      mockSolSystem.planets?.find(o => o.id === id) ||
      mockSolSystem.moons?.find(o => o.id === id) ||
      mockSolSystem.belts?.find(o => o.id === id);

    const dist = (a: [number, number, number], b: [number, number, number]) => 
      Math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2 + (a[2]-b[2])**2);

    const checkOrbitPos = (obj: any) => {
      const parent = getById(obj.orbit.parent);
      if (!parent || !parent.position) return;

      const distance = dist(obj.position as [number, number, number], parent.position as [number, number, number]);
      const expectedDistance = obj.orbit.semi_major_axis;
      const tolerance = expectedDistance * 0.1; // 10% tolerance

      expect(Math.abs(distance - expectedDistance)).toBeLessThanOrEqual(tolerance);
    };

    mockSolSystem.planets?.forEach(checkOrbitPos);
    mockSolSystem.moons?.forEach(checkOrbitPos);
    mockSolSystem.belts?.forEach(checkOrbitPos);
  });

  it('should validate required fields in system data', () => {
    const system: SystemData = {
      stars: [{ id: 'star1', type: 'star', position: { x: 0, y: 0, z: 0 }, properties: { radius: 100 } }],
      planets: [{ id: 'planet1', type: 'planet', position: { x: 1, y: 0, z: 0 }, properties: { radius: 50 } }],
      moons: [{ id: 'moon1', type: 'moon', position: { x: 1.1, y: 0, z: 0 }, properties: { radius: 10 }, orbit: { parent: 'planet1' } }],
    };
    expect(system.stars[0]).toHaveProperty('id');
    expect(system.planets[0]).toHaveProperty('id');
    expect(system.moons[0]).toHaveProperty('id');
  });
}); 