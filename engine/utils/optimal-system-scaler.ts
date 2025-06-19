/**
 * OPTIMAL SYSTEM SCALER
 * =====================
 * 
 * Scales entire star systems to fit within Three.js optimal floating point
 * precision range (0.1 to 1000 units) for maximum rendering quality and
 * performance across all view modes.
 */

import type { CelestialObject } from '../types/orbital-system'
import type { ViewType } from '@lib/types/effects-level'

export interface SystemScaleInfo {
  targetRange: { min: number; max: number }
  originalRange: { min: number; max: number }
  scaleFactor: number
  systemType: 'micro' | 'normal' | 'large' | 'extreme'
  metadata: {
    largestOrbit: number
    smallestOrbit: number
    orbitRange: number
    recommendedScaling: number
  }
}

/**
 * Calculate optimal scaling factor for a star system to fit Three.js sweet spot
 */
export function calculateOptimalSystemScale(
  systemData: CelestialObject[],
  viewType: ViewType
): SystemScaleInfo {
  // Three.js optimal range: comfortable middle of floating point precision
  const TARGET_MIN = 0.1
  const TARGET_MAX = 800  // Leave room for camera movement and effects
  
  // Analyze the system's orbital distances
  const orbitDistances = systemData
    .filter(obj => obj.orbit?.semi_major_axis)
    .map(obj => obj.orbit!.semi_major_axis!)
    .sort((a, b) => a - b)
  
  if (orbitDistances.length === 0) {
    // Star-only system
    return {
      targetRange: { min: TARGET_MIN, max: TARGET_MAX },
      originalRange: { min: 0, max: 1 },
      scaleFactor: 100, // Default to mid-range
      systemType: 'normal',
      metadata: {
        largestOrbit: 0,
        smallestOrbit: 0,
        orbitRange: 0,
        recommendedScaling: 100
      }
    }
  }
  
  const smallestOrbit = orbitDistances[0]
  const largestOrbit = orbitDistances[orbitDistances.length - 1]
  const orbitRange = largestOrbit / smallestOrbit
  
  // Determine system type
  let systemType: SystemScaleInfo['systemType']
  if (largestOrbit < 1.0) {
    systemType = 'micro'      // Proxima Centauri type
  } else if (largestOrbit < 50.0) {
    systemType = 'normal'     // Solar System type
  } else if (largestOrbit < 500.0) {
    systemType = 'large'      // Wide binary systems
  } else {
    systemType = 'extreme'    // Alpha Centauri type
  }
  
  // Calculate scale factor to fit largest orbit into target range
  // Target the largest orbit to be around 60% of max range for comfortable margins
  const targetLargestOrbit = TARGET_MAX * 0.6  // ~480 units
  const baseFactor = targetLargestOrbit / largestOrbit
  
  // Ensure smallest orbit isn't too small (min 0.5 units for precision)
  const minConstraintFactor = 0.5 / smallestOrbit
  
  // Use the more restrictive factor
  const scaleFactor = Math.max(baseFactor, minConstraintFactor)
  
  // Validate the scaled range
  const scaledSmallest = smallestOrbit * scaleFactor
  const scaledLargest = largestOrbit * scaleFactor
  
  return {
    targetRange: { min: TARGET_MIN, max: TARGET_MAX },
    originalRange: { min: smallestOrbit, max: largestOrbit },
    scaleFactor,
    systemType,
    metadata: {
      largestOrbit,
      smallestOrbit,
      orbitRange,
      recommendedScaling: scaleFactor
    }
  }
}

/**
 * Get view-mode-specific scaling adjustments
 * All modes now target the same optimal range but with different visual emphasis
 */
export function getViewModeScalingAdjustment(
  viewType: ViewType,
  baseScale: SystemScaleInfo
): number {
  const adjustments = {
    // Scientific: True proportions in optimal range
    scientific: 1.0,
    
    // Explorational: Slightly compressed for better navigation
    explorational: 0.8,
    
    // Navigational: More compressed, fixed spacing
    navigational: 0.6,
    
    // Profile: Heavily compressed for overview
    profile: 0.4
  }
  
  return baseScale.scaleFactor * (adjustments[viewType] || 1.0)
}

/**
 * Calculate optimal orbital scaling for view mode configurations
 */
export function calculateOptimalOrbitScaling(
  systemData: CelestialObject[],
  viewType: ViewType
): number {
  const scaleInfo = calculateOptimalSystemScale(systemData, viewType)
  return getViewModeScalingAdjustment(viewType, scaleInfo)
}

/**
 * Validate that scaled system fits within Three.js optimal range
 */
export function validateSystemScale(
  systemData: CelestialObject[],
  orbitScaling: number
): {
  isOptimal: boolean
  issues: string[]
  recommendations: string[]
} {
  const issues: string[] = []
  const recommendations: string[] = []
  
  // Check orbit distances
  const scaledOrbits = systemData
    .filter(obj => obj.orbit?.semi_major_axis)
    .map(obj => obj.orbit!.semi_major_axis! * orbitScaling)
  
  if (scaledOrbits.length > 0) {
    const minOrbit = Math.min(...scaledOrbits)
    const maxOrbit = Math.max(...scaledOrbits)
    
    if (minOrbit < 0.1) {
      issues.push(`Smallest orbit (${minOrbit.toFixed(3)}) below Three.js optimal range (0.1)`)
      recommendations.push('Increase orbitScaling factor')
    }
    
    if (maxOrbit > 1000) {
      issues.push(`Largest orbit (${maxOrbit.toFixed(0)}) above Three.js optimal range (1000)`)
      recommendations.push('Decrease orbitScaling factor')
    }
    
    if (maxOrbit / minOrbit > 10000) {
      issues.push(`Orbit range ratio (${(maxOrbit / minOrbit).toFixed(0)}) may cause precision issues`)
      recommendations.push('Consider view-mode-specific scaling')
    }
  }
  
  return {
    isOptimal: issues.length === 0,
    issues,
    recommendations
  }
}