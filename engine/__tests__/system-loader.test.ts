import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EngineSystemLoader } from '../system-loader';
import type { OrbitalSystemData, CelestialObject } from '../types/orbital-system';
import type { StarmapData } from '../types/orbital-system';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('EngineSystemLoader', () => {
  let systemLoader: EngineSystemLoader;
  let consoleSpy: any;

  // Test data fixtures
  const validSystemData: OrbitalSystemData = {
    id: 'test-system',
    name: 'Test System',
    objects: [
      {
        id: 'test-star',
        name: 'Test Star',
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
        id: 'test-planet',
        name: 'Test Planet',
        classification: 'planet',
        geometry_type: 'terrestrial',
        properties: {
          mass: 1.0,
          radius: 6371,
          temperature: 288,
        },
        orbit: {
          parent: 'test-star',
          semi_major_axis: 1.0,
          eccentricity: 0.0,
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

  const validStarmapData: StarmapData = {
    systems: {
      'test-system': {
        id: 'test-system',
        name: 'Test System',
        position: [0, 0, 0],
        description: 'A test system'
      },
      'another-system': {
        id: 'another-system',
        name: 'Another System', 
        position: [10, 0, 0],
        description: 'Another test system'
      }
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    systemLoader = new EngineSystemLoader();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should create a new instance with empty caches', () => {
      expect(systemLoader).toBeInstanceOf(EngineSystemLoader);
      expect(systemLoader.isSystemLoaded('test-mode', 'test-system')).toBe(false);
      expect(systemLoader.getLoadingStatus('test-mode', 'test-system')).toBe('not-loaded');
    });
  });

  describe('loadStarmap', () => {
    it('should successfully load and cache starmap data', async () => {
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(validStarmapData), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      }));

      const result = await systemLoader.loadStarmap('test-mode');
      
      expect(result).toEqual(validStarmapData);
      expect(mockFetch).toHaveBeenCalledWith('/data/test-mode/starmap-systems.json');
      
      // Second call should use cache
      const cachedResult = await systemLoader.loadStarmap('test-mode');
      expect(cachedResult).toEqual(validStarmapData);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle HTTP errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce(new Response('Not Found', {
        status: 404,
        statusText: 'Not Found'
      }));

      const result = await systemLoader.loadStarmap('nonexistent-mode');
      
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load starmap for mode nonexistent-mode'),
        expect.any(Error)
      );
    });

    it('should handle invalid content type', async () => {
      mockFetch.mockResolvedValueOnce(new Response('<html>Error</html>', {
        status: 200,
        headers: { 'content-type': 'text/html' }
      }));

      const result = await systemLoader.loadStarmap('test-mode');
      
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load starmap for mode test-mode'),
        expect.objectContaining({
          message: expect.stringContaining('Invalid content type')
        })
      );
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await systemLoader.loadStarmap('test-mode');
      
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load starmap for mode test-mode'),
        expect.any(Error)
      );
    });

    it('should handle malformed JSON', async () => {
      mockFetch.mockResolvedValueOnce(new Response('invalid json{', {
        status: 200,
        headers: { 'content-type': 'application/json' }
      }));

      const result = await systemLoader.loadStarmap('test-mode');
      
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load starmap for mode test-mode'),
        expect.any(Error)
      );
    });
  });

  describe('loadSystem', () => {
    it('should successfully load and cache system data', async () => {
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(validSystemData), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      }));

      const result = await systemLoader.loadSystem('test-mode', 'test-system');
      
      expect(result).toEqual(validSystemData);
      expect(mockFetch).toHaveBeenCalledWith('/data/test-mode/systems/test-system.json');
      expect(systemLoader.isSystemLoaded('test-mode', 'test-system')).toBe(true);
      
      // Second call should use cache
      const cachedResult = await systemLoader.loadSystem('test-mode', 'test-system');
      expect(cachedResult).toEqual(validSystemData);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent loading requests', async () => {
      let resolvePromise: (value: Response) => void;
      const pendingPromise = new Promise<Response>((resolve) => {
        resolvePromise = resolve;
      });
      
      mockFetch.mockReturnValueOnce(pendingPromise);

      // Start two concurrent loads
      const promise1 = systemLoader.loadSystem('test-mode', 'test-system');
      const promise2 = systemLoader.loadSystem('test-mode', 'test-system');
      
      expect(systemLoader.getLoadingStatus('test-mode', 'test-system')).toBe('loading');
      
      // Resolve the fetch
      resolvePromise!(new Response(JSON.stringify(validSystemData), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      }));

      const [result1, result2] = await Promise.all([promise1, promise2]);
      
      expect(result1).toEqual(validSystemData);
      expect(result2).toEqual(validSystemData);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(systemLoader.getLoadingStatus('test-mode', 'test-system')).toBe('loaded');
    });

    it('should reject systems without required star', async () => {
      const invalidSystemData = {
        ...validSystemData,
        objects: [
          {
            id: 'test-planet',
            name: 'Test Planet',
            classification: 'planet',
            geometry_type: 'terrestrial',
            properties: { mass: 1.0, radius: 6371, temperature: 288 },
          }
        ]
      };

      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(invalidSystemData), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      }));

      const result = await systemLoader.loadSystem('test-mode', 'test-system');
      
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load system test-system in mode test-mode'),
        expect.any(Error)
      );
    });

    it('should detect HTML 404 pages', async () => {
      mockFetch.mockResolvedValueOnce(new Response('<!DOCTYPE html><html><body>404 Not Found</body></html>', {
        status: 200,
        headers: { 'content-type': 'text/html' }
      }));

      const result = await systemLoader.loadSystem('test-mode', 'test-system');
      
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load system test-system in mode test-mode'),
        expect.objectContaining({
          message: expect.stringContaining('server returned an HTML page instead of JSON')
        })
      );
    });

    it('should provide detailed error context for HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce(new Response('System not found', {
        status: 404,
        statusText: 'Not Found'
      }));

      const result = await systemLoader.loadSystem('test-mode', 'test-system');
      
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load system test-system in mode test-mode'),
        expect.any(Error)
      );
    });
  });

  describe('getAvailableSystems', () => {
    it('should return system IDs from starmap', async () => {
      systemLoader.loadStarmap = vi.fn().mockResolvedValue(validStarmapData);

      const systems = await systemLoader.getAvailableSystems('test-mode');
      
      expect(systems).toEqual(['test-system', 'another-system']);
      expect(systemLoader.loadStarmap).toHaveBeenCalledWith('test-mode');
    });

    it('should return empty array when starmap fails to load', async () => {
      systemLoader.loadStarmap = vi.fn().mockResolvedValue(null);

      const systems = await systemLoader.getAvailableSystems('test-mode');
      
      expect(systems).toEqual([]);
    });

    it('should return empty array when starmap has no systems', async () => {
      systemLoader.loadStarmap = vi.fn().mockResolvedValue({ systems: {} });

      const systems = await systemLoader.getAvailableSystems('test-mode');
      
      expect(systems).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      systemLoader.loadStarmap = vi.fn().mockRejectedValue(new Error('Network error'));

      const systems = await systemLoader.getAvailableSystems('test-mode');
      
      expect(systems).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to get available systems for mode test-mode'),
        expect.any(Error)
      );
    });
  });

  describe('cache management', () => {
    it('should clear specific mode cache', async () => {
      // Set up separate mock responses for each load
      mockFetch
        .mockResolvedValueOnce(new Response(JSON.stringify(validSystemData), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        }))
        .mockResolvedValueOnce(new Response(JSON.stringify(validSystemData), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        }));
      
      await systemLoader.loadSystem('mode1', 'system1');
      await systemLoader.loadSystem('mode2', 'system2');
      
      // Verify data is loaded
      expect(systemLoader.isSystemLoaded('mode1', 'system1')).toBe(true);
      expect(systemLoader.isSystemLoaded('mode2', 'system2')).toBe(true);
      
      // Clear mode1 cache
      systemLoader.clearCache('mode1');
      
      expect(systemLoader.isSystemLoaded('mode1', 'system1')).toBe(false);
      expect(systemLoader.isSystemLoaded('mode2', 'system2')).toBe(true);
    });

    it('should clear all caches', async () => {
      // Set up separate mock responses for each load
      mockFetch
        .mockResolvedValueOnce(new Response(JSON.stringify(validSystemData), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        }))
        .mockResolvedValueOnce(new Response(JSON.stringify(validSystemData), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        }));
      
      await systemLoader.loadSystem('mode1', 'system1');
      await systemLoader.loadSystem('mode2', 'system2');
      
      // Verify data is loaded
      expect(systemLoader.isSystemLoaded('mode1', 'system1')).toBe(true);
      expect(systemLoader.isSystemLoaded('mode2', 'system2')).toBe(true);
      
      // Clear all caches
      systemLoader.clearCache();
      
      expect(systemLoader.isSystemLoaded('mode1', 'system1')).toBe(false);
      expect(systemLoader.isSystemLoaded('mode2', 'system2')).toBe(false);
    });
  });

  describe('object filtering and hierarchy', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValue(new Response(JSON.stringify(validSystemData), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      }));
    });

    it('should filter stars correctly', async () => {
      const systemData = await systemLoader.loadSystem('test-mode', 'test-system');
      const stars = systemLoader.getStars(systemData!);
      
      expect(stars).toHaveLength(1);
      expect(stars[0].classification).toBe('star');
      expect(stars[0].id).toBe('test-star');
    });

    it('should filter planets correctly', async () => {
      const systemData = await systemLoader.loadSystem('test-mode', 'test-system');
      const planets = systemLoader.getPlanets(systemData!);
      
      expect(planets).toHaveLength(1);
      expect(planets[0].classification).toBe('planet');
      expect(planets[0].id).toBe('test-planet');
    });

    it('should find objects by ID', async () => {
      const systemData = await systemLoader.loadSystem('test-mode', 'test-system');
      const star = systemLoader.findObject(systemData!, 'test-star');
      const planet = systemLoader.findObject(systemData!, 'test-planet');
      const nonExistent = systemLoader.findObject(systemData!, 'nonexistent');
      
      expect(star?.id).toBe('test-star');
      expect(planet?.id).toBe('test-planet');
      expect(nonExistent).toBeUndefined();
    });

    it('should get objects by parent', async () => {
      const systemData = await systemLoader.loadSystem('test-mode', 'test-system');
      const starChildren = systemLoader.getObjectsByParent(systemData!, 'test-star');
      const planetChildren = systemLoader.getObjectsByParent(systemData!, 'test-planet');
      
      expect(starChildren).toHaveLength(1);
      expect(starChildren[0].id).toBe('test-planet');
      expect(planetChildren).toHaveLength(0);
    });

    it('should identify root objects', async () => {
      const systemData = await systemLoader.loadSystem('test-mode', 'test-system');
      const roots = systemLoader.getRootObjects(systemData!);
      
      expect(roots).toHaveLength(1);
      expect(roots[0].id).toBe('test-star');
    });

    it('should build object hierarchy', async () => {
      const systemData = await systemLoader.loadSystem('test-mode', 'test-system');
      const hierarchy = systemLoader.buildObjectHierarchy(systemData!);
      
      expect(hierarchy.has('test-star')).toBe(true);
      expect(hierarchy.get('test-star')).toHaveLength(1);
      expect(hierarchy.get('test-star')![0].id).toBe('test-planet');
    });
  });

  describe('validation edge cases', () => {
    it('should reject system with missing ID', async () => {
      const invalidData = { ...validSystemData, id: undefined };
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(invalidData), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      }));

      const result = await systemLoader.loadSystem('test-mode', 'test-system');
      expect(result).toBeNull();
    });

    it('should reject system with empty objects array', async () => {
      const invalidData = { ...validSystemData, objects: [] };
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(invalidData), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      }));

      const result = await systemLoader.loadSystem('test-mode', 'test-system');
      expect(result).toBeNull();
    });

    it('should reject system with missing name', async () => {
      const invalidData = { ...validSystemData, name: '' };
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(invalidData), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      }));

      const result = await systemLoader.loadSystem('test-mode', 'test-system');
      expect(result).toBeNull();
    });
  });

  describe('loading state management', () => {
    it('should track loading status correctly', async () => {
      let resolvePromise: (value: Response) => void;
      const pendingPromise = new Promise<Response>((resolve) => {
        resolvePromise = resolve;
      });
      
      mockFetch.mockReturnValueOnce(pendingPromise);

      const loadPromise = systemLoader.loadSystem('test-mode', 'test-system');
      
      expect(systemLoader.getLoadingStatus('test-mode', 'test-system')).toBe('loading');
      expect(systemLoader.isSystemLoading('test-mode', 'test-system')).toBe(true);
      expect(systemLoader.isSystemLoaded('test-mode', 'test-system')).toBe(false);
      
      resolvePromise!(new Response(JSON.stringify(validSystemData), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      }));

      await loadPromise;
      
      expect(systemLoader.getLoadingStatus('test-mode', 'test-system')).toBe('loaded');
      expect(systemLoader.isSystemLoading('test-mode', 'test-system')).toBe(false);
      expect(systemLoader.isSystemLoaded('test-mode', 'test-system')).toBe(true);
    });

    it('should clean up loading state on failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await systemLoader.loadSystem('test-mode', 'test-system');
      
      expect(systemLoader.getLoadingStatus('test-mode', 'test-system')).toBe('not-loaded');
      expect(systemLoader.isSystemLoading('test-mode', 'test-system')).toBe(false);
      expect(systemLoader.isSystemLoaded('test-mode', 'test-system')).toBe(false);
    });
  });
});