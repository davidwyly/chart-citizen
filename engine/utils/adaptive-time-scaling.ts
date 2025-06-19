/**
 * Adaptive time scaling utility for celestial objects
 * 
 * Automatically adjusts time multiplier based on orbital periods to ensure
 * all objects have visible motion regardless of their actual speed.
 */

import { CelestialObject, isOrbitData } from "@/engine/types/orbital-system"

export interface AdaptiveTimeSettings {
  fastThreshold: number    // Objects with periods below this are considered fast (days)
  mediumThreshold: number  // Objects with periods below this are considered medium (days)
  
  fastMultiplier: number   // Speed multiplier for fast objects (moons)
  mediumMultiplier: number // Speed multiplier for medium objects (inner planets)
  slowMultiplier: number   // Speed multiplier for slow objects (outer planets)
}

export const DEFAULT_ADAPTIVE_SETTINGS: AdaptiveTimeSettings = {
  fastThreshold: 30,      // Less than 30 days = fast (moons)
  mediumThreshold: 365,   // Less than 1 year = medium (inner planets)
  
  fastMultiplier: 1.0,    // Normal speed for moons
  mediumMultiplier: 5.0,  // 5x speed for inner planets
  slowMultiplier: 20.0,   // 20x speed for outer planets
}

export type ObjectCategory = 'fast' | 'medium' | 'slow'

export interface AdaptiveTimeResult {
  multiplier: number
  category: ObjectCategory
  isAdaptive: boolean
  reason: string
}

/**
 * Calculate adaptive time multiplier for a celestial object
 */
export function calculateAdaptiveTimeMultiplier(
  object: CelestialObject,
  settings: AdaptiveTimeSettings = DEFAULT_ADAPTIVE_SETTINGS
): AdaptiveTimeResult {
  // Only apply adaptive scaling to objects with orbits
  if (!object.orbit || !isOrbitData(object.orbit) || !object.orbit.orbital_period) {
    return {
      multiplier: 1.0,
      category: 'fast',
      isAdaptive: false,
      reason: 'No orbital data available'
    }
  }

  const period = object.orbit.orbital_period

  // Determine category and multiplier
  let category: ObjectCategory
  let multiplier: number

  if (period <= settings.fastThreshold) {
    category = 'fast'
    multiplier = settings.fastMultiplier
  } else if (period <= settings.mediumThreshold) {
    category = 'medium'
    multiplier = settings.mediumMultiplier
  } else {
    category = 'slow'
    multiplier = settings.slowMultiplier
  }

  return {
    multiplier,
    category,
    isAdaptive: true,
    reason: `${period.toFixed(1)} day period → ${category} object`
  }
}

/**
 * Format orbital period for display
 */
export function formatOrbitalPeriod(periodDays: number): string {
  if (periodDays < 1) {
    const hours = periodDays * 24
    return `${hours.toFixed(1)}h`
  } else if (periodDays < 30) {
    return `${periodDays.toFixed(1)}d`
  } else if (periodDays < 365) {
    const months = periodDays / 30.44
    return `${months.toFixed(1)}m`
  } else {
    const years = periodDays / 365.25
    return `${years.toFixed(1)}y`
  }
}