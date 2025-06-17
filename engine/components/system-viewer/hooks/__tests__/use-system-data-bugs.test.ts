import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSystemData } from '../use-system-data';
import { engineSystemLoader } from '@/engine/system-loader';

// Mock the system loader
vi.mock('@/engine/system-loader', () => ({
  engineSystemLoader: {
    getAvailableSystems: vi.fn(),
    loadSystem: vi.fn(),
  }
}));

const mockSystemLoader = engineSystemLoader as any;

describe('useSystemData Bug Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset console methods
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fallback system logic bugs', () => {
    it('should handle empty available systems array', async () => {
      // Bug: When no systems are available, fallback logic might fail
      mockSystemLoader.getAvailableSystems.mockResolvedValue([]);
      
      const { result } = renderHook(() => useSystemData('realistic', 'non-existent'));
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should create a default system when no systems are available
      expect(result.current.systemData).toBeDefined();
      expect(result.current.systemData?.id).toBe('default');
      expect(result.current.error).toContain('No systems available');
    });

    it('should handle null/undefined from getAvailableSystems', async () => {
      // Bug: API might return null instead of empty array
      mockSystemLoader.getAvailableSystems.mockResolvedValue(null);
      
      const { result } = renderHook(() => useSystemData('realistic', 'sol'));
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should handle null gracefully and create default system
      expect(result.current.systemData).toBeDefined();
    });

    it('should handle fallback system selection edge cases', async () => {
      // Bug: What if fallback systems array is undefined for the mode?
      mockSystemLoader.getAvailableSystems.mockResolvedValue(['system1', 'system2']);
      mockSystemLoader.loadSystem.mockResolvedValue(null); // All loads fail
      
      const { result } = renderHook(() => useSystemData('unknown-mode', 'non-existent'));
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should still handle unknown mode gracefully
      expect(result.current.systemData).toBeDefined();
    });

    it('should handle infinite fallback loop prevention', async () => {
      // Bug: If all fallback systems fail to load, might get stuck in loop
      mockSystemLoader.getAvailableSystems.mockResolvedValue(['sol', 'stanton']);
      mockSystemLoader.loadSystem.mockResolvedValue(null); // Always fail
      
      const { result } = renderHook(() => useSystemData('realistic', 'non-existent'));
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 3000 });

      // Should eventually give up and provide emergency system
      expect(result.current.systemData).toBeDefined();
      expect(result.current.systemData?.id).toBe('emergency');
    });
  });

  describe('default system creation bugs', () => {
    it('should create valid default system structure', async () => {
      mockSystemLoader.getAvailableSystems.mockResolvedValue([]);
      
      const { result } = renderHook(() => useSystemData('realistic', 'non-existent'));
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const defaultSystem = result.current.systemData;
      expect(defaultSystem).toBeDefined();
      
      // Bug: Check all required fields are present
      expect(defaultSystem?.id).toBeDefined();
      expect(defaultSystem?.name).toBeDefined();
      expect(defaultSystem?.objects).toBeDefined();
      expect(defaultSystem?.objects).toHaveLength(1);
      expect(defaultSystem?.lighting).toBeDefined();
      expect(defaultSystem?.metadata).toBeDefined();
      
      // Bug: Default star should have all required properties
      const defaultStar = defaultSystem?.objects[0];
      expect(defaultStar?.id).toBeDefined();
      expect(defaultStar?.classification).toBe('star');
      expect(defaultStar?.properties).toBeDefined();
      expect(defaultStar?.properties?.mass).toBeDefined();
      expect(defaultStar?.properties?.radius).toBeDefined();
      expect(defaultStar?.position).toBeDefined();
    });

    it('should create emergency system when everything fails', async () => {
      mockSystemLoader.getAvailableSystems.mockRejectedValue(new Error('Network error'));
      
      const { result } = renderHook(() => useSystemData('realistic', 'sol'));
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should create emergency system
      expect(result.current.systemData).toBeDefined();
      expect(result.current.systemData?.id).toBe('emergency');
      expect(result.current.error).toBeDefined();
    });
  });

  describe('date/time formatting bugs', () => {
    it('should handle date formatting in default system metadata', async () => {
      mockSystemLoader.getAvailableSystems.mockResolvedValue([]);
      
      const { result } = renderHook(() => useSystemData('realistic', 'test'));
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const metadata = result.current.systemData?.metadata;
      expect(metadata?.last_updated).toBeDefined();
      
      // Bug: Date formatting might fail in some locales or timezones
      const lastUpdated = metadata?.last_updated;
      expect(lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD format
      
      // Should be a valid date
      const date = new Date(lastUpdated + 'T00:00:00Z');
      expect(date.getTime()).not.toBeNaN();
    });
  });

  describe('async state management bugs', () => {
    it('should handle rapid mode/system changes', async () => {
      // Bug: Rapid changes might cause race conditions
      mockSystemLoader.getAvailableSystems.mockResolvedValue(['sol']);
      mockSystemLoader.loadSystem.mockImplementation((mode, systemId) => 
        Promise.resolve({
          id: systemId,
          name: `${systemId} System`,
          objects: [],
          lighting: { ambient_level: 0.1 },
          metadata: { version: '1.0', last_updated: '2024-01-01', coordinate_system: 'heliocentric', distance_unit: 'au' }
        })
      );

      const { result, rerender } = renderHook(
        ({ mode, systemId }) => useSystemData(mode, systemId),
        { initialProps: { mode: 'realistic', systemId: 'sol' } }
      );

      // Rapid changes
      rerender({ mode: 'star-citizen', systemId: 'stanton' });
      rerender({ mode: 'realistic', systemId: 'proxima-centauri' });
      rerender({ mode: 'star-citizen', systemId: 'sol' });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should end up with the final system
      expect(result.current.systemData?.id).toBe('sol');
    });

    it('should clean up properly when component unmounts', async () => {
      mockSystemLoader.getAvailableSystems.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(['sol']), 1000))
      );
      
      const { result, unmount } = renderHook(() => useSystemData('realistic', 'sol'));
      
      // Unmount before async operation completes
      unmount();
      
      // Should not cause errors or memory leaks
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('error propagation bugs', () => {
    it('should handle non-Error objects thrown from loader', async () => {
      // Bug: What if something throws a string or other non-Error object?
      mockSystemLoader.getAvailableSystems.mockRejectedValue('String error');
      
      const { result } = renderHook(() => useSystemData('realistic', 'sol'));
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.systemData?.id).toBe('emergency');
    });

    it('should handle undefined/null thrown from loader', async () => {
      mockSystemLoader.getAvailableSystems.mockRejectedValue(null);
      
      const { result } = renderHook(() => useSystemData('realistic', 'sol'));
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.systemData?.id).toBe('emergency');
    });
  });

  describe('loading progress state bugs', () => {
    it('should clear loading progress after timeout', async () => {
      mockSystemLoader.getAvailableSystems.mockResolvedValue(['sol']);
      mockSystemLoader.loadSystem.mockResolvedValue({
        id: 'sol',
        name: 'Sol System',
        objects: [],
        lighting: { ambient_level: 0.1 },
        metadata: { version: '1.0', last_updated: '2024-01-01', coordinate_system: 'heliocentric', distance_unit: 'au' }
      });

      const { result } = renderHook(() => useSystemData('realistic', 'sol'));
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Progress should be set initially
      expect(result.current.loadingProgress).toBeDefined();

      // Should clear after timeout (2 seconds)
      await waitFor(() => {
        expect(result.current.loadingProgress).toBe('');
      }, { timeout: 3000 });
    });
  });

  describe('memory leak potential bugs', () => {
    it('should not accumulate state across multiple loads', async () => {
      const mockSystems = ['sol', 'stanton', 'terra'];
      mockSystemLoader.getAvailableSystems.mockResolvedValue(mockSystems);
      mockSystemLoader.loadSystem.mockImplementation((mode, systemId) => 
        Promise.resolve({
          id: systemId,
          name: `${systemId} System`,
          objects: [],
          lighting: { ambient_level: 0.1 },
          metadata: { version: '1.0', last_updated: '2024-01-01', coordinate_system: 'heliocentric', distance_unit: 'au' }
        })
      );

      const { result, rerender } = renderHook(
        ({ systemId }) => useSystemData('realistic', systemId),
        { initialProps: { systemId: 'sol' } }
      );

      // Load multiple systems
      for (const systemId of mockSystems) {
        rerender({ systemId });
        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });
        expect(result.current.systemData?.id).toBe(systemId);
      }

      // availableSystems should be consistent and not accumulated
      expect(result.current.availableSystems).toEqual(mockSystems);
      expect(result.current.availableSystems.length).toBe(3); // Not 9 (3x3)
    });
  });
});