/**
 * Navigational View Mode Strategy
 * ===============================
 * 
 * Optimized for navigation with equidistant orbital paths and consistent object sizes.
 * Provides clear, predictable visual layout for easy system navigation.
 * 
 * Key Characteristics:
 * - Fixed object sizes for consistency
 * - Circular orbits for predictable motion
 * - Clean, minimal visual clutter
 * - Quick camera transitions
 * - Optimal for understanding system structure
 * - Consistent sizing regardless of real astronomical properties
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

export class NavigationalStrategy extends BaseViewModeStrategy {
  readonly id: ViewType = 'navigational';
  readonly name = 'Navigational';
  readonly description = 'Optimized for navigation with equidistant orbital paths and consistent object sizes';
  readonly category = 'navigation' as const;
  
  calculateCameraPosition(
    layoutInfo: LayoutInfo,
    systemContext: SystemContext,
    config: RenderingConfiguration
  ): CameraPosition {
    const { focusObject, visualRadius } = layoutInfo;
    const { camera } = config;
    
    // Calculate base distance using consistent multiplier
    const targetDistance = this.calculateBaseCameraDistance(visualRadius, config);
    
    // Get camera position and target
    const focusPosition = new THREE.Vector3();
    focusObject.getWorldPosition(focusPosition);
    
    // Use configured viewing angle for navigational mode (slightly higher for overview)
    const elevationAngle = camera.elevationAngles.navigational;
    const elevationRadians = elevationAngle * (Math.PI / 180);
    
    // Calculate horizontal direction
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
      animationDuration: camera.animationDuration.quick, // Faster transitions for navigation
      easingFunction: config.animation.easingFunctions.quick
    };
  }
  
  determineObjectVisibility(
    object: CelestialObject,
    focusObjectId: string | null,
    systemContext: SystemContext,
    config: RenderingConfiguration
  ): VisibilityConfig {
    const isFocused = object.id === focusObjectId;
    
    // In navigational mode, prioritize clarity and reduce visual clutter
    return {
      showObject: true,
      showLabel: this.shouldShowLabel(object, isFocused, systemContext),
      showOrbit: this.shouldShowOrbit(object, isFocused, systemContext),
      showChildren: true,
      opacity: isFocused ? 1.0 : 0.8, // More distinction between focused and non-focused
      priority: this.calculateNavigationalPriority(object, isFocused, systemContext)
    };
  }
  
  calculateObjectScale(
    object: CelestialObject,
    systemContext: SystemContext,
    config: RenderingConfiguration
  ): ScalingResult {
    const { visual } = config;
    
    // Use fixed sizes for consistent navigation experience
    let visualRadius: number;
    
    switch (object.classification) {
      case 'star':
        visualRadius = visual.fixedSizes.star;
        break;
      case 'planet':
        // Check if it's a gas giant for slightly larger size
        if (this.isGasGiant(object)) {
          visualRadius = visual.fixedSizes.planet * 1.5; // Gas giants are larger
        } else {
          visualRadius = visual.fixedSizes.planet;
        }
        break;
      case 'moon':
        visualRadius = visual.fixedSizes.moon;
        break;
      case 'asteroid':
        visualRadius = visual.fixedSizes.asteroid;
        break;
      case 'belt':
        visualRadius = visual.fixedSizes.belt;
        break;
      default:
        visualRadius = visual.fixedSizes.planet; // Default to planet size
    }
    
    // Apply constraints
    visualRadius = Math.max(visualRadius, visual.sizeConstraints.minVisualSize);
    
    return {
      visualRadius,
      isFixedSize: true,
      scalingMethod: 'fixed',
      relativeScale: 1.0 // Fixed sizes don't have relative scale
    };
  }
  
  getOrbitalBehavior(): OrbitalBehavior {
    return {
      useEccentricity: false,         // Use circular orbits for predictability
      allowVerticalOffset: false,     // Keep everything in same plane for clarity
      animationSpeed: 1.0,            // Normal speed
      useEquidistantSpacing: true,    // Use equidistant spacing for navigation
      enforceCircularOrbits: true     // Perfect circles for clean navigation
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
    
    const warnings: string[] = [...baseResult.warnings];
    
    // Warn about transition from realistic modes
    if (previousMode?.id === 'explorational') {
      warnings.push('Switching from logarithmic to fixed sizing - objects will appear more uniform');
    } else if (previousMode?.id === 'scientific') {
      warnings.push('Switching from scientific accuracy to navigation optimization - sizes and distances are no longer to scale');
    }
    
    return {
      ...baseResult,
      warnings,
      cacheInvalidationRequired: true
    };
  }
  
  validateSystemCompatibility(systemContext: SystemContext): ValidationResult {
    const baseResult = super.validateSystemCompatibility(systemContext);
    
    if (!baseResult.compatible) {
      return baseResult;
    }
    
    const warnings = [...baseResult.warnings];
    
    // Check system complexity for navigation suitability
    if (systemContext.systemComplexity === 'simple') {
      warnings.push('Simple system might be better suited for explorational mode for educational content');
    }
    
    // Navigational mode handles complex systems well
    if (systemContext.systemComplexity === 'complex') {
      warnings.push('Complex system is well-suited for navigational mode - consider this for initial exploration');
    }
    
    return {
      compatible: true,
      warnings,
      errors: [],
      suggestedAlternatives: []
    };
  }
  
  /**
   * Determine if object label should be shown in navigational mode
   */
  private shouldShowLabel(
    object: CelestialObject,
    isFocused: boolean,
    systemContext: SystemContext
  ): boolean {
    // Always show focused object label
    if (isFocused) return true;
    
    // Show primary object labels for navigation
    if (object.classification === 'star' || object.classification === 'planet') {
      return true;
    }
    
    // Show major moons only
    if (object.classification === 'moon') {
      return this.isMajorMoon(object, systemContext);
    }
    
    // Hide asteroid and belt labels to reduce clutter
    return false;
  }
  
  /**
   * Determine if orbit should be shown in navigational mode
   */
  private shouldShowOrbit(
    object: CelestialObject,
    isFocused: boolean,
    systemContext: SystemContext
  ): boolean {
    // Always show focused object orbit
    if (isFocused) return true;
    
    // Show planet and major moon orbits
    if (object.classification === 'planet') return true;
    if (object.classification === 'moon' && this.isMajorMoon(object, systemContext)) {
      return true;
    }
    
    // Hide other orbits to reduce visual clutter
    return false;
  }
  
  /**
   * Calculate priority for navigational purposes
   */
  private calculateNavigationalPriority(
    object: CelestialObject,
    isFocused: boolean,
    systemContext: SystemContext
  ): number {
    let priority = 50; // Base priority
    
    if (isFocused) priority += 50;
    
    // Navigation priority based on object type
    switch (object.classification) {
      case 'star':
        priority += 25; // Stars are navigation landmarks
        break;
      case 'planet':
        priority += 20; // Planets are primary navigation targets
        break;
      case 'moon':
        priority += this.isMajorMoon(object, systemContext) ? 15 : 5;
        break;
      case 'asteroid':
        priority += 2; // Low priority for navigation
        break;
      default:
        priority += 0;
    }
    
    return Math.min(priority, 100);
  }
  
  /**
   * Determine if an object is a gas giant
   */
  private isGasGiant(object: CelestialObject): boolean {
    const radius = object.properties?.radius || 0;
    const earthRadius = 6371000; // meters
    
    // Consider objects larger than 3x Earth radius as gas giants
    return radius > earthRadius * 3;
  }
  
  /**
   * Determine if a moon is major enough to show in navigation mode
   */
  private isMajorMoon(object: CelestialObject, systemContext: SystemContext): boolean {
    if (object.classification !== 'moon') return false;
    
    const earthReference = systemContext.earthReference;
    if (!earthReference) return true; // Show all moons if no Earth reference
    
    const moonRadius = object.properties?.radius || 0;
    const earthRadius = earthReference.properties?.radius || 6371000;
    
    // Show moons that are at least 10% of Earth's radius
    return moonRadius > earthRadius * 0.1;
  }
}