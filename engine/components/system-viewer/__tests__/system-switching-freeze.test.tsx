/**
 * Tests for System Switching Freeze Issue
 * =======================================
 * 
 * Reproduces and prevents the app freeze when clicking on another system.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { SystemViewer } from '../../system-viewer';
import * as systemLoader from '@/engine/system-loader';
import * as pipeline from '@/engine/core/pipeline';

// Mock modules
vi.mock('@/engine/system-loader', () => ({
  engineSystemLoader: {
    getAvailableSystems: vi.fn(),
    loadSystem: vi.fn(),
  }
}));

vi.mock('@/engine/core/pipeline', () => ({
  calculateSystemOrbitalMechanics: vi.fn(),
  clearOrbitalMechanicsCache: vi.fn(),
}));

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: any) => <div data-testid="canvas">{children}</div>,
}));

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => null,
  Preload: () => null,
}));

describe('System Switching Freeze Prevention', () => {
  const mockSystemData1 = {
    id: 'sol',
    name: 'Sol System',
    description: 'Our home system',
    objects: [
      {
        id: 'sol',
        name: 'Sol',
        classification: 'star' as const,
        geometry_type: 'star' as const,
        properties: { radius: 695700000, mass: 1.989e30 }
      }
    ],
    lighting: { primary_star: 'sol', luminosity: 1.0 }
  };

  const mockSystemData2 = {
    id: 'alpha-centauri',
    name: 'Alpha Centauri',
    description: 'Nearest star system',
    objects: [
      {
        id: 'alpha-centauri-a',
        name: 'Alpha Centauri A',
        classification: 'star' as const,
        geometry_type: 'star' as const,
        properties: { radius: 851000000, mass: 2.187e30 }
      }
    ],
    lighting: { primary_star: 'alpha-centauri-a', luminosity: 1.5 }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock system loader
    vi.mocked(systemLoader.engineSystemLoader.getAvailableSystems)
      .mockResolvedValue(['sol', 'alpha-centauri']);
    
    // Mock orbital mechanics calculation
    const mockResult = new Map([
      ['sol', { visualRadius: 10, orbitDistance: 0 }]
    ]);
    vi.mocked(pipeline.calculateSystemOrbitalMechanics)
      .mockResolvedValue(mockResult);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('System Switching', () => {
    it('should handle rapid system switching without freezing', async () => {
      let loadSystemCalls = 0;
      let resolveSystem1: (value: any) => void;
      let resolveSystem2: (value: any) => void;

      const system1Promise = new Promise((resolve) => { resolveSystem1 = resolve; });
      const system2Promise = new Promise((resolve) => { resolveSystem2 = resolve; });

      // Mock alternating system loads
      vi.mocked(systemLoader.engineSystemLoader.loadSystem)
        .mockImplementation((systemId) => {
          loadSystemCalls++;
          if (systemId === 'sol') {
            return system1Promise as any;
          } else {
            return system2Promise as any;
          }
        });

      const { rerender } = render(
        <SystemViewer
          mode="realistic"
          systemId="sol"
          onSystemChange={vi.fn()}
        />
      );

      // Should show loading state
      expect(screen.getByText(/Loading sol.../)).toBeTruthy();

      // Quickly switch to another system before first loads
      rerender(
        <SystemViewer
          mode="realistic"
          systemId="alpha-centauri"
          onSystemChange={vi.fn()}
        />
      );

      // Should cancel first load and show new loading state
      expect(screen.getByText(/Loading alpha-centauri.../)).toBeTruthy();

      // Resolve both in wrong order
      resolveSystem1!(mockSystemData1); // Old request
      resolveSystem2!(mockSystemData2); // New request

      // Should only use the second system data
      await waitFor(() => {
        expect(screen.queryByText(/Loading/)).toBeNull();
      });

      // Verify no infinite loops or excessive calls
      expect(loadSystemCalls).toBeLessThanOrEqual(2);
      expect(pipeline.calculateSystemOrbitalMechanics).toHaveBeenCalled();
      
      // Should not have frozen
      expect(screen.getByTestId('canvas')).toBeTruthy();
    });

    it('should cancel ongoing orbital mechanics calculations when switching systems', async () => {
      let calculationCount = 0;
      let resolveCalc1: (value: any) => void;
      let resolveCalc2: (value: any) => void;

      const calc1Promise = new Promise((resolve) => { resolveCalc1 = resolve; });
      const calc2Promise = new Promise((resolve) => { resolveCalc2 = resolve; });

      vi.mocked(systemLoader.engineSystemLoader.loadSystem)
        .mockResolvedValueOnce(mockSystemData1)
        .mockResolvedValueOnce(mockSystemData2);

      vi.mocked(pipeline.calculateSystemOrbitalMechanics)
        .mockImplementation(() => {
          calculationCount++;
          if (calculationCount === 1) {
            return calc1Promise as any;
          } else {
            return calc2Promise as any;
          }
        });

      const { rerender } = render(
        <SystemViewer
          mode="realistic"
          systemId="sol"
          onSystemChange={vi.fn()}
        />
      );

      // Wait for first system to load
      await waitFor(() => {
        expect(systemLoader.engineSystemLoader.loadSystem).toHaveBeenCalledWith('sol', 'realistic');
      });

      // Switch system before calculations complete
      rerender(
        <SystemViewer
          mode="realistic"
          systemId="alpha-centauri"
          onSystemChange={vi.fn()}
        />
      );

      // Resolve calculations in reverse order
      const mockResult2 = new Map([['alpha-centauri-a', { visualRadius: 12, orbitDistance: 0 }]]);
      resolveCalc2!(mockResult2);
      
      const mockResult1 = new Map([['sol', { visualRadius: 10, orbitDistance: 0 }]]);
      resolveCalc1!(mockResult1);

      // Should complete without freezing
      await waitFor(() => {
        expect(screen.getByTestId('canvas')).toBeTruthy();
      });

      // Should have cleared cache when switching
      expect(pipeline.clearOrbitalMechanicsCache).toHaveBeenCalled();
    });

    it('should handle system switching errors gracefully', async () => {
      vi.mocked(systemLoader.engineSystemLoader.loadSystem)
        .mockResolvedValueOnce(mockSystemData1)
        .mockRejectedValueOnce(new Error('Failed to load system'));

      const onSystemChange = vi.fn();

      const { rerender } = render(
        <SystemViewer
          mode="realistic"
          systemId="sol"
          onSystemChange={onSystemChange}
        />
      );

      // Wait for first system to load
      await waitFor(() => {
        expect(screen.getByTestId('canvas')).toBeTruthy();
      });

      // Switch to failing system
      rerender(
        <SystemViewer
          mode="realistic"
          systemId="invalid-system"
          onSystemChange={onSystemChange}
        />
      );

      // Should show error state, not freeze
      await waitFor(() => {
        expect(screen.getByText(/Failed to load system/)).toBeTruthy();
      });

      // Should be able to recover by switching back
      rerender(
        <SystemViewer
          mode="realistic"
          systemId="sol"
          onSystemChange={onSystemChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('canvas')).toBeTruthy();
      });
    });
  });

  describe('Memory Leak Prevention', () => {
    it('should cleanup resources when unmounting during load', async () => {
      let resolveSystem: (value: any) => void;
      const systemPromise = new Promise((resolve) => { resolveSystem = resolve; });

      vi.mocked(systemLoader.engineSystemLoader.loadSystem)
        .mockReturnValue(systemPromise as any);

      const { unmount } = render(
        <SystemViewer
          mode="realistic"
          systemId="sol"
          onSystemChange={vi.fn()}
        />
      );

      // Unmount while loading
      unmount();

      // Resolve after unmount
      resolveSystem!(mockSystemData1);

      // Should not cause errors or memory leaks
      // (Test passes if no errors are thrown)
    });

    it('should prevent infinite calculation loops', async () => {
      let calculationCount = 0;

      vi.mocked(systemLoader.engineSystemLoader.loadSystem)
        .mockResolvedValue(mockSystemData1);

      vi.mocked(pipeline.calculateSystemOrbitalMechanics)
        .mockImplementation(async () => {
          calculationCount++;
          if (calculationCount > 10) {
            throw new Error('Infinite loop detected in test');
          }
          return new Map([['sol', { visualRadius: 10, orbitDistance: 0 }]]);
        });

      render(
        <SystemViewer
          mode="realistic"
          systemId="sol"
          onSystemChange={vi.fn()}
        />
      );

      // Wait for calculations
      await waitFor(() => {
        expect(screen.getByTestId('canvas')).toBeTruthy();
      }, { timeout: 5000 });

      // Should not have excessive calculations
      expect(calculationCount).toBeLessThanOrEqual(3); // Initial + potential retries
    });
  });

  describe('Race Condition Prevention', () => {
    it('should handle concurrent system and view mode changes', async () => {
      vi.mocked(systemLoader.engineSystemLoader.loadSystem)
        .mockResolvedValue(mockSystemData1);

      const mockResult = new Map([['sol', { visualRadius: 10, orbitDistance: 0 }]]);
      vi.mocked(pipeline.calculateSystemOrbitalMechanics)
        .mockResolvedValue(mockResult);

      const { rerender } = render(
        <SystemViewer
          mode="realistic"
          systemId="sol"
          onSystemChange={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('canvas')).toBeTruthy();
      });

      // Simulate rapid changes
      const changes = [
        { systemId: 'alpha-centauri', mode: 'realistic' },
        { systemId: 'sol', mode: 'star-citizen' },
        { systemId: 'alpha-centauri', mode: 'star-citizen' },
        { systemId: 'sol', mode: 'realistic' },
      ];

      for (const change of changes) {
        rerender(
          <SystemViewer
            mode={change.mode}
            systemId={change.systemId}
            onSystemChange={vi.fn()}
          />
        );
      }

      // Should complete without freezing
      await waitFor(() => {
        expect(screen.getByTestId('canvas')).toBeTruthy();
      }, { timeout: 5000 });

      // Should have cancelled intermediate calculations
      expect(pipeline.clearOrbitalMechanicsCache).toHaveBeenCalled();
    });
  });
});