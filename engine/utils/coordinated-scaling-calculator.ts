/**
 * COORDINATED SCALING CALCULATOR
 * ==============================
 * 
 * Coordinates object visual sizes and orbital distances to maintain proper
 * spacing and visual proportions. This solves the "cramped system" problem
 * where scaling objects up requires scaling orbits out proportionally.
 * 
 * DESIGN PRINCIPLE:
 * As visual object sizes increase, orbital distances must increase proportionally
 * to maintain the same visual spacing ratios. This ensures systems don't look
 * cramped when objects are made larger for better visibility.
 */

import type { CelestialObject } from '../types/orbital-system'
import type { ViewType } from '@lib/types/effects-level'
import { getVisualSizeConfigForViewMode } from './visual-size-calculator'

// REFERENCE SCALING FACTORS - Based on real solar system proportions
const EARTH_RADIUS_KM = 6371
const EARTH_ORBIT_AU = 1.0
const JUPITER_RADIUS_KM = 69911
const JUPITER_ORBIT_AU = 5.2

// VISUAL SPACING CONSTANTS - Target visual clearance between objects
const MIN_CLEARANCE_RATIO = 3.0      // Minimum 3x object radius clearance
const PREFERRED_CLEARANCE_RATIO = 5.0 // Preferred 5x object radius clearance

export interface CoordinatedScaling {
  visualSizeMultiplier: number      // How much to scale object sizes
  orbitDistanceMultiplier: number   // How much to scale orbital distances
  systemSizeMultiplier: number      // Overall system scale factor
  targetRange: { min: number; max: number }
  metadata: {
    earthVisualSize: number
    earthOrbitDistance: number
    jupiterVisualSize: number
    jupiterOrbitDistance: number
    systemSpread: number             // Diameter of outermost orbit
    visualDensity: number            // Ratio of object sizes to orbital spacing
  }
}

/**
 * Calculate coordinated scaling factors for visual sizes and orbital distances
 * 
 * STRATEGY:
 * 1. Start with desired visual size scaling (for object visibility)
 * 2. Calculate required orbit scaling to maintain visual spacing
 * 3. Ensure everything fits in Three.js optimal range
 * 4. Apply coordinated scaling to both sizes and orbits
 */
export function calculateCoordinatedScaling(
  systemData: CelestialObject[],
  viewType: ViewType
): CoordinatedScaling {
  // Get the visual size configuration for this view mode
  const sizeConfig = getVisualSizeConfigForViewMode(viewType)
  
  // Find key reference objects for scaling calculations
  const earthObject = systemData.find(obj => 
    obj.name?.toLowerCase() === 'earth' || obj.id?.toLowerCase() === 'earth'
  )
  const jupiterObject = systemData.find(obj =>
    obj.name?.toLowerCase() === 'jupiter' || obj.id?.toLowerCase() === 'jupiter'
  )
  
  // Calculate target visual sizes using the configured Earth target
  const earthTargetSize = sizeConfig.earthTargetSize || 3.0
  const earthRealRatio = (earthObject?.properties.radius || EARTH_RADIUS_KM) / EARTH_RADIUS_KM
  const jupiterRealRatio = (jupiterObject?.properties.radius || JUPITER_RADIUS_KM) / EARTH_RADIUS_KM
  
  const earthVisualSize = earthTargetSize * earthRealRatio
  const jupiterVisualSize = earthTargetSize * jupiterRealRatio
  
  // Calculate visual size multiplier relative to a baseline
  const baselineEarthSize = 1.0  // Baseline Earth size for comparison
  const visualSizeMultiplier = earthVisualSize / baselineEarthSize
  
  // Calculate required orbital distances to maintain visual spacing
  // CRITICAL: As objects get larger, orbits must scale proportionally to avoid crowding
  
  // Find the largest orbit in the system
  const maxOrbitAU = Math.max(
    ...systemData
      .filter(obj => obj.orbit?.semi_major_axis)
      .map(obj => obj.orbit!.semi_major_axis!)
  ) || JUPITER_ORBIT_AU
  
  // Calculate the largest visual object size
  const maxVisualSize = Math.max(earthVisualSize, jupiterVisualSize)
  
  // Determine required orbit scaling to maintain clearance
  // Rule: Orbital spacing should be at least 5x the largest object radius
  const requiredOrbitSpacing = maxVisualSize * PREFERRED_CLEARANCE_RATIO
  const baselineOrbitSpacing = 2.0  // Baseline spacing assumption
  const minOrbitMultiplier = requiredOrbitSpacing / baselineOrbitSpacing
  
  // Choose orbit multiplier that provides adequate spacing
  const orbitDistanceMultiplier = Math.max(
    minOrbitMultiplier,
    visualSizeMultiplier * 0.8  // Scale orbits roughly with object sizes
  )
  
  // Calculate system-wide scale factor
  const systemSizeMultiplier = Math.sqrt(visualSizeMultiplier * orbitDistanceMultiplier)
  
  // Calculate final scaled values for reference objects
  const earthOrbitDistance = EARTH_ORBIT_AU * orbitDistanceMultiplier
  const jupiterOrbitDistance = JUPITER_ORBIT_AU * orbitDistanceMultiplier
  const systemSpread = maxOrbitAU * orbitDistanceMultiplier * 2 // Diameter
  
  // Calculate visual density (ratio of object sizes to spacing)
  const visualDensity = maxVisualSize / (earthOrbitDistance * 0.5)
  
  return {
    visualSizeMultiplier,
    orbitDistanceMultiplier,
    systemSizeMultiplier,
    targetRange: { min: 0.1, max: 1000 }, // Three.js optimal range
    metadata: {
      earthVisualSize,
      earthOrbitDistance,
      jupiterVisualSize,
      jupiterOrbitDistance,
      systemSpread,
      visualDensity
    }
  }
}

/**
 * Get coordinated scaling configuration for view modes
 * 
 * Each view mode has different priorities for visual clarity vs. scale accuracy
 */
export function getCoordinatedScalingForViewMode(viewType: ViewType): {
  orbitScaling: number
  visualSizeRange: { min: number; max: number }
  coordinated: boolean
} {
  // Calculate coordinated scaling for a typical solar system
  const sampleSystem: CelestialObject[] = [
    {
      id: 'star',
      name: 'Star',
      classification: 'star',
      geometry_type: 'star',
      properties: { radius: 695700 },
      position: [0, 0, 0]
    },
    {
      id: 'earth',
      name: 'Earth',
      classification: 'planet',
      geometry_type: 'terrestrial',
      properties: { radius: EARTH_RADIUS_KM },
      orbit: { parent: 'star', semi_major_axis: EARTH_ORBIT_AU, eccentricity: 0, inclination: 0, orbital_period: 365 }
    },
    {
      id: 'jupiter',
      name: 'Jupiter',
      classification: 'planet',
      geometry_type: 'gas_giant',
      properties: { radius: JUPITER_RADIUS_KM },
      orbit: { parent: 'star', semi_major_axis: JUPITER_ORBIT_AU, eccentricity: 0, inclination: 0, orbital_period: 4333 }
    }
  ]
  
  const coordinated = calculateCoordinatedScaling(sampleSystem, viewType)
  
  switch (viewType) {
    case 'scientific':
      return {
        orbitScaling: coordinated.orbitDistanceMultiplier,
        visualSizeRange: { min: 0.1, max: 40 },
        coordinated: true
      }
      
    case 'explorational':
      return {
        orbitScaling: coordinated.orbitDistanceMultiplier * 0.8, // Slightly more compact
        visualSizeRange: { min: 0.1, max: 8 },
        coordinated: true
      }
      
    case 'navigational':
      return {
        orbitScaling: coordinated.orbitDistanceMultiplier * 0.6, // More compact for navigation
        visualSizeRange: { min: 0.2, max: 6 },
        coordinated: false // Use fixed sizes
      }
      
    case 'profile':
      return {
        orbitScaling: coordinated.orbitDistanceMultiplier * 0.4, // Very compact for overview
        visualSizeRange: { min: 0.3, max: 4 },
        coordinated: false // Use fixed sizes
      }
      
    default:
      return getCoordinatedScalingForViewMode('explorational')
  }
}

/**
 * Validate that coordinated scaling produces reasonable results
 */
export function validateCoordinatedScaling(scaling: CoordinatedScaling): {
  isValid: boolean
  warnings: string[]
  recommendations: string[]
} {
  const warnings: string[] = []
  const recommendations: string[] = []
  
  // Check visual density - objects shouldn't be too crowded or too sparse
  if (scaling.metadata.visualDensity > 0.4) {
    warnings.push('Objects may appear crowded - consider increasing orbit scaling')
    recommendations.push('Increase orbitDistanceMultiplier by 20-30%')
  }
  
  if (scaling.metadata.visualDensity < 0.05) {
    warnings.push('Objects may appear too sparse - consider decreasing orbit scaling')
    recommendations.push('Decrease orbitDistanceMultiplier by 20-30%')
  }
  
  // Check system spread - should fit reasonably in Three.js range
  if (scaling.metadata.systemSpread > 800) {
    warnings.push('System spread may be too large for optimal Three.js performance')
    recommendations.push('Consider compressing both size and orbit scaling')
  }
  
  if (scaling.metadata.systemSpread < 50) {
    warnings.push('System spread may be too small - objects could overlap')
    recommendations.push('Increase orbit scaling to provide more spacing')
  }
  
  // Check object sizes - should be visible but not overwhelming
  if (scaling.metadata.jupiterVisualSize > 50) {
    warnings.push('Large objects may overwhelm UI - consider size compression')
    recommendations.push('Apply gentle compression to objects >20x Earth size')
  }
  
  return {
    isValid: warnings.length === 0,
    warnings,
    recommendations
  }
}