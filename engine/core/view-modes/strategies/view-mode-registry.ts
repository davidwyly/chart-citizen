/**
 * View Mode Registry
 * ==================
 * 
 * Central registry for managing view mode strategies. Provides a clean interface
 * for registering, retrieving, and managing view mode strategies throughout the application.
 * 
 * Key Features:
 * - Singleton pattern for global access
 * - Strategy registration and retrieval
 * - Validation and error handling
 * - Extensible for adding new view modes
 * - Type-safe strategy management
 */

import type { ViewType } from '@lib/types/effects-level';
import type { ViewModeStrategy } from './view-mode-strategy';
import { ExplorationalStrategy } from './explorational-strategy';
import { NavigationalStrategy } from './navigational-strategy';
import { ProfileStrategy } from './profile-strategy';
import { ScientificStrategy } from './scientific-strategy';

/**
 * Registry class for managing view mode strategies
 */
export class ViewModeRegistry {
  private static instance: ViewModeRegistry;
  private strategies: Map<ViewType, ViewModeStrategy> = new Map();
  private defaultStrategy: ViewType = 'explorational';
  
  private constructor() {
    this.registerBuiltInStrategies();
  }
  
  /**
   * Get the singleton instance of the registry
   */
  public static getInstance(): ViewModeRegistry {
    if (!ViewModeRegistry.instance) {
      ViewModeRegistry.instance = new ViewModeRegistry();
    }
    return ViewModeRegistry.instance;
  }
  
  /**
   * Register a view mode strategy
   */
  public registerStrategy(strategy: ViewModeStrategy): void {
    if (this.strategies.has(strategy.id)) {
      console.warn(`ViewModeRegistry: Overriding existing strategy for '${strategy.id}'`);
    }
    
    this.strategies.set(strategy.id, strategy);
    console.log(`ViewModeRegistry: Registered strategy '${strategy.id}' (${strategy.name})`);
  }
  
  /**
   * Get a strategy by view mode ID
   */
  public getStrategy(viewMode: ViewType): ViewModeStrategy {
    const strategy = this.strategies.get(viewMode);
    
    if (!strategy) {
      console.warn(`ViewModeRegistry: Strategy '${viewMode}' not found, falling back to '${this.defaultStrategy}'`);
      const fallbackStrategy = this.strategies.get(this.defaultStrategy);
      
      if (!fallbackStrategy) {
        throw new Error(`ViewModeRegistry: Default strategy '${this.defaultStrategy}' not found`);
      }
      
      return fallbackStrategy;
    }
    
    return strategy;
  }
  
  /**
   * Check if a strategy is registered
   */
  public hasStrategy(viewMode: ViewType): boolean {
    return this.strategies.has(viewMode);
  }
  
  /**
   * Get all registered view mode IDs
   */
  public getRegisteredViewModes(): ViewType[] {
    return Array.from(this.strategies.keys());
  }
  
  /**
   * Get all registered strategies
   */
  public getAllStrategies(): ViewModeStrategy[] {
    return Array.from(this.strategies.values());
  }
  
  /**
   * Get strategies by category
   */
  public getStrategiesByCategory(category: 'educational' | 'navigation' | 'scientific' | 'cinematic'): ViewModeStrategy[] {
    return this.getAllStrategies().filter(strategy => strategy.category === category);
  }
  
  /**
   * Set the default strategy
   */
  public setDefaultStrategy(viewMode: ViewType): void {
    if (!this.hasStrategy(viewMode)) {
      throw new Error(`ViewModeRegistry: Cannot set default to unregistered strategy '${viewMode}'`);
    }
    
    this.defaultStrategy = viewMode;
    console.log(`ViewModeRegistry: Default strategy set to '${viewMode}'`);
  }
  
  /**
   * Get the default strategy
   */
  public getDefaultStrategy(): ViewModeStrategy {
    return this.getStrategy(this.defaultStrategy);
  }
  
  /**
   * Unregister a strategy
   */
  public unregisterStrategy(viewMode: ViewType): boolean {
    if (viewMode === this.defaultStrategy) {
      throw new Error(`ViewModeRegistry: Cannot unregister default strategy '${viewMode}'`);
    }
    
    const removed = this.strategies.delete(viewMode);
    
    if (removed) {
      console.log(`ViewModeRegistry: Unregistered strategy '${viewMode}'`);
    }
    
    return removed;
  }
  
  /**
   * Clear all strategies (except default)
   */
  public clearStrategies(): void {
    const defaultStrategy = this.strategies.get(this.defaultStrategy);
    this.strategies.clear();
    
    if (defaultStrategy) {
      this.strategies.set(this.defaultStrategy, defaultStrategy);
    }
    
    console.log('ViewModeRegistry: Cleared all strategies except default');
  }
  
  /**
   * Validate all registered strategies
   */
  public validateStrategies(): ValidationReport {
    const report: ValidationReport = {
      valid: true,
      errors: [],
      warnings: [],
      strategyCounts: {
        total: this.strategies.size,
        byCategory: {
          educational: 0,
          navigation: 0,
          scientific: 0,
          cinematic: 0
        }
      }
    };
    
    // Count strategies by category
    for (const strategy of this.strategies.values()) {
      report.strategyCounts.byCategory[strategy.category]++;
      
      // Basic validation
      if (!strategy.id || !strategy.name || !strategy.description) {
        report.errors.push(`Strategy '${strategy.id}' missing required properties`);
        report.valid = false;
      }
      
      // Check for proper method implementation
      if (typeof strategy.calculateCameraPosition !== 'function') {
        report.errors.push(`Strategy '${strategy.id}' missing calculateCameraPosition method`);
        report.valid = false;
      }
      
      if (typeof strategy.calculateObjectScale !== 'function') {
        report.errors.push(`Strategy '${strategy.id}' missing calculateObjectScale method`);
        report.valid = false;
      }
      
      if (typeof strategy.determineObjectVisibility !== 'function') {
        report.errors.push(`Strategy '${strategy.id}' missing determineObjectVisibility method`);
        report.valid = false;
      }
    }
    
    // Check for default strategy
    if (!this.hasStrategy(this.defaultStrategy)) {
      report.errors.push(`Default strategy '${this.defaultStrategy}' is not registered`);
      report.valid = false;
    }
    
    // Warnings for missing categories
    if (report.strategyCounts.byCategory.educational === 0) {
      report.warnings.push('No educational strategies registered');
    }
    
    if (report.strategyCounts.byCategory.navigation === 0) {
      report.warnings.push('No navigation strategies registered');
    }
    
    return report;
  }
  
  /**
   * Get registry statistics
   */
  public getStatistics(): RegistryStatistics {
    const strategies = this.getAllStrategies();
    
    return {
      totalStrategies: strategies.length,
      defaultStrategy: this.defaultStrategy,
      categoryCounts: {
        educational: strategies.filter(s => s.category === 'educational').length,
        navigation: strategies.filter(s => s.category === 'navigation').length,
        scientific: strategies.filter(s => s.category === 'scientific').length,
        cinematic: strategies.filter(s => s.category === 'cinematic').length
      },
      registeredIds: this.getRegisteredViewModes()
    };
  }
  
  /**
   * Register all built-in strategies
   */
  private registerBuiltInStrategies(): void {
    // Register all built-in strategies
    this.registerStrategy(new ExplorationalStrategy());
    this.registerStrategy(new NavigationalStrategy());
    this.registerStrategy(new ProfileStrategy());
    this.registerStrategy(new ScientificStrategy());
    
    console.log('ViewModeRegistry: Built-in strategies registered');
  }
}

/**
 * Validation report interface
 */
export interface ValidationReport {
  valid: boolean;
  errors: string[];
  warnings: string[];
  strategyCounts: {
    total: number;
    byCategory: {
      educational: number;
      navigation: number;
      scientific: number;
      cinematic: number;
    };
  };
}

/**
 * Registry statistics interface
 */
export interface RegistryStatistics {
  totalStrategies: number;
  defaultStrategy: ViewType;
  categoryCounts: {
    educational: number;
    navigation: number;
    scientific: number;
    cinematic: number;
  };
  registeredIds: ViewType[];
}

/**
 * Convenience function to get the registry instance
 */
export function getViewModeRegistry(): ViewModeRegistry {
  return ViewModeRegistry.getInstance();
}

/**
 * Convenience function to get a strategy
 */
export function getViewModeStrategy(viewMode: ViewType): ViewModeStrategy {
  return ViewModeRegistry.getInstance().getStrategy(viewMode);
}

/**
 * Convenience function to register a custom strategy
 */
export function registerViewModeStrategy(strategy: ViewModeStrategy): void {
  ViewModeRegistry.getInstance().registerStrategy(strategy);
}