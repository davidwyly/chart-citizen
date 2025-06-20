/**
 * Validation Service
 * ==================
 * 
 * Comprehensive validation for orbital calculations.
 * Clean, focused validation logic without legacy workarounds.
 * Provides detailed error reporting and compatibility checking.
 */

import type { 
  IValidationService,
  CalculationContext,
  CalculationResult
} from './interfaces/calculation-services';
import type { CelestialObject } from '@/engine/types/orbital-system';
import type { ViewType } from '@lib/types/effects-level';
import type { ViewModeStrategy } from '@/engine/core/view-modes/strategies/view-mode-strategy';

export class ValidationService implements IValidationService {

  async validateContext(context: CalculationContext): Promise<string[]> {
    const warnings: string[] = [];
    
    // Validate objects
    const objectWarnings = await this.validateObjects(context.objects);
    warnings.push(...objectWarnings);
    
    // Validate view mode compatibility
    const compatibilityWarnings = await this.validateViewModeCompatibility(
      context.objects,
      context.viewMode,
      context.strategy
    );
    warnings.push(...compatibilityWarnings);
    
    // Validate configuration
    const configWarnings = this.validateConfiguration(context);
    warnings.push(...configWarnings);
    
    // Validate system context
    const systemWarnings = this.validateSystemContext(context);
    warnings.push(...systemWarnings);
    
    return warnings;
  }

  async validateObjects(objects: CelestialObject[]): Promise<string[]> {
    const warnings: string[] = [];
    
    if (objects.length === 0) {
      warnings.push('No objects provided for calculation');
      return warnings;
    }
    
    // Check for required objects
    const stars = objects.filter(obj => obj.classification === 'star');
    if (stars.length === 0) {
      warnings.push('No star objects found - system may not render correctly');
    }
    
    if (stars.length > 1) {
      warnings.push('Multiple stars detected - some view modes may not handle this correctly');
    }
    
    // Validate individual objects
    for (const object of objects) {
      const objectWarnings = this.validateSingleObject(object, objects);
      warnings.push(...objectWarnings);
    }
    
    // Validate hierarchy
    const hierarchyWarnings = this.validateHierarchyStructure(objects);
    warnings.push(...hierarchyWarnings);
    
    return warnings;
  }

  async validateResults(
    results: Map<string, CalculationResult>,
    context: CalculationContext
  ): Promise<string[]> {
    const warnings: string[] = [];
    
    if (results.size === 0) {
      warnings.push('No calculation results produced');
      return warnings;
    }
    
    // Check that all objects have results
    for (const object of context.objects) {
      if (!results.has(object.id)) {
        warnings.push(`Missing calculation result for object: ${object.id}`);
      }
    }
    
    // Validate individual results
    for (const [objectId, result] of results) {
      const resultWarnings = this.validateSingleResult(objectId, result, context);
      warnings.push(...resultWarnings);
    }
    
    // Validate system-wide constraints
    const systemWarnings = this.validateSystemConstraints(results, context);
    warnings.push(...systemWarnings);
    
    return warnings;
  }

  async validateViewModeCompatibility(
    objects: CelestialObject[],
    viewMode: ViewType,
    strategy: ViewModeStrategy
  ): Promise<string[]> {
    const warnings: string[] = [];
    
    // Check strategy compatibility with objects
    const systemContext = {
      totalObjects: objects.length,
      hasMultipleStars: objects.filter(obj => obj.classification === 'star').length > 1,
      hasMoons: objects.some(obj => obj.classification === 'moon'),
      maxOrbitalRadius: this.getMaxOrbitalRadius(objects),
      minOrbitalRadius: this.getMinOrbitalRadius(objects),
      systemComplexity: this.calculateComplexity(objects),
      earthReference: objects.find(obj => obj.name?.toLowerCase() === 'earth') || null
    };
    
    const compatibility = strategy.validateSystemCompatibility(systemContext);
    
    if (!compatibility.compatible) {
      warnings.push(`View mode '${viewMode}' not compatible with current system`);
      warnings.push(...compatibility.errors);
    }
    
    warnings.push(...compatibility.warnings);
    
    // Check specific view mode constraints
    const modeWarnings = this.validateSpecificViewMode(objects, viewMode);
    warnings.push(...modeWarnings);
    
    return warnings;
  }

  /**
   * Validate individual celestial object
   */
  private validateSingleObject(object: CelestialObject, allObjects: CelestialObject[]): string[] {
    const warnings: string[] = [];
    
    // Check required properties
    if (!object.id) {
      warnings.push('Object missing required ID');
    }
    
    if (!object.classification) {
      warnings.push(`Object ${object.id} missing classification`);
    }
    
    if (!object.properties) {
      warnings.push(`Object ${object.id} missing properties`);
    } else {
      // Check radius
      if (!object.properties.radius || object.properties.radius <= 0) {
        warnings.push(`Object ${object.id} has invalid radius: ${object.properties.radius}`);
      }
      
      // Check mass
      if (!object.properties.mass || object.properties.mass <= 0) {
        warnings.push(`Object ${object.id} has invalid mass: ${object.properties.mass}`);
      }
    }
    
    // Validate orbital data
    if (object.orbit) {
      const orbitWarnings = this.validateOrbitData(object, allObjects);
      warnings.push(...orbitWarnings);
    } else if (object.classification !== 'star') {
      warnings.push(`Non-star object ${object.id} missing orbital data`);
    }
    
    return warnings;
  }

  /**
   * Validate orbital data
   */
  private validateOrbitData(object: CelestialObject, allObjects: CelestialObject[]): string[] {
    const warnings: string[] = [];
    const orbit = object.orbit!;
    
    // Check parent reference
    if (!orbit.parent) {
      warnings.push(`Object ${object.id} missing orbit parent`);
    } else {
      const parent = allObjects.find(obj => obj.id === orbit.parent);
      if (!parent) {
        warnings.push(`Object ${object.id} references non-existent parent: ${orbit.parent}`);
      }
    }
    
    // Check orbital parameters
    if ('semi_major_axis' in orbit) {
      if (orbit.semi_major_axis <= 0) {
        warnings.push(`Object ${object.id} has invalid semi-major axis: ${orbit.semi_major_axis}`);
      }
      
      if (orbit.eccentricity < 0 || orbit.eccentricity >= 1) {
        warnings.push(`Object ${object.id} has invalid eccentricity: ${orbit.eccentricity}`);
      }
    }
    
    return warnings;
  }

  /**
   * Validate hierarchy structure
   */
  private validateHierarchyStructure(objects: CelestialObject[]): string[] {
    const warnings: string[] = [];
    
    // Check for circular references
    for (const object of objects) {
      if (this.hasCircularReference(object, objects)) {
        warnings.push(`Circular reference detected in hierarchy for object: ${object.id}`);
      }
    }
    
    // Check classification hierarchy rules
    const hierarchyWarnings = this.validateClassificationHierarchy(objects);
    warnings.push(...hierarchyWarnings);
    
    return warnings;
  }

  /**
   * Validate single calculation result
   */
  private validateSingleResult(
    objectId: string,
    result: CalculationResult,
    context: CalculationContext
  ): string[] {
    const warnings: string[] = [];
    const { visual } = context.config;
    
    // Check visual radius
    if (result.visualRadius <= 0) {
      warnings.push(`Object ${objectId} has invalid visual radius: ${result.visualRadius}`);
    }
    
    if (result.visualRadius < visual.sizeConstraints.minVisualSize) {
      warnings.push(`Object ${objectId} below minimum visual size: ${result.visualRadius}`);
    }
    
    if (result.visualRadius > visual.sizeConstraints.maxVisualSize) {
      warnings.push(`Object ${objectId} above maximum visual size: ${result.visualRadius}`);
    }
    
    // Check orbit distance if present
    if (result.orbitDistance !== undefined) {
      if (result.orbitDistance < 0) {
        warnings.push(`Object ${objectId} has negative orbit distance: ${result.orbitDistance}`);
      }
    }
    
    // Validate belt data if present
    if (result.beltData) {
      const beltWarnings = this.validateBeltData(objectId, result.beltData);
      warnings.push(...beltWarnings);
    }
    
    return warnings;
  }

  /**
   * Validate system-wide constraints
   */
  private validateSystemConstraints(
    results: Map<string, CalculationResult>,
    context: CalculationContext
  ): string[] {
    const warnings: string[] = [];
    
    // Check for overlapping objects
    const overlapWarnings = this.checkForOverlaps(results, context);
    warnings.push(...overlapWarnings);
    
    // Check size ratios
    const ratioWarnings = this.validateSizeRatios(results, context);
    warnings.push(...ratioWarnings);
    
    return warnings;
  }

  /**
   * Validate configuration
   */
  private validateConfiguration(context: CalculationContext): string[] {
    const warnings: string[] = [];
    const config = context.config;
    
    // Validate camera configuration
    if (config.camera.defaultDistance <= 0) {
      warnings.push('Invalid camera default distance in configuration');
    }
    
    // Validate orbital configuration
    if (config.orbital.safetyFactors.minimum <= 0) {
      warnings.push('Invalid safety factor minimum in configuration');
    }
    
    // Validate visual configuration
    if (config.visual.sizeConstraints.minVisualSize <= 0) {
      warnings.push('Invalid minimum visual size in configuration');
    }
    
    if (config.visual.sizeConstraints.maxVisualSize <= config.visual.sizeConstraints.minVisualSize) {
      warnings.push('Maximum visual size must be greater than minimum visual size');
    }
    
    return warnings;
  }

  /**
   * Validate system context
   */
  private validateSystemContext(context: CalculationContext): string[] {
    const warnings: string[] = [];
    const systemContext = context.systemContext;
    
    if (systemContext.totalObjects !== context.objects.length) {
      warnings.push('System context object count mismatch');
    }
    
    if (systemContext.maxOrbitalRadius <= 0) {
      warnings.push('Invalid maximum orbital radius in system context');
    }
    
    return warnings;
  }

  /**
   * Check for circular references
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
   * Validate classification hierarchy
   */
  private validateClassificationHierarchy(objects: CelestialObject[]): string[] {
    const warnings: string[] = [];
    const validHierarchies = [
      { parent: 'star', children: ['planet', 'dwarf_planet', 'asteroid_belt'] },
      { parent: 'planet', children: ['moon'] },
      { parent: 'dwarf_planet', children: ['moon'] }
    ];
    
    for (const object of objects) {
      if (!object.orbit?.parent) continue;
      
      const parent = objects.find(obj => obj.id === object.orbit!.parent);
      if (!parent) continue;
      
      const validHierarchy = validHierarchies.find(h => h.parent === parent.classification);
      if (!validHierarchy) {
        warnings.push(`Parent classification '${parent.classification}' cannot have children`);
        continue;
      }
      
      if (!validHierarchy.children.includes(object.classification)) {
        warnings.push(`Invalid hierarchy: '${object.classification}' cannot orbit '${parent.classification}'`);
      }
    }
    
    return warnings;
  }

  /**
   * Validate view mode specific constraints
   */
  private validateSpecificViewMode(objects: CelestialObject[], viewMode: ViewType): string[] {
    const warnings: string[] = [];
    
    switch (viewMode) {
      case 'scientific':
        if (objects.length > 20) {
          warnings.push('Scientific mode may perform poorly with large object counts');
        }
        break;
        
      case 'profile':
        const nonCircularOrbits = objects.filter(obj => 
          obj.orbit && 'eccentricity' in obj.orbit && obj.orbit.eccentricity > 0.1
        );
        if (nonCircularOrbits.length > 0) {
          warnings.push('Profile mode works best with circular orbits');
        }
        break;
    }
    
    return warnings;
  }

  /**
   * Helper methods
   */
  private getMaxOrbitalRadius(objects: CelestialObject[]): number {
    let max = 0;
    for (const object of objects) {
      if (object.orbit && 'semi_major_axis' in object.orbit) {
        max = Math.max(max, object.orbit.semi_major_axis);
      }
    }
    return max;
  }

  private getMinOrbitalRadius(objects: CelestialObject[]): number {
    let min = Infinity;
    for (const object of objects) {
      if (object.orbit && 'semi_major_axis' in object.orbit) {
        min = Math.min(min, object.orbit.semi_major_axis);
      }
    }
    return min === Infinity ? 0 : min;
  }

  private calculateComplexity(objects: CelestialObject[]): 'simple' | 'moderate' | 'complex' {
    const count = objects.length;
    const hasMultipleStars = objects.filter(obj => obj.classification === 'star').length > 1;
    
    if (hasMultipleStars || count > 15) return 'complex';
    if (count > 8) return 'moderate';
    return 'simple';
  }

  private validateBeltData(objectId: string, beltData: any): string[] {
    const warnings: string[] = [];
    
    if (beltData.innerRadius >= beltData.outerRadius) {
      warnings.push(`Object ${objectId} has invalid belt data: inner radius >= outer radius`);
    }
    
    if (beltData.width <= 0) {
      warnings.push(`Object ${objectId} has invalid belt width: ${beltData.width}`);
    }
    
    return warnings;
  }

  private checkForOverlaps(
    results: Map<string, CalculationResult>,
    context: CalculationContext
  ): string[] {
    const warnings: string[] = [];
    // Implementation would check for object overlaps
    // This is a placeholder for now
    return warnings;
  }

  private validateSizeRatios(
    results: Map<string, CalculationResult>,
    context: CalculationContext
  ): string[] {
    const warnings: string[] = [];
    // Implementation would validate parent-child size ratios
    // This is a placeholder for now
    return warnings;
  }
}