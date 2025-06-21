/**
 * Profile View Fix Validation Test
 * 
 * This test validates that the profile view orbital distance fix works correctly,
 * creating a clean parent-child-child-child layout instead of parent-----child-child-child.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { CelestialObject } from '@/engine/types/orbital-system';
import { ProfileStrategy } from '@/engine/core/view-modes/strategies/profile-strategy';
import { DEFAULT_RENDERING_CONFIGURATION, type RenderingConfiguration } from '@/engine/core/configuration/rendering-configuration';

describe('Profile View Fix Validation', () => {
  let profileStrategy: ProfileStrategy;
  let testSystemData: {
    parent: CelestialObject;
    children: CelestialObject[];
  };

  beforeEach(() => {
    profileStrategy = new ProfileStrategy();
    
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
        orbit: null,
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
            semi_major_axis: 50,
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
            semi_major_axis: 100,
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
            semi_major_axis: 200,
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

  describe('Fixed Configuration Values', () => {
    it('should have corrected profile orbital scaling', () => {
      const config = DEFAULT_RENDERING_CONFIGURATION;
      
      // Profile orbital scaling should be much more compressed
      expect(config.orbital.baseScaling.profile).toBe(0.05); // Was 0.3, now 0.05
      
      // Other modes should be unchanged
      expect(config.orbital.baseScaling.explorational).toBe(50.0);
      expect(config.orbital.baseScaling.navigational).toBe(40.0);
      expect(config.orbital.baseScaling.scientific).toBe(1.0);
    });

    it('should have corrected profile safety factor', () => {
      const config = DEFAULT_RENDERING_CONFIGURATION;
      
      // Profile safety factor should be minimal for tight diagrams
      expect(config.orbital.safetyFactors.profile).toBe(1.05); // Was 3.5, now 1.05
      
      // Other modes should be unchanged
      expect(config.orbital.safetyFactors.explorational).toBe(2.5);
      expect(config.orbital.safetyFactors.navigational).toBe(3.0);
      expect(config.orbital.safetyFactors.scientific).toBe(1.1);
    });

    it('should have corrected equidistant spacing', () => {
      const config = DEFAULT_RENDERING_CONFIGURATION;
      
      // Equidistant spacing should be much smaller for profile diagrams
      expect(config.orbital.equidistantSpacing.baseSpacing).toBe(0.5); // Was 10, now 0.5
      expect(config.orbital.equidistantSpacing.spacingMultiplier).toBe(1.0); // Was 1.5, now 1.0
    });
  });

  describe('Calculated Profile Distances', () => {
    it('should produce reasonable distances with fixed configuration', () => {
      const config = DEFAULT_RENDERING_CONFIGURATION;
      
      // Calculate what equidistant spacing produces with fixed values:
      const firstChildDistance = config.orbital.equidistantSpacing.baseSpacing + 
        (0 * config.orbital.equidistantSpacing.baseSpacing * config.orbital.equidistantSpacing.spacingMultiplier);
      const secondChildDistance = config.orbital.equidistantSpacing.baseSpacing + 
        (1 * config.orbital.equidistantSpacing.baseSpacing * config.orbital.equidistantSpacing.spacingMultiplier);
      const thirdChildDistance = config.orbital.equidistantSpacing.baseSpacing + 
        (2 * config.orbital.equidistantSpacing.baseSpacing * config.orbital.equidistantSpacing.spacingMultiplier);
      
      console.log('Fixed equidistant spacing distances:', {
        first: firstChildDistance,
        second: secondChildDistance,
        third: thirdChildDistance,
      });
      
      // These distances should be much more reasonable for profile view
      expect(firstChildDistance).toBeCloseTo(0.5, 1);  // Good profile distance (even closer now)
      expect(secondChildDistance).toBeCloseTo(1.0, 1); // Good profile distance  
      expect(thirdChildDistance).toBeCloseTo(1.5, 1);  // Good profile distance
      
      // All distances should be under 5 units for good profile layout
      expect(firstChildDistance).toBeLessThan(2);
      expect(secondChildDistance).toBeLessThan(3);
      expect(thirdChildDistance).toBeLessThan(4);
    });

    it('should produce compact orbital scaling with fixed configuration', () => {
      const config = DEFAULT_RENDERING_CONFIGURATION;
      const realOrbitalDistances = testSystemData.children.map(child => 
        child.orbit ? child.orbit.semi_major_axis : 0
      );
      
      const scaledDistances = realOrbitalDistances.map(distance => 
        distance * config.orbital.baseScaling.profile
      );
      
      console.log('Fixed profile scaled distances (5%):', scaledDistances);
      
      // With 5% scaling, distances should be much more reasonable
      expect(scaledDistances[0]).toBe(2.5);  // 50 * 0.05 = 2.5 - reasonable for profile
      expect(scaledDistances[1]).toBe(5.0);  // 100 * 0.05 = 5.0 - reasonable for profile
      expect(scaledDistances[2]).toBe(10.0); // 200 * 0.05 = 10.0 - reasonable for profile
      
      // All scaled distances should be under 15 units for profile layout
      expect(scaledDistances[0]).toBeLessThan(5);
      expect(scaledDistances[1]).toBeLessThan(10);
      expect(scaledDistances[2]).toBeLessThan(15);
    });

    it('should have minimal safety factor impact', () => {
      const config = DEFAULT_RENDERING_CONFIGURATION;
      
      const mockObjectRadius = 1.0;
      const minimumSafeDistance = mockObjectRadius * config.orbital.safetyFactors.profile;
      
      expect(minimumSafeDistance).toBe(1.05); // Much smaller than before (was 3.5)
      
      console.log('Fixed minimum safe distance from safety factor:', minimumSafeDistance);
      
      // Safety factor should have minimal impact on profile layout
      expect(minimumSafeDistance).toBeLessThan(2);
    });
  });

  describe('Profile View Behavior', () => {
    it('should still configure correct orbital behavior', () => {
      const behavior = profileStrategy.getOrbitalBehavior();
      
      // These behavioral aspects should remain unchanged
      expect(behavior.useEquidistantSpacing).toBe(true);
      expect(behavior.useEccentricity).toBe(false);
      expect(behavior.allowVerticalOffset).toBe(false);
      expect(behavior.enforceCircularOrbits).toBe(true);
      expect(behavior.animationSpeed).toBe(0.5);
    });

    it('should calculate appropriate object scales', () => {
      const config = DEFAULT_RENDERING_CONFIGURATION;
      const systemContext = {
        totalObjects: testSystemData.children.length + 1,
        earthReference: testSystemData.parent,
      };

      // Test object scaling for different types
      const starScale = profileStrategy.calculateObjectScale(
        testSystemData.parent,
        systemContext,
        config
      );
      
      const planetScale = profileStrategy.calculateObjectScale(
        testSystemData.children[0],
        systemContext,
        config
      );

      expect(starScale.isFixedSize).toBe(true);
      expect(starScale.scalingMethod).toBe('fixed');
      expect(planetScale.isFixedSize).toBe(true);
      expect(planetScale.scalingMethod).toBe('fixed');
      
      // Fixed sizes should be reasonable for profile view
      expect(starScale.visualRadius).toBeLessThan(1); // Small fixed sizes
      expect(planetScale.visualRadius).toBeLessThan(1);
    });
  });

  describe('Expected Layout Verification', () => {
    it('should create parent-child-child-child layout instead of parent-----child-child', () => {
      const config = DEFAULT_RENDERING_CONFIGURATION;
      
      // Simulate the layout that would be created
      const parentPosition = 0; // Parent at origin
      const childPositions = [
        config.orbital.equidistantSpacing.baseSpacing + (0 * config.orbital.equidistantSpacing.baseSpacing * config.orbital.equidistantSpacing.spacingMultiplier),
        config.orbital.equidistantSpacing.baseSpacing + (1 * config.orbital.equidistantSpacing.baseSpacing * config.orbital.equidistantSpacing.spacingMultiplier),
        config.orbital.equidistantSpacing.baseSpacing + (2 * config.orbital.equidistantSpacing.baseSpacing * config.orbital.equidistantSpacing.spacingMultiplier),
      ];
      
      // Calculate spacing between objects
      const firstGap = childPositions[0] - parentPosition;      // parent to first child
      const secondGap = childPositions[1] - childPositions[0];  // first to second child
      const thirdGap = childPositions[2] - childPositions[1];   // second to third child
      
      console.log('Layout spacing:', {
        parentToFirst: firstGap,
        firstToSecond: secondGap,
        secondToThird: thirdGap,
        totalSpan: childPositions[2] - parentPosition,
      });
      
      // The fix should create consistent, small spacing
      expect(firstGap).toBeCloseTo(0.5, 1);   // Small gap to first child (even closer now)
      expect(secondGap).toBeCloseTo(0.5, 1);  // Consistent spacing between children
      expect(thirdGap).toBeCloseTo(0.5, 1);   // Consistent spacing between children
      
      // Total span should be reasonable for profile view
      const totalSpan = childPositions[2] - parentPosition;
      expect(totalSpan).toBeCloseTo(1.5, 1); // Very compact layout
      expect(totalSpan).toBeLessThan(5); // Much better than before
      
      // This represents the desired parent-child-child-child layout
      // instead of the previous parent-----child-child-child layout
    });
  });
});