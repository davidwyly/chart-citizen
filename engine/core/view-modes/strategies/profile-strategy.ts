/**
 * Profile View Mode Strategy
 * ==========================
 * 
 * Top-down diagrammatic view with orthographic projection for orbital relationships.
 * Optimized for understanding orbital structure and relationships at a glance.
 * 
 * Key Characteristics:
 * - Top-down orthographic view
 * - Compact layout with minimal spacing
 * - Fixed small sizes for diagrammatic clarity
 * - Static positioning when paused
 * - Focus on orbital relationships over realism
 * - Clean, schematic representation
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

export class ProfileStrategy extends BaseViewModeStrategy {
  readonly id: ViewType = 'profile';
  readonly name = 'Profile';
  readonly description = 'Top-down diagrammatic view with orthographic projection for orbital relationships';
  readonly category = 'educational' as const;
  
  calculateCameraPosition(
    layoutInfo: LayoutInfo,
    systemContext: SystemContext,
    config: RenderingConfiguration
  ): CameraPosition {
    const { focusObject, childObjects, systemBounds } = layoutInfo;
    const { camera } = config;
    
    // Profile view uses special layout calculation
    const profileLayout = this.calculateProfileLayout(
      focusObject,
      childObjects,
      systemBounds,
      config
    );
    
    return {
      position: profileLayout.cameraPosition,
      target: profileLayout.target,
      distance: profileLayout.distance,
      elevation: camera.elevationAngles.profile,
      animationDuration: camera.animationDuration.standard,
      easingFunction: config.animation.easingFunctions.smooth
    };
  }
  
  determineObjectVisibility(
    object: CelestialObject,
    focusObjectId: string | null,
    systemContext: SystemContext,
    _config: RenderingConfiguration
  ): VisibilityConfig {
    const isFocused = object.id === focusObjectId;
    const isRelevantToFocus = this.isRelevantToFocusedObject(object, focusObjectId, systemContext);
    
    return {
      showObject: isFocused || isRelevantToFocus,
      showLabel: isFocused || (isRelevantToFocus && this.shouldShowProfileLabel(object)),
      showOrbit: isFocused || isRelevantToFocus,
      showChildren: isFocused,
      opacity: isFocused ? 1.0 : 0.7,
      priority: this.calculateProfilePriority(object, isFocused, isRelevantToFocus)
    };
  }
  
  calculateObjectScale(
    object: CelestialObject,
    systemContext: SystemContext,
    config: RenderingConfiguration
  ): ScalingResult {
    const { visual } = config;
    
    // Use very small fixed sizes for diagrammatic clarity
    let visualRadius: number;
    
    switch (object.classification) {
      case 'star':
        visualRadius = visual.sizeConstraints.minVisualSize * 5; // Slightly larger for visibility
        break;
      case 'planet':
        visualRadius = visual.sizeConstraints.minVisualSize * 3;
        break;
      case 'moon':
        visualRadius = visual.sizeConstraints.minVisualSize * 2;
        break;
      case 'asteroid':
        visualRadius = visual.sizeConstraints.minVisualSize * 1.5;
        break;
      case 'belt':
        visualRadius = visual.sizeConstraints.minVisualSize * 2;
        break;
      default:
        visualRadius = visual.sizeConstraints.minVisualSize * 2;
    }
    
    // Ensure minimum visibility
    visualRadius = Math.max(visualRadius, visual.sizeConstraints.minVisualSize);
    
    return {
      visualRadius,
      isFixedSize: true,
      scalingMethod: 'fixed',
      relativeScale: 1.0
    };
  }
  
  getOrbitalBehavior(): OrbitalBehavior {
    return {
      useEccentricity: false,         // Perfect circles for clean diagram
      allowVerticalOffset: false,     // Everything in same plane
      animationSpeed: 0.5,            // Slower for contemplation
      useEquidistantSpacing: true,    // Equidistant for diagram clarity
      enforceCircularOrbits: true     // Perfect circles
    };
  }
  
  shouldAnimateOrbits(isPaused: boolean): boolean {
    // In profile mode, often static positioning is preferred when paused
    return !isPaused;
  }
  
  onViewModeEnter(
    previousMode: ViewModeStrategy | null,
    systemContext: SystemContext,
    config: RenderingConfiguration
  ): ViewModeTransitionResult {
    const baseResult = super.onViewModeEnter(previousMode, systemContext, config);
    
    return {
      ...baseResult,
      warnings: [
        'Profile mode shows a top-down diagrammatic view - objects may appear much smaller',
        'Only objects related to the focused object are visible in this mode'
      ],
      cacheInvalidationRequired: true,
      cameraResetRequired: true // Profile mode requires specific camera setup
    };
  }
  
  validateSystemCompatibility(systemContext: SystemContext): ValidationResult {
    const baseResult = super.validateSystemCompatibility(systemContext);
    
    if (!baseResult.compatible) {
      return baseResult;
    }
    
    const warnings = [...baseResult.warnings];
    const errors = [...baseResult.errors];
    
    // Profile mode works best with hierarchical systems
    if (systemContext.totalObjects < 3) {
      warnings.push('Profile mode is most useful for systems with multiple objects and orbital relationships');
    }
    
    // Very complex systems might be cluttered in profile view
    if (systemContext.totalObjects > 50) {
      warnings.push('Large system may appear cluttered in profile view - consider focusing on specific subsystems');
    }
    
    return {
      compatible: true,
      warnings,
      errors,
      suggestedAlternatives: systemContext.totalObjects < 3 ? ['explorational', 'navigational'] : []
    };
  }
  
  /**
   * Calculate profile-specific layout for camera positioning
   */
  private calculateProfileLayout(
    focusObject: THREE.Object3D,
    childObjects: THREE.Object3D[],
    systemBounds: { min: THREE.Vector3; max: THREE.Vector3; center: THREE.Vector3 },
    config: RenderingConfiguration
  ): { cameraPosition: THREE.Vector3; target: THREE.Vector3; distance: number } {
    const { camera } = config;
    
    // Get focal object position
    const focalCenter = new THREE.Vector3();
    focusObject.getWorldPosition(focalCenter);
    
    let layoutMidpoint: THREE.Vector3;
    let layoutSpan: number;
    
    if (childObjects.length === 0) {
      // Single object: create fake layout for consistent framing
      const visualSize = focusObject.scale?.x || 1.0;
      const fakeOffset = visualSize * camera.detectionThresholds.fakeOffsetMultiplier;
      const outermostCenter = focalCenter.clone().add(new THREE.Vector3(fakeOffset, 0, 0));
      
      layoutMidpoint = new THREE.Vector3().addVectors(focalCenter, outermostCenter).multiplyScalar(0.5);
      layoutSpan = focalCenter.distanceTo(outermostCenter);
    } else {
      // Multi-object: find outermost child and calculate midpoint
      let maxDistance = 0;
      let outermostCenter = focalCenter.clone();
      
      for (const childObj of childObjects) {
        const childWorldPos = new THREE.Vector3();
        childObj.getWorldPosition(childWorldPos);
        const distance = focalCenter.distanceTo(childWorldPos);
        
        if (distance > maxDistance) {
          maxDistance = distance;
          outermostCenter = childWorldPos.clone();
        }
      }
      
      layoutMidpoint = new THREE.Vector3().addVectors(focalCenter, outermostCenter).multiplyScalar(0.5);
      layoutSpan = focalCenter.distanceTo(outermostCenter);
    }
    
    // Calculate profile distance
    let profileDistance: number;
    
    if (layoutSpan > 0 && layoutSpan < camera.detectionThresholds.fakeOffsetMax) {
      // Single object or very small layout
      profileDistance = camera.detectionThresholds.singleObjectDistance;
    } else {
      // Normal multi-object layout
      profileDistance = Math.max(layoutSpan * camera.distanceMultipliers.profileLayout, 
                                camera.detectionThresholds.singleObjectDistance);
    }
    
    // Calculate camera position at profile angle
    const profileAngle = camera.elevationAngles.profile * (Math.PI / 180);
    
    const cameraPosition = new THREE.Vector3(
      layoutMidpoint.x,
      layoutMidpoint.y + profileDistance * Math.sin(profileAngle),
      layoutMidpoint.z + profileDistance * Math.cos(profileAngle)
    );
    
    return {
      cameraPosition,
      target: layoutMidpoint.clone(),
      distance: profileDistance
    };
  }
  
  /**
   * Determine if an object is relevant to the focused object in profile view
   */
  private isRelevantToFocusedObject(
    object: CelestialObject,
    focusObjectId: string | null,
    _systemContext: SystemContext
  ): boolean {
    if (!focusObjectId) return true;
    
    // Object is focused object
    if (object.id === focusObjectId) return true;
    
    // Object orbits the focused object (child)
    if (object.orbit?.parent === focusObjectId) return true;
    
    // Object is the parent of the focused object
    // (We need to find the focused object to check this)
    // This would require access to the full object list, which we don't have here
    // For now, we'll show all objects and let the caller filter
    
    return false; // Conservative approach - only show direct relationships
  }
  
  /**
   * Determine if a label should be shown in profile view
   */
  private shouldShowProfileLabel(_object: CelestialObject): boolean {
    // Show labels for all visible objects in profile mode for diagram clarity
    return true;
  }
  
  /**
   * Calculate priority for profile view
   */
  private calculateProfilePriority(
    object: CelestialObject,
    isFocused: boolean,
    isRelevantToFocus: boolean
  ): number {
    let priority = 30; // Lower base priority for compact display
    
    if (isFocused) priority += 50;
    if (isRelevantToFocus) priority += 20;
    
    // All visible objects are important in profile view
    switch (object.classification) {
      case 'star':
        priority += 15;
        break;
      case 'planet':
        priority += 10;
        break;
      case 'moon':
        priority += 8;
        break;
      default:
        priority += 5;
    }
    
    return Math.min(priority, 100);
  }
}