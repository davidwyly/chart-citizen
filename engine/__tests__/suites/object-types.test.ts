import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSystemStore } from '@/engine/core/mode-system/mode-system';
import type { SystemData, CelestialObject } from '@/engine/types/mode';

describe('Object Types', () => {
  let store: ReturnType<typeof useSystemStore.getState>;

  beforeEach(() => {
    store = useSystemStore.getState();
    store.reset();
    vi.clearAllMocks();
  });

  const testSystemData: SystemData = {
    name: 'Rocky Planet System',
    objects: [
      {
        id: 'star-1',
        type: 'star',
        name: 'G2V Star',
        position: [0, 0, 0],
        radius: 1,
        mass: 1
      },
      {
        id: 'planet-1',
        type: 'planet',
        name: 'Rocky Planet',
        position: [5, 0, 0],
        radius: 0.5,
        mass: 0.5,
        orbit: {
          parentId: 'star-1',
          semiMajorAxis: 5,
          eccentricity: 0.1,
          inclination: 0
        }
      },
      {
        id: 'moon-1',
        type: 'moon',
        name: 'Moon',
        position: [5.1, 0, 0],
        radius: 0.1,
        mass: 0.01,
        orbit: {
          parentId: 'planet-1',
          semiMajorAxis: 0.1,
          eccentricity: 0.05,
          inclination: 0
        }
      },
      {
        id: 'jump-point-1',
        type: 'jump-point',
        name: 'Jump Point',
        position: [10, 0, 0],
        radius: 0.05,
        mass: 0
      }
    ]
  };

  it('should handle system data correctly', () => {
    store.systemData = testSystemData;
    expect(store.systemData).toBeDefined();
    expect(store.systemData?.name).toBe('Rocky Planet System');
    expect(store.systemData?.objects).toHaveLength(4);
    expect(store.systemData?.objects.find(obj => obj.type === 'star')).toBeDefined();
    expect(store.systemData?.objects.find(obj => obj.type === 'planet')).toBeDefined();
    expect(store.systemData?.objects.find(obj => obj.type === 'moon')).toBeDefined();
    expect(store.systemData?.objects.find(obj => obj.type === 'jump-point')).toBeDefined();
  });

  it('should handle object properties correctly', () => {
    store.systemData = testSystemData;
    const star = store.systemData?.objects.find(obj => obj.type === 'star');
    expect(star?.position).toEqual([0, 0, 0]);
    expect(star?.radius).toBe(1);
    expect(star?.mass).toBe(1);

    const planet = store.systemData?.objects.find(obj => obj.type === 'planet');
    expect(planet?.orbit?.parentId).toBe('star-1');
    expect(planet?.orbit?.semiMajorAxis).toBe(5);
    expect(planet?.orbit?.eccentricity).toBe(0.1);
    expect(planet?.orbit?.inclination).toBe(0);

    const moon = store.systemData?.objects.find(obj => obj.type === 'moon');
    expect(moon?.orbit?.parentId).toBe('planet-1');
    expect(moon?.orbit?.semiMajorAxis).toBe(0.1);
    expect(moon?.orbit?.eccentricity).toBe(0.05);
    expect(moon?.orbit?.inclination).toBe(0);

    const jumpPoint = store.systemData?.objects.find(obj => obj.type === 'jump-point');
    expect(jumpPoint?.position).toEqual([10, 0, 0]);
    expect(jumpPoint?.radius).toBe(0.05);
    expect(jumpPoint?.mass).toBe(0);
  });

  it('should handle object creation through store methods', () => {
    // Test star object creation
    const starParams = {
      id: 'test-star',
      type: 'star',
      position: { x: 0, y: 0, z: 0 },
      properties: {
        spectralType: 'G2V',
        temperature: 5778,
        radius: 696340
      }
    };
    
    store.createStarObject(starParams);
    const starObject = store.getObjectProperties('test-star');
    expect(starObject).toBeDefined();

    // Test planet object creation - note: createPlanetObject generates its own ID
    const planetParams = {
      type: 'planet',
      position: { x: 1, y: 0, z: 0 },
      properties: {
        type: 'terrestrial',
        radius: 6371,
        atmosphere: true
      }
    };
    
    store.createPlanetObject(planetParams);
    // Since createPlanetObject generates an ID, we need to find the planet in the objects map
    const currentState = useSystemStore.getState();
    const planets = Array.from(currentState.objects.values()).filter(obj => obj.type === 'planet');
    expect(planets.length).toBeGreaterThan(0);
    const planetObject = planets[0];
    expect(planetObject).toBeDefined();
  });

  it('should handle object management operations', () => {
    // Create test objects
    store.createStarObject({
      id: 'test-star',
      type: 'star',
      position: { x: 0, y: 0, z: 0 },
      properties: { radius: 1.0 }
    });

    // Verify object was created
    const starObject = store.getObjectProperties('test-star');
    expect(starObject).toBeDefined();
    expect(starObject?.type).toBe('star');

    // Test object selection
    store.selectObject('test-star');
    const currentState = useSystemStore.getState();
    expect(currentState.selectedObject?.id).toBe('test-star');

    // Test object hover
    store.setHoveredObject('test-star');
    const updatedState = useSystemStore.getState();
    expect(updatedState.getHoveredObject()).toBe('test-star');

    // Test object removal
    store.removeObject('test-star');
    expect(store.getObjectProperties('test-star')).toBeUndefined();
  });

  it('should validate object types correctly', () => {
    const validTypes = ['star', 'planet', 'moon', 'jump-point'];
    
    testSystemData.objects.forEach(obj => {
      expect(validTypes).toContain(obj.type);
      expect(obj.id).toBeDefined();
      expect(obj.name).toBeDefined();
      expect(obj.position).toHaveLength(3);
      expect(typeof obj.radius).toBe('number');
      expect(typeof obj.mass).toBe('number');
    });
  });

  it('should handle orbital objects correctly', () => {
    const orbitingObjects = testSystemData.objects.filter(obj => obj.orbit);
    
    orbitingObjects.forEach(obj => {
      expect(obj.orbit).toBeDefined();
      expect(obj.orbit?.parentId).toBeDefined();
      expect(typeof obj.orbit?.semiMajorAxis).toBe('number');
      expect(typeof obj.orbit?.eccentricity).toBe('number');
      expect(typeof obj.orbit?.inclination).toBe('number');
    });
  });

  it('should handle system data validation', () => {
    // Test that the system data structure is properly defined
    expect(testSystemData.name).toBeDefined();
    expect(testSystemData.objects).toBeDefined();
    expect(Array.isArray(testSystemData.objects)).toBe(true);
    
    // Test object types are valid
    const validTypes = ['star', 'planet', 'moon', 'jump-point'];
    testSystemData.objects.forEach(obj => {
      expect(validTypes).toContain(obj.type);
    });
  });
}); 