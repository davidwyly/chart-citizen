/**
 * Binary Star Orbit Tests
 * =======================
 * 
 * Tests for proper handling of binary star systems with barycenter orbits.
 * Ensures that stars are properly positioned and clickable.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { OrbitPositionCalculator } from '../orbit-position-calculator';
import type { CelestialObject } from '@/engine/types/orbital-system';
import type { ScalingResult } from '@/engine/core/view-modes/strategies/view-mode-strategy';
import type { CalculationContext } from '../interfaces/calculation-services';
import { DEFAULT_RENDERING_CONFIGURATION } from '../../../core/configuration/rendering-configuration';
import { ExplorationalStrategy } from '../../../core/view-modes/strategies/explorational-strategy';
import { NavigationalStrategy } from '../../../core/view-modes/strategies/navigational-strategy';
import { ViewModeStrategyUtils } from '../../../core/view-modes/strategies/view-mode-strategy';
import type { ViewType } from '@lib/types/effects-level';

// Helper function to create mock calculation context
const createMockCalculationContext = (objects: CelestialObject[], viewMode: ViewType): CalculationContext => {
  const strategy = viewMode === 'navigational' 
    ? new NavigationalStrategy() 
    : new ExplorationalStrategy();
  
  // Create mock system context
  const systemContext = {
    primaryStar: objects.find(obj => obj.classification === 'star') || objects[0],
    earthReference: objects.find(obj => obj.id === 'earth'),
    totalObjects: objects.length,
    maxOrbitalRadius: 100,
    minOrbitalRadius: 0.1,
    hasMultipleStars: objects.filter(obj => obj.classification === 'star').length > 1,
    hasMoons: objects.some(obj => obj.classification === 'moon'),
    systemComplexity: 'moderate' as const
  };
  
  return {
    objects,
    viewMode,
    strategy,
    systemContext,
    config: DEFAULT_RENDERING_CONFIGURATION
  };
};

describe('Binary Star Orbital Mechanics', () => {
  let calculator: OrbitPositionCalculator;
  let mockVisualSizes: Map<string, ScalingResult>;

  beforeEach(() => {
    calculator = new OrbitPositionCalculator();
    
    // Mock visual sizes for stars
    mockVisualSizes = new Map([
      ['alpha-centauri-a', {
        visualRadius: 2.0,
        isFixedSize: false,
        scalingMethod: 'logarithmic',
        relativeScale: 1.0
      }],
      ['alpha-centauri-b', {
        visualRadius: 1.8,
        isFixedSize: false,
        scalingMethod: 'logarithmic',
        relativeScale: 0.9
      }],
      ['proxima-centauri', {
        visualRadius: 1.2,
        isFixedSize: false,
        scalingMethod: 'logarithmic',
        relativeScale: 0.6
      }]
    ]);
  });

  describe('Alpha Centauri System', () => {
    const alphaCentauriSystem: CelestialObject[] = [
      {
        id: 'alpha-centauri-a',
        name: 'Alpha Centauri A',
        classification: 'star',
        geometry_type: 'star',
        properties: { radius: 695700, mass: 1.1 },
        orbit: {
          parent: 'barycenter',
          semi_major_axis: 11.2,
          eccentricity: 0.52,
          inclination: 0,
          orbital_period: 29200
        }
      },
      {
        id: 'alpha-centauri-b',
        name: 'Alpha Centauri B',
        classification: 'star',
        geometry_type: 'star',
        properties: { radius: 695700, mass: 0.93 },
        orbit: {
          parent: 'barycenter',
          semi_major_axis: 11.8,
          eccentricity: 0.52,
          inclination: 0,
          orbital_period: 29200
        }
      },
      {
        id: 'proxima-centauri',
        name: 'Proxima Centauri',
        classification: 'star',
        geometry_type: 'star',
        properties: { radius: 695700, mass: 0.12 },
        orbit: {
          parent: 'barycenter',
          semi_major_axis: 13000,
          eccentricity: 0.5,
          inclination: 107,
          orbital_period: 1460000
        }
      },
      {
        id: 'proxima-b',
        name: 'Proxima Centauri b',
        classification: 'planet',
        geometry_type: 'terrestrial',
        properties: { radius: 6371, mass: 1.17 },
        orbit: {
          parent: 'proxima-centauri',
          semi_major_axis: 0.0485,
          eccentricity: 0.02,
          inclination: 0,
          orbital_period: 11.2
        }
      }
    ];

    it('should calculate non-zero positions for all binary stars', async () => {
      const context = createMockCalculationContext(alphaCentauriSystem, 'explorational');
      
      const positions = await calculator.calculateOrbitalPositions(
        alphaCentauriSystem,
        mockVisualSizes,
        context
      );

      // All stars should have calculated positions
      expect(positions.has('alpha-centauri-a')).toBe(true);
      expect(positions.has('alpha-centauri-b')).toBe(true);
      expect(positions.has('proxima-centauri')).toBe(true);

      // Binary stars should have non-zero positions
      const alphaAPosition = positions.get('alpha-centauri-a')!;
      const alphaBPosition = positions.get('alpha-centauri-b')!;
      const proximaPosition = positions.get('proxima-centauri')!;

      expect(alphaAPosition).toBeGreaterThan(0);
      expect(alphaBPosition).toBeGreaterThan(0);
      expect(proximaPosition).toBeGreaterThan(0);

      console.log('Alpha Centauri A position:', alphaAPosition);
      console.log('Alpha Centauri B position:', alphaBPosition);
      console.log('Proxima Centauri position:', proximaPosition);
    });

    it('should handle equidistant spacing in navigational mode', async () => {
      const context = createMockCalculationContext(alphaCentauriSystem, 'navigational');
      
      const positions = await calculator.calculateOrbitalPositions(
        alphaCentauriSystem,
        mockVisualSizes,
        context
      );

      // All stars should have reasonable, non-zero positions
      const alphaAPosition = positions.get('alpha-centauri-a')!;
      const alphaBPosition = positions.get('alpha-centauri-b')!;
      const proximaPosition = positions.get('proxima-centauri')!;

      expect(alphaAPosition).toBeGreaterThan(0);
      expect(alphaBPosition).toBeGreaterThan(0);
      expect(proximaPosition).toBeGreaterThan(0);

      // In navigational mode, positions should be based on equidistant spacing
      expect(alphaAPosition).toBeLessThan(100); // Reasonable viewing distance
      expect(alphaBPosition).toBeLessThan(100);
      expect(proximaPosition).toBeLessThan(100);
    });

    it('should calculate different positions for each star', async () => {
      const context = createMockCalculationContext(alphaCentauriSystem, 'explorational');
      
      const positions = await calculator.calculateOrbitalPositions(
        alphaCentauriSystem,
        mockVisualSizes,
        context
      );

      const alphaAPosition = positions.get('alpha-centauri-a')!;
      const alphaBPosition = positions.get('alpha-centauri-b')!;
      const proximaPosition = positions.get('proxima-centauri')!;

      // Each star should have a different position
      expect(alphaAPosition).not.toBe(alphaBPosition);
      expect(alphaAPosition).not.toBe(proximaPosition);
      expect(alphaBPosition).not.toBe(proximaPosition);
    });

    it('should properly calculate planet orbit around binary star component', async () => {
      const context = createMockCalculationContext(alphaCentauriSystem, 'explorational');
      
      const positions = await calculator.calculateOrbitalPositions(
        alphaCentauriSystem,
        mockVisualSizes,
        context
      );

      // Proxima b should orbit Proxima Centauri, not the barycenter
      expect(positions.has('proxima-b')).toBe(true);
      const proximaBPosition = positions.get('proxima-b')!;
      expect(proximaBPosition).toBeGreaterThan(0);

      // Planet orbit should be much smaller than star orbit distances
      const proximaPosition = positions.get('proxima-centauri')!;
      expect(proximaBPosition).toBeLessThan(proximaPosition);
    });
  });

  describe('Single Star System', () => {
    const singleStarSystem: CelestialObject[] = [
      {
        id: 'sol',
        name: 'Sol',
        classification: 'star',
        geometry_type: 'star',
        properties: { radius: 695700, mass: 1.0 }
        // No orbit property - single star at origin
      },
      {
        id: 'earth',
        name: 'Earth',
        classification: 'planet',
        geometry_type: 'terrestrial',
        properties: { radius: 6371, mass: 1.0 },
        orbit: {
          parent: 'sol',
          semi_major_axis: 1.0,
          eccentricity: 0.0167,
          inclination: 0,
          orbital_period: 365.25
        }
      }
    ];

    it('should place single stars at origin', async () => {
      const context = createMockCalculationContext(singleStarSystem, 'explorational');
      
      const singleStarVisualSizes = new Map([
        ['sol', {
          visualRadius: 2.0,
          isFixedSize: false,
          scalingMethod: 'logarithmic',
          relativeScale: 1.0
        }],
        ['earth', {
          visualRadius: 1.0,
          isFixedSize: false,
          scalingMethod: 'logarithmic',
          relativeScale: 1.0
        }]
      ]);

      const positions = await calculator.calculateOrbitalPositions(
        singleStarSystem,
        singleStarVisualSizes,
        context
      );

      // Single star should be at origin (distance 0)
      expect(positions.get('sol')).toBe(0);
      
      // Planet should have calculated orbit
      expect(positions.get('earth')).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle stars with missing orbit data', async () => {
      const incompleteSystem: CelestialObject[] = [
        {
          id: 'incomplete-star',
          name: 'Incomplete Star',
          classification: 'star',
          geometry_type: 'star',
          properties: { radius: 695700, mass: 1.0 },
          orbit: {
            parent: 'barycenter'
            // Missing semi_major_axis
          } as any
        }
      ];

      const context = createMockCalculationContext(incompleteSystem, 'explorational');
      
      const positions = await calculator.calculateOrbitalPositions(
        incompleteSystem,
        mockVisualSizes,
        context
      );

      // Should handle gracefully, likely returning 0
      expect(positions.has('incomplete-star')).toBe(true);
    });

    it('should handle empty barycenter orbit lists', async () => {
      const emptySystem: CelestialObject[] = [];
      const context = createMockCalculationContext(emptySystem, 'explorational');
      
      const positions = await calculator.calculateOrbitalPositions(
        emptySystem,
        new Map(),
        context
      );

      expect(positions.size).toBe(0);
    });
  });
});