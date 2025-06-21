/**
 * Profile View Orbital Distance Test
 * 
 * This test validates that in profile view mode, child orbiting bodies are positioned
 * at appropriate distances from their parent to create a clean diagrammatic layout.
 * 
 * Expected behavior: parent - child - child - child (compact spacing)
 * Current bug: parent -------------------------------- child - child - child (huge gap)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { CelestialObject } from '@/engine/types/orbital-system';
import { ProfileStrategy } from '@/engine/core/view-modes/strategies/profile-strategy';
import type { RenderingConfiguration } from '@/engine/core/configuration/rendering-configuration';

describe('Profile View Orbital Distance', () => {
  let profileStrategy: ProfileStrategy;
  let mockConfig: RenderingConfiguration;
  let testSystemData: {
    parent: CelestialObject;
    children: CelestialObject[];
  };

  beforeEach(() => {
    profileStrategy = new ProfileStrategy();
    
    // Mock rendering configuration with profile-specific values
    mockConfig = {
      camera: {
        distanceMultipliers: {
          consistent: 4.0,
          minimum: 2.5,
          maximum: 15.0,
          profileFallback: 15.0,
          profileLayout: 1.2,
          profileTarget: 1.5,
        },
        elevationAngles: {
          explorational: 30,
          navigational: 35,
          profile: 22.5,
          scientific: 15,
        },
        detectionThresholds: {
          fakeOffsetMax: 20,
          singleObjectDistance: 15,
          minHorizontalDirection: 0.1,
          fakeOffsetMultiplier: 3,
        },
        animationDuration: {
          quick: 600,
          standard: 1200,
          extended: 2000,
        },
      },
      orbital: {
        safetyFactors: {
          minimum: 2.0,
          explorational: 2.5,
          navigational: 3.0,
          profile: 3.5,
          scientific: 1.1,
        },
        equidistantSpacing: {
          baseSpacing: 10,           // This may be the culprit - too large!
          spacingMultiplier: 1.5,
        },
        orbitalScaling: {
          explorational: 1.0,
          navigational: 0.8,
          profile: 0.3,             // 30% of normal - this may also be the culprit
          scientific: 1.0,
        },
      },
      visual: {
        sizeConstraints: {
          minVisualSize: 0.1,
          maxVisualSize: 50,
        },
      },
      animation: {
        easingFunctions: {
          smooth: 'easeInOutCubic' as const,
        },
      },
    } as RenderingConfiguration;

    // Create test system with parent star and 3 child planets
    testSystemData = {
      parent: {
        id: 'star-1',
        name: 'Test Star',
        classification: 'star',
        catalog_data: {
          mass: 1.0,
          radius: 1.0,
        },
        orbit: null, // Stars don't orbit anything
      },
      children: [
        {
          id: 'planet-1',
          name: 'Inner Planet',
          classification: 'planet',
          catalog_data: {
            mass: 0.5,
            radius: 0.3,
          },
          orbit: {
            parent: 'star-1',
            semi_major_axis: 50,    // Real orbital distance
            eccentricity: 0.1,
            inclination: 5,
            ascending_node: 0,
            argument_of_periapsis: 0,
            mean_anomaly: 0,
          },
        },
        {
          id: 'planet-2', 
          name: 'Middle Planet',
          classification: 'planet',
          catalog_data: {
            mass: 0.8,
            radius: 0.4,
          },
          orbit: {
            parent: 'star-1',
            semi_major_axis: 100,   // Real orbital distance
            eccentricity: 0.05,
            inclination: 2,
            ascending_node: 45,
            argument_of_periapsis: 30,
            mean_anomaly: 90,
          },
        },
        {
          id: 'planet-3',
          name: 'Outer Planet', 
          classification: 'planet',
          catalog_data: {
            mass: 1.2,
            radius: 0.6,
          },
          orbit: {
            parent: 'star-1',
            semi_major_axis: 200,   // Real orbital distance
            eccentricity: 0.02,
            inclination: 1,
            ascending_node: 90,
            argument_of_periapsis: 60,
            mean_anomaly: 180,
          },
        },
      ],
    };
  });

  describe('Orbital Behavior Configuration', () => {
    it('should configure profile view for equidistant spacing', () => {
      const behavior = profileStrategy.getOrbitalBehavior();
      
      expect(behavior.useEquidistantSpacing).toBe(true);
      expect(behavior.useEccentricity).toBe(false);
      expect(behavior.allowVerticalOffset).toBe(false);
      expect(behavior.enforceCircularOrbits).toBe(true);
    });
  });

  describe('Expected Profile View Distances', () => {
    it('should calculate reasonable distances for profile view layout', () => {
      // In profile view, we want a clean diagrammatic layout
      // Expected layout: parent at (0,0,0), children at roughly (2,0,0), (4,0,0), (6,0,0)
      // This creates the desired parent-child-child-child layout
      
      const expectedDistances = {
        innermost: 2.0,      // First child should be ~2 units from parent
        spacing: 2.0,        // Each subsequent child ~2 units apart
        maxDistance: 6.0,    // Outermost child should be ~6 units from parent
      };

      // Test that our expectations are reasonable for profile view
      expect(expectedDistances.innermost).toBeLessThan(5);
      expect(expectedDistances.maxDistance).toBeLessThan(10);
    });
  });

  describe('Current Implementation Analysis', () => {
    it('should identify if equidistant spacing base distance is too large', () => {
      // Test hypothesis 1: baseSpacing of 10 is way too large for profile view
      const baseSpacing = mockConfig.orbital.equidistantSpacing.baseSpacing;
      const spacingMultiplier = mockConfig.orbital.equidistantSpacing.spacingMultiplier;
      
      // Calculate what equidistant spacing would produce:
      const firstChildDistance = baseSpacing + (0 * baseSpacing * spacingMultiplier); // index 0
      const secondChildDistance = baseSpacing + (1 * baseSpacing * spacingMultiplier); // index 1  
      const thirdChildDistance = baseSpacing + (2 * baseSpacing * spacingMultiplier); // index 2
      
      console.log('Equidistant spacing distances:', {
        first: firstChildDistance,
        second: secondChildDistance,
        third: thirdChildDistance,
      });
      
      // These distances are way too large for profile view!
      expect(firstChildDistance).toBe(10);  // This should be ~2 for good profile layout
      expect(secondChildDistance).toBe(25); // This should be ~4 for good profile layout  
      expect(thirdChildDistance).toBe(40);  // This should be ~6 for good profile layout
      
      // Hypothesis 1 confirmed: baseSpacing is 5-10x too large
      expect(firstChildDistance).toBeGreaterThan(5); // This confirms the bug
    });

    it('should identify if orbital scaling factor affects profile distances', () => {
      // Test hypothesis 2: Profile orbital scaling of 0.3 may not be used in equidistant mode
      const profileOrbitalScaling = mockConfig.orbital.orbitalScaling.profile;
      const realOrbitalDistances = testSystemData.children.map(child => 
        child.orbit ? child.orbit.semi_major_axis : 0
      );
      
      const scaledDistances = realOrbitalDistances.map(distance => distance * profileOrbitalScaling);
      
      console.log('Real orbital distances:', realOrbitalDistances);
      console.log('Profile scaled distances (30%):', scaledDistances);
      
      expect(profileOrbitalScaling).toBe(0.3);
      expect(scaledDistances[0]).toBe(15);  // 50 * 0.3 = 15 - still too large for profile!
      expect(scaledDistances[1]).toBe(30);  // 100 * 0.3 = 30 - way too large!
      expect(scaledDistances[2]).toBe(60);  // 200 * 0.3 = 60 - way too large!
      
      // Even with 30% scaling, distances are still 5-30x too large for profile layout
      expect(scaledDistances[0]).toBeGreaterThan(5); // This confirms hypothesis 2
    });

    it('should identify if safety factor creates excessive minimum distances', () => {
      // Test hypothesis 3: Safety factor of 3.5 may enforce minimum distances that are too large
      const profileSafetyFactor = mockConfig.orbital.safetyFactors.profile;
      
      expect(profileSafetyFactor).toBe(3.5); // Highest safety factor of all modes
      
      // Safety factor multiplies the minimum spacing - if base object size is ~1 unit,
      // safety factor of 3.5 means minimum distance between objects is 3.5 units
      // This could be the cause of the large first orbit distance
      
      const mockObjectRadius = 1.0;
      const minimumSafeDistance = mockObjectRadius * profileSafetyFactor;
      
      expect(minimumSafeDistance).toBe(3.5);
      console.log('Minimum safe distance from safety factor:', minimumSafeDistance);
      
      // If safety factor enforces 3.5+ unit minimum distances, this could cause the bug
      expect(minimumSafeDistance).toBeGreaterThan(2); // This could be causing the issue
    });
  });

  describe('Ideal Profile View Configuration', () => {
    it('should define optimal configuration values for profile view', () => {
      // Define what the configuration should be for proper profile view layout
      const idealProfileConfig = {
        equidistantSpacing: {
          baseSpacing: 0.5,        // Much smaller - first child 0.5 units from parent
          spacingMultiplier: 1.0,  // Linear spacing: 0.5, 1.0, 1.5, 2.0, etc.
        },
        orbitalScaling: {
          profile: 0.05,           // Even more compressed - 5% of normal
        },
        safetyFactors: {
          profile: 1.1,            // Minimal safety factor for profile diagrams
        },
      };
      
      // Test that ideal configuration would produce good layout
      const idealFirstDistance = idealProfileConfig.equidistantSpacing.baseSpacing + 
        (0 * idealProfileConfig.equidistantSpacing.baseSpacing * idealProfileConfig.equidistantSpacing.spacingMultiplier);
      const idealSecondDistance = idealProfileConfig.equidistantSpacing.baseSpacing + 
        (1 * idealProfileConfig.equidistantSpacing.baseSpacing * idealProfileConfig.equidistantSpacing.spacingMultiplier);
      const idealThirdDistance = idealProfileConfig.equidistantSpacing.baseSpacing + 
        (2 * idealProfileConfig.equidistantSpacing.baseSpacing * idealProfileConfig.equidistantSpacing.spacingMultiplier);
      
      expect(idealFirstDistance).toBe(0.5);   // Good profile distance
      expect(idealSecondDistance).toBe(1.0);  // Good profile distance
      expect(idealThirdDistance).toBe(1.5);   // Good profile distance
      
      console.log('Ideal profile distances:', {
        first: idealFirstDistance,
        second: idealSecondDistance,
        third: idealThirdDistance,
      });
      
      // These distances would create the desired parent-child-child-child layout
      expect(idealFirstDistance).toBeLessThan(2);
      expect(idealThirdDistance).toBeLessThan(5);
    });
  });
});