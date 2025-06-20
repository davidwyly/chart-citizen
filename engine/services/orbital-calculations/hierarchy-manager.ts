/**
 * Hierarchy Manager Service
 * =========================
 * 
 * Manages parent-child relationships and enforces size hierarchy rules.
 * Clean implementation without legacy workarounds or complex fallbacks.
 */

import type { 
  IHierarchyManager,
  CalculationContext,
  HierarchyNode
} from './interfaces/calculation-services';
import type { CelestialObject } from '@/engine/types/orbital-system';
import type { ScalingResult } from '@/engine/core/view-modes/strategies/view-mode-strategy';

export class HierarchyManager implements IHierarchyManager {

  async enforceHierarchy(
    objects: CelestialObject[],
    visualSizes: Map<string, ScalingResult>,
    context: CalculationContext
  ): Promise<Map<string, ScalingResult>> {
    const adjustedSizes = new Map<string, ScalingResult>();
    const hierarchy = await this.buildHierarchy(objects);
    
    // Copy original sizes
    for (const [id, size] of visualSizes) {
      adjustedSizes.set(id, { ...size });
    }
    
    // Enforce hierarchy from root down
    await this.enforceHierarchyRecursive(hierarchy, adjustedSizes, context);
    
    return adjustedSizes;
  }

  async buildHierarchy(objects: CelestialObject[]): Promise<HierarchyNode> {
    // Validate input
    if (!objects || objects.length === 0) {
      throw new Error('No objects provided to build hierarchy');
    }
    
    // Find root objects (stars or objects with no parent)
    // Root objects are those without an orbit property, or with orbit but no parent
    const rootObjects = objects.filter(obj => {
      const hasNoOrbit = !obj.orbit;
      const hasOrbitButNoParent = obj.orbit && (!obj.orbit.parent || obj.orbit.parent === '');
      return hasNoOrbit || hasOrbitButNoParent;
    });
    
    if (rootObjects.length === 0) {
      // Fallback: treat the first object as root if no clear root is found
      console.warn('⚠️ No clear root objects found, using first object as root');
      const fallbackRoot = objects[0];
      return this.buildHierarchyNode(fallbackRoot, objects, 0);
    }
    
    // For now, handle single-star systems (most common case)
    const rootObject = rootObjects[0];
    
    return this.buildHierarchyNode(rootObject, objects, 0);
  }

  getChildren(parentId: string, objects: CelestialObject[]): CelestialObject[] {
    return objects.filter(obj => obj.orbit?.parent === parentId);
  }

  getParent(objectId: string, objects: CelestialObject[]): CelestialObject | null {
    const object = objects.find(obj => obj.id === objectId);
    if (!object?.orbit?.parent) return null;
    
    return objects.find(obj => obj.id === object.orbit!.parent) || null;
  }

  async validateHierarchy(objects: CelestialObject[]): Promise<string[]> {
    const warnings: string[] = [];
    const objectMap = new Map(objects.map(obj => [obj.id, obj]));
    
    for (const object of objects) {
      if (!object.orbit?.parent) continue;
      
      // Check if parent exists
      const parent = objectMap.get(object.orbit.parent);
      if (!parent) {
        warnings.push(`Object ${object.id} references non-existent parent ${object.orbit.parent}`);
        continue;
      }
      
      // Check for circular references
      if (this.hasCircularReference(object, objects)) {
        warnings.push(`Circular reference detected involving object ${object.id}`);
      }
      
      // Check hierarchy rules
      const hierarchyIssue = this.validateHierarchyRules(object, parent);
      if (hierarchyIssue) {
        warnings.push(hierarchyIssue);
      }
    }
    
    return warnings;
  }

  /**
   * Build hierarchy node recursively
   */
  private buildHierarchyNode(
    object: CelestialObject,
    allObjects: CelestialObject[],
    depth: number
  ): HierarchyNode {
    const children = this.getChildren(object.id, allObjects);
    
    return {
      object,
      children: children.map(child => 
        this.buildHierarchyNode(child, allObjects, depth + 1)
      ),
      depth,
      isRoot: depth === 0
    };
  }

  /**
   * Enforce hierarchy constraints recursively
   */
  private async enforceHierarchyRecursive(
    node: HierarchyNode,
    visualSizes: Map<string, ScalingResult>,
    context: CalculationContext
  ): Promise<void> {
    const { visual } = context.config;
    const parentSize = visualSizes.get(node.object.id);
    
    if (!parentSize) return;
    
    // Process children
    for (const childNode of node.children) {
      const childSize = visualSizes.get(childNode.object.id);
      if (!childSize) continue;
      
      // Enforce parent-child size relationship
      const maxChildSize = parentSize.visualRadius * visual.hierarchyConstraints.maxChildToParentRatio;
      const minChildSize = parentSize.visualRadius * visual.hierarchyConstraints.minChildToParentRatio;
      
      if (childSize.visualRadius > maxChildSize) {
        // Child too large relative to parent
        const adjustedSize: ScalingResult = {
          ...childSize,
          visualRadius: maxChildSize,
          scalingMethod: 'hierarchy-constrained'
        };
        visualSizes.set(childNode.object.id, adjustedSize);
      } else if (childSize.visualRadius < minChildSize) {
        // Child too small relative to parent (only enforce if above absolute minimum)
        const absoluteMin = visual.sizeConstraints.minVisualSize;
        const targetSize = Math.max(minChildSize, absoluteMin);
        
        if (targetSize > absoluteMin) {
          const adjustedSize: ScalingResult = {
            ...childSize,
            visualRadius: targetSize,
            scalingMethod: 'hierarchy-constrained'
          };
          visualSizes.set(childNode.object.id, adjustedSize);
        }
      }
      
      // Recursively enforce for this child's children
      await this.enforceHierarchyRecursive(childNode, visualSizes, context);
    }
  }

  /**
   * Check for circular references in hierarchy
   */
  private hasCircularReference(
    object: CelestialObject,
    allObjects: CelestialObject[],
    visited: Set<string> = new Set()
  ): boolean {
    if (visited.has(object.id)) {
      return true;
    }
    
    if (!object.orbit?.parent) {
      return false;
    }
    
    visited.add(object.id);
    const parent = allObjects.find(obj => obj.id === object.orbit!.parent);
    
    if (!parent) {
      return false;
    }
    
    return this.hasCircularReference(parent, allObjects, visited);
  }

  /**
   * Validate hierarchy rules between parent and child
   */
  private validateHierarchyRules(
    child: CelestialObject,
    parent: CelestialObject
  ): string | null {
    // Check classification hierarchy
    const validHierarchies = [
      { parent: 'star', children: ['planet', 'dwarf_planet', 'asteroid_belt'] },
      { parent: 'planet', children: ['moon'] },
      { parent: 'dwarf_planet', children: ['moon'] }
    ];
    
    const applicableHierarchy = validHierarchies.find(h => h.parent === parent.classification);
    
    if (!applicableHierarchy) {
      return `Parent classification '${parent.classification}' cannot have children`;
    }
    
    if (!applicableHierarchy.children.includes(child.classification)) {
      return `Child classification '${child.classification}' invalid for parent '${parent.classification}'`;
    }
    
    return null;
  }

  /**
   * Get all objects at a specific depth in the hierarchy
   */
  getObjectsAtDepth(hierarchy: HierarchyNode, targetDepth: number): CelestialObject[] {
    if (hierarchy.depth === targetDepth) {
      return [hierarchy.object];
    }
    
    const objects: CelestialObject[] = [];
    for (const child of hierarchy.children) {
      objects.push(...this.getObjectsAtDepth(child, targetDepth));
    }
    
    return objects;
  }

  /**
   * Get maximum hierarchy depth
   */
  getMaxDepth(hierarchy: HierarchyNode): number {
    let maxDepth = hierarchy.depth;
    
    for (const child of hierarchy.children) {
      maxDepth = Math.max(maxDepth, this.getMaxDepth(child));
    }
    
    return maxDepth;
  }

  /**
   * Find node in hierarchy by object ID
   */
  findNodeById(hierarchy: HierarchyNode, objectId: string): HierarchyNode | null {
    if (hierarchy.object.id === objectId) {
      return hierarchy;
    }
    
    for (const child of hierarchy.children) {
      const found = this.findNodeById(child, objectId);
      if (found) return found;
    }
    
    return null;
  }

  /**
   * Get all descendants of a node
   */
  getAllDescendants(node: HierarchyNode): CelestialObject[] {
    const descendants: CelestialObject[] = [];
    
    for (const child of node.children) {
      descendants.push(child.object);
      descendants.push(...this.getAllDescendants(child));
    }
    
    return descendants;
  }

  /**
   * Get path from root to object
   */
  getPathToObject(hierarchy: HierarchyNode, objectId: string): CelestialObject[] {
    if (hierarchy.object.id === objectId) {
      return [hierarchy.object];
    }
    
    for (const child of hierarchy.children) {
      const path = this.getPathToObject(child, objectId);
      if (path.length > 0) {
        return [hierarchy.object, ...path];
      }
    }
    
    return [];
  }
}