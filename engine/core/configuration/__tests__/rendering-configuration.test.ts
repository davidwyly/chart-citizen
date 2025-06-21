/**
 * Rendering Configuration Test Suite
 * ==================================
 * 
 * Comprehensive tests for the rendering configuration system to ensure:
 * - Configuration validation works correctly
 * - Default values match extracted magic numbers
 * - Configuration service manages state properly
 * - Edge cases and error conditions are handled
 * - No side effects from configuration changes
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  RenderingConfiguration,
  CameraConfiguration,
  OrbitalConfiguration,
  VisualConfiguration,
  PerformanceConfiguration,
  AnimationConfiguration,
  DEFAULT_RENDERING_CONFIGURATION,
  validateRenderingConfiguration,
  ConfigurationService,
} from '../rendering-configuration';

describe('RenderingConfiguration', () => {
  describe('Default Configuration Values', () => {
    it('should have correct camera distance multipliers matching extracted magic numbers', () => {
      const { camera } = DEFAULT_RENDERING_CONFIGURATION;
      
      expect(camera.distanceMultipliers.consistent).toBe(4.0);  // CONSISTENT_RADIUS_MULTIPLIER
      expect(camera.distanceMultipliers.minimum).toBe(2.5);     // CONSISTENT_MIN_MULTIPLIER
      expect(camera.distanceMultipliers.maximum).toBe(15.0);    // CONSISTENT_MAX_MULTIPLIER
      expect(camera.distanceMultipliers.profileFallback).toBe(15.0); // Fixed distance for single objects
      expect(camera.distanceMultipliers.profileLayout).toBe(1.2);    // Layout span multiplier
      expect(camera.distanceMultipliers.profileTarget).toBe(1.5);    // Target distance multiplier
    });
    
    it('should have correct elevation angles matching view mode configurations', () => {
      const { camera } = DEFAULT_RENDERING_CONFIGURATION;
      
      expect(camera.elevationAngles.explorational).toBe(30);    // explorational-mode.ts
      expect(camera.elevationAngles.navigational).toBe(35);     // navigational-mode.ts
      expect(camera.elevationAngles.profile).toBe(22.5);        // profile-mode.ts
      expect(camera.elevationAngles.scientific).toBe(15);       // scientific-mode.ts
      expect(camera.elevationAngles.birdsEyeOffset).toBe(10);   // Birds eye additional elevation
    });
    
    it('should have correct animation durations matching view mode configurations', () => {
      const { camera } = DEFAULT_RENDERING_CONFIGURATION;
      
      expect(camera.animationDuration.quick).toBe(600);         // Quick transitions
      expect(camera.animationDuration.standard).toBe(800);      // Standard focus animations
      expect(camera.animationDuration.extended).toBe(1200);     // Extended birds eye animations
      expect(camera.animationDuration.slow).toBe(2000);         // Slow deliberate animations
    });
    
    it('should have correct detection thresholds matching camera controller logic', () => {
      const { camera } = DEFAULT_RENDERING_CONFIGURATION;
      
      expect(camera.detectionThresholds.fakeOffsetMax).toBe(20);          // maxDistance < 20 detection
      expect(camera.detectionThresholds.singleObjectDistance).toBe(15);   // Fixed distance for single objects
      expect(camera.detectionThresholds.minHorizontalDirection).toBe(0.1); // Minimum horizontal direction
      expect(camera.detectionThresholds.fakeOffsetMultiplier).toBe(3);     // Fake offset multiplier
    });
    
    it('should have correct orbital safety factors matching orbital mechanics calculator', () => {
      const { orbital } = DEFAULT_RENDERING_CONFIGURATION;
      
      expect(orbital.safetyFactors.minimum).toBe(2.0);           // At least 2x safety
      expect(orbital.safetyFactors.explorational).toBe(2.5);     // explorational mode
      expect(orbital.safetyFactors.navigational).toBe(3.0);      // navigational mode
      expect(orbital.safetyFactors.profile).toBe(1.05);          // profile mode (updated for tighter layouts)
      expect(orbital.safetyFactors.scientific).toBe(1.1);        // scientific mode
      expect(orbital.safetyFactors.moonMinimum).toBe(2.0);       // Moon safety factor
    });
    
    it('should have correct belt width limits matching orbital mechanics', () => {
      const { orbital } = DEFAULT_RENDERING_CONFIGURATION;
      
      expect(orbital.beltWidthLimits.explorationMultiplier).toBe(2.0);  // config.minDistance * 2
      expect(orbital.beltWidthLimits.defaultMultiplier).toBe(0.5);      // config.orbitScaling * 0.5
      expect(orbital.beltWidthLimits.profileMultiplier).toBe(0.5);      // 0.5x minDistance width
    });
    
    it('should have correct visual size constraints', () => {
      const { visual } = DEFAULT_RENDERING_CONFIGURATION;
      
      expect(visual.sizeConstraints.minVisualSize).toBe(0.03);       // Profile mode minimum
      expect(visual.sizeConstraints.maxVisualSize).toBe(40.0);       // Scientific mode maximum
      expect(visual.sizeConstraints.earthReferenceRadius).toBe(6371000); // Earth radius in meters
    });
    
    it('should have correct fixed sizes matching view mode configurations', () => {
      const { visual } = DEFAULT_RENDERING_CONFIGURATION;
      
      expect(visual.fixedSizes.star).toBe(2.0);       // navigational/profile fixed star size
      expect(visual.fixedSizes.planet).toBe(1.2);     // navigational/profile fixed planet size
      expect(visual.fixedSizes.moon).toBe(0.6);       // navigational/profile fixed moon size
      expect(visual.fixedSizes.asteroid).toBe(0.3);   // navigational/profile fixed asteroid size
      expect(visual.fixedSizes.belt).toBe(1.0);       // navigational/profile fixed belt size
      expect(visual.fixedSizes.barycenter).toBe(0.0); // Barycenter is invisible
    });
  });
  
  describe('Configuration Validation', () => {
    it('should validate a correct configuration without errors', () => {
      const errors = validateRenderingConfiguration(DEFAULT_RENDERING_CONFIGURATION);
      expect(errors).toEqual([]);
    });
    
    it('should detect invalid camera distance multipliers', () => {
      const invalidConfig: RenderingConfiguration = {
        ...DEFAULT_RENDERING_CONFIGURATION,
        camera: {
          ...DEFAULT_RENDERING_CONFIGURATION.camera,
          distanceMultipliers: {
            ...DEFAULT_RENDERING_CONFIGURATION.camera.distanceMultipliers,
            minimum: 15.0, // Greater than maximum
            maximum: 10.0,
          },
        },
      };
      
      const errors = validateRenderingConfiguration(invalidConfig);
      expect(errors).toContain('Camera minimum distance multiplier must be less than maximum');
    });
    
    it('should detect invalid elevation angles', () => {
      const invalidConfig: RenderingConfiguration = {
        ...DEFAULT_RENDERING_CONFIGURATION,
        camera: {
          ...DEFAULT_RENDERING_CONFIGURATION.camera,
          elevationAngles: {
            ...DEFAULT_RENDERING_CONFIGURATION.camera.elevationAngles,
            explorational: 95, // Greater than 90 degrees
          },
        },
      };
      
      const errors = validateRenderingConfiguration(invalidConfig);
      expect(errors).toContain('Camera elevation angles must be between 0 and 90 degrees');
    });
    
    it('should detect invalid orbital safety factors', () => {
      const invalidConfig: RenderingConfiguration = {
        ...DEFAULT_RENDERING_CONFIGURATION,
        orbital: {
          ...DEFAULT_RENDERING_CONFIGURATION.orbital,
          safetyFactors: {
            ...DEFAULT_RENDERING_CONFIGURATION.orbital.safetyFactors,
            minimum: 0.5, // Less than 1.0
          },
        },
      };
      
      const errors = validateRenderingConfiguration(invalidConfig);
      expect(errors).toContain('Orbital safety factors must be at least 1.0');
    });
    
    it('should detect invalid collision detection parameters', () => {
      const invalidConfig: RenderingConfiguration = {
        ...DEFAULT_RENDERING_CONFIGURATION,
        orbital: {
          ...DEFAULT_RENDERING_CONFIGURATION.orbital,
          collisionDetection: {
            ...DEFAULT_RENDERING_CONFIGURATION.orbital.collisionDetection,
            maxIterations: 0, // Must be at least 1
          },
        },
      };
      
      const errors = validateRenderingConfiguration(invalidConfig);
      expect(errors).toContain('Collision detection max iterations must be at least 1');
    });
    
    it('should detect invalid visual size constraints', () => {
      const invalidConfig: RenderingConfiguration = {
        ...DEFAULT_RENDERING_CONFIGURATION,
        visual: {
          ...DEFAULT_RENDERING_CONFIGURATION.visual,
          sizeConstraints: {
            ...DEFAULT_RENDERING_CONFIGURATION.visual.sizeConstraints,
            minVisualSize: 50.0, // Greater than maximum
            maxVisualSize: 40.0,
          },
        },
      };
      
      const errors = validateRenderingConfiguration(invalidConfig);
      expect(errors).toContain('Visual size minimum must be less than maximum');
    });
    
    it('should detect invalid performance cache settings', () => {
      const invalidConfig: RenderingConfiguration = {
        ...DEFAULT_RENDERING_CONFIGURATION,
        performance: {
          ...DEFAULT_RENDERING_CONFIGURATION.performance,
          caching: {
            ...DEFAULT_RENDERING_CONFIGURATION.performance.caching,
            maxCacheSize: 0, // Must be at least 1
          },
        },
      };
      
      const errors = validateRenderingConfiguration(invalidConfig);
      expect(errors).toContain('Performance cache size must be at least 1');
    });
    
    it('should collect multiple validation errors', () => {
      const invalidConfig: RenderingConfiguration = {
        ...DEFAULT_RENDERING_CONFIGURATION,
        camera: {
          ...DEFAULT_RENDERING_CONFIGURATION.camera,
          distanceMultipliers: {
            ...DEFAULT_RENDERING_CONFIGURATION.camera.distanceMultipliers,
            minimum: 20.0, // Invalid: greater than maximum
            maximum: 10.0,
          },
        },
        orbital: {
          ...DEFAULT_RENDERING_CONFIGURATION.orbital,
          safetyFactors: {
            ...DEFAULT_RENDERING_CONFIGURATION.orbital.safetyFactors,
            minimum: 0.5, // Invalid: less than 1.0
          },
        },
      };
      
      const errors = validateRenderingConfiguration(invalidConfig);
      expect(errors).toHaveLength(2);
      expect(errors).toContain('Camera minimum distance multiplier must be less than maximum');
      expect(errors).toContain('Orbital safety factors must be at least 1.0');
    });
  });
  
  describe('ConfigurationService', () => {
    let configService: ConfigurationService;
    
    beforeEach(() => {
      // Reset the singleton instance before each test
      (ConfigurationService as any).instance = null;
      configService = ConfigurationService.getInstance();
    });
    
    afterEach(() => {
      // Clean up singleton after each test
      (ConfigurationService as any).instance = null;
    });
    
    it('should be a singleton', () => {
      const service1 = ConfigurationService.getInstance();
      const service2 = ConfigurationService.getInstance();
      
      expect(service1).toBe(service2);
    });
    
    it('should return default configuration initially', () => {
      const config = configService.getConfiguration();
      
      expect(config).toEqual(DEFAULT_RENDERING_CONFIGURATION);
      expect(config).not.toBe(DEFAULT_RENDERING_CONFIGURATION); // Should be a copy
    });
    
    it('should allow partial configuration updates', () => {
      const originalConfig = configService.getConfiguration();
      
      configService.updateConfiguration({
        camera: {
          ...originalConfig.camera,
          distanceMultipliers: {
            ...originalConfig.camera.distanceMultipliers,
            consistent: 5.0,
          },
        },
      });
      
      const updatedConfig = configService.getConfiguration();
      expect(updatedConfig.camera.distanceMultipliers.consistent).toBe(5.0);
      expect(updatedConfig.camera.distanceMultipliers.minimum).toBe(2.5); // Unchanged
    });
    
    it('should validate configuration updates', () => {
      expect(() => {
        configService.updateConfiguration({
          camera: {
            ...DEFAULT_RENDERING_CONFIGURATION.camera,
            distanceMultipliers: {
              ...DEFAULT_RENDERING_CONFIGURATION.camera.distanceMultipliers,
              minimum: 20.0, // Invalid: greater than maximum
              maximum: 10.0,
            },
          },
        });
      }).toThrow('Invalid rendering configuration update');
    });
    
    it('should reject invalid initial configuration', () => {
      const invalidConfig: RenderingConfiguration = {
        ...DEFAULT_RENDERING_CONFIGURATION,
        camera: {
          ...DEFAULT_RENDERING_CONFIGURATION.camera,
          distanceMultipliers: {
            ...DEFAULT_RENDERING_CONFIGURATION.camera.distanceMultipliers,
            minimum: 20.0, // Invalid
            maximum: 10.0,
          },
        },
      };
      
      expect(() => {
        new (ConfigurationService as any)(invalidConfig);
      }).toThrow('Invalid rendering configuration');
    });
    
    it('should reset to default configuration', () => {
      // Modify configuration
      configService.updateConfiguration({
        camera: {
          ...DEFAULT_RENDERING_CONFIGURATION.camera,
          distanceMultipliers: {
            ...DEFAULT_RENDERING_CONFIGURATION.camera.distanceMultipliers,
            consistent: 5.0,
          },
        },
      });
      
      // Verify it changed
      expect(configService.getConfiguration().camera.distanceMultipliers.consistent).toBe(5.0);
      
      // Reset to default
      configService.resetToDefault();
      
      // Verify it's back to default
      expect(configService.getConfiguration().camera.distanceMultipliers.consistent).toBe(4.0);
    });
    
    it('should maintain configuration immutability', () => {
      const config1 = configService.getConfiguration();
      const config2 = configService.getConfiguration();
      
      // Should return different objects (defensive copying)
      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
      
      // Modifying returned config should not affect service
      (config1.camera.distanceMultipliers as any).consistent = 999;
      const config3 = configService.getConfiguration();
      expect(config3.camera.distanceMultipliers.consistent).toBe(4.0);
    });
  });
  
  describe('Configuration Integration', () => {
    it('should provide all required values for camera controller', () => {
      const { camera } = DEFAULT_RENDERING_CONFIGURATION;
      
      // Test that all magic numbers from unified-camera-controller.tsx are covered
      expect(camera.distanceMultipliers.consistent).toBeTypeOf('number');
      expect(camera.distanceMultipliers.minimum).toBeTypeOf('number');
      expect(camera.distanceMultipliers.maximum).toBeTypeOf('number');
      expect(camera.elevationAngles.explorational).toBeGreaterThan(0);
      expect(camera.animationDuration.standard).toBeGreaterThan(0);
      expect(camera.detectionThresholds.fakeOffsetMax).toBeGreaterThan(0);
    });
    
    it('should provide all required values for orbital mechanics', () => {
      const { orbital } = DEFAULT_RENDERING_CONFIGURATION;
      
      // Test that all magic numbers from orbital-mechanics-calculator.ts are covered
      expect(orbital.safetyFactors.minimum).toBeGreaterThanOrEqual(1.0);
      expect(orbital.safetyFactors.moonMinimum).toBeGreaterThanOrEqual(1.0);
      expect(orbital.beltWidthLimits.explorationMultiplier).toBeGreaterThan(0);
      expect(orbital.collisionDetection.maxIterations).toBeGreaterThan(0);
    });
    
    it('should provide all required values for visual calculations', () => {
      const { visual } = DEFAULT_RENDERING_CONFIGURATION;
      
      // Test that all visual calculation requirements are met
      expect(visual.sizeConstraints.minVisualSize).toBeGreaterThan(0);
      expect(visual.sizeConstraints.maxVisualSize).toBeGreaterThan(visual.sizeConstraints.minVisualSize);
      expect(visual.fixedSizes.star).toBeGreaterThan(0);
      expect(visual.fixedSizes.planet).toBeGreaterThan(0);
      expect(visual.fixedSizes.moon).toBeGreaterThan(0);
    });
  });
  
  describe('Side Effect Detection', () => {
    it('should not modify input configuration during validation', () => {
      const testConfig = structuredClone(DEFAULT_RENDERING_CONFIGURATION);
      const originalJson = JSON.stringify(testConfig);
      
      validateRenderingConfiguration(testConfig);
      
      expect(JSON.stringify(testConfig)).toBe(originalJson);
    });
    
    it('should not have global state pollution between service instances', () => {
      // Reset singleton
      (ConfigurationService as any).instance = null;
      
      const service1 = ConfigurationService.getInstance();
      service1.updateConfiguration({
        camera: {
          ...DEFAULT_RENDERING_CONFIGURATION.camera,
          distanceMultipliers: {
            ...DEFAULT_RENDERING_CONFIGURATION.camera.distanceMultipliers,
            consistent: 5.0,
          },
        },
      });
      
      // Reset singleton again
      (ConfigurationService as any).instance = null;
      
      const service2 = ConfigurationService.getInstance();
      expect(service2.getConfiguration().camera.distanceMultipliers.consistent).toBe(4.0);
    });
    
    it('should handle concurrent configuration reads without corruption', () => {
      const service = ConfigurationService.getInstance();
      const configs = Array.from({ length: 100 }, () => service.getConfiguration());
      
      // All configs should be identical but separate objects
      for (let i = 1; i < configs.length; i++) {
        expect(configs[i]).toEqual(configs[0]);
        expect(configs[i]).not.toBe(configs[0]);
      }
    });
  });
  
  describe('Performance Characteristics', () => {
    it('should validate configuration efficiently', () => {
      const start = performance.now();
      
      // Validate configuration many times
      for (let i = 0; i < 1000; i++) {
        validateRenderingConfiguration(DEFAULT_RENDERING_CONFIGURATION);
      }
      
      const elapsed = performance.now() - start;
      
      // Should complete 1000 validations in under 100ms (very generous)
      expect(elapsed).toBeLessThan(100);
    });
    
    it('should provide configuration access efficiently', () => {
      const service = ConfigurationService.getInstance();
      const start = performance.now();
      
      // Access configuration many times
      for (let i = 0; i < 1000; i++) {
        service.getConfiguration();
      }
      
      const elapsed = performance.now() - start;
      
      // Should complete 1000 accesses in under 50ms (very generous)
      expect(elapsed).toBeLessThan(50);
    });
  });
});