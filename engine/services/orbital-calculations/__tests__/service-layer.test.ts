/**
 * Service Layer Integration Tests
 * ===============================
 * 
 * Comprehensive tests for the new service-oriented orbital calculation architecture.
 * Tests individual services and their integration.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { CelestialObject } from '@/engine/types/orbital-system';
import type { CalculationContext } from '../interfaces/calculation-services';
import { DEFAULT_RENDERING_CONFIGURATION } from '../../../core/configuration/rendering-configuration';
import { ExplorationalStrategy } from '../../../core/view-modes/strategies/explorational-strategy';
import { ViewModeStrategyUtils } from '../../../core/view-modes/strategies/view-mode-strategy';

// Import services
import { VisualSizeCalculator } from '../visual-size-calculator';
import { OrbitPositionCalculator } from '../orbit-position-calculator';
import { CollisionDetectionService } from '../collision-detection-service';
import { HierarchyManager } from '../hierarchy-manager';
import { CalculationCacheManager } from '../cache-manager';
import { ValidationService } from '../validation-service';
import { OrbitalCalculationService } from '../orbital-calculation-service';
import { ServiceContainer, SERVICE_IDENTIFIERS } from '../../container/service-container';

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
    id: 'mars',
    name: 'Mars',
    classification: 'planet',
    properties: { radius: 3390000, mass: 6.39e23 },
    orbit: { semi_major_axis: 1.52, eccentricity: 0.0934, parent: 'sol' }
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    classification: 'planet',
    properties: { radius: 69911000, mass: 1.898e27 },
    orbit: { semi_major_axis: 5.2, eccentricity: 0.0489, parent: 'sol' }
  }
];

const createMockContext = (objects: CelestialObject[] = createMockCelestialObjects()): CalculationContext => {
  const strategy = new ExplorationalStrategy();
  const systemContext = ViewModeStrategyUtils.createSystemContext(objects, []);
  
  return {
    objects,
    viewMode: 'explorational',
    strategy,
    systemContext,
    config: DEFAULT_RENDERING_CONFIGURATION
  };
};

describe('Service Layer Architecture', () => {
  let container: ServiceContainer;
  let visualSizeCalculator: VisualSizeCalculator;
  let orbitPositionCalculator: OrbitPositionCalculator;
  let collisionDetectionService: CollisionDetectionService;
  let hierarchyManager: HierarchyManager;
  let cacheManager: CalculationCacheManager;
  let validationService: ValidationService;
  let orbitalCalculationService: OrbitalCalculationService;
  
  beforeEach(() => {
    // Create fresh service instances for each test
    container = new ServiceContainer();
    visualSizeCalculator = new VisualSizeCalculator();
    orbitPositionCalculator = new OrbitPositionCalculator();
    collisionDetectionService = new CollisionDetectionService();
    hierarchyManager = new HierarchyManager();
    cacheManager = new CalculationCacheManager();
    validationService = new ValidationService();
    
    // Create main service with dependencies
    orbitalCalculationService = new OrbitalCalculationService({
      visualSizeCalculator,
      orbitPositionCalculator,
      collisionDetectionService,
      hierarchyManager,
      cacheManager,
      validationService
    });
  });
  
  afterEach(() => {
    // Clean up
    cacheManager.clear();
    container.clear();
  });
  
  describe('Individual Service Tests', () => {
    describe('VisualSizeCalculator', () => {
      it('should calculate visual sizes for all objects', async () => {
        const context = createMockContext();
        const results = await visualSizeCalculator.calculateVisualSizes(context.objects, context);
        
        expect(results.size).toBe(context.objects.length);
        
        for (const [objectId, size] of results) {
          expect(size.visualRadius).toBeGreaterThan(0);
          expect(size.visualRadius).toBeLessThanOrEqual(context.config.visual.sizeConstraints.maxVisualSize);
          expect(size.visualRadius).toBeGreaterThanOrEqual(context.config.visual.sizeConstraints.minVisualSize);
          expect(['logarithmic', 'proportional', 'fixed', 'scientific']).toContain(size.scalingMethod);
        }
      });
      
      it('should validate size constraints', async () => {
        const context = createMockContext();
        const sizes = await visualSizeCalculator.calculateVisualSizes(context.objects, context);
        const warnings = await visualSizeCalculator.validateSizes(sizes, context);
        
        // Should have no warnings with valid data
        expect(warnings).toEqual([]);
      });
    });
    
    describe('OrbitPositionCalculator', () => {
      it('should calculate orbital positions using two-pass algorithm', async () => {
        const context = createMockContext();
        const visualSizes = await visualSizeCalculator.calculateVisualSizes(context.objects, context);
        const positions = await orbitPositionCalculator.calculateOrbitalPositions(
          context.objects,
          visualSizes,
          context
        );
        
        // Should have positions for all objects with orbits
        const objectsWithOrbits = context.objects.filter(obj => obj.orbit || obj.classification === 'star');
        expect(positions.size).toBe(objectsWithOrbits.length);
        
        // Star should be at origin
        expect(positions.get('sol')).toBe(0);
        
        // Planets should have positive distances
        expect(positions.get('earth')).toBeGreaterThan(0);
        expect(positions.get('mars')).toBeGreaterThan(0);
        expect(positions.get('jupiter')).toBeGreaterThan(0);
        
        // Moon should have small distance relative to planets
        const lunaDistance = positions.get('luna');
        const earthDistance = positions.get('earth');
        expect(lunaDistance).toBeGreaterThan(0);
        expect(lunaDistance).toBeLessThan(earthDistance! / 10); // Moon orbit should be much smaller
      });
      
      it('should handle belt objects', async () => {
        const objects = [
          ...createMockCelestialObjects(),
          {
            id: 'asteroid_belt',
            name: 'Asteroid Belt',
            classification: 'asteroid_belt' as const,
            properties: { radius: 500000, mass: 3e21 },
            orbit: { semi_major_axis: 2.8, eccentricity: 0.1, parent: 'sol' }
          }
        ];
        
        const context = createMockContext(objects);
        const beltData = await orbitPositionCalculator.calculateBeltData(
          objects[objects.length - 1],
          context
        );
        
        expect(beltData.centerRadius).toBeGreaterThan(0);
        expect(beltData.innerRadius).toBeLessThan(beltData.centerRadius);
        expect(beltData.outerRadius).toBeGreaterThan(beltData.centerRadius);
        expect(beltData.width).toBeGreaterThan(0);
      });
    });
    
    describe('CollisionDetectionService', () => {
      it('should detect and resolve collisions', async () => {
        const context = createMockContext();
        const visualSizes = await visualSizeCalculator.calculateVisualSizes(context.objects, context);
        const positions = await orbitPositionCalculator.calculateOrbitalPositions(
          context.objects,
          visualSizes,
          context
        );
        
        const collisions = await collisionDetectionService.detectCollisions(
          context.objects,
          visualSizes,
          positions,
          context
        );
        
        expect(Array.isArray(collisions)).toBe(true);
        
        if (collisions.length > 0) {
          const resolvedPositions = await collisionDetectionService.resolveCollisions(
            collisions,
            context.objects,
            visualSizes,
            positions,
            context
          );
          
          expect(resolvedPositions.size).toBe(positions.size);
          
          // Resolved positions should be different from original if there were collisions
          for (const collision of collisions) {
            const originalPos = positions.get(collision.objectId);
            const resolvedPos = resolvedPositions.get(collision.objectId);
            
            if (originalPos !== undefined && resolvedPos !== undefined) {
              expect(resolvedPos).toBeGreaterThanOrEqual(originalPos);
            }
          }
        }
      });
    });
    
    describe('HierarchyManager', () => {
      it('should build correct hierarchy structure', async () => {
        const objects = createMockCelestialObjects();
        const hierarchy = await hierarchyManager.buildHierarchy(objects);
        
        expect(hierarchy.object.id).toBe('sol');
        expect(hierarchy.isRoot).toBe(true);
        expect(hierarchy.depth).toBe(0);
        expect(hierarchy.children.length).toBeGreaterThan(0);
        
        // Check for Earth and its moon
        const earthNode = hierarchy.children.find(child => child.object.id === 'earth');
        expect(earthNode).toBeDefined();
        expect(earthNode!.depth).toBe(1);
        
        const lunaNode = earthNode!.children.find(child => child.object.id === 'luna');
        expect(lunaNode).toBeDefined();
        expect(lunaNode!.depth).toBe(2);
      });
      
      it('should validate hierarchy relationships', async () => {
        const objects = createMockCelestialObjects();
        const warnings = await hierarchyManager.validateHierarchy(objects);
        
        // Should have no warnings with valid hierarchy
        expect(warnings).toEqual([]);
      });
      
      it('should get parent and children correctly', () => {
        const objects = createMockCelestialObjects();
        
        const earthChildren = hierarchyManager.getChildren('earth', objects);
        expect(earthChildren.length).toBe(1);
        expect(earthChildren[0].id).toBe('luna');
        
        const lunaParent = hierarchyManager.getParent('luna', objects);
        expect(lunaParent?.id).toBe('earth');
        
        const solParent = hierarchyManager.getParent('sol', objects);
        expect(solParent).toBeNull();
      });
    });
    
    describe('CacheManager', () => {
      it('should cache and retrieve results correctly', () => {
        const context = createMockContext();
        const key = cacheManager.generateKey(context);
        
        expect(cacheManager.has(key)).toBe(false);
        expect(cacheManager.get(key)).toBeNull();
        
        const mockLayout = {
          results: new Map(),
          systemBounds: { minRadius: 0, maxRadius: 100, totalSpan: 100 },
          metadata: {
            viewMode: 'explorational' as const,
            calculationTime: 50,
            objectCount: 5,
            collisionCount: 0,
            cacheHit: false
          }
        };
        
        cacheManager.set(key, mockLayout);
        
        expect(cacheManager.has(key)).toBe(true);
        const retrieved = cacheManager.get(key);
        expect(retrieved).toEqual(mockLayout);
      });
      
      it('should provide cache statistics', () => {
        const stats = cacheManager.getStatistics();
        
        expect(stats).toHaveProperty('totalEntries');
        expect(stats).toHaveProperty('hitRate');
        expect(stats).toHaveProperty('missRate');
        expect(stats).toHaveProperty('memoryUsage');
        expect(stats.totalEntries).toBe(0);
      });
      
      it('should clear cache by view mode', () => {
        const context = createMockContext();
        const key = cacheManager.generateKey(context);
        const mockLayout = {
          results: new Map(),
          systemBounds: { minRadius: 0, maxRadius: 100, totalSpan: 100 },
          metadata: {
            viewMode: 'explorational' as const,
            calculationTime: 50,
            objectCount: 5,
            collisionCount: 0,
            cacheHit: false
          }
        };
        
        cacheManager.set(key, mockLayout);
        expect(cacheManager.has(key)).toBe(true);
        
        cacheManager.clearForViewMode('explorational');
        expect(cacheManager.has(key)).toBe(false);
      });
    });
    
    describe('ValidationService', () => {
      it('should validate calculation context', async () => {
        const context = createMockContext();
        const warnings = await validationService.validateContext(context);
        
        // Should have no warnings with valid context
        expect(Array.isArray(warnings)).toBe(true);
      });
      
      it('should validate objects', async () => {
        const objects = createMockCelestialObjects();
        const warnings = await validationService.validateObjects(objects);
        
        // Should have no warnings with valid objects
        expect(Array.isArray(warnings)).toBe(true);
      });
      
      it('should detect invalid objects', async () => {
        const invalidObjects: CelestialObject[] = [
          {
            id: '', // Invalid empty ID
            name: 'Invalid',
            classification: 'planet',
            properties: { radius: -100, mass: -50 }, // Invalid negative values
            orbit: { semi_major_axis: 1.0, eccentricity: 2.0, parent: 'nonexistent' } // Invalid eccentricity and parent
          }
        ];
        
        const warnings = await validationService.validateObjects(invalidObjects);
        
        expect(warnings.length).toBeGreaterThan(0);
      });
    });
  });
  
  describe('Integrated Service Tests', () => {
    describe('OrbitalCalculationService', () => {
      it('should calculate complete system layout', async () => {
        const objects = createMockCelestialObjects();
        const strategy = new ExplorationalStrategy();
        const systemContext = ViewModeStrategyUtils.createSystemContext(objects, []);
        
        const layout = await orbitalCalculationService.calculateSystemLayout(
          objects,
          'explorational',
          strategy,
          systemContext,
          DEFAULT_RENDERING_CONFIGURATION
        );
        
        expect(layout.results.size).toBe(objects.length);
        expect(layout.systemBounds.maxRadius).toBeGreaterThan(0);
        expect(layout.systemBounds.totalSpan).toBeGreaterThan(0);
        expect(layout.metadata.objectCount).toBe(objects.length);
        expect(layout.metadata.viewMode).toBe('explorational');
        expect(layout.metadata.calculationTime).toBeGreaterThan(0);
      });
      
      it('should use cache for repeated calculations', async () => {
        const objects = createMockCelestialObjects();
        const strategy = new ExplorationalStrategy();
        const systemContext = ViewModeStrategyUtils.createSystemContext(objects, []);
        
        // First calculation
        const layout1 = await orbitalCalculationService.calculateSystemLayout(
          objects,
          'explorational',
          strategy,
          systemContext,
          DEFAULT_RENDERING_CONFIGURATION
        );
        
        // Second calculation (should hit cache)
        const layout2 = await orbitalCalculationService.calculateSystemLayout(
          objects,
          'explorational',
          strategy,
          systemContext,
          DEFAULT_RENDERING_CONFIGURATION
        );
        
        expect(layout1.metadata.cacheHit).toBe(false);
        expect(layout2.metadata.cacheHit).toBe(true);
        expect(layout2.results.size).toBe(layout1.results.size);
      });
      
      it('should handle partial layouts', async () => {
        const objects = createMockCelestialObjects();
        const strategy = new ExplorationalStrategy();
        const systemContext = ViewModeStrategyUtils.createSystemContext(objects, []);
        
        const partialLayout = await orbitalCalculationService.calculatePartialLayout(
          objects,
          ['earth', 'luna'], // Only Earth and Luna
          'explorational',
          strategy,
          systemContext,
          DEFAULT_RENDERING_CONFIGURATION
        );
        
        // Should include Earth, Luna, and Sol (parent)
        expect(partialLayout.results.size).toBeGreaterThanOrEqual(3);
        expect(partialLayout.results.has('earth')).toBe(true);
        expect(partialLayout.results.has('luna')).toBe(true);
        expect(partialLayout.results.has('sol')).toBe(true); // Parent included
      });
      
      it('should provide service statistics', () => {
        const stats = orbitalCalculationService.getStatistics();
        
        expect(stats).toHaveProperty('totalCalculations');
        expect(stats).toHaveProperty('averageCalculationTime');
        expect(stats).toHaveProperty('cacheStatistics');
        expect(stats).toHaveProperty('errorCount');
        expect(stats).toHaveProperty('lastCalculationTime');
      });
      
      it('should invalidate cache', async () => {
        const objects = createMockCelestialObjects();
        const strategy = new ExplorationalStrategy();
        const systemContext = ViewModeStrategyUtils.createSystemContext(objects, []);
        
        // First calculation
        await orbitalCalculationService.calculateSystemLayout(
          objects,
          'explorational',
          strategy,
          systemContext,
          DEFAULT_RENDERING_CONFIGURATION
        );
        
        // Invalidate cache
        orbitalCalculationService.invalidateCache('explorational');
        
        // Second calculation (should not hit cache)
        const layout = await orbitalCalculationService.calculateSystemLayout(
          objects,
          'explorational',
          strategy,
          systemContext,
          DEFAULT_RENDERING_CONFIGURATION
        );
        
        expect(layout.metadata.cacheHit).toBe(false);
      });
      
      it('should perform health check', async () => {
        const health = await orbitalCalculationService.healthCheck();
        
        expect(health).toHaveProperty('healthy');
        expect(health).toHaveProperty('services');
        expect(health).toHaveProperty('errors');
        
        expect(health.healthy).toBe(true);
        expect(health.services.visualSizeCalculator).toBe(true);
        expect(health.services.orbitPositionCalculator).toBe(true);
        expect(health.services.collisionDetectionService).toBe(true);
        expect(health.services.hierarchyManager).toBe(true);
        expect(health.services.cacheManager).toBe(true);
        expect(health.services.validationService).toBe(true);
      });
    });
  });
  
  describe('Performance Tests', () => {
    it('should handle large systems efficiently', async () => {
      // Create a larger system for performance testing
      const largeSystem: CelestialObject[] = [
        {
          id: 'sol',
          name: 'Sol',
          classification: 'star',
          properties: { radius: 695700000, mass: 1.989e30 },
          orbit: null
        }
      ];
      
      // Add many planets
      for (let i = 1; i <= 20; i++) {
        largeSystem.push({
          id: `planet_${i}`,
          name: `Planet ${i}`,
          classification: 'planet',
          properties: { radius: 6371000 + i * 1000000, mass: 5.972e24 },
          orbit: { semi_major_axis: i * 0.5, eccentricity: 0.05, parent: 'sol' }
        });
      }
      
      const strategy = new ExplorationalStrategy();
      const systemContext = ViewModeStrategyUtils.createSystemContext(largeSystem, []);
      
      const startTime = performance.now();
      
      const layout = await orbitalCalculationService.calculateSystemLayout(
        largeSystem,
        'explorational',
        strategy,
        systemContext,
        DEFAULT_RENDERING_CONFIGURATION
      );
      
      const endTime = performance.now();
      const calculationTime = endTime - startTime;
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(calculationTime).toBeLessThan(1000); // 1 second
      expect(layout.results.size).toBe(largeSystem.length);
    });
    
    it('should benefit from caching on repeated calculations', async () => {
      const objects = createMockCelestialObjects();
      const strategy = new ExplorationalStrategy();
      const systemContext = ViewModeStrategyUtils.createSystemContext(objects, []);
      
      // Warm up
      await orbitalCalculationService.calculateSystemLayout(
        objects,
        'explorational',
        strategy,
        systemContext,
        DEFAULT_RENDERING_CONFIGURATION
      );
      
      const startTime = performance.now();
      
      // This should hit cache
      await orbitalCalculationService.calculateSystemLayout(
        objects,
        'explorational',
        strategy,
        systemContext,
        DEFAULT_RENDERING_CONFIGURATION
      );
      
      const endTime = performance.now();
      const cachedTime = endTime - startTime;
      
      // Cached calculation should be very fast
      expect(cachedTime).toBeLessThan(50); // 50ms
    });
  });
});