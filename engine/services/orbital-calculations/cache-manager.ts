/**
 * Calculation Cache Manager Service
 * =================================
 * 
 * High-performance caching for orbital calculations.
 * Smart invalidation and memory management.
 * No legacy bloat - clean, focused implementation.
 */

// No decorators needed - using manual service registration
import type { 
  ICalculationCacheManager,
  CalculationContext,
  SystemLayout,
  CacheStatistics
} from './interfaces/calculation-services';
import type { ViewType } from '@lib/types/effects-level';

interface CacheEntry {
  readonly data: SystemLayout;
  readonly timestamp: Date;
  readonly accessCount: number;
  readonly size: number; // Memory size estimate in bytes
  lastAccessed: Date;
}

export class CalculationCacheManager implements ICalculationCacheManager {
  private cache = new Map<string, CacheEntry>();
  private hitCount = 0;
  private missCount = 0;
  private maxEntries: number;
  private maxMemoryMB: number;
  
  constructor() {
    // Configuration-driven cache limits
    this.maxEntries = 100;
    this.maxMemoryMB = 50; // 50MB default limit
  }

  generateKey(context: CalculationContext): string {
    // Create a deterministic key from context
    const keyComponents = [
      context.viewMode,
      context.objects.length,
      context.strategy.id,
      this.hashObjects(context.objects),
      this.hashSystemContext(context.systemContext),
      this.hashConfig(context.config)
    ];
    
    return keyComponents.join('|');
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  get(key: string): SystemLayout | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.missCount++;
      return null;
    }
    
    // Update access statistics
    entry.lastAccessed = new Date();
    this.hitCount++;
    
    return entry.data;
  }

  set(key: string, result: SystemLayout): void {
    const size = this.estimateMemorySize(result);
    const entry: CacheEntry = {
      data: result,
      timestamp: new Date(),
      lastAccessed: new Date(),
      accessCount: 0,
      size
    };
    
    // Check memory limits before adding
    this.enforceMemoryLimit(size);
    
    this.cache.set(key, entry);
    
    // Enforce entry count limit
    this.enforceEntryLimit();
  }

  clear(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }

  clearForViewMode(viewMode: ViewType): void {
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache) {
      if (key.startsWith(viewMode + '|')) {
        keysToDelete.push(key);
      }
    }
    
    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
  }

  getStatistics(): CacheStatistics {
    const entries = Array.from(this.cache.values());
    const totalRequests = this.hitCount + this.missCount;
    
    return {
      totalEntries: this.cache.size,
      hitRate: totalRequests > 0 ? this.hitCount / totalRequests : 0,
      missRate: totalRequests > 0 ? this.missCount / totalRequests : 0,
      memoryUsage: entries.reduce((total, entry) => total + entry.size, 0),
      oldestEntry: entries.length > 0 
        ? new Date(Math.min(...entries.map(e => e.timestamp.getTime())))
        : null,
      newestEntry: entries.length > 0
        ? new Date(Math.max(...entries.map(e => e.timestamp.getTime())))
        : null
    };
  }

  /**
   * Hash objects for cache key generation
   */
  private hashObjects(objects: readonly unknown[]): string {
    // Simple hash of object count and IDs for cache key
    const ids = objects.map((obj: any) => obj.id).sort();
    return `${objects.length}:${ids.slice(0, 5).join(',')}`;
  }

  /**
   * Hash system context for cache key
   */
  private hashSystemContext(context: any): string {
    return [
      context.totalObjects,
      context.maxOrbitalRadius,
      context.hasMultipleStars,
      context.hasMoons,
      context.systemComplexity
    ].join(',');
  }

  /**
   * Hash configuration for cache key
   */
  private hashConfig(config: any): string {
    // Hash key configuration values that affect calculations
    return [
      config.camera.defaultDistance,
      config.orbital.safetyFactors.minimum,
      config.visual.sizeConstraints.minVisualSize,
      config.visual.sizeConstraints.maxVisualSize
    ].join(',');
  }

  /**
   * Estimate memory size of a SystemLayout object
   */
  private estimateMemorySize(result: SystemLayout): number {
    // Rough estimate: each result entry ~200 bytes + metadata
    const baseSize = 1000; // Base object overhead
    const resultSize = result.results.size * 200;
    const metadataSize = 500;
    
    return baseSize + resultSize + metadataSize;
  }

  /**
   * Enforce memory limit by removing oldest/least accessed entries
   */
  private enforceMemoryLimit(newEntrySize: number): void {
    const maxMemoryBytes = this.maxMemoryMB * 1024 * 1024;
    let currentMemory = Array.from(this.cache.values())
      .reduce((total, entry) => total + entry.size, 0);
    
    // If adding new entry would exceed limit, remove entries
    while (currentMemory + newEntrySize > maxMemoryBytes && this.cache.size > 0) {
      const oldestKey = this.findLeastRecentlyUsedEntry();
      if (oldestKey) {
        const entry = this.cache.get(oldestKey);
        if (entry) {
          currentMemory -= entry.size;
          this.cache.delete(oldestKey);
        }
      } else {
        break; // Safety break
      }
    }
  }

  /**
   * Enforce maximum entry count
   */
  private enforceEntryLimit(): void {
    while (this.cache.size > this.maxEntries) {
      const oldestKey = this.findLeastRecentlyUsedEntry();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      } else {
        break; // Safety break
      }
    }
  }

  /**
   * Find least recently used cache entry
   */
  private findLeastRecentlyUsedEntry(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    
    for (const [key, entry] of this.cache) {
      const accessTime = entry.lastAccessed.getTime();
      if (accessTime < oldestTime) {
        oldestTime = accessTime;
        oldestKey = key;
      }
    }
    
    return oldestKey;
  }

  /**
   * Get cache entry details for debugging
   */
  getCacheEntry(key: string): CacheEntry | null {
    return this.cache.get(key) || null;
  }

  /**
   * Manually evict entries older than specified age
   */
  evictOldEntries(maxAgeMinutes: number): number {
    const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache) {
      if (entry.timestamp < cutoffTime) {
        keysToDelete.push(key);
      }
    }
    
    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
    
    return keysToDelete.length;
  }

  /**
   * Preload cache entries for common scenarios
   */
  async preloadCommonScenarios(
    contexts: CalculationContext[],
    calculator: (context: CalculationContext) => Promise<SystemLayout>
  ): Promise<void> {
    const preloadPromises = contexts.map(async (context) => {
      const key = this.generateKey(context);
      if (!this.has(key)) {
        try {
          const result = await calculator(context);
          this.set(key, result);
        } catch (error) {
          console.warn(`Failed to preload cache for key ${key}:`, error);
        }
      }
    });
    
    await Promise.all(preloadPromises);
  }

  /**
   * Get detailed memory breakdown
   */
  getMemoryBreakdown(): {
    totalMemoryMB: number;
    averageEntrySize: number;
    largestEntrySize: number;
    smallestEntrySize: number;
  } {
    const entries = Array.from(this.cache.values());
    
    if (entries.length === 0) {
      return {
        totalMemoryMB: 0,
        averageEntrySize: 0,
        largestEntrySize: 0,
        smallestEntrySize: 0
      };
    }
    
    const sizes = entries.map(e => e.size);
    const totalMemory = sizes.reduce((sum, size) => sum + size, 0);
    
    return {
      totalMemoryMB: totalMemory / (1024 * 1024),
      averageEntrySize: totalMemory / entries.length,
      largestEntrySize: Math.max(...sizes),
      smallestEntrySize: Math.min(...sizes)
    };
  }
}