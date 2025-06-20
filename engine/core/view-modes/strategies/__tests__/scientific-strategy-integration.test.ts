/**
 * Scientific Strategy Integration Tests
 * ====================================
 * 
 * Tests the complete scientific mode implementation including real astronomical scaling,
 * orbit calculations, and integration with the orbital mechanics pipeline.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ScientificStrategy } from '../scientific-strategy';
import { OrbitPositionCalculator } from '../../../../services/orbital-calculations/orbit-position-calculator';
import { DEFAULT_RENDERING_CONFIGURATION } from '../../../configuration/rendering-configuration';
import type { CelestialObject } from '@/engine/types/orbital-system';
import type { CalculationContext } from '../../../../services/orbital-calculations/interfaces/calculation-services';
import type { ScalingResult } from '../view-mode-strategy';

describe('Scientific Strategy Integration', () => {
  let strategy: ScientificStrategy;
  let orbitCalculator: OrbitPositionCalculator;

  beforeEach(() => {
    strategy = new ScientificStrategy();
    orbitCalculator = new OrbitPositionCalculator();
  });

  describe('Real Sol System Scientific Scaling', () => {
    const realSolSystem: CelestialObject[] = [
      {
        id: 'sol',
        name: 'Sol',
        classification: 'star',
        geometry_type: 'star',
        properties: { 
          radius: 695700,  // Real Sun radius in km
          mass: 333000     // Real Sun mass in Earth masses
        }
      },
      {
        id: 'earth',
        name: 'Earth',
        classification: 'planet',
        geometry_type: 'terrestrial',
        properties: { 
          radius: 6371,    // Real Earth radius in km
          mass: 1          // Reference mass
        },
        orbit: {
          parent: 'sol',
          semi_major_axis: 1.0,  // 1 AU
          eccentricity: 0.0167,
          inclination: 0,
          orbital_period: 365.25
        }
      },
      {
        id: 'mars',
        name: 'Mars',
        classification: 'planet',
        geometry_type: 'terrestrial',
        properties: { 
          radius: 3389.5,  // Real Mars radius in km
          mass: 0.107      // Real Mars mass in Earth masses
        },
        orbit: {
          parent: 'sol',
          semi_major_axis: 1.524,  // Real Mars orbit in AU
          eccentricity: 0.0935,
          inclination: 1.85,
          orbital_period: 687
        }
      },
      {
        id: 'jupiter',
        name: 'Jupiter',
        classification: 'planet',
        geometry_type: 'gas_giant',
        properties: { 
          radius: 69911,   // Real Jupiter radius in km
          mass: 317.8      // Real Jupiter mass in Earth masses
        },
        orbit: {
          parent: 'sol',
          semi_major_axis: 5.204,  // Real Jupiter orbit in AU
          eccentricity: 0.049,
          inclination: 1.304,
          orbital_period: 4333
        }
      }
    ];

    const createMockContext = (objects: CelestialObject[]): CalculationContext => {
      const systemContext = {
        primaryStar: objects.find(obj => obj.classification === 'star') || objects[0],
        earthReference: objects.find(obj => obj.id === 'earth'),
        totalObjects: objects.length,
        maxOrbitalRadius: 1000,
        minOrbitalRadius: 0.1,
        hasMultipleStars: objects.filter(obj => obj.classification === 'star').length > 1,
        hasMoons: objects.some(obj => obj.classification === 'moon'),
        systemComplexity: 'moderate' as const
      };

      return {
        objects,
        viewMode: 'scientific',
        strategy,
        systemContext,
        config: DEFAULT_RENDERING_CONFIGURATION
      };
    };

    it('should calculate scientifically accurate object sizes', () => {
      const context = createMockContext(realSolSystem);

      // Test each object's scaling
      const earthResult = strategy.calculateObjectScale(
        realSolSystem.find(obj => obj.id === 'earth')!,
        context.systemContext,
        context.config
      );

      const marsResult = strategy.calculateObjectScale(
        realSolSystem.find(obj => obj.id === 'mars')!,
        context.systemContext,
        context.config
      );

      const jupiterResult = strategy.calculateObjectScale(
        realSolSystem.find(obj => obj.id === 'jupiter')!,
        context.systemContext,
        context.config
      );

      const sunResult = strategy.calculateObjectScale(
        realSolSystem.find(obj => obj.id === 'sol')!,
        context.systemContext,
        context.config
      );

      // Earth should be the reference (or very close to it)
      expect(earthResult.relativeScale).toBeCloseTo(1.0, 2);

      // Mars should be correctly proportioned to Earth
      const expectedMarsRatio = 3389.5 / 6371; // ~0.532
      expect(marsResult.relativeScale).toBeCloseTo(expectedMarsRatio, 2);

      // Jupiter should be correctly proportioned to Earth
      const expectedJupiterRatio = 69911 / 6371; // ~10.97
      expect(jupiterResult.relativeScale).toBeCloseTo(expectedJupiterRatio, 1);

      // Sun should reflect the extreme size difference
      const expectedSunRatio = 695700 / 6371; // ~109.2
      expect(sunResult.relativeScale).toBeCloseTo(expectedSunRatio, 1);

      // All should use scientific scaling
      expect(earthResult.scalingMethod).toBe('scientific');
      expect(marsResult.scalingMethod).toBe('scientific');
      expect(jupiterResult.scalingMethod).toBe('scientific');
      expect(sunResult.scalingMethod).toBe('scientific');
    });

    it('should calculate scientifically accurate orbital distances', async () => {
      const context = createMockContext(realSolSystem);
      
      // Create mock visual sizes (these would come from the visual size calculator)
      const mockVisualSizes = new Map<string, ScalingResult>([
        ['sol', { visualRadius: 10.0, isFixedSize: false, scalingMethod: 'scientific', relativeScale: 109.2 }],
        ['earth', { visualRadius: 0.1, isFixedSize: false, scalingMethod: 'scientific', relativeScale: 1.0 }],
        ['mars', { visualRadius: 0.053, isFixedSize: false, scalingMethod: 'scientific', relativeScale: 0.532 }],
        ['jupiter', { visualRadius: 1.097, isFixedSize: false, scalingMethod: 'scientific', relativeScale: 10.97 }]
      ]);

      const orbitalPositions = await orbitCalculator.calculateOrbitalPositions(
        realSolSystem,
        mockVisualSizes,
        context
      );

      // Get orbital distances
      const earthOrbit = orbitalPositions.get('earth') || 0;
      const marsOrbit = orbitalPositions.get('mars') || 0;
      const jupiterOrbit = orbitalPositions.get('jupiter') || 0;

      // Check that orbits maintain correct proportional relationships
      expect(earthOrbit).toBeGreaterThan(0);
      expect(marsOrbit).toBeGreaterThan(0);
      expect(jupiterOrbit).toBeGreaterThan(0);

      // Mars should be 1.524x farther than Earth
      const marsRatio = marsOrbit / earthOrbit;
      expect(marsRatio).toBeCloseTo(1.524, 1);

      // Jupiter should be 5.204x farther than Earth
      const jupiterRatio = jupiterOrbit / earthOrbit;
      expect(jupiterRatio).toBeCloseTo(5.204, 1);

      console.log(`Earth orbit: ${earthOrbit.toFixed(2)} units`);
      console.log(`Mars orbit: ${marsOrbit.toFixed(2)} units (${marsRatio.toFixed(2)}x Earth)`);
      console.log(`Jupiter orbit: ${jupiterOrbit.toFixed(2)} units (${jupiterRatio.toFixed(2)}x Earth)`);
    });

    it('should maintain scientific accuracy with proper orbital behavior', () => {
      const orbitalBehavior = strategy.getOrbitalBehavior();

      // Scientific mode should use real orbital mechanics
      expect(orbitalBehavior.useEccentricity).toBe(true);
      expect(orbitalBehavior.allowVerticalOffset).toBe(true);
      expect(orbitalBehavior.useEquidistantSpacing).toBe(false);
      expect(orbitalBehavior.enforceCircularOrbits).toBe(false);
      expect(orbitalBehavior.animationSpeed).toBe(1.0);
    });

    it('should show all objects for scientific completeness', () => {
      const context = createMockContext(realSolSystem);

      for (const object of realSolSystem) {
        const visibility = strategy.determineObjectVisibility(
          object,
          'earth', // Focused on Earth
          context.systemContext,
          context.config
        );

        expect(visibility.showObject).toBe(true);
        expect(visibility.showLabel).toBe(true);
        expect(visibility.showOrbit).toBe(true);
        expect(visibility.showChildren).toBe(true);
        expect(visibility.opacity).toBeGreaterThan(0.8);
      }
    });

    it('should calculate appropriate camera distances for extreme scales', () => {
      const context = createMockContext(realSolSystem);

      // Test camera positioning for different object scales
      const earthLayoutInfo = {
        focusObject: { getWorldPosition: () => ({ clone: () => ({ x: 0, y: 0, z: 100 }) }) } as any,
        focusObjectId: 'earth',
        focusObjectName: 'Earth',
        visualRadius: 0.1, // Small Earth in scientific mode
        orbitRadius: 100,
        parentObject: undefined,
        childObjects: []
      };

      const sunLayoutInfo = {
        focusObject: { getWorldPosition: () => ({ clone: () => ({ x: 0, y: 0, z: 0 }) }) } as any,
        focusObjectId: 'sol',
        focusObjectName: 'Sol',
        visualRadius: 10.0, // Large Sun
        orbitRadius: 0,
        parentObject: undefined,
        childObjects: []
      };

      const earthCamera = strategy.calculateCameraPosition(
        earthLayoutInfo,
        context.systemContext,
        context.config
      );

      const sunCamera = strategy.calculateCameraPosition(
        sunLayoutInfo,
        context.systemContext,
        context.config
      );

      // Camera should be farther from larger objects
      expect(sunCamera.distance).toBeGreaterThan(earthCamera.distance);
      
      // Both should use extended animation duration for scientific observation
      expect(earthCamera.animationDuration).toBeGreaterThan(800);
      expect(sunCamera.animationDuration).toBeGreaterThan(800);
    });
  });

  describe('Scientific Mode Validation and Warnings', () => {
    it('should validate system compatibility and provide warnings', () => {
      const complexSystem = {
        primaryStar: { id: 'sol', classification: 'star' } as CelestialObject,
        earthReference: { id: 'earth', classification: 'planet' } as CelestialObject,
        totalObjects: 50,
        maxOrbitalRadius: 1000,
        minOrbitalRadius: 0.001,
        hasMultipleStars: true,
        hasMoons: true,
        systemComplexity: 'complex' as const
      };

      const validation = strategy.validateSystemCompatibility(complexSystem);

      expect(validation.compatible).toBe(true);
      expect(validation.warnings.length).toBeGreaterThan(0);
      
      // Should warn about multiple stars and complexity
      const warningText = validation.warnings.join(' ');
      expect(warningText).toContain('Multiple star systems');
      expect(warningText).toContain('Complex systems');
    });

    it('should provide transition warnings when entering from other modes', () => {
      const systemContext = {
        primaryStar: { id: 'sol', classification: 'star' } as CelestialObject,
        earthReference: { id: 'earth', classification: 'planet' } as CelestialObject,
        totalObjects: 10,
        maxOrbitalRadius: 100,
        minOrbitalRadius: 1,
        hasMultipleStars: false,
        hasMoons: true,
        systemComplexity: 'moderate' as const
      };

      const mockNavigationalStrategy = {
        id: 'navigational' as const,
        name: 'Navigational',
        description: 'Mock navigational strategy'
      };

      const transition = strategy.onViewModeEnter(
        mockNavigationalStrategy as any,
        systemContext,
        DEFAULT_RENDERING_CONFIGURATION
      );

      expect(transition.warnings.length).toBeGreaterThan(0);
      expect(transition.cacheInvalidationRequired).toBe(true);
      
      const warningText = transition.warnings.join(' ');
      expect(warningText).toContain('true astronomical proportions');
      expect(warningText).toContain('fixed sizes to scientific proportions');
    });
  });
});