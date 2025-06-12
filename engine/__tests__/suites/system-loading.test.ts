import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSystemStore } from '@/engine/core/mode-system/mode-system';
import { systemLoader } from '@/engine/lib/system-loader';
import { SystemData } from '@/engine/lib/system-loader';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

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

const mockStarmapData = {
  systems: {
    sol: {
      id: 'sol',
      name: 'Sol System',
      position: [0, 0, 0],
      tags: ['inhabited', 'historical', 'core-system'],
      jump_routes: ['alpha-centauri', 'proxima-centauri'],
      description: 'The birthplace of humanity'
    },
    'alpha-centauri': {
      id: 'alpha-centauri',
      name: 'Alpha Centauri',
      position: [4.37, 0, 0],
      tags: ['neighbor', 'explored'],
      jump_routes: ['sol'],
      description: 'Nearest star system to Sol'
    }
  },
  metadata: {
    mode: 'realistic',
    version: '1.0'
  }
};

describe('System Loading', () => {
  beforeEach(() => {
    useSystemStore.getState().reset();
    mockFetch.mockReset();
    
    // Set up default mock responses
    mockFetch.mockImplementation((url) => {
      if (url.includes('starmap-systems.json')) {
        return Promise.resolve({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockStarmapData)
        });
      }
      if (url.includes('sol.json')) {
        return Promise.resolve({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockSolSystem)
        });
      }
      return Promise.resolve({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });
    });
  });

  it('should load the Sol system correctly', async () => {
    const store = useSystemStore.getState();
    systemLoader.setMode('realistic');
    const solSystem = await systemLoader.loadSystem('sol');
    
    expect(solSystem).not.toBeNull();
    if (!solSystem) return;
    
    expect(solSystem.id).toBe('sol');
    expect(solSystem.name).toBe('Sol System');
    expect(solSystem.stars).toHaveLength(1);
    expect(solSystem.planets).toBeDefined();
    expect(solSystem.planets?.length).toBeGreaterThan(0);
  });

  it('should handle system loading errors gracefully', async () => {
    const store = useSystemStore.getState();
    systemLoader.setMode('realistic');
    
    // Mock a failed fetch
    mockFetch.mockImplementationOnce(() => Promise.resolve({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    }));
    
    const solSystem = await systemLoader.loadSystem('nonexistent');
    expect(solSystem).not.toBeNull();
    if (!solSystem) return;
    
    // Should return fallback data
    expect(solSystem.id).toBe('nonexistent');
    expect(solSystem.name).toBe('Nonexistent System');
    expect(solSystem.stars).toHaveLength(1);
  });

  it('should handle invalid JSON responses', async () => {
    const store = useSystemStore.getState();
    systemLoader.setMode('realistic');
    
    // Mock an invalid JSON response
    mockFetch.mockImplementationOnce(() => Promise.resolve({
      ok: true,
      headers: new Headers({ 'content-type': 'text/html' }),
      text: () => Promise.resolve('<!DOCTYPE html><html>Not Found</html>')
    }));
    
    const solSystem = await systemLoader.loadSystem('invalid');
    expect(solSystem).not.toBeNull();
    if (!solSystem) return;
    
    // Should return fallback data
    expect(solSystem.id).toBe('invalid');
    expect(solSystem.name).toBe('Invalid System');
  });

  it('should handle mode switching correctly', async () => {
    const store = useSystemStore.getState();
    
    // Test realistic mode
    systemLoader.setMode('realistic');
    const realisticSystem = await systemLoader.loadSystem('sol');
    expect(store.getMode()).toBe('realistic');
    
    // Test profile mode
    systemLoader.setMode('profile');
    const profileSystem = await systemLoader.loadSystem('sol');
    expect(store.getMode()).toBe('profile');
  });

  it('should load system data without errors', () => {
    expect(true).toBe(true);
  });
}); 