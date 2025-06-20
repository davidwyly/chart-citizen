/**
 * Visual Size Calculator Service
 * ==============================
 * 
 * Clean, focused service for calculating object visual sizes.
 * No legacy hacks, no fallbacks, just pure calculation logic.
 * Uses the strategy pattern for view mode specific behavior.
 */

import type { 
  IVisualSizeCalculator, 
  CalculationContext,
  CalculationResult
} from './interfaces/calculation-services';
import type { CelestialObject } from '@/engine/types/orbital-system';
import type { ScalingResult } from '@/engine/core/view-modes/strategies/view-mode-strategy';

export class VisualSizeCalculator implements IVisualSizeCalculator {
  
  async calculateVisualSize(
    object: CelestialObject,
    context: CalculationContext
  ): Promise<ScalingResult> {
    // Delegate to the view mode strategy - clean and simple
    return context.strategy.calculateObjectScale(
      object,
      context.systemContext,
      context.config
    );
  }

  async calculateVisualSizes(
    objects: CelestialObject[],
    context: CalculationContext
  ): Promise<Map<string, ScalingResult>> {
    const results = new Map<string, ScalingResult>();
    
    // Calculate all sizes concurrently for performance
    const calculations = objects.map(async (object) => {
      const size = await this.calculateVisualSize(object, context);
      return { id: object.id, size };
    });
    
    const resolvedSizes = await Promise.all(calculations);
    
    // Build the results map
    for (const { id, size } of resolvedSizes) {
      results.set(id, size);
    }
    
    return results;
  }

  async calculateEffectiveRadius(
    parentObject: CelestialObject,
    childObjects: CelestialObject[],
    visualSizes: Map<string, ScalingResult>,
    context: CalculationContext
  ): Promise<number> {
    const parentSize = visualSizes.get(parentObject.id);
    if (!parentSize) {
      throw new Error(`Visual size not found for parent object: ${parentObject.id}`);
    }
    
    let maxChildExtent = 0;
    
    // Find the maximum extent of child objects
    for (const child of childObjects) {
      const childSize = visualSizes.get(child.id);
      if (!childSize || !child.orbit) continue;
      
      // Calculate child's orbital position using view mode scaling
      const orbitScaling = this.getOrbitScaling(context);
      const childOrbitDistance = this.calculateOrbitDistance(child, orbitScaling, context);
      const childTotalExtent = childOrbitDistance + childSize.visualRadius;
      
      maxChildExtent = Math.max(maxChildExtent, childTotalExtent);
    }
    
    // Effective radius is the larger of parent radius or maximum child extent
    return Math.max(parentSize.visualRadius, maxChildExtent);
  }

  async validateSizes(
    sizes: Map<string, ScalingResult>,
    context: CalculationContext
  ): Promise<string[]> {
    const warnings: string[] = [];
    const { visual } = context.config;
    
    for (const [objectId, size] of sizes) {
      // Check size constraints
      if (size.visualRadius < visual.sizeConstraints.minVisualSize) {
        warnings.push(`Object ${objectId} below minimum size: ${size.visualRadius}`);
      }
      
      if (size.visualRadius > visual.sizeConstraints.maxVisualSize) {
        warnings.push(`Object ${objectId} above maximum size: ${size.visualRadius}`);
      }
      
      // Check for zero or negative sizes
      if (size.visualRadius <= 0) {
        warnings.push(`Object ${objectId} has invalid size: ${size.visualRadius}`);
      }
    }
    
    return warnings;
  }

  /**
   * Get orbit scaling factor from context
   */
  private getOrbitScaling(context: CalculationContext): number {
    // Use the configuration-driven approach instead of hardcoded values
    const { orbital } = context.config;
    
    // Get orbit scaling from configuration
    switch (context.viewMode) {
      case 'explorational':
        return orbital.baseScaling.explorational;
      case 'navigational':
        return orbital.baseScaling.navigational;  
      case 'profile':
        return orbital.baseScaling.profile;
      case 'scientific':
        // Scientific mode should use real astronomical scaling
        // Delegate to the OrbitPositionCalculator for proper scientific scaling
        return 1.0; // Will be overridden by scientific calculations
      default:
        return orbital.baseScaling.default;
    }
  }

  /**
   * Calculate orbit distance for a child object
   */
  private calculateOrbitDistance(
    object: CelestialObject,
    orbitScaling: number,
    context: CalculationContext
  ): number {
    if (!object.orbit || !('semi_major_axis' in object.orbit)) {
      return 0;
    }
    
    const orbitalBehavior = context.strategy.getOrbitalBehavior();
    
    if (orbitalBehavior.useEquidistantSpacing) {
      // Profile mode or navigational mode - use equidistant spacing
      // This is handled by the orbit position calculator
      return object.orbit.semi_major_axis * orbitScaling;
    } else {
      // Use scaled astronomical distances
      return object.orbit.semi_major_axis * orbitScaling;
    }
  }
}