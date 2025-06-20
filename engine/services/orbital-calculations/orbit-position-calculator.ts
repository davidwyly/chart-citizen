/**
 * Orbit Position Calculator Service
 * =================================
 * 
 * Handles complex two-pass orbital position calculations.
 * Clean implementation without legacy workarounds.
 * Uses configuration-driven approach for all scaling factors.
 */

import type { 
  IOrbitPositionCalculator,
  CalculationContext,
  BeltData
} from './interfaces/calculation-services';
import type { CelestialObject } from '@/engine/types/orbital-system';
import type { ScalingResult } from '@/engine/core/view-modes/strategies/view-mode-strategy';
import { AstronomicalScalingService } from '../astronomical-scaling/astronomical-scaling-service';

export class OrbitPositionCalculator implements IOrbitPositionCalculator {

  async calculateOrbitalPositions(
    objects: CelestialObject[],
    visualSizes: Map<string, ScalingResult>,
    context: CalculationContext
  ): Promise<Map<string, number>> {
    console.log(`🚀 ORBITAL POSITION CALCULATION START`);
    console.log(`   Objects to process: ${objects.length}`);
    console.log(`   Visual sizes available: ${visualSizes.size}`);
    console.log(`   Objects:`, objects.map(o => `${o.id} (${o.name}, ${o.classification})`));
    console.log(`   Visual sizes:`, Array.from(visualSizes.keys()));
    // Two-pass algorithm:
    // Pass 1: Calculate moon orbits (need parent planet sizes first)
    const moonOrbits = await this.calculateMoonOrbits(objects, visualSizes, context);
    
    // Pass 2: Calculate planet/belt orbits (can now include moon system extents)
    const planetOrbits = await this.calculatePlanetOrbits(objects, visualSizes, moonOrbits, context);
    
    // Combine results
    const allOrbits = new Map<string, number>();
    
    // Add moon orbits
    for (const [id, distance] of moonOrbits) {
      allOrbits.set(id, distance);
    }
    
    // Add planet orbits
    for (const [id, distance] of planetOrbits) {
      allOrbits.set(id, distance);
    }
    
    // Handle star positions - single stars at origin, binary stars at calculated positions
    const stars = objects.filter(obj => obj.classification === 'star');
    const starsWithBarycenterOrbit = stars.filter(star => star.orbit?.parent === 'barycenter');
    
    if (starsWithBarycenterOrbit.length > 0) {
      // Multiple stars with barycenter orbits - calculate their positions
      for (const star of starsWithBarycenterOrbit) {
        const orbitDistance = await this.calculateBarycenterOrbitDistance(star, context);
        allOrbits.set(star.id, orbitDistance);
      }
    }
    
    // Add remaining stars (single stars without barycenter orbits) at origin
    const singleStars = stars.filter(star => star.orbit?.parent !== 'barycenter');
    for (const star of singleStars) {
      allOrbits.set(star.id, 0);
    }
    
    return allOrbits;
  }

  async calculateMoonOrbits(
    objects: CelestialObject[],
    visualSizes: Map<string, ScalingResult>,
    context: CalculationContext
  ): Promise<Map<string, number>> {
    const moonOrbits = new Map<string, number>();
    const moons = objects.filter(obj => obj.classification === 'moon');
    
    for (const moon of moons) {
      if (!moon.orbit || !('semi_major_axis' in moon.orbit)) {
        console.warn(`🌙 MOON ORBIT SKIP: ${moon.name} (${moon.id}) - missing orbit or semi_major_axis`);
        console.log(`    Orbit data:`, moon.orbit);
        continue;
      }
      
      const parentId = moon.orbit.parent;
      if (!parentId) {
        console.warn(`🌙 MOON ORBIT SKIP: ${moon.name} (${moon.id}) - no parent ID`);
        continue;
      }
      
      const parentObject = objects.find(obj => obj.id === parentId);
      const parentSize = visualSizes.get(parentId);
      
      if (!parentObject || !parentSize) {
        console.warn(`🌙 MOON ORBIT SKIP: ${moon.name} (${moon.id}) - parent not found or no size`);
        console.log(`    Parent ID: ${parentId}, Found object: ${!!parentObject}, Has size: ${!!parentSize}`);
        continue;
      }
      
      const orbitDistance = this.calculateScaledOrbitDistance(
        moon,
        parentObject,
        parentSize,
        context
      );
      
      moonOrbits.set(moon.id, orbitDistance);
    }
    
    return moonOrbits;
  }

  async calculatePlanetOrbits(
    objects: CelestialObject[],
    visualSizes: Map<string, ScalingResult>,
    moonOrbits: Map<string, number>,
    context: CalculationContext
  ): Promise<Map<string, number>> {
    const planetOrbits = new Map<string, number>();
    const planets = objects.filter(obj => 
      obj.classification === 'planet' || 
      obj.classification === 'asteroid_belt' ||
      obj.classification === 'dwarf_planet'
    );
    
    for (const planet of planets) {
      if (!planet.orbit || !('semi_major_axis' in planet.orbit)) {
        console.warn(`🪐 PLANET ORBIT SKIP: ${planet.name} (${planet.id}) - missing orbit or semi_major_axis`);
        console.log(`    Orbit data:`, planet.orbit);
        continue;
      }
      
      const parentId = planet.orbit.parent;
      if (!parentId) {
        console.warn(`🪐 PLANET ORBIT SKIP: ${planet.name} (${planet.id}) - no parent ID`);
        continue;
      }
      
      const parentObject = objects.find(obj => obj.id === parentId);
      const parentSize = visualSizes.get(parentId);
      
      if (!parentObject || !parentSize) {
        console.warn(`🪐 PLANET ORBIT SKIP: ${planet.name} (${planet.id}) - parent not found or no size`);
        console.log(`    Parent ID: ${parentId}, Found object: ${!!parentObject}, Has size: ${!!parentSize}`);
        console.log(`    Available objects:`, objects.map(o => `${o.id} (${o.name})`));
        console.log(`    Available sizes:`, Array.from(visualSizes.keys()));
        continue;
      }
      
      let orbitDistance: number;
      
      if (planet.classification === 'asteroid_belt') {
        // Handle asteroid belts specially
        const beltData = await this.calculateBeltData(planet, context);
        orbitDistance = beltData.centerRadius;
      } else {
        // Calculate effective planet size including its moon system
        const effectiveSize = this.calculateEffectivePlanetSize(
          planet,
          objects,
          visualSizes,
          moonOrbits
        );
        
        orbitDistance = this.calculateScaledOrbitDistance(
          planet,
          parentObject,
          parentSize,
          context,
          effectiveSize
        );
      }
      
      planetOrbits.set(planet.id, orbitDistance);
    }
    
    return planetOrbits;
  }

  async calculateBeltData(
    beltObject: CelestialObject,
    context: CalculationContext
  ): Promise<BeltData> {
    if (!beltObject.orbit || !('semi_major_axis' in beltObject.orbit)) {
      throw new Error(`Belt object ${beltObject.id} missing orbital data`);
    }
    
    const { orbital } = context.config;
    const orbitScaling = this.getOrbitScaling(context);
    
    // Calculate center radius
    const centerRadius = beltObject.orbit.semi_major_axis * orbitScaling;
    
    // Calculate belt width based on configuration
    const width = centerRadius * orbital.beltConfiguration.defaultBeltWidth;
    
    return {
      innerRadius: centerRadius - width / 2,
      outerRadius: centerRadius + width / 2,
      centerRadius,
      width
    };
  }

  /**
   * Calculate scaled orbit distance for an object
   */
  private calculateScaledOrbitDistance(
    object: CelestialObject,
    parentObject: CelestialObject,
    parentSize: ScalingResult,
    context: CalculationContext,
    effectiveObjectSize?: number
  ): number {
    if (!object.orbit || !('semi_major_axis' in object.orbit)) {
      return 0;
    }
    
    const orbitScaling = this.getOrbitScaling(context);
    const orbitalBehavior = context.strategy.getOrbitalBehavior();
    
    if (orbitalBehavior.useEquidistantSpacing) {
      return this.calculateEquidistantPosition(object, parentObject, context);
    } else {
      // Use scaled astronomical distances
      const baseDistance = object.orbit.semi_major_axis * orbitScaling;
      const minDistance = this.calculateMinimumDistance(
        parentSize,
        effectiveObjectSize || 0,
        context
      );
      
      return Math.max(baseDistance, minDistance);
    }
  }
  
  /**
   * Calculate equidistant orbital position (for navigational/profile modes)
   */
  private calculateEquidistantPosition(
    object: CelestialObject,
    parentObject: CelestialObject,
    context: CalculationContext
  ): number {
    const { orbital } = context.config;
    const siblings = context.siblingObjects || [];
    const sameParentSiblings = siblings.filter(s => s.orbit?.parent === object.orbit?.parent);
    
    // Sort by semi-major axis to get orbital order
    const sortedSiblings = [object, ...sameParentSiblings]
      .filter(obj => obj.orbit && 'semi_major_axis' in obj.orbit)
      .sort((a, b) => {
        const aAxis = (a.orbit as any).semi_major_axis;
        const bAxis = (b.orbit as any).semi_major_axis;
        return aAxis - bAxis;
      });
    
    const objectIndex = sortedSiblings.findIndex(s => s.id === object.id);
    if (objectIndex === -1) return 0;
    
    // Calculate equidistant spacing
    const baseSpacing = orbital.equidistantSpacing.baseSpacing;
    const spacingMultiplier = orbital.equidistantSpacing.spacingMultiplier;
    
    return baseSpacing + (objectIndex * baseSpacing * spacingMultiplier);
  }
  
  /**
   * Calculate minimum safe distance from parent
   */
  private calculateMinimumDistance(
    parentSize: ScalingResult,
    objectSize: number,
    context: CalculationContext
  ): number {
    const { orbital } = context.config;
    const safetyFactor = this.getSafetyFactor(context);
    
    return (parentSize.visualRadius * safetyFactor) + 
           objectSize + 
           orbital.collisionDetection.convergenceThreshold;
  }
  
  /**
   * Calculate effective planet size including moon system
   */
  private calculateEffectivePlanetSize(
    planet: CelestialObject,
    allObjects: CelestialObject[],
    visualSizes: Map<string, ScalingResult>,
    moonOrbits: Map<string, number>
  ): number {
    const planetSize = visualSizes.get(planet.id);
    if (!planetSize) return 0;
    
    // Find moons of this planet
    const moons = allObjects.filter(obj => 
      obj.classification === 'moon' && 
      obj.orbit?.parent === planet.id
    );
    
    let maxMoonExtent = 0;
    
    for (const moon of moons) {
      const moonOrbit = moonOrbits.get(moon.id);
      const moonSize = visualSizes.get(moon.id);
      
      if (moonOrbit !== undefined && moonSize) {
        const moonTotalExtent = moonOrbit + moonSize.visualRadius;
        maxMoonExtent = Math.max(maxMoonExtent, moonTotalExtent);
      }
    }
    
    // Effective size is the larger of planet radius or moon system extent
    return Math.max(planetSize.visualRadius, maxMoonExtent);
  }
  
  /**
   * Get orbit scaling factor from view mode strategy
   */
  private getOrbitScaling(context: CalculationContext): number {
    // For scientific mode, use real astronomical scaling
    if (context.viewMode === 'scientific') {
      return this.calculateScientificOrbitScaling(context);
    }
    
    // For other modes, use existing scaling factors
    switch (context.viewMode) {
      case 'explorational':
        return 50.0;
      case 'navigational':
        return 40.0;  
      case 'profile':
        return 0.3;
      default:
        return 50.0;
    }
  }

  /**
   * Calculate scientifically accurate orbit scaling
   */
  private calculateScientificOrbitScaling(context: CalculationContext): number {
    // Create scaling service with optimal configuration
    const scalingConfig = AstronomicalScalingService.getOptimalConfiguration(context.objects);
    const astronomicalService = new AstronomicalScalingService(scalingConfig);
    
    // Use Earth's orbit (1 AU) as the reference for scaling factor
    const earthReference = context.objects.find(obj => obj.id === 'earth');
    if (earthReference) {
      const orbitResult = astronomicalService.calculateOrbitDistance(earthReference);
      // Return the scaling factor that makes 1 AU = target units
      const scalingFactor = orbitResult.orbitRadius / orbitResult.realOrbitAU;
      
      console.log(`🔬 SCIENTIFIC ORBIT SCALING: ${scalingFactor.toFixed(2)} units per AU`);
      console.log(`   🌍 Earth orbit: ${orbitResult.realOrbitAU} AU = ${orbitResult.orbitRadius} units`);
      
      return scalingFactor;
    }
    
    // Fallback to default target: 100 units = 1 AU
    return scalingConfig.targetEarthOrbitInUnits;
  }
  
  /**
   * Calculate orbit distance for stars around a barycenter
   */
  private async calculateBarycenterOrbitDistance(
    star: CelestialObject,
    context: CalculationContext
  ): Promise<number> {
    if (!star.orbit || !('semi_major_axis' in star.orbit)) {
      return 0;
    }
    
    const orbitScaling = this.getOrbitScaling(context);
    const orbitalBehavior = context.strategy.getOrbitalBehavior();
    
    if (orbitalBehavior.useEquidistantSpacing) {
      // For navigational/profile modes, use a simplified spacing
      // Get all stars with barycenter orbits to determine spacing
      const binaryStars = context.objects.filter(obj => 
        obj.classification === 'star' && 
        obj.orbit?.parent === 'barycenter'
      );
      
      // Sort by semi_major_axis for consistent ordering
      const sortedStars = binaryStars
        .sort((a, b) => {
          const aAxis = (a.orbit as any)?.semi_major_axis || 0;
          const bAxis = (b.orbit as any)?.semi_major_axis || 0;
          return aAxis - bAxis;
        });
      
      const starIndex = sortedStars.findIndex(s => s.id === star.id);
      if (starIndex === -1) return 0;
      
      // Use equidistant spacing for binary stars
      const { orbital } = context.config;
      const baseSpacing = orbital.equidistantSpacing.baseSpacing * 2; // Larger spacing for stars
      const spacingMultiplier = orbital.equidistantSpacing.spacingMultiplier;
      
      return baseSpacing + (starIndex * baseSpacing * spacingMultiplier);
    } else {
      // Use scaled astronomical distances for realistic positioning
      const baseDistance = star.orbit.semi_major_axis;
      
      // Apply view-mode specific scaling but keep it reasonable for binary stars
      const scalingFactor = orbitScaling * 0.1; // Reduce scaling for stars to keep them visible
      
      // Ensure minimum distance for visibility
      const minDistance = 5.0; // Minimum distance to keep stars visible and clickable
      
      return Math.max(baseDistance * scalingFactor, minDistance);
    }
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
}