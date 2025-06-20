/**
 * Service Container - Dependency Injection
 * ========================================
 * 
 * Lightweight, fast dependency injection container.
 * No legacy bloat, no complex features we don't need.
 * Just clean, simple dependency management.
 */

type Constructor<T = {}> = new (...args: any[]) => T;
type Factory<T> = () => T;
type ServiceIdentifier<T> = string | symbol | Constructor<T>;

interface ServiceBinding<T> {
  factory: Factory<T>;
  singleton: boolean;
  instance?: T;
}

export class ServiceContainer {
  private bindings = new Map<ServiceIdentifier<any>, ServiceBinding<any>>();
  private instances = new Map<ServiceIdentifier<any>, any>();

  /**
   * Bind a service as a singleton
   */
  singleton<T>(identifier: ServiceIdentifier<T>, factory: Factory<T>): void {
    this.bindings.set(identifier, {
      factory,
      singleton: true
    });
  }

  /**
   * Bind a service as transient (new instance each time)
   */
  transient<T>(identifier: ServiceIdentifier<T>, factory: Factory<T>): void {
    this.bindings.set(identifier, {
      factory,
      singleton: false
    });
  }

  /**
   * Bind a service using a constructor
   */
  bind<T>(identifier: ServiceIdentifier<T>, constructor: Constructor<T>): void {
    this.singleton(identifier, () => new constructor());
  }

  /**
   * Get a service instance
   */
  get<T>(identifier: ServiceIdentifier<T>): T {
    const binding = this.bindings.get(identifier);
    
    if (!binding) {
      throw new Error(`Service not found: ${String(identifier)}`);
    }

    if (binding.singleton) {
      if (!binding.instance) {
        binding.instance = binding.factory();
      }
      return binding.instance;
    }

    return binding.factory();
  }

  /**
   * Check if a service is registered
   */
  has<T>(identifier: ServiceIdentifier<T>): boolean {
    return this.bindings.has(identifier);
  }

  /**
   * Clear all bindings and instances
   */
  clear(): void {
    this.bindings.clear();
    this.instances.clear();
  }

  /**
   * Get statistics about registered services
   */
  getStats(): {
    totalBindings: number;
    singletonCount: number;
    transientCount: number;
    activeInstances: number;
  } {
    const bindings = Array.from(this.bindings.values());
    
    return {
      totalBindings: bindings.length,
      singletonCount: bindings.filter(b => b.singleton).length,
      transientCount: bindings.filter(b => !b.singleton).length,
      activeInstances: bindings.filter(b => b.instance).length
    };
  }
}

/**
 * Service identifiers (using symbols for type safety)
 */
export const SERVICE_IDENTIFIERS = {
  // Main service
  OrbitalCalculationService: Symbol('OrbitalCalculationService'),
  
  // Core calculation services
  VisualSizeCalculator: Symbol('VisualSizeCalculator'),
  OrbitPositionCalculator: Symbol('OrbitPositionCalculator'),
  CollisionDetectionService: Symbol('CollisionDetectionService'),
  HierarchyManager: Symbol('HierarchyManager'),
  
  // Support services
  CacheManager: Symbol('CacheManager'),
  ValidationService: Symbol('ValidationService'),
  
  // Configuration
  RenderingConfiguration: Symbol('RenderingConfiguration'),
} as const;

/**
 * Global service container instance
 */
export const serviceContainer = new ServiceContainer();

/**
 * Decorator for automatic dependency injection (optional, for clean syntax)
 */
export function injectable<T extends Constructor>(target: T): T {
  return target;
}

/**
 * Helper function to get a service
 */
export function getService<T>(identifier: ServiceIdentifier<T>): T {
  return serviceContainer.get(identifier);
}

/**
 * Helper function to register all orbital calculation services
 */
export async function registerOrbitalServices(): Promise<void> {
  // Import services dynamically to avoid circular dependencies
  const { VisualSizeCalculator } = await import('../orbital-calculations/visual-size-calculator');
  const { OrbitPositionCalculator } = await import('../orbital-calculations/orbit-position-calculator');
  const { CollisionDetectionService } = await import('../orbital-calculations/collision-detection-service');
  const { HierarchyManager } = await import('../orbital-calculations/hierarchy-manager');
  const { CalculationCacheManager } = await import('../orbital-calculations/cache-manager');
  const { ValidationService } = await import('../orbital-calculations/validation-service');
  const { OrbitalCalculationService } = await import('../orbital-calculations/orbital-calculation-service');
  const { DEFAULT_RENDERING_CONFIGURATION } = await import('../../core/configuration/rendering-configuration');
  
  // Register individual services
  serviceContainer.bind(SERVICE_IDENTIFIERS.VisualSizeCalculator, VisualSizeCalculator);
  serviceContainer.bind(SERVICE_IDENTIFIERS.OrbitPositionCalculator, OrbitPositionCalculator);
  serviceContainer.bind(SERVICE_IDENTIFIERS.CollisionDetectionService, CollisionDetectionService);
  serviceContainer.bind(SERVICE_IDENTIFIERS.HierarchyManager, HierarchyManager);
  serviceContainer.bind(SERVICE_IDENTIFIERS.CacheManager, CalculationCacheManager);
  serviceContainer.bind(SERVICE_IDENTIFIERS.ValidationService, ValidationService);
  
  // Register configuration
  serviceContainer.singleton(SERVICE_IDENTIFIERS.RenderingConfiguration, () => DEFAULT_RENDERING_CONFIGURATION);
  
  // Register main service with dependencies
  serviceContainer.singleton(SERVICE_IDENTIFIERS.OrbitalCalculationService, () => {
    const dependencies = {
      visualSizeCalculator: serviceContainer.get(SERVICE_IDENTIFIERS.VisualSizeCalculator),
      orbitPositionCalculator: serviceContainer.get(SERVICE_IDENTIFIERS.OrbitPositionCalculator),
      collisionDetectionService: serviceContainer.get(SERVICE_IDENTIFIERS.CollisionDetectionService),
      hierarchyManager: serviceContainer.get(SERVICE_IDENTIFIERS.HierarchyManager),
      cacheManager: serviceContainer.get(SERVICE_IDENTIFIERS.CacheManager),
      validationService: serviceContainer.get(SERVICE_IDENTIFIERS.ValidationService)
    };
    
    return new OrbitalCalculationService(dependencies);
  });
}