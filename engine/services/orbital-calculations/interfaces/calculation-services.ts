/**
 * Orbital Calculation Service Interfaces
 * =====================================
 * 
 * Clean, focused interfaces for orbital calculation services following SOLID principles.
 * Each service has a single responsibility and clear contract.
 */

import type { ViewType } from '@lib/types/effects-level';
import type { CelestialObject } from '@/engine/types/orbital-system';
import type { ViewModeStrategy, SystemContext, ScalingResult } from '@/engine/core/view-modes/strategies/view-mode-strategy';
import type { RenderingConfiguration } from '@/engine/core/configuration/rendering-configuration';

/**
 * Results from orbital calculations
 */
export interface CalculationResult {
  readonly visualRadius: number;
  readonly orbitDistance?: number;
  readonly beltData?: BeltData;
  readonly effectiveRadius?: number;
  readonly collisionAdjustments?: CollisionAdjustment[];
  readonly validationWarnings?: string[];
}

export interface BeltData {
  readonly innerRadius: number;
  readonly outerRadius: number;
  readonly centerRadius: number;
  readonly width: number;
}

export interface CollisionAdjustment {
  readonly objectId: string;
  readonly originalDistance: number;
  readonly adjustedDistance: number;
  readonly reason: string;
}

export interface SystemLayout {
  readonly results: Map<string, CalculationResult>;
  readonly systemBounds: {
    readonly minRadius: number;
    readonly maxRadius: number;
    readonly totalSpan: number;
  };
  readonly metadata: {
    readonly viewMode: ViewType;
    readonly calculationTime: number;
    readonly objectCount: number;
    readonly collisionCount: number;
    readonly cacheHit: boolean;
  };
}

/**
 * Context for calculations
 */
export interface CalculationContext {
  readonly objects: CelestialObject[];
  readonly viewMode: ViewType;
  readonly strategy: ViewModeStrategy;
  readonly systemContext: SystemContext;
  readonly config: RenderingConfiguration;
  readonly parentObject?: CelestialObject;
  readonly siblingObjects?: CelestialObject[];
}

/**
 * Visual Size Calculator Service
 * Responsible for calculating object visual sizes based on view mode strategy
 */
export interface IVisualSizeCalculator {
  /**
   * Calculate visual size for a single object
   */
  calculateVisualSize(
    object: CelestialObject,
    context: CalculationContext
  ): Promise<ScalingResult>;

  /**
   * Calculate visual sizes for multiple objects
   */
  calculateVisualSizes(
    objects: CelestialObject[],
    context: CalculationContext
  ): Promise<Map<string, ScalingResult>>;

  /**
   * Calculate effective radius including child objects
   */
  calculateEffectiveRadius(
    parentObject: CelestialObject,
    childObjects: CelestialObject[],
    visualSizes: Map<string, ScalingResult>,
    context: CalculationContext
  ): Promise<number>;

  /**
   * Validate size constraints
   */
  validateSizes(
    sizes: Map<string, ScalingResult>,
    context: CalculationContext
  ): Promise<string[]>;
}

/**
 * Orbit Position Calculator Service
 * Responsible for calculating orbital positions and handling complex dependencies
 */
export interface IOrbitPositionCalculator {
  /**
   * Calculate orbital positions using two-pass algorithm
   */
  calculateOrbitalPositions(
    objects: CelestialObject[],
    visualSizes: Map<string, ScalingResult>,
    context: CalculationContext
  ): Promise<Map<string, number>>;

  /**
   * Calculate moon orbits (Pass 1)
   */
  calculateMoonOrbits(
    objects: CelestialObject[],
    visualSizes: Map<string, ScalingResult>,
    context: CalculationContext
  ): Promise<Map<string, number>>;

  /**
   * Calculate planet and belt orbits (Pass 2)
   */
  calculatePlanetOrbits(
    objects: CelestialObject[],
    visualSizes: Map<string, ScalingResult>,
    moonOrbits: Map<string, number>,
    context: CalculationContext
  ): Promise<Map<string, number>>;

  /**
   * Calculate belt data
   */
  calculateBeltData(
    beltObject: CelestialObject,
    context: CalculationContext
  ): Promise<BeltData>;
}

/**
 * Collision Detection Service
 * Responsible for detecting and resolving orbital collisions
 */
export interface ICollisionDetectionService {
  /**
   * Detect collisions in calculated orbits
   */
  detectCollisions(
    objects: CelestialObject[],
    visualSizes: Map<string, ScalingResult>,
    orbitalPositions: Map<string, number>,
    context: CalculationContext
  ): Promise<CollisionAdjustment[]>;

  /**
   * Resolve detected collisions
   */
  resolveCollisions(
    collisions: CollisionAdjustment[],
    objects: CelestialObject[],
    visualSizes: Map<string, ScalingResult>,
    orbitalPositions: Map<string, number>,
    context: CalculationContext
  ): Promise<Map<string, number>>;

  /**
   * Check for parent-child collisions
   */
  checkParentChildCollisions(
    parentObject: CelestialObject,
    childObjects: CelestialObject[],
    visualSizes: Map<string, ScalingResult>,
    orbitalPositions: Map<string, number>,
    context: CalculationContext
  ): Promise<CollisionAdjustment[]>;

  /**
   * Check for sibling collisions
   */
  checkSiblingCollisions(
    objects: CelestialObject[],
    visualSizes: Map<string, ScalingResult>,
    orbitalPositions: Map<string, number>,
    context: CalculationContext
  ): Promise<CollisionAdjustment[]>;
}

/**
 * Hierarchy Manager Service
 * Responsible for managing parent-child relationships and size hierarchy
 */
export interface IHierarchyManager {
  /**
   * Enforce parent-child size hierarchy
   */
  enforceHierarchy(
    objects: CelestialObject[],
    visualSizes: Map<string, ScalingResult>,
    context: CalculationContext
  ): Promise<Map<string, ScalingResult>>;

  /**
   * Build object hierarchy tree
   */
  buildHierarchy(
    objects: CelestialObject[]
  ): Promise<HierarchyNode>;

  /**
   * Get children of an object
   */
  getChildren(
    parentId: string,
    objects: CelestialObject[]
  ): CelestialObject[];

  /**
   * Get parent of an object
   */
  getParent(
    objectId: string,
    objects: CelestialObject[]
  ): CelestialObject | null;

  /**
   * Validate hierarchy relationships
   */
  validateHierarchy(
    objects: CelestialObject[]
  ): Promise<string[]>;
}

export interface HierarchyNode {
  readonly object: CelestialObject;
  readonly children: HierarchyNode[];
  readonly depth: number;
  readonly isRoot: boolean;
}

/**
 * Calculation Cache Manager Service
 * Responsible for caching calculation results for performance
 */
export interface ICalculationCacheManager {
  /**
   * Generate cache key for calculation context
   */
  generateKey(context: CalculationContext): string;

  /**
   * Check if result exists in cache
   */
  has(key: string): boolean;

  /**
   * Get cached result
   */
  get(key: string): SystemLayout | null;

  /**
   * Set cache result
   */
  set(key: string, result: SystemLayout): void;

  /**
   * Clear cache
   */
  clear(): void;

  /**
   * Clear cache for specific view mode
   */
  clearForViewMode(viewMode: ViewType): void;

  /**
   * Get cache statistics
   */
  getStatistics(): CacheStatistics;
}

export interface CacheStatistics {
  readonly totalEntries: number;
  readonly hitRate: number;
  readonly missRate: number;
  readonly memoryUsage: number;
  readonly oldestEntry: Date | null;
  readonly newestEntry: Date | null;
}

/**
 * Main Orbital Calculation Service
 * Orchestrates all the other services to provide the main calculation interface
 */
export interface IOrbitalCalculationService {
  /**
   * Calculate complete system layout
   */
  calculateSystemLayout(
    objects: CelestialObject[],
    viewMode: ViewType,
    strategy: ViewModeStrategy,
    systemContext: SystemContext,
    config: RenderingConfiguration
  ): Promise<SystemLayout>;

  /**
   * Calculate layout for specific objects only
   */
  calculatePartialLayout(
    objects: CelestialObject[],
    targetObjectIds: string[],
    viewMode: ViewType,
    strategy: ViewModeStrategy,
    systemContext: SystemContext,
    config: RenderingConfiguration
  ): Promise<SystemLayout>;

  /**
   * Invalidate cache
   */
  invalidateCache(viewMode?: ViewType): void;

  /**
   * Get service statistics
   */
  getStatistics(): ServiceStatistics;
}

export interface ServiceStatistics {
  readonly totalCalculations: number;
  readonly averageCalculationTime: number;
  readonly cacheStatistics: CacheStatistics;
  readonly errorCount: number;
  readonly lastCalculationTime: Date | null;
}

/**
 * Validation Service
 * Responsible for validating calculation inputs and results
 */
export interface IValidationService {
  /**
   * Validate calculation context
   */
  validateContext(context: CalculationContext): Promise<string[]>;

  /**
   * Validate objects before calculation
   */
  validateObjects(objects: CelestialObject[]): Promise<string[]>;

  /**
   * Validate calculation results
   */
  validateResults(
    results: Map<string, CalculationResult>,
    context: CalculationContext
  ): Promise<string[]>;

  /**
   * Validate view mode compatibility
   */
  validateViewModeCompatibility(
    objects: CelestialObject[],
    viewMode: ViewType,
    strategy: ViewModeStrategy
  ): Promise<string[]>;
}

/**
 * Service Dependencies
 * Used for dependency injection
 */
export interface ServiceDependencies {
  visualSizeCalculator: IVisualSizeCalculator;
  orbitPositionCalculator: IOrbitPositionCalculator;
  collisionDetectionService: ICollisionDetectionService;
  hierarchyManager: IHierarchyManager;
  cacheManager: ICalculationCacheManager;
  validationService: IValidationService;
}

/**
 * Service Factory interface for dependency injection
 */
export interface IServiceFactory {
  createOrbitalCalculationService(): IOrbitalCalculationService;
  createVisualSizeCalculator(): IVisualSizeCalculator;
  createOrbitPositionCalculator(): IOrbitPositionCalculator;
  createCollisionDetectionService(): ICollisionDetectionService;
  createHierarchyManager(): IHierarchyManager;
  createCacheManager(): ICalculationCacheManager;
  createValidationService(): IValidationService;
}