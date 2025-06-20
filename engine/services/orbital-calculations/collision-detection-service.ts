/**
 * Collision Detection Service
 * ===========================
 * 
 * Fast, accurate collision detection and resolution.
 * No legacy workarounds - just clean geometric calculations.
 */

import type { 
  ICollisionDetectionService,
  CalculationContext,
  CollisionAdjustment
} from './interfaces/calculation-services';
import type { CelestialObject } from '@/engine/types/orbital-system';
import type { ScalingResult } from '@/engine/core/view-modes/strategies/view-mode-strategy';

export class CollisionDetectionService implements ICollisionDetectionService {

  async detectCollisions(
    objects: CelestialObject[],
    visualSizes: Map<string, ScalingResult>,
    orbitalPositions: Map<string, number>,
    context: CalculationContext
  ): Promise<CollisionAdjustment[]> {
    const collisions: CollisionAdjustment[] = [];
    
    // Validate input
    if (!objects || objects.length === 0) {
      console.warn('⚠️ No objects provided for collision detection');
      return collisions;
    }
    
    // Find root objects
    const rootObjects = this.findRootObjects(objects);
    if (rootObjects.length === 0) {
      console.warn('⚠️ No root objects found for collision detection, skipping parent-child collision checks');
    } else {
      // Check parent-child collisions
      const rootObject = rootObjects[0];
      const children = this.getChildren(rootObject.id, objects);
      
      if (children.length > 0) {
        const parentChildCollisions = await this.checkParentChildCollisions(
          rootObject,
          children,
          visualSizes,
          orbitalPositions,
          context
        );
        collisions.push(...parentChildCollisions);
      }
    }
    
    // Check sibling collisions
    const siblingCollisions = await this.checkSiblingCollisions(
      objects,
      visualSizes,
      orbitalPositions,
      context
    );
    collisions.push(...siblingCollisions);
    
    return collisions;
  }

  async resolveCollisions(
    collisions: CollisionAdjustment[],
    objects: CelestialObject[],
    visualSizes: Map<string, ScalingResult>,
    orbitalPositions: Map<string, number>,
    context: CalculationContext
  ): Promise<Map<string, number>> {
    const adjustedPositions = new Map(orbitalPositions);
    const { orbital } = context.config;
    
    // Sort collisions by orbital distance to resolve from inside out
    const sortedCollisions = collisions.sort((a, b) => a.originalDistance - b.originalDistance);
    
    for (const collision of sortedCollisions) {
      const object = objects.find(obj => obj.id === collision.objectId);
      const visualSize = visualSizes.get(collision.objectId);
      
      if (!object || !visualSize) continue;
      
      // Calculate minimum safe distance
      const parentId = object.orbit?.parent;
      const parentSize = parentId ? visualSizes.get(parentId) : null;
      const parentRadius = parentSize?.visualRadius || 0;
      
      const safetyFactor = this.getSafetyFactor(context);
      const minSafeDistance = parentRadius * safetyFactor + visualSize.visualRadius + orbital.collisionDetection.convergenceThreshold;
      
      // Find the next available position
      let newPosition = Math.max(collision.adjustedDistance, minSafeDistance);
      
      // Check against siblings to ensure no conflicts
      newPosition = this.findNextAvailablePosition(
        object,
        newPosition,
        objects,
        visualSizes,
        adjustedPositions,
        context
      );
      
      adjustedPositions.set(collision.objectId, newPosition);
    }
    
    return adjustedPositions;
  }

  async checkParentChildCollisions(
    parentObject: CelestialObject,
    childObjects: CelestialObject[],
    visualSizes: Map<string, ScalingResult>,
    orbitalPositions: Map<string, number>,
    context: CalculationContext
  ): Promise<CollisionAdjustment[]> {
    const collisions: CollisionAdjustment[] = [];
    const parentSize = visualSizes.get(parentObject.id);
    
    if (!parentSize) return collisions;
    
    const safetyFactor = this.getSafetyFactor(context);
    const parentSafeZone = parentSize.visualRadius * safetyFactor;
    
    for (const child of childObjects) {
      const childSize = visualSizes.get(child.id);
      const childOrbitDistance = orbitalPositions.get(child.id);
      
      if (!childSize || childOrbitDistance === undefined) continue;
      
      // Check if child's inner edge is inside parent's safe zone
      const childInnerEdge = childOrbitDistance - childSize.visualRadius;
      
      if (childInnerEdge < parentSafeZone) {
        const minSafeDistance = parentSafeZone + childSize.visualRadius;
        
        collisions.push({
          objectId: child.id,
          originalDistance: childOrbitDistance,
          adjustedDistance: minSafeDistance,
          reason: `Child ${child.id} colliding with parent ${parentObject.id}`
        });
      }
    }
    
    return collisions;
  }

  async checkSiblingCollisions(
    objects: CelestialObject[],
    visualSizes: Map<string, ScalingResult>,
    orbitalPositions: Map<string, number>,
    context: CalculationContext
  ): Promise<CollisionAdjustment[]> {
    const collisions: CollisionAdjustment[] = [];
    const { orbital } = context.config;
    
    // Group objects by parent
    const parentGroups = this.groupByParent(objects);
    
    for (const [parentId, siblings] of parentGroups) {
      // Sort siblings by orbital distance
      const sortedSiblings = siblings
        .filter(obj => orbitalPositions.has(obj.id))
        .sort((a, b) => {
          const distA = orbitalPositions.get(a.id) || 0;
          const distB = orbitalPositions.get(b.id) || 0;
          return distA - distB;
        });
      
      // Check adjacent siblings for collisions
      for (let i = 0; i < sortedSiblings.length - 1; i++) {
        const innerObject = sortedSiblings[i];
        const outerObject = sortedSiblings[i + 1];
        
        const innerSize = visualSizes.get(innerObject.id);
        const outerSize = visualSizes.get(outerObject.id);
        const innerDistance = orbitalPositions.get(innerObject.id);
        const outerDistance = orbitalPositions.get(outerObject.id);
        
        if (!innerSize || !outerSize || innerDistance === undefined || outerDistance === undefined) {
          continue;
        }
        
        const innerOuterEdge = innerDistance + innerSize.visualRadius;
        const outerInnerEdge = outerDistance - outerSize.visualRadius;
        const gapSize = outerInnerEdge - innerOuterEdge;
        
        if (gapSize < orbital.collisionDetection.convergenceThreshold) {
          const requiredGap = orbital.collisionDetection.convergenceThreshold;
          const newOuterDistance = innerOuterEdge + requiredGap + outerSize.visualRadius;
          
          collisions.push({
            objectId: outerObject.id,
            originalDistance: outerDistance,
            adjustedDistance: newOuterDistance,
            reason: `Sibling collision between ${innerObject.id} and ${outerObject.id}`
          });
        }
      }
    }
    
    return collisions;
  }

  /**
   * Get safety factor for current context
   */
  private getSafetyFactor(context: CalculationContext): number {
    const { orbital } = context.config;
    
    switch (context.viewMode) {
      case 'explorational':
        return orbital.safetyFactors.explorational;
      case 'navigational':
        return orbital.safetyFactors.navigational;
      case 'profile':
        return orbital.safetyFactors.profile;
      case 'scientific':
        return orbital.safetyFactors.scientific;
      default:
        return orbital.safetyFactors.minimum;
    }
  }

  /**
   * Find next available position that doesn't collide with siblings
   */
  private findNextAvailablePosition(
    object: CelestialObject,
    startPosition: number,
    objects: CelestialObject[],
    visualSizes: Map<string, ScalingResult>,
    orbitalPositions: Map<string, number>,
    context: CalculationContext
  ): number {
    const objectSize = visualSizes.get(object.id);
    if (!objectSize) return startPosition;
    
    const { orbital } = context.config;
    const parentId = object.orbit?.parent;
    const siblings = objects.filter(obj => obj.orbit?.parent === parentId && obj.id !== object.id);
    
    let currentPosition = startPosition;
    let attempts = 0;
    const maxAttempts = orbital.collisionDetection.maxIterations;
    
    while (attempts < maxAttempts) {
      let hasCollision = false;
      
      for (const sibling of siblings) {
        const siblingSize = visualSizes.get(sibling.id);
        const siblingPosition = orbitalPositions.get(sibling.id);
        
        if (!siblingSize || siblingPosition === undefined) continue;
        
        // Check if current position would collide with this sibling
        const objectInnerEdge = currentPosition - objectSize.visualRadius;
        const objectOuterEdge = currentPosition + objectSize.visualRadius;
        const siblingInnerEdge = siblingPosition - siblingSize.visualRadius;
        const siblingOuterEdge = siblingPosition + siblingSize.visualRadius;
        
        const isColliding = !(objectOuterEdge < siblingInnerEdge || objectInnerEdge > siblingOuterEdge);
        
        if (isColliding) {
          // Move past this sibling
          currentPosition = siblingOuterEdge + objectSize.visualRadius + orbital.collisionDetection.convergenceThreshold;
          hasCollision = true;
          break;
        }
      }
      
      if (!hasCollision) {
        return currentPosition;
      }
      
      attempts++;
    }
    
    // If we couldn't find a position, use the last attempted position
    return currentPosition;
  }

  /**
   * Group objects by their parent
   */
  private groupByParent(objects: CelestialObject[]): Map<string, CelestialObject[]> {
    const groups = new Map<string, CelestialObject[]>();
    
    for (const object of objects) {
      const parentId = object.orbit?.parent || 'root';
      
      if (!groups.has(parentId)) {
        groups.set(parentId, []);
      }
      
      groups.get(parentId)!.push(object);
    }
    
    return groups;
  }

  /**
   * Find root objects (objects with no parent)
   */
  private findRootObjects(objects: CelestialObject[]): CelestialObject[] {
    return objects.filter(obj => !obj.orbit?.parent);
  }

  /**
   * Get children of a parent object
   */
  private getChildren(parentId: string, objects: CelestialObject[]): CelestialObject[] {
    return objects.filter(obj => obj.orbit?.parent === parentId);
  }
}