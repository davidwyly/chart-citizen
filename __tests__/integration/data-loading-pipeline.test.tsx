import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { EngineSystemLoader } from '@/engine/system-loader';
import { ObjectFactory } from '@/engine/object-factory';
import { useSystemStore } from '@/engine/core/mode-system/mode-system';
import type { OrbitalSystemData, CelestialObject } from '@/engine/types/orbital-system';
import type { StarmapData } from '@/engine/types/orbital-system';

// Mock Three.js and related dependencies
vi.mock('three', () => ({
  default: {},
  Vector3: vi.fn().mockImplementation(() => ({ x: 0, y: 0, z: 0 })),
  Object3D: vi.fn(),
  Group: vi.fn(),
  Mesh: vi.fn(),
}));

vi.mock('@react-three/fiber', () => ({
  useFrame: vi.fn(),
  useThree: vi.fn(() => ({ scene: {}, camera: {} })),
}));

// Mock all renderer components
vi.mock('@/engine/renderers/stars/star-renderer', () => ({
  StarRenderer: (props: any) => <div data-testid="star-renderer" data-props={JSON.stringify(props)} />
}));

vi.mock('@/engine/renderers/planets/gas-giant-renderer', () => ({
  GasGiantRenderer: (props: any) => <div data-testid="gas-giant-renderer" data-props={JSON.stringify(props)} />
}));

vi.mock('@/engine/renderers/planets/terrestrial-planet-renderer', () => ({
  TerrestrialPlanetRenderer: (props: any) => <div data-testid="terrestrial-planet-renderer" data-props={JSON.stringify(props)} />
}));

vi.mock('@/engine/renderers/planets/planet-renderer', () => ({
  PlanetRenderer: (props: any) => <div data-testid="planet-renderer" data-props={JSON.stringify(props)} />
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Data Loading Pipeline Integration', () => {
  let systemLoader: EngineSystemLoader;
  let consoleSpy: any;

  // Test data fixtures
  const validStarmapData: StarmapData = {
    systems: {
      'stanton': {
        id: 'stanton',
        name: 'Stanton System',
        position: [0, 0, 0],
        description: 'A test system for Star Citizen mode'
      },
      'sol': {
        id: 'sol',
        name: 'Sol System', 
        position: [10, 0, 0],
        description: 'Our solar system for realistic mode'
      }
    }
  };

  const stantonSystemData: OrbitalSystemData = {
    id: 'stanton',
    name: 'Stanton System',
    objects: [
      {
        id: 'stanton-star',
        name: 'Stanton',
        classification: 'star',
        geometry_type: 'star',
        properties: {
          mass: 1.2,
          radius: 800000,
          temperature: 6200,
        },
        position: [0, 0, 0],
      },
      {
        id: 'crusader',
        name: 'Crusader',
        classification: 'planet',
        geometry_type: 'gas-giant',
        properties: {
          mass: 95.2,
          radius: 58232,
          temperature: 120,
        },
        orbit: {
          parent: 'stanton-star',
          semi_major_axis: 5.906,
          eccentricity: 0.05,
          inclination: 2.5,
          orbital_period: 1460.4,
        },
      },
      {
        id: 'hurston',
        name: 'Hurston',
        classification: 'planet',
        geometry_type: 'terrestrial-planet',
        properties: {
          mass: 1.0,
          radius: 6371,
          temperature: 288,
        },
        features: {
          earth_like: true,
          ocean_coverage: 0.7
        },
        orbit: {
          parent: 'stanton-star',
          semi_major_axis: 1.0,
          eccentricity: 0.017,
          inclination: 0.0,
          orbital_period: 365.25,
        },
      }
    ],
    lighting: {
      ambientColor: '#222233',
      ambientIntensity: 0.1,
    }
  };

  const solSystemData: OrbitalSystemData = {
    id: 'sol',
    name: 'Sol System',
    objects: [
      {
        id: 'sol-star',
        name: 'Sol',
        classification: 'star',
        geometry_type: 'star',
        properties: {
          mass: 1.0,
          radius: 695700,
          temperature: 5778,
        },
        position: [0, 0, 0],
      },
      {
        id: 'earth',
        name: 'Earth',
        classification: 'planet',
        geometry_type: 'terrestrial-planet',
        properties: {
          mass: 1.0,
          radius: 6371,
          temperature: 288,
        },
        features: {
          earth_like: true,
          ocean_coverage: 0.71
        },
        orbit: {
          parent: 'sol-star',
          semi_major_axis: 1.0,
          eccentricity: 0.017,
          inclination: 0.0,
          orbital_period: 365.25,
        },
      }
    ],
    lighting: {
      ambientColor: '#222222',
      ambientIntensity: 0.1,
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    systemLoader = new EngineSystemLoader();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Reset store state
    useSystemStore.getState().reset();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    vi.restoreAllMocks();
  });

  describe('full pipeline: starmap -> system -> objects -> rendering', () => {
    it('should load starmap, system data, and render objects correctly', async () => {
      // Mock starmap and system data fetch
      mockFetch
        .mockResolvedValueOnce(new Response(JSON.stringify(validStarmapData), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        }))
        .mockResolvedValueOnce(new Response(JSON.stringify(stantonSystemData), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        }));

      // Load starmap first
      const starmapData = await systemLoader.loadStarmap('star-citizen');
      expect(starmapData).toEqual(validStarmapData);

      // Get available systems
      const availableSystems = await systemLoader.getAvailableSystems('star-citizen');
      expect(availableSystems).toContain('stanton');

      // Load specific system
      const systemData = await systemLoader.loadSystem('star-citizen', 'stanton');
      expect(systemData).toEqual(stantonSystemData);

      // Render objects using ObjectFactory
      const objects = systemData!.objects;
      const renderedComponents = objects.map(obj => (
        <ObjectFactory key={obj.id} catalogData={obj as any} />
      ));

      const { container } = render(<div>{renderedComponents}</div>);

      // Verify all objects are rendered with correct renderers
      expect(container.querySelector('[data-testid="star-renderer"]')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="gas-giant-renderer"]')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="terrestrial-planet-renderer"]')).toBeInTheDocument();
    });

    it('should handle mode switching and load different data', async () => {
      // Mock responses for both modes
      mockFetch
        .mockResolvedValueOnce(new Response(JSON.stringify(validStarmapData), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        }))
        .mockResolvedValueOnce(new Response(JSON.stringify(solSystemData), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        }));

      // Set realistic mode
      const store = useSystemStore.getState();
      store.setMode('realistic');
      expect(store.getMode()).toBe('realistic');

      // Load Sol system
      const systemData = await systemLoader.loadSystem('realistic', 'sol');
      expect(systemData).toEqual(solSystemData);

      // Verify features are set correctly for realistic mode
      const features = store.getViewFeatures();
      expect(features.scientificInfo).toBe(true);
      expect(features.educationalContent).toBe(true);
      expect(features.gameInfo).toBe(false);
    });

    it('should cache data appropriately across the pipeline', async () => {
      mockFetch
        .mockResolvedValueOnce(new Response(JSON.stringify(validStarmapData), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        }))
        .mockResolvedValueOnce(new Response(JSON.stringify(stantonSystemData), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        }));

      // First load
      await systemLoader.loadStarmap('star-citizen');
      await systemLoader.loadSystem('star-citizen', 'stanton');

      // Second load should use cache
      const starmap2 = await systemLoader.loadStarmap('star-citizen');
      const system2 = await systemLoader.loadSystem('star-citizen', 'stanton');

      expect(starmap2).toEqual(validStarmapData);
      expect(system2).toEqual(stantonSystemData);
      expect(mockFetch).toHaveBeenCalledTimes(2); // Only initial calls
    });
  });

  describe('error propagation through pipeline', () => {
    it('should handle starmap loading failure gracefully', async () => {
      mockFetch.mockResolvedValueOnce(new Response('Not Found', {
        status: 404,
        statusText: 'Not Found'
      }));

      const starmapData = await systemLoader.loadStarmap('nonexistent-mode');
      expect(starmapData).toBeNull();

      const availableSystems = await systemLoader.getAvailableSystems('nonexistent-mode');
      expect(availableSystems).toEqual([]);
    });

    it('should handle system loading failure gracefully', async () => {
      mockFetch.mockResolvedValueOnce(new Response('System not found', {
        status: 404,
        statusText: 'Not Found'
      }));

      const systemData = await systemLoader.loadSystem('star-citizen', 'nonexistent');
      expect(systemData).toBeNull();
    });

    it('should handle invalid system data and prevent rendering', async () => {
      const invalidSystemData = {
        id: 'invalid',
        name: 'Invalid System',
        objects: [] // No objects - should fail validation
      };

      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(invalidSystemData), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      }));

      const systemData = await systemLoader.loadSystem('star-citizen', 'invalid');
      expect(systemData).toBeNull();
    });
  });

  describe('mode system integration', () => {
    it('should apply correct features based on mode and view mode', async () => {
      const store = useSystemStore.getState();

      // Test realistic mode with different view modes
      store.setMode('realistic');
      store.setViewMode('explorational');

      let features = store.getViewFeatures();
      expect(features.scientificInfo).toBe(true);
      expect(features.educationalContent).toBe(true);
      expect(features.gameInfo).toBe(false);

      store.setViewMode('navigational');
      features = store.getViewFeatures();
      expect(features.scientificInfo).toBe(true);
      expect(features.educationalContent).toBe(false);
      expect(features.jumpPointInfo).toBe(true);

      // Test profile mode
      store.setMode('profile');
      features = store.getViewFeatures();
      expect(features.gameInfo).toBe(true);
      expect(features.jumpPointInfo).toBe(true);
      expect(features.scientificInfo).toBe(false);
    });

    it('should provide correct scaling constants for different view modes', () => {
      const store = useSystemStore.getState();

      store.setViewMode('explorational');
      let scaling = store.getViewModeScaling();
      expect(scaling.STAR_SCALE).toBeDefined();
      expect(scaling.PLANET_SCALE).toBeDefined();
      expect(scaling.MOON_SCALE).toBeDefined();
      expect(scaling.ORBITAL_SCALE).toBeDefined();

      store.setViewMode('navigational');
      scaling = store.getViewModeScaling();
      expect(scaling.STAR_SCALE).toBe(2.0);
      expect(scaling.PLANET_SCALE).toBe(1.2);
      expect(scaling.MOON_SCALE).toBe(0.6);

      store.setViewMode('profile');
      scaling = store.getViewModeScaling();
      expect(scaling.STAR_SCALE).toBe(1.5);
      expect(scaling.PLANET_SCALE).toBe(0.8);
      expect(scaling.MOON_SCALE).toBe(0.4);
    });
  });

  describe('object creation and rendering integration', () => {
    it('should create objects through store and render them correctly', () => {
      const store = useSystemStore.getState();

      // Create a star object
      store.createStarObject({
        id: 'test-star',
        name: 'Test Star',
        properties: { 
          mass: 1.0, 
          radius: 695700,
          temperature: 5778 
        }
      });

      // Create a planet object
      store.createPlanetObject({
        id: 'test-planet',
        name: 'Test Planet',
        properties: { 
          mass: 1.0, 
          radius: 6371,
          temperature: 288 
        }
      });

      // Verify objects are created in store
      const starObj = store.getObjectProperties('test-star');
      const planetObj = store.getObjectProperties('test-planet');

      expect(starObj).toBeDefined();
      expect(starObj?.type).toBe('star');
      expect(planetObj).toBeDefined();
      expect(planetObj?.type).toBe('planet');

      // Test object selection
      store.selectObject('test-star');
      expect(store.selectedObject?.id).toBe('test-star');

      // Test hover state
      store.setHoveredObject('test-planet');
      expect(store.getHoveredObject()).toBe('test-planet');
    });

    it('should handle binary star system creation correctly', () => {
      const store = useSystemStore.getState();

      // Create first star (should be at origin)
      store.createStarObject({
        id: 'star-a',
        name: 'Star A',
      });

      // Create second star (should be positioned for binary system)
      store.createStarObject({
        id: 'star-b', 
        name: 'Star B',
      });

      const starA = store.getObjectProperties('star-a');
      const starB = store.getObjectProperties('star-b');

      expect(starA?.properties?.isBinary).toBe(false); // First star isn't binary
      expect(starB?.properties?.isBinary).toBe(true);  // Second star makes it binary

      // Verify positioning
      expect(starB?.position?.x).not.toBe(0); // Should be offset
    });
  });

  describe('data validation integration', () => {
    it('should validate complete data flow', async () => {
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(stantonSystemData), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      }));

      const systemData = await systemLoader.loadSystem('star-citizen', 'stanton');
      expect(systemData).toBeDefined();

      // Validate system structure
      expect(systemData!.id).toBe('stanton');
      expect(systemData!.name).toBe('Stanton System');
      expect(systemData!.objects).toHaveLength(3);

      // Validate star exists
      const stars = systemLoader.getStars(systemData!);
      expect(stars).toHaveLength(1);
      expect(stars[0].classification).toBe('star');

      // Validate hierarchy
      const hierarchy = systemLoader.buildObjectHierarchy(systemData!);
      expect(hierarchy.has('stanton-star')).toBe(true);
      expect(hierarchy.get('stanton-star')).toHaveLength(2); // Two planets

      // Validate object filtering
      const planets = systemLoader.getPlanets(systemData!);
      expect(planets).toHaveLength(2);
      expect(planets.every(p => p.classification === 'planet')).toBe(true);
    });

    it('should maintain data integrity across cache operations', async () => {
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(stantonSystemData), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      }));

      // Load data
      const systemData1 = await systemLoader.loadSystem('star-citizen', 'stanton');
      
      // Modify cached data reference (simulating potential mutation)
      systemData1!.objects[0].name = 'Modified Star';

      // Get cached data again
      const systemData2 = await systemLoader.loadSystem('star-citizen', 'stanton');

      // Should be the same reference (cache working)
      expect(systemData1).toBe(systemData2);
      expect(systemData2!.objects[0].name).toBe('Modified Star');

      // Clear cache and reload
      systemLoader.clearCache('star-citizen');
      
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(stantonSystemData), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      }));

      const systemData3 = await systemLoader.loadSystem('star-citizen', 'stanton');

      // Should be fresh data
      expect(systemData3).not.toBe(systemData1);
      expect(systemData3!.objects[0].name).toBe('Stanton'); // Original name
    });
  });

  describe('performance and optimization', () => {
    it('should optimize rendering based on detail level', () => {
      const store = useSystemStore.getState();

      store.optimizeRendering('profile');
      expect(store.getDetailLevel()).toBe('low');

      store.optimizeRendering('explorational');
      expect(store.getDetailLevel()).toBe('medium');
    });

    it('should handle concurrent system loading efficiently', async () => {
      mockFetch.mockResolvedValue(new Response(JSON.stringify(stantonSystemData), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      }));

      const startTime = performance.now();

      // Start multiple concurrent loads
      const promises = [
        systemLoader.loadSystem('star-citizen', 'stanton'),
        systemLoader.loadSystem('star-citizen', 'stanton'),
        systemLoader.loadSystem('star-citizen', 'stanton'),
      ];

      const results = await Promise.all(promises);
      const endTime = performance.now();

      // All should return the same data
      expect(results[0]).toEqual(results[1]);
      expect(results[1]).toEqual(results[2]);

      // Should only make one fetch call due to concurrent request handling
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Should complete reasonably quickly
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});