/**
 * Main Orbital Calculation Service
 * ================================
 * 
 * Orchestrates all orbital calculation services using clean dependency injection.
 * No legacy workarounds - just pure, focused calculation logic.
 * Implements the full calculation pipeline with proper error handling.
 */

import type { 
  IOrbitalCalculationService,
  ServiceDependencies,
  SystemLayout,
  CalculationContext,
  CalculationResult,
  ServiceStatistics
} from './interfaces/calculation-services';
import type { CelestialObject } from '@/engine/types/orbital-system';
import type { ViewType } from '@lib/types/effects-level';
import type { ViewModeStrategy, SystemContext } from '@/engine/core/view-modes/strategies/view-mode-strategy';
import type { RenderingConfiguration } from '@/engine/core/configuration/rendering-configuration';

export class OrbitalCalculationService implements IOrbitalCalculationService {
  private totalCalculations = 0;
  private calculationTimes: number[] = [];
  private errorCount = 0;
  private lastCalculationTime: Date | null = null;

  constructor(private dependencies: ServiceDependencies) {}

  async calculateSystemLayout(
    objects: CelestialObject[],
    viewMode: ViewType,
    strategy: ViewModeStrategy,
    systemContext: SystemContext,
    config: RenderingConfiguration
  ): Promise<SystemLayout> {
    const startTime = performance.now();
    this.totalCalculations++;
    this.lastCalculationTime = new Date();
    
    try {
      // Build calculation context
      const context: CalculationContext = {
        objects,
        viewMode,
        strategy,
        systemContext,
        config
      };
      
      // Check cache first
      const cacheKey = this.dependencies.cacheManager.generateKey(context);
      const cachedResult = this.dependencies.cacheManager.get(cacheKey);
      
      if (cachedResult) {
        const endTime = performance.now();
        this.recordCalculationTime(endTime - startTime);
        
        return {
          ...cachedResult,
          metadata: {
            ...cachedResult.metadata,
            cacheHit: true
          }
        };
      }
      
      // Validate inputs
      const validationWarnings = await this.dependencies.validationService.validateContext(context);
      
      // Perform calculations
      const results = await this.performCalculations(context);
      
      // Validate results
      const resultWarnings = await this.dependencies.validationService.validateResults(results, context);
      
      // Build system layout
      const systemLayout = this.buildSystemLayout(
        results,
        context,
        [...validationWarnings, ...resultWarnings],
        startTime,
        false // cacheHit = false
      );
      
      // Cache the result
      this.dependencies.cacheManager.set(cacheKey, systemLayout);
      
      const endTime = performance.now();
      this.recordCalculationTime(endTime - startTime);
      
      return systemLayout;
      
    } catch (error) {
      this.errorCount++;
      const endTime = performance.now();
      this.recordCalculationTime(endTime - startTime);
      
      console.error('Orbital calculation failed:', error);
      throw error;
    }
  }

  async calculatePartialLayout(
    objects: CelestialObject[],
    targetObjectIds: string[],
    viewMode: ViewType,
    strategy: ViewModeStrategy,
    systemContext: SystemContext,
    config: RenderingConfiguration
  ): Promise<SystemLayout> {
    // Filter objects to only include targets and their dependencies
    const relevantObjects = this.findRelevantObjects(objects, targetObjectIds);
    
    return this.calculateSystemLayout(
      relevantObjects,
      viewMode,
      strategy,
      systemContext,
      config
    );
  }

  invalidateCache(viewMode?: ViewType): void {
    if (viewMode) {
      this.dependencies.cacheManager.clearForViewMode(viewMode);
    } else {
      this.dependencies.cacheManager.clear();
    }
  }

  getStatistics(): ServiceStatistics {
    const cacheStats = this.dependencies.cacheManager.getStatistics();
    
    return {
      totalCalculations: this.totalCalculations,
      averageCalculationTime: this.calculationTimes.length > 0 
        ? this.calculationTimes.reduce((sum, time) => sum + time, 0) / this.calculationTimes.length
        : 0,
      cacheStatistics: cacheStats,
      errorCount: this.errorCount,
      lastCalculationTime: this.lastCalculationTime
    };
  }

  /**
   * Perform the complete calculation pipeline
   */
  private async performCalculations(context: CalculationContext): Promise<Map<string, CalculationResult>> {
    const results = new Map<string, CalculationResult>();
    
    // Step 1: Calculate visual sizes for all objects
    const visualSizes = await this.dependencies.visualSizeCalculator.calculateVisualSizes(
      context.objects,
      context
    );
    
    // Step 2: Enforce hierarchy constraints
    const adjustedSizes = await this.dependencies.hierarchyManager.enforceHierarchy(
      context.objects,
      visualSizes,
      context
    );
    
    // Step 3: Calculate orbital positions
    const orbitalPositions = await this.dependencies.orbitPositionCalculator.calculateOrbitalPositions(
      context.objects,
      adjustedSizes,
      context
    );
    
    // Step 4: Detect and resolve collisions
    const collisions = await this.dependencies.collisionDetectionService.detectCollisions(
      context.objects,
      adjustedSizes,
      orbitalPositions,
      context
    );
    
    const finalOrbitalPositions = await this.dependencies.collisionDetectionService.resolveCollisions(
      collisions,
      context.objects,
      adjustedSizes,
      orbitalPositions,
      context
    );
    
    // Step 5: Build final results
    for (const object of context.objects) {
      const visualSize = adjustedSizes.get(object.id);
      const orbitDistance = finalOrbitalPositions.get(object.id);
      
      if (!visualSize) {
        console.warn(`Missing visual size for object: ${object.id}`);
        continue;
      }
      
      let beltData;
      if (object.classification === 'asteroid_belt') {
        try {
          beltData = await this.dependencies.orbitPositionCalculator.calculateBeltData(object, context);
        } catch (error) {
          console.warn(`Failed to calculate belt data for ${object.id}:`, error);
        }
      }
      
      // Calculate effective radius for objects with children
      const children = this.dependencies.hierarchyManager.getChildren(object.id, context.objects);
      let effectiveRadius;
      if (children.length > 0) {
        try {
          effectiveRadius = await this.dependencies.visualSizeCalculator.calculateEffectiveRadius(
            object,
            children,
            adjustedSizes,
            context
          );
        } catch (error) {
          console.warn(`Failed to calculate effective radius for ${object.id}:`, error);
        }
      }
      
      const result: CalculationResult = {
        visualRadius: visualSize.visualRadius,
        orbitDistance,
        beltData,
        effectiveRadius,
        collisionAdjustments: collisions.filter(c => c.objectId === object.id)
      };
      
      results.set(object.id, result);
    }
    
    return results;
  }

  /**
   * Build final system layout from calculation results
   */
  private buildSystemLayout(
    results: Map<string, CalculationResult>,
    context: CalculationContext,
    warnings: string[],
    startTime: number,
    cacheHit: boolean
  ): SystemLayout {
    // Calculate system bounds
    const bounds = this.calculateSystemBounds(results);
    
    // Count collisions
    const collisionCount = Array.from(results.values())
      .reduce((count, result) => count + (result.collisionAdjustments?.length || 0), 0);
    
    return {
      results,
      systemBounds: bounds,
      metadata: {
        viewMode: context.viewMode,
        calculationTime: performance.now() - startTime,
        objectCount: context.objects.length,
        collisionCount,
        cacheHit
      }
    };
  }

  /**
   * Calculate system bounds from results
   */
  private calculateSystemBounds(results: Map<string, CalculationResult>): {
    minRadius: number;
    maxRadius: number;
    totalSpan: number;
  } {
    let minRadius = Infinity;
    let maxRadius = 0;
    
    for (const result of results.values()) {
      if (result.orbitDistance !== undefined) {
        const outerEdge = result.orbitDistance + result.visualRadius;
        const innerEdge = Math.max(0, result.orbitDistance - result.visualRadius);
        
        minRadius = Math.min(minRadius, innerEdge);
        maxRadius = Math.max(maxRadius, outerEdge);
      } else {
        // For objects at origin (like stars)
        maxRadius = Math.max(maxRadius, result.visualRadius);
      }
    }
    
    if (minRadius === Infinity) minRadius = 0;
    
    return {
      minRadius,
      maxRadius,
      totalSpan: maxRadius - minRadius
    };
  }

  /**
   * Find objects relevant to partial calculation
   */
  private findRelevantObjects(
    allObjects: CelestialObject[],
    targetObjectIds: string[]
  ): CelestialObject[] {
    const relevantIds = new Set<string>(targetObjectIds);
    
    // Add parents and children of target objects
    for (const targetId of targetObjectIds) {
      const targetObject = allObjects.find(obj => obj.id === targetId);
      if (!targetObject) continue;
      
      // Add parent chain
      let current = targetObject;
      while (current.orbit?.parent) {
        relevantIds.add(current.orbit.parent);
        current = allObjects.find(obj => obj.id === current.orbit!.parent) || current;
        if (current === targetObject) break; // Prevent infinite loop
      }
      
      // Add children
      const children = this.dependencies.hierarchyManager.getChildren(targetId, allObjects);
      for (const child of children) {
        relevantIds.add(child.id);
      }
    }
    
    return allObjects.filter(obj => relevantIds.has(obj.id));
  }

  /**
   * Record calculation time for statistics
   */
  private recordCalculationTime(timeMs: number): void {
    this.calculationTimes.push(timeMs);
    
    // Keep only last 100 calculation times for rolling average
    if (this.calculationTimes.length > 100) {
      this.calculationTimes.shift();
    }
  }

  /**
   * Get detailed performance metrics
   */
  getPerformanceMetrics(): {
    averageCalculationTime: number;
    minCalculationTime: number;
    maxCalculationTime: number;
    recentCalculationTimes: number[];
    cacheStatistics: ReturnType<typeof this.dependencies.cacheManager.getStatistics>;
  } {
    const times = this.calculationTimes;
    
    return {
      averageCalculationTime: times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 0,
      minCalculationTime: times.length > 0 ? Math.min(...times) : 0,
      maxCalculationTime: times.length > 0 ? Math.max(...times) : 0,
      recentCalculationTimes: [...times], // Copy array
      cacheStatistics: this.dependencies.cacheManager.getStatistics()
    };
  }

  /**
   * Health check for all services
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    services: Record<string, boolean>;
    errors: string[];
  }> {
    const errors: string[] = [];
    const services: Record<string, boolean> = {};
    
    try {
      // Test each service
      services.visualSizeCalculator = !!this.dependencies.visualSizeCalculator;
      services.orbitPositionCalculator = !!this.dependencies.orbitPositionCalculator;
      services.collisionDetectionService = !!this.dependencies.collisionDetectionService;
      services.hierarchyManager = !!this.dependencies.hierarchyManager;
      services.cacheManager = !!this.dependencies.cacheManager;
      services.validationService = !!this.dependencies.validationService;
      
      // Additional health checks could go here
      
    } catch (error) {
      errors.push(`Health check failed: ${error}`);
    }
    
    const healthy = Object.values(services).every(s => s) && errors.length === 0;
    
    return { healthy, services, errors };
  }
}