/**
 * SAFE SCALING CALCULATOR
 * =======================
 * 
 * Systematically calculates scaling factors that GUARANTEE no collisions
 * by constraining star sizes based on inner planetary orbits.
 * 
 * PRINCIPLE: Mercury's orbit determines the maximum safe Sol size,
 * then all other scaling derives from that constraint.
 */

import type { CelestialObject } from '../types/orbital-system'
import type { ViewType } from '@lib/types/effects-level'

// SAFETY CONSTANTS - Non-negotiable collision avoidance
const MIN_CLEARANCE_RATIO = 3.0      // Minimum 3x star radius clearance for inner planets
const PREFERRED_CLEARANCE_RATIO = 5.0 // Preferred 5x star radius clearance
const EARTH_RADIUS_KM = 6371
const SOL_RADIUS_KM = 695700
const MERCURY_ORBIT_AU = 0.39

export interface SafeScalingResult {
  orbitScaling: number              // AU to units multiplier
  maxStarSize: number               // Maximum safe star visual size
  earthTargetSize: number           // Earth's target visual size
  constrainedBy: string             // What constraint limited the scaling
  safetyMargin: number              // Actual clearance ratio achieved
  metadata: {
    mercuryOrbitUnits: number
    solMaxSafeSize: number
    earthRatio: number
    solRatio: number
  }
}

/**
 * Calculate safe scaling factors that guarantee no Mercury-Sol collision
 * 
 * ALGORITHM:
 * 1. Start with target Earth size for good planet proportions
 * 2. Calculate what Sol size would be with proportional scaling
 * 3. Check if Mercury orbit provides enough clearance for that Sol size
 * 4. If not, constrain Sol size and adjust Earth/orbit scaling accordingly
 */
export function calculateSafeScaling(
  systemData: CelestialObject[],
  viewType: ViewType,
  targetEarthSize: number = 3.0,
  targetOrbitScaling: number = 50.0
): SafeScalingResult {
  
  // Find Mercury and Sol objects
  const mercuryObject = systemData.find(obj =>
    obj.name?.toLowerCase() === 'mercury' || obj.id?.toLowerCase() === 'mercury'
  )
  const solObject = systemData.find(obj =>
    obj.name?.toLowerCase() === 'sol' || obj.id?.toLowerCase() === 'sol' ||
    obj.classification === 'star'
  )
  
  // Use Mercury's orbit distance to constrain Sol size
  const mercuryOrbitAU = mercuryObject?.orbit?.semi_major_axis || MERCURY_ORBIT_AU
  const mercuryOrbitUnits = mercuryOrbitAU * targetOrbitScaling
  
  // Calculate maximum safe Sol size based on Mercury orbit
  const solMaxSafeSize = mercuryOrbitUnits / (1 + MIN_CLEARANCE_RATIO)
  
  // Calculate what Sol size would be with proportional scaling
  const solRadiusKm = solObject?.properties.radius || SOL_RADIUS_KM
  const earthRadiusKm = EARTH_RADIUS_KM
  const solEarthRatio = solRadiusKm / earthRadiusKm
  const earthRatio = 1.0  // Earth is our reference
  
  // What would Sol be with direct proportional scaling?
  const proportionalSolSize = targetEarthSize * solEarthRatio
  
  let finalEarthSize: number
  let finalMaxStarSize: number
  let finalOrbitScaling: number
  let constrainedBy: string
  
  if (proportionalSolSize <= solMaxSafeSize) {
    // UNCONSTRAINED: Proportional scaling is safe
    finalEarthSize = targetEarthSize
    finalMaxStarSize = proportionalSolSize
    finalOrbitScaling = targetOrbitScaling
    constrainedBy = 'none'
  } else {
    // CONSTRAINED: Sol would be too big, need to adjust scaling
    finalMaxStarSize = solMaxSafeSize
    
    // Scale down Earth proportionally to maintain ratios
    const scalingRatio = finalMaxStarSize / proportionalSolSize
    finalEarthSize = targetEarthSize * scalingRatio
    
    // Keep orbit scaling as is - the issue was star size, not orbit spacing
    finalOrbitScaling = targetOrbitScaling
    constrainedBy = 'mercury_orbit'
  }
  
  // Calculate actual safety margin achieved
  const actualMercuryOrbit = mercuryOrbitAU * finalOrbitScaling
  const actualClearance = actualMercuryOrbit - finalMaxStarSize
  const safetyMargin = actualClearance / finalMaxStarSize
  
  return {
    orbitScaling: finalOrbitScaling,
    maxStarSize: finalMaxStarSize,
    earthTargetSize: finalEarthSize,
    constrainedBy,
    safetyMargin,
    metadata: {
      mercuryOrbitUnits: actualMercuryOrbit,
      solMaxSafeSize,
      earthRatio,
      solRatio: solEarthRatio
    }
  }
}

/**
 * Get safe scaling configuration for each view mode
 */
export function getSafeScalingForViewMode(viewType: ViewType): {
  orbitScaling: number
  maxStarSize: number
  earthTargetSize: number
  maxVisualSize: number
} {
  // Standard system for scaling calculations
  const standardSystem: CelestialObject[] = [
    {
      id: 'sol',
      name: 'Sol',
      classification: 'star',
      geometry_type: 'star',
      properties: { radius: SOL_RADIUS_KM },
      position: [0, 0, 0]
    },
    {
      id: 'mercury',
      name: 'Mercury',
      classification: 'planet',
      geometry_type: 'terrestrial',
      properties: { radius: 2439 },
      orbit: { parent: 'sol', semi_major_axis: MERCURY_ORBIT_AU, eccentricity: 0, inclination: 0, orbital_period: 88 }
    },
    {
      id: 'earth',
      name: 'Earth',
      classification: 'planet',
      geometry_type: 'terrestrial',
      properties: { radius: EARTH_RADIUS_KM },
      orbit: { parent: 'sol', semi_major_axis: 1.0, eccentricity: 0, inclination: 0, orbital_period: 365 }
    }
  ]
  
  // Different target parameters for each view mode
  const viewModeTargets = {
    scientific: { earthSize: 3.0, orbitScaling: 80.0 },
    explorational: { earthSize: 2.5, orbitScaling: 50.0 },
    navigational: { earthSize: 2.0, orbitScaling: 40.0 },
    profile: { earthSize: 1.5, orbitScaling: 40.0 }
  }
  
  const targets = viewModeTargets[viewType] || viewModeTargets.explorational
  
  const safeScaling = calculateSafeScaling(
    standardSystem,
    viewType,
    targets.earthSize,
    targets.orbitScaling
  )
  
  return {
    orbitScaling: safeScaling.orbitScaling,
    maxStarSize: safeScaling.maxStarSize,
    earthTargetSize: safeScaling.earthTargetSize,
    maxVisualSize: Math.max(safeScaling.maxStarSize * 1.2, 40) // Allow some headroom
  }
}

/**
 * Validate that a scaling configuration is safe
 */
export function validateSafeScaling(
  systemData: CelestialObject[],
  orbitScaling: number,
  maxStarSize: number
): {
  isSafe: boolean
  issues: string[]
  recommendations: string[]
} {
  const issues: string[] = []
  const recommendations: string[] = []
  
  // Check Mercury-Sol clearance
  const mercuryObject = systemData.find(obj =>
    obj.name?.toLowerCase() === 'mercury' || obj.id?.toLowerCase() === 'mercury'
  )
  
  if (mercuryObject?.orbit?.semi_major_axis) {
    const mercuryOrbit = mercuryObject.orbit.semi_major_axis * orbitScaling
    const clearance = mercuryOrbit - maxStarSize
    const clearanceRatio = clearance / maxStarSize
    
    if (clearance <= 0) {
      issues.push(`Mercury orbit (${mercuryOrbit.toFixed(1)}) is inside Sol (${maxStarSize.toFixed(1)})`)
      recommendations.push('Increase orbitScaling or decrease maxStarSize')
    } else if (clearanceRatio < MIN_CLEARANCE_RATIO) {
      issues.push(`Mercury clearance (${clearanceRatio.toFixed(1)}x) below minimum (${MIN_CLEARANCE_RATIO}x)`)
      recommendations.push('Increase orbit scaling or reduce star size scaling')
    }
  }
  
  return {
    isSafe: issues.length === 0,
    issues,
    recommendations
  }
}