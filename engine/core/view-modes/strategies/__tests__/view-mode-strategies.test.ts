/**
 * View Mode Strategies Test Suite
 * ===============================
 * 
 * Comprehensive tests for the view mode strategy pattern implementation.
 * Validates that all strategies implement the interface correctly and
 * produce consistent, expected behavior.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import {
  ViewModeStrategy,
  SystemContext,
  LayoutInfo,
  ViewModeStrategyUtils
} from '../view-mode-strategy';
import { ExplorationalStrategy } from '../explorational-strategy';
import { NavigationalStrategy } from '../navigational-strategy';
import { ProfileStrategy } from '../profile-strategy';
import { ScientificStrategy } from '../scientific-strategy';
import { ViewModeRegistry, getViewModeRegistry, getViewModeStrategy } from '../view-mode-registry';
import { DEFAULT_RENDERING_CONFIGURATION } from '../../../configuration/rendering-configuration';
import type { CelestialObject } from '@/engine/types/orbital-system';

// Test data
const createMockCelestialObjects = (): CelestialObject[] => [
  {
    id: 'sol',
    name: 'Sol',
    classification: 'star',
    properties: { radius: 695700000, mass: 1.989e30 },
    orbit: null
  },
  {
    id: 'earth',
    name: 'Earth',
    classification: 'planet',
    properties: { radius: 6371000, mass: 5.972e24 },
    orbit: { semi_major_axis: 1.0, eccentricity: 0.0167, parent: 'sol' }
  },
  {
    id: 'luna',
    name: 'Luna',
    classification: 'moon',
    properties: { radius: 1737000, mass: 7.342e22 },
    orbit: { semi_major_axis: 0.00257, eccentricity: 0.0549, parent: 'earth' }
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    classification: 'planet',
    properties: { radius: 69911000, mass: 1.898e27 },
    orbit: { semi_major_axis: 5.2, eccentricity: 0.0489, parent: 'sol' }
  }
];

const createMockThreeObjects = (): THREE.Object3D[] => {
  const objects: THREE.Object3D[] = [];
  
  // Sol
  const sol = new THREE.Mesh();
  sol.position.set(0, 0, 0);
  sol.scale.set(2.0, 2.0, 2.0);
  sol.userData = { id: 'sol', name: 'Sol', orbitRadius: 0 };
  objects.push(sol);
  
  // Earth
  const earth = new THREE.Mesh();
  earth.position.set(50, 0, 0);
  earth.scale.set(1.0, 1.0, 1.0);
  earth.userData = { id: 'earth', name: 'Earth', orbitRadius: 50 };
  objects.push(earth);
  
  // Luna
  const luna = new THREE.Mesh();
  luna.position.set(52, 0, 0);
  luna.scale.set(0.3, 0.3, 0.3);
  luna.userData = { id: 'luna', name: 'Luna', orbitRadius: 2 };
  objects.push(luna);
  
  // Jupiter
  const jupiter = new THREE.Mesh();
  jupiter.position.set(260, 0, 0);
  jupiter.scale.set(4.0, 4.0, 4.0);
  jupiter.userData = { id: 'jupiter', name: 'Jupiter', orbitRadius: 260 };
  objects.push(jupiter);
  
  return objects;
};

const createMockSystemContext = (): SystemContext => {
  const celestialObjects = createMockCelestialObjects();
  const threeObjects = createMockThreeObjects();
  
  return ViewModeStrategyUtils.createSystemContext(celestialObjects, threeObjects);
};

const createMockLayoutInfo = (focusObjectId: string = 'earth'): LayoutInfo => {
  const threeObjects = createMockThreeObjects();
  const focusObject = threeObjects.find(obj => obj.userData.id === focusObjectId) || threeObjects[1];
  const systemBounds = ViewModeStrategyUtils.calculateSystemBounds(threeObjects);
  
  return {
    focusObject,
    focusObjectId,
    focusObjectName: focusObject.userData.name,
    visualRadius: focusObject.scale.x,
    orbitRadius: focusObject.userData.orbitRadius,
    parentObject: undefined,
    childObjects: [],
    siblingObjects: [],
    systemBounds
  };
};

describe('View Mode Strategy Pattern', () => {
  let strategies: ViewModeStrategy[];
  let mockSystemContext: SystemContext;
  let mockLayoutInfo: LayoutInfo;
  
  beforeEach(() => {
    strategies = [
      new ExplorationalStrategy(),
      new NavigationalStrategy(),
      new ProfileStrategy(),
      new ScientificStrategy()
    ];
    
    mockSystemContext = createMockSystemContext();
    mockLayoutInfo = createMockLayoutInfo();
  });
  
  describe('Strategy Interface Compliance', () => {
    it('should implement all required methods', () => {
      for (const strategy of strategies) {
        expect(strategy).toHaveProperty('id');
        expect(strategy).toHaveProperty('name');
        expect(strategy).toHaveProperty('description');
        expect(strategy).toHaveProperty('category');
        
        expect(typeof strategy.calculateCameraPosition).toBe('function');
        expect(typeof strategy.determineObjectVisibility).toBe('function');
        expect(typeof strategy.calculateObjectScale).toBe('function');
        expect(typeof strategy.getOrbitalBehavior).toBe('function');
        expect(typeof strategy.shouldAnimateOrbits).toBe('function');
        expect(typeof strategy.onViewModeEnter).toBe('function');
        expect(typeof strategy.onViewModeExit).toBe('function');
        expect(typeof strategy.validateSystemCompatibility).toBe('function');
      }
    });
    
    it('should have unique IDs', () => {
      const ids = strategies.map(s => s.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(strategies.length);
    });
    
    it('should have valid categories', () => {
      const validCategories = ['educational', 'navigation', 'scientific', 'cinematic'];
      
      for (const strategy of strategies) {
        expect(validCategories).toContain(strategy.category);
      }
    });
  });
  
  describe('Camera Position Calculation', () => {
    it('should calculate valid camera positions for all strategies', () => {
      const config = DEFAULT_RENDERING_CONFIGURATION;
      
      for (const strategy of strategies) {
        const cameraPosition = strategy.calculateCameraPosition(
          mockLayoutInfo,
          mockSystemContext,
          config
        );
        
        expect(cameraPosition).toHaveProperty('position');
        expect(cameraPosition).toHaveProperty('target');
        expect(cameraPosition).toHaveProperty('distance');
        expect(cameraPosition).toHaveProperty('elevation');
        expect(cameraPosition).toHaveProperty('animationDuration');
        expect(cameraPosition).toHaveProperty('easingFunction');
        
        expect(cameraPosition.position).toBeInstanceOf(THREE.Vector3);
        expect(cameraPosition.target).toBeInstanceOf(THREE.Vector3);
        expect(cameraPosition.distance).toBeGreaterThan(0);
        expect(cameraPosition.elevation).toBeGreaterThan(0);
        expect(cameraPosition.elevation).toBeLessThan(90);
        expect(cameraPosition.animationDuration).toBeGreaterThan(0);
        expect(typeof cameraPosition.easingFunction).toBe('string');
      }
    });
    
    it('should produce different elevations for different strategies', () => {
      const config = DEFAULT_RENDERING_CONFIGURATION;
      const elevations = new Map<string, number>();
      
      for (const strategy of strategies) {
        const cameraPosition = strategy.calculateCameraPosition(
          mockLayoutInfo,
          mockSystemContext,
          config
        );
        elevations.set(strategy.id, cameraPosition.elevation);
      }
      
      // Should have at least 2 different elevation values
      const uniqueElevations = new Set(elevations.values());
      expect(uniqueElevations.size).toBeGreaterThanOrEqual(2);
    });
  });
  
  describe('Object Visibility Determination', () => {
    it('should determine visibility for all object types', () => {
      const config = DEFAULT_RENDERING_CONFIGURATION;
      const celestialObjects = createMockCelestialObjects();
      
      for (const strategy of strategies) {
        for (const object of celestialObjects) {
          const visibility = strategy.determineObjectVisibility(
            object,
            'earth',
            mockSystemContext,
            config
          );
          
          expect(visibility).toHaveProperty('showObject');
          expect(visibility).toHaveProperty('showLabel');
          expect(visibility).toHaveProperty('showOrbit');
          expect(visibility).toHaveProperty('showChildren');
          expect(visibility).toHaveProperty('opacity');
          expect(visibility).toHaveProperty('priority');
          
          expect(typeof visibility.showObject).toBe('boolean');
          expect(typeof visibility.showLabel).toBe('boolean');
          expect(typeof visibility.showOrbit).toBe('boolean');
          expect(typeof visibility.showChildren).toBe('boolean');
          expect(visibility.opacity).toBeGreaterThan(0);
          expect(visibility.opacity).toBeLessThanOrEqual(1);
          expect(visibility.priority).toBeGreaterThanOrEqual(0);
          expect(visibility.priority).toBeLessThanOrEqual(100);
        }
      }
    });
    
    it('should give focused objects higher priority', () => {
      const config = DEFAULT_RENDERING_CONFIGURATION;
      const earth = createMockCelestialObjects().find(obj => obj.id === 'earth')!;
      
      for (const strategy of strategies) {
        const focusedVisibility = strategy.determineObjectVisibility(
          earth,
          'earth', // Earth is focused
          mockSystemContext,
          config
        );
        
        const unfocusedVisibility = strategy.determineObjectVisibility(
          earth,
          'jupiter', // Jupiter is focused instead
          mockSystemContext,
          config
        );
        
        expect(focusedVisibility.priority).toBeGreaterThanOrEqual(unfocusedVisibility.priority);
      }
    });
  });
  
  describe('Object Scale Calculation', () => {
    it('should calculate scales for all object types', () => {
      const config = DEFAULT_RENDERING_CONFIGURATION;
      const celestialObjects = createMockCelestialObjects();
      
      for (const strategy of strategies) {
        for (const object of celestialObjects) {
          const scaling = strategy.calculateObjectScale(
            object,
            mockSystemContext,
            config
          );
          
          expect(scaling).toHaveProperty('visualRadius');
          expect(scaling).toHaveProperty('isFixedSize');
          expect(scaling).toHaveProperty('scalingMethod');
          expect(scaling).toHaveProperty('relativeScale');
          
          expect(scaling.visualRadius).toBeGreaterThan(0);
          expect(typeof scaling.isFixedSize).toBe('boolean');
          expect(['logarithmic', 'proportional', 'fixed', 'scientific']).toContain(scaling.scalingMethod);
          expect(scaling.relativeScale).toBeGreaterThanOrEqual(0);
        }
      }
    });
    
    it('should respect minimum and maximum size constraints', () => {
      const config = DEFAULT_RENDERING_CONFIGURATION;
      const celestialObjects = createMockCelestialObjects();
      
      for (const strategy of strategies) {
        for (const object of celestialObjects) {
          const scaling = strategy.calculateObjectScale(
            object,
            mockSystemContext,
            config
          );
          
          expect(scaling.visualRadius).toBeGreaterThanOrEqual(config.visual.sizeConstraints.minVisualSize);
          expect(scaling.visualRadius).toBeLessThanOrEqual(config.visual.sizeConstraints.maxVisualSize);
        }
      }
    });
  });
  
  describe('Orbital Behavior Configuration', () => {
    it('should return valid orbital behavior for all strategies', () => {
      for (const strategy of strategies) {
        const behavior = strategy.getOrbitalBehavior();
        
        expect(behavior).toHaveProperty('useEccentricity');
        expect(behavior).toHaveProperty('allowVerticalOffset');
        expect(behavior).toHaveProperty('animationSpeed');
        expect(behavior).toHaveProperty('useEquidistantSpacing');
        expect(behavior).toHaveProperty('enforceCircularOrbits');
        
        expect(typeof behavior.useEccentricity).toBe('boolean');
        expect(typeof behavior.allowVerticalOffset).toBe('boolean');
        expect(behavior.animationSpeed).toBeGreaterThan(0);
        expect(typeof behavior.useEquidistantSpacing).toBe('boolean');
        expect(typeof behavior.enforceCircularOrbits).toBe('boolean');
      }
    });
    
    it('should have different orbital behaviors for different strategies', () => {
      const behaviors = strategies.map(s => s.getOrbitalBehavior());
      
      // At least some strategies should differ in their orbital behavior
      const useEccentricities = behaviors.map(b => b.useEccentricity);
      const useEquidistantSpacing = behaviors.map(b => b.useEquidistantSpacing);
      
      expect(new Set(useEccentricities).size).toBeGreaterThan(1);
      expect(new Set(useEquidistantSpacing).size).toBeGreaterThan(1);
    });
  });
  
  describe('Animation Control', () => {
    it('should respect pause state', () => {
      for (const strategy of strategies) {
        // shouldAnimateOrbits(isPaused: boolean) - returns true when NOT paused
        // So when isPaused=false (not paused), should return true
        // When isPaused=true (paused), should return false
        const whenNotPaused = strategy.shouldAnimateOrbits(false); // isPaused=false -> should return true
        const whenPaused = strategy.shouldAnimateOrbits(true);     // isPaused=true -> should return false
        
        // For debugging which strategy is failing
        if (!whenNotPaused) {
          console.log(`Strategy ${strategy.id} returns false for shouldAnimateOrbits(false) - should be true when not paused`);
        }
        
        // All return values should be boolean
        expect(typeof whenNotPaused).toBe('boolean');
        expect(typeof whenPaused).toBe('boolean');
        
        // When not paused (isPaused=false), should animate (return true)
        expect(whenNotPaused).toBe(true);
        
        // When paused (isPaused=true), should not animate (return false)
        expect(whenPaused).toBe(false);
      }
    });
  });
  
  describe('View Mode Transitions', () => {
    it('should handle view mode entry', () => {
      const config = DEFAULT_RENDERING_CONFIGURATION;
      
      for (const strategy of strategies) {
        const result = strategy.onViewModeEnter(
          null,
          mockSystemContext,
          config
        );
        
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('warnings');
        expect(result).toHaveProperty('errors');
        expect(result).toHaveProperty('cameraResetRequired');
        expect(result).toHaveProperty('cacheInvalidationRequired');
        
        expect(typeof result.success).toBe('boolean');
        expect(Array.isArray(result.warnings)).toBe(true);
        expect(Array.isArray(result.errors)).toBe(true);
        expect(typeof result.cameraResetRequired).toBe('boolean');
        expect(typeof result.cacheInvalidationRequired).toBe('boolean');
      }
    });
    
    it('should handle view mode exit', () => {
      const config = DEFAULT_RENDERING_CONFIGURATION;
      const nextStrategy = strategies[0];
      
      for (const strategy of strategies) {
        const result = strategy.onViewModeExit(
          nextStrategy,
          mockSystemContext,
          config
        );
        
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('warnings');
        expect(result).toHaveProperty('errors');
        expect(result).toHaveProperty('cameraResetRequired');
        expect(result).toHaveProperty('cacheInvalidationRequired');
      }
    });
  });
  
  describe('System Compatibility Validation', () => {
    it('should validate system compatibility', () => {
      for (const strategy of strategies) {
        const result = strategy.validateSystemCompatibility(mockSystemContext);
        
        expect(result).toHaveProperty('compatible');
        expect(result).toHaveProperty('warnings');
        expect(result).toHaveProperty('errors');
        expect(result).toHaveProperty('suggestedAlternatives');
        
        expect(typeof result.compatible).toBe('boolean');
        expect(Array.isArray(result.warnings)).toBe(true);
        expect(Array.isArray(result.errors)).toBe(true);
        expect(Array.isArray(result.suggestedAlternatives)).toBe(true);
      }
    });
    
    it('should be compatible with valid system context', () => {
      for (const strategy of strategies) {
        const result = strategy.validateSystemCompatibility(mockSystemContext);
        expect(result.compatible).toBe(true);
      }
    });
  });
});

describe('ViewModeRegistry', () => {
  let registry: ViewModeRegistry;
  
  beforeEach(() => {
    // Create a fresh registry instance for each test
    (ViewModeRegistry as any).instance = null;
    registry = ViewModeRegistry.getInstance();
  });
  
  afterEach(() => {
    // Clean up singleton
    (ViewModeRegistry as any).instance = null;
  });
  
  describe('Singleton Pattern', () => {
    it('should be a singleton', () => {
      const registry1 = ViewModeRegistry.getInstance();
      const registry2 = ViewModeRegistry.getInstance();
      
      expect(registry1).toBe(registry2);
    });
  });
  
  describe('Built-in Strategy Registration', () => {
    it('should register all built-in strategies', () => {
      const registeredModes = registry.getRegisteredViewModes();
      
      expect(registeredModes).toContain('explorational');
      expect(registeredModes).toContain('navigational');
      expect(registeredModes).toContain('profile');
      expect(registeredModes).toContain('scientific');
    });
    
    it('should have a default strategy', () => {
      const defaultStrategy = registry.getDefaultStrategy();
      expect(defaultStrategy).toBeDefined();
      expect(defaultStrategy.id).toBe('explorational');
    });
  });
  
  describe('Strategy Management', () => {
    it('should retrieve strategies by ID', () => {
      const explorational = registry.getStrategy('explorational');
      expect(explorational).toBeInstanceOf(ExplorationalStrategy);
      
      const navigational = registry.getStrategy('navigational');
      expect(navigational).toBeInstanceOf(NavigationalStrategy);
      
      const profile = registry.getStrategy('profile');
      expect(profile).toBeInstanceOf(ProfileStrategy);
      
      const scientific = registry.getStrategy('scientific');
      expect(scientific).toBeInstanceOf(ScientificStrategy);
    });
    
    it('should fall back to default for unknown strategies', () => {
      const unknownStrategy = registry.getStrategy('unknown' as any);
      expect(unknownStrategy).toBeInstanceOf(ExplorationalStrategy);
    });
    
    it('should check strategy existence', () => {
      expect(registry.hasStrategy('explorational')).toBe(true);
      expect(registry.hasStrategy('unknown' as any)).toBe(false);
    });
    
    it('should get strategies by category', () => {
      const educational = registry.getStrategiesByCategory('educational');
      expect(educational.length).toBeGreaterThan(0);
      
      const navigation = registry.getStrategiesByCategory('navigation');
      expect(navigation.length).toBeGreaterThan(0);
      
      const scientific = registry.getStrategiesByCategory('scientific');
      expect(scientific.length).toBeGreaterThan(0);
    });
  });
  
  describe('Custom Strategy Registration', () => {
    it('should allow custom strategy registration', () => {
      const customStrategy: ViewModeStrategy = {
        id: 'custom' as any,
        name: 'Custom',
        description: 'Custom test strategy',
        category: 'cinematic',
        calculateCameraPosition: () => ({
          position: new THREE.Vector3(),
          target: new THREE.Vector3(),
          distance: 10,
          elevation: 45,
          animationDuration: 1000,
          easingFunction: 'linear'
        }),
        determineObjectVisibility: () => ({
          showObject: true,
          showLabel: true,
          showOrbit: true,
          showChildren: true,
          opacity: 1.0,
          priority: 50
        }),
        calculateObjectScale: () => ({
          visualRadius: 1.0,
          isFixedSize: true,
          scalingMethod: 'fixed',
          relativeScale: 1.0
        }),
        getOrbitalBehavior: () => ({
          useEccentricity: false,
          allowVerticalOffset: false,
          animationSpeed: 1.0,
          useEquidistantSpacing: true,
          enforceCircularOrbits: true
        }),
        shouldAnimateOrbits: () => true,
        onViewModeEnter: () => ({
          success: true,
          warnings: [],
          errors: [],
          cameraResetRequired: true,
          cacheInvalidationRequired: true
        }),
        onViewModeExit: () => ({
          success: true,
          warnings: [],
          errors: [],
          cameraResetRequired: false,
          cacheInvalidationRequired: false
        }),
        validateSystemCompatibility: () => ({
          compatible: true,
          warnings: [],
          errors: [],
          suggestedAlternatives: []
        })
      };
      
      registry.registerStrategy(customStrategy);
      
      expect(registry.hasStrategy('custom' as any)).toBe(true);
      expect(registry.getStrategy('custom' as any)).toBe(customStrategy);
    });
  });
  
  describe('Validation', () => {
    it('should validate all strategies successfully', () => {
      const report = registry.validateStrategies();
      
      expect(report.valid).toBe(true);
      expect(report.errors.length).toBe(0);
      expect(report.strategyCounts.total).toBeGreaterThan(0);
    });
  });
  
  describe('Statistics', () => {
    it('should provide registry statistics', () => {
      const stats = registry.getStatistics();
      
      expect(stats).toHaveProperty('totalStrategies');
      expect(stats).toHaveProperty('defaultStrategy');
      expect(stats).toHaveProperty('categoryCounts');
      expect(stats).toHaveProperty('registeredIds');
      
      expect(stats.totalStrategies).toBeGreaterThan(0);
      expect(stats.defaultStrategy).toBe('explorational');
      expect(Array.isArray(stats.registeredIds)).toBe(true);
    });
  });
});

describe('Convenience Functions', () => {
  it('should provide convenient access to registry', () => {
    const registry = getViewModeRegistry();
    expect(registry).toBeInstanceOf(ViewModeRegistry);
  });
  
  it('should provide convenient strategy access', () => {
    const strategy = getViewModeStrategy('explorational');
    expect(strategy).toBeInstanceOf(ExplorationalStrategy);
  });
});

describe('ViewModeStrategyUtils', () => {
  describe('System Context Creation', () => {
    it('should create valid system context', () => {
      const celestialObjects = createMockCelestialObjects();
      const threeObjects = createMockThreeObjects();
      const context = ViewModeStrategyUtils.createSystemContext(celestialObjects, threeObjects);
      
      expect(context).toHaveProperty('earthReference');
      expect(context).toHaveProperty('totalObjects');
      expect(context).toHaveProperty('maxOrbitalRadius');
      expect(context).toHaveProperty('minOrbitalRadius');
      expect(context).toHaveProperty('hasMultipleStars');
      expect(context).toHaveProperty('hasMoons');
      expect(context).toHaveProperty('systemComplexity');
      
      expect(context.totalObjects).toBe(celestialObjects.length);
      expect(context.earthReference?.id).toBe('earth');
      expect(context.hasMultipleStars).toBe(false);
      expect(context.hasMoons).toBe(true);
    });
  });
  
  describe('System Bounds Calculation', () => {
    it('should calculate system bounds correctly', () => {
      const objects = createMockThreeObjects();
      const bounds = ViewModeStrategyUtils.calculateSystemBounds(objects);
      
      expect(bounds).toHaveProperty('min');
      expect(bounds).toHaveProperty('max');
      expect(bounds).toHaveProperty('center');
      
      expect(bounds.min).toBeInstanceOf(THREE.Vector3);
      expect(bounds.max).toBeInstanceOf(THREE.Vector3);
      expect(bounds.center).toBeInstanceOf(THREE.Vector3);
    });
    
    it('should handle empty object list', () => {
      const bounds = ViewModeStrategyUtils.calculateSystemBounds([]);
      
      expect(bounds.min.equals(new THREE.Vector3(0, 0, 0))).toBe(true);
      expect(bounds.max.equals(new THREE.Vector3(0, 0, 0))).toBe(true);
      expect(bounds.center.equals(new THREE.Vector3(0, 0, 0))).toBe(true);
    });
  });
  
  describe('System Complexity Calculation', () => {
    it('should calculate system complexity correctly', () => {
      const baseMockContext = createMockSystemContext();
      
      const simpleContext: SystemContext = {
        ...baseMockContext,
        totalObjects: 3,
        hasMultipleStars: false
      };
      
      const complexContext: SystemContext = {
        ...baseMockContext,
        totalObjects: 25,
        hasMultipleStars: true
      };
      
      expect(ViewModeStrategyUtils.calculateSystemComplexity(simpleContext)).toBe('simple');
      expect(ViewModeStrategyUtils.calculateSystemComplexity(complexContext)).toBe('complex');
    });
  });
});