/**
 * Tests for Hierarchy Manager
 * ===========================
 * 
 * Ensures the hierarchy manager correctly handles various object configurations
 * and prevents "No root objects found" errors.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { HierarchyManager } from '../hierarchy-manager';
import type { CelestialObject } from '@/engine/types/orbital-system';
import type { ScalingResult, SystemContext } from '@/engine/core/view-modes/strategies/view-mode-strategy';
import type { CalculationContext } from '../interfaces/calculation-services';

describe('HierarchyManager', () => {
  let hierarchyManager: HierarchyManager;
  
  beforeEach(() => {
    hierarchyManager = new HierarchyManager();
  });

  describe('Root Object Detection', () => {
    it('should identify objects without orbit property as root objects', async () => {
      const objects: CelestialObject[] = [
        {
          id: 'sol',
          name: 'Sol',
          classification: 'star',
          geometry_type: 'star',
          properties: { radius: 695700000, mass: 1.989e30 }
          // No orbit property - this is a root object
        },
        {
          id: 'earth',
          name: 'Earth',
          classification: 'planet',
          geometry_type: 'terrestrial',
          orbit: { 
            parent: 'sol',
            semi_major_axis: 1.0,
            eccentricity: 0.0167,
            inclination: 0,
            orbital_period: 365.25
          },
          properties: { radius: 6371000, mass: 5.972e24 }
        }
      ];

      // Should not throw
      const hierarchy = await hierarchyManager.buildHierarchy(objects);
      
      expect(hierarchy).toBeDefined();
      expect(hierarchy.object.id).toBe('sol');
      expect(hierarchy.children).toHaveLength(1);
      expect(hierarchy.children[0].object.id).toBe('earth');
    });

    it('should identify objects with orbit but no parent as root objects', async () => {
      const objects: CelestialObject[] = [
        {
          id: 'sol',
          name: 'Sol',
          classification: 'star',
          geometry_type: 'star',
          orbit: {
            parent: '', // Empty parent
            semi_major_axis: 0,
            eccentricity: 0,
            inclination: 0,
            orbital_period: 0
          },
          properties: { radius: 695700000, mass: 1.989e30 }
        }
      ];

      // Should not throw
      const hierarchy = await hierarchyManager.buildHierarchy(objects);
      
      expect(hierarchy).toBeDefined();
      expect(hierarchy.object.id).toBe('sol');
    });

    it('should handle multiple root objects (binary systems)', async () => {
      const objects: CelestialObject[] = [
        {
          id: 'alpha-centauri-a',
          name: 'Alpha Centauri A',
          classification: 'star',
          geometry_type: 'star',
          properties: { radius: 851000000, mass: 2.187e30 }
          // No orbit - root object
        },
        {
          id: 'alpha-centauri-b',
          name: 'Alpha Centauri B',
          classification: 'star',
          geometry_type: 'star',
          properties: { radius: 602000000, mass: 1.804e30 }
          // No orbit - also a root object
        }
      ];

      // Should handle multiple roots (picks first one)
      const hierarchy = await hierarchyManager.buildHierarchy(objects);
      
      expect(hierarchy).toBeDefined();
      expect(hierarchy.object.id).toBe('alpha-centauri-a');
    });

    it('should use fallback when no clear root objects found', async () => {
      const objects: CelestialObject[] = [
        {
          id: 'earth',
          name: 'Earth',
          classification: 'planet',
          geometry_type: 'terrestrial',
          orbit: { 
            parent: 'sol', // Parent doesn't exist in array
            semi_major_axis: 1.0,
            eccentricity: 0.0167,
            inclination: 0,
            orbital_period: 365.25
          },
          properties: { radius: 6371000, mass: 5.972e24 }
        },
        {
          id: 'luna',
          name: 'Luna',
          classification: 'moon',
          geometry_type: 'rocky',
          orbit: { 
            parent: 'earth',
            semi_major_axis: 0.00257,
            eccentricity: 0.0549,
            inclination: 5.145,
            orbital_period: 27.32
          },
          properties: { radius: 1737000, mass: 7.342e22 }
        }
      ];

      // Should use fallback (first object as root) when no clear root is found
      const result = await hierarchyManager.buildHierarchy(objects);
      expect(result.object.id).toBe('earth'); // First object becomes root
      expect(result.isRoot).toBe(true);
    });

    it('should handle empty object array', async () => {
      const objects: CelestialObject[] = [];

      // Should throw with empty array
      await expect(hierarchyManager.buildHierarchy(objects))
        .rejects.toThrow('No objects provided to build hierarchy');
    });
  });

  describe('Hierarchy Enforcement', () => {
    it('should enforce hierarchy with proper visual sizes', async () => {
      const objects: CelestialObject[] = [
        {
          id: 'sol',
          name: 'Sol',
          classification: 'star',
          geometry_type: 'star',
          properties: { radius: 695700000, mass: 1.989e30 }
        },
        {
          id: 'earth',
          name: 'Earth',
          classification: 'planet',
          geometry_type: 'terrestrial',
          orbit: { 
            parent: 'sol',
            semi_major_axis: 1.0,
            eccentricity: 0.0167,
            inclination: 0,
            orbital_period: 365.25
          },
          properties: { radius: 6371000, mass: 5.972e24 }
        }
      ];

      const visualSizes = new Map<string, ScalingResult>([
        ['sol', { 
          visualRadius: 10,
          isFixedSize: false,
          scalingMethod: 'logarithmic',
          relativeScale: 1.0
        }],
        ['earth', { 
          visualRadius: 15, // Larger than parent - should be adjusted
          isFixedSize: false,
          scalingMethod: 'logarithmic',
          relativeScale: 0.5
        }]
      ]);

      const mockContext: CalculationContext = {
        strategy: {} as any,
        systemContext: {} as SystemContext,
        config: {
          visual: {
            hierarchyConstraints: {
              maxChildToParentRatio: 0.8,
              minChildToParentRatio: 0.1,
              enforceHierarchy: true,
            },
            sizeConstraints: {
              minVisualSize: 0.1,
              maxVisualSize: 100,
            }
          }
        } as any,
        viewMode: 'explorational'
      };

      const adjustedSizes = await hierarchyManager.enforceHierarchy(
        objects,
        visualSizes,
        mockContext
      );

      // Earth should be smaller than Sol
      const solSize = adjustedSizes.get('sol')?.visualRadius || 0;
      const earthSize = adjustedSizes.get('earth')?.visualRadius || 0;
      
      expect(earthSize).toBeLessThan(solSize);
    });

    it('should handle objects without orbit in hierarchy enforcement', async () => {
      const objects: CelestialObject[] = [
        {
          id: 'sol',
          name: 'Sol',
          classification: 'star',
          geometry_type: 'star',
          properties: { radius: 695700000, mass: 1.989e30 }
          // No orbit property
        }
      ];

      const visualSizes = new Map<string, ScalingResult>([
        ['sol', { 
          visualSize: 10,
          priority: 1,
          metadata: { originalRadius: 695700000, scalingMethod: 'logarithmic' }
        }]
      ]);

      const mockContext: CalculationContext = {
        strategy: {} as any,
        systemContext: {} as SystemContext,
        config: {} as any,
        viewMode: 'explorational'
      };

      // Should not throw
      const adjustedSizes = await hierarchyManager.enforceHierarchy(
        objects,
        visualSizes,
        mockContext
      );

      expect(adjustedSizes.get('sol')).toBeDefined();
    });
  });

  describe('Complex Hierarchy Scenarios', () => {
    it('should handle moon systems correctly', async () => {
      const objects: CelestialObject[] = [
        {
          id: 'sol',
          name: 'Sol',
          classification: 'star',
          geometry_type: 'star',
          properties: { radius: 695700000, mass: 1.989e30 }
        },
        {
          id: 'jupiter',
          name: 'Jupiter',
          classification: 'planet',
          geometry_type: 'gas_giant',
          orbit: { 
            parent: 'sol',
            semi_major_axis: 5.2,
            eccentricity: 0.048,
            inclination: 1.303,
            orbital_period: 4332.59
          },
          properties: { radius: 69911000, mass: 1.898e27 }
        },
        {
          id: 'io',
          name: 'Io',
          classification: 'moon',
          geometry_type: 'rocky',
          orbit: { 
            parent: 'jupiter',
            semi_major_axis: 0.00282,
            eccentricity: 0.0041,
            inclination: 0.036,
            orbital_period: 1.77
          },
          properties: { radius: 1821600, mass: 8.93e22 }
        }
      ];

      const hierarchy = await hierarchyManager.buildHierarchy(objects);
      
      expect(hierarchy.object.id).toBe('sol');
      expect(hierarchy.children).toHaveLength(1);
      expect(hierarchy.children[0].object.id).toBe('jupiter');
      expect(hierarchy.children[0].children).toHaveLength(1);
      expect(hierarchy.children[0].children[0].object.id).toBe('io');
    });

    it('should handle belt objects', async () => {
      const objects: CelestialObject[] = [
        {
          id: 'sol',
          name: 'Sol',
          classification: 'star',
          geometry_type: 'star',
          properties: { radius: 695700000, mass: 1.989e30 }
        },
        {
          id: 'asteroid-belt',
          name: 'Asteroid Belt',
          classification: 'belt',
          geometry_type: 'belt',
          orbit: { 
            parent: 'sol',
            inner_radius: 2.2,
            outer_radius: 3.2,
            inclination: 0,
            eccentricity: 0.1
          },
          properties: { radius: 0, mass: 3e21 }
        }
      ];

      const hierarchy = await hierarchyManager.buildHierarchy(objects);
      
      expect(hierarchy.object.id).toBe('sol');
      expect(hierarchy.children).toHaveLength(1);
      expect(hierarchy.children[0].object.id).toBe('asteroid-belt');
    });
  });
});