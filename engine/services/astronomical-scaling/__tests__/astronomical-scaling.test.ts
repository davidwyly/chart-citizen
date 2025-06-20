/**
 * Astronomical Scaling Service Tests
 * ==================================
 * 
 * Tests for scientifically accurate scaling using real astronomical data.
 * Validates that object sizes and orbital distances maintain proper proportions.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  AstronomicalScalingService, 
  ASTRONOMICAL_CONSTANTS,
  type ScientificScaleConfiguration 
} from '../astronomical-scaling-service';
import type { CelestialObject } from '@/engine/types/orbital-system';

describe('Astronomical Scaling Service', () => {
  let service: AstronomicalScalingService;
  let defaultConfig: ScientificScaleConfiguration;

  beforeEach(() => {
    defaultConfig = {
      targetEarthRadiusInUnits: 1.0,
      targetEarthOrbitInUnits: 100.0,
      useLogarithmicForExtremes: true,
      extremeThresholdRatio: 1000.0,
      maintainVisibility: true
    };
    service = new AstronomicalScalingService(defaultConfig);
  });

  describe('Real Astronomical Data Validation', () => {
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
      },
      {
        id: 'luna',
        name: 'Luna',
        classification: 'moon',
        geometry_type: 'rocky',
        properties: { 
          radius: 1737,    // Real Moon radius in km
          mass: 0.0123     // Real Moon mass in Earth masses
        },
        orbit: {
          parent: 'earth',
          semi_major_axis: 0.00257,  // Real Moon orbit in AU
          eccentricity: 0.0549,
          inclination: 5.145,
          orbital_period: 27.32
        }
      }
    ];

    it('should calculate correct Earth reference scaling', () => {
      const earth = realSolSystem.find(obj => obj.id === 'earth')!;
      const result = service.calculateObjectSize(earth);

      expect(result.visualRadius).toBe(1.0);  // Target Earth radius
      expect(result.realRadiusKm).toBe(6371); // Real Earth radius
      expect(result.relativeToEarth).toBe(1.0); // Exactly 1x Earth
      expect(result.isToScale).toBe(true);
      expect(result.scalingMethod).toBe('proportional');
    });

    it('should maintain correct Sun-Earth size ratio', () => {
      const sun = realSolSystem.find(obj => obj.id === 'sol')!;
      const earth = realSolSystem.find(obj => obj.id === 'earth')!;
      
      const sunResult = service.calculateObjectSize(sun, earth);
      const earthResult = service.calculateObjectSize(earth);

      // Real Sun-to-Earth radius ratio is approximately 109
      const expectedRatio = 695700 / 6371; // ~109.2
      const actualRatio = sunResult.visualRadius / earthResult.visualRadius;

      console.log(`Sun radius: ${sunResult.realRadiusKm} km → ${sunResult.visualRadius} units`);
      console.log(`Earth radius: ${earthResult.realRadiusKm} km → ${earthResult.visualRadius} units`);
      console.log(`Expected ratio: ${expectedRatio.toFixed(2)}, Actual ratio: ${actualRatio.toFixed(2)}`);

      // Should maintain correct proportional relationship
      expect(sunResult.relativeToEarth).toBeCloseTo(expectedRatio, 1);
      
      // Sun is extreme size, so may use logarithmic scaling
      if (sunResult.scalingMethod === 'logarithmic') {
        expect(sunResult.isToScale).toBe(false);
        // But ratio should still be meaningful and reflect the extreme difference
        expect(actualRatio).toBeGreaterThan(10);
      } else {
        expect(actualRatio).toBeCloseTo(expectedRatio, 1);
      }
    });

    it('should maintain correct Mars-Earth size ratio', () => {
      const mars = realSolSystem.find(obj => obj.id === 'mars')!;
      const earth = realSolSystem.find(obj => obj.id === 'earth')!;
      
      const marsResult = service.calculateObjectSize(mars, earth);
      const earthResult = service.calculateObjectSize(earth, earth);

      // Real Mars-to-Earth radius ratio
      const expectedRatio = 3389.5 / 6371; // ~0.532
      const actualRatio = marsResult.visualRadius / earthResult.visualRadius;

      expect(marsResult.relativeToEarth).toBeCloseTo(expectedRatio, 2);
      expect(actualRatio).toBeCloseTo(expectedRatio, 2);
      expect(marsResult.isToScale).toBe(true);
      expect(marsResult.scalingMethod).toBe('proportional');
    });

    it('should maintain correct Jupiter-Earth size ratio', () => {
      const jupiter = realSolSystem.find(obj => obj.id === 'jupiter')!;
      const earth = realSolSystem.find(obj => obj.id === 'earth')!;
      
      const jupiterResult = service.calculateObjectSize(jupiter, earth);
      const earthResult = service.calculateObjectSize(earth, earth);

      // Real Jupiter-to-Earth radius ratio
      const expectedRatio = 69911 / 6371; // ~10.97
      const actualRatio = jupiterResult.visualRadius / earthResult.visualRadius;

      expect(jupiterResult.relativeToEarth).toBeCloseTo(expectedRatio, 1);
      expect(actualRatio).toBeCloseTo(expectedRatio, 1);
      expect(jupiterResult.isToScale).toBe(true);
      expect(jupiterResult.scalingMethod).toBe('proportional');
    });

    it('should maintain correct Moon-Earth size ratio', () => {
      const moon = realSolSystem.find(obj => obj.id === 'luna')!;
      const earth = realSolSystem.find(obj => obj.id === 'earth')!;
      
      const moonResult = service.calculateObjectSize(moon, earth);
      const earthResult = service.calculateObjectSize(earth, earth);

      // Real Moon-to-Earth radius ratio
      const expectedRatio = 1737 / 6371; // ~0.273
      const actualRatio = moonResult.visualRadius / earthResult.visualRadius;

      expect(moonResult.relativeToEarth).toBeCloseTo(expectedRatio, 2);
      expect(actualRatio).toBeCloseTo(expectedRatio, 2);
      expect(moonResult.isToScale).toBe(true);
      expect(moonResult.scalingMethod).toBe('proportional');
    });
  });

  describe('Orbital Distance Calculations', () => {
    it('should calculate correct Earth orbit reference', () => {
      const earth: CelestialObject = {
        id: 'earth',
        name: 'Earth',
        classification: 'planet',
        geometry_type: 'terrestrial',
        properties: { radius: 6371, mass: 1 },
        orbit: {
          parent: 'sol',
          semi_major_axis: 1.0,  // 1 AU
          eccentricity: 0.0167,
          inclination: 0,
          orbital_period: 365.25
        }
      };

      const result = service.calculateOrbitDistance(earth);

      expect(result.realOrbitAU).toBe(1.0);
      expect(result.orbitRadius).toBe(100.0); // Target Earth orbit
      expect(result.relativeToEarth).toBe(1.0);
      expect(result.isToScale).toBe(true);
    });

    it('should maintain correct Mars-Earth orbit ratio', () => {
      const mars: CelestialObject = {
        id: 'mars',
        name: 'Mars',
        classification: 'planet',
        geometry_type: 'terrestrial',
        properties: { radius: 3389.5, mass: 0.107 },
        orbit: {
          parent: 'sol',
          semi_major_axis: 1.524,  // Real Mars orbit
          eccentricity: 0.0935,
          inclination: 1.85,
          orbital_period: 687
        }
      };

      const marsResult = service.calculateOrbitDistance(mars);

      expect(marsResult.realOrbitAU).toBe(1.524);
      expect(marsResult.relativeToEarth).toBeCloseTo(1.524, 3);
      expect(marsResult.orbitRadius).toBeCloseTo(152.4, 1); // 1.524 * 100
      expect(marsResult.isToScale).toBe(true);
    });

    it('should maintain correct Jupiter-Earth orbit ratio', () => {
      const jupiter: CelestialObject = {
        id: 'jupiter',
        name: 'Jupiter',
        classification: 'planet',
        geometry_type: 'gas_giant',
        properties: { radius: 69911, mass: 317.8 },
        orbit: {
          parent: 'sol',
          semi_major_axis: 5.204,  // Real Jupiter orbit
          eccentricity: 0.049,
          inclination: 1.304,
          orbital_period: 4333
        }
      };

      const jupiterResult = service.calculateOrbitDistance(jupiter);

      expect(jupiterResult.realOrbitAU).toBe(5.204);
      expect(jupiterResult.relativeToEarth).toBeCloseTo(5.204, 3);
      expect(jupiterResult.orbitRadius).toBeCloseTo(520.4, 1); // 5.204 * 100
      expect(jupiterResult.isToScale).toBe(true);
    });

    it('should handle Moon orbit correctly', () => {
      const moon: CelestialObject = {
        id: 'luna',
        name: 'Luna',
        classification: 'moon',
        geometry_type: 'rocky',
        properties: { radius: 1737, mass: 0.0123 },
        orbit: {
          parent: 'earth',
          semi_major_axis: 0.00257,  // Real Moon orbit in AU
          eccentricity: 0.0549,
          inclination: 5.145,
          orbital_period: 27.32
        }
      };

      const moonResult = service.calculateOrbitDistance(moon);

      expect(moonResult.realOrbitAU).toBeCloseTo(0.00257, 5);
      expect(moonResult.relativeToEarth).toBeCloseTo(0.00257, 5);
      
      // Moon orbit should be very small in the visual scale
      const expectedVisualDistance = 0.00257 * 100; // ~0.257 units
      expect(moonResult.orbitRadius).toBeGreaterThan(0.2); // Should maintain some visibility
    });
  });

  describe('System-wide Scaling Coherence', () => {
    it('should maintain proportional relationships across entire Sol system', () => {
      const realSolSystem: CelestialObject[] = [
        {
          id: 'sol',
          name: 'Sol',
          classification: 'star',
          geometry_type: 'star',
          properties: { radius: 695700, mass: 333000 }
        },
        {
          id: 'earth',
          name: 'Earth',
          classification: 'planet',
          geometry_type: 'terrestrial',
          properties: { radius: 6371, mass: 1 },
          orbit: { parent: 'sol', semi_major_axis: 1.0, eccentricity: 0.0167, inclination: 0, orbital_period: 365.25 }
        },
        {
          id: 'jupiter',
          name: 'Jupiter',
          classification: 'planet',
          geometry_type: 'gas_giant',
          properties: { radius: 69911, mass: 317.8 },
          orbit: { parent: 'sol', semi_major_axis: 5.204, eccentricity: 0.049, inclination: 1.304, orbital_period: 4333 }
        }
      ];

      const systemResult = service.calculateSystemScaling(realSolSystem);

      // Check that all objects have results
      expect(systemResult.objectSizes.size).toBe(3);
      expect(systemResult.orbitDistances.size).toBe(3);

      // Check Earth reference values
      const earthSize = systemResult.objectSizes.get('earth')!;
      const earthOrbit = systemResult.orbitDistances.get('earth')!;
      
      expect(earthSize.visualRadius).toBe(1.0);
      expect(earthOrbit.orbitRadius).toBe(100.0);

      // Check Jupiter maintains correct relationship
      const jupiterSize = systemResult.objectSizes.get('jupiter')!;
      const jupiterOrbit = systemResult.orbitDistances.get('jupiter')!;
      
      const sizeRatio = jupiterSize.visualRadius / earthSize.visualRadius;
      const orbitRatio = jupiterOrbit.orbitRadius / earthOrbit.orbitRadius;
      
      expect(sizeRatio).toBeCloseTo(69911 / 6371, 1); // Real size ratio
      expect(orbitRatio).toBeCloseTo(5.204, 2);        // Real orbit ratio

      // System metrics should reflect scientific accuracy
      expect(systemResult.systemMetrics.totalSizeRange).toBeGreaterThan(10);
      expect(systemResult.systemMetrics.totalOrbitRange).toBeGreaterThan(5);
    });

    it('should use optimal configuration for star systems', () => {
      const starSystem: CelestialObject[] = [
        {
          id: 'sol',
          name: 'Sol',
          classification: 'star',
          geometry_type: 'star',
          properties: { radius: 695700, mass: 333000 }
        }
      ];

      const config = AstronomicalScalingService.getOptimalConfiguration(starSystem);

      // Should use smaller Earth scale when stars are present
      expect(config.targetEarthRadiusInUnits).toBe(0.1);
      expect(config.extremeThresholdRatio).toBe(10.0); // Lower threshold for star systems
      expect(config.useLogarithmicForExtremes).toBe(true);
    });
  });

  describe('Edge Cases and Validation', () => {
    it('should handle objects with missing radius data', () => {
      const incompleteObject: CelestialObject = {
        id: 'incomplete',
        name: 'Incomplete Object',
        classification: 'planet',
        geometry_type: 'terrestrial',
        properties: { mass: 1 } // Missing radius
      };

      const result = service.calculateObjectSize(incompleteObject);
      
      // Should use fallback values
      expect(result.visualRadius).toBeGreaterThan(0);
      expect(result.realRadiusKm).toBe(ASTRONOMICAL_CONSTANTS.EARTH_RADIUS_KM);
    });

    it('should handle objects with no orbit data', () => {
      const starObject: CelestialObject = {
        id: 'star',
        name: 'Star',
        classification: 'star',
        geometry_type: 'star',
        properties: { radius: 695700, mass: 333000 }
        // No orbit property
      };

      const result = service.calculateOrbitDistance(starObject);
      
      expect(result.orbitRadius).toBe(0);
      expect(result.realOrbitAU).toBe(0);
      expect(result.isToScale).toBe(true);
    });

    it('should maintain minimum visibility when configured', () => {
      const tinyObject: CelestialObject = {
        id: 'tiny',
        name: 'Tiny Object',
        classification: 'asteroid',
        geometry_type: 'rocky',
        properties: { radius: 0.001, mass: 1e-15 } // Very small
      };

      const serviceWithVisibility = new AstronomicalScalingService({
        ...defaultConfig,
        maintainVisibility: true
      });

      const result = serviceWithVisibility.calculateObjectSize(tinyObject);
      
      expect(result.visualRadius).toBeGreaterThanOrEqual(ASTRONOMICAL_CONSTANTS.MIN_VISUAL_RADIUS);
      expect(result.isToScale).toBe(false); // Not to scale due to visibility constraint
    });
  });
});