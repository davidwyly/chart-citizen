/**
 * View Mode Strategy Pattern
 * ==========================
 * 
 * This file defines the strategy pattern interfaces for view mode behaviors.
 * Each view mode implements this interface to provide specific behaviors for:
 * - Camera positioning and animation
 * - Object visibility determination
 * - Visual scaling calculations
 * - Orbital behavior configuration
 * 
 * Benefits:
 * - Eliminates switch statements throughout the codebase
 * - Makes adding new view modes trivial (Open/Closed Principle)
 * - Enables testing of view mode behaviors in isolation
 * - Provides consistent interface across all view modes
 * - Allows runtime view mode switching without code changes
 */

import type { ViewType } from '@lib/types/effects-level';
import type { CelestialObject } from '@/engine/types/orbital-system';
import type { RenderingConfiguration } from '../configuration/rendering-configuration';
import * as THREE from 'three';

/**
 * System context provides information about the entire system
 * needed for making view mode decisions
 */
export interface SystemContext {
  readonly earthReference?: CelestialObject;
  readonly totalObjects: number;
  readonly maxOrbitalRadius: number;
  readonly minOrbitalRadius: number;
  readonly hasMultipleStars: boolean;
  readonly hasMoons: boolean;
  readonly systemComplexity: 'simple' | 'moderate' | 'complex';
}

/**
 * Layout information provides spatial context for camera positioning
 */
export interface LayoutInfo {
  readonly focusObject: THREE.Object3D;
  readonly focusObjectId: string;
  readonly focusObjectName: string;
  readonly visualRadius: number;
  readonly orbitRadius?: number;
  readonly parentObject?: THREE.Object3D;
  readonly childObjects: THREE.Object3D[];
  readonly siblingObjects: THREE.Object3D[];
  readonly systemBounds: {
    readonly min: THREE.Vector3;
    readonly max: THREE.Vector3;
    readonly center: THREE.Vector3;
  };
}

/**
 * Camera position result from strategy calculations
 */
export interface CameraPosition {
  readonly position: THREE.Vector3;
  readonly target: THREE.Vector3;
  readonly distance: number;
  readonly elevation: number; // in degrees
  readonly animationDuration: number;
  readonly easingFunction: string;
}

/**
 * Orbital behavior configuration for view modes
 */
export interface OrbitalBehavior {
  readonly useEccentricity: boolean;
  readonly allowVerticalOffset: boolean;
  readonly animationSpeed: number;
  readonly useEquidistantSpacing: boolean;
  readonly enforceCircularOrbits: boolean;
}

/**
 * Object visibility configuration
 */
export interface VisibilityConfig {
  readonly showObject: boolean;
  readonly showLabel: boolean;
  readonly showOrbit: boolean;
  readonly showChildren: boolean;
  readonly opacity: number;
  readonly priority: number; // Higher priority objects are more likely to be shown
}

/**
 * Visual scaling result from strategy calculations
 */
export interface ScalingResult {
  readonly visualRadius: number;
  readonly isFixedSize: boolean;
  readonly scalingMethod: 'logarithmic' | 'proportional' | 'fixed' | 'scientific';
  readonly relativeScale: number; // Scale relative to Earth (1.0 = Earth size)
}

/**
 * Main strategy interface that all view modes must implement
 */
export interface ViewModeStrategy {
  readonly id: ViewType;
  readonly name: string;
  readonly description: string;
  readonly category: 'educational' | 'navigation' | 'scientific' | 'cinematic';
  
  /**
   * Calculate optimal camera position for the given focus object and layout
   */
  calculateCameraPosition(
    layoutInfo: LayoutInfo,
    systemContext: SystemContext,
    config: RenderingConfiguration
  ): CameraPosition;
  
  /**
   * Determine whether an object should be visible in this view mode
   */
  determineObjectVisibility(
    object: CelestialObject,
    focusObjectId: string | null,
    systemContext: SystemContext,
    config: RenderingConfiguration
  ): VisibilityConfig;
  
  /**
   * Calculate visual scale for an object in this view mode
   */
  calculateObjectScale(
    object: CelestialObject,
    systemContext: SystemContext,
    config: RenderingConfiguration
  ): ScalingResult;
  
  /**
   * Get orbital behavior configuration for this view mode
   */
  getOrbitalBehavior(): OrbitalBehavior;
  
  /**
   * Determine if orbits should be animated in this view mode
   */
  shouldAnimateOrbits(isPaused: boolean): boolean;
  
  /**
   * Handle view mode switching logic
   */
  onViewModeEnter(
    previousMode: ViewModeStrategy | null,
    systemContext: SystemContext,
    config: RenderingConfiguration
  ): ViewModeTransitionResult;
  
  /**
   * Handle view mode exit logic
   */
  onViewModeExit(
    nextMode: ViewModeStrategy,
    systemContext: SystemContext,
    config: RenderingConfiguration
  ): ViewModeTransitionResult;
  
  /**
   * Validate that this view mode can handle the given system
   */
  validateSystemCompatibility(systemContext: SystemContext): ValidationResult;
}

/**
 * Result of view mode transition operations
 */
export interface ViewModeTransitionResult {
  readonly success: boolean;
  readonly warnings: string[];
  readonly errors: string[];
  readonly cameraResetRequired: boolean;
  readonly cacheInvalidationRequired: boolean;
}

/**
 * Result of system compatibility validation
 */
export interface ValidationResult {
  readonly compatible: boolean;
  readonly warnings: string[];
  readonly errors: string[];
  readonly suggestedAlternatives: ViewType[];
}

/**
 * Abstract base class providing common functionality for view mode strategies
 */
export abstract class BaseViewModeStrategy implements ViewModeStrategy {
  abstract readonly id: ViewType;
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly category: 'educational' | 'navigation' | 'scientific' | 'cinematic';
  
  /**
   * Common camera distance calculation used by most view modes
   */
  protected calculateBaseCameraDistance(
    visualRadius: number,
    config: RenderingConfiguration
  ): number {
    const { distanceMultipliers, absoluteLimits } = config.camera;
    
    const optimalDistance = visualRadius * distanceMultipliers.consistent;
    const minDistance = visualRadius * distanceMultipliers.minimum;
    const maxDistance = visualRadius * distanceMultipliers.maximum;
    
    // Apply absolute constraints while maintaining consistent framing
    return Math.max(
      Math.min(
        Math.max(optimalDistance, absoluteLimits.minDistance),
        absoluteLimits.maxDistance
      ),
      Math.max(minDistance, visualRadius * absoluteLimits.safetyMargin)
    );
  }
  
  /**
   * Common horizontal direction calculation for camera positioning
   */
  protected calculateHorizontalDirection(
    cameraPosition: THREE.Vector3,
    targetPosition: THREE.Vector3,
    config: RenderingConfiguration
  ): THREE.Vector3 {
    const horizontalDirection = new THREE.Vector3();
    const currentDirection = cameraPosition.clone().sub(targetPosition);
    
    // Project current direction onto horizontal plane (remove Y component)
    horizontalDirection.set(currentDirection.x, 0, currentDirection.z);
    
    // If the horizontal direction is too small, use a default
    if (horizontalDirection.length() < config.camera.detectionThresholds.minHorizontalDirection) {
      horizontalDirection.set(1, 0, 0);
    }
    
    return horizontalDirection.normalize();
  }
  
  /**
   * Common validation for basic system requirements
   */
  protected validateBasicSystemRequirements(systemContext: SystemContext): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];
    
    if (systemContext.totalObjects === 0) {
      errors.push('System contains no objects');
    }
    
    if (systemContext.totalObjects > 1000) {
      warnings.push('Large system may impact performance');
    }
    
    return {
      compatible: errors.length === 0,
      warnings,
      errors,
      suggestedAlternatives: []
    };
  }
  
  /**
   * Common view mode transition handling
   */
  protected handleBasicTransition(
    isEntering: boolean,
    systemContext: SystemContext
  ): ViewModeTransitionResult {
    return {
      success: true,
      warnings: [],
      errors: [],
      cameraResetRequired: isEntering,
      cacheInvalidationRequired: isEntering
    };
  }
  
  // Default implementations that can be overridden
  
  shouldAnimateOrbits(isPaused: boolean): boolean {
    return !isPaused;
  }
  
  onViewModeEnter(
    previousMode: ViewModeStrategy | null,
    systemContext: SystemContext,
    config: RenderingConfiguration
  ): ViewModeTransitionResult {
    return this.handleBasicTransition(true, systemContext);
  }
  
  onViewModeExit(
    nextMode: ViewModeStrategy,
    systemContext: SystemContext,
    config: RenderingConfiguration
  ): ViewModeTransitionResult {
    return this.handleBasicTransition(false, systemContext);
  }
  
  validateSystemCompatibility(systemContext: SystemContext): ValidationResult {
    return this.validateBasicSystemRequirements(systemContext);
  }
  
  // Abstract methods that must be implemented by each strategy
  abstract calculateCameraPosition(
    layoutInfo: LayoutInfo,
    systemContext: SystemContext,
    config: RenderingConfiguration
  ): CameraPosition;
  
  abstract determineObjectVisibility(
    object: CelestialObject,
    focusObjectId: string | null,
    systemContext: SystemContext,
    config: RenderingConfiguration
  ): VisibilityConfig;
  
  abstract calculateObjectScale(
    object: CelestialObject,
    systemContext: SystemContext,
    config: RenderingConfiguration
  ): ScalingResult;
  
  abstract getOrbitalBehavior(): OrbitalBehavior;
}

/**
 * Utility functions for working with view mode strategies
 */
export class ViewModeStrategyUtils {
  /**
   * Calculate system complexity based on context
   */
  static calculateSystemComplexity(systemContext: SystemContext): 'simple' | 'moderate' | 'complex' {
    if (systemContext.totalObjects <= 5 && !systemContext.hasMultipleStars) {
      return 'simple';
    }
    
    if (systemContext.totalObjects <= 20 && !systemContext.hasMultipleStars) {
      return 'moderate';
    }
    
    return 'complex';
  }
  
  /**
   * Find Earth reference object in a system
   */
  static findEarthReference(objects: CelestialObject[]): CelestialObject | undefined {
    return objects.find(obj => 
      obj.name?.toLowerCase() === 'earth' || 
      obj.id?.toLowerCase() === 'earth'
    );
  }
  
  /**
   * Calculate system bounds from object positions
   */
  static calculateSystemBounds(objects: THREE.Object3D[]): {
    min: THREE.Vector3;
    max: THREE.Vector3;
    center: THREE.Vector3;
  } {
    if (objects.length === 0) {
      const zero = new THREE.Vector3(0, 0, 0);
      return { min: zero.clone(), max: zero.clone(), center: zero.clone() };
    }
    
    const min = new THREE.Vector3(Infinity, Infinity, Infinity);
    const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
    
    for (const obj of objects) {
      const worldPos = new THREE.Vector3();
      obj.getWorldPosition(worldPos);
      
      min.min(worldPos);
      max.max(worldPos);
    }
    
    const center = new THREE.Vector3().addVectors(min, max).multiplyScalar(0.5);
    
    return { min, max, center };
  }
  
  /**
   * Create system context from celestial objects and Three.js objects
   */
  static createSystemContext(
    celestialObjects: CelestialObject[],
    threeObjects: THREE.Object3D[]
  ): SystemContext {
    const earthReference = ViewModeStrategyUtils.findEarthReference(celestialObjects);
    const hasMultipleStars = celestialObjects.filter(obj => obj.classification === 'star').length > 1;
    const hasMoons = celestialObjects.some(obj => obj.classification === 'moon');
    
    // Calculate orbital radius range
    let maxOrbitalRadius = 0;
    let minOrbitalRadius = Infinity;
    
    for (const obj of threeObjects) {
      if (obj.userData.orbitRadius) {
        maxOrbitalRadius = Math.max(maxOrbitalRadius, obj.userData.orbitRadius);
        minOrbitalRadius = Math.min(minOrbitalRadius, obj.userData.orbitRadius);
      }
    }
    
    if (minOrbitalRadius === Infinity) minOrbitalRadius = 0;
    
    const systemComplexity = ViewModeStrategyUtils.calculateSystemComplexity({
      earthReference,
      totalObjects: celestialObjects.length,
      maxOrbitalRadius,
      minOrbitalRadius,
      hasMultipleStars,
      hasMoons,
      systemComplexity: 'simple' // Will be calculated
    });
    
    return {
      earthReference,
      totalObjects: celestialObjects.length,
      maxOrbitalRadius,
      minOrbitalRadius,
      hasMultipleStars,
      hasMoons,
      systemComplexity
    };
  }
}