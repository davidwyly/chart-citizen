/**
 * Astronomical Scaling Service
 * ============================
 * 
 * Provides true-to-scale astronomical calculations using real astronomical data.
 * Implements scientifically accurate scaling based on actual physical measurements.
 */

import type { CelestialObject } from '@/engine/types/orbital-system';
import type { ViewType } from '@lib/types/effects-level';

// Real astronomical constants in SI units
export const ASTRONOMICAL_CONSTANTS = {
  // Distance constants
  AU_IN_KM: 149597870.7,                    // 1 AU in kilometers
  EARTH_RADIUS_KM: 6371.0,                  // Earth radius in km
  SUN_RADIUS_KM: 695700.0,                  // Sun radius in km
  
  // Mass constants (in Earth masses)
  EARTH_MASS_KG: 5.972e24,                  // Earth mass in kg
  SUN_MASS_KG: 1.989e30,                    // Sun mass in kg (333,000 Earth masses)
  
  // Useful ratios
  SUN_TO_EARTH_RADIUS_RATIO: 109.0,        // Sun radius / Earth radius
  SUN_TO_EARTH_MASS_RATIO: 333000.0,       // Sun mass / Earth mass
  
  // Scale factors for visualization
  MIN_VISUAL_RADIUS: 0.001,                // Minimum visible size in scene units
  MAX_VISUAL_RADIUS: 1000.0,               // Maximum size before becoming unwieldy
  BASE_SCALE_FACTOR: 1.0,                  // Base scaling for scene units
} as const;

export interface AstronomicalScaleResult {
  readonly visualRadius: number;           // Object radius in scene units
  readonly realRadiusKm: number;          // Actual radius in kilometers
  readonly scaleFactorUsed: number;       // Scale factor applied
  readonly isToScale: boolean;            // Whether scaling is truly proportional
  readonly scalingMethod: 'proportional' | 'logarithmic' | 'hybrid' | 'fixed';
  readonly relativeToEarth: number;       // Size relative to Earth (1.0 = Earth size)
}

export interface AstronomicalOrbitResult {
  readonly orbitRadius: number;           // Orbit radius in scene units
  readonly realOrbitKm: number;          // Actual orbit distance in km
  readonly realOrbitAU: number;          // Actual orbit distance in AU
  readonly scaleFactorUsed: number;      // Scale factor applied
  readonly isToScale: boolean;           // Whether scaling is truly proportional
  readonly relativeToEarth: number;      // Distance relative to Earth's orbit
}

export interface ScientificScaleConfiguration {
  readonly targetEarthRadiusInUnits: number;    // How big Earth should appear (in scene units)
  readonly targetEarthOrbitInUnits: number;     // How far Earth's orbit should be (in scene units)
  readonly useLogarithmicForExtremes: boolean;  // Use log scaling for very large/small objects
  readonly extremeThresholdRatio: number;       // Ratio beyond which to use log scaling
  readonly maintainVisibility: boolean;         // Ensure all objects remain visible
}

export class AstronomicalScalingService {
  private readonly config: ScientificScaleConfiguration;

  constructor(config?: Partial<ScientificScaleConfiguration>) {
    this.config = {
      targetEarthRadiusInUnits: 1.0,           // Earth = 1 unit radius
      targetEarthOrbitInUnits: 100.0,          // Earth orbit = 100 units
      useLogarithmicForExtremes: true,         // Use log scaling for extreme sizes
      extremeThresholdRatio: 1000.0,           // Objects >1000x Earth size use log scaling
      maintainVisibility: true,                // Keep objects visible
      ...config
    };
  }

  /**
   * Calculate object size using real astronomical data
   */
  calculateObjectSize(object: CelestialObject, earthReference?: CelestialObject): AstronomicalScaleResult {
    // Get object radius in kilometers
    const objectRadiusKm = this.extractRadiusKm(object);
    const earthRadiusKm = earthReference ? 
      this.extractRadiusKm(earthReference) : 
      ASTRONOMICAL_CONSTANTS.EARTH_RADIUS_KM;

    // Calculate true proportional ratio
    const realRatio = objectRadiusKm / earthRadiusKm;
    
    // Calculate visual radius based on real proportions
    const baseVisualRadius = realRatio * this.config.targetEarthRadiusInUnits;
    
    // Determine if we need special scaling for extreme sizes
    const needsLogarithmicScaling = this.config.useLogarithmicForExtremes && 
                                   realRatio > this.config.extremeThresholdRatio;
    
    let visualRadius: number;
    let scalingMethod: AstronomicalScaleResult['scalingMethod'];
    let isToScale: boolean;
    
    if (needsLogarithmicScaling) {
      // Use logarithmic scaling for extreme objects (like the Sun relative to Earth)
      visualRadius = this.config.targetEarthRadiusInUnits * Math.log10(realRatio + 1) * 2;
      scalingMethod = 'logarithmic';
      isToScale = false;
    } else if (baseVisualRadius < ASTRONOMICAL_CONSTANTS.MIN_VISUAL_RADIUS) {
      // Ensure minimum visibility
      visualRadius = this.config.maintainVisibility ? 
        ASTRONOMICAL_CONSTANTS.MIN_VISUAL_RADIUS : 
        baseVisualRadius;
      scalingMethod = 'hybrid';
      isToScale = !this.config.maintainVisibility;
    } else if (baseVisualRadius > ASTRONOMICAL_CONSTANTS.MAX_VISUAL_RADIUS) {
      // Cap maximum size for usability
      visualRadius = ASTRONOMICAL_CONSTANTS.MAX_VISUAL_RADIUS;
      scalingMethod = 'hybrid';
      isToScale = false;
    } else {
      // True proportional scaling
      visualRadius = baseVisualRadius;
      scalingMethod = 'proportional';
      isToScale = true;
    }

    return {
      visualRadius,
      realRadiusKm: objectRadiusKm,
      scaleFactorUsed: visualRadius / objectRadiusKm,
      isToScale,
      scalingMethod,
      relativeToEarth: realRatio
    };
  }

  /**
   * Calculate orbit distance using real astronomical data
   */
  calculateOrbitDistance(object: CelestialObject, earthReference?: CelestialObject): AstronomicalOrbitResult {
    if (!object.orbit || !('semi_major_axis' in object.orbit)) {
      return this.createZeroOrbitResult();
    }

    // Get orbit distance in AU and convert to km
    const orbitAU = object.orbit.semi_major_axis;
    const orbitKm = orbitAU * ASTRONOMICAL_CONSTANTS.AU_IN_KM;
    
    // Use Earth's orbit as reference (1 AU)
    const earthOrbitAU = 1.0;
    const realRatio = orbitAU / earthOrbitAU;
    
    // Calculate visual orbit distance based on real proportions
    const baseOrbitRadius = realRatio * this.config.targetEarthOrbitInUnits;
    
    // For scientific mode, we want to maintain true proportions as much as possible
    // Only apply constraints if absolutely necessary for usability
    let orbitRadius = baseOrbitRadius;
    let isToScale = true;
    
    // Ensure minimum distance for clickability
    if (orbitRadius < 1.0 && this.config.maintainVisibility) {
      orbitRadius = 1.0;
      isToScale = false;
    }
    
    return {
      orbitRadius,
      realOrbitKm: orbitKm,
      realOrbitAU: orbitAU,
      scaleFactorUsed: orbitRadius / orbitKm,
      isToScale,
      relativeToEarth: realRatio
    };
  }

  /**
   * Calculate scaling for an entire system to ensure coherent proportions
   */
  calculateSystemScaling(
    objects: CelestialObject[], 
    earthReference?: CelestialObject
  ): {
    objectSizes: Map<string, AstronomicalScaleResult>;
    orbitDistances: Map<string, AstronomicalOrbitResult>;
    systemMetrics: {
      totalSizeRange: number;
      totalOrbitRange: number;
      averageScaleFactor: number;
      isFullyToScale: boolean;
    };
  } {
    const objectSizes = new Map<string, AstronomicalScaleResult>();
    const orbitDistances = new Map<string, AstronomicalOrbitResult>();
    
    // Find Earth reference if not provided
    const earthRef = earthReference || objects.find(obj => obj.id === 'earth');
    
    let minSize = Infinity;
    let maxSize = 0;
    let minOrbit = Infinity;
    let maxOrbit = 0;
    let totalScaleFactor = 0;
    let scaleFactorCount = 0;
    let allToScale = true;
    
    // Calculate sizes and orbits for all objects
    for (const object of objects) {
      // Calculate object size
      const sizeResult = this.calculateObjectSize(object, earthRef);
      objectSizes.set(object.id, sizeResult);
      
      minSize = Math.min(minSize, sizeResult.visualRadius);
      maxSize = Math.max(maxSize, sizeResult.visualRadius);
      totalScaleFactor += sizeResult.scaleFactorUsed;
      scaleFactorCount++;
      
      if (!sizeResult.isToScale) {
        allToScale = false;
      }
      
      // Calculate orbit distance
      const orbitResult = this.calculateOrbitDistance(object, earthRef);
      orbitDistances.set(object.id, orbitResult);
      
      if (orbitResult.orbitRadius > 0) {
        minOrbit = Math.min(minOrbit, orbitResult.orbitRadius);
        maxOrbit = Math.max(maxOrbit, orbitResult.orbitRadius);
        
        if (!orbitResult.isToScale) {
          allToScale = false;
        }
      }
    }
    
    return {
      objectSizes,
      orbitDistances,
      systemMetrics: {
        totalSizeRange: maxSize / minSize,
        totalOrbitRange: maxOrbit / (minOrbit === Infinity ? 1 : minOrbit),
        averageScaleFactor: totalScaleFactor / Math.max(scaleFactorCount, 1),
        isFullyToScale: allToScale
      }
    };
  }

  /**
   * Get the optimal scientific scale configuration for a given system
   */
  static getOptimalConfiguration(objects: CelestialObject[]): ScientificScaleConfiguration {
    // Analyze the system to determine optimal scaling
    const hasStars = objects.some(obj => obj.classification === 'star');
    const hasMoons = objects.some(obj => obj.classification === 'moon');
    
    // Filter objects with valid radius data
    const objectsWithRadius = objects.filter(obj => obj.properties?.radius && obj.properties.radius > 0);
    
    let sizeRange = 1;
    if (objectsWithRadius.length > 1) {
      const maxRadius = Math.max(...objectsWithRadius.map(obj => obj.properties!.radius));
      const minRadius = Math.min(...objectsWithRadius.map(obj => obj.properties!.radius));
      sizeRange = maxRadius / minRadius;
    }
    
    return {
      targetEarthRadiusInUnits: hasStars ? 0.1 : 1.0,  // Smaller Earth if stars present
      targetEarthOrbitInUnits: hasMoons ? 50.0 : 100.0, // Smaller orbits if moons present
      useLogarithmicForExtremes: hasStars || sizeRange > 100, // Use log scaling for stars or extreme ranges
      extremeThresholdRatio: hasStars ? 10.0 : 1000.0, // Lower threshold with stars
      maintainVisibility: true                          // Always maintain visibility
    };
  }

  /**
   * Extract radius in kilometers from object data
   */
  private extractRadiusKm(object: CelestialObject): number {
    // Radius should be in kilometers in the data
    const radius = object.properties?.radius || 0;
    
    // Handle different possible units or fallbacks
    if (radius > 0) {
      return radius;
    }
    
    // Fallback based on classification
    switch (object.classification) {
      case 'star':
        return ASTRONOMICAL_CONSTANTS.SUN_RADIUS_KM;
      case 'planet':
        return ASTRONOMICAL_CONSTANTS.EARTH_RADIUS_KM;
      case 'moon':
        return ASTRONOMICAL_CONSTANTS.EARTH_RADIUS_KM * 0.27; // Luna-like
      default:
        return 1000; // 1000 km fallback
    }
  }

  /**
   * Create a zero orbit result for objects without orbits
   */
  private createZeroOrbitResult(): AstronomicalOrbitResult {
    return {
      orbitRadius: 0,
      realOrbitKm: 0,
      realOrbitAU: 0,
      scaleFactorUsed: 0,
      isToScale: true,
      relativeToEarth: 0
    };
  }
}