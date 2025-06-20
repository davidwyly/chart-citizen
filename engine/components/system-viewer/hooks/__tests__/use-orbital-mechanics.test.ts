/**
 * Tests for useOrbitalMechanics Hook
 * ==================================
 * 
 * Ensures the async orbital mechanics calculations are handled correctly
 * and prevent the "result.get is not a function" error from happening again.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useOrbitalMechanics, useOrbitalMechanicsWithDefault } from '../use-orbital-mechanics';
import * as pipeline from '@/engine/core/pipeline';

// Mock the pipeline module
vi.mock('@/engine/core/pipeline', () => ({
  calculateSystemOrbitalMechanics: vi.fn(),
  clearOrbitalMechanicsCache: vi.fn(),
}));

describe('useOrbitalMechanics', () => {
  const mockObjects = [
    {
      id: 'sol',
      name: 'Sol',
      classification: 'star',
      properties: { radius: 695700000, mass: 1.989e30 }
    },
    {
      id: 'earth',
      name: 'Earth', 
      classification: 'planet',
      properties: { radius: 6371000, mass: 5.972e24 },
      orbit: { semi_major_axis: 1.0, eccentricity: 0.0167, parent: 'sol' }
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Async Calculation Handling', () => {
    it('should return null while loading', () => {
      // Mock a pending promise
      const pendingPromise = new Promise(() => {});
      vi.mocked(pipeline.calculateSystemOrbitalMechanics).mockReturnValue(pendingPromise as any);

      const { result } = renderHook(() => 
        useOrbitalMechanics(mockObjects, 'explorational')
      );

      // Should return null while loading
      expect(result.current).toBeNull();
    });

    it('should return the calculated Map when promise resolves', async () => {
      const mockResult = new Map([
        ['sol', { visualRadius: 10, orbitDistance: 0 }],
        ['earth', { visualRadius: 1, orbitDistance: 50 }]
      ]);

      vi.mocked(pipeline.calculateSystemOrbitalMechanics).mockResolvedValue(mockResult);

      const { result } = renderHook(() => 
        useOrbitalMechanics(mockObjects, 'explorational')
      );

      // Wait for the promise to resolve
      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      // Should return the Map with proper get() method
      expect(result.current).toBeInstanceOf(Map);
      expect(result.current?.get('sol')).toEqual({ visualRadius: 10, orbitDistance: 0 });
      expect(result.current?.get('earth')).toEqual({ visualRadius: 1, orbitDistance: 50 });
    });

    it('should handle calculation errors gracefully', async () => {
      const mockError = new Error('Calculation failed');
      vi.mocked(pipeline.calculateSystemOrbitalMechanics).mockRejectedValue(mockError);

      const { result } = renderHook(() => 
        useOrbitalMechanics(mockObjects, 'explorational')
      );

      // Wait for the promise to reject
      await waitFor(() => {
        // Should still return null on error
        expect(result.current).toBeNull();
      });
    });

    it('should clear cache when view type changes', async () => {
      const mockResult = new Map([['sol', { visualRadius: 10, orbitDistance: 0 }]]);
      vi.mocked(pipeline.calculateSystemOrbitalMechanics).mockResolvedValue(mockResult);

      const { result, rerender } = renderHook(
        ({ viewType }) => useOrbitalMechanics(mockObjects, viewType),
        { initialProps: { viewType: 'explorational' as const } }
      );

      // Wait for initial calculation
      await waitFor(() => expect(result.current).not.toBeNull());

      // Clear mocks to track new calls
      vi.clearAllMocks();

      // Change view type
      rerender({ viewType: 'navigational' });

      // Should clear cache when view type changes
      expect(pipeline.clearOrbitalMechanicsCache).toHaveBeenCalledTimes(1);
      expect(pipeline.calculateSystemOrbitalMechanics).toHaveBeenCalledWith(
        mockObjects,
        'navigational'
      );
    });

    it('should handle race conditions when view type changes rapidly', async () => {
      let resolveFirst: (value: any) => void;
      let resolveSecond: (value: any) => void;

      const firstPromise = new Promise((resolve) => { resolveFirst = resolve; });
      const secondPromise = new Promise((resolve) => { resolveSecond = resolve; });

      vi.mocked(pipeline.calculateSystemOrbitalMechanics)
        .mockReturnValueOnce(firstPromise as any)
        .mockReturnValueOnce(secondPromise as any);

      const { result, rerender } = renderHook(
        ({ viewType }) => useOrbitalMechanics(mockObjects, viewType),
        { initialProps: { viewType: 'explorational' as const } }
      );

      // Change view type quickly
      rerender({ viewType: 'navigational' });

      // Resolve second calculation first
      const secondResult = new Map([['sol', { visualRadius: 20, orbitDistance: 0 }]]);
      resolveSecond!(secondResult);

      await waitFor(() => {
        expect(result.current).toEqual(secondResult);
      });

      // Resolve first calculation later
      const firstResult = new Map([['sol', { visualRadius: 10, orbitDistance: 0 }]]);
      resolveFirst!(firstResult);

      // Should ignore the first result since it's outdated
      await waitFor(() => {
        expect(result.current).toEqual(secondResult); // Should still be second result
      });
    });
  });

  describe('useOrbitalMechanicsWithDefault', () => {
    it('should return empty Map while loading', () => {
      // Mock a pending promise
      const pendingPromise = new Promise(() => {});
      vi.mocked(pipeline.calculateSystemOrbitalMechanics).mockReturnValue(pendingPromise as any);

      const { result } = renderHook(() => 
        useOrbitalMechanicsWithDefault(mockObjects, 'explorational')
      );

      // Should return empty Map, not null
      expect(result.current).toBeInstanceOf(Map);
      expect(result.current.size).toBe(0);
      // Verify get() method exists and works
      expect(result.current.get('anything')).toBeUndefined();
    });

    it('should return calculated Map when available', async () => {
      const mockResult = new Map([
        ['sol', { visualRadius: 10, orbitDistance: 0 }]
      ]);

      vi.mocked(pipeline.calculateSystemOrbitalMechanics).mockResolvedValue(mockResult);

      const { result } = renderHook(() => 
        useOrbitalMechanicsWithDefault(mockObjects, 'explorational')
      );

      await waitFor(() => {
        expect(result.current.size).toBeGreaterThan(0);
      });

      expect(result.current).toEqual(mockResult);
    });
  });

  describe('Prevention of "result.get is not a function" Error', () => {
    it('should always return an object with get() method', async () => {
      const mockResult = new Map([['test', { visualRadius: 1, orbitDistance: 10 }]]);
      vi.mocked(pipeline.calculateSystemOrbitalMechanics).mockResolvedValue(mockResult);

      const { result } = renderHook(() => 
        useOrbitalMechanicsWithDefault(mockObjects, 'explorational')
      );

      // Check immediately (while loading)
      expect(typeof result.current.get).toBe('function');
      expect(() => result.current.get('test')).not.toThrow();

      // Check after loading
      await waitFor(() => {
        expect(result.current.size).toBeGreaterThan(0);
      });

      expect(typeof result.current.get).toBe('function');
      expect(result.current.get('test')).toEqual({ visualRadius: 1, orbitDistance: 10 });
    });

    it('should handle synchronous-looking usage in components', async () => {
      const mockResult = new Map([
        ['neptune', { visualRadius: 5, orbitDistance: 200 }]
      ]);

      vi.mocked(pipeline.calculateSystemOrbitalMechanics).mockResolvedValue(mockResult);

      const { result } = renderHook(() => 
        useOrbitalMechanicsWithDefault(mockObjects, 'explorational')
      );

      // Simulate component usage
      const getObjectSize = (id: string) => {
        const mechanics = result.current.get(id);
        return mechanics?.visualRadius || 1.0;
      };

      // Should work even while loading
      expect(getObjectSize('neptune')).toBe(1.0); // Default value

      // Should work after loading
      await waitFor(() => {
        expect(result.current.size).toBeGreaterThan(0);
      });

      expect(getObjectSize('neptune')).toBe(5);
    });
  });
});