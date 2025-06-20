/**
 * Scientific View Mode Strategy
 * =============================
 * 
 * True-to-life astronomical scales and properties for scientific accuracy.
 * Maintains actual proportions and distances as much as possible while
 * remaining usable for exploration and study.
 * 
 * Key Characteristics:
 * - True proportional scaling from astronomical data
 * - Minimal safety buffers for maximum accuracy
 * - Large size ranges to accommodate real astronomical proportions
 * - Extended zoom ranges for extreme scales
 * - Preserves actual astronomical distances (scaled)
 * - Scientific rigor over visual comfort
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
import { AstronomicalScalingService } from '../../../services/astronomical-scaling/astronomical-scaling-service';

export class ScientificStrategy extends BaseViewModeStrategy {
  readonly id: ViewType = 'scientific';
  readonly name = 'Scientific';
  readonly description = 'True-to-life astronomical scales and properties for scientific accuracy';
  readonly category = 'scientific' as const;
  
  calculateCameraPosition(
    layoutInfo: LayoutInfo,
    systemContext: SystemContext,
    config: RenderingConfiguration
  ): CameraPosition {
    const { focusObject, visualRadius } = layoutInfo;
    const { camera } = config;
    
    // Scientific mode may have extreme size ranges, so use extended distance calculation
    const targetDistance = this.calculateScientificCameraDistance(visualRadius, systemContext, config);
    
    // Get camera position and target
    const focusPosition = new THREE.Vector3();
    focusObject.getWorldPosition(focusPosition);
    
    // Use lower elevation angle for better scale appreciation
    const elevationAngle = camera.elevationAngles.scientific;
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
      animationDuration: camera.animationDuration.extended, // Longer for deliberate scientific observation
      easingFunction: config.animation.easingFunctions.smooth
    };
  }
  
  determineObjectVisibility(
    object: CelestialObject,
    focusObjectId: string | null,
    systemContext: SystemContext,
    config: RenderingConfiguration
  ): VisibilityConfig {
    const isFocused = object.id === focusObjectId;
    
    // Scientific mode shows all objects for completeness
    return {
      showObject: true,
      showLabel: this.shouldShowScientificLabel(object, isFocused, systemContext),
      showOrbit: true, // All orbits for scientific accuracy
      showChildren: true,
      opacity: isFocused ? 1.0 : 0.85, // Slight dimming for focus
      priority: this.calculateScientificPriority(object, isFocused, systemContext)
    };
  }
  
  calculateObjectScale(
    object: CelestialObject,
    systemContext: SystemContext,
    config: RenderingConfiguration
  ): ScalingResult {
    // Create scaling service with optimal configuration for this system
    const scalingConfig = AstronomicalScalingService.getOptimalConfiguration([object]);
    const astronomicalService = new AstronomicalScalingService(scalingConfig);
    
    // Use real astronomical data for scaling
    const scaleResult = astronomicalService.calculateObjectSize(object, systemContext.earthReference);
    
    console.log(`🔬 SCIENTIFIC SCALING: ${object.name}`);
    console.log(`   📏 Real radius: ${scaleResult.realRadiusKm.toFixed(1)} km`);
    console.log(`   📐 Visual radius: ${scaleResult.visualRadius.toFixed(3)} units`);
    console.log(`   🌍 Relative to Earth: ${scaleResult.relativeToEarth.toFixed(2)}x`);
    console.log(`   ⚖️ Method: ${scaleResult.scalingMethod}`);
    console.log(`   ✅ To scale: ${scaleResult.isToScale}`);
    
    return {
      visualRadius: scaleResult.visualRadius,
      isFixedSize: false,
      scalingMethod: 'scientific',
      relativeScale: scaleResult.relativeToEarth
    };
  }
  
  getOrbitalBehavior(): OrbitalBehavior {
    return {
      useEccentricity: true,          // Use real orbital eccentricity
      allowVerticalOffset: true,      // Use real orbital inclinations
      animationSpeed: 1.0,            // Real-time speed (scaled)
      useEquidistantSpacing: false,   // Use real astronomical distances
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
    
    const warnings = [...baseResult.warnings];
    
    // Warn about extreme scales
    warnings.push('Scientific mode uses true astronomical proportions - objects may appear very large or very small');
    warnings.push('Camera zoom range is extended to accommodate extreme scales');
    
    // Warn about transition from other modes
    if (previousMode?.id === 'navigational' || previousMode?.id === 'profile') {
      warnings.push('Switching from fixed sizes to scientific proportions - size relationships will change dramatically');
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
    const errors = [...baseResult.errors];
    
    // Check for Earth reference for proper scaling
    if (!systemContext.earthReference) {
      warnings.push('No Earth reference found - scientific scaling may not be accurate');
    }
    
    // Warn about potential scale issues
    if (systemContext.hasMultipleStars) {
      warnings.push('Multiple star systems may have extreme size ranges in scientific mode');
    }
    
    // Check for extreme complexity
    if (systemContext.systemComplexity === 'complex') {
      warnings.push('Complex systems in scientific mode may have objects that are too small to see or too large to navigate around');
    }
    
    return {
      compatible: true,
      warnings,
      errors,
      suggestedAlternatives: warnings.length > 2 ? ['explorational'] : []
    };
  }
  
  /**
   * Calculate camera distance with extended range for scientific mode
   */
  private calculateScientificCameraDistance(
    visualRadius: number,
    systemContext: SystemContext,
    config: RenderingConfiguration
  ): number {
    const { camera } = config;
    
    // Use base calculation but with extended ranges
    let targetDistance = this.calculateBaseCameraDistance(visualRadius, config);
    
    // For very large objects (like scientifically accurate stars), extend the distance
    if (visualRadius > 5.0) {
      targetDistance *= Math.log(visualRadius + 1);
    }
    
    // For very small objects, ensure minimum useful distance
    if (visualRadius < 0.1) {
      targetDistance = Math.max(targetDistance, 1.0);
    }
    
    return targetDistance;
  }
  
  /**
   * Determine if a label should be shown in scientific mode
   */
  private shouldShowScientificLabel(
    object: CelestialObject,
    isFocused: boolean,
    systemContext: SystemContext
  ): boolean {
    // Show all labels in scientific mode for completeness
    return true;
  }
  
  /**
   * Calculate priority for scientific accuracy
   */
  private calculateScientificPriority(
    object: CelestialObject,
    isFocused: boolean,
    systemContext: SystemContext
  ): number {
    let priority = 60; // Higher base priority for scientific importance
    
    if (isFocused) priority += 40;
    
    // Scientific priority based on object type and importance
    switch (object.classification) {
      case 'star':
        priority += 30; // Stars are central to understanding
        break;
      case 'planet':
        priority += 25; // Planets are primary subjects
        break;
      case 'moon':
        priority += 15; // Moons are important for scale understanding
        break;
      case 'asteroid':
        priority += 10; // Asteroids provide scale context
        break;
      default:
        priority += 5;
    }
    
    // Boost priority for scientifically interesting objects
    if (object.id === systemContext.earthReference?.id) {
      priority += 20; // Earth is our reference point
    }
    
    return Math.min(priority, 100);
  }
  
  /**
   * Apply safe star scaling to prevent collisions with inner planets
   */
  private applySafeStarScaling(
    currentStarSize: number,
    systemContext: SystemContext,
    config: RenderingConfiguration
  ): number {
    // This would integrate with the safe scaling calculator
    // For now, apply a simple constraint
    const maxSafeStar = config.visual.sizeConstraints.maxVisualSize * 0.8;
    return Math.min(currentStarSize, maxSafeStar);
  }
  
  /**
   * Fallback scaling when Earth reference is not available
   */
  private calculateFallbackScientificScale(
    object: CelestialObject,
    config: RenderingConfiguration
  ): ScalingResult {
    const { visual } = config;
    
    // Use proportional sizes based on classification
    let visualRadius: number;
    
    switch (object.classification) {
      case 'star':
        visualRadius = visual.fixedSizes.star * 3; // Larger for scientific accuracy
        break;
      case 'planet':
        visualRadius = visual.fixedSizes.planet * 1.5;
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
    visualRadius = Math.min(visualRadius, visual.sizeConstraints.maxVisualSize);
    
    return {
      visualRadius,
      isFixedSize: true, // Using fixed fallback
      scalingMethod: 'proportional',
      relativeScale: 1.0
    };
  }
}