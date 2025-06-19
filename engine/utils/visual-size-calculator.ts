/**
 * VISUAL SIZE CALCULATOR
 * ======================
 * 
 * Modular system for calculating object visual sizes that preserves realistic
 * proportions while keeping everything in Three.js optimal range.
 * 
 * DESIGN PRINCIPLES:
 * - Earth is the reference object for all size calculations
 * - Realistic ratios are preserved wherever possible
 * - All sizes stay within Three.js optimal range (0.1-10 units)
 * - Magic numbers are eliminated in favor of contextual constants
 */

import type { CelestialObject } from '../types/orbital-system'
import type { ViewType } from '@lib/types/effects-level'

// REFERENCE CONSTANTS - Real astronomical data for proportional scaling
const EARTH_RADIUS_KM = 6371        // Earth's actual radius in kilometers
const MARS_RADIUS_KM = 3390         // Mars radius (0.53x Earth)
const JUPITER_RADIUS_KM = 69911     // Jupiter radius (11.2x Earth)
const SUN_RADIUS_KM = 695700        // Sun radius (109x Earth)

// SIZE RANGE CONSTANTS - Three.js optimal precision targets
const OPTIMAL_MIN_SIZE = 0.1         // Minimum for good Three.js precision
const OPTIMAL_MAX_SIZE = 10.0        // Maximum for reasonable UI scale
const EARTH_TARGET_RATIO = 0.3       // Earth should be 30% through the size range

// COMPRESSION THRESHOLDS - Where to apply scaling compression for very large objects
// ADJUSTED: Allow gas giants like Jupiter (11x Earth) to use direct scaling
const DIRECT_SCALING_THRESHOLD = 15.0   // Objects ≤15x Earth: direct proportional scaling  
const GENTLE_COMPRESSION_THRESHOLD = 50.0   // Objects >15x Earth: gentle compression
const STAR_COMPRESSION_THRESHOLD = 100.0    // Stars >50x Earth: logarithmic compression

export interface VisualSizeConfig {
  minVisualSize: number
  maxVisualSize: number
  earthTargetSize?: number  // Override default Earth size calculation
  preserveRatios: boolean   // Whether to preserve realistic size ratios
}

export interface VisualSizeCalculation {
  visualSize: number
  earthRatio: number        // Size relative to Earth
  compressionApplied: boolean
  targetRange: { min: number; max: number }
  metadata: {
    earthTargetSize: number
    compressionType: 'none' | 'gentle' | 'logarithmic'
    clampedToMinimum: boolean
  }
}

/**
 * Calculate visual size for an object with proper proportional scaling
 * 
 * GOTCHA: Always pass the same allObjects array to ensure consistent Earth reference
 * GOTCHA: Config changes require recalculation of all objects for consistent ratios
 */
export function calculateVisualSize(
  object: CelestialObject,
  config: VisualSizeConfig,
  allObjects: CelestialObject[],
  viewType: ViewType
): VisualSizeCalculation {
  const objectRadiusKm = object.properties.radius || 1
  
  // Find Earth as reference object - CRITICAL for consistent proportional scaling
  const earthObject = allObjects.find(obj => 
    obj.name?.toLowerCase() === 'earth' || 
    obj.id?.toLowerCase() === 'earth'
  )
  const earthRadiusKm = earthObject?.properties.radius || EARTH_RADIUS_KM
  
  // Calculate real size ratio relative to Earth
  const earthRatio = objectRadiusKm / earthRadiusKm
  
  // Determine Earth's target size in the visual range
  const earthTargetSize = config.earthTargetSize || calculateEarthTargetSize(config)
  
  let visualSize: number
  let compressionType: 'none' | 'gentle' | 'logarithmic' = 'none'
  
  if (!config.preserveRatios) {
    // Non-proportional scaling - use fixed sizes or simple scaling
    visualSize = earthTargetSize
  } else if (earthRatio <= DIRECT_SCALING_THRESHOLD) {
    // DIRECT PROPORTIONAL SCALING for objects ≤5x Earth size
    // This preserves exact ratios for terrestrial planets and small gas giants
    visualSize = earthTargetSize * earthRatio
  } else if (earthRatio <= GENTLE_COMPRESSION_THRESHOLD) {
    // GENTLE COMPRESSION for medium-large objects (5x-20x Earth)
    // Uses square root compression to preserve most of the size difference
    // while preventing UI elements from becoming too large
    const compressedRatio = DIRECT_SCALING_THRESHOLD + Math.sqrt(earthRatio - DIRECT_SCALING_THRESHOLD) * 1.5
    visualSize = earthTargetSize * compressedRatio
    compressionType = 'gentle'
  } else {
    // STRONG COMPRESSION for very large objects (>50x Earth, typically stars)
    // CRITICAL FIX: Stars were too large relative to orbits, causing Mercury-Sol collision
    // Apply much stronger compression to keep stars manageable relative to inner planets
    const logBase = GENTLE_COMPRESSION_THRESHOLD
    const compressedRatio = logBase + Math.log10(earthRatio / logBase) * 3  // Reduced from 8 to 3
    visualSize = earthTargetSize * compressedRatio
    compressionType = 'logarithmic'
  }
  
  // Ensure size stays within optimal Three.js range
  const clampedSize = Math.max(Math.min(visualSize, config.maxVisualSize), config.minVisualSize)
  const clampedToMinimum = clampedSize === config.minVisualSize && visualSize < config.minVisualSize
  
  return {
    visualSize: clampedSize,
    earthRatio,
    compressionApplied: compressionType !== 'none',
    targetRange: { min: config.minVisualSize, max: config.maxVisualSize },
    metadata: {
      earthTargetSize,
      compressionType,
      clampedToMinimum
    }
  }
}

/**
 * Calculate Earth's target size within the visual range
 * 
 * Places Earth at a strategic position to maximize the useful range
 * for both smaller (terrestrial planets) and larger (gas giants) objects
 */
function calculateEarthTargetSize(config: VisualSizeConfig): number {
  const sizeRange = config.maxVisualSize - config.minVisualSize
  
  // Place Earth at 30% through the range to leave room for:
  // - Smaller objects (Mars, Mercury) below Earth
  // - Larger objects (Jupiter, Saturn) above Earth
  // - Very large objects (stars) in the compressed upper range
  return config.minVisualSize + (sizeRange * EARTH_TARGET_RATIO)
}

/**
 * Validate that a size configuration will produce reasonable results
 * 
 * GOTCHA: Small size ranges can cause all objects to clamp to min/max values
 * GOTCHA: Earth target size affects all proportional calculations
 */
export function validateSizeConfig(config: VisualSizeConfig): {
  isValid: boolean
  warnings: string[]
  earthTargetSize: number
} {
  const warnings: string[] = []
  const earthTargetSize = calculateEarthTargetSize(config)
  
  // Check if size range is adequate for realistic proportions
  const sizeRange = config.maxVisualSize - config.minVisualSize
  if (sizeRange < 2.0) {
    warnings.push(`Size range (${sizeRange.toFixed(1)}) may be too small for realistic proportions`)
  }
  
  // Check if Earth target size leaves room for smaller objects
  const earthMinRatio = earthTargetSize / config.minVisualSize
  if (earthMinRatio < 2.0) {
    warnings.push(`Earth target size too close to minimum - small planets may be clamped`)
  }
  
  // Check if Earth target size leaves room for larger objects
  const earthMaxRatio = config.maxVisualSize / earthTargetSize
  if (earthMaxRatio < 3.0) {
    warnings.push(`Earth target size too close to maximum - large planets may be clamped`)
  }
  
  return {
    isValid: warnings.length === 0,
    warnings,
    earthTargetSize
  }
}

/**
 * Get visual size configuration for a view mode
 * 
 * Centralizes all size-related magic numbers with contextual documentation
 */
export function getVisualSizeConfigForViewMode(viewType: ViewType): VisualSizeConfig {
  switch (viewType) {
    case 'scientific':
      return {
        minVisualSize: OPTIMAL_MIN_SIZE,        // Three.js precision minimum
        maxVisualSize: OPTIMAL_MAX_SIZE * 4,    // Allow larger for realistic gas giant ratios (40 units max)
        preserveRatios: true,                   // Maintain realistic proportions
        // Earth at 3.0 units allows Mars (0.53x) = 1.6 units, Jupiter (11.2x) = 33.6 units
        earthTargetSize: 3.0
      }
      
    case 'explorational':
      return {
        minVisualSize: OPTIMAL_MIN_SIZE,
        maxVisualSize: OPTIMAL_MAX_SIZE * 0.8,  // Slightly smaller max for education
        preserveRatios: true,
        earthTargetSize: 2.5                    // Balanced for exploration
      }
      
    case 'navigational':
      return {
        minVisualSize: OPTIMAL_MIN_SIZE * 2,    // Larger minimum for navigation clarity
        maxVisualSize: OPTIMAL_MAX_SIZE * 0.6,  // Smaller maximum for consistent UI
        preserveRatios: false,                  // Fixed sizes for navigation
        earthTargetSize: 2.0
      }
      
    case 'profile':
      return {
        minVisualSize: OPTIMAL_MIN_SIZE * 3,    // Large minimum for profile view clarity
        maxVisualSize: OPTIMAL_MAX_SIZE * 0.4,  // Small maximum for diagrammatic view
        preserveRatios: false,                  // Fixed sizes for profile
        earthTargetSize: 1.5
      }
      
    default:
      return getVisualSizeConfigForViewMode('explorational')
  }
}