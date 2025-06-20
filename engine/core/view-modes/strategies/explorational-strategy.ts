/**
 * Explorational View Mode Strategy
 * ================================
 * 
 * Educational content with real astronomical data, optimized for exploration and learning.
 * Uses logarithmic scaling with proportional parent-child relationships.
 * 
 * Key Characteristics:
 * - Logarithmic visual scaling based on Earth reference
 * - All objects visible for educational purposes
 * - Elliptical orbits with proper eccentricity
 * - Realistic orbital motion and timing
 * - Comfortable viewing distances for exploration
 * - Detailed labels and scientific information
 */

import * as THREE from 'three';
import {
  ViewModeStrategy,
  BaseViewModeStrategy,
  SystemContext,
  LayoutInfo,
  CameraPosition,
  VisibilityConfig,
  ScalingResult,
  OrbitalBehavior,
  ViewModeTransitionResult,
  ValidationResult
} from './view-mode-strategy';
import type { ViewType } from '@lib/types/effects-level';
import type { CelestialObject } from '@/engine/types/orbital-system';
import type { RenderingConfiguration } from '../../configuration/rendering-configuration';

export class ExplorationalStrategy extends BaseViewModeStrategy {
  readonly id: ViewType = 'explorational';
  readonly name = 'Explorational';
  readonly description = 'Educational content with real astronomical data, optimized for exploration and learning';
  readonly category = 'educational' as const;
  
  calculateCameraPosition(
    layoutInfo: LayoutInfo,
    systemContext: SystemContext,
    config: RenderingConfiguration
  ): CameraPosition {
    const { focusObject, visualRadius, systemBounds } = layoutInfo;
    const { camera } = config;
    
    // Calculate base distance using consistent multiplier
    const targetDistance = this.calculateBaseCameraDistance(visualRadius, config);
    
    // Get camera position and target
    const focusPosition = new THREE.Vector3();
    focusObject.getWorldPosition(focusPosition);
    
    // Use configured viewing angle for explorational mode
    const elevationAngle = camera.elevationAngles.explorational;
    const elevationRadians = elevationAngle * (Math.PI / 180);
    
    // Calculate horizontal direction (prefer current camera direction if available)
    const currentCameraPos = new THREE.Vector3(focusPosition.x + targetDistance, focusPosition.y, focusPosition.z);
    const horizontalDirection = this.calculateHorizontalDirection(
      currentCameraPos,
      focusPosition,
      config
    );
    
    // Calculate final camera position
    const horizontalDistance = targetDistance * Math.cos(elevationRadians);
    const verticalDistance = targetDistance * Math.sin(elevationRadians);
    
    const cameraPosition = focusPosition
      .clone()
      .add(horizontalDirection.multiplyScalar(horizontalDistance))
      .add(new THREE.Vector3(0, verticalDistance, 0));
    
    return {
      position: cameraPosition,
      target: focusPosition.clone(),
      distance: targetDistance,
      elevation: elevationAngle,
      animationDuration: camera.animationDuration.standard,
      easingFunction: config.animation.easingFunctions.leap
    };
  }
  
  determineObjectVisibility(
    object: CelestialObject,
    focusObjectId: string | null,
    systemContext: SystemContext,
    config: RenderingConfiguration
  ): VisibilityConfig {
    // In explorational mode, all objects are visible for educational purposes
    const isFocused = object.id === focusObjectId;
    
    return {
      showObject: true,
      showLabel: true,
      showOrbit: true,
      showChildren: true,
      opacity: isFocused ? 1.0 : 0.9, // Slightly dim non-focused objects
      priority: this.calculateObjectPriority(object, isFocused, systemContext)
    };
  }
  
  calculateObjectScale(
    object: CelestialObject,
    systemContext: SystemContext,
    config: RenderingConfiguration
  ): ScalingResult {
    const { visual } = config;
    
    // Use Earth as reference for logarithmic scaling
    const earthReference = systemContext.earthReference;
    if (!earthReference) {
      // Fallback to proportional scaling if no Earth reference
      return this.calculateFallbackScale(object, visual.sizeConstraints.maxVisualSize, config);
    }
    
    // Get object radius (in meters)
    const objectRadius = object.properties?.radius || 0;
    const earthRadius = earthReference.properties?.radius || visual.sizeConstraints.earthReferenceRadius;
    
    if (objectRadius <= 0 || earthRadius <= 0) {
      return this.calculateFallbackScale(object, visual.sizeConstraints.maxVisualSize, config);
    }
    
    // Calculate logarithmic scaling
    const radiusRatio = objectRadius / earthRadius;
    const logScale = Math.log(radiusRatio + 1) / Math.log(visual.scalingFactors.logarithmicBase);
    
    // Apply scaling with Earth as 1.0 unit reference
    let visualRadius = Math.abs(logScale) * visual.scalingFactors.proportionalityConstant;
    
    // Apply view mode constraints
    visualRadius = Math.max(visualRadius, visual.sizeConstraints.minVisualSize);
    visualRadius = Math.min(visualRadius, visual.sizeConstraints.maxVisualSize);
    
    return {
      visualRadius,
      isFixedSize: false,
      scalingMethod: 'logarithmic',
      relativeScale: radiusRatio
    };
  }
  
  getOrbitalBehavior(): OrbitalBehavior {
    return {
      useEccentricity: true,          // Use realistic elliptical orbits
      allowVerticalOffset: true,      // Allow inclination for realism
      animationSpeed: 1.0,            // Normal speed
      useEquidistantSpacing: false,   // Use real astronomical distances (scaled)
      enforceCircularOrbits: false    // Allow elliptical orbits
    };
  }
  
  shouldAnimateOrbits(isPaused: boolean): boolean {
    return !isPaused; // Animate unless explicitly paused
  }
  
  onViewModeEnter(
    previousMode: ViewModeStrategy | null,
    systemContext: SystemContext,
    config: RenderingConfiguration
  ): ViewModeTransitionResult {
    const baseResult = super.onViewModeEnter(previousMode, systemContext, config);
    
    // Check if coming from a fixed-size mode (navigational/profile)
    const comingFromFixedSize = previousMode?.id === 'navigational' || previousMode?.id === 'profile';
    
    return {
      ...baseResult,
      warnings: comingFromFixedSize 
        ? ['Switching from fixed sizes to logarithmic scaling - object sizes will change significantly']
        : [],
      cacheInvalidationRequired: true // Always invalidate cache when entering explorational
    };
  }
  
  validateSystemCompatibility(systemContext: SystemContext): ValidationResult {
    const baseResult = super.validateSystemCompatibility(systemContext);
    
    if (!baseResult.compatible) {
      return baseResult;
    }
    
    const warnings = [...baseResult.warnings];
    const errors = [...baseResult.errors];
    
    // Check for Earth reference for proper scaling
    if (!systemContext.earthReference) {
      warnings.push('No Earth reference found - using fallback scaling which may not be optimal for education');
    }
    
    // Warn about very complex systems
    if (systemContext.systemComplexity === 'complex') {
      warnings.push('Complex system may be overwhelming for educational exploration - consider using navigational mode first');
    }
    
    return {
      compatible: true,
      warnings,
      errors,
      suggestedAlternatives: []
    };
  }
  
  /**
   * Calculate object priority for visibility and labeling
   */
  private calculateObjectPriority(
    object: CelestialObject,
    isFocused: boolean,
    systemContext: SystemContext
  ): number {
    let priority = 50; // Base priority
    
    if (isFocused) priority += 50;
    
    // Educational priority based on object type
    switch (object.classification) {
      case 'star':
        priority += 30; // Stars are educationally important
        break;
      case 'planet':
        priority += 20; // Planets are primary subjects
        break;
      case 'moon':
        priority += 10; // Moons are secondary but important
        break;
      case 'asteroid':
        priority += 5; // Asteroids are tertiary
        break;
      default:
        priority += 0;
    }
    
    // Boost priority for Earth as educational reference
    if (object.id === systemContext.earthReference?.id) {
      priority += 25;
    }
    
    return Math.min(priority, 100);
  }
  
  /**
   * Fallback scaling when Earth reference is not available
   */
  private calculateFallbackScale(
    object: CelestialObject,
    maxSize: number,
    config: RenderingConfiguration
  ): ScalingResult {
    const { visual } = config;
    
    // Use fixed sizes as fallback, scaled down for explorational mode
    let visualRadius: number;
    
    switch (object.classification) {
      case 'star':
        visualRadius = visual.fixedSizes.star * 1.2; // Slightly larger for explorational
        break;
      case 'planet':
        visualRadius = visual.fixedSizes.planet;
        break;
      case 'moon':
        visualRadius = visual.fixedSizes.moon;
        break;
      case 'asteroid':
        visualRadius = visual.fixedSizes.asteroid;
        break;
      default:
        visualRadius = 1.0;
    }
    
    // Apply constraints
    visualRadius = Math.max(visualRadius, visual.sizeConstraints.minVisualSize);
    visualRadius = Math.min(visualRadius, maxSize);
    
    return {
      visualRadius,
      isFixedSize: true, // Using fixed fallback
      scalingMethod: 'proportional',
      relativeScale: 1.0
    };
  }
}