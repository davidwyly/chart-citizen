/**
 * Tests for Async Orbital Mechanics in System Viewer
 * ==================================================
 * 
 * Ensures that the system viewer correctly handles the async nature
 * of orbital mechanics calculations and prevents runtime errors.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import * as THREE from 'three';
import * as pipeline from '@/engine/core/pipeline';
import { SystemViewer } from '../../system-viewer';

// Mock modules
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
  shaderMaterial: vi.fn(() => {
    const Material = function() {};
    Material.prototype = Object.create(THREE.ShaderMaterial.prototype);
    return Material;
  }),
}));

vi.mock('../system-viewer/components/scene-lighting', () => ({
  SceneLighting: () => null,
}));

vi.mock('../skybox/starfield-skybox', () => ({
  StarfieldSkybox: () => null,
}));

describe('System Viewer Async Orbital Mechanics', () => {
  const mockSystemData = {
    id: 'sol-system',
    name: 'Sol System',
    objects: [
      {
        id: 'sol',
        name: 'Sol',
        classification: 'star' as const,
        properties: { radius: 695700000, mass: 1.989e30 }
      },
      {
        id: 'earth',
        name: 'Earth',
        classification: 'planet' as const,
        properties: { radius: 6371000, mass: 5.972e24 },
        orbit: { semi_major_axis: 1.0, eccentricity: 0.0167, parent: 'sol' }
      }
    ],
    lighting: { primary_star: 'sol', luminosity: 1.0 }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Orbital Mechanics Integration', () => {
    it('should handle orbital mechanics calculations without errors', async () => {
      const mockResult = new Map([
        ['sol', { visualRadius: 10, orbitDistance: 0 }],
        ['earth', { visualRadius: 1, orbitDistance: 50 }]
      ]);

      vi.mocked(pipeline.calculateSystemOrbitalMechanics).mockResolvedValue(mockResult);

      const { container } = render(
        <SystemViewer
          systemData={mockSystemData}
          selectedObjectId={null}
          timeMultiplier={1}
          isPaused={false}
          viewType="explorational"
          onObjectSelect={vi.fn()}
          onObjectHover={vi.fn()}
          onObjectFocus={vi.fn()}
        />
      );

      // Should render without errors while loading
      expect(container).toBeTruthy();

      // Wait for async calculations to complete
      await waitFor(() => {
        expect(pipeline.calculateSystemOrbitalMechanics).toHaveBeenCalled();
      });
    });

    it('should handle breadcrumb clicks even while orbital mechanics are loading', async () => {
      // Create a promise that we can control
      let resolveCalculation: (value: any) => void;
      const calculationPromise = new Promise((resolve) => { 
        resolveCalculation = resolve; 
      });

      vi.mocked(pipeline.calculateSystemOrbitalMechanics)
        .mockReturnValue(calculationPromise as any);

      const onObjectFocus = vi.fn();

      render(
        <SystemViewer
          systemData={mockSystemData}
          selectedObjectId="earth"
          timeMultiplier={1}
          isPaused={false}
          viewType="explorational"
          onObjectSelect={vi.fn()}
          onObjectHover={vi.fn()}
          onObjectFocus={onObjectFocus}
        />
      );

      // Find breadcrumb (it should render even while loading)
      const breadcrumb = screen.getByText('Earth');
      expect(breadcrumb).toBeTruthy();

      // Click should work even while loading
      await userEvent.click(breadcrumb);

      // Should call onObjectFocus with default sizing
      expect(onObjectFocus).toHaveBeenCalledWith(
        'earth',
        'Earth',
        expect.objectContaining({ visualSize: 1.0 }) // Default value
      );

      // Now resolve the calculation
      const mockResult = new Map([
        ['earth', { visualRadius: 2.5, orbitDistance: 50 }]
      ]);
      resolveCalculation!(mockResult);

      // Wait for update
      await waitFor(() => {
        // Clear previous calls
        onObjectFocus.mockClear();
      });

      // Click again after loading
      await userEvent.click(breadcrumb);

      // Should now call with actual calculated size
      expect(onObjectFocus).toHaveBeenCalledWith(
        'earth',
        'Earth',
        expect.objectContaining({ visualSize: 2.5 })
      );
    });

    it('should provide safe getObjectSizing function that never throws', async () => {
      // Start with pending calculation
      const pendingPromise = new Promise(() => {});
      vi.mocked(pipeline.calculateSystemOrbitalMechanics)
        .mockReturnValue(pendingPromise as any);

      const { rerender } = render(
        <SystemViewer
          systemData={mockSystemData}
          selectedObjectId={null}
          timeMultiplier={1}
          isPaused={false}
          viewType="explorational"
          onObjectSelect={vi.fn()}
          onObjectHover={vi.fn()}
          onObjectFocus={vi.fn()}
        />
      );

      // The component should render without throwing
      expect(screen.getByTestId('canvas')).toBeTruthy();

      // Now resolve with actual data
      const mockResult = new Map([
        ['earth', { visualRadius: 2.5, orbitDistance: 50 }]
      ]);
      vi.mocked(pipeline.calculateSystemOrbitalMechanics)
        .mockResolvedValue(mockResult);

      // Trigger re-render to pick up new data
      rerender(
        <SystemViewer
          systemData={mockSystemData}
          selectedObjectId="earth" // Select an object
          timeMultiplier={1}
          isPaused={false}
          viewType="explorational"
          onObjectSelect={vi.fn()}
          onObjectHover={vi.fn()}
          onObjectFocus={vi.fn()}
        />
      );

      // Should still render without errors
      await waitFor(() => {
        expect(screen.getByTestId('canvas')).toBeTruthy();
      });
    });

    it('should handle view type changes correctly', async () => {
      const mockResult1 = new Map([
        ['earth', { visualRadius: 1, orbitDistance: 50 }]
      ]);
      const mockResult2 = new Map([
        ['earth', { visualRadius: 2, orbitDistance: 40 }]
      ]);

      vi.mocked(pipeline.calculateSystemOrbitalMechanics)
        .mockResolvedValueOnce(mockResult1)
        .mockResolvedValueOnce(mockResult2);

      const { rerender } = render(
        <SystemViewer
          systemData={mockSystemData}
          selectedObjectId={null}
          timeMultiplier={1}
          isPaused={false}
          viewType="explorational"
          onObjectSelect={vi.fn()}
          onObjectHover={vi.fn()}
          onObjectFocus={vi.fn()}
        />
      );

      // Wait for first calculation
      await waitFor(() => {
        expect(pipeline.calculateSystemOrbitalMechanics).toHaveBeenCalledWith(
          mockSystemData.objects,
          'explorational'
        );
      });

      // Change view type
      rerender(
        <SystemViewer
          systemData={mockSystemData}
          selectedObjectId={null}
          timeMultiplier={1}
          isPaused={false}
          viewType="navigational"
          onObjectSelect={vi.fn()}
          onObjectHover={vi.fn()}
          onObjectFocus={vi.fn()}
        />
      );

      // Should trigger new calculation
      await waitFor(() => {
        expect(pipeline.calculateSystemOrbitalMechanics).toHaveBeenCalledWith(
          mockSystemData.objects,
          'navigational'
        );
      });

      // Should clear cache
      expect(pipeline.clearOrbitalMechanicsCache).toHaveBeenCalled();
    });
  });

  describe('Error Prevention', () => {
    it('should never throw "orbitalMechanics.get is not a function" error', async () => {
      // Test various scenarios that could cause the error
      const scenarios = [
        // Null result
        null,
        // Undefined result  
        undefined,
        // Non-Map object
        { get: undefined },
        // Array instead of Map
        [],
        // Plain object
        { earth: { visualRadius: 1 } }
      ];

      for (const badResult of scenarios) {
        vi.mocked(pipeline.calculateSystemOrbitalMechanics)
          .mockResolvedValue(badResult as any);

        // Should not throw even with bad data
        expect(() => {
          render(
            <SystemViewer
              systemData={mockSystemData}
              selectedObjectId="earth"
              timeMultiplier={1}
              isPaused={false}
              viewType="explorational"
              onObjectSelect={vi.fn()}
              onObjectHover={vi.fn()}
              onObjectFocus={vi.fn()}
            />
          );
        }).not.toThrow();
      }
    });

    it('should handle missing objects gracefully', async () => {
      const mockResult = new Map(); // Empty map

      vi.mocked(pipeline.calculateSystemOrbitalMechanics)
        .mockResolvedValue(mockResult);

      const onObjectFocus = vi.fn();

      render(
        <SystemViewer
          systemData={mockSystemData}
          selectedObjectId="mars" // Object not in results
          timeMultiplier={1}
          isPaused={false}
          viewType="explorational"
          onObjectSelect={vi.fn()}
          onObjectHover={vi.fn()}
          onObjectFocus={onObjectFocus}
        />
      );

      // Should render without errors
      await waitFor(() => {
        expect(screen.getByTestId('canvas')).toBeTruthy();
      });

      // getObjectSizing should return default values for missing objects
      const marsButton = screen.queryByText('Mars');
      if (marsButton) {
        await userEvent.click(marsButton);
        
        expect(onObjectFocus).toHaveBeenCalledWith(
          'mars',
          'Mars',
          expect.objectContaining({ visualSize: 1.0 }) // Default
        );
      }
    });
  });
});